/**
 * @OnlyCurrentDoc
 *
 * Tytanowa siła – kopia w chmurze dla wielu osób (Google Apps Script), wersja 2
 *
 * Skrypt ma dostęp TYLKO do arkusza, w którym go zainstalujesz.
 * Nie widzi żadnych innych plików na Twoim Dysku.
 *
 * Każdy uczestnik ma własny PIN i własne karty w arkuszu. PIN-y wpisujesz w karcie „Uczestnicy”:
 *   Imię | PIN | Aktywny | Karta treningów | Karta kopii | Ostatnia kopia
 * Aplikacja rozpoznaje osobę po PIN-ie – nikt nie widzi kopii innej osoby.
 * Nowa osoba = nowy wiersz w „Uczestnicy”. Nie trzeba zmieniać kodu ani wdrażać go od nowa.
 * „NIE” w kolumnie Aktywny blokuje danej osobie dostęp (jej dane zostają).
 *
 * Przejście z wersji 1 (jeden PIN w kodzie) – bez przerwy w działaniu u Michała:
 * 1. Zanim cokolwiek zmienisz, przepisz z obecnego kodu PIN Michała (linia: const PIN = "…").
 * 2. Usuń stary kod z Code.gs, wklej ten i zapisz (ikona dyskietki).
 * 3. Z listy funkcji u góry wybierz „setup” i kliknij Uruchom.
 *    Powstanie karta „Uczestnicy” z wierszami Michał i Damian.
 * 4. W karcie „Uczestnicy” wpisz PIN Michała (ten sam co dotąd) i swój nowy PIN (min. 6 znaków).
 * 5. Wdróż → Zarządzaj wdrożeniami → ołówek przy obecnym wdrożeniu → Wersja: „Nowa wersja” → Wdróż.
 *    Adres /exec zostaje ten sam, więc w aplikacji nic nie trzeba zmieniać.
 *    (Do kroku 5 działa stara wersja, więc Michał nie odczuje zmiany.)
 *
 * Dane Michała zostają tam, gdzie były: karty „Treningi” i „Kopie”.
 */
const KEEP = 60;       // ile ostatnich kopii trzymać na osobę
const CHUNK = 40000;   // limit znaków w jednej komórce (Google: 50 000)
const MIN_PIN = 6;
const COLS = ["Imię", "PIN", "Aktywny", "Karta treningów", "Karta kopii", "Ostatnia kopia"];

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: "bad_request" }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const u = user_(req && req.pin);
    if (u === "dup") return out_({ ok: false, error: "pin_dup" });
    if (!u) { Utilities.sleep(1200); return out_({ ok: false, error: "pin" }); } // spowalnia zgadywanie PIN-u
    if (req.action === "ping") return out_({ ok: true, name: u.name });
    if (req.action === "save") return out_(save_(u, req.snapshot));
    if (req.action === "list") return out_(list_(u));
    if (req.action === "get") return out_(get_(u, req.id));
    return out_({ ok: false, error: "action" });
  } catch (err) {
    return out_({ ok: false, error: "server", detail: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out_({ ok: true, app: "tytanowa-sila", v: 2 }); }

// Uruchom raz po wklejeniu kodu. Można uruchamiać wielokrotnie – niczego nie nadpisze.
function setup() {
  const sh = people_();
  if (sh.getLastRow() < 2) {
    sh.getRange(2, 1, 2, 6).setValues([
      ["Michał", "", "TAK", "Treningi", "Kopie", ""],
      ["Damian", "", "TAK", "Treningi – Damian", "Kopie – Damian", ""]
    ]);
  }
  const ppl = rows_();
  ppl.forEach(function (u) { treningi_(u); kopie_(u); });
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function people_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName("Uczestnicy");
  if (!sh) {
    sh = ss.insertSheet("Uczestnicy");
    sh.getRange(1, 1, 1, COLS.length).setValues([COLS]);
    sh.setFrozenRows(1);
    sh.getRange("B:B").setNumberFormat("@"); // PIN jako tekst (np. zera na początku zostają)
  }
  return sh;
}

function rows_() {
  const sh = people_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 6).getValues().map(function (r, i) {
    const name = String(r[0] || "").trim();
    return {
      row: i + 2, name: name, pin: String(r[1] == null ? "" : r[1]).trim(),
      active: String(r[2] || "TAK").trim().toUpperCase() !== "NIE",
      tSheet: String(r[3] || "").trim() || ("Treningi – " + name),
      kSheet: String(r[4] || "").trim() || ("Kopie – " + name)
    };
  }).filter(function (u) { return u.name; });
}

function user_(pin) {
  pin = String(pin == null ? "" : pin).trim();
  if (pin.length < MIN_PIN) return null;
  const hit = rows_().filter(function (u) { return u.pin.length >= MIN_PIN && u.pin === pin; });
  if (hit.length > 1) return "dup";
  if (!hit.length || !hit[0].active) return null;
  return hit[0];
}

function treningi_(u) {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(u.tSheet) || ss.insertSheet(u.tSheet);
}

function kopie_(u) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(u.kSheet);
  if (!sh) {
    sh = ss.insertSheet(u.kSheet);
    sh.getRange(1, 1, 1, 4).setValues([["Id", "Zapisano", "Treningi", "Dane (nie edytuj)"]]);
    sh.setFrozenRows(1);
    sh.hideSheet();
  }
  return sh;
}

function save_(u, snap) {
  if (!snap || !Array.isArray(snap.sessions)) return { ok: false, error: "no_data" };
  const n = snap.sessions.length;
  const json = JSON.stringify(snap);
  const now = new Date().toISOString();
  const row = ["k" + Date.now(), "~" + now, n];
  for (let i = 0; i < json.length; i += CHUNK) row.push("~" + json.slice(i, i + CHUNK)); // „~” chroni przed zamianą tekstu na liczbę/datę/formułę
  const sh = kopie_(u);
  sh.appendRow(row);
  const count = sh.getLastRow() - 1;
  if (count > KEEP) sh.deleteRows(2, count - KEEP);
  if (n > 0) writeSheet_(u, snap.sessions);
  people_().getRange(u.row, 6).setValue(new Date());
  return { ok: true, savedAt: now };
}

function writeSheet_(u, sessions) {
  const sh = treningi_(u);
  const rows = [["Data", "Trening", "Ćwiczenie", "Seria", "Ciężar (kg)", "Powtórzenia", "RIR", "Masa ciała", "Notatki"]];
  sessions.slice().sort(function (a, b) {
    return String(a.date).localeCompare(String(b.date)) || (a.created || 0) - (b.created || 0);
  }).forEach(function (s) {
    let first = true;
    (s.ex || []).forEach(function (e) {
      let wi = 0, ri = 0;
      (e.sets || []).forEach(function (t) {
        if (!(t.kg || t.r)) return;
        rows.push([s.date, txt_(s.day), txt_(e.n), t.w ? "R" + (++wi) : ++ri, num_(t.kg), num_(t.r), txt_(e.rir),
                   first ? num_(s.bw) : "", first ? txt_(s.notes) : ""]);
        first = false;
      });
    });
  });
  sh.clearContents();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
}

// Tekst zaczynający się od = + - @ Arkusz potraktowałby jak formułę – apostrof zostawia go jako zwykły tekst
function txt_(v) {
  const t = String(v == null ? "" : v);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function num_(v) {
  const t = String(v == null ? "" : v).trim();
  if (t === "") return "";
  return /^-?\d+([.,]\d+)?$/.test(t) ? Number(t.replace(",", ".")) : txt_(t);
}

function list_(u) {
  const sh = kopie_(u);
  const last = sh.getLastRow();
  if (last < 2) return { ok: true, items: [] };
  const vals = sh.getRange(2, 1, last - 1, 3).getValues();
  const items = vals.map(function (r) {
    const d = String(r[1]).replace(/^~/, "");
    return { id: String(r[0]), date: d, count: Number(r[2]) || 0, name: "kopia-" + r[0] + "-" + (Number(r[2]) || 0) + "tr.json" };
  });
  items.sort(function (p, q) { return q.date.localeCompare(p.date); });
  return { ok: true, items: items };
}

function get_(u, id) {
  const sh = kopie_(u);
  const last = sh.getLastRow();
  if (last < 2) return { ok: false, error: "not_found" };
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      const r = i + 2;
      const width = sh.getLastColumn() - 3;
      const parts = sh.getRange(r, 4, 1, Math.max(1, width)).getValues()[0];
      return { ok: true, content: parts.map(function (p) { return String(p || "").replace(/^~/, ""); }).join("") };
    }
  }
  return { ok: false, error: "not_found" };
}
