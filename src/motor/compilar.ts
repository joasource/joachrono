import type { Item, OpcoesCompilacao, Passo, Rodada, Treino } from './tipos';

/** Desdobra as repetições e devolve a lista linear de passos do treino. */
export function compilar(treino: Treino, opcoes: OpcoesCompilacao = {}): Passo[] {
  const { removerDescansoFinal = treino.pularUltimoDescanso ?? true } = opcoes;
  const passos: Passo[] = [];

  const percorrer = (itens: Item[], rodadas: Rodada[]): void => {
    for (const item of itens) {
      if (item.tipo === 'etapa') {
        passos.push({
          indice: passos.length,
          etapaId: item.id,
          categoria: item.categoria,
          nome: item.nome,
          fim: item.fim,
          rodadas,
        });
        continue;
      }
      for (let atual = 1; atual <= item.vezes; atual++) {
        percorrer(item.itens, [...rodadas, { atual, total: item.vezes }]);
      }
    }
  };
  percorrer(treino.itens, []);

  if (removerDescansoFinal) {
    while (passos.length > 1 && passos[passos.length - 1].categoria === 'descanso') {
      passos.pop();
    }
  }
  return passos;
}

/** Duração somada dos passos por tempo; `temManual` avisa que o total real pode ser maior. */
export function duracaoTotal(passos: Passo[]): { segundos: number; temManual: boolean } {
  let segundos = 0;
  let temManual = false;
  for (const passo of passos) {
    if (passo.fim.tipo === 'tempo') segundos += passo.fim.segundos;
    else temManual = true;
  }
  return { segundos, temManual };
}

/** Erros que impedem o treino de rodar (a interface mostra e bloqueia o botão de iniciar). */
export function validar(treino: Treino): string[] {
  const erros: string[] = [];

  const percorrer = (itens: Item[]): void => {
    for (const item of itens) {
      if (item.tipo === 'etapa') {
        if (item.fim.tipo === 'tempo' && !(item.fim.segundos >= 1)) {
          erros.push(`Etapa ${item.id}: o tempo precisa ser de pelo menos 1 segundo.`);
        }
        continue;
      }
      if (!Number.isInteger(item.vezes) || item.vezes < 1) {
        erros.push(`Repetição ${item.id}: o número de vezes precisa ser um inteiro maior que 0.`);
      }
      if (item.itens.length === 0) erros.push(`Repetição ${item.id}: está vazia.`);
      percorrer(item.itens);
    }
  };

  if (treino.itens.length === 0) erros.push('O treino não tem etapas.');
  percorrer(treino.itens);
  return erros;
}

export interface ParametrosRounds {
  rounds: number;
  segundosRound: number;
  segundosDescanso: number;
  /** Aquecimento e desaquecimento são opcionais; 0 ou ausente = não cria a etapa. */
  segundosAquecimento?: number;
  segundosDesaquecimento?: number;
  pularUltimoDescanso?: boolean;
}

/** Atalho do "modo simples": N rounds de trabalho + descanso, com aquecimento/desaquecimento. */
export function treinoDeRounds(id: string, nome: string, p: ParametrosRounds): Treino {
  const itens: Item[] = [];
  if (p.segundosAquecimento) {
    itens.push({
      tipo: 'etapa',
      id: `${id}-aquecer`,
      categoria: 'aquecer',
      fim: { tipo: 'tempo', segundos: p.segundosAquecimento },
    });
  }
  const grupo: Item[] = [
    {
      tipo: 'etapa',
      id: `${id}-trabalho`,
      categoria: 'trabalho',
      fim: { tipo: 'tempo', segundos: p.segundosRound },
    },
  ];
  if (p.segundosDescanso > 0) {
    grupo.push({
      tipo: 'etapa',
      id: `${id}-descanso`,
      categoria: 'descanso',
      fim: { tipo: 'tempo', segundos: p.segundosDescanso },
    });
  }
  itens.push({ tipo: 'repeticao', id: `${id}-rounds`, vezes: p.rounds, itens: grupo });
  if (p.segundosDesaquecimento) {
    itens.push({
      tipo: 'etapa',
      id: `${id}-desaquecer`,
      categoria: 'desaquecer',
      fim: { tipo: 'tempo', segundos: p.segundosDesaquecimento },
    });
  }
  return { id, nome, itens, pularUltimoDescanso: p.pularUltimoDescanso };
}
