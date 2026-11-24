# Tytanowa siła

Dziennik treningowy. Działa w przeglądarce, dane zapisują się lokalnie na urządzeniu.
Pamiętaj o kopii zapasowej (sekcja „Kopia zapasowa” w aplikacji).

## Pliki

| Plik / folder | Co jest w środku |
|---|---|
| `index.html` | ekrany aplikacji (bez kodu) |
| `styl.css` | wygląd, tryb ciemny |
| `dane/` | plany osób, katalog ćwiczeń, rysunki, opisy techniki |
| `kod/profil.js` | lista osób (`PROFILES`) i dziennik błędów |
| `kod/plan.js` | wczytanie planu z telefonu |
| `kod/aplikacja.js` | cała logika: trening, tonaż, historia, postępy, kopie, chmura, ranking, aktualizacje |
| `damian/`, `mateusz/` | adres danej osoby: ikony, manifest i pliki tworzone przez `./sync.sh` – nie edytuj ręcznie |
| `chmura/Code.gs` | skrypt w arkuszu Google (wdrażany ręcznie) |

## Uczestnicy

Każda osoba ma własny adres aplikacji i własne miejsce na dane w telefonie:

| Osoba  | Adres                                   | Plan            | Dane w telefonie |
|--------|-----------------------------------------|-----------------|------------------|
| Michał | `…/Plan-Micha-a/`                       | A/B             | `gora_*`         |
| Damian | `…/Plan-Micha-a/damian/`                | 5 dni (PN–PT)   | `goradamian_*`   |
| Mateusz | `…/Plan-Micha-a/mateusz/`               | 5 dni po kolei (Klata → Nogi) | `goramateusz_*` |

Dwie osoby na tym samym telefonie nie mieszają danych.

### Dodanie nowej osoby

1. `./nowy-uczestnik.sh tomek "Tomek"` – tworzy folder `tomek/` (adres `…/Plan-Micha-a/tomek/`).
2. W `kod/profil.js` dopisz osobę w `PROFILES`, np. `tomek:{name:"Tomek"}` (plan startowy A/B).
3. `./sync.sh`, commit, push.
4. W arkuszu z kopiami, karta **Uczestnicy**: nowy wiersz – imię i PIN (min. 6 znaków, inny niż pozostałe).
   Kod skryptu i wdrożenie zostają bez zmian.

Po każdej zmianie uruchom `./sync.sh` – tworzy `index.html` i `sw.js` w folderach uczestników (wskazują na wspólne pliki) i pilnuje numeru wersji.

## Wydanie nowej wersji

1. W `kod/aplikacja.js` zwiększ `APP_BUILD`.
2. W `version.json` ustaw ten sam `build` i dopisz na górze listy zmian (po polsku, prostym językiem – to widzą uczestnicy).
3. `./sync.sh`, commit, push. Aplikacja sama pokaże pasek „Jest nowa wersja”, a po odświeżeniu okno „Co nowego”.

## Kopia w chmurze (`chmura/Code.gs`)

Jeden skrypt Google Apps Script w jednym arkuszu obsługuje wszystkich. Osobę rozpoznaje po PIN-ie
z karty **Uczestnicy**; każda osoba ma własne karty („Treningi – Imię”, ukryte „Kopie – Imię”)
i nie widzi kopii innych. „NIE” w kolumnie *Aktywny* blokuje dostęp. Instrukcja aktualizacji jest na początku pliku.

## Ranking

Zakładka **Ranking** (wymaga kopii w chmurze i skryptu w wersji 3): konkurs tygodnia PN–ND na liczbę serii roboczych
(z wpisem albo ✓; rozgrzewka się nie liczy), puchary za wygrane tygodnie (remis = puchar dla każdego) i rekordy –
największy ciężar w serii roboczej w ćwiczeniach, które robią co najmniej 2 osoby (przy równym ciężarze wygrywa więcej powtórzeń).
Ptaszek „Pokazuj mnie w rankingu” w Ustawieniach ukrywa osobę (kolumna *Ranking* w karcie Uczestnicy).

## Praca w Claude Code

- `CLAUDE.md` – zasady projektu, budowa aplikacji, reguły tonażu i kroki wydania (Claude Code czyta go sam).
- `dev/` – testy automatyczne: `cd dev && npm install && npx playwright install chromium`, potem `./run-tests.sh szybkie` (5 s), zestaw (`trening`, `osoby`, `chmura`, `wyglad`) albo `./run-tests.sh` (wszystkie, ok. 35 s).
- `film/` – źródła i gotowe pliki filmu-przewodnika.
