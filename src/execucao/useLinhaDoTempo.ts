import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { GANHO_DO_VOLUME } from '../configuracoes/modelo';
import { obterConfiguracoes, useConfiguracoes } from '../configuracoes/store';
import { t } from '../i18n/t';
import type { Estado } from '../motor';
import { gerarLinhaDoTempoWav } from './linhaDoTempo';
import { somNativo } from './somNativo';

/**
 * Em primeiro plano o áudio mistura com a música de outros apps; só ao ir para segundo plano (tela
 * bloqueada) vira mídia exclusiva (`doNotMix`), requisito do controle na tela de bloqueio.
 */
async function aplicarModo(p: AudioPlayer, segundoPlano: boolean) {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: segundoPlano ? 'doNotMix' : 'mixWithOthers',
  });
  if (segundoPlano) {
    p.setActiveForLockScreen(true, { title: 'Joachrono', artist: t('aviso.emAndamento') });
  } else {
    p.setActiveForLockScreen(false);
  }
}

/**
 * Com a tela bloqueada o JS é suspenso e os sinais só tocariam ao desbloquear. Enquanto o treino
 * conta, geramos um áudio com todos os sinais e o tocamos pelo player nativo, registrado como mídia
 * (no Android vira um serviço em primeiro plano). Regenera a cada mudança da linha do tempo
 * (iniciar, retomar, pular etapa). `somNativo.ativo` (somNativo.ts) fica true enquanto esse áudio cobre os sinais,
 * para o JS não tocar em dobro com a tela ligada.
 */
export function useLinhaDoTempo(estado: Estado) {
  const player = useRef<AudioPlayer | null>(null);
  const versao = useRef(0);
  const alternar = useRef(0);
  const cobertas = useRef<number[]>([]);
  const { status, indice, retomadoEm, acumuladoMs } = estado;
  const config = useConfiguracoes();
  const habilitado = config.som && config.sinaisBloqueado;
  const estadoRef = useRef(estado);
  useEffect(() => {
    estadoRef.current = estado;
  });

  useEffect(() => {
    const minha = ++versao.current;
    const parar = () => {
      somNativo.ativo = false;
      try {
        player.current?.pause();
      } catch {}
    };
    // Fim natural: deixa os bipes finais terminarem em vez de calar o player.
    if (status === 'concluido') return;
    if (status !== 'contando' || !habilitado) {
      cobertas.current = [];
      parar();
      return;
    }
    // Troca natural de etapa já coberta pelo áudio em andamento: não regenera (cortaria o bipe).
    const inicioDaEtapa = (retomadoEm ?? 0) - acumuladoMs;
    if (somNativo.ativo && cobertas.current.some((em) => Math.abs(em - inicioDaEtapa) < 2)) return;
    void (async () => {
      try {
        const t0 = Date.now();
        const c = obterConfiguracoes();
        const linha = gerarLinhaDoTempoWav(estadoRef.current, t0, {
          ganho: GANHO_DO_VOLUME[c.volume],
          contagemSegundos: c.contagemSegundos,
        });
        if (!linha) return parar();
        const { wav, instantes } = linha;
        const arquivo = new File(Paths.cache, `linha-do-tempo-${alternar.current++ % 2}.wav`);
        if (arquivo.exists) arquivo.delete();
        arquivo.create();
        await arquivo.write(wav);
        if (minha !== versao.current) return;

        const p = (player.current ??= createAudioPlayer(arquivo.uri));
        await aplicarModo(p, AppState.currentState === 'background');
        p.pause();
        p.replace(arquivo.uri);
        const sub = p.addListener('playbackStatusUpdate', (s) => {
          if (!s.isLoaded) return;
          sub.remove();
          if (minha !== versao.current) return;
          // Compensa o tempo gasto gerando/gravando/carregando.
          void p.seekTo((Date.now() - t0) / 1000).then(() => {
            if (minha !== versao.current) return;
            p.play();
            cobertas.current = instantes;
            somNativo.ativo = true;
          });
        });
      } catch {
        parar();
      }
    })();
    // Só regenera quando a linha do tempo muda (não a cada tick).
  }, [status, indice, retomadoEm, acumuladoMs, habilitado]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (novo) => {
      const p = player.current;
      if (!p || !somNativo.ativo) return;
      void aplicarModo(p, novo === 'background')
        .then(() => {
          // Trocar a sessão de áudio pode interromper a reprodução.
          if (somNativo.ativo && !p.playing) p.play();
        })
        .catch(() => {});
    });
    return () => sub.remove();
  }, []);

  useEffect(
    () => () => {
      versao.current++;
      somNativo.ativo = false;
      try {
        player.current?.pause();
        player.current?.setActiveForLockScreen(false);
        player.current?.remove();
      } catch {}
      player.current = null;
      void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(
        () => {},
      );
    },
    [],
  );
}
