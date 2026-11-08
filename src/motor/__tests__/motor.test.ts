import {
  avancar,
  compilar,
  criar,
  decorridoNoPassoMs,
  duracaoTotal,
  iniciar,
  livreDuracoesDasVoltas,
  livreIniciar,
  livreInicial,
  livrePausar,
  livreVolta,
  livreDecorridoMs,
  passoAtual,
  proximasTransicoes,
  pausar,
  restanteMs,
  retomar,
  tempoTotalMs,
  tick,
  treinoDeRounds,
  validar,
  voltar,
  type Treino,
} from '..';

const S = 1000;

const rounds = (extra = {}) =>
  treinoDeRounds('t', 'Teste', { rounds: 3, segundosRound: 20, segundosDescanso: 10, ...extra });

describe('compilar', () => {
  it('desdobra os rounds e tira o descanso final', () => {
    const passos = compilar(rounds());
    expect(passos.map((p) => p.categoria)).toEqual([
      'trabalho',
      'descanso',
      'trabalho',
      'descanso',
      'trabalho',
    ]);
    expect(passos.map((p) => p.indice)).toEqual([0, 1, 2, 3, 4]);
    expect(passos[4].rodadas).toEqual([{ atual: 3, total: 3 }]);
  });

  it('mantém o descanso final quando pedido', () => {
    expect(compilar(rounds(), { removerDescansoFinal: false })).toHaveLength(6);
  });

  it('mantém o descanso que vem antes do desaquecimento', () => {
    const passos = compilar(rounds({ segundosDesaquecimento: 60 }));
    expect(passos.map((p) => p.categoria).slice(-2)).toEqual(['descanso', 'desaquecer']);
  });

  it('sem descanso configurado não cria a etapa; aquecimento entra antes', () => {
    const passos = compilar(rounds({ segundosDescanso: 0, segundosAquecimento: 30 }));
    expect(passos.map((p) => p.categoria)).toEqual(['aquecer', 'trabalho', 'trabalho', 'trabalho']);
  });

  it('repetições aninhadas registram a rodada de cada nível', () => {
    const treino: Treino = {
      id: 'a',
      nome: 'Aninhado',
      itens: [
        {
          tipo: 'repeticao',
          id: 'ext',
          vezes: 2,
          itens: [
            {
              tipo: 'repeticao',
              id: 'int',
              vezes: 3,
              itens: [
                {
                  tipo: 'etapa',
                  id: 'e',
                  categoria: 'trabalho',
                  fim: { tipo: 'tempo', segundos: 5 },
                },
              ],
            },
            { tipo: 'etapa', id: 'd', categoria: 'descanso', fim: { tipo: 'tempo', segundos: 30 } },
          ],
        },
      ],
    };
    const passos = compilar(treino);
    // (3 trabalhos + 1 descanso) x 2, menos o descanso final
    expect(passos).toHaveLength(7);
    expect(passos[5].rodadas).toEqual([
      { atual: 2, total: 2 },
      { atual: 2, total: 3 },
    ]);
  });

  it('duracaoTotal soma os tempos e avisa sobre etapas manuais', () => {
    expect(duracaoTotal(compilar(rounds()))).toEqual({ segundos: 80, temManual: false });
    const aberto: Treino = {
      id: 'x',
      nome: 'x',
      itens: [{ tipo: 'etapa', id: 'm', categoria: 'livre', fim: { tipo: 'manual' } }],
    };
    expect(duracaoTotal(compilar(aberto))).toEqual({ segundos: 0, temManual: true });
  });
});

describe('validar', () => {
  it('aceita um treino de rounds', () => expect(validar(rounds())).toEqual([]));
  it('rejeita treino vazio, repetição vazia, vezes inválidas e tempo zero', () => {
    expect(validar({ id: 'v', nome: 'v', itens: [] })).toHaveLength(1);
    const ruim: Treino = {
      id: 'r',
      nome: 'r',
      itens: [
        { tipo: 'repeticao', id: 'a', vezes: 0, itens: [] },
        { tipo: 'etapa', id: 'b', categoria: 'trabalho', fim: { tipo: 'tempo', segundos: 0 } },
      ],
    };
    expect(validar(ruim)).toHaveLength(3);
  });
});

describe('máquina', () => {
  const nova = () => criar(compilar(rounds()));

  it('não conta antes de iniciar', () => {
    const e = nova();
    expect(e.status).toBe('pronto');
    expect(decorridoNoPassoMs(e, 5 * S)).toBe(0);
    expect(tick(e, 99 * S).eventos).toEqual([]);
  });

  it('conta o restante a partir do início', () => {
    const e = iniciar(nova(), 1000);
    expect(restanteMs(e, 1000 + 5 * S)).toBe(15 * S);
  });

  it('pausa e retoma sem contar o tempo parado', () => {
    let e = iniciar(nova(), 0);
    e = pausar(e, 8 * S);
    expect(decorridoNoPassoMs(e, 100 * S)).toBe(8 * S);
    e = retomar(e, 100 * S);
    expect(restanteMs(e, 104 * S)).toBe(8 * S);
  });

  it('troca de etapa no instante certo, com um evento', () => {
    const e = iniciar(nova(), 0);
    const antes = tick(e, 19_999);
    expect(antes.eventos).toEqual([]);
    const { estado, eventos } = tick(e, 20 * S);
    expect(eventos).toEqual([{ tipo: 'troca', de: 0, para: 1 }]);
    expect(passoAtual(estado).categoria).toBe('descanso');
    expect(restanteMs(estado, 20 * S)).toBe(10 * S);
  });

  it('atravessa várias etapas de uma vez e preserva o excedente (app em segundo plano)', () => {
    const e = iniciar(nova(), 0);
    // 20 trabalho + 10 descanso + 20 trabalho = 50; 3 s a mais caem no descanso seguinte
    const { estado, eventos } = tick(e, 53 * S);
    expect(eventos).toEqual([
      { tipo: 'troca', de: 0, para: 1 },
      { tipo: 'troca', de: 1, para: 2 },
      { tipo: 'troca', de: 2, para: 3 },
    ]);
    expect(estado.indice).toBe(3);
    expect(restanteMs(estado, 53 * S)).toBe(7 * S);
    expect(tempoTotalMs(estado, 53 * S)).toBe(53 * S);
  });

  it('conclui ao fim do último passo e para de contar', () => {
    const e = iniciar(nova(), 0);
    const { estado, eventos } = tick(e, 500 * S);
    expect(eventos.at(-1)).toEqual({ tipo: 'fim' });
    expect(estado.status).toBe('concluido');
    expect(tempoTotalMs(estado, 900 * S)).toBe(80 * S);
    expect(tick(estado, 1000 * S).eventos).toEqual([]);
  });

  it('etapa manual espera o toque e carrega o excedente', () => {
    const treino: Treino = {
      id: 'm',
      nome: 'm',
      itens: [
        { tipo: 'etapa', id: 'a', categoria: 'aquecer', fim: { tipo: 'tempo', segundos: 5 } },
        { tipo: 'etapa', id: 'b', categoria: 'trabalho', fim: { tipo: 'manual' } },
        { tipo: 'etapa', id: 'c', categoria: 'descanso', fim: { tipo: 'tempo', segundos: 10 } },
      ],
    };
    // Mantém o descanso final: sem isso ele seria removido e a etapa manual seria a última.
    let e = iniciar(criar(compilar(treino, { removerDescansoFinal: false })), 0);
    const r = tick(e, 60 * S);
    e = r.estado;
    expect(e.indice).toBe(1);
    expect(r.eventos).toHaveLength(1); // não passa da etapa manual
    expect(restanteMs(e, 60 * S)).toBeNull();
    const t = avancar(e, 62 * S);
    expect(t.eventos).toEqual([{ tipo: 'troca', de: 1, para: 2 }]);
    expect(restanteMs(t.estado, 62 * S)).toBe(10 * S);
    expect(tempoTotalMs(t.estado, 62 * S)).toBe(62 * S);
  });

  it('avancar pula a etapa e conclui na última', () => {
    let e = iniciar(nova(), 0);
    for (let i = 0; i < 4; i++) e = avancar(e, 1 * S).estado;
    expect(e.indice).toBe(4);
    const fim = avancar(e, 2 * S);
    expect(fim.eventos).toEqual([{ tipo: 'fim' }]);
    expect(fim.estado.status).toBe('concluido');
  });

  it('voltar: reinicia a etapa depois de 3 s, volta uma antes disso', () => {
    let e = iniciar(nova(), 0);
    e = tick(e, 22 * S).estado; // em descanso, 2 s dentro
    const v1 = voltar(e, 22 * S);
    expect(v1.indice).toBe(0);
    expect(restanteMs(v1, 22 * S)).toBe(20 * S);
    expect(tempoTotalMs(v1, 22 * S)).toBe(0);

    const e2 = tick(iniciar(nova(), 0), 26 * S).estado; // 6 s dentro do descanso
    const v2 = voltar(e2, 26 * S);
    expect(v2.indice).toBe(1);
    expect(restanteMs(v2, 26 * S)).toBe(10 * S);
  });

  it('voltar para uma etapa manual já terminada desconta o tempo real dela do total', () => {
    const treino: Treino = {
      id: 'v',
      nome: 'v',
      itens: [
        { tipo: 'etapa', id: 'a', categoria: 'trabalho', fim: { tipo: 'manual' } },
        { tipo: 'etapa', id: 'b', categoria: 'descanso', fim: { tipo: 'tempo', segundos: 30 } },
        { tipo: 'etapa', id: 'c', categoria: 'trabalho', fim: { tipo: 'tempo', segundos: 30 } },
      ],
    };
    let e = iniciar(criar(compilar(treino, { removerDescansoFinal: false })), 0);
    e = avancar(e, 42 * S).estado; // a manual durou 42 s
    expect(tempoTotalMs(e, 44 * S)).toBe(44 * S);
    const v = voltar(e, 44 * S); // 2 s na etapa 'b' (< 3 s): volta para a manual
    expect(v.indice).toBe(0);
    expect(tempoTotalMs(v, 44 * S)).toBe(0);
    expect(v.terminadosMs).toEqual([]);
  });

  it('não muda estado em chamadas fora de ordem', () => {
    const e = nova();
    expect(pausar(e, 1)).toBe(e);
    expect(retomar(e, 1)).toBe(e);
    expect(avancar(e, 1).estado).toBe(e);
    expect(() => criar([])).toThrow();
  });
});

describe('cronômetro livre', () => {
  it('conta para cima, pausa e marca voltas', () => {
    let e = livreIniciar(livreInicial(), 0);
    e = livreVolta(e, 30 * S);
    e = livrePausar(e, 45 * S);
    expect(livreDecorridoMs(e, 999 * S)).toBe(45 * S);
    e = livreIniciar(e, 100 * S);
    e = livreVolta(e, 110 * S);
    expect(e.marcas).toEqual([30 * S, 55 * S]);
    expect(livreDuracoesDasVoltas(e)).toEqual([30 * S, 25 * S]);
  });
});

describe('proximasTransicoes', () => {
  it('lista as trocas por tempo e termina no fim', () => {
    const e = iniciar(criar(compilar(rounds())), 0);
    const t = proximasTransicoes(e, 5 * S, 10);
    expect(t.map((x) => x.em)).toEqual(
      [20 * S + 5 * S - 5 * S, 30 * S, 50 * S, 60 * S, 80 * S].map((x) => x),
    );
    expect(t[t.length - 1].evento.tipo).toBe('fim');
  });

  it('respeita o máximo e não agenda nada fora de "contando"', () => {
    const e = criar(compilar(rounds()));
    expect(proximasTransicoes(e, 0, 5)).toEqual([]);
    expect(proximasTransicoes(iniciar(e, 0), 0, 2)).toHaveLength(2);
  });

  it('para numa etapa de fim manual', () => {
    const treino: Treino = {
      id: 'm',
      nome: 'M',
      itens: [
        { tipo: 'etapa', id: 'a', categoria: 'trabalho', fim: { tipo: 'tempo', segundos: 10 } },
        { tipo: 'etapa', id: 'b', categoria: 'livre', fim: { tipo: 'manual' } },
        { tipo: 'etapa', id: 'c', categoria: 'trabalho', fim: { tipo: 'tempo', segundos: 10 } },
      ],
    };
    const e = iniciar(criar(compilar(treino)), 0);
    expect(proximasTransicoes(e, 0, 10).map((x) => x.em)).toEqual([10 * S]);
  });
});
