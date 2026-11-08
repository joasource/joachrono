import { comTreino, semTreino } from '../armazenamento';
import { duracaoTotalSegundos, normalizar, novoTreinoSimples, paraTreino } from '../modelo';

jest.mock('expo-sqlite/kv-store', () => ({ __esModule: true, default: {} }));

describe('normalizar', () => {
  it('rejeita lixo e exige id', () => {
    expect(normalizar(null)).toBeNull();
    expect(normalizar({ nome: 'x' })).toBeNull();
  });
  it('limita e arredonda os números', () => {
    const t = normalizar({ id: 'a', rounds: 0, segundosRound: 'abc', segundosDescanso: -5 });
    expect(t).toMatchObject({ rounds: 1, segundosRound: 20, segundosDescanso: 0 });
    expect(normalizar({ id: 'a', rounds: 500 })?.rounds).toBe(99);
  });
});

describe('treino', () => {
  it('calcula a duração sem descanso final', () => {
    const t = { ...novoTreinoSimples('a'), rounds: 3, segundosRound: 20, segundosDescanso: 10 };
    expect(duracaoTotalSegundos(t)).toBe(80);
  });
  it('vira um Treino do motor', () => {
    expect(paraTreino(novoTreinoSimples('a')).nome).toBe('Treino');
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
