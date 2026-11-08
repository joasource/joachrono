// Sons e vibração das trocas de etapa. Tudo protegido por `has`: nem todo relógio tem bipe.
import Toybox.Attention;
import Toybox.Lang;

module Sinais {
    function vibrar(ms as Number) as Void {
        if (configVibracao() && Attention has :vibrate) {
            Attention.vibrate([new Attention.VibeProfile(100, ms)] as Array<Attention.VibeProfile>);
        }
    }

    function tom(t as Attention.Tone) as Void {
        if (configSom() && Attention has :playTone) {
            Attention.playTone(t);
        }
    }

    function luz() as Void {
        if (Attention has :backlight) {
            Attention.backlight(true);
        }
    }

    // Bipe curto a cada segundo da contagem regressiva.
    function contagem() as Void {
        tom(Attention.TONE_KEY);
        vibrar(120);
    }

    function troca() as Void {
        tom(Attention.TONE_LAP);
        vibrar(500);
        luz();
    }

    function fim() as Void {
        tom(Attention.TONE_SUCCESS);
        if (configVibracao() && Attention has :vibrate) {
            Attention.vibrate([
                new Attention.VibeProfile(100, 300),
                new Attention.VibeProfile(0, 150),
                new Attention.VibeProfile(100, 300),
                new Attention.VibeProfile(0, 150),
                new Attention.VibeProfile(100, 300)
            ] as Array<Attention.VibeProfile>);
        }
        luz();
    }
}
