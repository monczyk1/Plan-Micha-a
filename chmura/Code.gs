/**
 * @OnlyCurrentDoc
 *
 * Tytanowa siła – kopia w chmurze i ranking dla wielu osób (Google Apps Script), wersja 4
 * (4: ranking „Kilogramy tygodnia” i puchary za kilogramy)
 *
 * Skrypt ma dostęp TYLKO do arkusza, w którym go zainstalujesz.
 * Nie widzi żadnych innych plików na Twoim Dysku.
 *
 * Każdy uczestnik ma własny PIN i własne karty w arkuszu. PIN-y wpisujesz w karcie „Uczestnicy”:
 *   Imię | PIN | Aktywny | Karta treningów | Karta kopii | Ostatnia kopia | Ranking
 * Aplikacja rozpoznaje osobę po PIN-ie – nikt nie widzi kopii innej osoby.
 * Nowa osoba = nowy wiersz w „Uczestnicy”. Nie trzeba zmieniać kodu ani wdrażać go od nowa.
 * „NIE” w kolumnie Aktywny blokuje danej osobie dostęp (jej dane zostają).
 * Kolumnę Ranking ustawia sama aplikacja (ptaszek „Pokazuj mnie w rankingu”). Ranking liczy się z ostatnich kopii.
 *
 * Przejście z wersji 1 (jeden PIN w kodzie) lub 2 – bez przerwy w działaniu u Michała:
 * 1. Z wersji 1: zanim cokolwiek zmienisz, przepisz z obecnego kodu PIN Michała (linia: const PIN = "…").
 *    Z wersji 2: PIN-y są już w karcie „Uczestnicy”, nic nie przepisujesz.
 * 2. Usuń stary kod z Code.gs, wklej ten i zapisz (ikona dyskietki).
 * 3. Z listy funkcji u góry wybierz „setup” i kliknij Uruchom.
 *    Powstanie (albo uzupełni się) karta „Uczestnicy” z wierszami Michał i Damian.
 * 4. Z wersji 1: w karcie „Uczestnicy” wpisz PIN Michała (ten sam co dotąd) i swój nowy PIN (min. 6 znaków).
 * 5. Wdróż → Zarządzaj wdrożeniami → ołówek przy obecnym wdrożeniu → Wersja: „Nowa wersja” → Wdróż.
 *    Adres /exec zostaje ten sam, więc w aplikacji nic nie trzeba zmieniać.
 *    (Do kroku 5 działa stara wersja, więc Michał nie odczuje zmiany.)
 *
 * Dane Michała zostają tam, gdzie były: karty „Treningi” i „Kopie”.
 */
const KEEP = 60;       // ile ostatnich kopii trzymać na osobę
const CHUNK = 40000;   // limit znaków w jednej komórce (Google: 50 000)
const MIN_PIN = 6;
const COLS = ["Imię", "PIN", "Aktywny", "Karta treningów", "Karta kopii", "Ostatnia kopia", "Ranking"];

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
    if (req.rank === true || req.rank === false) setRank_(u, req.rank);
    if (req.action === "save") return out_(save_(u, req.snapshot));
    if (req.action === "pref") return out_({ ok: true });
    if (req.action === "rank") return out_(rank_(u, req.today));
    if (req.action === "list") return out_(list_(u));
    if (req.action === "get") return out_(get_(u, req.id));
    return out_({ ok: false, error: "action" });
  } catch (err) {
    return out_({ ok: false, error: "server", detail: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out_({ ok: true, app: "tytanowa-sila", v: 4 }); }

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
  if (String(sh.getRange(1, 7).getValues()[0][0] || "") !== COLS[6]) sh.getRange(1, 7).setValue(COLS[6]); // dopisuje kolumnę z wersji 3
  return sh;
}

function rows_() {
  const sh = people_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 7).getValues().map(function (r, i) {
    const name = String(r[0] || "").trim();
    return {
      row: i + 2, name: name, pin: String(r[1] == null ? "" : r[1]).trim(),
      active: String(r[2] || "TAK").trim().toUpperCase() !== "NIE",
      tSheet: String(r[3] || "").trim() || ("Treningi – " + name),
      kSheet: String(r[4] || "").trim() || ("Kopie – " + name),
      rank: String(r[6] || "TAK").trim().toUpperCase() !== "NIE"
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

// ===== Ranking =====
function setRank_(u, on) {
  people_().getRange(u.row, 7).setValue(on ? "TAK" : "NIE");
  u.rank = !!on;
}

function latest_(u) {
  const sh = SpreadsheetApp.getActive().getSheetByName(u.kSheet);
  if (!sh || sh.getLastRow() < 2) return null;
  const width = Math.max(1, sh.getLastColumn() - 3);
  const parts = sh.getRange(sh.getLastRow(), 4, 1, width).getValues()[0];
  try { return JSON.parse(parts.map(function (p) { return String(p || "").replace(/^~/, ""); }).join("")); } catch (e) { return null; }
}

function day_(s) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
function monday_(s) { const d = day_(s); if (!d) return ""; d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); }
function plusDays_(s, n) { const d = day_(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function kg_(v) { const t = String(v == null ? "" : v).trim().replace(",", "."); return /^\d+(\.\d+)?$/.test(t) ? Number(t) : 0; }

// Tonaż treningu: aplikacja zapisuje go w polu vol (hantle ×2); dla starszych zapisów liczymy kg × powtórzenia
function vol_(s) {
  if (typeof s.vol === "number") return s.vol;
  let v = 0;
  (s.ex || []).forEach(function (e) { if (e.kind) return; (e.sets || []).forEach(function (t) { if (!t.w) v += kg_(t.kg) * (parseInt(t.r, 10) || 0); }); });
  return Math.round(v);
}

// Serie do rankingu: aplikacja zapisuje je w polu nsets (tylko serie robocze z sekcji Ćwiczenia);
// dla starszych zapisów liczymy serie robocze z wpisem, bez rozgrzewki, dynamiki, core i cardio
function setsOf_(s) {
  if (typeof s.nsets === "number") return s.nsets;
  let n = 0;
  (s.ex || []).forEach(function (e) {
    if (e.kind) return;
    (e.sets || []).forEach(function (t) {
      if (t.w) return;
      if (String(t.kg || "").trim() || String(t.r || "").trim()) n++;
    });
  });
  return n;
}

function rank_(me, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(today || ""))) today = new Date().toISOString().slice(0, 10);
  const wk = monday_(today), prev = plusDays_(wk, -7);
  const ppl = [], weeks = {}, weeksKg = {}, rec = {};
  rows_().forEach(function (u) {
    if (!u.active || !u.rank) return;
    const snap = latest_(u);
    if (!snap || !Array.isArray(snap.sessions)) return;
    const p = { name: u.name, me: u.row === me.row, sets: 0, trainings: 0, kg: 0 };
    snap.sessions.forEach(function (s) {
      const w = monday_(s.date); if (!w || w > wk) return;
      const n = setsOf_(s);
      const v = vol_(s);
      weeks[w] = weeks[w] || {}; weeks[w][u.name] = (weeks[w][u.name] || 0) + n;
      weeksKg[w] = weeksKg[w] || {}; weeksKg[w][u.name] = (weeksKg[w][u.name] || 0) + v;
      if (w === wk) { p.sets += n; p.kg += v; if (n) p.trainings++; }
      (s.ex || []).forEach(function (e) {
        if (e.kind || !e.k) return;
        (e.sets || []).forEach(function (t) {
          if (t.w) return;
          const kg = kg_(t.kg); if (!kg) return;
          const r = parseInt(t.r, 10) || 0;
          const x = rec[e.k] = rec[e.k] || { k: e.k, n: e.n, by: {} };
          const b = x.by[u.name];
          if (!b || kg > b.kg || (kg === b.kg && (r > b.r || (r === b.r && String(s.date) < b.date)))) x.by[u.name] = { name: u.name, me: p.me, kg: kg, r: r, date: String(s.date) };
        });
      });
    });
    ppl.push(p);
  });
  ppl.sort(function (a, b) { return b.sets - a.sets || a.name.localeCompare(b.name); });
  const top = ppl.length && ppl[0].sets ? ppl[0].sets : 0;
  ppl.forEach(function (p) { p.lead = top > 0 && p.sets === top; });
  function cupsOf(W) {
    const c = {}; let l = null;
    Object.keys(W).forEach(function (w) {
      if (w >= wk) return;
      const names = Object.keys(W[w]); const mx = Math.max.apply(null, names.map(function (n) { return W[w][n]; }));
      if (!(mx > 0)) return;
      const win = names.filter(function (n) { return W[w][n] === mx; });
      win.forEach(function (n) { c[n] = (c[n] || 0) + 1; });
      if (w === prev) l = { names: win, v: mx };
    });
    return { list: Object.keys(c).map(function (n) { return { name: n, n: c[n] }; }).sort(function (a, b) { return b.n - a.n || a.name.localeCompare(b.name); }), last: l };
  }
  const cs = cupsOf(weeks), ck = cupsOf(weeksKg);
  const last = cs.last ? { names: cs.last.names, sets: cs.last.v } : null;
  const records = Object.keys(rec).map(function (k) {
    const list = Object.keys(rec[k].by).map(function (n) { return rec[k].by[n]; });
    list.sort(function (a, b) { return b.kg - a.kg || b.r - a.r || a.date.localeCompare(b.date); });
    return { k: k, n: rec[k].n, list: list };
  }).filter(function (x) { return x.list.length >= 2; });
  records.sort(function (a, b) { return b.list.length - a.list.length || b.list[0].kg - a.list[0].kg; });
  return {
    ok: true, week: wk, people: ppl, last: last, records: records,
    cups: cs.list, kgCups: ck.list, lastKg: ck.last ? { names: ck.last.names, kg: ck.last.v } : null,
    me: { name: me.name, rank: me.rank }
  };
}
