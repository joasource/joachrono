// Treinos e configurações guardados no relógio (Application.Storage). Só o "modo simples" do app:
// r = rounds, t = trabalho (s), d = descanso (s), a = aquecimento (s), z = desaquecimento (s),
// p = 1 para pular o último descanso.
import Toybox.Application.Storage;
import Toybox.Lang;
import Toybox.WatchUi;

const LIM_ROUNDS = 99;
const LIM_SEG = 3600;
// Itens na lista principal e etapas depois de desdobrar as repetições (o relógio tem pouca memória).
const LIM_ITENS = 40;
const LIM_PASSOS = 500;

function treinoPadrao() as Dictionary {
    return { "r" => 3, "t" => 60, "d" => 30, "a" => 0, "z" => 0, "p" => 1 };
}

function treinoNovo(r as Number, t as Number, d as Number, a as Number, z as Number) as Dictionary {
    return { "r" => r, "t" => t, "d" => d, "a" => a, "z" => z, "p" => 1 };
}

function limitar(v as Object?, min as Number, max as Number, padrao as Number) as Number {
    if (!(v instanceof Number)) {
        return padrao;
    }
    var n = v as Number;
    return (n < min) ? min : ((n > max) ? max : n);
}

// Treino avançado: {"m" => "a", "i" => itens, "p" => pular último descanso}. Cada item é uma etapa
// {"c" => categoria, "s" => segundos (0 = fim manual)} ou uma repetição {"v" => vezes, "i" => etapas}
// (um nível só: não há repetição dentro de repetição, como no app).
function ehAvancado(t as Dictionary) as Boolean {
    return "a".equals(t["m"]);
}

function normalizarItens(bruto as Object?, dentro as Boolean) as Array<Dictionary> {
    var lista = [] as Array<Dictionary>;
    if (!(bruto instanceof Array)) {
        return lista;
    }
    var arr = bruto as Array;
    for (var i = 0; i < arr.size() && lista.size() < LIM_ITENS; i++) {
        var x = arr[i];
        if (!(x instanceof Dictionary)) {
            continue;
        }
        var d = x as Dictionary;
        if (d["v"] != null) {
            if (dentro) {
                continue;
            }
            var filhos = normalizarItens(d["i"], true);
            if (filhos.size() > 0) {
                lista.add({ "v" => limitar(d["v"], 1, LIM_ROUNDS, 2), "i" => filhos });
            }
        } else if (d["c"] != null) {
            lista.add({ "c" => limitar(d["c"], 0, 4, CAT_TRABALHO), "s" => limitar(d["s"], 0, LIM_SEG, 30) });
        }
    }
    return lista;
}

function normalizarAvancado(b as Dictionary) as Dictionary? {
    var itens = normalizarItens(b["i"], false);
    if (itens.size() == 0) {
        return null;
    }
    return { "m" => "a", "i" => itens, "p" => (b["p"] == 0) ? 0 : 1 };
}

function novoAvancado() as Dictionary {
    return { "m" => "a", "i" => [{ "c" => CAT_TRABALHO, "s" => 30 }] as Array<Dictionary>, "p" => 1 };
}

// Dados vindos do disco são tratados como não confiáveis, como no app.
function normalizar(bruto as Object?) as Dictionary? {
    if (!(bruto instanceof Dictionary)) {
        return null;
    }
    var b = bruto as Dictionary;
    if (ehAvancado(b)) {
        return normalizarAvancado(b);
    }
    var p = treinoPadrao();
    return {
        "r" => limitar(b["r"], 1, LIM_ROUNDS, p["r"] as Number),
        "t" => limitar(b["t"], 1, LIM_SEG, p["t"] as Number),
        "d" => limitar(b["d"], 0, LIM_SEG, p["d"] as Number),
        "a" => limitar(b["a"], 0, LIM_SEG, 0),
        "z" => limitar(b["z"], 0, LIM_SEG, 0),
        "p" => (b["p"] == 0) ? 0 : 1
    };
}

function lerTreinos() as Array<Dictionary> {
    var lista = [] as Array<Dictionary>;
    var bruto = Storage.getValue("treinos");
    if (bruto instanceof Array) {
        for (var i = 0; i < bruto.size(); i++) {
            var t = normalizar(bruto[i]);
            if (t != null) {
                lista.add(t);
            }
        }
    }
    return lista;
}

function salvarTreinos(lista as Array<Dictionary>) as Void {
    Storage.setValue("treinos", lista);
}

// "m:ss" (ou "h:mm:ss" a partir de 1 h).
function formatarTempo(seg as Number) as String {
    var s = (seg < 0) ? 0 : seg;
    var h = s / 3600;
    var m = (s % 3600) / 60;
    var ss = s % 60;
    if (h > 0) {
        return h.format("%d") + ":" + m.format("%02d") + ":" + ss.format("%02d");
    }
    return m.format("%d") + ":" + ss.format("%02d");
}

function resumo(t as Dictionary) as String {
    if (ehAvancado(t)) {
        return (WatchUi.loadResource(Rez.Strings.Avancado) as String) + " (" + contarPassos(t).format("%d") + ")";
    }
    var txt = (t["r"] as Number).format("%d") + "x " + formatarTempo(t["t"] as Number);
    if ((t["d"] as Number) > 0) {
        txt += " / " + formatarTempo(t["d"] as Number);
    }
    return txt;
}

// ---- Configurações ----

function lerConfig(chave as String, padrao as Number) as Number {
    var v = Storage.getValue(chave);
    return (v instanceof Number) ? (v as Number) : padrao;
}

function configSom() as Boolean {
    return lerConfig("som", 1) != 0;
}

function configVibracao() as Boolean {
    return lerConfig("vib", 1) != 0;
}

// Segundos de contagem regressiva (0 = desligada). Valores: 0, 3, 5, 10.
function configContagem() as Number {
    return lerConfig("cd", 3);
}

function proximaContagem(atual as Number) as Number {
    return (atual == 0) ? 3 : ((atual == 3) ? 5 : ((atual == 5) ? 10 : 0));
}

// Passos do treino, qualquer que seja o modo.
function passosDe(t as Dictionary) as Array<Passo> {
    return ehAvancado(t) ? passosAvancados(t) : passosDeRounds(t);
}

// Texto do total: "17:30", com "+" quando há etapa manual (o total real pode ser maior).
function textoTotal(t as Dictionary) as String {
    var passos = passosDe(t);
    var manual = false;
    for (var i = 0; i < passos.size(); i++) {
        if (passos[i].seg == 0) {
            manual = true;
        }
    }
    return formatarTempo(duracaoTotal(passos)) + (manual ? "+" : "");
}
