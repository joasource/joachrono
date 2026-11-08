// Editor do modo simples no relógio: UP/DOWN mudam o valor, START avança de campo (e salva no
// último), BACK volta um campo (no primeiro, descarta e sai).
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.WatchUi;

const CAMPOS = ["r", "t", "d", "a", "z", "p"];

function passoDoValor(v as Number) as Number {
    return (v < 60) ? 5 : ((v < 300) ? 15 : ((v < 1800) ? 30 : 60));
}

class EditarView extends WatchUi.View {
    var indiceTreino as Number;
    var treino as Dictionary;
    var campo as Number = 0;

    function initialize(indiceTreino as Number, treino as Dictionary) {
        View.initialize();
        self.indiceTreino = indiceTreino;
        self.treino = treino;
    }

    function rotulo(c as Number) as ResourceId {
        var ids = [
            Rez.Strings.Rounds,
            Rez.Strings.TempoTrabalho,
            Rez.Strings.TempoDescanso,
            Rez.Strings.TempoAquecimento,
            Rez.Strings.TempoDesaquecimento,
            Rez.Strings.PularUltimo
        ] as Array<ResourceId>;
        return ids[c];
    }

    function valorTexto(c as Number) as String {
        var v = treino[CAMPOS[c]] as Number;
        if (c == 0) {
            return v.format("%d");
        }
        if (c == 5) {
            return WatchUi.loadResource(v != 0 ? Rez.Strings.Sim : Rez.Strings.Nao) as String;
        }
        return formatarTempo(v);
    }

    // direcao: +1 (UP) ou -1 (DOWN)
    function mudar(direcao as Number) as Void {
        var chave = CAMPOS[campo];
        var v = treino[chave] as Number;
        var novo = v;
        if (campo == 0) {
            novo = v + direcao;
            novo = (novo < 1) ? 1 : ((novo > LIM_ROUNDS) ? LIM_ROUNDS : novo);
        } else if (campo == 5) {
            novo = (v != 0) ? 0 : 1;
        } else {
            var min = (campo == 1) ? 5 : 0;
            novo = (direcao > 0) ? v + passoDoValor(v) : v - passoDoValor(v - 1);
            novo = (novo < min) ? min : ((novo > LIM_SEG) ? LIM_SEG : novo);
        }
        treino[chave] = novo;
        WatchUi.requestUpdate();
    }

    function proximoCampo() as Void {
        if (campo < CAMPOS.size() - 1) {
            campo += 1;
            WatchUi.requestUpdate();
            return;
        }
        var lista = lerTreinos();
        if (indiceTreino >= 0 && indiceTreino < lista.size()) {
            lista[indiceTreino] = treino;
        } else {
            lista.add(treino);
        }
        salvarTreinos(lista);
        if ($.gMenu != null) {
            preencherMenu($.gMenu as WatchUi.Menu2);
        }
        WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
    }

    function campoAnterior() as Void {
        if (campo > 0) {
            campo -= 1;
            WatchUi.requestUpdate();
        } else {
            WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
        }
    }

    function onUpdate(dc as Dc) as Void {
        var w = dc.getWidth();
        var cx = w / 2;
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
        dc.clear();
        var j = Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER;
        var sb = subtela();
        var jl = Graphics.TEXT_JUSTIFY_LEFT | Graphics.TEXT_JUSTIFY_VCENTER;
        dc.drawText(10, 22, Graphics.FONT_XTINY, WatchUi.loadResource(Rez.Strings.TituloEditar) as String, jl);
        dc.drawText(sb[0], sb[1], Graphics.FONT_SMALL, (campo + 1).format("%d") + "/" + CAMPOS.size().format("%d"), j);
        var rot = WatchUi.loadResource(rotulo(campo)) as String;
        dc.drawText(cx, 92, fonteQueCabe(dc, rot, Graphics.FONT_SMALL, Graphics.FONT_XTINY, w - 24), rot, j);
        dc.drawText(cx, 122, (campo == 5) ? Graphics.FONT_LARGE : Graphics.FONT_NUMBER_MEDIUM, valorTexto(campo), j);
        dc.drawText(cx, 152, Graphics.FONT_XTINY, WatchUi.loadResource(Rez.Strings.DicaEditar) as String, j);
    }
}

class EditarDelegate extends WatchUi.BehaviorDelegate {
    private var _view as EditarView;

    function initialize(view as EditarView) {
        BehaviorDelegate.initialize();
        _view = view;
    }

    function onPreviousPage() as Boolean {
        _view.mudar(1);
        return true;
    }

    function onNextPage() as Boolean {
        _view.mudar(-1);
        return true;
    }

    function onSelect() as Boolean {
        _view.proximoCampo();
        return true;
    }

    function onBack() as Boolean {
        _view.campoAnterior();
        return true;
    }
}
