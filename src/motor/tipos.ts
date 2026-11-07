// Tipos do motor do cronômetro. Este módulo (e todo `src/motor/`) não importa React nem Expo:
// o mesmo código precisa rodar no app, nos testes e, depois, no relógio.

/** Papel da etapa no treino; define cor, som e o tratamento do "descanso final". */
export type CategoriaEtapa = 'aquecer' | 'trabalho' | 'descanso' | 'desaquecer' | 'livre';

/** Como a etapa termina: por tempo, ou quando a pessoa toca para avançar (modo "aberto"). */
export type Fim = { tipo: 'tempo'; segundos: number } | { tipo: 'manual' };

export interface Etapa {
  tipo: 'etapa';
  id: string;
  categoria: CategoriaEtapa;
  /** Nome livre ("Flexões"). Se vazio, a interface mostra o nome da categoria. */
  nome?: string;
  fim: Fim;
}

/** Grupo que se repete `vezes` vezes; pode conter outras repetições. */
export interface Repeticao {
  tipo: 'repeticao';
  id: string;
  vezes: number;
  itens: Item[];
}

export type Item = Etapa | Repeticao;

export interface Treino {
  id: string;
  nome: string;
  itens: Item[];
}

/** Posição dentro de uma repetição: "round 3 de 8". Do grupo mais externo para o mais interno. */
export interface Rodada {
  atual: number;
  total: number;
}

/** Etapa já "desdobrada": o treino vira uma lista linear e a execução é só um índice nela. */
export interface Passo {
  indice: number;
  etapaId: string;
  categoria: CategoriaEtapa;
  nome?: string;
  fim: Fim;
  rodadas: Rodada[];
}

export interface OpcoesCompilacao {
  /**
   * Remove os descansos que sobrariam no fim do treino (depois do último round).
   * Padrão: true — ninguém quer descansar depois de terminar.
   */
  removerDescansoFinal?: boolean;
}
