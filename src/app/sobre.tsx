import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '../i18n/t';

const AUTOR = 'Joaquim Ferreira';
const EMAIL = 'joaquimfsneto@gmail.com';

export default function Sobre() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        estilos.conteudo,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={estilos.titulo} accessibilityRole="header">
        {t('sobre.titulo')}
      </Text>
      <Text style={estilos.app}>joaChrono</Text>
      <Text style={estilos.texto}>
        {t('sobre.versao', { versao: Constants.expoConfig?.version ?? '—' })}
      </Text>

      <Text style={estilos.secao} accessibilityRole="header">
        {t('sobre.autor')}
      </Text>
      <Text style={estilos.texto}>{AUTOR}</Text>

      <Text style={estilos.secao} accessibilityRole="header">
        {t('sobre.contato')}
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={t('sobre.enviarEmail', { email: EMAIL })}
        onPress={() => void Linking.openURL(`mailto:${EMAIL}`)}
        style={estilos.link}
      >
        <Text style={estilos.linkTexto}>{EMAIL}</Text>
      </Pressable>

      <Text style={estilos.secao} accessibilityRole="header">
        {t('sobre.licenca')}
      </Text>
      <Text style={[estilos.texto, estilos.negrito]}>{t('sobre.direitos')}</Text>
      <Text style={estilos.licenca}>{t('sobre.licencaTexto')}</Text>

      <Pressable accessibilityRole="button" style={estilos.voltar} onPress={() => router.back()}>
        <Text style={estilos.voltarTexto}>{t('geral.voltar')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { paddingHorizontal: 20, gap: 4 },
  titulo: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  app: { color: '#fff', fontSize: 24, fontWeight: '700' },
  secao: { color: '#9ca3af', fontSize: 14, marginTop: 20, textTransform: 'uppercase' },
  texto: { color: '#fff', fontSize: 16 },
  negrito: { fontWeight: '600', marginTop: 4 },
  licenca: { color: '#d1d5db', fontSize: 14, lineHeight: 20, marginTop: 8 },
  link: { minHeight: 48, justifyContent: 'center' },
  linkTexto: { color: '#60a5fa', fontSize: 16 },
  voltar: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  voltarTexto: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
