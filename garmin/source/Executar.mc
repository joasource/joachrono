// Tela do treino em andamento. START pausa/retoma, DOWN avança de etapa, UP volta (ou reinicia a
// etapa depois de 3 s), BACK abre o menu de saída. Grava a sessão no Garmin Connect (Fit).
import Toybox.ActivityRecording;
import Toybox.Activity;
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.System;
import Toybox.Timer;
import Toybox.WatchUi;

class ExecutarView extends WatchUi.View {
    private var _maq as Maquina;
    private var _timer as Timer.Timer;
    private var _sessao as ActivityRecording.Session? = null;
    private var _ultimoBip as Number = -1;
    private var _estavaContando as Boolean = false;

    function initialize(treino as Dictionary) {
        View.initialize();
        _maq = new Maquina(passosDeRounds(treino));
        _timer = new Timer.Timer();
    }

    // ---- Controle (chamado pelo delegate) ----

    function alternar() as Void {
        var agora = System.getTimer();
        if (_maq.status == ST_PRONTO) {
            _maq.iniciar(agora);
            iniciarSessao();
            Sinais.troca();
        } else if (_maq.status == ST_CONTANDO) {
            _maq.pausar(agora);
            pararSessao();
        } else if (_maq.status == ST_PAUSADO) {
            _maq.retomar(agora);
            iniciarSessao();
        } else {
            sair();
            return;
        }
        agendar();
        WatchUi.requestUpdate();
    }

    function proxima() as Void {
        if (_maq.status != ST_CONTANDO && _maq.status != ST_PAUSADO) {
            return;
        }
        processar(_maq.avancar(System.getTimer()));
        agendar();
        WatchUi.requestUpdate();
    }

    function anterior() as Void {
        _maq.voltar(System.getTimer());
        _ultimoBip = -1;
        agendar();
        WatchUi.requestUpdate();
    }

    // BACK: nunca sai direto no meio do treino.
    function pedirSaida() as Void {
        if (_maq.status == ST_PRONTO || _maq.status == ST_CONCLUIDO) {
            sair();
            return;
        }
        _estavaContando = (_maq.status == ST_CONTANDO);
        if (_estavaContando) {
            _maq.pausar(System.getTimer());
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
            _maq.retomar(System.getTimer());
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

    // ---- Sessão de atividade (aparece no Garmin Connect com a frequência cardíaca) ----

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

    // ---- Tempo ----

    private function processar(eventos as Array<Number>) as Void {
        var troca = false;
        for (var i = 0; i < eventos.size(); i++) {
            if (eventos[i] == EV_FIM) {
                pararSessao();
                if (_sessao != null) {
                    (_sessao as ActivityRecording.Session).save();
                    _sessao = null;
                }
                Sinais.fim();
                _ultimoBip = -1;
                return;
            }
            troca = true;
        }
        if (troca) {
            _ultimoBip = -1;
            Sinais.troca();
        }
    }

    function onTimer() as Void {
        var agora = System.getTimer();
        processar(_maq.tick(agora));
        if (_maq.status == ST_CONTANDO) {
            var rest = _maq.restanteMs(agora);
            var cd = configContagem();
            if (cd > 0 && rest != null && _maq.decorridoNoPassoMs(agora) > 500) {
                var s = (rest + 999) / 1000;
                if (s >= 1 && s <= cd && s != _ultimoBip) {
                    _ultimoBip = s;
                    Sinais.contagem();
                }
            }
        }
        agendar();
        WatchUi.requestUpdate();
    }

    // Um disparo por vez, alinhado à virada do segundo (economiza bateria e evita atraso visual).
    private function agendar() as Void {
        _timer.stop();
        if (_maq.status != ST_CONTANDO) {
            return;
        }
        var agora = System.getTimer();
        var rest = _maq.restanteMs(agora);
        var ms = (rest != null) ? (rest % 1000) : (1000 - (_maq.decorridoNoPassoMs(agora) % 1000));
        if (ms == 0) {
            ms = 1000;
        }
        _timer.start(method(:onTimer), ms + 15, false);
    }

    function onShow() as Void {
        agendar();
    }

    function onHide() as Void {
        _timer.stop();
    }

    // ---- Desenho ----

    private function nomeCategoria(cat as Number) as String {
        var ids = [
            Rez.Strings.Aquecer,
            Rez.Strings.Trabalho,
            Rez.Strings.Descanso,
            Rez.Strings.Desaquecer,
            Rez.Strings.Livre
        ] as Array<ResourceId>;
        return WatchUi.loadResource(ids[cat]) as String;
    }

    function onUpdate(dc as Dc) as Void {
        var agora = System.getTimer();
        var passo = _maq.passoAtual();
        // Tela monocromática: trabalho em fundo branco, o resto em fundo preto.
        var invertido = (passo.cat == CAT_TRABALHO) && (_maq.status != ST_CONCLUIDO);
        var fg = invertido ? Graphics.COLOR_BLACK : Graphics.COLOR_WHITE;
        var bg = invertido ? Graphics.COLOR_WHITE : Graphics.COLOR_BLACK;
        dc.setColor(fg, bg);
        dc.clear();

        var cx = dc.getWidth() / 2;
        var j = Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER;

        var titulo = nomeCategoria(passo.cat);
        var sub = "";
        var rodada = "";
        var hint = "";
        var segundos = 0;
        if (_maq.status == ST_PRONTO) {
            titulo = WatchUi.loadResource(Rez.Strings.Pronto) as String;
            hint = WatchUi.loadResource(Rez.Strings.IniciarDica) as String;
            segundos = passo.seg;
        } else if (_maq.status == ST_CONCLUIDO) {
            titulo = WatchUi.loadResource(Rez.Strings.Concluido) as String;
            segundos = _maq.tempoTotalMs(agora) / 1000;
        } else {
            if (_maq.status == ST_PAUSADO) {
                sub = WatchUi.loadResource(Rez.Strings.Pausado) as String;
            }
            if (passo.total > 0) {
                rodada = passo.atual.format("%d") + "/" + passo.total.format("%d");
            }
            var rest = _maq.restanteMs(agora);
            // Arredonda para cima: mostra 0:01 até o instante da troca.
            segundos = (rest != null) ? (rest + 999) / 1000 : _maq.decorridoNoPassoMs(agora) / 1000;
        }

        // Canto superior esquerdo: etapa. Subtela (círculo): round. Embaixo do círculo: tempo.
        var sb = subtela();
        var esq = 10;
        var largura = sb[0] - sb[2] - esq - 4;
        var jl = Graphics.TEXT_JUSTIFY_LEFT | Graphics.TEXT_JUSTIFY_VCENTER;
        dc.drawText(esq, 22, fonteQueCabe(dc, titulo, Graphics.FONT_SMALL, Graphics.FONT_TINY, largura), titulo, jl);
        dc.drawText(esq, 46, Graphics.FONT_XTINY, sub, jl);
        if (rodada.length() > 0) {
            dc.drawText(sb[0], sb[1], Graphics.FONT_SMALL, rodada, j);
        }
        var fonte = (segundos >= 3600) ? Graphics.FONT_NUMBER_MEDIUM : Graphics.FONT_NUMBER_HOT;
        dc.drawText(cx, 108, fonte, formatarTempo(segundos), j);

        if (_maq.status == ST_CONTANDO || _maq.status == ST_PAUSADO) {
            var prox = _maq.proximoPasso();
            if (prox != null) {
                var p = prox as Passo;
                var txt = (WatchUi.loadResource(Rez.Strings.Proxima) as String) + nomeCategoria(p.cat) + " " + formatarTempo(p.seg);
                dc.drawText(cx, 140, Graphics.FONT_XTINY, txt, j);
            }
            var total = (WatchUi.loadResource(Rez.Strings.Total) as String) + formatarTempo(_maq.tempoTotalMs(agora) / 1000);
            dc.drawText(cx, 158, Graphics.FONT_XTINY, total, j);
        }
        if (hint.length() > 0) {
            dc.drawText(cx, 150, Graphics.FONT_XTINY, hint, j);
        }
    }
}

class ExecutarDelegate extends WatchUi.BehaviorDelegate {
    private var _view as ExecutarView;

    function initialize(view as ExecutarView) {
        BehaviorDelegate.initialize();
        _view = view;
    }

    function onSelect() as Boolean {
        _view.alternar();
        return true;
    }

    function onNextPage() as Boolean {
        _view.proxima();
        return true;
    }

    function onPreviousPage() as Boolean {
        _view.anterior();
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

class SaidaDelegate extends WatchUi.Menu2InputDelegate {
    // Serve ao treino e ao cronômetro livre: ambos têm continuar/sairSalvando/sairDescartando.
    private var _view as ExecutarView or LivreView;

    function initialize(view as ExecutarView or LivreView) {
        Menu2InputDelegate.initialize();
        _view = view;
    }

    function onSelect(item as WatchUi.MenuItem) as Void {
        var id = item.getId();
        if ("continuar".equals(id)) {
            WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
            _view.continuar();
        } else if ("salvar".equals(id)) {
            WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
            _view.sairSalvando();
        } else if ("descartar".equals(id)) {
            WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
            _view.sairDescartando();
        }
    }

    // BACK dentro do menu = continuar.
    function onBack() as Void {
        WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
        _view.continuar();
    }
}
