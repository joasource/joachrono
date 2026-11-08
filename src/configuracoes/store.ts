import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import { normalizarConfiguracoes, PADRAO, type Configuracoes } from './modelo';

// Lido de forma síncrona ao carregar o módulo: o resto do app (sons, notificações) consulta
// `obterConfiguracoes()` sem esperar disco. Chave versionada como a dos treinos.
const CHAVE = 'configuracoes.v1';

function ler(): Configuracoes {
  try {
    const bruto = Storage.getItemSync(CHAVE);
    return normalizarConfiguracoes(bruto ? JSON.parse(bruto) : null);
  } catch {
    return PADRAO;
  }
}

let atual = ler();
const ouvintes = new Set<() => void>();

export function obterConfiguracoes(): Configuracoes {
  return atual;
}

export function salvarConfiguracoes(parcial: Partial<Configuracoes>) {
  atual = normalizarConfiguracoes({ ...atual, ...parcial });
  try {
    Storage.setItemSync(CHAVE, JSON.stringify(atual));
  } catch {}
  ouvintes.forEach((f) => f());
}

export function useConfiguracoes(): Configuracoes {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => void ouvintes.delete(f);
    },
    obterConfiguracoes,
    obterConfiguracoes,
  );
}
