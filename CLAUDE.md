# Tytanowa siła – CLAUDE.md

Dziennik treningów siłowych na telefon dla trzech kolegów z siłowni. Damian (właściciel, nie jest programistą) utrzymuje aplikację dla siebie, Michała i Mateusza.
Każdy ma własny link, własny plan i własny PIN do kopii w chmurze. Wpisują serie w trakcie treningu na siłowni, porównują się w rankingu.

## Zasady – aplikacja ma realnych użytkowników

- **Nie pushuj na `main` bez zgody Damiana.** Push na `main` = od razu publikacja u wszystkich (GitHub Pages, 1–2 min).
- Nowe funkcje rób na osobnej gałęzi. Na `main` dopiero po „wdróż” od Damiana.
- Nigdy nie usuwaj ani nie zmieniaj formatu zapisanych danych bez migracji, która zachowuje istniejące dane (wzór: `RULES_V` + przeliczenie przy starcie, `bwMigrate()`).
- Przed zmianą struktury localStorage, formatu kopii albo arkusza – opisz plan i zapytaj.
- Aktualizacja nie może skasować treningu w toku (szkic `P+"draft"`) ani zmienić znaczenia starych wpisów. Michał może akurat ćwiczyć, gdy wychodzi nowa wersja.
- Zmiany w `chmura/Code.gs` tylko w ostateczności – Damian musi je ręcznie wdrożyć w Apps Script, a zła wersja psuje zapis wszystkim. Wolimy rozwiązania po stronie aplikacji.
- PIN-ów nie wpisuj do repozytorium (jest publiczne) ani nie powtarzaj w odpowiedziach. PIN danej osoby trafia tylko do niej.
- Filmy i zrzuty pokazowe: tylko dane pokazowe, nigdy dane ani ekran telefonu Damiana.

## Gdzie są dane użytkowników

1. **Główne miejsce: localStorage w telefonie każdej osoby.** Klucze z prefiksem `gora_` (Michał, katalog główny), `goradamian_`, `goramateusz_` – na jednym telefonie dane osób się nie mieszają.
   Najważniejsze: `P+"sessions"` (zapisane treningi), `P+"draft"` (trening w toku), `P+"plan"` (plan po edycji), `P+"bm"` (masa ciała).
2. **Kopia w chmurze:** arkusz Google „Tytanowa sila - Michal” na Dysku Damiana, przez Apps Script (`CLOUD_URL` w `kod/aplikacja.js` → `chmura/Code.gs`, wersja 4).
   Karta „Uczestnicy” (Imię | PIN | Aktywny | …) – tylko Damian dopisuje osoby i PIN-y; puste „Aktywny” = aktywny, „NIE” blokuje.
   Karty „Treningi – Imię” (czytelny log) i ukryte „Kopie – Imię” (pełne kopie do przywracania). Michał ma historyczne nazwy „Treningi”/„Kopie”.
3. **Pliki kopii** pobierane ręcznie przez użytkownika (Ustawienia → Kopia zapasowa). Muszą się dać przywrócić także po aktualizacji (`reKey()`, `applySnapshot()`).

## Jak aplikacja trafia do użytkowników

- GitHub Pages z gałęzi `main`, repo `monczyk1/Plan-Micha-a`. Linki: `…/Plan-Micha-a/` (Michał), `/damian/`, `/mateusz/`.
- Użytkownicy mają ją jako skrót na ekranie iPhone'a (PWA). `sw.js` jest network-first, więc nowa wersja dochodzi przy następnym otwarciu z internetem. Aplikacja pokazuje pasek „Jest nowa wersja” i raz „Co nowego”.
- Wydanie: zmiana w plikach głównych → podbij `APP_BUILD` w `kod/aplikacja.js` i dopisz wpis w `version.json` (ten sam numer; lista zmian po polsku, językiem użytkownika) → `./sync.sh` (sprawdza numer, formatuje kod, wpisuje `?v=<numer>` przy plikach, tworzy `index.html`/`sw.js` w `damian/`, `mateusz/` – tych nie edytuj ręcznie) → testy → zgoda → push.
- Nowy wspólny plik (np. `dane/x.js`): dopisz go w `index.html` **i** na liście `SHARED` w `sw.js` – inaczej nie zadziała bez internetu (`./sync.sh` tego pilnuje).
- **Po każdym wdrożeniu:** znacznik wersji (`git tag -a v<numer> -m … && git push origin v<numer>`) i kopia kodu na Dysk Google: `./dev/backup.sh` (jeden plik `.bundle` z całą historią, 10 ostatnich; przywrócenie: `git clone plik.bundle nowy-folder`). Znacznik `v<numer>` to też najprostszy punkt powrotu: `git revert` do tego commita.
- **Cofnięcie złej wersji:** `git revert <commit>` + push na `main`. Dane w telefonach zostają (są w localStorage), aplikacja wraca do poprzedniego kodu przy następnym otwarciu. Jeśli wersja zdążyła przeliczyć dane (migracja), sprawdź, czy stara wersja je rozumie – zanim cofniesz.

## Sprawdzanie zmian

- Lokalnie: `python3 -m http.server 8765` w katalogu repo → http://localhost:8765/ (i `/damian/`, `/mateusz/`).
- Testy: `cd dev && npm install && npx playwright install chromium` (raz), potem z `dev/`:
  - po każdej zmianie: `./run-tests.sh szybkie` (5 s – obliczenia) + zestaw pasujący do zmiany: `trening` (serie, zapis, historia, kopie z pliku, kolejność, offline), `osoby` (Damian, Mateusz, plany), `chmura` (kopia w chmurze, ranking, aktualizacje, `Code.gs`), `wyglad` (dostępność); można łączyć i dodawać pojedyncze testy, np. `./run-tests.sh trening mt`,
  - przed wydaniem zawsze wszystkie: `./run-tests.sh` (ok. 35 s – równolegle; testy chmury po kolei, bo dzielą atrapę arkusza).
  Skrypt stawia własne serwery i atrapę skryptu Google (prawdziwy `Code.gs` w Node) – prawdziwy arkusz nie jest dotykany. Ma się kończyć „WSZYSTKO OK”.
  Jeśli celowo zmieniasz tekst lub zasadę sprawdzaną w teście – popraw test w tej samej zmianie.
  Blokada: jeśli w kopii testowej zostanie adres prawdziwego arkusza, testy się zatrzymają. `CLOUD_URL` musi zostać w jednej linii.
- Dziennik błędów: w ważnych miejscach zamiast pustego `catch` wołaj `blad("gdzie", e)` (`kod/profil.js`, tylko w pamięci; w konsoli `BLEDY`). Puste `catch` tylko dla funkcji urządzenia (wibracja, dźwięk) – z komentarzem.
- Najważniejsze ścieżki (sprawdź ręcznie po większej zmianie, na szerokości telefonu 390 px):
  1. wybór dnia → wpisanie serii → ✓ (minutnik przerwy) → Zakończ → podsumowanie (tonaż, porównanie, miejsce w rankingu) → Zapisz,
  2. Historia (poprawianie starego treningu), Postępy (tonaż, wykres masy ciała),
  3. Ranking (wymaga chmury), Ustawienia → kopia w chmurze z PIN-em, pobranie i przywrócenie kopii,
  4. trening w toku przetrwa zamknięcie aplikacji i aktualizację.

## Użytkownicy

- **Michał** – iPhone, skrót na ekranie. Plan A/B, ale może trenować nawet codziennie. Ciężko trenuje (np. ławka 80 kg). Korzysta na bieżąco – nie zaskakuj go zmianami w trakcie treningu.
  Ma oczekujące pytanie kontrolne o rozpiętki 40 kg na bramie (`ASKS`, id `cc40b`) – pokazuje się raz, aż odpowie.
- **Damian** – właściciel, plan 5 dni PN–PT (push, pull, nogi, góra lżej, dół + brzuch, StairMaster na końcu).
- **Mateusz** – nowy (od 24.11.2026). 5 dni robione po kolei: Klata → Łapy → Plecy → Barki + brzuch → Nogi + core. Ćwiczenia dopasowane ankietą (`/ankieta/`).
  Jego wcześniejsze ciężary są tylko „cieniem” w seriach (`SEED`), nie historią.
- Przyzwyczajenia – nie zmieniać bez pytania: kafelki dni na górze, numery treningów T1…, ✓ przy serii, zwijanie zrobionych ćwiczeń, dolny pasek (Trening, Historia, Postępy, Ranking, Ustawienia).

## Decyzje i ich powody

- Bez frameworka i budowania: zwykłe pliki, które GitHub Pages serwuje wprost. Od 24.11.2026 podzielone (zgoda Damiana): `index.html` (ekrany), `styl.css`, `dane/` (plany, ćwiczenia, rysunki, opisy), `kod/` (`profil.js`, `plan.js`, `aplikacja.js`). Kolejność `<script>` w `index.html` ma znaczenie – pliki dzielą zmienne globalne, a dane nie mogą wołać funkcji z `aplikacja.js`.
- Bez logowania: osoba = ścieżka w linku + prefiks localStorage. PIN tylko do chmury.
- PIN nadaje Damian w arkuszu; nie ma samodzielnej rejestracji – link jest publiczny, więc każdy mógłby się dopisać.
- **Tylko kilogramy.** Wpisywanie poziomów maszyn (lvl) zostało zrobione i porzucone na prośbę Damiana – nie wracać do tego.
- Tonaż (`RULES_V=4`, zmiana zasad = podbicie i przeliczenie przy starcie):
  - liczą się serie rozgrzewkowe R1/R2 (do kg i do liczby serii),
  - ×2: dwa hantle (wpisuje się jeden hantel), brama (wpisuje się jedną stronę), maszyna na talerze (jedna strona), powtórzenia „/nogę, /rękę, /str.”, jednorącz,
  - nie liczą się: ćwiczenia z ciężarem ciała, na czas lub dystans (wyjątek: „max w 2 min” z ciężarem), dynamika, core i cardio z planu,
  - **podciąganie i dipy:** w kg wpisuje się tylko **dodatkowe kg do masy własnej** (0 bez obciążenia); tonaż = (masa ciała z dnia treningu + kg) × powt. Stare wpisy „masa + obciążenie” przeliczają się po pierwszym wpisaniu masy.
- Masa ciała: pytanie na początku każdego tygodnia, nigdy w trakcie treningu; wykres w Postępach.
- Rekordy: bezwzględnie najwyższe kg (82×1 bije 80×2), **tylko z treningów zapisanych w aplikacji**.
- Ranking: konkurs serii tygodnia z 🏆 dla lidera, ranking kg tygodnia, okresy tydzień/miesiąc/od początku, seria 🔥 tygodni, ptaszek prywatności (ukrycie w rankingu).
- Ochrona przed literówkami: pytanie przy kg > 2× najlepszego wyniku, > 300 kg bez historii, > 60 powtórzeń.
- Kolejność ćwiczeń: tylko strzałki (bez przeciągania); przy rozbijaniu superserii pytanie; na końcu wybór „Tylko dziś / Na stałe”.
- „+ Nowy trening” (dodatkowy) nie przesuwa kolejki dni z planu.
- Zapis offline: trening zapisuje się w telefonie, kopia idzie do chmury sama po powrocie internetu.
- Ankieta dla nowych osób: zwykła strona na GitHubie bez zapisu online – odpowiedzi wracają przez udostępnianie/WhatsApp (nie wymaga konta).

## Stan prac

Działa: wykres siły w ćwiczeniu z wykrywaniem zastoju (`kod/sila.js`) i „Wyślij raport” w Ustawieniach (`kod/raport.js`, bez treningów i PIN-u; czerwona kropka z błędami tylko u właściciela) (wersja 15), ekran treningu w trybie „tylko bieżące ćwiczenie rozwinięte” (`P+"focus"`, wersja 14; starsze testy wymuszają stary widok przez `dev/tests/legacy.js`), kalkulator talerzy (`kod/talerze.js`, sztanga 20 kg, talerze do odznaczenia w Ustawieniach), odznaki (`kod/odznaki.js`, 12 kamieni milowych liczonych z historii), edycja/usuwanie treningu spod kafelków z „Cofnij”, notatka do ćwiczenia i duplikat w edytorze (wersja 13), trzy profile, chmura z PIN-ami, ranking, tonaż (Postępy + szczegóły tygodnia), podsumowanie z obrazkiem do udostępnienia, nowy trening, kolejność, aktualizacje z „Co nowego”, masa ciała, ankieta, film-przewodnik (`film/`, gotowe mp4 w `film/wideo/`).

Do zrobienia / otwarte:
- Mateusz: jeszcze nie połączony z chmurą (po pierwszym zapisie powstaną jego karty w arkuszu). W planie martwy ciąg 3 × 5–8 bez ciężaru.
- Odświeżenie filmu o nowe funkcje (ranking, tonaż, nowy trening, kolejność, masa ciała) – albo krótki film „Co nowego”.
- Wyprosty na ławce rzymskiej z talerzem nie liczą się do tonażu – Damian nie zdecydował.
- PIN-y są krótkie i przewidywalne – zalecona zmiana na litery + cyfry (zmienia Damian w arkuszu).
- Pomysł z makiet na później: liczba odznak w Rankingu (wymaga `Code.gs`).

## Jak pracować z Damianem

- Po polsku, krótko, bez żargonu; tłumacz pojęcia techniczne i prowadź krok po kroku.
- Interfejs aplikacji po polsku, prostym językiem z siłowni.
- Gdy Damian jasno opisał, czego chce – rób od razu, testuj i wdrażaj (24.11.2026: „nie rób makiety, zrób zmiany i wdrażaj”). Makietę lub pytanie tylko przy niejasnym pomyśle albo gdy zmiana dotyka danych użytkowników. Poprawki kodu bez wpływu na użytkownika – rób bez pytania.
- Pytania zadawaj z gotowymi propozycjami odpowiedzi do wyboru.
- Jakość „na piątkę”: każda zmiana z testem i sprawdzeniem na ekranie telefonu, także w trybie ciemnym.
- Oszczędzaj limit: szukaj grepem w `kod/aplikacja.js` (ok. 4,5 tys. linii) zamiast czytać całość; zmiana planu osoby = tylko `dane/plan-<osoba>.js`; między zmianami odpalaj `szybkie` + pasujący zestaw, wszystkie dopiero przed wydaniem.
