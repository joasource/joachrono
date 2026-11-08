// Testes do motor (portados de src/motor/__tests__/motor.test.ts). Rodam no simulador:
// monkeyc ... --unit-test e monkeydo ... -t. Ficam fora do build de release.
import Toybox.Lang;
import Toybox.Test;

(:test)
function testeCompilaERemoveDescansoFinal(logger as Logger) as Boolean {
    var p = passosDeRounds(treinoNovo(3, 20, 10, 0, 0));
    var cats = [CAT_TRABALHO, CAT_DESCANSO, CAT_TRABALHO, CAT_DESCANSO, CAT_TRABALHO];
    Test.assertEqual(p.size(), cats.size());
    for (var i = 0; i < cats.size(); i++) {
        Test.assertEqual(p[i].cat, cats[i]);
    }
    Test.assertEqual(p[4].atual, 3);
    Test.assertEqual(p[4].total, 3);
    return true;
}

(:test)
function testeMantemDescansoAntesDoDesaquecimento(logger as Logger) as Boolean {
    var p = passosDeRounds(treinoNovo(3, 20, 10, 0, 60));
    Test.assertEqual(p[p.size() - 2].cat, CAT_DESCANSO);
    Test.assertEqual(p[p.size() - 1].cat, CAT_DESAQUECER);
    return true;
}

(:test)
function testeSemDescansoEComAquecimento(logger as Logger) as Boolean {
    var p = passosDeRounds(treinoNovo(3, 20, 0, 30, 0));
    Test.assertEqual(p.size(), 4);
    Test.assertEqual(p[0].cat, CAT_AQUECER);
    return true;
}

(:test)
function testeDuracaoTotal(logger as Logger) as Boolean {
    Test.assertEqual(duracaoTotal(passosDeRounds(treinoNovo(3, 20, 10, 0, 0))), 80);
    return true;
}

(:test)
function testeNaoContaAntesDeIniciar(logger as Logger) as Boolean {
    var m = new Maquina(passosDeRounds(treinoNovo(3, 20, 10, 0, 0)));
    Test.assertEqual(m.status, ST_PRONTO);
    Test.assertEqual(m.decorridoNoPassoMs(5000), 0);
    Test.assertEqual(m.tick(99000).size(), 0);
    return true;
}

(:test)
function testePausaERetomaSemContarOTempoParado(logger as Logger) as Boolean {
    var m = new Maquina(passosDeRounds(treinoNovo(3, 20, 10, 0, 0)));
    m.iniciar(0);
    m.pausar(8000);
    Test.assertEqual(m.decorridoNoPassoMs(100000), 8000);
    m.retomar(100000);
    Test.assertEqual(m.restanteMs(104000), 8000);
    return true;
}

(:test)
function testeTrocaNoInstanteCerto(logger as Logger) as Boolean {
    var m = new Maquina(passosDeRounds(treinoNovo(3, 20, 10, 0, 0)));
    m.iniciar(0);
    Test.assertEqual(m.tick(19999).size(), 0);
    var ev = m.tick(20000);
    Test.assertEqual(ev.size(), 1);
    Test.assertEqual(ev[0], EV_TROCA);
    Test.assertEqual(m.passoAtual().cat, CAT_DESCANSO);
    Test.assertEqual(m.restanteMs(20000), 10000);
    return true;
}

(:test)
function testeAtravessaVariasEtapasEPreservaExcedente(logger as Logger) as Boolean {
    var m = new Maquina(passosDeRounds(treinoNovo(3, 20, 10, 0, 0)));
    m.iniciar(0);
    // 20 + 10 + 20 = 50; 3 s a mais caem no descanso seguinte.
    var ev = m.tick(53000);
    Test.assertEqual(ev.size(), 3);
    Test.assertEqual(m.indice, 3);
    Test.assertEqual(m.restanteMs(53000), 7000);
    Test.assertEqual(m.tempoTotalMs(53000), 53000);
    return true;
}

(:test)
function testeConcluiEParaDeContar(logger as Logger) as Boolean {
    var m = new Maquina(passosDeRounds(treinoNovo(3, 20, 10, 0, 0)));
    m.iniciar(0);
    var ev = m.tick(500000);
    Test.assertEqual(ev[ev.size() - 1], EV_FIM);
    Test.assertEqual(m.status, ST_CONCLUIDO);
    Test.assertEqual(m.tempoTotalMs(900000), 80000);
    Test.assertEqual(m.tick(1000000).size(), 0);
    return true;
}

(:test)
function testeAvancarPulaParaAProxima(logger as Logger) as Boolean {
    var m = new Maquina(passosDeRounds(treinoNovo(3, 20, 10, 0, 0)));
    m.iniciar(0);
    var ev = m.avancar(5000);
    Test.assertEqual(ev[0], EV_TROCA);
    Test.assertEqual(m.indice, 1);
    Test.assertEqual(m.tempoTotalMs(5000), 5000);
    return true;
}

(:test)
function testeVoltarReiniciaDepoisDe3sEVoltaUmaAntes(logger as Logger) as Boolean {
    var m = new Maquina(passosDeRounds(treinoNovo(3, 20, 10, 0, 0)));
    m.iniciar(0);
    m.tick(20000); // entra no descanso
    m.voltar(25000); // 5 s no descanso: reinicia o descanso
    Test.assertEqual(m.indice, 1);
    Test.assertEqual(m.restanteMs(25000), 10000);
    m.voltar(26000); // 1 s: volta ao trabalho e desfaz os 20 s dele
    Test.assertEqual(m.indice, 0);
    Test.assertEqual(m.tempoTotalMs(26000), 0);
    return true;
}

(:test)
function testeLivreContaPausaEMarcaVoltas(logger as Logger) as Boolean {
    var l = new Livre();
    Test.assertEqual(l.decorridoMs(5000), 0);
    l.volta(1000); // parado: ignora
    Test.assertEqual(l.marcas.size(), 0);
    l.iniciar(1000);
    Test.assertEqual(l.decorridoMs(6000), 5000);
    l.volta(11000);
    l.volta(31000);
    l.pausar(41000);
    Test.assertEqual(l.decorridoMs(99000), 40000);
    l.volta(50000); // pausado: ignora
    Test.assertEqual(l.marcas.size(), 2);
    Test.assertEqual(l.duracaoDaVolta(0), 10000);
    Test.assertEqual(l.duracaoDaVolta(1), 20000);
    l.iniciar(100000);
    Test.assertEqual(l.decorridoMs(105000), 45000);
    return true;
}

(:test)
function testeEdicaoDeTempoMinutosESegundosSeparados(logger as Logger) as Boolean {
    var c = campoTempo("t", Rez.Strings.TempoTrabalho, 1, false);
    // Segundos: passo exato de 1 e volta de 59 para 0 sem mexer nos minutos.
    Test.assertEqual(mudarValor(c, 90, 1, 1), 91);
    Test.assertEqual(mudarValor(c, 119, 1, 1), 60);
    Test.assertEqual(mudarValor(c, 60, -1, 1), 119);
    // Minutos: passo de 60 s, sem mexer nos segundos.
    Test.assertEqual(mudarValor(c, 95, 1, 0), 155);
    Test.assertEqual(mudarValor(c, 95, -1, 0), 35);
    // Limites: nunca abaixo do mínimo (1 s) nem acima de 60:00.
    Test.assertEqual(mudarValor(c, 1, -1, 1), 1); // 0 s ficaria abaixo do mínimo: fica em 1 s
    return true;
}

(:test)
function testeEdicaoDeTempoLimites(logger as Logger) as Boolean {
    var c = campoTempo("t", Rez.Strings.TempoTrabalho, 1, false);
    Test.assertEqual(mudarValor(c, 3600, 1, 0), 3600);
    Test.assertEqual(mudarValor(c, 3599, 1, 1), 3540);
    Test.assertEqual(mudarValor(c, 5, -1, 0), 5); // minutos não ficam negativos
    var m = campoTempo("s", Rez.Strings.Tempo, 0, true);
    Test.assertEqual(mudarValor(m, 0, -1, 0), 0);
    return true;
}

(:test)
function testeEdicaoDeNumeroEscolhaEBool(logger as Logger) as Boolean {
    var n = campoNum("r", Rez.Strings.Rounds, 1, 99);
    Test.assertEqual(mudarValor(n, 99, 1, 0), 99);
    Test.assertEqual(mudarValor(n, 1, -1, 0), 1);
    Test.assertEqual(mudarValor(n, 8, 1, 0), 9);
    var e = campoEscolha("c", Rez.Strings.Tipo, [Rez.Strings.CatAquecer, Rez.Strings.CatTrabalho, Rez.Strings.CatDescanso] as Array<ResourceId>);
    Test.assertEqual(mudarValor(e, 2, 1, 0), 0);
    Test.assertEqual(mudarValor(e, 0, -1, 0), 2);
    var b = campoBool("p", Rez.Strings.PularUltimo);
    Test.assertEqual(mudarValor(b, 1, 1, 0), 0);
    return true;
}

function treinoAv(itens as Array<Dictionary>, pular as Number) as Dictionary {
    return { "m" => "a", "i" => itens, "p" => pular };
}

(:test)
function testeAvancadoDesdobraRepeticoes(logger as Logger) as Boolean {
    var t = treinoAv([
        { "c" => CAT_AQUECER, "s" => 300 },
        { "v" => 3, "i" => [{ "c" => CAT_TRABALHO, "s" => 30 }, { "c" => CAT_DESCANSO, "s" => 15 }] as Array<Dictionary> },
        { "c" => CAT_DESAQUECER, "s" => 300 }
    ] as Array<Dictionary>, 1);
    var p = passosAvancados(t);
    // 1 + 3x2 + 1; o descanso da última rodada fica porque o desaquecimento vem depois.
    Test.assertEqual(p.size(), 8);
    Test.assertEqual(contarPassos(t), 8);
    Test.assertEqual(p[0].cat, CAT_AQUECER);
    Test.assertEqual(p[5].cat, CAT_TRABALHO);
    Test.assertEqual(p[5].atual, 3);
    Test.assertEqual(p[5].total, 3);
    Test.assertEqual(p[7].cat, CAT_DESAQUECER);
    Test.assertEqual(duracaoTotal(p), 300 + 3 * 45 + 300);
    return true;
}

(:test)
function testeAvancadoPulaOUltimoDescansoSoNoFim(logger as Logger) as Boolean {
    var itens = [{ "v" => 2, "i" => [{ "c" => CAT_TRABALHO, "s" => 20 }, { "c" => CAT_DESCANSO, "s" => 10 }] as Array<Dictionary> }] as Array<Dictionary>;
    Test.assertEqual(passosAvancados(treinoAv(itens, 1)).size(), 3);
    Test.assertEqual(passosAvancados(treinoAv(itens, 0)).size(), 4);
    return true;
}

(:test)
function testeAvancadoEtapaManualEsperaOToque(logger as Logger) as Boolean {
    var t = treinoAv([
        { "c" => CAT_AQUECER, "s" => 5 },
        { "c" => CAT_LIVRE, "s" => 0 },
        { "c" => CAT_DESCANSO, "s" => 10 }
    ] as Array<Dictionary>, 0);
    var m = new Maquina(passosAvancados(t));
    m.iniciar(0);
    var ev = m.tick(60000);
    Test.assertEqual(ev.size(), 1); // atravessa o aquecimento e para na etapa manual
    Test.assertEqual(m.indice, 1);
    Test.assert(m.restanteMs(60000) == null);
    var av = m.avancar(62000);
    Test.assertEqual(av[0], EV_TROCA);
    Test.assertEqual(m.restanteMs(62000), 10000);
    Test.assertEqual(m.tempoTotalMs(62000), 62000);
    return true;
}

(:test)
function testeNormalizaAvancadoRejeitaLixoEAninhamento(logger as Logger) as Boolean {
    Test.assert(normalizar({ "m" => "a", "i" => [] }) == null);
    Test.assert(normalizar({ "m" => "a", "i" => "x" }) == null);
    var n = normalizar({
        "m" => "a",
        "i" => [
            { "c" => 99, "s" => -5 },
            { "v" => 500, "i" => [{ "c" => 1, "s" => 20 }, { "v" => 2, "i" => [{ "c" => 1, "s" => 5 }] }] },
            { "v" => 3, "i" => [] },
            42
        ]
    });
    Test.assert(n != null);
    var itens = (n as Dictionary)["i"] as Array<Dictionary>;
    Test.assertEqual(itens.size(), 2); // a repetição vazia e o lixo caem fora
    Test.assertEqual(itens[0]["c"], 4); // categoria limitada
    Test.assertEqual(itens[0]["s"], 0); // segundos limitados
    Test.assertEqual(itens[1]["v"], 99); // vezes limitadas
    Test.assertEqual((itens[1]["i"] as Array).size(), 1); // repetição dentro de repetição não entra
    return true;
}
