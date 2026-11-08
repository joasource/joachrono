// Cronômetro livre: conta para cima, sem treino, com voltas. Porte de src/motor/livre.ts.
// START pausa/retoma, DOWN marca volta, BACK abre o menu de saída.
import Toybox.ActivityRecording;
import Toybox.Activity;
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.System;
import Toybox.Timer;
import Toybox.WatchUi;

class Livre {
    var status as Number = ST_PRONTO;
    var acumuladoMs as Number = 0;
    var retomadoEm as Number = 0;
    // Tempo total (ms) de cada toque em "volta", em ordem.
    var marcas as Array<Number> = [] as Array<Number>;

    function decorridoMs(agora as Number) as Number {
        var corrente = (status == ST_CONTANDO) ? agora - retomadoEm : 0;
        return acumuladoMs + ((corrente < 0) ? 0 : corrente);
    }

    function iniciar(agora as Number) as Void {
        if (status == ST_CONTANDO) {
            return;
        }
        status = ST_CONTANDO;
        retomadoEm = agora;
    }

    function pausar(agora as Number) as Void {
        if (status != ST_CONTANDO) {
            return;
        }
        acumuladoMs = decorridoMs(agora);
        status = ST_PAUSADO;
    }

    function volta(agora as Number) as Void {
        if (status != ST_CONTANDO) {
            return;
        }
        marcas.add(decorridoMs(agora));
    }

    // Duração (ms) da volta de índice i: diferença entre marcas consecutivas.
    function duracaoDaVolta(i as Number) as Number {
        return marcas[i] - ((i == 0) ? 0 : marcas[i - 1]);
    }
}

class LivreView extends WatchUi.View {
    private var _l as Livre;
    private var _timer as Timer.Timer;
    private var _sessao as ActivityRecording.Session? = null;
    private var _estavaContando as Boolean = false;

    function initialize() {
        View.initialize();
        _l = new Livre();
        _timer = new Timer.Timer();
    }

    function alternar() as Void {
        var agora = System.getTimer();
        if (_l.status == ST_PRONTO) {
            _l.iniciar(agora);
            iniciarSessao();
        } else if (_l.status == ST_CONTANDO) {
            _l.pausar(agora);
            pararSessao();
        } else {
            _l.iniciar(agora);
            iniciarSessao();
        }
        agendar();
        WatchUi.requestUpdate();
    }

    function marcarVolta() as Void {
        if (_l.status != ST_CONTANDO) {
            return;
        }
        _l.volta(System.getTimer());
        if (_sessao != null) {
            (_sessao as ActivityRecording.Session).addLap();
        }
        Sinais.contagem();
        WatchUi.requestUpdate();
    }

    function pedirSaida() as Void {
        if (_l.status == ST_PRONTO) {
            sair();
            return;
        }
        _estavaContando = (_l.status == ST_CONTANDO);
        if (_estavaContando) {
            _l.pausar(System.getTimer());
            pararSessao();
            agendar();
        }
        var menu = new WatchUi.Menu2({ :title => Rez.Strings.Pausado });
        menu.addItem(new WatchUi.MenuItem(Rez.Strings.Continuar, null, "continuar", null));
        menu.addItem(new WatchUi.MenuItem(Rez.Strings.SalvarSair, null, "salvar", null));
        menu.addItem(new WatchUi.MenuItem(Rez.Strings.Descartar, null, "descartar", null));
        WatchUi.pushView(menu, new SaidaDelegate(self), WatchUi.SLIDE_UP);
    }

    function continuar() as Void {
        if (_estavaContando) {
            _l.iniciar(System.getTimer());
            iniciarSessao();
            agendar();
        }
        WatchUi.requestUpdate();
    }

    function sair() as Void {
        _timer.stop();
        WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
    }

    function sairSalvando() as Void {
        pararSessao();
        if (_sessao != null) {
            (_sessao as ActivityRecording.Session).save();
            _sessao = null;
        }
        sair();
    }

    function sairDescartando() as Void {
        pararSessao();
        if (_sessao != null) {
            (_sessao as ActivityRecording.Session).discard();
            _sessao = null;
        }
        sair();
    }

    private function iniciarSessao() as Void {
        if (!(Toybox has :ActivityRecording)) {
            return;
        }
        if (_sessao == null) {
            _sessao = ActivityRecording.createSession({
                :name => "joaChrono",
                :sport => Activity.SPORT_TRAINING,
                :subSport => Activity.SUB_SPORT_CARDIO_TRAINING
            });
        }
        var s = _sessao as ActivityRecording.Session;
        if (!s.isRecording()) {
            s.start();
        }
    }

    private function pararSessao() as Void {
        if (_sessao != null && (_sessao as ActivityRecording.Session).isRecording()) {
            (_sessao as ActivityRecording.Session).stop();
        }
    }

    function onTimer() as Void {
        agendar();
        WatchUi.requestUpdate();
    }

    // Um disparo por segundo, alinhado à virada do segundo do cronômetro.
    private function agendar() as Void {
        _timer.stop();
        if (_l.status != ST_CONTANDO) {
            return;
        }
        var ms = 1000 - (_l.decorridoMs(System.getTimer()) % 1000);
        _timer.start(method(:onTimer), ms + 15, false);
    }

    function onShow() as Void {
        agendar();
    }

    function onHide() as Void {
        _timer.stop();
    }

    function onUpdate(dc as Dc) as Void {
        var agora = System.getTimer();
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
        dc.clear();
        var cx = dc.getWidth() / 2;
        var j = Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER;
        var jl = Graphics.TEXT_JUSTIFY_LEFT | Graphics.TEXT_JUSTIFY_VCENTER;
        var sb = subtela();

        dc.drawText(10, 22, Graphics.FONT_SMALL, WatchUi.loadResource(Rez.Strings.Livre) as String, jl);
        if (_l.status == ST_PAUSADO) {
            dc.drawText(10, 46, Graphics.FONT_XTINY, WatchUi.loadResource(Rez.Strings.Pausado) as String, jl);
        }
        if (_l.marcas.size() > 0) {
            dc.drawText(sb[0], sb[1], Graphics.FONT_SMALL, _l.marcas.size().format("%d"), j);
        }

        var seg = _l.decorridoMs(agora) / 1000;
        var fonte = (seg >= 3600) ? Graphics.FONT_NUMBER_MEDIUM : Graphics.FONT_NUMBER_HOT;
        dc.drawText(cx, 108, fonte, formatarTempo(seg), j);

        // As duas últimas voltas.
        var n = _l.marcas.size();
        var volta = WatchUi.loadResource(Rez.Strings.Volta) as String;
        if (n >= 1) {
            dc.drawText(cx, 140, Graphics.FONT_XTINY, volta + " " + n.format("%d") + "  " + formatarTempo(_l.duracaoDaVolta(n - 1) / 1000), j);
        }
        if (n >= 2) {
            dc.drawText(cx, 158, Graphics.FONT_XTINY, volta + " " + (n - 1).format("%d") + "  " + formatarTempo(_l.duracaoDaVolta(n - 2) / 1000), j);
        }
        if (_l.status == ST_PRONTO) {
            dc.drawText(cx, 150, Graphics.FONT_XTINY, WatchUi.loadResource(Rez.Strings.IniciarDica) as String, j);
        }
    }
}

class LivreDelegate extends WatchUi.BehaviorDelegate {
    private var _view as LivreView;

    function initialize(view as LivreView) {
        BehaviorDelegate.initialize();
        _view = view;
    }

    function onSelect() as Boolean {
        _view.alternar();
        return true;
    }

    function onNextPage() as Boolean {
        _view.marcarVolta();
        return true;
    }

    function onPreviousPage() as Boolean {
        return true;
    }

    function onBack() as Boolean {
        _view.pedirSaida();
        return true;
    }

    function onMenu() as Boolean {
        return true;
    }
}
