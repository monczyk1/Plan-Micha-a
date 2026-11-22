/**
 * @OnlyCurrentDoc
 *
 * Tytanowa siła – kopia w chmurze (Google Apps Script)
 *
 * Skrypt ma dostęp TYLKO do arkusza, w którym go zainstalujesz.
 * Nie widzi żadnych innych plików na Twoim Dysku.
 *
 * Instalacja:
 * 1. Utwórz nowy Arkusz Google (np. „Tytanowa siła – Michał”).
 * 2. Rozszerzenia → Apps Script. Usuń wszystko z pliku Code.gs i wklej ten kod.
 * 3. Poniżej zmień PIN na własny (min. 8 znaków, litery i cyfry). Ten sam PIN poda Michał w aplikacji.
 * 4. Zapisz, z listy funkcji u góry wybierz „setup” i kliknij Uruchom. Zaakceptuj uprawnienia.
 * 5. Wdróż → Nowe wdrożenie → typ „Aplikacja internetowa”:
 *      Wykonaj jako: Ja, Kto ma dostęp: Każdy. → Wdróż.
 * 6. Skopiuj „URL aplikacji internetowej” (kończy się na /exec).
 *
 * W arkuszu powstaną dwie karty:
 *   „Treningi” – czytelna tabela serii,
 *   „Kopie”    – pełne kopie aplikacji (ukryta karta, nie edytuj jej).
 */
const PIN = "ZMIEN-TEN-PIN";   // ← ustaw własny PIN
const KEEP = 60;               // ile ostatnich kopii trzymać
const CHUNK = 40000;           // limit znaków w jednej komórce (Google: 50 000)

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: "bad_request" }); }
  if (!req || String(req.pin || "") !== PIN || PIN === "ZMIEN-TEN-PIN") return out_({ ok: false, error: "pin" });
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (req.action === "ping") return out_({ ok: true });
    if (req.action === "save") return out_(save_(req.snapshot));
    if (req.action === "list") return out_(list_());
    if (req.action === "get") return out_(get_(req.id));
    return out_({ ok: false, error: "action" });
  } catch (err) {
    return out_({ ok: false, error: "server", detail: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out_({ ok: true, app: "tytanowa-sila" }); }

function setup() { treningi_(); kopie_(); }

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function treningi_() {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName("Treningi") || ss.insertSheet("Treningi");
}

function kopie_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName("Kopie");
  if (!sh) {
    sh = ss.insertSheet("Kopie");
    sh.getRange(1, 1, 1, 4).setValues([["Id", "Zapisano", "Treningi", "Dane (nie edytuj)"]]);
    sh.setFrozenRows(1);
    sh.hideSheet();
  }
  return sh;
}

function save_(snap) {
  if (!snap || !Array.isArray(snap.sessions)) return { ok: false, error: "no_data" };
  const n = snap.sessions.length;
  const json = JSON.stringify(snap);
  const row = ["k" + Date.now(), "~" + new Date().toISOString(), n];
  for (let i = 0; i < json.length; i += CHUNK) row.push("~" + json.slice(i, i + CHUNK)); // „~” chroni przed zamianą tekstu na liczbę/datę/formułę
  const sh = kopie_();
  sh.appendRow(row);
  const count = sh.getLastRow() - 1;
  if (count > KEEP) sh.deleteRows(2, count - KEEP);
  if (n > 0) writeSheet_(snap.sessions);
  return { ok: true, savedAt: new Date().toISOString() };
}

function writeSheet_(sessions) {
  const sh = treningi_();
  const rows = [["Data", "Trening", "Ćwiczenie", "Seria", "Ciężar (kg)", "Powtórzenia", "RIR", "Masa ciała", "Notatki"]];
  sessions.slice().sort(function (a, b) {
    return String(a.date).localeCompare(String(b.date)) || (a.created || 0) - (b.created || 0);
  }).forEach(function (s) {
    let first = true;
    (s.ex || []).forEach(function (e) {
      let wi = 0, ri = 0;
      (e.sets || []).forEach(function (t) {
        if (!(t.kg || t.r)) return;
        rows.push([s.date, s.day, txt_(e.n), t.w ? "R" + (++wi) : ++ri, num_(t.kg), num_(t.r), txt_(e.rir),
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

function list_() {
  const sh = kopie_();
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

function get_(id) {
  const sh = kopie_();
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
