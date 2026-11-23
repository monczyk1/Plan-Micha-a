#!/bin/sh
# Po każdej zmianie index.html lub sw.js: kopiuje je do folderów wszystkich uczestników (…/damian/ itd.).
cd "$(dirname "$0")" || exit 1
for d in */; do [ -f "$d/manifest.webmanifest" ] && cp index.html sw.js version.json "$d" && echo "→ $d"; done
