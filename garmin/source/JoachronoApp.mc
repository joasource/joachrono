import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;

class JoachronoApp extends Application.AppBase {
    function initialize() {
        AppBase.initialize();
    }

    function getInitialView() as [WatchUi.Views] or [WatchUi.Views, WatchUi.InputDelegates] {
        var menu = new WatchUi.Menu2({ :title => Rez.Strings.AppName });
        $.gMenu = menu;
        preencherMenu(menu);
        return [menu, new ListaDelegate()];
    }
}
