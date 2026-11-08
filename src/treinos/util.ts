// Utilitários puros compartilhados pelos modelos de treino (sem Expo/React).

let contador = 0;

export function novoId(): string {
  contador = (contador + 1) % 1296; // 2 dígitos em base 36: evita colisão no mesmo milissegundo
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${contador
    .toString(36)
    .padStart(2, '0')}`;
}

/** Converte para inteiro dentro de [min, max]; valores inválidos viram `padrao`. */
export function inteiro(valor: unknown, min: number, max: number, padrao: number): number {
  const n = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, Math.floor(n)));
}
