import { en } from '../en';
import { pt } from '../pt';
import { i18n, t } from '../t';

function chaves(obj: Record<string, unknown>, prefixo = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? chaves(v as Record<string, unknown>, `${prefixo}${k}.`)
      : [`${prefixo}${k}`],
  );
}

describe('i18n', () => {
  afterEach(() => {
    i18n.locale = 'pt';
  });

  it('inglês e português têm as mesmas chaves e variáveis', () => {
    expect(chaves(en)).toEqual(chaves(pt));
    const vars = (s: string) => (s.match(/%\{\w+\}/g) ?? []).sort();
    for (const k of chaves(pt)) {
      const pega = (o: Record<string, unknown>) =>
        k.split('.').reduce<unknown>((x, p) => (x as Record<string, unknown>)[p], o) as string;
      expect(vars(pega(en))).toEqual(vars(pega(pt)));
    }
  });

  it('traduz e interpola', () => {
    expect(t('executar.total', { tempo: '01:00' })).toBe('Total 01:00');
    i18n.locale = 'en';
    expect(t('geral.salvar')).toBe('Save');
    expect(t('executar.etapaDe', { n: 2, total: 5 })).toBe('Step 2 of 5');
  });
});
