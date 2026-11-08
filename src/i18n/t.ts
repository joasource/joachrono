import { I18n, type TranslateOptions } from 'i18n-js';

import { en } from './en';
import { pt } from './pt';

// Parte pura (sem Expo): usada pelo app, pelos modelos e pelos testes. O idioma do aparelho é
// definido em `idioma.ts`. Chaves aninhadas ("form.salvar"); variáveis como `%{tempo}`.
export const i18n = new I18n(
  { pt, en },
  { defaultLocale: 'pt', locale: 'pt', enableFallback: true },
);

export function t(chave: string, opcoes?: TranslateOptions): string {
  return i18n.t(chave, opcoes);
}
