import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { obterConfiguracoes, salvarConfiguracoes } from '../configuracoes/store';
import { carregarHistorico, substituirHistorico } from '../historico/armazenamento';
import { carregarTreinos, salvarTreinos } from '../treinos/armazenamento';
import {
  criarBackup,
  lerBackup,
  mesclarHistorico,
  mesclarTreinos,
  nomeDoArquivo,
  TAMANHO_MAXIMO_BYTES,
  type Backup,
} from './modelo';

/** Grava o backup num arquivo temporário e abre a folha de compartilhar do sistema. */
export async function exportarBackup(tituloDoDialogo: string): Promise<'ok' | 'indisponivel'> {
  if (!(await Sharing.isAvailableAsync())) return 'indisponivel';
  const backup = criarBackup(
    {
      treinos: await carregarTreinos(),
      historico: carregarHistorico(),
      configuracoes: obterConfiguracoes(),
    },
    Date.now(),
  );
  const arquivo = new File(Paths.cache, nomeDoArquivo(new Date()));
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  await arquivo.write(JSON.stringify(backup, null, 2));
  await Sharing.shareAsync(arquivo.uri, {
    mimeType: 'application/json',
    dialogTitle: tituloDoDialogo,
    UTI: 'public.json',
  });
  return 'ok';
}

export type Escolha = { tipo: 'cancelado' } | { tipo: 'invalido' } | { tipo: 'ok'; backup: Backup };

/** Abre o seletor de arquivos e valida o conteúdo; ainda não altera nada no aparelho. */
export async function escolherBackup(): Promise<Escolha> {
  const r = await DocumentPicker.getDocumentAsync({
    type: '*/*', // alguns gerenciadores de arquivos não marcam o .json como application/json
    copyToCacheDirectory: true,
  });
  if (r.canceled) return { tipo: 'cancelado' };
  const asset = r.assets[0];
  if (asset.size !== undefined && asset.size > TAMANHO_MAXIMO_BYTES) return { tipo: 'invalido' };
  try {
    const backup = lerBackup(await new File(asset.uri).text());
    return backup ? { tipo: 'ok', backup } : { tipo: 'invalido' };
  } catch {
    return { tipo: 'invalido' };
  }
}

/** Aplica o backup: mescla treinos e histórico (o do arquivo vence no mesmo id) e troca as configurações. */
export async function aplicarBackup(backup: Backup): Promise<void> {
  await salvarTreinos(mesclarTreinos(await carregarTreinos(), backup.treinos));
  substituirHistorico(mesclarHistorico(carregarHistorico(), backup.historico));
  salvarConfiguracoes(backup.configuracoes);
}
