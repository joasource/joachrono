import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { EditorAvancado } from '../editor/EditorAvancado';
import { FormSimples } from '../editor/FormSimples';
import {
  carregarTreinos,
  comTreino,
  novoId,
  salvarTreinos,
  semTreino,
} from '../treinos/armazenamento';
import { novoTreinoSimples, simplesParaAvancado, type TreinoSalvo } from '../treinos/modelo';

export default function Editar() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [treino, setTreino] = useState<TreinoSalvo | null>(null);

  useEffect(() => {
    carregarTreinos().then((lista) => {
      setTreino(lista.find((t) => t.id === id) ?? novoTreinoSimples(novoId()));
    });
  }, [id]);

  if (!treino) return <View style={{ flex: 1 }} />;
  const novo = !id;

  async function salvar(t: TreinoSalvo) {
    await salvarTreinos(comTreino(await carregarTreinos(), t));
    router.back();
  }

  function excluir() {
    Alert.alert('Excluir treino?', treino?.nome || 'Treino sem nome', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await salvarTreinos(semTreino(await carregarTreinos(), treino!.id));
          router.back();
        },
      },
    ]);
  }

  return treino.modo === 'avancado' ? (
    <EditorAvancado inicial={treino} novo={novo} onSalvar={salvar} onExcluir={excluir} />
  ) : (
    <FormSimples
      inicial={treino}
      novo={novo}
      onSalvar={salvar}
      onExcluir={excluir}
      onConverter={(t) => setTreino(simplesParaAvancado(t))}
    />
  );
}
