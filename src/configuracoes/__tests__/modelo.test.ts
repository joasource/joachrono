import { normalizarConfiguracoes, PADRAO } from '../modelo';

describe('normalizarConfiguracoes', () => {
  it('usa o padrão quando não há nada salvo ou o dado é lixo', () => {
    expect(normalizarConfiguracoes(null)).toEqual(PADRAO);
    expect(normalizarConfiguracoes('x')).toEqual(PADRAO);
    expect(
      normalizarConfiguracoes({ som: 'sim', volume: 'altíssimo', contagemSegundos: 7 }),
    ).toEqual(PADRAO);
  });
  it('mantém valores válidos e completa o que falta', () => {
    const c = normalizarConfiguracoes({ som: false, volume: 'baixo', contagemSegundos: 10 });
    expect(c).toEqual({ ...PADRAO, som: false, volume: 'baixo', contagemSegundos: 10 });
  });
});
