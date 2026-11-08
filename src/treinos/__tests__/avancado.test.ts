import type { Item } from '../../motor';
import {
  adicionarItem,
  atualizarItem,
  contarPassos,
  LIMITES_AVANCADO,
  medidasAvancado,
  moverItem,
  normalizarAvancado,
  normalizarItens,
  problemas,
  removerItem,
  type TreinoAvancado,
} from '../avancado';

const etapa = (
  id: string,
  segundos = 10,
  categoria: 'trabalho' | 'descanso' = 'trabalho',
): Item => ({
  tipo: 'etapa',
  id,
  categoria,
  fim: { tipo: 'tempo', segundos },
});
const rep = (id: string, vezes: number, itens: Item[]): Item => ({
  tipo: 'repeticao',
  id,
  vezes,
  itens,
});

describe('normalizarItens', () => {
  it('descarta nós inválidos e limita números', () => {
    const itens = normalizarItens([
      null,
      { tipo: 'outra' },
      { tipo: 'etapa', id: 'a', categoria: 'xx', fim: { tipo: 'tempo', segundos: 99999 } },
      { tipo: 'repeticao', id: 'r', vezes: 500, itens: 'lixo' },
    ]);
    expect(itens).toHaveLength(2);
    expect(itens[0]).toMatchObject({
      categoria: 'trabalho',
      fim: { tipo: 'tempo', segundos: 3600 },
    });
    expect(itens[1]).toMatchObject({ vezes: 99, itens: [] });
  });
  it('não aceita repetição dentro de repetição', () => {
    let t: unknown = [];
    for (let i = 0; i < 6; i++) t = [{ tipo: 'repeticao', id: `r${i}`, vezes: 2, itens: t }];
    const prof = (itens: Item[]): number =>
      itens.reduce((m, i) => Math.max(m, i.tipo === 'repeticao' ? 1 + prof(i.itens) : 0), 0);
    expect(prof(normalizarItens(t))).toBe(LIMITES_AVANCADO.profundidade);
  });
  it('troca ids repetidos ou ausentes por ids únicos', () => {
    const itens = normalizarItens([
      { tipo: 'etapa', id: 'x', fim: { tipo: 'manual' } },
      { tipo: 'etapa', id: 'x', fim: { tipo: 'manual' } },
      { tipo: 'etapa', fim: { tipo: 'manual' } },
    ]);
    expect(new Set(itens.map((i) => i.id)).size).toBe(3);
  });
  it('exige id no treino', () => {
    expect(normalizarAvancado({ itens: [] })).toBeNull();
  });
});

describe('operações na árvore', () => {
  const base = [etapa('a'), rep('r', 2, [etapa('b'), etapa('c')])];
  it('adiciona na raiz e dentro da repetição', () => {
    expect(adicionarItem(base, null, etapa('n')).map((i) => i.id)).toEqual(['a', 'r', 'n']);
    const r = adicionarItem(base, 'r', etapa('n'))[1];
    expect(r.tipo === 'repeticao' && r.itens.map((i) => i.id)).toEqual(['b', 'c', 'n']);
  });
  it('move só entre irmãos e não passa das pontas', () => {
    expect(moverItem(base, 'a', -1)).toBe(base);
    expect(moverItem(base, 'a', 1).map((i) => i.id)).toEqual(['r', 'a']);
    const r = moverItem(base, 'c', -1)[1];
    expect(r.tipo === 'repeticao' && r.itens.map((i) => i.id)).toEqual(['c', 'b']);
  });
  it('remove e atualiza em qualquer nível, sem mutar o original', () => {
    expect(contarPassos(removerItem(base, 'b'))).toBe(1 + 2);
    const novo = atualizarItem(base, 'r', (i) => (i.tipo === 'repeticao' ? { ...i, vezes: 5 } : i));
    expect(novo[1]).toMatchObject({ vezes: 5 });
    expect(base[1]).toMatchObject({ vezes: 2 });
  });
});

describe('validação e medidas', () => {
  it('avisa treino vazio e repetição vazia', () => {
    expect(problemas([]).geral).toHaveLength(1);
    expect(problemas([rep('r', 2, [])]).porId).toHaveProperty('r');
    expect(problemas(base())).toEqual({ geral: [], porId: {} });
  });
  it('barra treinos grandes demais', () => {
    const grande = rep('a', 99, [rep('b', 99, [etapa('c')])]);
    expect(problemas([grande]).geral).toHaveLength(1);
    const t: TreinoAvancado = { modo: 'avancado', id: 'x', nome: '', itens: [grande] };
    expect(medidasAvancado(t)).toBeNull();
  });
  it('mede a duração sem o descanso final', () => {
    const t: TreinoAvancado = {
      modo: 'avancado',
      id: 'x',
      nome: '',
      itens: [rep('r', 3, [etapa('w', 20), etapa('d', 10, 'descanso')])],
    };
    expect(medidasAvancado(t)).toEqual({ segundos: 80, temManual: false, passos: 5 });
  });
});

function base(): Item[] {
  return [etapa('a'), rep('r', 2, [etapa('b')])];
}
