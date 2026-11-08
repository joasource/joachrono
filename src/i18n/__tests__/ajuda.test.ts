import { itensDeAjuda } from '../ajuda';
import { i18n } from '../t';

describe('itensDeAjuda', () => {
  it.each(['pt', 'en'])('devolve a lista com título e texto em %s', (locale) => {
    i18n.locale = locale;
    const itens = itensDeAjuda();
    expect(itens.length).toBeGreaterThan(3);
    for (const i of itens) {
      expect(i.titulo).toBeTruthy();
      expect(i.texto).toBeTruthy();
    }
    i18n.locale = 'pt';
  });
});
