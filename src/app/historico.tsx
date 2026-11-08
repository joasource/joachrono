import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatarTempo } from '../execucao/aparencia';
import { carregarHistorico, excluirRegistros } from '../historico/armazenamento';
import { agruparPorDia, resumoSemana, semRegistros, type Registro } from '../historico/modelo';
import { i18n, t } from '../i18n/t';

export default function Historico() {
  const insets = useSafeAreaInsets();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [agora, setAgora] = useState(0);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const selecionando = selecionados.size > 0;

  // O botão voltar do Android sai do modo de seleção em vez de fechar a tela.
  useEffect(() => {
    if (!selecionando) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelecionados(new Set());
      return true;
    });
    return () => sub.remove();
  }, [selecionando]);

  // Recarrega ao voltar ao foco: o registro é gravado ao sair da execução.
  useFocusEffect(
    useCallback(() => {
      setRegistros(carregarHistorico());
      setAgora(Date.now());
    }, []),
  );

  const dias = agruparPorDia(registros);
  const semana = resumoSemana(registros, agora);
  const secoes = dias.map((d) => ({
    chave: d.chave,
    titulo: new Date(d.emMs).toLocaleDateString(i18n.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    }),
    total: formatarTempo(d.totalMs),
    data: d.registros,
  }));

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (!novo.delete(id)) novo.add(id);
      return novo;
    });
  }

  function excluirSelecionados() {
    const ids = selecionados;
    Alert.alert(t('historico.excluirVarios', { count: ids.size }), t('historico.excluirMsg'), [
      { text: t('geral.cancelar'), style: 'cancel' },
      {
        text: t('geral.excluir'),
        style: 'destructive',
        onPress: () => {
          excluirRegistros(ids);
          setRegistros((atual) => semRegistros(atual, ids));
          setSelecionados(new Set());
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
            accessibilityLabel={t('historico.cancelarSelecao')}
            onPress={() => setSelecionados(new Set())}
            style={estilos.botaoTopo}
          >
            <Text style={estilos.botaoTopoTexto}>✕</Text>
          </Pressable>
          <Text style={estilos.titulo} accessibilityRole="header">
            {t('historico.selecionados', { count: selecionados.size })}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('historico.selecionarTodos')}
            onPress={() => setSelecionados(new Set(registros.map((r) => r.id)))}
            style={estilos.botaoTopo}
          >
            <Text style={estilos.botaoTopoTexto}>☑</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('historico.excluirSelecionados')}
            onPress={excluirSelecionados}
            style={estilos.botaoTopo}
          >
            <Text style={[estilos.botaoTopoTexto, { color: '#f87171' }]}>🗑</Text>
          </Pressable>
        </View>
      ) : (
        <View style={estilos.topo}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('geral.voltar')}
            onPress={() => router.back()}
            style={estilos.botaoTopo}
          >
            <Text style={estilos.botaoTopoTexto}>←</Text>
          </Pressable>
          <Text style={estilos.titulo} accessibilityRole="header">
            {t('historico.titulo')}
          </Text>
        </View>
      )}

      {registros.length > 0 ? (
        <View style={estilos.resumo} accessible>
          <Text style={estilos.resumoRotulo}>{t('historico.semana')}</Text>
          <Text style={estilos.resumoValor}>
            {t('historico.resumo', { count: semana.treinos, tempo: formatarTempo(semana.totalMs) })}
          </Text>
        </View>
      ) : null}

      <SectionList
        sections={secoes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={estilos.lista}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={<Text style={estilos.vazio}>{t('historico.vazio')}</Text>}
        renderSectionHeader={({ section }) => (
          <View style={estilos.cabecalho} accessible accessibilityRole="header">
            <Text style={estilos.dia}>{section.titulo}</Text>
            <Text style={estilos.diaTotal}>{section.total}</Text>
          </View>
        )}
        extraData={selecionados}
        renderItem={({ item }) => {
          const marcado = selecionados.has(item.id);
          const nome = item.nome || t('geral.semNome');
          return (
            <Pressable
              style={[estilos.cartao, marcado && estilos.cartaoMarcado]}
              accessibilityRole={selecionando ? 'checkbox' : undefined}
              accessibilityState={selecionando ? { checked: marcado } : undefined}
              accessibilityLabel={selecionando ? t('historico.marcarA11y', { nome }) : undefined}
              onPress={() => selecionando && alternar(item.id)}
              onLongPress={() => alternar(item.id)}
            >
              <View style={estilos.cartaoTexto}>
                <Text style={estilos.nome} numberOfLines={1}>
                  {nome}
                </Text>
                <Text style={estilos.detalhe}>
                  {new Date(item.emMs).toLocaleTimeString(i18n.locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' · '}
                  {item.concluido ? t('historico.concluido') : t('historico.encerrado')}
                </Text>
              </View>
              {selecionando ? (
                <Text
                  style={[estilos.caixa, marcado && { color: '#4ade80' }]}
                  importantForAccessibility="no-hide-descendants"
                >
                  {marcado ? '☑' : '☐'}
                </Text>
              ) : (
                <Text style={estilos.duracao}>{formatarTempo(item.duracaoMs)}</Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, paddingHorizontal: 20 },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  botaoTopo: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  botaoTopoTexto: { color: '#fff', fontSize: 28 },
  titulo: { flex: 1, color: '#fff', fontSize: 28, fontWeight: '700', marginLeft: 4 },
  resumo: { backgroundColor: '#1f2937', borderRadius: 16, padding: 16, marginVertical: 12, gap: 4 },
  resumoRotulo: { color: '#9ca3af', fontSize: 14 },
  resumoValor: { color: '#fff', fontSize: 22, fontWeight: '700' },
  lista: { paddingBottom: 16, gap: 8 },
  vazio: { color: '#9ca3af', fontSize: 16, textAlign: 'center', marginTop: 40 },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  dia: { color: '#d1d5db', fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  diaTotal: { color: '#9ca3af', fontSize: 16, fontVariant: ['tabular-nums'] },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    minHeight: 64,
  },
  cartaoMarcado: { backgroundColor: '#14532d' },
  caixa: { color: '#9ca3af', fontSize: 26 },
  cartaoTexto: { flex: 1, gap: 4 },
  nome: { color: '#fff', fontSize: 18, fontWeight: '600' },
  detalhe: { color: '#9ca3af', fontSize: 14 },
  duracao: { color: '#fff', fontSize: 18, fontVariant: ['tabular-nums'] },
});
