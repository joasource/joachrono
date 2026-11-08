// Formulário genérico de edição para relógio só com botões. Campos: número, tempo (minutos e
// segundos separados), escolha numa lista e sim/não.
//   UP/DOWN  muda o valor; segurar repete cada vez mais rápido (números exatos, sem múltiplos)
//   START    avança (minutos -> segundos -> próximo campo; no último, salva)
//   BACK     volta (no primeiro campo, descarta e sai)
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.Timer;
import Toybox.WatchUi;

enum {
    T_NUM,
    T_TEMPO,
    T_ESCOLHA,
    T_BOOL
}

class Campo {
    var chave as String;
    var tipo as Number;
    var rotulo as ResourceId;
    var min as Number;
    var max as Number;
    var opcoes as Array<ResourceId>?;
    // T_TEMPO: 0 s significa "fim manual" (mostra a dica).
    var zeroManual as Boolean;

    function initialize(chave as String, tipo as Number, rotulo as ResourceId, min as Number, max as Number, opcoes as Array<ResourceId>?, zeroManual as Boolean) {
        self.chave = chave;
        self.tipo = tipo;
        self.rotulo = rotulo;
        self.min = min;
        self.max = max;
        self.opcoes = opcoes;
        self.zeroManual = zeroManual;
    }
}

function campoNum(chave as String, rotulo as ResourceId, min as Number, max as Number) as Campo {
    return new Campo(chave, T_NUM, rotulo, min, max, null, false);
}

function campoTempo(chave as String, rotulo as ResourceId, min as Number, manual as Boolean) as Campo {
    return new Campo(chave, T_TEMPO, rotulo, min, LIM_SEG, null, manual);
}

function campoBool(chave as String, rotulo as ResourceId) as Campo {
    return new Campo(chave, T_BOOL, rotulo, 0, 1, null, false);
}

function campoEscolha(chave as String, rotulo as ResourceId, opcoes as Array<ResourceId>) as Campo {
    return new Campo(chave, T_ESCOLHA, rotulo, 0, opcoes.size() - 1, opcoes, false);
}

// Valor depois de um passo de `dir` (+1/-1) no campo. `parte`: 0 = minutos, 1 = segundos (tempo).
function mudarValor(c as Campo, v as Number, dir as Number, parte as Number) as Number {
    var novo = v;
    if (c.tipo == T_TEMPO) {
        var m = v / 60;
        var s = v % 60;
        if (parte == 0) {
            m += dir;
            m = (m < 0) ? 0 : ((m > LIM_SEG / 60) ? LIM_SEG / 60 : m);
        } else {
            s = (s + dir + 60) % 60; // dá a volta: 0 -> 59 e 59 -> 0, sem mexer nos minutos
        }
        novo = m * 60 + s;
        novo = (novo > LIM_SEG) ? LIM_SEG : novo;
    } else if (c.tipo == T_ESCOLHA) {
        var n = c.max + 1;
        novo = (v + dir + n) % n;
    } else if (c.tipo == T_BOOL) {
        novo = (v != 0) ? 0 : 1;
    } else {
        novo = v + dir;
    }
    return (novo < c.min) ? c.min : ((novo > c.max) ? c.max : novo);
}

class FormView extends WatchUi.View {
    private var _titulo as ResourceId;
    private var _campos as Array<Campo>;
    private var _dados as Dictionary;
    private var _salvar as Method(dados as Dictionary) as Void;
    private var _idx as Number = 0;
    private var _parte as Number = 0;
    private var _timer as Timer.Timer;
    private var _dir as Number = 0;
    private var _n as Number = 0;

    function initialize(titulo as ResourceId, campos as Array<Campo>, dados as Dictionary, salvar as Method(dados as Dictionary) as Void) {
        View.initialize();
        _titulo = titulo;
        _campos = campos;
        _dados = dados;
        _salvar = salvar;
        _timer = new Timer.Timer();
    }

    private function valor() as Number {
        return _dados[_campos[_idx].chave] as Number;
    }

    // ---- Mudança de valor, com repetição ao segurar ----

    function mudar(dir as Number) as Void {
        var c = _campos[_idx];
        _dados[c.chave] = mudarValor(c, valor(), dir, _parte);
        WatchUi.requestUpdate();
    }

    function iniciarRepeticao(dir as Number) as Void {
        mudar(dir);
        _timer.stop();
        var t = _campos[_idx].tipo;
        if (t == T_ESCOLHA || t == T_BOOL) {
            return; // só números repetem
        }
        _dir = dir;
        _n = 0;
        _timer.start(method(:repetir), 450, false);
    }

    function repetir() as Void {
        if (_dir == 0) {
            return;
        }
        mudar(_dir);
        _n += 1;
        // Acelera: começa em ~8 passos/s e chega a ~20 passos/s.
        var espera = (_n < 8) ? 120 : ((_n < 20) ? 80 : 50);
        _timer.start(method(:repetir), espera, false);
    }

    function parar() as Void {
        _dir = 0;
        _timer.stop();
    }

    // ---- Navegação entre campos ----

    private function ehTempo() as Boolean {
        return _campos[_idx].tipo == T_TEMPO;
    }

    function proximo() as Void {
        parar();
        if (ehTempo() && _parte == 0) {
            _parte = 1;
            WatchUi.requestUpdate();
            return;
        }
        if (_idx < _campos.size() - 1) {
            _idx += 1;
            _parte = 0;
            WatchUi.requestUpdate();
            return;
        }
        _salvar.invoke(_dados);
        WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
    }

    function anterior() as Void {
        parar();
        if (ehTempo() && _parte == 1) {
            _parte = 0;
            WatchUi.requestUpdate();
        } else if (_idx > 0) {
            _idx -= 1;
            _parte = (ehTempo()) ? 1 : 0;
            WatchUi.requestUpdate();
        } else {
            WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
        }
    }

    function onHide() as Void {
        parar();
    }

    // ---- Desenho ----

    private function textoValor(c as Campo, v as Number) as String {
        if (c.tipo == T_NUM) {
            return v.format("%d");
        }
        if (c.tipo == T_BOOL) {
            return WatchUi.loadResource((v != 0) ? Rez.Strings.Sim : Rez.Strings.Nao) as String;
        }
        return WatchUi.loadResource((c.opcoes as Array<ResourceId>)[v]) as String;
    }

    // Desenha "MM:SS" com a parte ativa em vídeo invertido.
    private function desenharTempo(dc as Dc, cx as Number, y as Number, v as Number) as Void {
        var f = Graphics.FONT_NUMBER_MEDIUM;
        var ms = (v / 60).format("%02d");
        var ss = (v % 60).format("%02d");
        var wm = dc.getTextWidthInPixels(ms, f);
        var ws = dc.getTextWidthInPixels(ss, f);
        var wc = dc.getTextWidthInPixels(":", f);
        var h = dc.getFontHeight(f);
        var x0 = cx - (wm + wc + ws) / 2;
        var j = Graphics.TEXT_JUSTIFY_LEFT | Graphics.TEXT_JUSTIFY_VCENTER;
        var partes = [[x0, wm, ms], [x0 + wm + wc, ws, ss]];
        for (var i = 0; i < 2; i++) {
            var p = partes[i];
            var ativo = (i == _parte);
            if (ativo) {
                dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
                dc.fillRectangle((p[0] as Number) - 3, y - h / 2, (p[1] as Number) + 6, h);
                dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_WHITE);
            } else {
                dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
            }
            dc.drawText(p[0] as Number, y, f, p[2] as String, j);
            // Legenda embaixo de cada parte.
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
            var leg = WatchUi.loadResource((i == 0) ? Rez.Strings.Min : Rez.Strings.Seg) as String;
            dc.drawText((p[0] as Number) + (p[1] as Number) / 2, y + h / 2 + 8, Graphics.FONT_XTINY, leg, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
        }
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
        dc.drawText(x0 + wm, y, f, ":", j);
    }

    function onUpdate(dc as Dc) as Void {
        var w = dc.getWidth();
        var cx = w / 2;
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
        dc.clear();
        var j = Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER;
        var jl = Graphics.TEXT_JUSTIFY_LEFT | Graphics.TEXT_JUSTIFY_VCENTER;
        var sb = subtela();
        var c = _campos[_idx];

        dc.drawText(10, 22, Graphics.FONT_XTINY, WatchUi.loadResource(_titulo) as String, jl);
        dc.drawText(sb[0], sb[1], Graphics.FONT_SMALL, (_idx + 1).format("%d") + "/" + _campos.size().format("%d"), j);
        var rot = WatchUi.loadResource(c.rotulo) as String;
        dc.drawText(cx, 82, fonteQueCabe(dc, rot, Graphics.FONT_SMALL, Graphics.FONT_XTINY, w - 24), rot, j);

        if (c.tipo == T_TEMPO) {
            desenharTempo(dc, cx, 120, valor());
            if (c.zeroManual && valor() == 0) {
                dc.drawText(cx, 160, Graphics.FONT_XTINY, WatchUi.loadResource(Rez.Strings.Manual) as String, j);
            }
        } else {
            var txt = textoValor(c, valor());
            var grande = (c.tipo == T_NUM) ? Graphics.FONT_NUMBER_MEDIUM : Graphics.FONT_LARGE;
            dc.drawText(cx, 122, fonteQueCabe(dc, txt, grande, Graphics.FONT_SMALL, w - 24), txt, j);
        }
    }
}

class FormDelegate extends WatchUi.BehaviorDelegate {
    private var _view as FormView;

    function initialize(view as FormView) {
        BehaviorDelegate.initialize();
        _view = view;
    }

    // UP/DOWN agem ao apertar (e repetem enquanto seguram); soltar para.
    function onKeyPressed(evt as WatchUi.KeyEvent) as Boolean {
        var k = evt.getKey();
        if (k == WatchUi.KEY_UP) {
            _view.iniciarRepeticao(1);
            return true;
        }
        if (k == WatchUi.KEY_DOWN) {
            _view.iniciarRepeticao(-1);
            return true;
        }
        return false;
    }

    function onKeyReleased(evt as WatchUi.KeyEvent) as Boolean {
        var k = evt.getKey();
        if (k == WatchUi.KEY_UP || k == WatchUi.KEY_DOWN) {
            _view.parar();
            return true;
        }
        return false;
    }

    // As ações de página já foram tratadas em onKeyPressed.
    function onPreviousPage() as Boolean {
        return true;
    }

    function onNextPage() as Boolean {
        return true;
    }

    function onSelect() as Boolean {
        _view.proximo();
        return true;
    }

    function onBack() as Boolean {
        _view.anterior();
        return true;
    }

    // Segurar UP vira "menu" no relógio: ignora e mantém a repetição funcionando.
    function onMenu() as Boolean {
        return true;
    }
}

// ---- Editor do modo simples ----

class SalvadorSimples {
    private var _indice as Number;

    function initialize(indice as Number) {
        _indice = indice;
    }

    function salvar(dados as Dictionary) as Void {
        var lista = lerTreinos();
        if (_indice >= 0 && _indice < lista.size()) {
            lista[_indice] = dados;
        } else {
            lista.add(dados);
        }
        salvarTreinos(lista);
        if ($.gMenu != null) {
            preencherMenu($.gMenu as WatchUi.Menu2);
        }
    }
}

// Abre o editor do modo simples. Se `trocar`, substitui a tela atual (vindo do menu de ações).
function abrirEditorSimples(indice as Number, treino as Dictionary, trocar as Boolean) as Void {
    var campos = [
        campoNum("r", Rez.Strings.Rounds, 1, LIM_ROUNDS),
        campoTempo("t", Rez.Strings.TempoTrabalho, 1, false),
        campoTempo("d", Rez.Strings.TempoDescanso, 0, false),
        campoTempo("a", Rez.Strings.TempoAquecimento, 0, false),
        campoTempo("z", Rez.Strings.TempoDesaquecimento, 0, false),
        campoBool("p", Rez.Strings.PularUltimo)
    ] as Array<Campo>;
    var v = new FormView(Rez.Strings.TituloEditar, campos, treino, new SalvadorSimples(indice).method(:salvar));
    if (trocar) {
        WatchUi.switchToView(v, new FormDelegate(v), WatchUi.SLIDE_LEFT);
    } else {
        WatchUi.pushView(v, new FormDelegate(v), WatchUi.SLIDE_LEFT);
    }
}
