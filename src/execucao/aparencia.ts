import type { CategoriaEtapa } from '../motor';

/** Cor de fundo e rótulo de cada categoria de etapa (a tela inteira muda de cor a cada troca). */
export const APARENCIA: Record<CategoriaEtapa, { fundo: string; rotulo: string }> = {
  aquecer: { fundo: '#b45309', rotulo: 'Aquecer' },
  trabalho: { fundo: '#15803d', rotulo: 'Trabalho' },
  descanso: { fundo: '#1d4ed8', rotulo: 'Descanso' },
  desaquecer: { fundo: '#7e22ce', rotulo: 'Desaquecer' },
  livre: { fundo: '#374151', rotulo: 'Livre' },
};

export const COR_PRONTO = '#0b0b0f';
export const COR_CONCLUIDO = '#111827';

/** mm:ss (ou h:mm:ss); arredonda para cima para o relógio não mostrar 00:00 antes da hora. */
export function formatarTempo(ms: number, arredondarParaCima = false): string {
  const total = Math.max(0, arredondarParaCima ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dois = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${dois(m)}:${dois(s)}`;
}
