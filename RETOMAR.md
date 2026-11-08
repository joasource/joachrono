# joaChrono — como retomar

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

**Development build pronto (2026-11-08, 8cdb8ea):** `expo-dev-client`, `eas.json` (perfis development/preview/production), projeto EAS `@joaquimfsneto/joachrono` (owner e projectId no `app.json`), keystore Android criado no EAS, APK instalado no Redmi/Xiaomi do Joaquim. Rodar: `npx expo start --dev-client`. Build: `npx eas-cli@latest build --platform android --profile development` (login por `eas login --device --non-interactive`, o prompt do Claude Code não é interativo). Cuidado: `eas init` reescreve o `app.json` com permissões geradas (inclusive RECORD_AUDIO); mantivemos só owner/projectId. Considerar `["expo-audio", {"microphonePermission": false}]` no próximo rebuild.

**Alarmes com tela bloqueada — investigação (Xiaomi/Redmi, nada commitado desde 8cdb8ea):**

- Bug achado: `sound: 'default'` no canal é lido como arquivo "default" (inexistente) e deixa o canal mudo. Correto é omitir `sound`. Canal agora `etapas-v4` com `audioAttributes: ALARM` (em `notificacoes.ts`, não commitado). Depois disso a borda da tela acende, mas ainda sem som.
- O WhatsApp também não acende a tela no aparelho; a tela de bloqueio do Xiaomi estava configurada para esconder notificações (ajustes: Notificações na tela de bloqueio, Outras permissões → Mostrar na tela de bloqueio / pop-ups em segundo plano, Início automático, travar o app nos recentes).
- Teste descartado: áudio silencioso em loop + `setActiveForLockScreen` mantinha o controle de mídia, mas o JS continuava suspenso com a tela bloqueada.
- **Plano B implementado (não commitado, não testado em aparelho):** `src/execucao/linhaDoTempo.ts` gera um WAV (mono, 8 bits, 8 kHz, ~8 KB/s; limite de 1 h) com silêncio + bipes de contagem (3 s antes) e um gongo agudo (troca = 1 batida, fim = 2; mesmo som em `assets/sons/troca.wav` e `fim.wav` para quando o JS toca) nos instantes de `proximasTransicoes`; `useLinhaDoTempo.ts` grava em `expo-file-system` (cache, 2 arquivos alternados) e toca pelo player nativo com `setActiveForLockScreen` e `doNotMix` só em segundo plano (em primeiro plano mistura com a música de outros apps). Regenera ao iniciar/retomar/pular/voltar; troca natural de etapa não regenera (senão cortaria o bipe). Enquanto o áudio nativo cobre, `somNativo.ativo` (`somNativo.ts`) faz o JS só vibrar. Etapa manual: sem sinal sonoro nativo (o JS segue valendo com a tela ligada). O diagnóstico temporário foi removido. Testes em `src/execucao/__tests__/`.
- **Precisa de novo development build:** `expo-file-system` foi adicionado (módulo nativo que o APK atual não tem). Testar: tela bloqueada, ~1 min de treino, ouvir os bipes nas trocas; conferir pausa/retomada, "Voltar/Avançar" e o fim. Pendente: sons personalizados no canal (plugin `sounds`), serviço em primeiro plano próprio, avaliar o custo do `doNotMix`.

5. Terminar a fase 5 (itens acima, em development build). 6. i18n PT/EN: feita (não commitada, sem teste em aparelho): `src/i18n/` (`pt.ts` é a fonte das chaves, `en.ts` tipado igual, `t.ts` puro com i18n-js, `idioma.ts` lê o idioma do aparelho via expo-localization: português se `pt`, senão inglês; teste de paridade das chaves); `app.json` com `supportedLocales`. Requer novo development build (módulo nativo expo-localization). Nome do app por idioma feito (`locales/pt.json` e `en.json`, tela inicial "joaChrono" nos dois). Títulos da loja: PT "joaChrono - Temporizador de Treino", EN "joaChrono - Workout Timer". Faltam: mensagens de `validar()` do motor (só uso interno), seletor de idioma no app (opcional). Depois: ícone, acessibilidade.

Configurações v1 (não commitada, sem teste em aparelho): `src/configuracoes/` (modelo puro + store síncrono em kv-store `configuracoes.v1` + `Segmentos`), tela `/configuracoes` (engrenagem na lista): som, volume (baixo/médio/alto), contagem regressiva (off/3/5/10 s), vibração, sinais com a tela bloqueada (desligado = sem áudio nativo/`doNotMix`; a notificação passa a tocar o som do sistema) e notificações. Canal Android por combinação (`etapas-v6-{s|m}{v|n}`). Opção por treino "Pular último descanso" (`pularUltimoDescanso`, padrão ligado; editor simples e avançado). Faltam: tipo de sinal (gongo/bipe), intensidade da vibração. 7. Builds EAS e publicação.

## Pendências

- Confirmar `app.joachrono` (bundleIdentifier/package) — não muda depois de publicado.
- Confirmar titular (pessoa ou empresa/CNPJ).
- Contas: Apple Developer (US$ 99/ano), Google Play (US$ 25).

## Ambiente

- Node via nvm (`~/.nvm`, sem edição do .bashrc): `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`.
- Checagens: `npm test`, `npx tsc --noEmit`, `npx expo lint`, `npx prettier --check .`, `npx expo-doctor`.
- Commits em PT-BR; só commitar/dar push quando o Joaquim autorizar.
