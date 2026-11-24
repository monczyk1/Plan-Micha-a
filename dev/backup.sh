#!/bin/bash
# Kopia całego repozytorium (kod + cała historia + znaczniki wersji) do JEDNEGO pliku na Dysku Google.
# Użycie: ./dev/backup.sh   (po każdym wdrożeniu). Przywrócenie: git clone <plik>.bundle nowy-folder
# Zawiera tylko kod aplikacji – dane użytkowników są w telefonach i w arkuszu chmury, nie tutaj.
set -e
cd "$(dirname "$0")/.."
DRIVE=$(ls -d "$HOME"/Library/CloudStorage/GoogleDrive-*/"Mój dysk" 2>/dev/null | head -1)
[ -n "$DRIVE" ] || { echo "Nie widzę Dysku Google (Mój dysk) – uruchom aplikację Dysk Google i spróbuj ponownie."; exit 1; }
DEST="$DRIVE/Kopie – Tytanowa siła"; mkdir -p "$DEST"
VER=$(grep -o 'const APP_BUILD = [0-9]*' kod/aplikacja.js | grep -o '[0-9]*$')
F="$DEST/tytanowa-sila-v$VER-$(date +%Y-%m-%d_%H%M).bundle"
git bundle create "$F" --all >/dev/null 2>&1
git bundle verify "$F" >/dev/null 2>&1 || { echo "Kopia nie przeszła sprawdzenia: $F"; exit 1; }
# zostaje 10 najnowszych kopii
ls -1t "$DEST"/tytanowa-sila-*.bundle | tail -n +11 | while read -r old; do rm -f "$old"; done
echo "Kopia gotowa i sprawdzona: $F ($(du -h "$F" | cut -f1))"
