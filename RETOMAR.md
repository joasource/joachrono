# Joachrono — como retomar

App de cronômetro de exercícios (Android e iOS), Expo SDK 58 + TypeScript + expo-router. Licença proprietária.

## Decisões já tomadas

- Expo/React Native (não Flutter). MVP: modo simples (rounds) + editor avançado (etapas e repetições aninhadas), cronômetro livre com voltas.
- "Aberto" = modelo flexível como o Garmin: etapas (aquecer, trabalho, descanso, desaquecer, livre) com fim por tempo ou manual, dentro de repetições aninhadas.
- Vai ser publicado nas lojas; PT-BR e EN. Relógio (Garmin/Apple Watch) fica para depois, mas neste projeto — por isso o motor é TS puro.
- Licença: proprietária, todos os direitos reservados (titular Joaquim Ferreira). Revisar com advogado + EULA/política de privacidade antes de publicar.

## Estado (fases 0 e 1 feitas)

- `src/motor/` (sem React/Expo): `compilar.ts`, `maquina.ts`, `livre.ts`, testes em `__tests__/` (20 passando). Tempo sempre por diferença de timestamps; `tick` atravessa etapas vencidas e preserva o excedente.
- `src/app/`: só `_layout.tsx` e `index.tsx` provisórios.

## Próximos passos

2. Tela de execução (som, vibração, tela acesa, cores por etapa) — consultar a doc do SDK 58 antes de usar APIs Expo (AGENTS.md).
3. Editor simples + lista de treinos com persistência local.
4. Editor avançado. 5. Segundo plano/tela bloqueada (notificações locais; serviço em primeiro plano no Android). 6. i18n PT/EN, ícone, acessibilidade. 7. Builds EAS e publicação.

## Pendências

- Confirmar `app.joachrono` (bundleIdentifier/package) — não muda depois de publicado.
- Confirmar titular (pessoa ou empresa/CNPJ).
- Contas: Apple Developer (US$ 99/ano), Google Play (US$ 25).

## Ambiente

- Node via nvm (`~/.nvm`, sem edição do .bashrc): `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`.
- Checagens: `npm test`, `npx tsc --noEmit`, `npx expo lint`, `npx prettier --check .`, `npx expo-doctor`.
- Commits em PT-BR; só commitar/dar push quando o Joaquim autorizar.
