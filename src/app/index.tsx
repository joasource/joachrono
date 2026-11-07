import { StyleSheet, Text, View } from 'react-native';

// Tela provisória da fase 0; a lista de treinos entra na fase 3.
export default function Inicio() {
  return (
    <View style={estilos.tela}>
      <Text style={estilos.titulo}>Joachrono</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titulo: { color: '#fff', fontSize: 32, fontWeight: '700' },
});
