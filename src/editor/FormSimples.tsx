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

import { t } from '../i18n/t';
import { formatarTempo } from '../execucao/aparencia';
import { LIMITES, medidas, normalizarSimples, type TreinoSimples } from '../treinos/modelo';
import { CampoNumero } from './CampoNumero';
import { estilosEditor as e } from './estilos';

type Campo = Exclude<keyof TreinoSimples, 'modo' | 'id' | 'nome'>;

const CAMPOS: { campo: Campo; chave: string; min: number; max: number }[] = [
  { campo: 'rounds', chave: 'form.rounds', min: 1, max: LIMITES.rounds },
  { campo: 'segundosRound', chave: 'form.trabalho', min: 1, max: LIMITES.segundos },
  { campo: 'segundosDescanso', chave: 'form.descanso', min: 0, max: LIMITES.segundos },
  {
    campo: 'segundosAquecimento',
    chave: 'form.aquecimento',
    min: 0,
    max: LIMITES.segundos,
  },
  {
    campo: 'segundosDesaquecimento',
    chave: 'form.desaquecimento',
    min: 0,
    max: LIMITES.segundos,
  },
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
    Alert.alert(t('form.converterTitulo'), t('form.converterMsg'), [
      { text: t('geral.cancelar'), style: 'cancel' },
      { text: t('form.converterAcao'), onPress: () => props.onConverter(treino) },
    ]);
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
          {props.novo ? t('form.novo') : t('form.editar')}
        </Text>

        <Text style={e.rotulo}>{t('form.nome')}</Text>
        <TextInput
          style={e.entrada}
          value={treino.nome}
          onChangeText={(nome) => setTreino({ ...treino, nome })}
          placeholder={t('form.exemploNome')}
          placeholderTextColor="#6b7280"
          maxLength={60}
        />

        {CAMPOS.map(({ campo, chave, min, max }) => {
          const rotulo = t(chave);
          return (
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
          );
        })}

        <Text style={e.duracao}>
          {t('form.duracao', { tempo: total ? formatarTempo(total.segundos * 1000) : '—' })}
        </Text>

        <Pressable
          accessibilityRole="button"
          style={e.salvar}
          onPress={() => props.onSalvar(normalizarSimples(treino)!)}
        >
          <Text style={e.salvarTexto}>{t('geral.salvar')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={e.secundario} onPress={converter}>
          <Text style={e.secundarioTexto}>{t('form.converterBotao')}</Text>
        </Pressable>
        {props.novo ? null : (
          <Pressable accessibilityRole="button" style={e.secundario} onPress={props.onExcluir}>
            <Text style={e.excluirTexto}>{t('geral.excluir')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
