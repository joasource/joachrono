// O Instinct tem uma subtela circular no canto superior direito: o que for desenhado por baixo
// dela fica fora da área útil. Estes helpers guardam a posição para o layout desviar dela.
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.WatchUi;

// [centroX, centroY, raio] da subtela. Se o aparelho não informar, usa o valor do Instinct 2X.
function subtela() as Array<Number> {
    if (WatchUi has :getSubscreen) {
        var b = WatchUi.getSubscreen();
        if (b != null) {
            return [b.x + b.width / 2, b.y + b.height / 2, b.width / 2] as Array<Number>;
        }
    }
    return [143, 33, 40] as Array<Number>;
}

// Maior fonte (entre as duas) em que o texto cabe em `larguraMax` pixels.
function fonteQueCabe(dc as Dc, txt as String, grande as Graphics.FontType, pequena as Graphics.FontType, larguraMax as Number) as Graphics.FontType {
    return (dc.getTextWidthInPixels(txt, grande) <= larguraMax) ? grande : pequena;
}
