// Treinos salvos: "simples" (só os números do editor, o `Treino` do motor é derivado deles)
// ou "avançado" (árvore de etapas e repetições). Registros antigos sem `modo` são simples.
import { compilar, duracaoTotal, treinoDeRounds, type Treino } from '../motor';
import {
  medidasAvancado,
  normalizarAvancado,
  paraTreinoAvancado,
  type TreinoAvancado,
} from './avancado';
import { inteiro } from './util';

export interface TreinoSimples {
  modo: 'simples';
  id: string;
  nome: string;
  rounds: number;
  segundosRound: number;
  segundosDescanso: number;
  segundosAquecimento: number;
  segundosDesaquecimento: number;
  /** Sem descanso depois da última repetição (padrão: ligado). */
  pularUltimoDescanso: boolean;
}

export const LIMITES = { rounds: 99, segundos: 3600 };

export function novoTreinoSimples(id: string): TreinoSimples {
  return {
    modo: 'simples',
    id,
    nome: '',
    rounds: 3,
    segundosRound: 60,
    segundosDescanso: 30,
    segundosAquecimento: 0,
    segundosDesaquecimento: 0,
    pularUltimoDescanso: true,
  };
}

export type TreinoSalvo = TreinoSimples | TreinoAvancado;

/** Aceita qualquer coisa vinda do disco ou do formulário e devolve um treino válido (ou null). */
export function normalizarSimples(bruto: unknown): TreinoSimples | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const b = bruto as Record<string, unknown>;
  if (typeof b.id !== 'string' || b.id === '') return null;
  const padrao = novoTreinoSimples(b.id);
  return {
    modo: 'simples',
    id: b.id,
    nome: typeof b.nome === 'string' ? b.nome.trim().slice(0, 60) : '',
    rounds: inteiro(b.rounds, 1, LIMITES.rounds, padrao.rounds),
    segundosRound: inteiro(b.segundosRound, 1, LIMITES.segundos, padrao.segundosRound),
    segundosDescanso: inteiro(b.segundosDescanso, 0, LIMITES.segundos, padrao.segundosDescanso),
    segundosAquecimento: inteiro(b.segundosAquecimento, 0, LIMITES.segundos, 0),
    segundosDesaquecimento: inteiro(b.segundosDesaquecimento, 0, LIMITES.segundos, 0),
    pularUltimoDescanso: b.pularUltimoDescanso !== false,
  };
}

/** Escolhe o modelo pelo campo `modo`; sem ele (registros da fase 3) é simples. */
export function normalizarTreino(bruto: unknown): TreinoSalvo | null {
  const modo =
    typeof bruto === 'object' && bruto !== null ? (bruto as { modo?: unknown }).modo : null;
  return modo === 'avancado' ? normalizarAvancado(bruto) : normalizarSimples(bruto);
}

function paraTreinoSimples(t: TreinoSimples): Treino {
  return treinoDeRounds(t.id, t.nome || 'Treino', t);
}

export function paraTreino(t: TreinoSalvo): Treino {
  return t.modo === 'avancado' ? paraTreinoAvancado(t) : paraTreinoSimples(t);
}

/** Leva um treino simples para o editor avançado (a conversão inversa não existe). */
export function simplesParaAvancado(t: TreinoSimples): TreinoAvancado {
  return {
    modo: 'avancado',
    id: t.id,
    nome: t.nome,
    itens: paraTreinoSimples(t).itens,
    pularUltimoDescanso: t.pularUltimoDescanso,
  };
}

/** Duração/etapas de qualquer treino salvo, medidas sobre os passos que o motor realmente executa. */
export function medidas(
  t: TreinoSalvo,
): { segundos: number; temManual: boolean; passos: number } | null {
  if (t.modo === 'avancado') return medidasAvancado(t);
  const passos = compilar(paraTreinoSimples(t));
  return { ...duracaoTotal(passos), passos: passos.length };
}
