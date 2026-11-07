import type { Passo } from './tipos';

// Máquina de estados do cronômetro. Funções puras: recebem o instante atual (`agora`, em ms) como
// argumento e devolvem um novo estado. O tempo NUNCA é contado em ticks — sempre calculado pela
// diferença de timestamps — para não derivar quando o app fica em segundo plano ou a tela bloqueia.
// Quem chama (a tela, ou uma notificação agendada) só precisa chamar `tick` de tempos em tempos:
// se passou da hora de várias etapas, todas são atravessadas de uma vez, sem perder o excedente.

export type Status = 'pronto' | 'contando' | 'pausado' | 'concluido';

export interface Estado {
  passos: Passo[];
  indice: number;
  status: Status;
  /** Tempo já decorrido no passo atual, até `retomadoEm` (ms). */
  acumuladoMs: number;
  /** Instante em que o passo voltou a contar; null se não está contando. */
  retomadoEm: number | null;
  /** Soma do tempo dos passos já terminados (ms). */
  concluidoMs: number;
  /** Quanto durou cada passo já terminado, em ordem; o `voltar` usa para desfazer o total. */
  terminadosMs: number[];
}

export type Evento = { tipo: 'troca'; de: number; para: number } | { tipo: 'fim' };

export function criar(passos: Passo[]): Estado {
  if (passos.length === 0) throw new Error('O treino não tem passos.');
  return {
    passos,
    indice: 0,
    status: 'pronto',
    acumuladoMs: 0,
    retomadoEm: null,
    concluidoMs: 0,
    terminadosMs: [],
  };
}

export function passoAtual(e: Estado): Passo {
  return e.passos[Math.min(e.indice, e.passos.length - 1)];
}

export function decorridoNoPassoMs(e: Estado, agora: number): number {
  const corrente = e.status === 'contando' && e.retomadoEm !== null ? agora - e.retomadoEm : 0;
  return e.acumuladoMs + Math.max(0, corrente);
}

/** Tempo que falta no passo atual; null quando o passo termina por toque (modo aberto). */
export function restanteMs(e: Estado, agora: number): number | null {
  const fim = passoAtual(e).fim;
  if (fim.tipo === 'manual') return null;
  return Math.max(0, fim.segundos * 1000 - decorridoNoPassoMs(e, agora));
}

export function tempoTotalMs(e: Estado, agora: number): number {
  return e.concluidoMs + decorridoNoPassoMs(e, agora);
}

export function iniciar(e: Estado, agora: number): Estado {
  if (e.status !== 'pronto') return e;
  return { ...e, status: 'contando', retomadoEm: agora };
}

export function pausar(e: Estado, agora: number): Estado {
  if (e.status !== 'contando') return e;
  return { ...e, status: 'pausado', acumuladoMs: decorridoNoPassoMs(e, agora), retomadoEm: null };
}

export function retomar(e: Estado, agora: number): Estado {
  if (e.status !== 'pausado') return e;
  return { ...e, status: 'contando', retomadoEm: agora };
}

/** Vai para o passo `para` (ou conclui). `carryMs` é o excedente do passo anterior. */
function irPara(
  e: Estado,
  para: number,
  terminadoMs: number,
  carryMs: number,
  agora: number,
): { estado: Estado; evento: Evento } {
  const concluidoMs = e.concluidoMs + terminadoMs;
  const terminadosMs = [...e.terminadosMs, terminadoMs];
  if (para >= e.passos.length) {
    return {
      estado: {
        ...e,
        status: 'concluido',
        indice: e.passos.length - 1,
        acumuladoMs: 0,
        retomadoEm: null,
        concluidoMs,
        terminadosMs,
      },
      evento: { tipo: 'fim' },
    };
  }
  const contando = e.status === 'contando';
  return {
    estado: {
      ...e,
      indice: para,
      acumuladoMs: carryMs,
      retomadoEm: contando ? agora : null,
      concluidoMs,
      terminadosMs,
    },
    evento: { tipo: 'troca', de: e.indice, para },
  };
}

/** Pula para a próxima etapa (botão "avançar", ou toque numa etapa de fim manual). */
export function avancar(e: Estado, agora: number): { estado: Estado; eventos: Evento[] } {
  if (e.status === 'concluido' || e.status === 'pronto') return { estado: e, eventos: [] };
  const { estado, evento } = irPara(e, e.indice + 1, decorridoNoPassoMs(e, agora), 0, agora);
  return { estado, eventos: [evento] };
}

/** Como um player de música: depois de 3 s na etapa reinicia a atual; antes disso volta uma. */
export function voltar(e: Estado, agora: number): Estado {
  if (e.status === 'pronto' || e.status === 'concluido') return e;
  const contando = e.status === 'contando';
  const reiniciar = e.indice === 0 || decorridoNoPassoMs(e, agora) > 3000;
  const alvo = reiniciar ? e.indice : e.indice - 1;
  // O tempo da etapa abandonada não conta no total: ela será refeita (por isso guardamos a
  // duração real de cada etapa terminada, inclusive as de fim manual).
  const desfeitoMs = reiniciar ? 0 : (e.terminadosMs[alvo] ?? 0);
  return {
    ...e,
    indice: alvo,
    acumuladoMs: 0,
    retomadoEm: contando ? agora : null,
    concluidoMs: e.concluidoMs - desfeitoMs,
    terminadosMs: reiniciar ? e.terminadosMs : e.terminadosMs.slice(0, alvo),
  };
}

/**
 * Atualiza o estado para o instante `agora`: atravessa todas as etapas por tempo que já venceram,
 * carregando o excedente para a seguinte. Devolve os eventos (para tocar som/vibrar).
 */
export function tick(e: Estado, agora: number): { estado: Estado; eventos: Evento[] } {
  if (e.status !== 'contando') return { estado: e, eventos: [] };

  let atual = e;
  let decorrido = decorridoNoPassoMs(e, agora);
  const eventos: Evento[] = [];

  for (;;) {
    const fim = atual.passos[atual.indice].fim;
    if (fim.tipo === 'manual') break;
    const duracao = fim.segundos * 1000;
    if (decorrido < duracao) break;

    const { estado, evento } = irPara(atual, atual.indice + 1, duracao, decorrido - duracao, agora);
    eventos.push(evento);
    atual = estado;
    decorrido -= duracao;
    if (atual.status === 'concluido') break;
  }

  if (eventos.length === 0) return { estado: e, eventos };
  return { estado: atual, eventos };
}
