import { compilar, criar, iniciar, treinoDeRounds } from '../../motor';
import { TAXA_HZ, gerarLinhaDoTempoWav } from '../linhaDoTempo';

function estadoIniciado(agora: number) {
  const passos = compilar(
    treinoDeRounds('t', 'T', {
      rounds: 2,
      segundosRound: 10,
      segundosDescanso: 5,
      segundosAquecimento: 0,
      segundosDesaquecimento: 0,
    }),
  );
  return iniciar(criar(passos), agora);
}

describe('gerarLinhaDoTempoWav', () => {
  it('gera um WAV 8 bits mono cobrindo o treino até o último sinal', () => {
    const r = gerarLinhaDoTempoWav(estadoIniciado(1000), 1000)!;
    const v = new DataView(r.wav.buffer);
    expect(String.fromCharCode(...r.wav.subarray(0, 4))).toBe('RIFF');
    expect(v.getUint32(24, true)).toBe(TAXA_HZ);
    expect(v.getUint16(34, true)).toBe(8);
    expect(v.getUint32(40, true)).toBe(r.wav.length - 44);
    // 10 s + 5 s + 10 s de treino + 3 s de folga (cauda do gongo final)
    expect(r.wav.length - 44).toBe(28 * TAXA_HZ);
    expect(r.instantes).toEqual([11000, 16000, 26000]);
  });

  it('põe som nos instantes das trocas e silêncio no meio', () => {
    const r = gerarLinhaDoTempoWav(estadoIniciado(0), 0)!;
    const dados = r.wav.subarray(44);
    const ativo = (ms: number) => {
      const i = Math.round((ms * TAXA_HZ) / 1000);
      return dados.subarray(i, i + 200).some((b) => b !== 128);
    };
    expect(ativo(10100)).toBe(true); // troca
    expect(ativo(7100)).toBe(true); // contagem regressiva (3 s antes)
    expect(ativo(5000)).toBe(false);
  });

  it('devolve null quando a etapa atual é manual', () => {
    const passos = compilar({
      id: 'm',
      nome: 'M',
      itens: [{ tipo: 'etapa', id: 'a', categoria: 'livre', fim: { tipo: 'manual' } }],
    });
    expect(gerarLinhaDoTempoWav(iniciar(criar(passos), 0), 0)).toBeNull();
  });
});
