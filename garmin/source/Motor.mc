// Porte do motor do joaChrono (src/motor/ em TypeScript) para Monkey C.
// Mesma semântica: o treino vira uma lista linear de passos e o tempo é sempre calculado por
// diferença de timestamps (System.getTimer), nunca contando ticks. `tick` atravessa todos os passos
// vencidos e carrega o excedente para o seguinte.
import Toybox.Lang;

enum {
    CAT_AQUECER,
    CAT_TRABALHO,
    CAT_DESCANSO,
    CAT_DESAQUECER,
    CAT_LIVRE
}

enum {
    ST_PRONTO,
    ST_CONTANDO,
    ST_PAUSADO,
    ST_CONCLUIDO
}

enum {
    EV_TROCA,
    EV_FIM
}

// Passo já desdobrado. seg == 0 significa fim manual (ninguém toca nisso no modo simples).
class Passo {
    var cat as Number;
    var seg as Number;
    var atual as Number;
    var total as Number;

    function initialize(cat as Number, seg as Number, atual as Number, total as Number) {
        self.cat = cat;
        self.seg = seg;
        self.atual = atual;
        self.total = total;
    }
}

// Equivale a compilar(treinoDeRounds(...)): aquecimento, N x (trabalho + descanso), desaquecimento,
// sem os descansos que sobrariam no fim (só os que estão no final da lista).
function passosDeRounds(t as Dictionary) as Array<Passo> {
    var rounds = t["r"] as Number;
    var trabalho = t["t"] as Number;
    var descanso = t["d"] as Number;
    var aquec = t["a"] as Number;
    var desaq = t["z"] as Number;
    var pular = (t["p"] as Number) != 0;

    var l = [] as Array<Passo>;
    if (aquec > 0) {
        l.add(new Passo(CAT_AQUECER, aquec, 0, 0));
    }
    for (var i = 1; i <= rounds; i++) {
        l.add(new Passo(CAT_TRABALHO, trabalho, i, rounds));
        if (descanso > 0) {
            l.add(new Passo(CAT_DESCANSO, descanso, i, rounds));
        }
    }
    if (desaq > 0) {
        l.add(new Passo(CAT_DESAQUECER, desaq, 0, 0));
    }
    if (pular) {
        while (l.size() > 1 && l[l.size() - 1].cat == CAT_DESCANSO) {
            l = l.slice(0, l.size() - 1) as Array<Passo>;
        }
    }
    return l;
}

// Equivale a compilar(treino avançado): desdobra as repetições (um nível) e tira os descansos que
// sobrariam no fim, se o treino pede para pular o último descanso.
function passosAvancados(t as Dictionary) as Array<Passo> {
    var itens = t["i"] as Array<Dictionary>;
    var l = [] as Array<Passo>;
    for (var i = 0; i < itens.size(); i++) {
        var it = itens[i];
        if (it["v"] != null) {
            var vezes = it["v"] as Number;
            var filhos = it["i"] as Array<Dictionary>;
            for (var n = 1; n <= vezes; n++) {
                for (var j = 0; j < filhos.size(); j++) {
                    l.add(new Passo(filhos[j]["c"] as Number, filhos[j]["s"] as Number, n, vezes));
                }
            }
        } else {
            l.add(new Passo(it["c"] as Number, it["s"] as Number, 0, 0));
        }
    }
    if ((t["p"] as Number) != 0) {
        while (l.size() > 1 && l[l.size() - 1].cat == CAT_DESCANSO) {
            l = l.slice(0, l.size() - 1) as Array<Passo>;
        }
    }
    return l;
}

// Quantos passos o treino tem depois de desdobrado (sem montar os objetos).
function contarPassos(t as Dictionary) as Number {
    if (!ehAvancado(t)) {
        return passosDeRounds(t).size();
    }
    var itens = t["i"] as Array<Dictionary>;
    var n = 0;
    for (var i = 0; i < itens.size(); i++) {
        n += (itens[i]["v"] != null) ? (itens[i]["v"] as Number) * (itens[i]["i"] as Array).size() : 1;
    }
    return n;
}

// Soma dos passos por tempo, em segundos.
function duracaoTotal(passos as Array<Passo>) as Number {
    var s = 0;
    for (var i = 0; i < passos.size(); i++) {
        s += passos[i].seg;
    }
    return s;
}

class Maquina {
    var passos as Array<Passo>;
    var indice as Number = 0;
    var status as Number = ST_PRONTO;
    // Tempo já decorrido no passo atual, até retomadoEm (ms).
    var acumuladoMs as Number = 0;
    // Instante em que o passo voltou a contar; só vale com status == ST_CONTANDO.
    var retomadoEm as Number = 0;
    // Soma do tempo dos passos terminados (ms).
    var concluidoMs as Number = 0;
    var terminadosMs as Array<Number> = [] as Array<Number>;

    function initialize(passos as Array<Passo>) {
        self.passos = passos;
    }

    function passoAtual() as Passo {
        return passos[indice];
    }

    function proximoPasso() as Passo? {
        return (indice + 1 < passos.size()) ? passos[indice + 1] : null;
    }

    function decorridoNoPassoMs(agora as Number) as Number {
        var corrente = (status == ST_CONTANDO) ? agora - retomadoEm : 0;
        if (corrente < 0) {
            corrente = 0;
        }
        return acumuladoMs + corrente;
    }

    // Tempo que falta no passo atual; null quando o passo termina por toque.
    function restanteMs(agora as Number) as Number? {
        var seg = passoAtual().seg;
        if (seg == 0) {
            return null;
        }
        var r = seg * 1000 - decorridoNoPassoMs(agora);
        return (r < 0) ? 0 : r;
    }

    function tempoTotalMs(agora as Number) as Number {
        return concluidoMs + decorridoNoPassoMs(agora);
    }

    function iniciar(agora as Number) as Void {
        if (status != ST_PRONTO) {
            return;
        }
        status = ST_CONTANDO;
        retomadoEm = agora;
    }

    function pausar(agora as Number) as Void {
        if (status != ST_CONTANDO) {
            return;
        }
        acumuladoMs = decorridoNoPassoMs(agora);
        status = ST_PAUSADO;
    }

    function retomar(agora as Number) as Void {
        if (status != ST_PAUSADO) {
            return;
        }
        status = ST_CONTANDO;
        retomadoEm = agora;
    }

    // Vai para o passo `para` (ou conclui). `carryMs` é o excedente do passo anterior.
    private function irPara(para as Number, terminadoMs as Number, carryMs as Number, agora as Number) as Number {
        concluidoMs += terminadoMs;
        terminadosMs.add(terminadoMs);
        if (para >= passos.size()) {
            status = ST_CONCLUIDO;
            indice = passos.size() - 1;
            acumuladoMs = 0;
            return EV_FIM;
        }
        indice = para;
        acumuladoMs = carryMs;
        retomadoEm = agora;
        return EV_TROCA;
    }

    // Botão "próxima etapa" (ou fim de uma etapa manual).
    function avancar(agora as Number) as Array<Number> {
        if (status == ST_CONCLUIDO || status == ST_PRONTO) {
            return [] as Array<Number>;
        }
        return [irPara(indice + 1, decorridoNoPassoMs(agora), 0, agora)] as Array<Number>;
    }

    // Como um player de música: depois de 3 s na etapa reinicia a atual; antes disso volta uma.
    function voltar(agora as Number) as Void {
        if (status == ST_PRONTO || status == ST_CONCLUIDO) {
            return;
        }
        var reiniciar = (indice == 0) || (decorridoNoPassoMs(agora) > 3000);
        var alvo = reiniciar ? indice : indice - 1;
        // O tempo da etapa abandonada não conta no total: ela será refeita.
        var desfeito = 0;
        if (!reiniciar) {
            desfeito = (alvo < terminadosMs.size()) ? terminadosMs[alvo] : 0;
            terminadosMs = terminadosMs.slice(0, alvo) as Array<Number>;
        }
        indice = alvo;
        acumuladoMs = 0;
        retomadoEm = agora;
        concluidoMs -= desfeito;
    }

    // Atravessa todas as etapas por tempo que já venceram, carregando o excedente. Devolve os eventos.
    function tick(agora as Number) as Array<Number> {
        var eventos = [] as Array<Number>;
        if (status != ST_CONTANDO) {
            return eventos;
        }
        var decorrido = decorridoNoPassoMs(agora);
        while (true) {
            var seg = passos[indice].seg;
            if (seg == 0) {
                break;
            }
            var duracao = seg * 1000;
            if (decorrido < duracao) {
                break;
            }
            var ev = irPara(indice + 1, duracao, decorrido - duracao, agora);
            eventos.add(ev);
            decorrido -= duracao;
            if (status == ST_CONCLUIDO) {
                break;
            }
        }
        return eventos;
    }
}
