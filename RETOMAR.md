# Joachrono — como retomar

App de cronômetro de exercícios (Android e iOS), Expo SDK 58 + TypeScript + expo-router. Licença proprietária.

## Decisões já tomadas

- Expo/React Native (não Flutter). MVP: modo simples (rounds) + editor avançado (etapas e blocos "Repetir N×" de um nível só, como no Garmin), cronômetro livre com voltas.
- "Aberto" = modelo flexível como o Garmin: etapas (aquecer, trabalho, descanso, desaquecer, livre) com fim por tempo ou manual, dentro de repetições aninhadas.
- Vai ser publicado nas lojas; PT-BR e EN. Relógio (Garmin/Apple Watch) fica para depois, mas neste projeto — por isso o motor é TS puro.
- Licença: proprietária, todos os direitos reservados (titular Joaquim Ferreira). Revisar com advogado + EULA/política de privacidade antes de publicar.

## Estado (fases 0 a 4 feitas e enviadas (4 em aa4519d, ainda sem teste em aparelho))

- `src/motor/` (sem React/Expo): `compilar.ts`, `maquina.ts`, `livre.ts`, testes em `__tests__/` (20 passando). Tempo sempre por diferença de timestamps; `tick` atravessa etapas vencidas e preserva o excedente.
- `src/execucao/`: `useExecucao` (liga o motor ao relógio de 100 ms), `useSinais` (expo-audio + expo-haptics), `aparencia.ts` (cores/rótulos por etapa). `src/app/executar.tsx` roda um treino de exemplo (params `?rounds=&trabalho=&descanso=`) com `useKeepAwake`. Sons WAV simples gerados em `assets/sons/` (trocáveis). Ainda não testado em aparelho/emulador.
- `src/treinos/`: `modelo.ts` (TreinoSimples, normalização, duração), `armazenamento.ts` (JSON em `expo-sqlite/kv-store`, chave `treinos.v1`), `useTreinos.ts`. Telas: `index.tsx` (lista), `editar.tsx` (`?id=` edita, sem id cria), `executar.tsx` (`?id=` roda o treino salvo; sem id, o exemplo). Fase 3 ainda não testada em aparelho.
- Fase 4: treinos salvos são `TreinoSalvo` = simples | avançado (`modo`; registros sem `modo` = simples, mesma chave `treinos.v1`). `src/treinos/avancado.ts` (lista de `Item`, normalização, operações imutáveis por id, validação, limites: repetição de 1 nível (sem repetição dentro de repetição, desde 4869a94), 99 vezes, 2000 etapas desdobradas). `src/editor/`: `FormSimples` (com "Converter para avançado", sem volta), `EditorAvancado` (+ Repetição só na lista principal, reordenar com ↑/↓, sem drag para não exigir módulo nativo), `CampoNumero`. A duração agora vem de `medidas()` (motor compilado); `duracaoTotalSegundos` foi removida porque errava quando há desaquecimento depois do último descanso.

- Fase 5 (parcial, não commitada): `proximasTransicoes` no motor (testada); `src/execucao/notificacoes.ts` agenda notificações locais (até 30) para cada troca de etapa por tempo e cancela ao pausar/sair; permissão pedida ao tocar em Iniciar; canal Android `etapas-v2` (som padrão, visível na tela bloqueada), entrega `alarmClock` e pedido de alarme exato ao iniciar (7b97387, enviado; `SCHEDULE_EXACT_ALARM` em `app.json`). Funciona no Expo Go (notificações locais). Faltam: serviço em primeiro plano no Android (exige módulo nativo/development build, sem API no Expo SDK 58), áudio em segundo plano (`shouldPlayInBackground` do expo-audio, também só em build), sons personalizados nas notificações (plugin `sounds`), `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` para pontualidade no Android 12+. Tudo sem teste em aparelho.

## Próximos passos

**Teste em aparelho (2026-11-08): com a tela bloqueada o alarme NÃO apita no Expo Go**, mesmo após alarme exato/canal v2 (provável limite do Expo Go e do Doze). Decisão do Joaquim: resolver depois, quando o ambiente de desenvolvimento (development build) estiver 100% pronto. Próximo passo: montar o development build (`eas build --profile development` ou `expo run:android`) e então testar/ajustar alarmes com tela bloqueada, serviço em primeiro plano, áudio em segundo plano e sons das notificações.

5. Terminar a fase 5 (itens acima, em development build). 6. i18n PT/EN, ícone, acessibilidade. 7. Builds EAS e publicação.

## Pendências

- Confirmar `app.joachrono` (bundleIdentifier/package) — não muda depois de publicado.
- Confirmar titular (pessoa ou empresa/CNPJ).
- Contas: Apple Developer (US$ 99/ano), Google Play (US$ 25).

## Ambiente

- Node via nvm (`~/.nvm`, sem edição do .bashrc): `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`.
- Checagens: `npm test`, `npx tsc --noEmit`, `npx expo lint`, `npx prettier --check .`, `npx expo-doctor`.
- Commits em PT-BR; só commitar/dar push quando o Joaquim autorizar.
