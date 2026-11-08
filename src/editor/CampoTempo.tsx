import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native';

import { t } from '../i18n/t';
import { inteiro } from '../treinos/util';

type Parte = 'min' | 'seg';

/**
 * Tempo em segundos, editado em dois campos (min e s). O valor é sempre o total: digitar 120 em
 * "s" vira 2 min e 0 s na hora. Só guarda texto próprio quando a pessoa apaga um campo, para
 * dar para digitar do zero.
 */
export function CampoTempo(props: {
  valor: number;
  min: number;
  max: number;
  rotulo: string;
  onChange: (segundos: number) => void;
  estilo?: StyleProp<TextStyle>;
}) {
  const [vazio, setVazio] = useState<Parte | null>(null);
  const minutos = Math.floor(props.valor / 60);
  const segundos = props.valor % 60;

  function alterar(parte: Parte, texto: string) {
    const limpo = texto.replace(/\D/g, '');
    setVazio(limpo === '' ? parte : null);
    const n = limpo === '' ? 0 : Number(limpo);
    const total = parte === 'min' ? n * 60 + segundos : minutos * 60 + n;
    props.onChange(inteiro(total, props.min, props.max, props.min));
  }

  const campo = (parte: Parte, valor: number, unidade: string, nome: string) => (
    <View style={estilos.parte}>
      <TextInput
        style={[props.estilo, estilos.entrada]}
        keyboardType="number-pad"
        maxLength={String(parte === 'min' ? Math.floor(props.max / 60) : props.max).length}
        value={vazio === parte ? '' : String(valor)}
        onChangeText={(v) => alterar(parte, v)}
        onBlur={() => setVazio(null)}
        selectTextOnFocus
        accessibilityLabel={`${props.rotulo} (${nome})`}
      />
      <Text style={estilos.unidade}>{unidade}</Text>
    </View>
  );

  return (
    <View style={estilos.linha}>
      {campo('min', minutos, t('tempo.min'), t('tempo.minutos'))}
      {campo('seg', segundos, t('tempo.seg'), t('tempo.segundos'))}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  parte: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entrada: { minWidth: 72, textAlign: 'center' },
  unidade: { color: '#9ca3af', fontSize: 15 },
});
