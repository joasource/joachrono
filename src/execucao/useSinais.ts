import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect } from 'react';

import { GANHO_DO_VOLUME } from '../configuracoes/modelo';
import { obterConfiguracoes } from '../configuracoes/store';
import { somNativo } from './somNativo';
import { vibrar } from './vibracao';

const SOM_CONTAGEM = require('../../assets/sons/contagem.wav');
const SOM_TROCA = require('../../assets/sons/troca.wav');
const SOM_FIM = require('../../assets/sons/fim.wav');
const SOM_TROCA_BIPE = require('../../assets/sons/troca-bipe.wav');
const SOM_FIM_BIPE = require('../../assets/sons/fim-bipe.wav');

/** Som + vibração da execução. Falhas de áudio/vibração nunca podem derrubar o cronômetro. */
export function useSinais() {
  const contagem = useAudioPlayer(SOM_CONTAGEM);
  const troca = useAudioPlayer(SOM_TROCA);
  const fim = useAudioPlayer(SOM_FIM);
  const trocaBipe = useAudioPlayer(SOM_TROCA_BIPE);
  const fimBipe = useAudioPlayer(SOM_FIM_BIPE);

  useEffect(() => {
    // Sons curtos: tocam mesmo no modo silencioso do iPhone e sem calar a música da pessoa.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(
      () => {},
    );
  }, []);

  const tocar = (player: {
    seekTo: (s: number) => Promise<void>;
    play: () => void;
    volume: number;
  }) => {
    const c = obterConfiguracoes();
    if (somNativo.ativo || !c.som) return;
    try {
      player.volume = GANHO_DO_VOLUME[c.volume];
      void player.seekTo(0);
      player.play();
    } catch {}
  };

  const sinalContagem = useCallback(() => {
    tocar(contagem);
    const c = obterConfiguracoes();
    if (c.vibracao) vibrar('contagem', c.intensidadeVibracao);
  }, [contagem]);

  const sinalTroca = useCallback(() => {
    const c = obterConfiguracoes();
    tocar(c.tipoSinal === 'bipe' ? trocaBipe : troca);
    if (c.vibracao) vibrar('troca', c.intensidadeVibracao);
  }, [troca, trocaBipe]);

  const sinalFim = useCallback(() => {
    const c = obterConfiguracoes();
    tocar(c.tipoSinal === 'bipe' ? fimBipe : fim);
    if (c.vibracao) vibrar('fim', c.intensidadeVibracao);
  }, [fim, fimBipe]);

  return { sinalContagem, sinalTroca, sinalFim };
}
