import { proximasTransicoes, type Estado } from '../motor';

// Com a tela bloqueada o JS é suspenso, mas o player nativo continua. Então geramos um áudio com o
// treino inteiro (silêncio + bipes nos instantes certos) e deixamos o player tocá-lo sozinho.
// WAV mono, 8 bits sem sinal, 4 kHz: ~4 KB/s (1 h ≈ 14 MB). Os bipes ficam abaixo de 2 kHz.
export const TAXA_HZ = 4000;
export const LIMITE_MS = 2 * 60 * 60 * 1000;
const CONTAGEM_REGRESSIVA_S = 3;
const SILENCIO = 128;

function escrever32(v: DataView, pos: number, valor: number) {
  v.setUint32(pos, valor, true);
}

function cabecalho(bytesDeDados: number): Uint8Array {
  const buf = new Uint8Array(44);
  const v = new DataView(buf.buffer);
  buf.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  escrever32(v, 4, 36 + bytesDeDados);
  buf.set([0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20], 8); // WAVEfmt
  escrever32(v, 16, 16);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  escrever32(v, 24, TAXA_HZ);
  escrever32(v, 28, TAXA_HZ); // bytes/s (8 bits, mono)
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  buf.set([0x64, 0x61, 0x74, 0x61], 36); // data
  escrever32(v, 40, bytesDeDados);
  return buf;
}

function bipe(dados: Uint8Array, inicioMs: number, hz: number, duracaoMs: number) {
  const ini = Math.round((inicioMs * TAXA_HZ) / 1000);
  const n = Math.round((duracaoMs * TAXA_HZ) / 1000);
  const rampa = Math.max(1, Math.round(0.005 * TAXA_HZ));
  for (let i = 0; i < n && ini + i < dados.length; i++) {
    if (ini + i < 0) continue;
    const env = Math.min(1, i / rampa, (n - i) / rampa);
    dados[ini + i] = SILENCIO + Math.round(120 * env * Math.sin((2 * Math.PI * hz * i) / TAXA_HZ));
  }
}

/**
 * Áudio com os sinais de todas as trocas por tempo a partir de `agora` (até `LIMITE_MS` ou a
 * primeira etapa de fim manual). O instante 0 do arquivo é `agora`; `instantes` são os horários
 * absolutos das trocas cobertas. `null` se não houver nada a tocar.
 */
export function gerarLinhaDoTempoWav(
  estado: Estado,
  agora: number,
): { wav: Uint8Array; instantes: number[] } | null {
  const transicoes = proximasTransicoes(estado, agora, 5000).filter(
    (t) => t.em - agora <= LIMITE_MS,
  );
  if (transicoes.length === 0) return null;

  const fimMs = transicoes[transicoes.length - 1].em - agora + 1000;
  const amostras = Math.ceil((fimMs * TAXA_HZ) / 1000);
  const arquivo = new Uint8Array(44 + amostras);
  arquivo.set(cabecalho(amostras), 0);
  const dados = arquivo.subarray(44);
  dados.fill(SILENCIO);

  let anteriorMs = -Infinity;
  for (const t of transicoes) {
    const alvo = t.em - agora;
    for (let s = CONTAGEM_REGRESSIVA_S; s >= 1; s--) {
      const inicio = alvo - s * 1000;
      // Não encosta no sinal da troca anterior nem começa antes de agora.
      if (inicio >= 0 && inicio >= anteriorMs + 500) bipe(dados, inicio, 880, 120);
    }
    if (t.evento.tipo === 'fim') {
      for (let i = 0; i < 3; i++) bipe(dados, alvo + i * 300, 1500, 180);
    } else {
      bipe(dados, alvo, 1200, 450);
    }
    anteriorMs = alvo;
  }
  return { wav: arquivo, instantes: transicoes.map((t) => t.em) };
}
