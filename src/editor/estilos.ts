import { StyleSheet } from 'react-native';

/** Estilos compartilhados pelos dois editores (simples e avançado). */
export const estilosEditor = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingHorizontal: 20, gap: 8 },
  titulo: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  rotulo: { color: '#9ca3af', fontSize: 14, marginTop: 8, marginBottom: 4 },
  entrada: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#1f2937',
    color: '#fff',
    fontSize: 18,
  },
  duracao: { color: '#fff', fontSize: 18, marginTop: 16, textAlign: 'center' },
  erro: { color: '#f87171', fontSize: 14 },
  salvar: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  desativado: { opacity: 0.4 },
  salvarTexto: { color: '#fff', fontSize: 18, fontWeight: '700' },
  secundario: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  secundarioTexto: { color: '#60a5fa', fontSize: 16 },
  excluirTexto: { color: '#f87171', fontSize: 16 },
});
