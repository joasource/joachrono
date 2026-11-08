// Preferências do app (sons, vibração, notificações). Parte pura: sem Expo/React.

export type Volume = 'baixo' | 'medio' | 'alto';
export const VOLUMES: Volume[] = ['baixo', 'medio', 'alto'];
/** Ganho aplicado aos sinais (1 = volume cheio do arquivo). */
export const GANHO_DO_VOLUME: Record<Volume, number> = { baixo: 0.35, medio: 0.65, alto: 1 };

/** Quantos segundos antes da troca começam os bipes de contagem (0 = sem contagem). */
export const CONTAGENS = [0, 3, 5, 10] as const;
export type ContagemSegundos = (typeof CONTAGENS)[number];

/** Som da troca de etapa e do fim: gongo (grave e longo) ou bipe (agudo e seco). */
export const TIPOS_SINAL = ['gongo', 'bipe'] as const;
export type TipoSinal = (typeof TIPOS_SINAL)[number];

export const INTENSIDADES = ['suave', 'media', 'forte'] as const;
export type IntensidadeVibracao = (typeof INTENSIDADES)[number];

/** Um toque do vibrador: `atrasoMs` conta a partir do início do sinal. */
export interface ToqueHaptico {
  tipo: 'leve' | 'media' | 'forte' | 'sucesso';
  atrasoMs: number;
}
export type EventoSinal = 'contagem' | 'troca' | 'fim';

/** O que vibrar em cada sinal, por intensidade (a média é o comportamento original do app). */
export const PERFIL_VIBRACAO: Record<IntensidadeVibracao, Record<EventoSinal, ToqueHaptico[]>> = {
  suave: {
    contagem: [{ tipo: 'leve', atrasoMs: 0 }],
    troca: [{ tipo: 'leve', atrasoMs: 0 }],
    fim: [{ tipo: 'leve', atrasoMs: 0 }],
  },
  media: {
    contagem: [{ tipo: 'leve', atrasoMs: 0 }],
    troca: [{ tipo: 'forte', atrasoMs: 0 }],
    fim: [{ tipo: 'sucesso', atrasoMs: 0 }],
  },
  forte: {
    contagem: [{ tipo: 'media', atrasoMs: 0 }],
    troca: [
      { tipo: 'forte', atrasoMs: 0 },
      { tipo: 'forte', atrasoMs: 160 },
    ],
    fim: [
      { tipo: 'forte', atrasoMs: 0 },
      { tipo: 'forte', atrasoMs: 160 },
      { tipo: 'forte', atrasoMs: 320 },
    ],
  },
};

/** Padrão de vibração (ms: pausa, vibra, pausa, ...) das notificações do Android. */
export const VIBRACAO_NOTIFICACAO: Record<IntensidadeVibracao, number[]> = {
  suave: [0, 120],
  media: [0, 250, 150, 250],
  forte: [0, 500, 150, 500, 150, 500],
};

export interface Configuracoes {
  /** Liga/desliga todos os sons dos sinais. */
  som: boolean;
  volume: Volume;
  vibracao: boolean;
  intensidadeVibracao: IntensidadeVibracao;
  /** Sinal da troca de etapa e do fim (a contagem regressiva é sempre bipe curto). */
  tipoSinal: TipoSinal;
  contagemSegundos: ContagemSegundos;
  /** Avisos do sistema nas trocas de etapa (úteis com o app em segundo plano). */
  notificacoes: boolean;
  /** Toca os sinais com a tela bloqueada, por um áudio nativo (a tela de bloqueio mostra o controle de mídia). */
  sinaisBloqueado: boolean;
  /**
   * Com a tela bloqueada, os sinais tocam por cima da música de outros apps (ligado) ou pausam a
   * música (desligado, áudio exclusivo `doNotMix`).
   */
  misturarComMusica: boolean;
}

export const PADRAO: Configuracoes = {
  som: true,
  volume: 'alto',
  vibracao: true,
  intensidadeVibracao: 'media',
  tipoSinal: 'gongo',
  contagemSegundos: 3,
  notificacoes: true,
  sinaisBloqueado: true,
  misturarComMusica: true,
};

/** Aceita qualquer coisa vinda do disco e devolve configurações válidas (campos ruins viram o padrão). */
export function normalizarConfiguracoes(bruto: unknown): Configuracoes {
  const b = (typeof bruto === 'object' && bruto !== null ? bruto : {}) as Record<string, unknown>;
  const booleano = (v: unknown, padrao: boolean) => (typeof v === 'boolean' ? v : padrao);
  return {
    som: booleano(b.som, PADRAO.som),
    volume: VOLUMES.includes(b.volume as Volume) ? (b.volume as Volume) : PADRAO.volume,
    vibracao: booleano(b.vibracao, PADRAO.vibracao),
    intensidadeVibracao: INTENSIDADES.includes(b.intensidadeVibracao as IntensidadeVibracao)
      ? (b.intensidadeVibracao as IntensidadeVibracao)
      : PADRAO.intensidadeVibracao,
    tipoSinal: TIPOS_SINAL.includes(b.tipoSinal as TipoSinal)
      ? (b.tipoSinal as TipoSinal)
      : PADRAO.tipoSinal,
    contagemSegundos: CONTAGENS.includes(b.contagemSegundos as ContagemSegundos)
      ? (b.contagemSegundos as ContagemSegundos)
      : PADRAO.contagemSegundos,
    notificacoes: booleano(b.notificacoes, PADRAO.notificacoes),
    sinaisBloqueado: booleano(b.sinaisBloqueado, PADRAO.sinaisBloqueado),
    misturarComMusica: booleano(b.misturarComMusica, PADRAO.misturarComMusica),
  };
}
