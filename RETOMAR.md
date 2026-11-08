# Joachrono — como retomar

App de cronômetro de exercícios (Android e iOS), Expo SDK 58 + TypeScript + expo-router. Licença proprietária.

## Decisões já tomadas

- Expo/React Native (não Flutter). MVP: modo simples (rounds) + editor avançado (etapas e repetições aninhadas), cronômetro livre com voltas.
- "Aberto" = modelo flexível como o Garmin: etapas (aquecer, trabalho, descanso, desaquecer, livre) com fim por tempo ou manual, dentro de repetições aninhadas.
- Vai ser publicado nas lojas; PT-BR e EN. Relógio (Garmin/Apple Watch) fica para depois, mas neste projeto — por isso o motor é TS puro.
- Licença: proprietária, todos os direitos reservados (titular Joaquim Ferreira). Revisar com advogado + EULA/política de privacidade antes de publicar.

## Estado (fases 0 a 4 feitas e enviadas (4 em aa4519d, ainda sem teste em aparelho))

- `src/motor/` (sem React/Expo): `compilar.ts`, `maquina.ts`, `livre.ts`, testes em `__tests__/` (20 passando). Tempo sempre por diferença de timestamps; `tick` atravessa etapas vencidas e preserva o excedente.
- `src/execucao/`: `useExecucao` (liga o motor ao relógio de 100 ms), `useSinais` (expo-audio + expo-haptics), `aparencia.ts` (cores/rótulos por etapa). `src/app/executar.tsx` roda um treino de exemplo (params `?rounds=&trabalho=&descanso=`) com `useKeepAwake`. Sons WAV simples gerados em `assets/sons/` (trocáveis). Ainda não testado em aparelho/emulador.
- `src/treinos/`: `modelo.ts` (TreinoSimples, normalização, duração), `armazenamento.ts` (JSON em `expo-sqlite/kv-store`, chave `treinos.v1`), `useTreinos.ts`. Telas: `index.tsx` (lista), `editar.tsx` (`?id=` edita, sem id cria), `executar.tsx` (`?id=` roda o treino salvo; sem id, o exemplo). Fase 3 ainda não testada em aparelho.
- Fase 4: treinos salvos são `TreinoSalvo` = simples | avançado (`modo`; registros sem `modo` = simples, mesma chave `treinos.v1`). `src/treinos/avancado.ts` (árvore de `Item`, normalização, operações imutáveis por id, validação, limites: 3 níveis, 99 vezes, 2000 etapas desdobradas). `src/editor/`: `FormSimples` (com "Converter para avançado", sem volta), `EditorAvancado` (recursivo, reordenar com ↑/↓, sem drag para não exigir módulo nativo), `CampoNumero`. A duração agora vem de `medidas()` (motor compilado); `duracaoTotalSegundos` foi removida porque errava quando há desaquecimento depois do último descanso.

## Próximos passos

5. Segundo plano/tela bloqueada (notificações locais; serviço em primeiro plano no Android). 6. i18n PT/EN, ícone, acessibilidade. 7. Builds EAS e publicação.

## Pendências

- Confirmar `app.joachrono` (bundleIdentifier/package) — não muda depois de publicado.
- Confirmar titular (pessoa ou empresa/CNPJ).
- Contas: Apple Developer (US$ 99/ano), Google Play (US$ 25).

## Ambiente

- Node via nvm (`~/.nvm`, sem edição do .bashrc): `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`.
- Checagens: `npm test`, `npx tsc --noEmit`, `npx expo lint`, `npx prettier --check .`, `npx expo-doctor`.
- Commits em PT-BR; só commitar/dar push quando o Joaquim autorizar.
