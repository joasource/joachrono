// Menu principal (lista de treinos) e menus de ação/configuração, todos Menu2 nativos.
import Toybox.Application.Storage;
import Toybox.Lang;
import Toybox.WatchUi;

// Menu da lista, guardado para ser reconstruído depois de editar ou excluir.
var gMenu as WatchUi.Menu2? = null;

function textoContagem(s as Number) as String {
    return (s == 0) ? WatchUi.loadResource(Rez.Strings.Desligado) as String : s.format("%d") + " s";
}

function preencherMenu(menu as WatchUi.Menu2) as Void {
    while (menu.deleteItem(0) != null) {
    }
    var lista = lerTreinos();
    for (var i = 0; i < lista.size(); i++) {
        var t = lista[i];
        var total = formatarTempo(duracaoTotal(passosDeRounds(t)));
        var sub = (WatchUi.loadResource(Rez.Strings.Total) as String) + total;
        menu.addItem(new WatchUi.MenuItem(resumo(t), sub, i, null));
    }
    menu.addItem(new WatchUi.MenuItem(Rez.Strings.NovoTreino, null, "novo", null));
    menu.addItem(new WatchUi.MenuItem(Rez.Strings.CronometroLivre, null, "livre", null));
    menu.addItem(new WatchUi.MenuItem(Rez.Strings.Configuracoes, null, "cfg", null));
}

class ListaDelegate extends WatchUi.Menu2InputDelegate {
    function initialize() {
        Menu2InputDelegate.initialize();
    }

    function onSelect(item as WatchUi.MenuItem) as Void {
        var id = item.getId();
        if (id instanceof Number) {
            var menu = new WatchUi.Menu2({ :title => item.getLabel() });
            menu.addItem(new WatchUi.MenuItem(Rez.Strings.Iniciar, null, "iniciar", null));
            menu.addItem(new WatchUi.MenuItem(Rez.Strings.Editar, null, "editar", null));
            menu.addItem(new WatchUi.MenuItem(Rez.Strings.Excluir, null, "excluir", null));
            WatchUi.pushView(menu, new AcaoDelegate(id as Number), WatchUi.SLIDE_LEFT);
        } else if ("novo".equals(id)) {
            abrirEditorSimples(-1, treinoPadrao(), false);
        } else if ("livre".equals(id)) {
            var v = new LivreView();
            WatchUi.pushView(v, new LivreDelegate(v), WatchUi.SLIDE_LEFT);
        } else if ("cfg".equals(id)) {
            var menu = new WatchUi.Menu2({ :title => Rez.Strings.Configuracoes });
            menu.addItem(new WatchUi.ToggleMenuItem(Rez.Strings.Som, null, "som", configSom(), null));
            menu.addItem(new WatchUi.ToggleMenuItem(Rez.Strings.Vibracao, null, "vib", configVibracao(), null));
            menu.addItem(new WatchUi.MenuItem(Rez.Strings.Contagem, textoContagem(configContagem()), "cd", null));
            WatchUi.pushView(menu, new ConfigDelegate(), WatchUi.SLIDE_LEFT);
        }
    }
}

class AcaoDelegate extends WatchUi.Menu2InputDelegate {
    private var _indice as Number;

    function initialize(indice as Number) {
        Menu2InputDelegate.initialize();
        _indice = indice;
    }

    function onSelect(item as WatchUi.MenuItem) as Void {
        var id = item.getId();
        var lista = lerTreinos();
        if (_indice >= lista.size()) {
            WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
            return;
        }
        if ("iniciar".equals(id)) {
            var v = new ExecutarView(lista[_indice]);
            WatchUi.switchToView(v, new ExecutarDelegate(v), WatchUi.SLIDE_LEFT);
        } else if ("editar".equals(id)) {
            abrirEditorSimples(_indice, lista[_indice], true);
        } else if ("excluir".equals(id)) {
            lista.remove(lista[_indice]);
            salvarTreinos(lista);
            if ($.gMenu != null) {
                preencherMenu($.gMenu as WatchUi.Menu2);
            }
            WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
        }
    }
}

class ConfigDelegate extends WatchUi.Menu2InputDelegate {
    function initialize() {
        Menu2InputDelegate.initialize();
    }

    function onSelect(item as WatchUi.MenuItem) as Void {
        var id = item.getId();
        if ("som".equals(id)) {
            Storage.setValue("som", (item as WatchUi.ToggleMenuItem).isEnabled() ? 1 : 0);
        } else if ("vib".equals(id)) {
            Storage.setValue("vib", (item as WatchUi.ToggleMenuItem).isEnabled() ? 1 : 0);
        } else if ("cd".equals(id)) {
            var novo = proximaContagem(configContagem());
            Storage.setValue("cd", novo);
            item.setSubLabel(textoContagem(novo));
            WatchUi.requestUpdate();
        }
    }
}
