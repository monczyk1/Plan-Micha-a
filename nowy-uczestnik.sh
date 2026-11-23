#!/bin/sh
# Użycie: ./nowy-uczestnik.sh tomek "Tomek"
# Tworzy folder …/tomek/ (adres aplikacji dla tej osoby). Potem:
#  1) dopisz osobę w PROFILES w index.html, np.  tomek:{name:"Tomek"}
#  2) ./sync.sh
#  3) w arkuszu, karta „Uczestnicy”: nowy wiersz z imieniem i PIN-em
id="$1"; name="$2"
case "$id" in ""|*[!a-z]*) echo "Id tylko małymi literami bez polskich znaków, np. tomek"; exit 1;; esac
[ -n "$name" ] || { echo "Podaj imię, np. ./nowy-uczestnik.sh tomek \"Tomek\""; exit 1; }
cd "$(dirname "$0")" || exit 1
mkdir -p "$id" && cp icon-180.png icon-192.png icon-512.png index.html sw.js "$id/"
cat > "$id/manifest.webmanifest" <<M
{"name":"Tytanowa siła · $name","short_name":"Siła · $name","start_url":"./","scope":"./","display":"standalone","background_color":"#f3f4f2","theme_color":"#c2410c","lang":"pl","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]}
M
echo "Gotowe: folder $id/. Teraz dopisz $id w PROFILES w index.html i uruchom ./sync.sh"
