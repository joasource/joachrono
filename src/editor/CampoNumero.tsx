import { useState } from 'react';
import { TextInput, type StyleProp, type TextStyle } from 'react-native';

import { inteiro } from '../treinos/util';

/**
 * Campo de número inteiro. Guarda o texto só enquanto está em edição (para dar para apagar tudo)
 * e entrega o valor já limitado a cada tecla — assim "Salvar" nunca perde o que foi digitado.
 */
export function CampoNumero(props: {
  valor: number;
  min: number;
  max: number;
  rotulo: string;
  onChange: (valor: number) => void;
  estilo?: StyleProp<TextStyle>;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <TextInput
      style={props.estilo}
      keyboardType="number-pad"
      maxLength={String(props.max).length}
      value={texto ?? String(props.valor)}
      onChangeText={(v) => {
        const limpo = v.replace(/\D/g, '');
        setTexto(limpo);
        props.onChange(
          inteiro(limpo === '' ? NaN : Number(limpo), props.min, props.max, props.min),
        );
      }}
      onBlur={() => setTexto(null)}
      selectTextOnFocus
      accessibilityLabel={props.rotulo}
    />
  );
}
