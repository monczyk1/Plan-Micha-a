# Film-przewodnik „Tytanowa siła” – jak odtworzyć

Pionowy film 1080×1920, 30 fps, 50 s, 12 scen (podział w `render.js` → `cuts`). Telefon pokazany z ekranami aplikacji, napisy i „stuknięcia” animowane w przeglądarce.
Gotowe wersje: bez muzyki, rock 80s (`music.py`, 120 BPM) i ciężki hip-hop (`music_hh.py`, 90 BPM). Mocny akcent (drop) w obu na 2,6 s.

## Przebieg
1. `node capture.js` – Playwright otwiera `../index.html` (393×852, skala 2,5, tryb ciemny, pl-PL) z danymi **pokazowymi Michała** (A/B, 4 sesje z listopada) i robi zrzuty ekranów do `cap/*.jpg` (c1, w0–w2, e0–e3, t1, a1, f0, f1, h1, p1, s1, s2).
2. `stage.html` + `timeline.js` – scena: telefon, zrzuty, napisy. Dane do edycji w `timeline.js`:
   - `shots` – który zrzut kiedy i jakim przejściem (cut/fade/sheet/up/pop/appopen),
   - `caps` – napisy (numer kroku, tytuł, podtytuł),
   - `taps` – kółka stuknięć (x,y w pikselach telefonu 393×852 albo selektor),
   - `hls` – podświetlenia, `cams` – zoom kamery, `TOTAL` – długość.
   Ekrany Safari/„Do ekranu początkowego” (saf, safm, share, dlg, home, app) są rysowane w HTML, nie ze zrzutów.
3. `node render.js` (albo `node render.js 3,4` – tylko wybrane sceny) → `scenes/sNN.mp4`, każda scena osobno.
4. Sklejenie: `ffmpeg -f concat -i scenes/list.txt -c copy film.mp4`, potem muzyka: `python3 music.py` → `music.wav` i `ffmpeg -i film.mp4 -i music.wav -map 0:v -map 1:a -c:v copy -c:a aac -shortest wynik.mp4`.

## Zasady
- Bez danych i ekranu głównego Damiana – tylko dane pokazowe.
- Zmiana jednej sceny = render tylko tej sceny (i następnej, jeśli ma przejście z niej).
- Nowa długość filmu = przesunąć `cuts` w `render.js`, `TOTAL` i czasy w `timeline.js` oraz `DUR` w skryptach muzyki.
- Zależności: node + playwright (chromium), ffmpeg, python3 + numpy.

## Kolejne sceny do dodania (funkcje od 23.11)
Ranking (konkurs serii, tonaż tygodnia, rekordy, 🔥), tonaż w Postępach + szczegóły po stuknięciu w słupek, podsumowanie (tonaż, porównanie, rekord, miejsce w rankingu, obrazek do udostępnienia), „+ Nowy trening”, „⇅ Kolejność”, pasek postępu treningu, „Sprawdź aktualizację” + „Co nowego”, chmura z PIN-em.
