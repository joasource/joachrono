// Cronômetro livre: conta para cima, sem treino definido, com voltas. Mesmo princípio da máquina
// principal — funções puras e tempo por diferença de timestamps.

export interface EstadoLivre {
  status: 'parado' | 'contando' | 'pausado';
  acumuladoMs: number;
  retomadoEm: number | null;
  /** Tempo total (ms) de cada toque em "volta", em ordem. */
  marcas: number[];
}

export const livreInicial = (): EstadoLivre => ({
  status: 'parado',
  acumuladoMs: 0,
  retomadoEm: null,
  marcas: [],
});

export function livreDecorridoMs(e: EstadoLivre, agora: number): number {
  const corrente = e.status === 'contando' && e.retomadoEm !== null ? agora - e.retomadoEm : 0;
  return e.acumuladoMs + Math.max(0, corrente);
}

export function livreIniciar(e: EstadoLivre, agora: number): EstadoLivre {
  if (e.status === 'contando') return e;
  return { ...e, status: 'contando', retomadoEm: agora };
}

export function livrePausar(e: EstadoLivre, agora: number): EstadoLivre {
  if (e.status !== 'contando') return e;
  return { ...e, status: 'pausado', acumuladoMs: livreDecorridoMs(e, agora), retomadoEm: null };
}

export function livreVolta(e: EstadoLivre, agora: number): EstadoLivre {
  if (e.status !== 'contando') return e;
  return { ...e, marcas: [...e.marcas, livreDecorridoMs(e, agora)] };
}

/** Duração de cada volta (diferença entre marcas consecutivas). */
export function livreDuracoesDasVoltas(e: EstadoLivre): number[] {
  return e.marcas.map((m, i) => m - (i === 0 ? 0 : e.marcas[i - 1]));
}
