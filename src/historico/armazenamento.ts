import Storage from 'expo-sqlite/kv-store';

import { novoId } from '../treinos/util';
import { comRegistro, normalizarHistorico, semRegistros, vale, type Registro } from './modelo';

// Leitura e escrita síncronas: o registro é gravado ao sair da tela de execução, e o caminho
// síncrono evita corrida entre duas gravações seguidas (concluir e sair logo em seguida).
const CHAVE = 'historico.v1';

export function carregarHistorico(): Registro[] {
  try {
    const bruto = Storage.getItemSync(CHAVE);
    return normalizarHistorico(bruto ? JSON.parse(bruto) : []);
  } catch {
    return [];
  }
}

function gravar(lista: Registro[]) {
  try {
    Storage.setItemSync(CHAVE, JSON.stringify(lista));
  } catch {}
}

export function registrarExecucao(dados: {
  treinoId: string;
  nome: string;
  duracaoMs: number;
  concluido: boolean;
}) {
  if (!vale(dados.duracaoMs, dados.concluido)) return;
  gravar(comRegistro(carregarHistorico(), { id: novoId(), emMs: Date.now(), ...dados }));
}

export function excluirRegistros(ids: ReadonlySet<string>) {
  gravar(semRegistros(carregarHistorico(), ids));
}
