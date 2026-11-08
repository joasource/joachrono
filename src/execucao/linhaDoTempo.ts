import type { TipoSinal } from '../configuracoes/modelo';
import { proximasTransicoes, type Estado } from '../motor';

// Com a tela bloqueada o JS é suspenso, mas o player nativo continua. Então geramos um áudio com o
// treino inteiro (silêncio + bipes nos instantes certos) e deixamos o player tocá-lo sozinho.
// WAV mono, 8 bits sem sinal, 8 kHz: ~8 KB/s (1 h ≈ 29 MB).
export const TAXA_HZ = 8000;
export const LIMITE_MS = 60 * 60 * 1000;
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

function bipe(dados: Uint8Array, inicioMs: number, hz: number, duracaoMs: number, ganho: number) {
  const ini = Math.round((inicioMs * TAXA_HZ) / 1000);
  const n = Math.round((duracaoMs * TAXA_HZ) / 1000);
  const rampa = Math.max(1, Math.round(0.005 * TAXA_HZ));
  for (let i = 0; i < n && ini + i < dados.length; i++) {
    if (ini + i < 0) continue;
    const env = Math.min(1, i / rampa, (n - i) / rampa);
    somar(dados, ini + i, 120 * ganho * env * Math.sin((2 * Math.PI * hz * i) / TAXA_HZ));
  }
}

/** Soma ao que já está no arquivo (sinais próximos se misturam em vez de se cortarem). */
function somar(dados: Uint8Array, pos: number, delta: number) {
  dados[pos] = Math.max(0, Math.min(255, dados[pos] + Math.round(delta)));
}

// Gongo agudo: parciais inarmônicos com decaimentos diferentes (os mais agudos somem primeiro) e um
// parcial levemente desafinado que dá o "tremido" característico.
const GONGO = [
  { hz: 520, amp: 1, tau: 1.0 },
  { hz: 524, amp: 0.5, tau: 0.9 },
  { hz: 830, amp: 0.7, tau: 0.8 },
  { hz: 1430, amp: 0.5, tau: 0.55 },
  { hz: 2150, amp: 0.3, tau: 0.35 },
];
const GONGO_MS = 2200;

function gongo(dados: Uint8Array, inicioMs: number, ganho: number) {
  const ini = Math.round((inicioMs * TAXA_HZ) / 1000);
  const n = Math.round((GONGO_MS * TAXA_HZ) / 1000);
  const ataque = Math.round(0.003 * TAXA_HZ);
  const soma = GONGO.reduce((t, p) => t + p.amp, 0);
  for (let i = 0; i < n && ini + i < dados.length; i++) {
    if (ini + i < 0) continue;
    const t = i / TAXA_HZ;
    let v = 0;
    for (const p of GONGO) v += p.amp * Math.exp(-t / p.tau) * Math.sin(2 * Math.PI * p.hz * t);
    somar(dados, ini + i, (125 * ganho * v * Math.min(1, i / ataque)) / soma);
  }
}

// Bipe (alternativa ao gongo): troca = 1 bipe longo, fim = 3 bipes curtos. Mesmos números dos
// arquivos `assets/sons/troca-bipe.wav` e `fim-bipe.wav`, que tocam quando é o JS que soa.
export const BIPE_HZ = 1320;
export const BIPE_TROCA = [{ inicioMs: 0, duracaoMs: 500 }];
export const BIPE_FIM = [
  { inicioMs: 0, duracaoMs: 250 },
  { inicioMs: 400, duracaoMs: 250 },
  { inicioMs: 800, duracaoMs: 250 },
];

function sinalDeTroca(
  dados: Uint8Array,
  inicioMs: number,
  fim: boolean,
  tipo: TipoSinal,
  ganho: number,
) {
  if (tipo === 'bipe') {
    for (const b of fim ? BIPE_FIM : BIPE_TROCA)
      bipe(dados, inicioMs + b.inicioMs, BIPE_HZ, b.duracaoMs, ganho);
    return;
  }
  // Gongo: uma batida na troca; duas no fim do treino.
  gongo(dados, inicioMs, ganho);
  if (fim) gongo(dados, inicioMs + 900, ganho);
}

/**
 * Áudio com os sinais de todas as trocas por tempo a partir de `agora` (até `LIMITE_MS` ou a
 * primeira etapa de fim manual). O instante 0 do arquivo é `agora`; `instantes` são os horários
 * absolutos das trocas cobertas. `null` se não houver nada a tocar.
 */
export function gerarLinhaDoTempoWav(
  estado: Estado,
  agora: number,
  {
    ganho = 1,
    contagemSegundos = 3,
    tipoSinal = 'gongo',
  }: { ganho?: number; contagemSegundos?: number; tipoSinal?: TipoSinal } = {},
): { wav: Uint8Array; instantes: number[] } | null {
  const transicoes = proximasTransicoes(estado, agora, 5000).filter(
    (t) => t.em - agora <= LIMITE_MS,
  );
  if (transicoes.length === 0) return null;

  const fimMs = transicoes[transicoes.length - 1].em - agora + 3000;
  const amostras = Math.ceil((fimMs * TAXA_HZ) / 1000);
  const arquivo = new Uint8Array(44 + amostras);
  arquivo.set(cabecalho(amostras), 0);
  const dados = arquivo.subarray(44);
  dados.fill(SILENCIO);

  let anteriorMs = -Infinity;
  for (const t of transicoes) {
    const alvo = t.em - agora;
    for (let s = contagemSegundos; s >= 1; s--) {
      const inicio = alvo - s * 1000;
      // Não encosta no sinal da troca anterior nem começa antes de agora.
      if (inicio >= 0 && inicio >= anteriorMs + 500) bipe(dados, inicio, 880, 120, ganho);
    }
    sinalDeTroca(dados, alvo, t.evento.tipo === 'fim', tipoSinal, ganho);
    anteriorMs = alvo;
  }
  return { wav: arquivo, instantes: transicoes.map((t) => t.em) };
}
