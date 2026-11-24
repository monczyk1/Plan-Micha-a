#!/bin/sh
# Testy automatyczne aplikacji. Użycie (z folderu dev/):
#   ./run-tests.sh            – wszystkie testy
#   ./run-tests.sh mt ton     – tylko wybrane
# Pierwszy raz: npm install && npx playwright install chromium
# Potrzebne: node, python3. Porty: 8765 (aplikacja), 8766 (kopia z chmurą testową), 8792 (atrapa skryptu Google).
cd "$(dirname "$0")" || exit 1
DEV=$(pwd); ROOT=$(cd .. && pwd); T="$DEV/tests"
[ -d node_modules/playwright ] || { echo "Najpierw: npm install && npx playwright install chromium"; exit 1; }
# kopia aplikacji z adresem chmury podmienionym na atrapę (prawdziwy arkusz nie jest dotykany)
SRV="$DEV/.srv"; rm -rf "$SRV"; mkdir -p "$SRV"
rsync -a --exclude .git --exclude dev --exclude film --exclude chmura --exclude ankieta "$ROOT/" "$SRV/"
for f in $(grep -rl "script.google.com" "$SRV"); do
  sed -E 's#CLOUD_URL *= *"https://script\.google\.com[^"]*"#CLOUD_URL="http://localhost:8792/exec"#' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done
# blokada: jeśli adres prawdziwego arkusza został w kopii testowej, przerywamy (testy nie mogą pisać do arkusza)
if grep -rq "script.google.com" "$SRV"; then echo "STOP: w kopii testowej został adres prawdziwego arkusza – popraw podmianę CLOUD_URL w run-tests.sh"; exit 1; fi
(cd "$ROOT" && python3 -m http.server 8765 >/dev/null 2>&1) & P1=$!
(cd "$SRV" && python3 -m http.server 8766 >/dev/null 2>&1) & P2=$!
node "$T/gas-mock3.js" 8792 >/dev/null 2>&1 & P3=$!
trap 'kill $P1 $P2 $P3 2>/dev/null' EXIT INT TERM
sleep 2
LIST=${*:-"calc full2 newf damian nt ord ton mt rank rank2 cloud3 upd off v1guard axe2"}
cd "$T" && mkdir -p dm; FAILS=0
for t in $LIST; do
  PRE="--require $T/preload.js"; case $t in mt|full2) PRE="";; esac   # mt sprawdza pytanie o masę; full2 jest stabilniejszy bez preload
  OUT=$(NODE_PATH="$DEV/node_modules" NODE_OPTIONS="$PRE" timeout 300 node "$t.js" 2>&1); RC=$?
  P=$(echo "$OUT" | grep -c '^PASS'); F=$(echo "$OUT" | grep -c '^FAIL'); E=$(echo "$OUT" | grep -m1 -E 'Error:' )
  [ $RC -ne 0 ] && [ -z "$E" ] && E="test przerwany (kod $RC$([ $RC -eq 124 ] && echo ', przekroczony czas'))"
  echo "== $t: $P ok, $F błędów ${E:+· $E}"; echo "$OUT" | grep '^FAIL'
  [ "$F" -gt 0 ] || [ -n "$E" ] && FAILS=$((FAILS+1))
done
[ $FAILS -eq 0 ] && echo "WSZYSTKO OK" || echo "UWAGA: $FAILS zestaw(y) z błędami"
