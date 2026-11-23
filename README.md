# Tytanowa siła

Dziennik treningowy. Działa w przeglądarce, dane zapisują się lokalnie na urządzeniu.
Pamiętaj o kopii zapasowej (sekcja „Kopia zapasowa” w aplikacji).

## Uczestnicy

Każda osoba ma własny adres aplikacji i własne miejsce na dane w telefonie:

| Osoba  | Adres                                   | Plan            | Dane w telefonie |
|--------|-----------------------------------------|-----------------|------------------|
| Michał | `…/Plan-Micha-a/`                       | A/B             | `gora_*`         |
| Damian | `…/Plan-Micha-a/damian/`                | 5 dni (PN–PT)   | `goradamian_*`   |

Dwie osoby na tym samym telefonie nie mieszają danych.

### Dodanie nowej osoby

1. `./nowy-uczestnik.sh tomek "Tomek"` – tworzy folder `tomek/` (adres `…/Plan-Micha-a/tomek/`).
2. W `index.html` dopisz osobę w `PROFILES`, np. `tomek:{name:"Tomek"}` (plan startowy A/B).
3. `./sync.sh`, commit, push.
4. W arkuszu z kopiami, karta **Uczestnicy**: nowy wiersz – imię i PIN (min. 6 znaków, inny niż pozostałe).
   Kod skryptu i wdrożenie zostają bez zmian.

Po każdej zmianie `index.html` lub `sw.js` uruchom `./sync.sh` (kopiuje je do folderów uczestników).

## Wydanie nowej wersji

1. W `index.html` zwiększ `APP_BUILD`.
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
