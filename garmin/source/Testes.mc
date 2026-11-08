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
