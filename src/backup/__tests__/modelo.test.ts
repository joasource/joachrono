import { PADRAO } from '../../configuracoes/modelo';
import { novoTreinoSimples, simplesParaAvancado } from '../../treinos/modelo';
import {
  criarBackup,
  lerBackup,
  mesclarHistorico,
  mesclarTreinos,
  nomeDoArquivo,
  resumoDaImportacao,
  VERSAO,
} from '../modelo';

const reg = (id: string, emMs: number) => ({
  id,
  treinoId: 't',
  nome: 'x',
  emMs,
  duracaoMs: 1000,
  concluido: true,
});

describe('backup', () => {
  it('ida e volta preserva treinos (simples e avançado), histórico e configurações', () => {
    const treinos = [
      { ...novoTreinoSimples('a'), nome: 'A' },
      simplesParaAvancado(novoTreinoSimples('b')),
    ];
    const dados = {
      treinos,
      historico: [reg('r1', 5)],
      configuracoes: { ...PADRAO, volume: 'baixo' as const },
    };
    const lido = lerBackup(JSON.stringify(criarBackup(dados, 123)));
    expect(lido).toMatchObject({ versao: VERSAO, exportadoEm: 123, ...dados });
  });

  it('recusa o que não é backup do app, JSON ruim e versão futura', () => {
    expect(lerBackup('não é json')).toBeNull();
    expect(lerBackup('[]')).toBeNull();
    expect(lerBackup('{"formato":"outro","versao":1}')).toBeNull();
    expect(lerBackup('{"formato":"joachrono-backup","versao":99}')).toBeNull();
    expect(lerBackup('{"formato":"joachrono-backup"}')).toBeNull();
  });

  it('descarta itens inválidos em vez de recusar tudo', () => {
    const texto = JSON.stringify({
      formato: 'joachrono-backup',
      versao: 1,
      treinos: [novoTreinoSimples('a'), 42, null],
      historico: [reg('r1', 1), { lixo: true }],
      configuracoes: { volume: 'zzz' },
    });
    const b = lerBackup(texto);
    expect(b?.treinos).toHaveLength(1);
    expect(b?.historico).toHaveLength(1);
    expect(b?.configuracoes).toEqual(PADRAO);
  });
});

describe('mesclar', () => {
  it('treinos: mesmo id é substituído, novos entram no fim, os demais ficam', () => {
    const a = { ...novoTreinoSimples('a'), nome: 'velho' };
    const b = novoTreinoSimples('b');
    const novoA = { ...novoTreinoSimples('a'), nome: 'novo' };
    const c = novoTreinoSimples('c');
    expect(mesclarTreinos([a, b], [novoA, c])).toEqual([novoA, b, c]);
  });

  it('histórico: união por id, mais recente primeiro', () => {
    const r = mesclarHistorico([reg('1', 10), reg('2', 30)], [reg('2', 30), reg('3', 20)]);
    expect(r.map((x) => x.id)).toEqual(['2', '3', '1']);
  });

  it('resumo conta substituídos', () => {
    const atuais = [novoTreinoSimples('a')];
    const backup = criarBackup(
      {
        treinos: [novoTreinoSimples('a'), novoTreinoSimples('b')],
        historico: [reg('r', 1)],
        configuracoes: PADRAO,
      },
      0,
    );
    expect(resumoDaImportacao(atuais, backup)).toEqual({
      treinos: 2,
      substituidos: 1,
      registros: 1,
    });
  });
});

it('nome do arquivo leva a data local', () => {
  expect(nomeDoArquivo(new Date(2026, 10, 8))).toBe('joachrono-backup-2026-11-08.json');
});
