# joaChrono para Garmin Instinct 2X Solar

App Connect IQ (Monkey C, `watch-app`) que porta o motor do joaChrono para o relógio. Alvo: `instinct2x`, API 3.4, tela 176×176 monocromática, só botões.

## O que faz (v1)

- Lista de treinos do **modo simples** (rounds, trabalho, descanso, aquecimento, desaquecimento, pular último descanso), guardados no relógio. A lista começa vazia na primeira execução. O editor segue a ordem do app: aquecimento, rounds, trabalho, descanso, desaquecimento.
- Editor no relógio (`Form.mc`): minutos e segundos separados, números exatos (1 s, 1 min), UP/DOWN mudam o valor e **segurar repete cada vez mais rápido**, START avança (minutos → segundos → próximo campo, e salva no último), BACK volta.
- **Modo avançado** (`Avancado.mc`): "+ Treino avançado" abre uma lista de etapas (aquecer, trabalho, descanso, desaquecer, livre) e blocos "Repetir N×" (um nível, como no app). Cada linha abre ações: editar, subir, descer, excluir e, no bloco, adicionar etapa dentro. Tempo 0:00 = fim manual (DOWN avança). BACK pergunta antes de descartar. Limites: 40 itens e 500 etapas desdobradas.
- Treino: START pausa/retoma, DOWN próxima etapa, UP volta (reinicia a etapa depois de 3 s), BACK abre o menu Continuar / Salvar e sair / Descartar e sair. Trabalho aparece em fundo branco, o resto em fundo preto.
- **Cronômetro livre** (item da lista): START inicia/pausa, DOWN marca volta (mostra as duas últimas), BACK abre o mesmo menu de saída; grava a atividade com as voltas.
- Bipe e vibração nas trocas, contagem regressiva (0/3/5/10 s) e luz acesa na troca. Configurações no menu da lista.
- Grava a sessão (permissão `Fit`) como Treino/Cardio, com frequência cardíaca, no Garmin Connect.
- PT-BR e EN (`resources-por/`).

Fora da v1: sincronizar treinos do celular e histórico no relógio.

## Estrutura

```
source/Motor.mc       porte de src/motor (passos, máquina de estados, tempo por timestamps)
source/Testes.mc      testes do motor (portados de motor.test.ts)
source/Avancado.mc    editor do modo avançado (etapas e blocos Repetir)
source/Form.mc        formulário de edição (número, tempo mm:ss, escolha, sim/não) com repetição ao segurar
source/Treinos.mc     treinos e configurações em Application.Storage
source/Lista.mc       lista de treinos, ações e configurações (Menu2)
source/Executar.mc    tela do treino + gravação da atividade
source/Livre.mc       cronômetro livre com voltas (porte de livre.ts)
source/Tela.mc        desvio da subtela circular do Instinct
tools/                build.sh, test.sh e Dockerfiles do simulador
```

## Como compilar

1. Instale o SDK 9.3.0 e o dispositivo Instinct 2X com o SDK Manager. No Ubuntu 24.04 ele precisa do `libwebkit2gtk-4.0`: rode-o no Docker (`tools/docker/Dockerfile`).
2. Gere a chave de desenvolvedor **fora do repositório** (ela nunca vai para o git):
   `openssl genrsa -out developer_key.pem 4096 && openssl pkcs8 -topk8 -inform PEM -outform DER -in developer_key.pem -out developer_key.der -nocrypt`
   e guarde em `~/garmin-sdk/keys/` (ou use `CIQ_KEY`).
3. `garmin/tools/build.sh` gera `~/garmin-sdk/out/joachrono.prg`.
4. `garmin/tools/test.sh` roda os testes no simulador (precisa das imagens Docker `ciq-sdkm` e `ciq-sim`).

## Instalar no relógio

Conecte o relógio por USB e copie o `joachrono.prg` para `GARMIN/APPS/` (em Linux ele costuma aparecer como MTP). Desconecte e o app aparece na lista de apps.

## Pendências

- Instalado e testado no Instinct 2X real (funcionou).
- Fase 2: sincronizar treinos do celular (Connect IQ Mobile SDK no app Expo, exige novo development build).
