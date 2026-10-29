#!/usr/bin/env bash
# Re-renders the sample lesson pages to the PNGs bundled in the app
# (assets/sample-lessons/<grade>.png). Run after editing an HTML source:
#   bash assets/sample-lessons/source/render.sh
set -euo pipefail

cd "$(dirname "$0")"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"

for grade in cp ce1 ce2 cm1 cm2; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size=800,1100 \
    --screenshot="$(cygpath -w "$PWD/../$grade.png" 2>/dev/null || echo "$PWD/../$grade.png")" \
    "file:///$(cygpath -m "$PWD/$grade.html" 2>/dev/null || echo "$PWD/$grade.html")"
done
