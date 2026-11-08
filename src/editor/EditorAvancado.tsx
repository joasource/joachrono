import { useMemo, useState } from 'react';
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

import { APARENCIA, formatarTempo } from '../execucao/aparencia';
import type { Etapa, Item, Repeticao } from '../motor';
import {
  adicionarItem,
  atualizarItem,
  CATEGORIAS_ETAPA,
  LIMITES_AVANCADO,
  medidasAvancado,
  moverItem,
  novaEtapa,
  novaRepeticao,
  problemas,
  removerItem,
  SEGUNDOS_PADRAO,
  type TreinoAvancado,
} from '../treinos/avancado';
import { CampoNumero } from './CampoNumero';
import { estilosEditor as e } from './estilos';

interface Operacoes {
  atualizar: (id: string, f: (item: Item) => Item) => void;
  remover: (id: string) => void;
  mover: (id: string, delta: -1 | 1) => void;
  adicionar: (paiId: string | null, item: Item) => void;
  erros: Record<string, string>;
}

export function EditorAvancado(props: {
  inicial: TreinoAvancado;
  novo: boolean;
  onSalvar: (t: TreinoAvancado) => void;
  onExcluir: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [treino, setTreino] = useState(props.inicial);
  const { geral, porId } = useMemo(() => problemas(treino.itens), [treino.itens]);
  const total = useMemo(() => medidasAvancado(treino), [treino]);
  const valido = geral.length === 0 && Object.keys(porId).length === 0;

  const mudar = (f: (itens: Item[]) => Item[]) => setTreino((t) => ({ ...t, itens: f(t.itens) }));
  const ops: Operacoes = {
    atualizar: (id, f) => mudar((itens) => atualizarItem(itens, id, f)),
    remover: (id) => mudar((itens) => removerItem(itens, id)),
    mover: (id, delta) => mudar((itens) => moverItem(itens, id, delta)),
    adicionar: (paiId, item) => mudar((itens) => adicionarItem(itens, paiId, item)),
    erros: porId,
  };

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
          {props.novo ? 'Novo treino' : 'Editar treino'} · avançado
        </Text>

        <Text style={e.rotulo}>Nome</Text>
        <TextInput
          style={e.entrada}
          value={treino.nome}
          onChangeText={(nome) => setTreino((t) => ({ ...t, nome }))}
          placeholder="Ex.: Intervalado 3 blocos"
          placeholderTextColor="#6b7280"
          maxLength={60}
        />

        <Text style={e.rotulo}>Etapas</Text>
        <ListaItens itens={treino.itens} paiId={null} nivel={0} ops={ops} />

        {geral.map((m) => (
          <Text key={m} style={e.erro}>
            {m}
          </Text>
        ))}

        <Text style={e.duracao}>
          Duração total:{' '}
          {total ? `${total.temManual ? '≥ ' : ''}${formatarTempo(total.segundos * 1000)}` : '—'}
        </Text>
        {total?.temManual ? (
          <Text style={estilos.nota}>Etapas manuais duram até você tocar em “Próxima”.</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !valido }}
          disabled={!valido}
          style={[e.salvar, !valido && e.desativado]}
          onPress={() => props.onSalvar({ ...treino, nome: treino.nome.trim() })}
        >
          <Text style={e.salvarTexto}>Salvar</Text>
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

/** Lista de itens de um mesmo nível; as repetições chamam esta função de novo para os filhos. */
function ListaItens(props: { itens: Item[]; paiId: string | null; nivel: number; ops: Operacoes }) {
  const { itens, paiId, nivel, ops } = props;
  const podeRepetir = nivel < LIMITES_AVANCADO.profundidade;
  return (
    <View style={estilos.lista}>
      {itens.map((item, i) => {
        const posicao = { primeiro: i === 0, ultimo: i === itens.length - 1 };
        return item.tipo === 'etapa' ? (
          <NoEtapa key={item.id} etapa={item} posicao={posicao} ops={ops} />
        ) : (
          <NoRepeticao key={item.id} repeticao={item} posicao={posicao} nivel={nivel} ops={ops} />
        );
      })}
      <View style={estilos.linha}>
        <Chip rotulo="+ Etapa" onPress={() => ops.adicionar(paiId, novaEtapa())} />
        {podeRepetir ? (
          <Chip rotulo="+ Repetição" onPress={() => ops.adicionar(paiId, novaRepeticao())} />
        ) : null}
      </View>
    </View>
  );
}

interface Posicao {
  primeiro: boolean;
  ultimo: boolean;
}

function Controles(props: {
  id: string;
  posicao: Posicao;
  ops: Operacoes;
  onRemover?: () => void;
}) {
  const { id, posicao, ops } = props;
  return (
    <View style={estilos.linha}>
      <Chip
        rotulo="↑"
        acessibilidade="Mover para cima"
        desativado={posicao.primeiro}
        onPress={() => ops.mover(id, -1)}
      />
      <Chip
        rotulo="↓"
        acessibilidade="Mover para baixo"
        desativado={posicao.ultimo}
        onPress={() => ops.mover(id, 1)}
      />
      <Chip
        rotulo="✕"
        acessibilidade="Remover"
        perigo
        onPress={props.onRemover ?? (() => ops.remover(id))}
      />
    </View>
  );
}

function NoEtapa(props: { etapa: Etapa; posicao: Posicao; ops: Operacoes }) {
  const { etapa, posicao, ops } = props;
  const alterar = (parcial: Partial<Etapa>) =>
    ops.atualizar(etapa.id, (i) => ({ ...(i as Etapa), ...parcial }));
  return (
    <View style={[estilos.no, { borderLeftColor: APARENCIA[etapa.categoria].fundo }]}>
      <View style={estilos.linha}>
        {CATEGORIAS_ETAPA.map((c) => (
          <Chip
            key={c}
            rotulo={APARENCIA[c].rotulo}
            selecionado={etapa.categoria === c}
            cor={APARENCIA[c].fundo}
            onPress={() => alterar({ categoria: c })}
          />
        ))}
      </View>
      <TextInput
        style={[e.entrada, estilos.entradaNome]}
        value={etapa.nome ?? ''}
        onChangeText={(nome) => alterar({ nome: nome || undefined })}
        placeholder={`Nome (opcional) — ${APARENCIA[etapa.categoria].rotulo}`}
        placeholderTextColor="#6b7280"
        maxLength={40}
        accessibilityLabel="Nome da etapa"
      />
      <View style={estilos.linha}>
        <Chip
          rotulo="Tempo"
          selecionado={etapa.fim.tipo === 'tempo'}
          onPress={() =>
            etapa.fim.tipo === 'tempo' ||
            alterar({ fim: { tipo: 'tempo', segundos: SEGUNDOS_PADRAO } })
          }
        />
        <Chip
          rotulo="Manual"
          selecionado={etapa.fim.tipo === 'manual'}
          onPress={() => alterar({ fim: { tipo: 'manual' } })}
        />
        {etapa.fim.tipo === 'tempo' ? (
          <View style={estilos.segundos}>
            <CampoNumero
              estilo={[e.entrada, estilos.entradaSegundos]}
              rotulo="Segundos da etapa"
              valor={etapa.fim.segundos}
              min={1}
              max={LIMITES_AVANCADO.segundos}
              onChange={(segundos) => alterar({ fim: { tipo: 'tempo', segundos } })}
            />
            <Text style={estilos.unidade}>s</Text>
          </View>
        ) : null}
      </View>
      <Controles id={etapa.id} posicao={posicao} ops={ops} />
    </View>
  );
}

function NoRepeticao(props: {
  repeticao: Repeticao;
  posicao: Posicao;
  nivel: number;
  ops: Operacoes;
}) {
  const { repeticao, posicao, nivel, ops } = props;
  const erro = ops.erros[repeticao.id];

  function remover() {
    if (repeticao.itens.length === 0) return ops.remover(repeticao.id);
    Alert.alert('Remover repetição?', 'As etapas dentro dela também serão removidas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => ops.remover(repeticao.id) },
    ]);
  }

  return (
    <View style={[estilos.no, estilos.noRepeticao]}>
      <View style={estilos.linha}>
        <Text style={estilos.titulo}>Repetir</Text>
        <View style={estilos.segundos}>
          <CampoNumero
            estilo={[e.entrada, estilos.entradaSegundos]}
            rotulo="Número de vezes"
            valor={repeticao.vezes}
            min={1}
            max={LIMITES_AVANCADO.vezes}
            onChange={(vezes) =>
              ops.atualizar(repeticao.id, (i) => ({ ...(i as Repeticao), vezes }))
            }
          />
          <Text style={estilos.unidade}>vezes</Text>
        </View>
      </View>
      {erro ? <Text style={e.erro}>{erro}</Text> : null}
      <ListaItens itens={repeticao.itens} paiId={repeticao.id} nivel={nivel + 1} ops={ops} />
      <Controles id={repeticao.id} posicao={posicao} ops={ops} onRemover={remover} />
    </View>
  );
}

function Chip(props: {
  rotulo: string;
  onPress: () => void;
  acessibilidade?: string;
  selecionado?: boolean;
  desativado?: boolean;
  perigo?: boolean;
  cor?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.acessibilidade ?? props.rotulo}
      accessibilityState={{ selected: props.selecionado, disabled: props.desativado }}
      disabled={props.desativado}
      onPress={props.onPress}
      style={[
        estilos.chip,
        props.selecionado && { backgroundColor: props.cor ?? '#2563eb' },
        props.desativado && e.desativado,
      ]}
    >
      <Text style={[estilos.chipTexto, props.perigo && { color: '#f87171' }]}>{props.rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: 8 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  no: { gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#111827', borderLeftWidth: 6 },
  noRepeticao: { borderLeftColor: '#6b7280', backgroundColor: '#0f172a' },
  titulo: { color: '#fff', fontSize: 18, fontWeight: '700' },
  nota: { color: '#9ca3af', fontSize: 13, textAlign: 'center' },
  chip: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTexto: { color: '#fff', fontSize: 15, fontWeight: '600' },
  entradaNome: { fontSize: 16 },
  segundos: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entradaSegundos: { minWidth: 72, textAlign: 'center' },
  unidade: { color: '#9ca3af', fontSize: 15 },
});
