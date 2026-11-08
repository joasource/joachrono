import * as Haptics from 'expo-haptics';

import {
  PERFIL_VIBRACAO,
  type EventoSinal,
  type IntensidadeVibracao,
  type ToqueHaptico,
} from '../configuracoes/modelo';

function tocarHaptico(tipo: ToqueHaptico['tipo']) {
  const r =
    tipo === 'sucesso'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(
          tipo === 'leve'
            ? Haptics.ImpactFeedbackStyle.Light
            : tipo === 'media'
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Heavy,
        );
  r.catch(() => {});
}

/** Vibra o padrão do sinal na intensidade pedida. Falha de vibração nunca derruba o cronômetro. */
export function vibrar(evento: EventoSinal, intensidade: IntensidadeVibracao) {
  for (const { tipo, atrasoMs } of PERFIL_VIBRACAO[intensidade][evento]) {
    if (atrasoMs === 0) tocarHaptico(tipo);
    else setTimeout(() => tocarHaptico(tipo), atrasoMs);
  }
}
