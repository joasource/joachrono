// Treino do "modo avançado": árvore de etapas e repetições aninhadas (o mesmo `Item` do motor).
import {
  compilar,
  duracaoTotal,
  type CategoriaEtapa,
  type Fim,
  type Item,
  type Treino,
} from '../motor';
import { inteiro, novoId } from './util';

export interface TreinoAvancado {
  modo: 'avancado';
  id: string;
  nome: string;
  itens: Item[];
}

export const LIMITES_AVANCADO = {
  vezes: 99,
  segundos: 3600,
  /** Quantas repetições podem ficar uma dentro da outra. */
  profundidade: 3,
  /** Teto de etapas depois de desdobrar as repetições (protege o aparelho de treinos absurdos). */
  passos: 2000,
};

export const CATEGORIAS_ETAPA: CategoriaEtapa[] = [
  'aquecer',
  'trabalho',
  'descanso',
  'desaquecer',
  'livre',
];

export const SEGUNDOS_PADRAO = 30;

export function novoTreinoAvancado(id: string): TreinoAvancado {
  return { modo: 'avancado', id, nome: '', itens: [] };
}

export function novaEtapa(categoria: CategoriaEtapa = 'trabalho'): Item {
  return {
    tipo: 'etapa',
    id: novoId(),
    categoria,
    fim: { tipo: 'tempo', segundos: SEGUNDOS_PADRAO },
  };
}

export function novaRepeticao(): Item {
  return { tipo: 'repeticao', id: novoId(), vezes: 2, itens: [novaEtapa()] };
}

// ---------- Normalização (dados vindos do disco são tratados como não confiáveis) ----------

export function normalizarItens(
  bruto: unknown,
  profundidade = 1,
  ids: Set<string> = new Set(),
): Item[] {
  if (!Array.isArray(bruto)) return [];
  const saida: Item[] = [];
  for (const b of bruto) {
    if (typeof b !== 'object' || b === null) continue;
    const o = b as Record<string, unknown>;
    const id = typeof o.id === 'string' && o.id !== '' && !ids.has(o.id) ? o.id : novoId();
    if (o.tipo === 'etapa') {
      ids.add(id);
      const categoria = CATEGORIAS_ETAPA.includes(o.categoria as CategoriaEtapa)
        ? (o.categoria as CategoriaEtapa)
        : 'trabalho';
      const nome = typeof o.nome === 'string' ? o.nome.trim().slice(0, 40) : '';
      const f = (typeof o.fim === 'object' && o.fim !== null ? o.fim : {}) as Record<
        string,
        unknown
      >;
      const fim: Fim =
        f.tipo === 'manual'
          ? { tipo: 'manual' }
          : {
              tipo: 'tempo',
              segundos: inteiro(f.segundos, 1, LIMITES_AVANCADO.segundos, SEGUNDOS_PADRAO),
            };
      saida.push({ tipo: 'etapa', id, categoria, ...(nome ? { nome } : {}), fim });
    } else if (o.tipo === 'repeticao' && profundidade <= LIMITES_AVANCADO.profundidade) {
      ids.add(id);
      saida.push({
        tipo: 'repeticao',
        id,
        vezes: inteiro(o.vezes, 1, LIMITES_AVANCADO.vezes, 2),
        itens: normalizarItens(o.itens, profundidade + 1, ids),
      });
    }
  }
  return saida;
}

export function normalizarAvancado(bruto: unknown): TreinoAvancado | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const b = bruto as Record<string, unknown>;
  if (typeof b.id !== 'string' || b.id === '') return null;
  return {
    modo: 'avancado',
    id: b.id,
    nome: typeof b.nome === 'string' ? b.nome.trim().slice(0, 60) : '',
    itens: normalizarItens(b.itens),
  };
}

// ---------- Operações imutáveis na árvore, sempre por id ----------

export function atualizarItem(itens: Item[], id: string, f: (item: Item) => Item): Item[] {
  return itens.map((i) =>
    i.id === id
      ? f(i)
      : i.tipo === 'repeticao'
        ? { ...i, itens: atualizarItem(i.itens, id, f) }
        : i,
  );
}

export function removerItem(itens: Item[], id: string): Item[] {
  return itens
    .filter((i) => i.id !== id)
    .map((i) => (i.tipo === 'repeticao' ? { ...i, itens: removerItem(i.itens, id) } : i));
}

/** Troca o item de lugar com o vizinho (-1 sobe, +1 desce), sem sair da lista em que está. */
export function moverItem(itens: Item[], id: string, delta: -1 | 1): Item[] {
  const idx = itens.findIndex((i) => i.id === id);
  if (idx >= 0) {
    const destino = idx + delta;
    if (destino < 0 || destino >= itens.length) return itens;
    const copia = [...itens];
    [copia[idx], copia[destino]] = [copia[destino], copia[idx]];
    return copia;
  }
  return itens.map((i) =>
    i.tipo === 'repeticao' ? { ...i, itens: moverItem(i.itens, id, delta) } : i,
  );
}

/** Acrescenta ao fim da repetição `paiId` (ou da raiz, se `paiId` for null). */
export function adicionarItem(itens: Item[], paiId: string | null, novo: Item): Item[] {
  if (paiId === null) return [...itens, novo];
  return itens.map((i) => {
    if (i.tipo !== 'repeticao') return i;
    return i.id === paiId
      ? { ...i, itens: [...i.itens, novo] }
      : { ...i, itens: adicionarItem(i.itens, paiId, novo) };
  });
}

// ---------- Validação e medidas ----------

/** Etapas depois de desdobrar as repetições (sem simular; é só aritmética). */
export function contarPassos(itens: Item[]): number {
  let n = 0;
  for (const i of itens) n += i.tipo === 'etapa' ? 1 : i.vezes * contarPassos(i.itens);
  return n;
}

export interface Problemas {
  geral: string[];
  /** Mensagem por id do item com problema (mostrada junto dele). */
  porId: Record<string, string>;
}

export function problemas(itens: Item[]): Problemas {
  const r: Problemas = { geral: [], porId: {} };
  if (itens.length === 0) r.geral.push('Adicione ao menos uma etapa.');
  const percorrer = (lista: Item[]): void => {
    for (const i of lista) {
      if (i.tipo !== 'repeticao') continue;
      if (i.itens.length === 0) r.porId[i.id] = 'Repetição vazia: adicione uma etapa ou remova.';
      percorrer(i.itens);
    }
  };
  percorrer(itens);
  if (contarPassos(itens) > LIMITES_AVANCADO.passos) {
    r.geral.push(`Treino grande demais (máximo de ${LIMITES_AVANCADO.passos} etapas no total).`);
  }
  return r;
}

export function paraTreinoAvancado(t: TreinoAvancado): Treino {
  return { id: t.id, nome: t.nome || 'Treino', itens: t.itens };
}

/** Duração e quantidade de etapas já desdobradas; null se o treino passa do limite. */
export function medidasAvancado(
  t: TreinoAvancado,
): { segundos: number; temManual: boolean; passos: number } | null {
  if (contarPassos(t.itens) > LIMITES_AVANCADO.passos) return null;
  const passos = compilar(paraTreinoAvancado(t));
  return { ...duracaoTotal(passos), passos: passos.length };
}
