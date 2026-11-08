import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import '../i18n/idioma';

export default function LayoutRaiz() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0b0b0f' } }} />
    </>
  );
}
