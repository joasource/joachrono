import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Escolha de uma opção entre poucas (volume, contagem). */
export function Segmentos<T extends string | number>(props: {
  rotulo: string;
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onChange: (valor: T) => void;
  desativado?: boolean;
}) {
  return (
    <View style={[estilos.bloco, props.desativado && estilos.desativado]}>
      <Text style={estilos.rotulo}>{props.rotulo}</Text>
      <View style={estilos.linha}>
        {props.opcoes.map((o) => {
          const selecionado = o.valor === props.valor;
          return (
            <Pressable
              key={String(o.valor)}
              accessibilityRole="button"
              accessibilityState={{ selected: selecionado, disabled: props.desativado }}
              disabled={props.desativado}
              onPress={() => props.onChange(o.valor)}
              style={[estilos.opcao, selecionado && estilos.selecionada]}
            >
              <Text style={estilos.texto}>{o.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: { gap: 8, marginTop: 12 },
  desativado: { opacity: 0.4 },
  rotulo: { color: '#fff', fontSize: 17 },
  linha: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  opcao: {
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selecionada: { backgroundColor: '#2563eb' },
  texto: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
