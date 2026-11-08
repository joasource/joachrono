import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatarTempo } from '../execucao/aparencia';
import { duracaoTotalSegundos } from '../treinos/modelo';
import { useTreinos } from '../treinos/useTreinos';

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
        keyExtractor={(t) => t.id}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          treinos ? (
            <Text style={estilos.vazio}>Nenhum treino ainda. Crie o primeiro.</Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={estilos.cartao}>
            <Pressable
              style={estilos.cartaoCorpo}
              accessibilityRole="button"
              accessibilityLabel={`Iniciar ${item.nome || 'Treino'}`}
              onPress={() => router.push({ pathname: '/executar', params: { id: item.id } })}
            >
              <Text style={estilos.nome}>{item.nome || 'Treino sem nome'}</Text>
              <Text style={estilos.detalhe}>
                {item.rounds} × {item.segundosRound}s / {item.segundosDescanso}s ·{' '}
                {formatarTempo(duracaoTotalSegundos(item) * 1000)}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar ${item.nome || 'Treino'}`}
              onPress={() => router.push({ pathname: '/editar', params: { id: item.id } })}
              style={estilos.editar}
            >
              <Text style={estilos.editarTexto}>Editar</Text>
            </Pressable>
          </View>
        )}
      />
      <Pressable
        accessibilityRole="button"
        style={estilos.novo}
        onPress={() => router.push('/editar')}
      >
        <Text style={estilos.novoTexto}>+ Novo treino</Text>
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
