import { comTreino, semTreino } from '../armazenamento';
import {
  medidas,
  normalizarSimples,
  normalizarTreino,
  novoTreinoSimples,
  paraTreino,
  simplesParaAvancado,
} from '../modelo';

jest.mock('expo-sqlite/kv-store', () => ({ __esModule: true, default: {} }));

describe('normalizarSimples', () => {
  it('rejeita lixo e exige id', () => {
    expect(normalizarSimples(null)).toBeNull();
    expect(normalizarSimples({ nome: 'x' })).toBeNull();
  });
  it('limita e arredonda os números', () => {
    const t = normalizarSimples({ id: 'a', rounds: 0, segundosRound: 'abc', segundosDescanso: -5 });
    expect(t).toMatchObject({ rounds: 1, segundosRound: 20, segundosDescanso: 0 });
    expect(normalizarSimples({ id: 'a', rounds: 500 })?.rounds).toBe(99);
  });
});

describe('treino', () => {
  it('calcula a duração sem descanso final', () => {
    const t = { ...novoTreinoSimples('a'), rounds: 3, segundosRound: 20, segundosDescanso: 10 };
    expect(medidas(t)?.segundos).toBe(80);
  });
  it('mantém o último descanso quando há desaquecimento depois', () => {
    const t = {
      ...novoTreinoSimples('a'),
      rounds: 2,
      segundosRound: 20,
      segundosDescanso: 10,
      segundosDesaquecimento: 5,
    };
    expect(medidas(t)?.segundos).toBe(65);
  });
  it('vira um Treino do motor', () => {
    expect(paraTreino(novoTreinoSimples('a')).nome).toBe('Treino');
  });
});

describe('registros salvos', () => {
  it('registro da fase 3 (sem modo) continua carregando como simples', () => {
    const antigo = { id: 'a', nome: 'Tabata', rounds: 8, segundosRound: 20, segundosDescanso: 10 };
    expect(normalizarTreino(antigo)).toMatchObject({ modo: 'simples', rounds: 8 });
  });
  it('registro avançado não é achatado em simples', () => {
    const t = simplesParaAvancado(novoTreinoSimples('a'));
    expect(normalizarTreino(JSON.parse(JSON.stringify(t)))).toEqual(t);
  });
  it('converter para avançado preserva os passos e a duração', () => {
    const s = { ...novoTreinoSimples('a'), segundosAquecimento: 10 };
    expect(paraTreino(simplesParaAvancado(s)).itens).toEqual(paraTreino(s).itens);
    expect(medidas(simplesParaAvancado(s))).toEqual(medidas(s));
  });
});

describe('lista', () => {
  it('insere, substitui e remove', () => {
    const a = novoTreinoSimples('a');
    const l1 = comTreino([], a);
    expect(comTreino(l1, { ...a, nome: 'Novo' })).toHaveLength(1);
    expect(semTreino(l1, 'a')).toEqual([]);
  });
});
