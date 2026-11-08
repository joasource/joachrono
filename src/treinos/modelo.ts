// Treino do "modo simples": só os números do editor. O `Treino` do motor é derivado deles.
import { treinoDeRounds, type Treino } from '../motor';

export interface TreinoSimples {
  id: string;
  nome: string;
  rounds: number;
  segundosRound: number;
  segundosDescanso: number;
  segundosAquecimento: number;
  segundosDesaquecimento: number;
}

export const LIMITES = { rounds: 99, segundos: 3600 };

export function novoTreinoSimples(id: string): TreinoSimples {
  return {
    id,
    nome: '',
    rounds: 8,
    segundosRound: 20,
    segundosDescanso: 10,
    segundosAquecimento: 0,
    segundosDesaquecimento: 0,
  };
}

function inteiro(valor: unknown, min: number, max: number, padrao: number): number {
  const n = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/** Aceita qualquer coisa vinda do disco ou do formulário e devolve um treino válido (ou null). */
export function normalizar(bruto: unknown): TreinoSimples | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const b = bruto as Record<string, unknown>;
  if (typeof b.id !== 'string' || b.id === '') return null;
  const padrao = novoTreinoSimples(b.id);
  return {
    id: b.id,
    nome: typeof b.nome === 'string' ? b.nome.trim().slice(0, 60) : '',
    rounds: inteiro(b.rounds, 1, LIMITES.rounds, padrao.rounds),
    segundosRound: inteiro(b.segundosRound, 1, LIMITES.segundos, padrao.segundosRound),
    segundosDescanso: inteiro(b.segundosDescanso, 0, LIMITES.segundos, padrao.segundosDescanso),
    segundosAquecimento: inteiro(b.segundosAquecimento, 0, LIMITES.segundos, 0),
    segundosDesaquecimento: inteiro(b.segundosDesaquecimento, 0, LIMITES.segundos, 0),
  };
}

export function paraTreino(t: TreinoSimples): Treino {
  return treinoDeRounds(t.id, t.nome || 'Treino', t);
}

export function duracaoTotalSegundos(t: TreinoSimples): number {
  return (
    t.segundosAquecimento +
    t.segundosDesaquecimento +
    t.rounds * t.segundosRound +
    Math.max(0, t.rounds - 1) * t.segundosDescanso
  );
}
