import Storage from 'expo-sqlite/kv-store';

import { normalizar, type TreinoSimples } from './modelo';

const CHAVE = 'treinos.v1';

export async function carregarTreinos(): Promise<TreinoSimples[]> {
  try {
    const bruto = await Storage.getItem(CHAVE);
    const dados: unknown = bruto ? JSON.parse(bruto) : [];
    if (!Array.isArray(dados)) return [];
    return dados.map(normalizar).filter((t): t is TreinoSimples => t !== null);
  } catch {
    return [];
  }
}

export async function salvarTreinos(treinos: TreinoSimples[]): Promise<void> {
  await Storage.setItem(CHAVE, JSON.stringify(treinos));
}

/** Insere ou substitui pelo id, devolvendo a lista nova (não escreve nada no disco). */
export function comTreino(lista: TreinoSimples[], treino: TreinoSimples): TreinoSimples[] {
  return lista.some((t) => t.id === treino.id)
    ? lista.map((t) => (t.id === treino.id ? treino : t))
    : [...lista, treino];
}

export function semTreino(lista: TreinoSimples[], id: string): TreinoSimples[] {
  return lista.filter((t) => t.id !== id);
}

export function novoId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
