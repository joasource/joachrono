#!/bin/bash
# Compila o app para o Instinct 2X Solar. Uso: garmin/tools/build.sh [--test]
# Precisa do SDK em ~/.Garmin/ConnectIQ e da chave em ~/garmin-sdk/keys/developer_key.der (fora do repo).
set -e
AQUI="$(cd "$(dirname "$0")/.." && pwd)"
SDK="$(ls -d ~/.Garmin/ConnectIQ/Sdks/*/ | tail -1)"
KEY="${CIQ_KEY:-$HOME/garmin-sdk/keys/developer_key.der}"
OUT="${CIQ_OUT:-$HOME/garmin-sdk/out}"
mkdir -p "$OUT"
if [ "$1" = "--test" ]; then ALVO="$OUT/joachrono-test.prg"; EXTRA="-t"; else ALVO="$OUT/joachrono.prg"; EXTRA="-r"; fi
"$SDK/bin/monkeyc" -d instinct2x -f "$AQUI/monkey.jungle" -o "$ALVO" -y "$KEY" -w $EXTRA
echo "$ALVO"
