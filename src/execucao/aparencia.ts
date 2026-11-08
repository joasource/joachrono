import { t } from '../i18n/t';
import type { CategoriaEtapa } from '../motor';

/** Cor de fundo e rótulo de cada categoria de etapa (a tela inteira muda de cor a cada troca). */
export const APARENCIA: Record<CategoriaEtapa, { fundo: string; rotulo: string }> = {
  aquecer: {
    fundo: '#b45309',
    get rotulo() {
      return t('etapa.aquecer');
    },
  },
  trabalho: {
    fundo: '#15803d',
    get rotulo() {
      return t('etapa.trabalho');
    },
  },
  descanso: {
    fundo: '#1d4ed8',
    get rotulo() {
      return t('etapa.descanso');
    },
  },
  desaquecer: {
    fundo: '#7e22ce',
    get rotulo() {
      return t('etapa.desaquecer');
    },
  },
  livre: {
    fundo: '#374151',
    get rotulo() {
      return t('etapa.livre');
    },
  },
};

export const COR_PRONTO = '#0b0b0f';
export const COR_CONCLUIDO = '#111827';

/** Tempo por extenso para leitores de tela ("1 minuto e 30 segundos"). */
export function tempoFalado(ms: number, arredondarParaCima = false): string {
  const total = Math.max(0, arredondarParaCima ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const partes: string[] = [];
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) partes.push(t('tempo.falado.horas', { count: h }));
  if (m > 0) partes.push(t('tempo.falado.minutos', { count: m }));
  if (s > 0 || partes.length === 0) partes.push(t('tempo.falado.segundos', { count: s }));
  const e = t('tempo.falado.e');
  return partes.length > 1
    ? `${partes.slice(0, -1).join(', ')}${e}${partes[partes.length - 1]}`
    : partes[0];
}

/** mm:ss (ou h:mm:ss); arredonda para cima para o relógio não mostrar 00:00 antes da hora. */
export function formatarTempo(ms: number, arredondarParaCima = false): string {
  const total = Math.max(0, arredondarParaCima ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dois = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${dois(m)}:${dois(s)}`;
}
