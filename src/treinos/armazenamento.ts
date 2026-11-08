import Storage from 'expo-sqlite/kv-store';

import { normalizarTreino, type TreinoSalvo } from './modelo';

export { novoId } from './util';

const CHAVE = 'treinos.v1';

export async function carregarTreinos(): Promise<TreinoSalvo[]> {
  try {
    const bruto = await Storage.getItem(CHAVE);
    const dados: unknown = bruto ? JSON.parse(bruto) : [];
    if (!Array.isArray(dados)) return [];
    return dados.map(normalizarTreino).filter((t): t is TreinoSalvo => t !== null);
  } catch {
    return [];
  }
}

export async function salvarTreinos(treinos: TreinoSalvo[]): Promise<void> {
  await Storage.setItem(CHAVE, JSON.stringify(treinos));
}

/** Insere ou substitui pelo id, devolvendo a lista nova (não escreve nada no disco). */
export function comTreino(lista: TreinoSalvo[], treino: TreinoSalvo): TreinoSalvo[] {
  return lista.some((t) => t.id === treino.id)
    ? lista.map((t) => (t.id === treino.id ? treino : t))
    : [...lista, treino];
}

export function semTreino(lista: TreinoSalvo[], id: string): TreinoSalvo[] {
  return lista.filter((t) => t.id !== id);
}
