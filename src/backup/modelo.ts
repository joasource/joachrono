// Backup em JSON (modelo puro, sem Expo/React): treinos, histórico e configurações num arquivo só.
import { normalizarConfiguracoes, type Configuracoes } from '../configuracoes/modelo';
import { LIMITE_REGISTROS, normalizarHistorico, type Registro } from '../historico/modelo';
import { normalizarTreino, type TreinoSalvo } from '../treinos/modelo';

export const FORMATO = 'joachrono-backup';
/** Versão do formato do arquivo; arquivos de versão maior são recusados em vez de lidos pela metade. */
export const VERSAO = 1;
/** Acima disso o arquivo não é um backup do app (e pode travar o aparelho ao ler). */
export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

export interface Backup {
  formato: typeof FORMATO;
  versao: number;
  /** Instante da exportação (ms desde 1970). */
  exportadoEm: number;
  treinos: TreinoSalvo[];
  historico: Registro[];
  configuracoes: Configuracoes;
}

export function criarBackup(
  dados: { treinos: TreinoSalvo[]; historico: Registro[]; configuracoes: Configuracoes },
  agora: number,
): Backup {
  return { formato: FORMATO, versao: VERSAO, exportadoEm: agora, ...dados };
}

/** Texto do arquivo → backup validado, ou null se não for um backup do joaChrono (ou for de versão futura). */
export function lerBackup(texto: string): Backup | null {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return null;
  }
  if (typeof bruto !== 'object' || bruto === null) return null;
  const b = bruto as Record<string, unknown>;
  if (b.formato !== FORMATO) return null;
  if (typeof b.versao !== 'number' || !(b.versao >= 1) || b.versao > VERSAO) return null;
  const treinos = Array.isArray(b.treinos)
    ? b.treinos.map(normalizarTreino).filter((t): t is TreinoSalvo => t !== null)
    : [];
  return {
    formato: FORMATO,
    versao: b.versao,
    exportadoEm: typeof b.exportadoEm === 'number' ? b.exportadoEm : 0,
    treinos,
    historico: normalizarHistorico(b.historico),
    configuracoes: normalizarConfiguracoes(b.configuracoes),
  };
}

/** Treinos do backup entram; se o id já existe, a versão do backup substitui a atual. Os demais ficam. */
export function mesclarTreinos(atuais: TreinoSalvo[], importados: TreinoSalvo[]): TreinoSalvo[] {
  const porId = new Map(importados.map((t) => [t.id, t]));
  const usados = new Set<string>();
  const resultado = atuais.map((t) => {
    const novo = porId.get(t.id);
    if (!novo) return t;
    usados.add(t.id);
    return novo;
  });
  return [...resultado, ...importados.filter((t) => !usados.has(t.id))];
}

/** União pelo id (o do backup vence), do mais recente ao mais antigo, até o limite. */
export function mesclarHistorico(atual: Registro[], importados: Registro[]): Registro[] {
  const porId = new Map<string, Registro>();
  for (const r of atual) porId.set(r.id, r);
  for (const r of importados) porId.set(r.id, r);
  return [...porId.values()].sort((a, b) => b.emMs - a.emMs).slice(0, LIMITE_REGISTROS);
}

/** Quantos itens o backup traria de novo e quantos substituiriam algo (para a confirmação). */
export function resumoDaImportacao(
  atuais: TreinoSalvo[],
  backup: Backup,
): { treinos: number; substituidos: number; registros: number } {
  const ids = new Set(atuais.map((t) => t.id));
  return {
    treinos: backup.treinos.length,
    substituidos: backup.treinos.filter((t) => ids.has(t.id)).length,
    registros: backup.historico.length,
  };
}

export function nomeDoArquivo(agora: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `joachrono-backup-${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}.json`;
}
