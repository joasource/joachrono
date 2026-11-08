import { i18n } from './t';

export interface ItemDeAjuda {
  titulo: string;
  texto: string;
}

/** Itens da página de ajuda no idioma atual (lista em `ajuda.itens` das traduções). */
export function itensDeAjuda(): ItemDeAjuda[] {
  const itens: unknown = i18n.t('ajuda.itens');
  return Array.isArray(itens) ? (itens as ItemDeAjuda[]) : [];
}
