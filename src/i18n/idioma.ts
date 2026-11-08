import { getLocales } from 'expo-localization';
import { AppState } from 'react-native';

import { i18n } from './t';

/** Português se o aparelho estiver em português; qualquer outro idioma cai no inglês. */
export function aplicarIdiomaDoAparelho() {
  i18n.locale = getLocales()[0]?.languageCode === 'pt' ? 'pt' : 'en';
}

aplicarIdiomaDoAparelho();
// No Android, mudar o idioma do sistema não reinicia o app: relê ao voltar para o primeiro plano.
AppState.addEventListener('change', (s) => s === 'active' && aplicarIdiomaDoAparelho());
