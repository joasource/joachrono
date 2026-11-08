import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '../i18n/t';
import { formatarTempo } from '../execucao/aparencia';
import { medidas, type TreinoSalvo } from '../treinos/modelo';
import { useTreinos } from '../treinos/useTreinos';

function detalhe(treino: TreinoSalvo): string {
  const m = medidas(treino);
  const tempo = m ? `${m.temManual ? '≥ ' : ''}${formatarTempo(m.segundos * 1000)}` : '—';
  return treino.modo === 'avancado'
    ? t('inicio.avancado', { passos: m?.passos ?? '?', tempo })
    : `${treino.rounds} × ${treino.segundosRound}s / ${treino.segundosDescanso}s · ${tempo}`;
}

export default function Inicio() {
  const insets = useSafeAreaInsets();
  const treinos = useTreinos();

  return (
    <View style={[estilos.tela, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}>
      <Text style={estilos.titulo} accessibilityRole="header">
        Joachrono
      </Text>
      <FlatList
        data={treinos ?? []}
        keyExtractor={(treino) => treino.id}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          treinos ? <Text style={estilos.vazio}>{t('inicio.vazio')}</Text> : undefined
        }
        renderItem={({ item }) => (
          <View style={estilos.cartao}>
            <Pressable
              style={estilos.cartaoCorpo}
              accessibilityRole="button"
              accessibilityLabel={t('inicio.iniciarA11y', { nome: item.nome || t('geral.treino') })}
              onPress={() => router.push({ pathname: '/executar', params: { id: item.id } })}
            >
              <Text style={estilos.nome}>{item.nome || t('geral.semNome')}</Text>
              <Text style={estilos.detalhe}>{detalhe(item)}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('inicio.editarA11y', { nome: item.nome || t('geral.treino') })}
              onPress={() => router.push({ pathname: '/editar', params: { id: item.id } })}
              style={estilos.editar}
            >
              <Text style={estilos.editarTexto}>{t('inicio.editar')}</Text>
            </Pressable>
          </View>
        )}
      />
      <Pressable
        accessibilityRole="button"
        style={estilos.novo}
        onPress={() => router.push('/editar')}
      >
        <Text style={estilos.novoTexto}>{t('inicio.novo')}</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, paddingHorizontal: 20 },
  titulo: { color: '#fff', fontSize: 32, fontWeight: '700', marginBottom: 16 },
  lista: { gap: 12, paddingBottom: 16 },
  vazio: { color: '#9ca3af', fontSize: 16, textAlign: 'center', marginTop: 40 },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 16,
  },
  cartaoCorpo: { flex: 1, padding: 16, gap: 4, minHeight: 64, justifyContent: 'center' },
  nome: { color: '#fff', fontSize: 20, fontWeight: '600' },
  detalhe: { color: '#9ca3af', fontSize: 14 },
  editar: { padding: 16, minHeight: 48, justifyContent: 'center' },
  editarTexto: { color: '#60a5fa', fontSize: 16 },
  novo: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  novoTexto: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
