<div align="center">

<img src="assets/icon.png" width="120" alt="Ícone do joaChrono" />

# joaChrono

**Temporizador de treino para intervalados, do simples ao avançado.**
Android e iOS · PT-BR e EN · feito com Expo e React Native

</div>

---

## O que é

Um cronômetro de exercícios pensado para quem treina com intervalos: HIIT, tabata, circuito, corrida intervalada. Você monta o treino uma vez, aperta **Iniciar** e o app avisa cada troca com som e vibração, inclusive com a tela bloqueada.

## Recursos

- **Modo simples:** aquecimento, rounds, trabalho, descanso e desaquecimento. O último descanso pode ser pulado.
- **Modo avançado:** lista livre de etapas (aquecer, trabalho, descanso, desaquecer, livre) e blocos “Repetir N×”, no estilo dos treinos do Garmin. Etapas podem acabar por tempo ou manualmente, ao tocar em “Próxima”.
- **Alarmes confiáveis com a tela bloqueada:** o áudio das trocas é gerado como uma linha do tempo e tocado pelo player nativo, então não depende do JavaScript acordado. Notificações locais complementam.
- **Sinais configuráveis:** gongo ou bipe, volume, contagem regressiva (3, 5 ou 10 s) e intensidade da vibração.
- **Histórico:** registra cada treino concluído (ou encerrado depois de 10 s), com total dos últimos 7 dias.
- **Acessibilidade:** tempo falado por extenso, anúncio de etapas para leitores de tela e contraste revisado.
- **PT-BR e EN:** segue o idioma do aparelho.
- **Dados locais:** tudo fica no aparelho, sem conta e sem rede.

## Stack

| Camada           | Escolha                                  |
| ---------------- | ---------------------------------------- |
| Framework        | Expo SDK 58, React Native 0.88, React 19 |
| Navegação        | Expo Router (`src/app/`)                 |
| Linguagem        | TypeScript                               |
| Armazenamento    | `expo-sqlite/kv-store`                   |
| Áudio e vibração | `expo-audio`, `expo-haptics`             |
| Notificações     | `expo-notifications`                     |
| i18n             | `i18n-js` + `expo-localization`          |
| Testes           | Jest (`jest-expo`)                       |
| Builds           | EAS Build                                |

## Estrutura

```
src/
  app/            telas (Expo Router): lista, editar, executar, histórico, configurações, sobre, ajuda
  motor/          máquina de estados do cronômetro, TypeScript puro (sem React nem Expo)
  execucao/       liga o motor ao relógio, sons, vibração, notificações e à linha do tempo de áudio
  treinos/        modelo, normalização e armazenamento dos treinos
  editor/         formulários dos modos simples e avançado
  historico/      registro das execuções
  configuracoes/  preferências do usuário
  i18n/           traduções (pt é a fonte das chaves)
assets/           ícones e sons
locales/          nome do app por idioma
```

O motor em `src/motor/` não importa React nem Expo de propósito: o mesmo código roda no app, nos testes e, no futuro, em relógios (Garmin / Apple Watch). O tempo é sempre calculado por diferença de timestamps, nunca contando ticks, então sobrevive a pausas do JavaScript em segundo plano.

## Como rodar

Requisitos: Node (via nvm, por exemplo) e um aparelho ou emulador Android.

```bash
npm install
```

O app usa módulos nativos que o Expo Go não traz (como `expo-file-system` e `expo-localization`), então ele precisa de um **development build**:

```bash
# gera o APK de desenvolvimento na nuvem (precisa de login: npx eas-cli@latest login)
npx eas-cli@latest build --platform android --profile development

# depois de instalar o APK no aparelho
npx expo start --dev-client
```

### Qualidade

```bash
npm test             # testes do motor, modelos, i18n e histórico
npx tsc --noEmit     # typecheck
npx expo lint        # lint
npx prettier --check .
```

## Estado do projeto

Em desenvolvimento ativo, distribuído por enquanto só como APK Android. Publicação nas lojas e versão para iOS ficam para depois.

## Licença

Software proprietário. Copyright © 2026 Joaquim Ferreira. Todos os direitos reservados. Veja [LICENSE](LICENSE).

## Contato

Joaquim Ferreira · joaquimfsneto@gmail.com
