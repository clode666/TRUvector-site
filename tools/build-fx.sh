#!/usr/bin/env bash
# TRUvector — build des effets : minifie les sources lisibles de assets/js/src/
# vers les fichiers servis. Usage : bash tools/build-fx.sh   (Node.js requis)
set -e
cd "$(dirname "$0")/.."
mkdir -p assets/js/fx
npx --yes terser@5 assets/js/src/fx.js -c -m --comments '/^!/' -o assets/js/fx.js
for f in assets/js/src/fx/*.js; do
  npx --yes terser@5 "$f" -c -m -o "assets/js/fx/$(basename "$f")"
done
echo "Tailles (octets, minifié / gzip) :"
for f in assets/js/fx.js assets/js/fx/*.js; do printf "  %-28s %6s / %6s\n" "$f" "$(wc -c <"$f")" "$(gzip -9c "$f" | wc -c)"; done
