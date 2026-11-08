// Preferências do app (sons, vibração, notificações). Parte pura: sem Expo/React.

export type Volume = 'baixo' | 'medio' | 'alto';
export const VOLUMES: Volume[] = ['baixo', 'medio', 'alto'];
/** Ganho aplicado aos sinais (1 = volume cheio do arquivo). */
export const GANHO_DO_VOLUME: Record<Volume, number> = { baixo: 0.35, medio: 0.65, alto: 1 };

/** Quantos segundos antes da troca começam os bipes de contagem (0 = sem contagem). */
export const CONTAGENS = [0, 3, 5, 10] as const;
export type ContagemSegundos = (typeof CONTAGENS)[number];

export interface Configuracoes {
  /** Liga/desliga todos os sons dos sinais. */
  som: boolean;
  volume: Volume;
  vibracao: boolean;
  contagemSegundos: ContagemSegundos;
  /** Avisos do sistema nas trocas de etapa (úteis com o app em segundo plano). */
  notificacoes: boolean;
  /**
   * Toca os sinais com a tela bloqueada. No Android isso exige áudio exclusivo, então pausa a
   * música de outros apps enquanto a tela está bloqueada.
   */
  sinaisBloqueado: boolean;
}

export const PADRAO: Configuracoes = {
  som: true,
  volume: 'alto',
  vibracao: true,
  contagemSegundos: 3,
  notificacoes: true,
  sinaisBloqueado: true,
};

/** Aceita qualquer coisa vinda do disco e devolve configurações válidas (campos ruins viram o padrão). */
export function normalizarConfiguracoes(bruto: unknown): Configuracoes {
  const b = (typeof bruto === 'object' && bruto !== null ? bruto : {}) as Record<string, unknown>;
  const booleano = (v: unknown, padrao: boolean) => (typeof v === 'boolean' ? v : padrao);
  return {
    som: booleano(b.som, PADRAO.som),
    volume: VOLUMES.includes(b.volume as Volume) ? (b.volume as Volume) : PADRAO.volume,
    vibracao: booleano(b.vibracao, PADRAO.vibracao),
    contagemSegundos: CONTAGENS.includes(b.contagemSegundos as ContagemSegundos)
      ? (b.contagemSegundos as ContagemSegundos)
      : PADRAO.contagemSegundos,
    notificacoes: booleano(b.notificacoes, PADRAO.notificacoes),
    sinaisBloqueado: booleano(b.sinaisBloqueado, PADRAO.sinaisBloqueado),
  };
}
