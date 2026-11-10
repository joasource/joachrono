# Docker do simulador Garmin — como recriar

O simulador do Connect IQ precisa do `libwebkit2gtk-4.0`, que o Ubuntu 24.04 não tem. Por isso os testes
(`garmin/tools/test.sh`) rodam dentro de containers. Os containers são descartáveis (`docker run --rm`);
**só as imagens importam**.

## Estado (2026-11-10)

As imagens **`ciq-sdkm`** e **`ciq-sim`** foram apagadas (provavelmente por limpeza do Docker). Não há
container nem volume deste projeto. Nada se perdeu: tudo se recria a partir dos Dockerfiles do repositório.

Os outros containers do computador (`kinsight`, `joakindex`, `cloudflared`, `ollama`, `guacamole`, `guacd`)
**não são deste projeto**; não mexer neles.

## O que continua fora do Docker (confira se ainda existe)

- SDK do Connect IQ: `~/.Garmin/ConnectIQ/Sdks/` (versão 9.3.0) e o dispositivo Instinct 2X.
- Chave do desenvolvedor: `~/garmin-sdk/keys/developer_key.der` (fora do git; sem ela o `.prg` não é assinado.
  Se perder, gere outra conforme `garmin/README.md`, mas o app já instalado no relógio terá de ser reinstalado).
- Saída da compilação: `~/garmin-sdk/out/`.

## Reinstalar tudo

```bash
cd ~/joachrono/garmin
docker build -t ciq-sdkm tools/docker                      # base: Ubuntu 22.04 + webkit 4.0 + Java 17
docker build -f tools/docker/Dockerfile.sim -t ciq-sim tools/docker   # + Xvfb (tela virtual), parte de ciq-sdkm
```

Depois, compilar e testar:

```bash
garmin/tools/build.sh          # gera ~/garmin-sdk/out/joachrono.prg (não usa Docker)
garmin/tools/test.sh           # testes do motor no simulador (usa ciq-sim)
```

Instalar no relógio não usa Docker: copiar o `joachrono.prg` para `GARMIN/APPS/` (ver `garmin/README.md`).

## Ordem importa

`ciq-sim` começa `FROM ciq-sdkm`, então construa `ciq-sdkm` primeiro. Se o `docker build` falhar por rede,
é só repetir: os Dockerfiles só dependem de `ubuntu:22.04` e dos pacotes `apt`.

## O app Expo não usa Docker

O app do celular (`src/`) roda com Node (via nvm), `npx expo start --dev-client` e EAS na nuvem. Ver `RETOMAR.md`.
