import { StyleSheet, Switch, Text, View } from 'react-native';

/** Linha com texto e interruptor, usada nas opções do treino e nas configurações. */
export function OpcaoSwitch(props: {
  rotulo: string;
  dica?: string;
  valor: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <View style={estilos.linha}>
      <View style={estilos.texto}>
        <Text style={estilos.rotulo}>{props.rotulo}</Text>
        {props.dica ? <Text style={estilos.dica}>{props.dica}</Text> : null}
      </View>
      <Switch
        value={props.valor}
        onValueChange={props.onChange}
        accessibilityLabel={props.rotulo}
        trackColor={{ true: '#15803d' }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, marginTop: 8 },
  texto: { flex: 1, gap: 2 },
  rotulo: { color: '#fff', fontSize: 17 },
  dica: { color: '#9ca3af', fontSize: 13 },
});
