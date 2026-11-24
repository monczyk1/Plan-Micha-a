#!/bin/sh
# Uruchom po każdej zmianie (i przed każdym wydaniem). Robi trzy rzeczy:
#  1) sprawdza, że APP_BUILD w kod/aplikacja.js = "build" w version.json,
#  2) wpisuje numer wersji przy plikach (?v=…) w index.html i w sw.js – telefony pobiorą nowe pliki, a nie stare z pamięci,
#  3) tworzy index.html i sw.js w folderach osób (…/damian/ itd.) – wskazują na wspólne pliki piętro wyżej.
# Kopii w folderach osób nie edytuj ręcznie – zawsze zmieniaj pliki główne i uruchom ./sync.sh.
cd "$(dirname "$0")" || exit 1
B=$(sed -n -E 's/^ *"build": *([0-9]+).*/\1/p' version.json | head -1)
A=$(sed -n -E 's/.*const APP_BUILD *= *([0-9]+).*/\1/p' kod/aplikacja.js | head -1)
[ -n "$B" ] && [ "$B" = "$A" ] || { echo "BŁĄD: APP_BUILD ($A) w kod/aplikacja.js różni się od \"build\" ($B) w version.json"; exit 1; }
put(){ sed -E "$1" "$2" > "$2.tmp" && mv "$2.tmp" "$2"; }
put "s#\?v=[0-9]+#?v=$B#g" index.html
put "s#^const BUILD=[0-9]+;#const BUILD=$B;#" sw.js
# Każdy wspólny plik z index.html musi być na liście w sw.js – inaczej aplikacja nie otworzy się bez internetu
for f in $(grep -o -E '(src|href)="(kod/|dane/|styl\.css)[^"?]*' index.html | sed 's/.*"//'); do
  [ -f "$f" ] || { echo "BŁĄD: index.html wskazuje na $f, a takiego pliku nie ma"; exit 1; }
  grep -q "\"$f\"" sw.js || { echo "BŁĄD: brak \"$f\" na liście SHARED w sw.js"; exit 1; }
done
for d in */; do
  [ -f "$d/manifest.webmanifest" ] || continue
  sed -E 's#(src|href)="(kod/|dane/|styl\.css)#\1="../\2#g' index.html > "$d/index.html"
  sed 's#^const ROOT="./";#const ROOT="../";#' sw.js > "$d/sw.js"
  cp version.json "$d"
  echo "→ $d"
done
echo "Wersja $B gotowa."
