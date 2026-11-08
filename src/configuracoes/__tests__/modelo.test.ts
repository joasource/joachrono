import {
  INTENSIDADES,
  normalizarConfiguracoes,
  PADRAO,
  PERFIL_VIBRACAO,
  VIBRACAO_NOTIFICACAO,
} from '../modelo';

describe('normalizarConfiguracoes', () => {
  it('usa o padrão quando não há nada salvo ou o dado é lixo', () => {
    expect(normalizarConfiguracoes(null)).toEqual(PADRAO);
    expect(normalizarConfiguracoes('x')).toEqual(PADRAO);
    expect(
      normalizarConfiguracoes({
        som: 'sim',
        volume: 'altíssimo',
        contagemSegundos: 7,
        tipoSinal: 'apito',
        intensidadeVibracao: 'violenta',
      }),
    ).toEqual(PADRAO);
  });
  it('mantém valores válidos e completa o que falta', () => {
    const c = normalizarConfiguracoes({ som: false, volume: 'baixo', contagemSegundos: 10 });
    expect(c).toEqual({ ...PADRAO, som: false, volume: 'baixo', contagemSegundos: 10 });
  });
});

describe('tipo de sinal e intensidade da vibração', () => {
  it('guardados antes da v2 (sem os campos novos) ganham o padrão', () => {
    const c = normalizarConfiguracoes({ som: false, volume: 'baixo' });
    expect(c.tipoSinal).toBe('gongo');
    expect(c.intensidadeVibracao).toBe('media');
  });
  it('mantém valores válidos', () => {
    const c = normalizarConfiguracoes({ tipoSinal: 'bipe', intensidadeVibracao: 'forte' });
    expect(c).toEqual({ ...PADRAO, tipoSinal: 'bipe', intensidadeVibracao: 'forte' });
  });
  it('cada intensidade tem padrão de vibração para todos os sinais e para as notificações', () => {
    for (const i of INTENSIDADES) {
      for (const evento of ['contagem', 'troca', 'fim'] as const)
        expect(PERFIL_VIBRACAO[i][evento].length).toBeGreaterThan(0);
      expect(VIBRACAO_NOTIFICACAO[i].length).toBeGreaterThan(1);
    }
  });
  it('a vibração cresce de suave para forte', () => {
    const total = (a: number[]) => a.reduce((x, y) => x + y, 0);
    expect(total(VIBRACAO_NOTIFICACAO.suave)).toBeLessThan(total(VIBRACAO_NOTIFICACAO.media));
    expect(total(VIBRACAO_NOTIFICACAO.media)).toBeLessThan(total(VIBRACAO_NOTIFICACAO.forte));
  });

  it('misturarComMusica: padrão ligado e aceita desligar', () => {
    expect(PADRAO.misturarComMusica).toBe(true);
    expect(normalizarConfiguracoes({ misturarComMusica: false }).misturarComMusica).toBe(false);
    expect(normalizarConfiguracoes({ misturarComMusica: 'x' }).misturarComMusica).toBe(true);
  });
});
