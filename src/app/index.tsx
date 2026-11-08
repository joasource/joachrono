import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '../i18n/t';
import { formatarTempo } from '../execucao/aparencia';
import { salvarTreinos } from '../treinos/armazenamento';
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
  const [treinos, setTreinos] = useTreinos();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const selecionando = selecionados.size > 0;

  // O botão voltar do Android sai do modo de seleção em vez de fechar o app.
  useEffect(() => {
    if (!selecionando) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelecionados(new Set());
      return true;
    });
    return () => sub.remove();
  }, [selecionando]);

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (!novo.delete(id)) novo.add(id);
      return novo;
    });
  }

  function selecionarTodos() {
    setSelecionados(new Set((treinos ?? []).map((x) => x.id)));
  }

  function excluirSelecionados() {
    const ids = selecionados;
    Alert.alert(t('inicio.excluirVarios', { count: ids.size }), undefined, [
      { text: t('geral.cancelar'), style: 'cancel' },
      {
        text: t('geral.excluir'),
        style: 'destructive',
        onPress: async () => {
          const restantes = (treinos ?? []).filter((x) => !ids.has(x.id));
          setTreinos(restantes);
          setSelecionados(new Set());
          await salvarTreinos(restantes);
        },
      },
    ]);
  }

  return (
    <View style={[estilos.tela, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}>
      {selecionando ? (
        <View style={estilos.topo}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('inicio.cancelarSelecao')}
            onPress={() => setSelecionados(new Set())}
            style={estilos.engrenagem}
          >
            <Text style={estilos.engrenagemTexto}>✕</Text>
          </Pressable>
          <Text style={estilos.contagem} accessibilityRole="header">
            {t('inicio.selecionados', { count: selecionados.size })}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('inicio.selecionarTodos')}
            onPress={selecionarTodos}
            style={estilos.engrenagem}
          >
            <Text style={estilos.engrenagemTexto}>☑</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('inicio.excluirSelecionados')}
            onPress={excluirSelecionados}
            style={estilos.engrenagem}
          >
            <Text style={[estilos.engrenagemTexto, { color: '#f87171' }]}>🗑</Text>
          </Pressable>
        </View>
      ) : (
        <View style={estilos.topo}>
          <Text style={estilos.titulo} accessibilityRole="header">
            joaChrono
          </Text>
          <View style={estilos.acoes}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('historico.abrir')}
              onPress={() => router.push('/historico')}
              style={estilos.engrenagem}
            >
              <Text style={estilos.engrenagemTexto}>🕘</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('config.abrir')}
              onPress={() => router.push('/configuracoes')}
              style={estilos.engrenagem}
            >
              <Text style={estilos.engrenagemTexto}>⚙</Text>
            </Pressable>
          </View>
        </View>
      )}
      <FlatList
        data={treinos ?? []}
        keyExtractor={(treino) => treino.id}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          treinos ? <Text style={estilos.vazio}>{t('inicio.vazio')}</Text> : undefined
        }
        extraData={selecionados}
        renderItem={({ item }) => {
          const nome = item.nome || t('geral.treino');
          const marcado = selecionados.has(item.id);
          return (
            <View style={[estilos.cartao, marcado && estilos.cartaoMarcado]}>
              <Pressable
                style={estilos.cartaoCorpo}
                accessibilityRole={selecionando ? 'checkbox' : 'button'}
                accessibilityState={selecionando ? { checked: marcado } : undefined}
                accessibilityLabel={
                  selecionando
                    ? t('inicio.marcarA11y', { nome })
                    : t('inicio.iniciarA11y', { nome })
                }
                onPress={() =>
                  selecionando
                    ? alternar(item.id)
                    : router.push({ pathname: '/executar', params: { id: item.id } })
                }
                onLongPress={() => alternar(item.id)}
              >
                <Text style={estilos.nome}>{item.nome || t('geral.semNome')}</Text>
                <Text style={estilos.detalhe}>{detalhe(item)}</Text>
              </Pressable>
              {selecionando ? (
                <View style={estilos.caixa} importantForAccessibility="no-hide-descendants">
                  <Text style={[estilos.caixaTexto, marcado && { color: '#4ade80' }]}>
                    {marcado ? '☑' : '☐'}
                  </Text>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('inicio.editarA11y', { nome })}
                  onPress={() => router.push({ pathname: '/editar', params: { id: item.id } })}
                  style={estilos.editar}
                >
                  <Text style={estilos.editarTexto}>{t('inicio.editar')}</Text>
                </Pressable>
              )}
            </View>
          );
        }}
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
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  acoes: { flexDirection: 'row' },
  titulo: { color: '#fff', fontSize: 32, fontWeight: '700' },
  contagem: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '600', marginLeft: 8 },
  engrenagem: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  engrenagemTexto: { color: '#fff', fontSize: 28 },
  lista: { gap: 12, paddingBottom: 16 },
  vazio: { color: '#9ca3af', fontSize: 16, textAlign: 'center', marginTop: 40 },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 16,
  },
  cartaoMarcado: { backgroundColor: '#14532d' },
  caixa: { padding: 16, minHeight: 48, justifyContent: 'center' },
  caixaTexto: { color: '#9ca3af', fontSize: 26 },
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
