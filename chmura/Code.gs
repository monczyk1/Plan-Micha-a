/**
 * Tytanowa siła – kopia w chmurze (Google Apps Script)
 *
 * Instalacja:
 * 1. Utwórz nowy Arkusz Google (np. „Tytanowa siła – Michał”).
 * 2. Rozszerzenia → Apps Script. Usuń wszystko z pliku Code.gs i wklej ten kod.
 * 3. Poniżej zmień PIN na własny (min. 8 znaków, litery i cyfry). Ten sam PIN poda Michał w aplikacji.
 * 4. Zapisz (ikona dyskietki), z listy funkcji u góry wybierz „setup” i kliknij Uruchom.
 *    Google poprosi o zgodę – zaakceptuj (Zaawansowane → Przejdź do projektu).
 * 5. Wdróż → Nowe wdrożenie → typ „Aplikacja internetowa”:
 *      Wykonaj jako: Ja, Kto ma dostęp: Każdy. → Wdróż.
 * 6. Skopiuj „URL aplikacji internetowej” (kończy się na /exec).
 *
 * Zmiana kodu później: Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: Nowa wersja → Wdróż
 * (adres zostaje ten sam).
 */
const PIN = "ZMIEN-TEN-PIN";               // ← ustaw własny PIN
const FOLDER_NAME = "Tytanowa siła – kopie"; // folder na Dysku z pełnymi kopiami
const KEEP = 60;                             // ile ostatnich kopii trzymać

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

function setup() { folder_(); sheet_(); }

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function folder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName("Treningi") || ss.insertSheet("Treningi");
}

function save_(snap) {
  if (!snap || !Array.isArray(snap.sessions)) return { ok: false, error: "no_data" };
  const n = snap.sessions.length;
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd-HHmmss");
  const f = folder_();
  f.createFile("kopia-" + stamp + "-" + n + "tr.json", JSON.stringify(snap), "application/json");
  const files = [];
  const it = f.getFiles();
  while (it.hasNext()) { const x = it.next(); if (/^kopia-.*\.json$/.test(x.getName())) files.push(x); }
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files.slice(KEEP).forEach(function (x) { x.setTrashed(true); });
  if (n > 0) writeSheet_(snap.sessions);
  return { ok: true, savedAt: new Date().toISOString() };
}

function writeSheet_(sessions) {
  const sh = sheet_();
  const rows = [["Data", "Trening", "Ćwiczenie", "Seria", "Ciężar (kg)", "Powtórzenia", "RIR", "Masa ciała", "Notatki"]];
  sessions.slice().sort(function (a, b) {
    return String(a.date).localeCompare(String(b.date)) || (a.created || 0) - (b.created || 0);
  }).forEach(function (s) {
    let first = true;
    (s.ex || []).forEach(function (e) {
      let wi = 0, ri = 0;
      (e.sets || []).forEach(function (t) {
        if (!(t.kg || t.r)) return;
        rows.push([s.date, s.day, e.n, t.w ? "R" + (++wi) : ++ri, num_(t.kg), num_(t.r), e.rir || "",
                   first ? (s.bw || "") : "", first ? (s.notes || "") : ""]);
        first = false;
      });
    });
  });
  sh.clearContents();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
}

function num_(v) {
  const n = parseFloat(String(v == null ? "" : v).replace(",", "."));
  return isNaN(n) ? String(v == null ? "" : v) : n;
}

function list_() {
  const it = folder_().getFiles();
  const a = [];
  while (it.hasNext()) {
    const x = it.next();
    if (/^kopia-.*\.json$/.test(x.getName())) a.push({ id: x.getId(), name: x.getName(), date: x.getDateCreated().toISOString() });
  }
  a.sort(function (p, q) { return q.date.localeCompare(p.date); });
  return { ok: true, items: a };
}

function get_(id) {
  try {
    const x = DriveApp.getFileById(id);
    const parents = x.getParents();
    if (!parents.hasNext() || parents.next().getName() !== FOLDER_NAME) return { ok: false, error: "not_found" };
    return { ok: true, content: x.getBlob().getDataAsString("UTF-8") };
  } catch (err) {
    return { ok: false, error: "not_found" };
  }
}
