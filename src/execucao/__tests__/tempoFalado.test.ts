import { i18n } from '../../i18n/t';
import { tempoFalado } from '../aparencia';

describe('tempoFalado', () => {
  afterEach(() => {
    i18n.locale = 'pt';
  });

  it('fala o tempo por extenso em português, com plural', () => {
    i18n.locale = 'pt';
    expect(tempoFalado(0)).toBe('0 segundos');
    expect(tempoFalado(1000)).toBe('1 segundo');
    expect(tempoFalado(60_000)).toBe('1 minuto');
    expect(tempoFalado(90_000)).toBe('1 minuto e 30 segundos');
    expect(tempoFalado(3_725_000)).toBe('1 hora, 2 minutos e 5 segundos');
  });

  it('fala em inglês', () => {
    i18n.locale = 'en';
    expect(tempoFalado(125_000)).toBe('2 minutes and 5 seconds');
  });

  it('arredonda para cima como o relógio', () => {
    i18n.locale = 'pt';
    expect(tempoFalado(1500, true)).toBe('2 segundos');
    expect(tempoFalado(1500)).toBe('1 segundo');
  });
});
