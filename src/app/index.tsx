import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

// Tela provisória; a lista de treinos entra na fase 3.
export default function Inicio() {
  return (
    <View style={estilos.tela}>
      <Text style={estilos.titulo}>Joachrono</Text>
      <Link href="/executar" style={estilos.link}>
        Treino de exemplo
      </Link>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  titulo: { color: '#fff', fontSize: 32, fontWeight: '700' },
  link: { color: '#60a5fa', fontSize: 20 },
});
