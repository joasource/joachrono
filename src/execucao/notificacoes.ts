import * as Notifications from 'expo-notifications';
import {
  AndroidAudioUsage,
  AndroidImportance,
  AndroidNotificationVisibility,
} from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { proximasTransicoes, type Estado } from '../motor';
import { obterConfiguracoes } from '../configuracoes/store';
import { t } from '../i18n/t';
import { APARENCIA } from './aparencia';

// Notificações locais agendadas para cada troca de etapa: com a tela bloqueada ou o app em segundo
// plano o JS pode ser suspenso, mas o sistema entrega o alerta na hora certa. O iOS guarda no máximo
// 64 agendadas, então agendamos só as próximas e reagendamos a cada mudança de estado.
// Canais Android são imutáveis depois de criados: ao mudar som/importância, troque o id (v2...).
const CANAIS_ANTIGOS = ['etapas-v2', 'etapas-v4', 'etapas-v5'];

/**
 * A notificação só toca o som do sistema quando o áudio nativo da linha do tempo não está
 * cobrindo os sinais (senão tocaria em cima do gongo). Som e vibração de um canal Android não mudam
 * depois de criado, então cada combinação tem o seu id.
 */
function configDoCanal() {
  const c = obterConfiguracoes();
  const som = c.som && !c.sinaisBloqueado;
  return { som, vibracao: c.vibracao, id: `etapas-v6-${som ? 's' : 'm'}${c.vibracao ? 'v' : 'n'}` };
}
const MAX_AGENDADAS = 30;

Notifications.setNotificationHandler({
  // Com o app aberto a própria tela já toca som e vibra; não duplicar.
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function garantirCanal() {
  if (Platform.OS !== 'android') return;
  for (const id of CANAIS_ANTIGOS)
    await Notifications.deleteNotificationChannelAsync(id).catch(() => {});
  const { id, som, vibracao } = configDoCanal();
  await Notifications.setNotificationChannelAsync(id, {
    name: t('aviso.canal'),
    importance: AndroidImportance.HIGH,
    // Sem `sound` o módulo usa o som padrão do sistema ('default' seria lido como um arquivo
    // inexistente e deixaria o canal mudo). `null` = mudo.
    ...(som ? { audioAttributes: { usage: AndroidAudioUsage.ALARM } } : { sound: null }),
    enableVibrate: vibracao,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    ...(vibracao ? { vibrationPattern: [0, 250, 150, 250] } : {}),
  });
}

/** Pede permissão (uma vez, ao iniciar o treino). Devolve se pode notificar. */
export async function pedirPermissaoNotificacoes(): Promise<boolean> {
  try {
    await garantirCanal();
    const atual = await Notifications.getPermissionsAsync();
    const ok = atual.granted
      ? true
      : atual.canAskAgain && (await Notifications.requestPermissionsAsync()).granted;
    if (ok) await pedirAlarmeExato();
    return ok;
  } catch {
    return false;
  }
}

/** Android 12+: sem alarme exato o sistema atrasa as notificações (Doze, tela bloqueada). */
async function pedirAlarmeExato() {
  if (Platform.OS !== 'android') return;
  try {
    const atual = await Notifications.getExactAlarmPermissionsAsync();
    if (!atual.granted && atual.canAskAgain)
      await Notifications.requestExactAlarmPermissionsAsync();
  } catch {}
}

async function cancelarTodas() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

async function agendar(estado: Estado) {
  await cancelarTodas();
  const agora = Date.now();
  for (const tr of proximasTransicoes(estado, agora, MAX_AGENDADAS)) {
    const titulo = tr.passo
      ? (tr.passo.nome ?? APARENCIA[tr.passo.categoria].rotulo)
      : t('aviso.concluido');
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: titulo,
          body: tr.passo ? t('aviso.proximaEtapa') : t('aviso.bomTrabalho'),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(tr.em),
          channelId: configDoCanal().id,
          delivery: 'alarmClock',
        },
      });
    } catch {}
  }
}

/** Mantém as notificações agendadas em sincronia com o cronômetro; cancela ao pausar/sair. */
export function useNotificacoesDaExecucao(estado: Estado, permitido: boolean) {
  const versao = useRef(0);
  const { status, indice, retomadoEm } = estado;

  useEffect(() => {
    const minha = ++versao.current;
    if (!permitido || status !== 'contando') {
      void cancelarTodas();
      return;
    }
    void (async () => {
      if (minha !== versao.current) return;
      await agendar(estado);
    })();
    // Só reagenda quando a linha do tempo muda (não a cada tick).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, indice, retomadoEm, permitido]);

  useEffect(() => () => void cancelarTodas(), []);
}
