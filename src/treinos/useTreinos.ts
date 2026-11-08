import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { carregarTreinos } from './armazenamento';
import type { TreinoSalvo } from './modelo';

/** Recarrega a lista do disco toda vez que a tela volta ao foco (depois de editar, por ex.). */
export function useTreinos() {
  const [treinos, setTreinos] = useState<TreinoSalvo[] | null>(null);
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      carregarTreinos().then((t) => ativo && setTreinos(t));
      return () => {
        ativo = false;
      };
    }, []),
  );
  return [treinos, setTreinos] as const;
}
