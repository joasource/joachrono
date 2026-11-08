import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatarTempo } from '../execucao/aparencia';
import {
  carregarTreinos,
  comTreino,
  novoId,
  salvarTreinos,
  semTreino,
} from '../treinos/armazenamento';
import {
  duracaoTotalSegundos,
  LIMITES,
  normalizar,
  novoTreinoSimples,
  type TreinoSimples,
} from '../treinos/modelo';

type Campo = Exclude<keyof TreinoSimples, 'id' | 'nome'>;

const CAMPOS: { campo: Campo; rotulo: string; max: number }[] = [
  { campo: 'rounds', rotulo: 'Rounds', max: LIMITES.rounds },
  { campo: 'segundosRound', rotulo: 'Trabalho (s)', max: LIMITES.segundos },
  { campo: 'segundosDescanso', rotulo: 'Descanso (s)', max: LIMITES.segundos },
  { campo: 'segundosAquecimento', rotulo: 'Aquecimento (s)', max: LIMITES.segundos },
  { campo: 'segundosDesaquecimento', rotulo: 'Desaquecimento (s)', max: LIMITES.segundos },
];

export default function Editar() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [treino, setTreino] = useState<TreinoSimples | null>(null);
  // Texto digitado por campo: permite apagar tudo sem o número "pular" para 0.
  const [textos, setTextos] = useState<Partial<Record<Campo, string>>>({});

  useEffect(() => {
    carregarTreinos().then((lista) => {
      setTreino(lista.find((t) => t.id === id) ?? novoTreinoSimples(novoId()));
    });
  }, [id]);

  if (!treino) return <View style={estilos.tela} />;

  // Treino com os números digitados; campos vazios/ inválidos caem no valor corrigido.
  const atual = normalizar({
    ...treino,
    ...Object.fromEntries(Object.entries(textos).map(([k, v]) => [k, v === '' ? NaN : Number(v)])),
  })!;

  async function salvar() {
    const lista = await carregarTreinos();
    await salvarTreinos(comTreino(lista, { ...atual, nome: atual.nome }));
    router.back();
  }

  function excluir() {
    Alert.alert('Excluir treino?', atual.nome || 'Treino sem nome', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await salvarTreinos(semTreino(await carregarTreinos(), atual.id));
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          estilos.conteudo,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={estilos.titulo} accessibilityRole="header">
          {id ? 'Editar treino' : 'Novo treino'}
        </Text>

        <Text style={estilos.rotulo}>Nome</Text>
        <TextInput
          style={estilos.entrada}
          value={treino.nome}
          onChangeText={(nome) => setTreino({ ...treino, nome })}
          placeholder="Ex.: Tabata"
          placeholderTextColor="#6b7280"
          maxLength={60}
        />

        {CAMPOS.map(({ campo, rotulo, max }) => (
          <View key={campo}>
            <Text style={estilos.rotulo}>{rotulo}</Text>
            <TextInput
              style={estilos.entrada}
              keyboardType="number-pad"
              maxLength={String(max).length}
              value={textos[campo] ?? String(treino[campo])}
              onChangeText={(v) => setTextos({ ...textos, [campo]: v.replace(/\D/g, '') })}
              onBlur={() => {
                setTreino(atual);
                setTextos({});
              }}
              accessibilityLabel={rotulo}
            />
          </View>
        ))}

        <Text style={estilos.duracao}>
          Duração total: {formatarTempo(duracaoTotalSegundos(atual) * 1000)}
        </Text>

        <Pressable accessibilityRole="button" style={estilos.salvar} onPress={salvar}>
          <Text style={estilos.salvarTexto}>Salvar</Text>
        </Pressable>
        {id ? (
          <Pressable accessibilityRole="button" style={estilos.excluir} onPress={excluir}>
            <Text style={estilos.excluirTexto}>Excluir</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingHorizontal: 20, gap: 8 },
  titulo: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  rotulo: { color: '#9ca3af', fontSize: 14, marginTop: 8, marginBottom: 4 },
  entrada: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#1f2937',
    color: '#fff',
    fontSize: 18,
  },
  duracao: { color: '#fff', fontSize: 18, marginTop: 16, textAlign: 'center' },
  salvar: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  salvarTexto: { color: '#fff', fontSize: 18, fontWeight: '700' },
  excluir: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  excluirTexto: { color: '#f87171', fontSize: 16 },
});
