// Editor do modo avançado: uma lista de etapas e blocos "Repetir N×" (um nível). Cada linha abre um
// menu de ações (editar, subir, descer, excluir; no bloco, adicionar etapa dentro). Os ids das
// linhas são [indice, filho] com filho = -1 para itens da lista principal.
import Toybox.Lang;
import Toybox.WatchUi;

class EstadoAv {
    var treino as Dictionary;
    var indice as Number;
    var menu as WatchUi.Menu2;

    function initialize(indice as Number, treino as Dictionary, menu as WatchUi.Menu2) {
        self.indice = indice;
        self.treino = treino;
        self.menu = menu;
    }

    function itens() as Array<Dictionary> {
        return treino["i"] as Array<Dictionary>;
    }
}

function opcoesCategoria() as Array<ResourceId> {
    return [Rez.Strings.CatAquecer, Rez.Strings.CatTrabalho, Rez.Strings.CatDescanso, Rez.Strings.CatDesaquecer, Rez.Strings.CatLivre] as Array<ResourceId>;
}

function descEtapa(e as Dictionary) as String {
    var s = e["s"] as Number;
    var nome = WatchUi.loadResource(opcoesCategoria()[e["c"] as Number]) as String;
    return nome + " " + ((s == 0) ? (WatchUi.loadResource(Rez.Strings.FimManual) as String) : formatarTempo(s));
}

// Posição (no menu) da linha [i, j].
function posicaoLinha(itens as Array<Dictionary>, i as Number, j as Number) as Number {
    var p = 0;
    for (var a = 0; a < i; a++) {
        p += 1 + ((itens[a]["v"] != null) ? (itens[a]["i"] as Array).size() : 0);
    }
    return (j < 0) ? p : p + 1 + j;
}

function reconstruirEditor(est as EstadoAv, foco as Number) as Void {
    var menu = est.menu;
    while (menu.deleteItem(0) != null) {
    }
    var itens = est.itens();
    for (var i = 0; i < itens.size(); i++) {
        var it = itens[i];
        if (it["v"] != null) {
            var rotulo = (WatchUi.loadResource(Rez.Strings.Repetir) as String) + " " + (it["v"] as Number).format("%d") + "x";
            menu.addItem(new WatchUi.MenuItem(rotulo, null, [i, -1], null));
            var filhos = it["i"] as Array<Dictionary>;
            for (var j = 0; j < filhos.size(); j++) {
                menu.addItem(new WatchUi.MenuItem("   " + descEtapa(filhos[j]), null, [i, j], null));
            }
        } else {
            menu.addItem(new WatchUi.MenuItem(descEtapa(it), null, [i, -1], null));
        }
    }
    menu.addItem(new WatchUi.MenuItem(Rez.Strings.AddEtapa, null, "add", null));
    menu.addItem(new WatchUi.MenuItem(Rez.Strings.AddRepeticao, null, "rep", null));
    menu.addItem(new WatchUi.ToggleMenuItem(Rez.Strings.PularUltimo, null, "pul", (est.treino["p"] as Number) != 0, null));
    menu.addItem(new WatchUi.MenuItem(Rez.Strings.Salvar, null, "salvar", null));
    if (foco >= 0) {
        menu.setFocus(foco);
    }
}

function mostrarErro(msg as ResourceId) as Void {
    WatchUi.pushView(new WatchUi.Confirmation(WatchUi.loadResource(msg) as String), new ErroDelegate(), WatchUi.SLIDE_UP);
}

class ErroDelegate extends WatchUi.ConfirmationDelegate {
    function initialize() {
        ConfirmationDelegate.initialize();
    }

    function onResponse(resposta as WatchUi.Confirm) as Boolean {
        return true;
    }
}

// Abre o editor avançado. Se `trocar`, substitui a tela atual (vindo do menu de ações).
function abrirEditorAvancado(indice as Number, treino as Dictionary, trocar as Boolean) as Void {
    var menu = new WatchUi.Menu2({ :title => Rez.Strings.TituloAvancado });
    var est = new EstadoAv(indice, treino, menu);
    reconstruirEditor(est, -1);
    if (trocar) {
        WatchUi.switchToView(menu, new EditorAvDelegate(est), WatchUi.SLIDE_LEFT);
    } else {
        WatchUi.pushView(menu, new EditorAvDelegate(est), WatchUi.SLIDE_LEFT);
    }
}

class EditorAvDelegate extends WatchUi.Menu2InputDelegate {
    private var _est as EstadoAv;

    function initialize(est as EstadoAv) {
        Menu2InputDelegate.initialize();
        _est = est;
    }

    function onSelect(item as WatchUi.MenuItem) as Void {
        var id = item.getId();
        var itens = _est.itens();
        if (id instanceof Array) {
            var menu = new WatchUi.Menu2({ :title => item.getLabel() });
            var ij = id as Array;
            menu.addItem(new WatchUi.MenuItem(Rez.Strings.Editar, null, "e", null));
            menu.addItem(new WatchUi.MenuItem(Rez.Strings.Subir, null, "s", null));
            menu.addItem(new WatchUi.MenuItem(Rez.Strings.Descer, null, "d", null));
            menu.addItem(new WatchUi.MenuItem(Rez.Strings.Excluir, null, "x", null));
            if ((ij[1] as Number) < 0 && itens[ij[0] as Number]["v"] != null) {
                menu.addItem(new WatchUi.MenuItem(Rez.Strings.AddDentro, null, "a", null));
            }
            WatchUi.pushView(menu, new LinhaDelegate(_est, ij[0] as Number, ij[1] as Number), WatchUi.SLIDE_LEFT);
        } else if ("add".equals(id) || "rep".equals(id)) {
            if (itens.size() >= LIM_ITENS) {
                mostrarErro(Rez.Strings.ErroLimite);
                return;
            }
            var etapa = { "c" => CAT_TRABALHO, "s" => 30 };
            itens.add(("add".equals(id)) ? etapa : { "v" => 2, "i" => [etapa] as Array<Dictionary> });
            reconstruirEditor(_est, posicaoLinha(itens, itens.size() - 1, -1));
        } else if ("pul".equals(id)) {
            _est.treino["p"] = (item as WatchUi.ToggleMenuItem).isEnabled() ? 1 : 0;
        } else if ("salvar".equals(id)) {
            salvar();
        }
    }

    private function salvar() as Void {
        var t = normalizar(_est.treino);
        if (t == null) {
            mostrarErro(Rez.Strings.ErroVazio);
            return;
        }
        if (contarPassos(t as Dictionary) > LIM_PASSOS) {
            mostrarErro(Rez.Strings.ErroLimite);
            return;
        }
        var lista = lerTreinos();
        if (_est.indice >= 0 && _est.indice < lista.size()) {
            lista[_est.indice] = t as Dictionary;
        } else {
            lista.add(t as Dictionary);
        }
        salvarTreinos(lista);
        if ($.gMenu != null) {
            preencherMenu($.gMenu as WatchUi.Menu2);
        }
        WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
    }

    // BACK nunca descarta sozinho: pergunta antes.
    function onBack() as Void {
        var menu = new WatchUi.Menu2({ :title => Rez.Strings.TituloAvancado });
        menu.addItem(new WatchUi.MenuItem(Rez.Strings.ContinuarEditando, null, "continuar", null));
        menu.addItem(new WatchUi.MenuItem(Rez.Strings.DescartarAlteracoes, null, "descartar", null));
        WatchUi.pushView(menu, new SairEditorDelegate(), WatchUi.SLIDE_UP);
    }
}

class SairEditorDelegate extends WatchUi.Menu2InputDelegate {
    function initialize() {
        Menu2InputDelegate.initialize();
    }

    function onSelect(item as WatchUi.MenuItem) as Void {
        WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
        if ("descartar".equals(item.getId())) {
            WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
        }
    }

    function onBack() as Void {
        WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
    }
}

// Grava o formulário de uma etapa/repetição de volta no item da lista e redesenha o editor.
class SalvadorItem {
    private var _est as EstadoAv;
    private var _alvo as Dictionary;
    private var _i as Number;
    private var _j as Number;

    function initialize(est as EstadoAv, alvo as Dictionary, i as Number, j as Number) {
        _est = est;
        _alvo = alvo;
        _i = i;
        _j = j;
    }

    function salvar(dados as Dictionary) as Void {
        var chaves = dados.keys();
        for (var k = 0; k < chaves.size(); k++) {
            _alvo[chaves[k]] = dados[chaves[k]];
        }
        reconstruirEditor(_est, posicaoLinha(_est.itens(), _i, _j));
    }
}

class LinhaDelegate extends WatchUi.Menu2InputDelegate {
    private var _est as EstadoAv;
    private var _i as Number;
    private var _j as Number;

    function initialize(est as EstadoAv, i as Number, j as Number) {
        Menu2InputDelegate.initialize();
        _est = est;
        _i = i;
        _j = j;
    }

    private function container() as Array<Dictionary> {
        var itens = _est.itens();
        return (_j < 0) ? itens : (itens[_i]["i"] as Array<Dictionary>);
    }

    function onSelect(item as WatchUi.MenuItem) as Void {
        var id = item.getId();
        var itens = _est.itens();
        var cont = container();
        var k = (_j < 0) ? _i : _j;
        if (k >= cont.size()) {
            WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
            return;
        }
        var alvo = cont[k];
        if ("e".equals(id)) {
            editar(alvo);
            return;
        }
        var foco = posicaoLinha(itens, _i, _j);
        if ("s".equals(id) || "d".equals(id)) {
            var nk = ("s".equals(id)) ? k - 1 : k + 1;
            if (nk >= 0 && nk < cont.size()) {
                var tmp = cont[nk];
                cont[nk] = cont[k];
                cont[k] = tmp;
                foco = posicaoLinha(itens, (_j < 0) ? nk : _i, (_j < 0) ? -1 : nk);
            }
        } else if ("x".equals(id)) {
            cont.remove(alvo);
            if (_j >= 0 && cont.size() == 0) {
                itens.remove(itens[_i]); // bloco sem etapas não existe
            }
            foco = 0;
        } else if ("a".equals(id)) {
            var filhos = alvo["i"] as Array<Dictionary>;
            if (filhos.size() >= LIM_ITENS) {
                mostrarErro(Rez.Strings.ErroLimite);
                return;
            }
            filhos.add({ "c" => CAT_TRABALHO, "s" => 30 });
            foco = posicaoLinha(itens, _i, filhos.size() - 1);
        }
        reconstruirEditor(_est, foco);
        WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
    }

    private function editar(alvo as Dictionary) as Void {
        var salvador = new SalvadorItem(_est, alvo, _i, _j);
        var v;
        if (alvo["v"] != null) {
            var campos = [campoNum("v", Rez.Strings.Vezes, 1, LIM_ROUNDS)] as Array<Campo>;
            v = new FormView(Rez.Strings.TituloRepeticao, campos, { "v" => alvo["v"] }, salvador.method(:salvar));
        } else {
            var campos = [
                campoEscolha("c", Rez.Strings.Tipo, opcoesCategoria()),
                campoTempo("s", Rez.Strings.Tempo, 0, true)
            ] as Array<Campo>;
            v = new FormView(Rez.Strings.TituloEtapa, campos, { "c" => alvo["c"], "s" => alvo["s"] }, salvador.method(:salvar));
        }
        WatchUi.switchToView(v, new FormDelegate(v), WatchUi.SLIDE_LEFT);
    }
}
