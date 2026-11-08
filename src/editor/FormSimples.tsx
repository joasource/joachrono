import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatarTempo } from '../execucao/aparencia';
import { LIMITES, medidas, normalizarSimples, type TreinoSimples } from '../treinos/modelo';
import { CampoNumero } from './CampoNumero';
import { estilosEditor as e } from './estilos';

type Campo = Exclude<keyof TreinoSimples, 'modo' | 'id' | 'nome'>;

const CAMPOS: { campo: Campo; rotulo: string; min: number; max: number }[] = [
  { campo: 'rounds', rotulo: 'Rounds', min: 1, max: LIMITES.rounds },
  { campo: 'segundosRound', rotulo: 'Trabalho (s)', min: 1, max: LIMITES.segundos },
  { campo: 'segundosDescanso', rotulo: 'Descanso (s)', min: 0, max: LIMITES.segundos },
  { campo: 'segundosAquecimento', rotulo: 'Aquecimento (s)', min: 0, max: LIMITES.segundos },
  { campo: 'segundosDesaquecimento', rotulo: 'Desaquecimento (s)', min: 0, max: LIMITES.segundos },
];

export function FormSimples(props: {
  inicial: TreinoSimples;
  novo: boolean;
  onSalvar: (t: TreinoSimples) => void;
  onExcluir: () => void;
  onConverter: (t: TreinoSimples) => void;
}) {
  const insets = useSafeAreaInsets();
  const [treino, setTreino] = useState(props.inicial);
  const total = medidas(treino);

  function converter() {
    Alert.alert(
      'Converter para avançado?',
      'Você poderá editar etapas e blocos de repetição livremente, mas não dá para voltar ao modo simples.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Converter', onPress: () => props.onConverter(treino) },
      ],
    );
  }

  return (
    <KeyboardAvoidingView style={e.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          e.conteudo,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={e.titulo} accessibilityRole="header">
          {props.novo ? 'Novo treino' : 'Editar treino'}
        </Text>

        <Text style={e.rotulo}>Nome</Text>
        <TextInput
          style={e.entrada}
          value={treino.nome}
          onChangeText={(nome) => setTreino({ ...treino, nome })}
          placeholder="Ex.: Tabata"
          placeholderTextColor="#6b7280"
          maxLength={60}
        />

        {CAMPOS.map(({ campo, rotulo, min, max }) => (
          <View key={campo}>
            <Text style={e.rotulo}>{rotulo}</Text>
            <CampoNumero
              estilo={e.entrada}
              rotulo={rotulo}
              valor={treino[campo]}
              min={min}
              max={max}
              onChange={(v) => setTreino((t) => ({ ...t, [campo]: v }))}
            />
          </View>
        ))}

        <Text style={e.duracao}>
          Duração total: {total ? formatarTempo(total.segundos * 1000) : '—'}
        </Text>

        <Pressable
          accessibilityRole="button"
          style={e.salvar}
          onPress={() => props.onSalvar(normalizarSimples(treino)!)}
        >
          <Text style={e.salvarTexto}>Salvar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={e.secundario} onPress={converter}>
          <Text style={e.secundarioTexto}>Converter para avançado…</Text>
        </Pressable>
        {props.novo ? null : (
          <Pressable accessibilityRole="button" style={e.secundario} onPress={props.onExcluir}>
            <Text style={e.excluirTexto}>Excluir</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
