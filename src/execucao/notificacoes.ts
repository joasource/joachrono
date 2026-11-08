import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { proximasTransicoes, type Estado } from '../motor';
import { APARENCIA } from './aparencia';

// Notificações locais agendadas para cada troca de etapa: com a tela bloqueada ou o app em segundo
// plano o JS pode ser suspenso, mas o sistema entrega o alerta na hora certa. O iOS guarda no máximo
// 64 agendadas, então agendamos só as próximas e reagendamos a cada mudança de estado.
// Canais Android são imutáveis depois de criados: ao mudar som/importância, troque o id (v2...).
const CANAL = 'etapas-v2';
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
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Trocas de etapa',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    vibrationPattern: [0, 250, 150, 250],
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
  for (const t of proximasTransicoes(estado, agora, MAX_AGENDADAS)) {
    const titulo = t.passo
      ? (t.passo.nome ?? APARENCIA[t.passo.categoria].rotulo)
      : 'Treino concluído';
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: titulo, body: t.passo ? 'Próxima etapa' : 'Bom trabalho!' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(t.em),
          channelId: CANAL,
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
