import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { obterConfiguracoes } from '../configuracoes/store';
import { t } from '../i18n/t';
import {
  APARENCIA,
  COR_CONCLUIDO,
  COR_PRONTO,
  formatarTempo,
  tempoFalado,
} from '../execucao/aparencia';
import { useLinhaDoTempo } from '../execucao/useLinhaDoTempo';
import { pedirPermissaoNotificacoes, useNotificacoesDaExecucao } from '../execucao/notificacoes';
import { useExecucao } from '../execucao/useExecucao';
import { registrarExecucao } from '../historico/armazenamento';
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
      treinoDeRounds('exemplo', t('executar.exemplo'), {
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
        <Text style={estilos.titulo}>{falhou ? t('executar.naoEncontrado') : ''}</Text>
        {falhou ? <Botao rotulo={t('geral.voltar')} onPress={() => router.back()} /> : null}
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
  const [notificar, setNotificar] = useState(false);
  useNotificacoesDaExecucao(estado, notificar);
  useLinhaDoTempo(estado);

  const passo = passoAtual(estado);
  const aparencia = APARENCIA[passo.categoria];
  const pronto = estado.status === 'pronto';
  const concluido = estado.status === 'concluido';
  const pausado = estado.status === 'pausado';

  // Histórico: grava ao concluir; se a pessoa sai antes, grava ao desmontar (parcial, ≥ 10 s).
  // O exemplo (sem treino salvo) não entra. `Refazer` volta a permitir um novo registro.
  const registrado = useRef(false);
  const ultimo = useRef({ estado, treino });
  useEffect(() => {
    ultimo.current = { estado, treino };
  });
  useEffect(() => {
    if (!concluido) {
      registrado.current = false;
      return;
    }
    if (registrado.current || treino.id === 'exemplo') return;
    registrado.current = true;
    registrarExecucao({
      treinoId: treino.id,
      nome: treino.nome,
      duracaoMs: tempoTotalMs(estado, Date.now()),
      concluido: true,
    });
  }, [concluido, estado, treino]);
  useEffect(
    () => () => {
      const { estado: e, treino: tr } = ultimo.current;
      if (registrado.current || tr.id === 'exemplo') return;
      if (e.status === 'pronto' || e.status === 'concluido') return;
      registrarExecucao({
        treinoId: tr.id,
        nome: tr.nome,
        duracaoMs: tempoTotalMs(e, Date.now()),
        concluido: false,
      });
    },
    [],
  );

  const fundo = pronto ? COR_PRONTO : concluido ? COR_CONCLUIDO : aparencia.fundo;

  const restante = restanteMs(estado, agora);
  const relogioFalado = concluido
    ? tempoFalado(tempoTotalMs(estado, agora))
    : restante === null
      ? tempoFalado(decorridoNoPassoMs(estado, agora))
      : tempoFalado(restante, true);
  const relogio = concluido
    ? formatarTempo(tempoTotalMs(estado, agora))
    : restante === null
      ? formatarTempo(decorridoNoPassoMs(estado, agora))
      : formatarTempo(restante, true);
  const rodadas = passo.rodadas.map((r) => `${r.atual}/${r.total}`).join(' · ');
  const titulo = concluido ? t('executar.concluido') : (passo.nome ?? aparencia.rotulo);
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
          accessibilityLabel={t('executar.sair')}
          onPress={() => router.back()}
        >
          <Text style={estilos.sair}>✕</Text>
        </Pressable>
        <Text
          style={estilos.total}
          accessibilityLabel={t('executar.total', {
            tempo: tempoFalado(tempoTotalMs(estado, agora)),
          })}
        >
          {t('executar.total', { tempo: formatarTempo(tempoTotalMs(estado, agora)) })}
        </Text>
      </View>

      <View style={estilos.centro}>
        <Text
          style={estilos.titulo}
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {pronto ? t('executar.pronto') : titulo}
        </Text>
        {!pronto && !concluido && rodadas ? (
          <Text style={estilos.rodadas}>{t('executar.round', { rodadas })}</Text>
        ) : null}
        {!pronto && !concluido ? (
          <Text style={estilos.passos}>
            {t('executar.etapaDe', { n: passo.indice + 1, total: estado.passos.length })}
          </Text>
        ) : null}
        <Text
          style={estilos.relogio}
          accessibilityLabel={relogioFalado}
          accessibilityLiveRegion="none"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {relogio}
        </Text>
        {pausado ? (
          <Text style={estilos.rodadas} accessibilityLiveRegion="polite">
            {t('executar.pausado')}
          </Text>
        ) : null}
      </View>

      <View style={estilos.botoes}>
        {pronto ? (
          <Botao
            rotulo={t('executar.iniciar')}
            grande
            onPress={() => {
              acoes.iniciar();
              if (obterConfiguracoes().notificacoes) {
                void pedirPermissaoNotificacoes().then(setNotificar);
              } else {
                setNotificar(false);
              }
            }}
          />
        ) : concluido ? (
          <>
            <Botao rotulo={t('executar.refazer')} onPress={acoes.reiniciar} />
            <Botao rotulo={t('executar.fechar')} onPress={() => router.back()} />
          </>
        ) : (
          <>
            <Botao rotulo="◀◀" acessibilidade={t('geral.voltar')} onPress={acoes.voltar} />
            <Botao
              rotulo={pausado ? t('executar.retomar') : t('executar.pausar')}
              grande
              onPress={pausado ? acoes.retomar : acoes.pausar}
            />
            <Botao
              rotulo={manual ? t('executar.proxima') : '▶▶'}
              acessibilidade={t('executar.avancar')}
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
  sair: {
    color: '#fff',
    fontSize: 28,
    minWidth: 48,
    minHeight: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  total: { color: '#fff', fontSize: 16, fontVariant: ['tabular-nums'] },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  titulo: { color: '#fff', fontSize: 40, fontWeight: '800', textAlign: 'center' },
  rodadas: { color: '#fff', fontSize: 22 },
  passos: { color: '#fff', fontSize: 16 },
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
