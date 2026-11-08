import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect } from 'react';

import { somNativo } from './somNativo';

const SOM_CONTAGEM = require('../../assets/sons/contagem.wav');
const SOM_TROCA = require('../../assets/sons/troca.wav');
const SOM_FIM = require('../../assets/sons/fim.wav');

/** Som + vibração da execução. Falhas de áudio/vibração nunca podem derrubar o cronômetro. */
export function useSinais() {
  const contagem = useAudioPlayer(SOM_CONTAGEM);
  const troca = useAudioPlayer(SOM_TROCA);
  const fim = useAudioPlayer(SOM_FIM);

  useEffect(() => {
    // Sons curtos: tocam mesmo no modo silencioso do iPhone e sem calar a música da pessoa.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(
      () => {},
    );
  }, []);

  const tocar = (player: { seekTo: (s: number) => Promise<void>; play: () => void }) => {
    if (somNativo.ativo) return;
    try {
      void player.seekTo(0);
      player.play();
    } catch {}
  };

  const sinalContagem = useCallback(() => {
    tocar(contagem);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [contagem]);

  const sinalTroca = useCallback(() => {
    tocar(troca);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [troca]);

  const sinalFim = useCallback(() => {
    tocar(fim);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [fim]);

  return { sinalContagem, sinalTroca, sinalFim };
}
