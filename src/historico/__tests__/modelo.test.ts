import {
  LIMITE_REGISTROS,
  agruparPorDia,
  comRegistro,
  normalizarHistorico,
  resumoSemana,
  semRegistros,
  vale,
  type Registro,
} from '../modelo';

const reg = (id: string, emMs: number, duracaoMs = 60_000, concluido = true): Registro => ({
  id,
  treinoId: 't',
  nome: 'Tabata',
  emMs,
  duracaoMs,
  concluido,
});
const em = (d: number, h: number, mi = 0) => new Date(2026, 10, d, h, mi).getTime();

describe('normalizarHistorico', () => {
  it('descarta lixo e aceita registros válidos', () => {
    const lista = normalizarHistorico([null, { id: 'a' }, { id: 'b', emMs: 5, duracaoMs: -3 }, 7]);
    expect(lista).toEqual([
      { id: 'b', treinoId: '', nome: '', emMs: 5, duracaoMs: 0, concluido: false },
    ]);
    expect(normalizarHistorico('x')).toEqual([]);
  });
});

describe('comRegistro', () => {
  it('põe o novo na frente e respeita o limite', () => {
    let lista: Registro[] = [];
    for (let i = 0; i < LIMITE_REGISTROS + 5; i++) lista = comRegistro(lista, reg(`r${i}`, i));
    expect(lista).toHaveLength(LIMITE_REGISTROS);
    expect(lista[0].id).toBe(`r${LIMITE_REGISTROS + 4}`);
  });
  it('substitui registro com o mesmo id', () => {
    const lista = comRegistro([reg('a', 1)], reg('a', 2));
    expect(lista).toHaveLength(1);
    expect(lista[0].emMs).toBe(2);
  });
});

describe('vale', () => {
  it('concluído sempre vale; parcial só a partir de 10 s', () => {
    expect(vale(1000, true)).toBe(true);
    expect(vale(9_999, false)).toBe(false);
    expect(vale(10_000, false)).toBe(true);
  });
});

describe('agruparPorDia', () => {
  it('agrupa por dia local, do mais recente ao mais antigo, e soma o tempo', () => {
    const dias = agruparPorDia([
      reg('a', em(3, 8), 60_000),
      reg('b', em(5, 20), 30_000),
      reg('c', em(5, 7), 90_000),
    ]);
    expect(dias.map((d) => d.registros.map((r) => r.id))).toEqual([['b', 'c'], ['a']]);
    expect(dias[0].totalMs).toBe(120_000);
  });
});

describe('resumoSemana', () => {
  it('conta hoje e os 6 dias anteriores', () => {
    const agora = em(10, 12);
    const r = resumoSemana(
      [
        reg('hoje', em(10, 8)),
        reg('limite', em(4, 0, 1)),
        reg('fora', em(3, 23)),
        reg('fut', em(11, 1)),
      ],
      agora,
    );
    expect(r).toEqual({ treinos: 2, totalMs: 120_000 });
  });
});

describe('semRegistros', () => {
  it('remove só os ids indicados', () => {
    const lista = [reg('a', 1), reg('b', 2), reg('c', 3)];
    expect(semRegistros(lista, new Set(['a', 'c'])).map((r) => r.id)).toEqual(['b']);
    expect(semRegistros(lista, new Set())).toHaveLength(3);
  });
});
