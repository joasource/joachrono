#!/bin/bash
# Roda os testes do motor no simulador, dentro do Docker (o simulador precisa do webkit 4.0, que o
# Ubuntu 24.04 não tem) e com tela virtual. Imagens: docker build -t ciq-sdkm tools/docker &&
# docker build -f tools/docker/Dockerfile.sim -t ciq-sim tools/docker
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
SDK="$(ls -d ~/.Garmin/ConnectIQ/Sdks/*/ | tail -1)"
OUT="${CIQ_OUT:-$HOME/garmin-sdk/out}"
"$AQUI/build.sh" --test >/dev/null
cat > "$OUT/rodar-testes.sh" <<'EOS'
#!/bin/bash
export PATH=/sdk/bin:$PATH
connectiq >/dev/null 2>&1 &
sleep 10
timeout 60 monkeydo /out/joachrono-test.prg instinct2x -t
pkill -f simulator; pkill Xvfb
EOS
chmod +x "$OUT/rodar-testes.sh"
docker run --rm --init -v "$SDK":/sdk -v "$OUT":/out -v "$HOME/.Garmin":/root/.Garmin ciq-sim xvfb-run -a /out/rodar-testes.sh
