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
(cd "$ROOT" && exec python3 -m http.server 8765 >/dev/null 2>&1) & P1=$!
(cd "$SRV" && exec python3 -m http.server 8766 >/dev/null 2>&1) & P2=$!
node "$T/gas-mock3.js" 8792 >/dev/null 2>&1 & P3=$!
trap 'kill $P1 $P2 $P3 2>/dev/null' EXIT INT TERM
sleep 2
# Zestawy testów (można mieszać z nazwami pojedynczych testów, np. ./run-tests.sh trening mt):
#   szybkie – calc: obliczenia (tonaż, masa ciała, plan, profile), kilka sekund – po każdej zmianie
#   trening – wpisywanie serii, zakończenie, zapis, historia, kopie z pliku, kolejność, nowy trening, offline
#   osoby   – profile Damiana i Mateusza, ich plany, izolacja danych
#   chmura  – kopia w chmurze, ranking, tonaż w rankingu, aktualizacje (każda zmiana w chmura/Code.gs lub wysyłce)
#   wyglad  – dostępność (kontrast, etykiety)
#   (bez nazw) – wszystkie
CHMURA="ton rank rank2 cloud3 upd v1guard"   # korzystają ze wspólnej atrapy arkusza – idą po kolei
ALL="calc nowe sila post pr odp zapam full2 newf damian nt ord mt off axe2 $CHMURA"
LIST=""
for a in ${*:-$ALL}; do case $a in
  szybkie) LIST="$LIST calc";; trening) LIST="$LIST nowe sila post pr odp zapam full2 nt ord newf off";; osoby) LIST="$LIST calc damian mt";;
  chmura) LIST="$LIST $CHMURA";; wyglad) LIST="$LIST axe2";; *) LIST="$LIST $a";; esac; done
LIST=$(echo $LIST | tr ' ' '\n' | awk '!s[$0]++' | tr '\n' ' ')   # bez powtórzeń
cd "$T" && mkdir -p dm; RES="$DEV/.wyniki"; rm -rf "$RES"; mkdir -p "$RES"
run(){ t=$1
  [ -f "$t.js" ] || { echo "== $t: nie ma takiego testu" > "$RES/$t"; touch "$RES/$t.fail"; return; }
  PRE="--require $T/preload.js"; case $t in mt|full2) PRE="";; esac   # mt sprawdza pytanie o masę; full2 jest stabilniejszy bez preload
  case $t in nowe|calc) ;; *) PRE="$PRE --require $T/legacy.js";; esac   # starsze testy: stary widok (wszystko rozwinięte); nowe.js sprawdza nowy
  OUT=$(NODE_PATH="$DEV/node_modules" NODE_OPTIONS="$PRE" timeout 300 node "$t.js" 2>&1); RC=$?
  P=$(echo "$OUT" | grep -c '^PASS'); F=$(echo "$OUT" | grep -c '^FAIL'); E=$(echo "$OUT" | grep -m1 -E 'Error:' )
  [ $RC -ne 0 ] && [ -z "$E" ] && E="test przerwany (kod $RC$([ $RC -eq 124 ] && echo ', przekroczony czas'))"
  { echo "== $t: $P ok, $F błędów ${E:+· $E}"; echo "$OUT" | grep '^FAIL'; } > "$RES/$t"
  { [ "$F" -gt 0 ] || [ -n "$E" ] || [ "$P" -eq 0 ]; } && touch "$RES/$t.fail"
}
START=$(date +%s)
# testy z atrapą arkusza: po kolei, w tle
( for t in $LIST; do case " $CHMURA " in *" $t "*) run $t;; esac; done ) & PC=$!
# pozostałe: po 4 naraz
PIDS=""; n=0
for t in $LIST; do case " $CHMURA " in *" $t "*) continue;; esac
  run $t & PIDS="$PIDS $!"; n=$((n+1)); [ $((n % 4)) -eq 0 ] && { wait $PIDS; PIDS=""; }; done
wait $PC $PIDS   # tylko testy – serwery w tle zamyka trap przy wyjściu
for t in $LIST; do cat "$RES/$t"; done
FAILS=$(ls "$RES"/*.fail 2>/dev/null | wc -l | tr -d ' ')
[ "$FAILS" -eq 0 ] && echo "WSZYSTKO OK ($(( $(date +%s)-START )) s)" || echo "UWAGA: $FAILS zestaw(y) z błędami"
[ "$FAILS" -eq 0 ]
