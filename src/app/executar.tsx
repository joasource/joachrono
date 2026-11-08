import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APARENCIA, COR_CONCLUIDO, COR_PRONTO, formatarTempo } from '../execucao/aparencia';
import { useExecucao } from '../execucao/useExecucao';
import { carregarTreinos } from '../treinos/armazenamento';
import { paraTreino } from '../treinos/modelo';
import {
  compilar,
  decorridoNoPassoMs,
  passoAtual,
  restanteMs,
  tempoTotalMs,
  treinoDeRounds,
  type Treino,
} from '../motor';

// Com `?id=` executa o treino salvo; sem ele, um treino de exemplo (parâmetros opcionais
// ?rounds=&trabalho=&descanso= permitem testar outras combinações).
function numero(valor: string | string[] | undefined, padrao: number): number {
  const n = Number(Array.isArray(valor) ? valor[0] : valor);
  return Number.isFinite(n) && n >= 0 ? n : padrao;
}

export default function Executar() {
  const params = useLocalSearchParams<{
    id?: string;
    rounds?: string;
    trabalho?: string;
    descanso?: string;
  }>();
  const [salvo, setSalvo] = useState<Treino | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    carregarTreinos().then((lista) => {
      const t = lista.find((x) => x.id === params.id);
      if (t) setSalvo(paraTreino(t));
      else setFalhou(true);
    });
  }, [params.id]);

  const exemplo = useMemo(
    () =>
      treinoDeRounds('exemplo', 'Exemplo', {
        rounds: Math.max(1, Math.floor(numero(params.rounds, 4))),
        segundosRound: Math.max(1, numero(params.trabalho, 20)),
        segundosDescanso: numero(params.descanso, 10),
        segundosAquecimento: 10,
        segundosDesaquecimento: 10,
      }),
    [params.rounds, params.trabalho, params.descanso],
  );

  if (params.id && !salvo) {
    return (
      <View style={estilos.carregando}>
        <Text style={estilos.titulo}>{falhou ? 'Treino não encontrado' : ''}</Text>
        {falhou ? <Botao rotulo="Voltar" onPress={() => router.back()} /> : null}
      </View>
    );
  }
  return <Execucao treino={salvo ?? exemplo} />;
}

function Execucao({ treino }: { treino: Treino }) {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const passos = useMemo(() => compilar(treino), [treino]);
  const { estado, agora, acoes } = useExecucao(passos);

  const passo = passoAtual(estado);
  const aparencia = APARENCIA[passo.categoria];
  const pronto = estado.status === 'pronto';
  const concluido = estado.status === 'concluido';
  const pausado = estado.status === 'pausado';
  const fundo = pronto ? COR_PRONTO : concluido ? COR_CONCLUIDO : aparencia.fundo;

  const restante = restanteMs(estado, agora);
  const relogio = concluido
    ? formatarTempo(tempoTotalMs(estado, agora))
    : restante === null
      ? formatarTempo(decorridoNoPassoMs(estado, agora))
      : formatarTempo(restante, true);
  const rodadas = passo.rodadas.map((r) => `${r.atual}/${r.total}`).join(' · ');
  const titulo = concluido ? 'Concluído' : (passo.nome ?? aparencia.rotulo);
  const manual = passo.fim.tipo === 'manual';

  return (
    <View
      style={[
        estilos.tela,
        { backgroundColor: fundo, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={estilos.topo}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair"
          onPress={() => router.back()}
        >
          <Text style={estilos.sair}>✕</Text>
        </Pressable>
        <Text style={estilos.total}>Total {formatarTempo(tempoTotalMs(estado, agora))}</Text>
      </View>

      <View style={estilos.centro}>
        <Text style={estilos.titulo} accessibilityRole="header">
          {pronto ? 'Pronto?' : titulo}
        </Text>
        {!pronto && !concluido && rodadas ? (
          <Text style={estilos.rodadas}>Round {rodadas}</Text>
        ) : null}
        {!pronto && !concluido ? (
          <Text style={estilos.passos}>
            Etapa {passo.indice + 1} de {estado.passos.length}
          </Text>
        ) : null}
        <Text style={estilos.relogio} accessibilityLiveRegion="none">
          {relogio}
        </Text>
        {pausado ? <Text style={estilos.rodadas}>Pausado</Text> : null}
      </View>

      <View style={estilos.botoes}>
        {pronto ? (
          <Botao rotulo="Iniciar" grande onPress={acoes.iniciar} />
        ) : concluido ? (
          <>
            <Botao rotulo="Refazer" onPress={acoes.reiniciar} />
            <Botao rotulo="Fechar" onPress={() => router.back()} />
          </>
        ) : (
          <>
            <Botao rotulo="◀◀" acessibilidade="Voltar" onPress={acoes.voltar} />
            <Botao
              rotulo={pausado ? 'Retomar' : 'Pausar'}
              grande
              onPress={pausado ? acoes.retomar : acoes.pausar}
            />
            <Botao
              rotulo={manual ? 'Próxima' : '▶▶'}
              acessibilidade="Avançar"
              onPress={acoes.avancar}
            />
          </>
        )}
      </View>
    </View>
  );
}

function Botao(props: {
  rotulo: string;
  onPress: () => void;
  grande?: boolean;
  acessibilidade?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.acessibilidade ?? props.rotulo}
      onPress={props.onPress}
      style={({ pressed }) => [
        estilos.botao,
        props.grande && estilos.botaoGrande,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={estilos.botaoTexto}>{props.rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  carregando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  tela: { flex: 1, paddingHorizontal: 20 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sair: { color: '#fff', fontSize: 28, padding: 8 },
  total: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontVariant: ['tabular-nums'] },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  titulo: { color: '#fff', fontSize: 40, fontWeight: '800', textAlign: 'center' },
  rodadas: { color: 'rgba(255,255,255,0.9)', fontSize: 22 },
  passos: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  relogio: { color: '#fff', fontSize: 96, fontWeight: '700', fontVariant: ['tabular-nums'] },
  botoes: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  botao: {
    minHeight: 56,
    minWidth: 72,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoGrande: { minWidth: 140, backgroundColor: 'rgba(0,0,0,0.5)' },
  botaoTexto: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
