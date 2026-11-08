// Histórico de treinos feitos (modelo puro, sem Expo/React). Cada execução vira um registro:
// concluída até o fim, ou encerrada antes (com o tempo que de fato foi cronometrado).
import { inteiro } from '../treinos/util';

export interface Registro {
  id: string;
  /** Id do treino salvo; o nome é copiado porque o treino pode ser editado ou excluído depois. */
  treinoId: string;
  nome: string;
  /** Instante do fim da execução (ms desde 1970). */
  emMs: number;
  /** Tempo cronometrado (sem pausas). */
  duracaoMs: number;
  concluido: boolean;
}

export const LIMITE_REGISTROS = 1000;
/** Execuções encerradas antes disso não valem um registro (toque sem querer, teste de som). */
export const MINIMO_PARCIAL_MS = 10_000;

export function normalizarRegistro(bruto: unknown): Registro | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const r = bruto as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;
  if (typeof r.emMs !== 'number' || !Number.isFinite(r.emMs)) return null;
  return {
    id: r.id,
    treinoId: typeof r.treinoId === 'string' ? r.treinoId : '',
    nome: typeof r.nome === 'string' ? r.nome.slice(0, 80) : '',
    emMs: r.emMs,
    duracaoMs: inteiro(r.duracaoMs, 0, 7 * 24 * 3600 * 1000, 0),
    concluido: r.concluido === true,
  };
}

export function normalizarHistorico(bruto: unknown): Registro[] {
  if (!Array.isArray(bruto)) return [];
  return bruto.map(normalizarRegistro).filter((r): r is Registro => r !== null);
}

/** Mais recente primeiro; descarta os mais antigos acima do limite. */
export function comRegistro(lista: Registro[], novo: Registro): Registro[] {
  return [novo, ...lista.filter((r) => r.id !== novo.id)].slice(0, LIMITE_REGISTROS);
}

export function semRegistros(lista: Registro[], ids: ReadonlySet<string>): Registro[] {
  return lista.filter((r) => !ids.has(r.id));
}

export function vale(duracaoMs: number, concluido: boolean): boolean {
  return concluido || duracaoMs >= MINIMO_PARCIAL_MS;
}

function chaveDoDia(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export interface Dia {
  chave: string;
  /** Instante do registro mais recente do dia (serve para formatar o cabeçalho). */
  emMs: number;
  totalMs: number;
  registros: Registro[];
}

/** Agrupa por dia local, dias e registros do mais recente para o mais antigo. */
export function agruparPorDia(lista: Registro[]): Dia[] {
  const ordenados = [...lista].sort((a, b) => b.emMs - a.emMs);
  const dias: Dia[] = [];
  for (const r of ordenados) {
    const chave = chaveDoDia(r.emMs);
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.chave === chave) {
      ultimo.registros.push(r);
      ultimo.totalMs += r.duracaoMs;
    } else {
      dias.push({ chave, emMs: r.emMs, totalMs: r.duracaoMs, registros: [r] });
    }
  }
  return dias;
}

/** Soma dos últimos 7 dias (hoje e os 6 anteriores, em dias locais). */
export function resumoSemana(lista: Registro[], agora: number) {
  const hoje = new Date(agora);
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6).getTime();
  const recentes = lista.filter((r) => r.emMs >= inicio && r.emMs <= agora);
  return {
    treinos: recentes.length,
    totalMs: recentes.reduce((soma, r) => soma + r.duracaoMs, 0),
  };
}
