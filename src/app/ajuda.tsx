import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '../i18n/t';
import { itensDeAjuda } from '../i18n/ajuda';

export default function Ajuda() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        estilos.conteudo,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={estilos.titulo} accessibilityRole="header">
        {t('ajuda.titulo')}
      </Text>
      {itensDeAjuda().map((item) => (
        <View key={item.titulo} style={estilos.item}>
          <Text style={estilos.itemTitulo} accessibilityRole="header">
            {item.titulo}
          </Text>
          <Text style={estilos.itemTexto}>{item.texto}</Text>
        </View>
      ))}
      <Pressable accessibilityRole="button" style={estilos.voltar} onPress={() => router.back()}>
        <Text style={estilos.voltarTexto}>{t('geral.voltar')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { paddingHorizontal: 20, gap: 12 },
  titulo: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 4 },
  item: { backgroundColor: '#1f2937', borderRadius: 16, padding: 16, gap: 4 },
  itemTitulo: { color: '#fff', fontSize: 18, fontWeight: '600' },
  itemTexto: { color: '#d1d5db', fontSize: 15, lineHeight: 22 },
  voltar: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  voltarTexto: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
