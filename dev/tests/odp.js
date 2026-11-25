// Wersja 17: odporność na uszkodzone dane, zabezpieczenie nazw w planie, sprawdzanie i bezpieczne przywracanie kopii.
const { chromium } = require("playwright");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const ok = (n, c, i) => console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  → " + JSON.stringify(i)));
const X = "<img src=x onerror=window.__xss=1>";
const base = { goradamian_welcome: "1", goradamian_lastbk: String(Date.now() + 1e9), goradamian_bmW: JSON.stringify("2000-1-1") };
const good = (id, day) => ({ id, date: "2026-11-0" + (id.length % 9 + 1), day: day || "PN", week: 1, created: 1000 + id.length, bw2: 1, ex: [{ k: "bench", n: "Wyciskanie", sets: [{ kg: "80", r: "5" }] }] });

(async () => {
  const b = await chromium.launch();
  const open = async (extra, init) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } });
    await c.route(/script\.google\.com|fonts\./, (r) => r.abort());
    await c.addInitScript(([s, e]) => {
      if (sessionStorage.s) return;
      sessionStorage.s = 1;
      for (const k in s) localStorage.setItem(k, s[k]);
      for (const k in e) localStorage.setItem(k, e[k]);
    }, [base, extra || {}]);
    const p = await c.newPage();
    p.errs = [];
    p.on("pageerror", (x) => p.errs.push(x.message));
    p.on("dialog", (d) => d.dismiss().catch(() => {}));
    await p.goto("file://" + path.join(ROOT, "damian", "index.html"));
    await p.waitForTimeout(600);
    return p;
  };
  const tiles = (p) => p.$$eval("#seg button", (e) => e.length);
  const tour = async (p) => {
    for (const v of ["hist", "prog", "rank", "set", "train"]) {
      await p.click('.tabs [data-view="' + v + '"]', { timeout: 1500 }).catch(() => {});
      await p.waitForTimeout(120);
    }
    await p.evaluate(() => document.querySelectorAll("#seg button").forEach((x) => x.click()));
    await p.waitForTimeout(200);
  };

  // ---- uszkodzone treningi ----
  const bad = {
    "lista zamieniona na obiekt": JSON.stringify({ a: 1 }),
    "puste i obce wpisy w liście": JSON.stringify([null, 5, {}, { ex: null }, { date: "x", day: "PN", ex: [{ k: "bench", sets: null }] }, { date: "2026-11-01", day: "ZZ", ex: [null, { k: "bench", n: "x", sets: [null, { kg: "abc", r: "-5" }] }] }]),
  };
  for (const [name, val] of Object.entries(bad)) {
    const p = await open({ goradamian_sessions: val });
    await tour(p);
    ok("O1 uszkodzone treningi (" + name + "): aplikacja działa, zakładki otwierają się", (await tiles(p)) >= 5 && !p.errs.length, [await tiles(p), p.errs]);
    ok("O2 (" + name + "): problem zapisany w dzienniku błędów", await p.evaluate(() => BLEDY.some((x) => /uszkodzone treningi/.test(x.gdzie))));
    ok("O3 (" + name + "): kopia ratunkowa zawiera oryginał", (await p.evaluate(() => (JSON.parse(localStorage.getItem("goradamian_zepsute") || "null") || {}).raw !== undefined)));
    await p.context().close();
  }
  let p = await open({ goradamian_sessions: JSON.stringify([good("a"), null, good("bb")]) });
  ok("O4 dobre treningi z uszkodzonej listy zostają (2 z 3 wpisów)", (await p.evaluate(() => sessions.length)) === 2);
  ok("O5 kopia ratunkowa nie trafia do kopii zapasowych", !(await p.evaluate(() => Object.keys(snapshot().storage).includes("goradamian_zepsute"))));
  await p.context().close();
  p = await open({ goradamian_sessions: JSON.stringify([good("a"), good("bb")]) });
  ok("O6 zdrowe dane: bez kopii ratunkowej i bez wpisu w dzienniku", !(await p.evaluate(() => localStorage.getItem("goradamian_zepsute"))) && !(await p.evaluate(() => BLEDY.length)));
  await p.context().close();

  // ---- wstrzyknięcia przez plan ----
  const plans = {
    "nazwa dodatkowego treningu": { X1: { name: X, sub: "s", extra: 1, ex: [{ k: "bench", n: "a", s: 3, r: "5" }] } },
    "zakres powtórzeń": { PN: { name: "Push", sub: "s", ex: [{ k: "bench", n: "a", s: 3, r: X }] } },
    "klucz ćwiczenia": { PN: { name: "Push", sub: "s", ex: [{ k: '"><img src=x onerror=window.__xss=1>', n: "a", s: 3, r: "5" }] } },
    "nazwa i notatka": { PN: { name: X, sub: X, ex: [{ k: "bench", n: X, s: 3, r: "5", note: X }] } },
  };
  for (const [name, pl] of Object.entries(plans)) {
    p = await open({ goradamian_plan: JSON.stringify(pl), goradamian_sessions: JSON.stringify([good("a", Object.keys(pl)[0])]) });
    await tour(p);
    await p.evaluate(() => openEditor(DAYS[0])); // otwiera edytor planu (też wyświetla nazwy)
    await p.waitForTimeout(200);
    ok("X1 plan – " + name + ": brak wykonania wstrzykniętego kodu", !(await p.evaluate(() => !!window.__xss)));
    await p.context().close();
  }
  p = await open({ goradamian_plan: JSON.stringify({ PN: { name: "Push", sub: "Klatka", ex: [{ k: "bench", n: "Wyciskanie", s: 3, r: "6–8", note: "ławka 2", unit: "powt." }] }, X1: { name: "Moje <b>nogi</b>", sub: "dodatkowy", extra: 1, ex: [{ k: "squat", s: 3, r: "5" }] } }) });
  const pl = await p.evaluate(() => JSON.stringify(PLAN));
  ok("X2 poprawny plan bez zmian (nazwa, zakres, notatka, jednostka, ćwiczenie bez nazwy)", /"r":"6–8"/.test(pl) && /"note":"ławka 2"/.test(pl) && /"unit":"powt."/.test(pl) && /"name":"Moje bnogi\/b"/.test(pl) && !/"n":""/.test(pl), pl);
  await p.context().close();

  // ---- kopia z pliku: sprawdzanie przed wczytaniem ----
  p = await open({ goradamian_sessions: JSON.stringify([good("a"), good("bb"), good("ccc")]) });
  const imp = async (obj) => {
    await p.evaluate((o) => importBackup(JSON.stringify(o)), obj);
    await p.waitForTimeout(150);
  };
  await imp({ storage: { goradamian_sessions: "to nie jest json" } });
  ok("K1 uszkodzona kopia (treningi nie są JSON): komunikat, okno przywracania się nie otwiera", /uszkodzony/.test(await p.textContent("#toast")) && (await p.isHidden("#rsSheet")), await p.textContent("#toast"));
  await imp({ storage: { goradamian_sessions: JSON.stringify({ a: 1 }) } });
  ok("K2 kopia z treningami nie jako lista: odrzucona", /uszkodzony/.test(await p.textContent("#toast")) && (await p.isHidden("#rsSheet")));
  await imp({ storage: { goradamian_sessions: JSON.stringify([good("z1")]), goradamian_plan: "{uszkodzony" } });
  ok("K3 kopia z uszkodzonym planem: odrzucona", (await p.isHidden("#rsSheet")) && (await p.evaluate(() => sessions.length)) === 3);
  await imp({ storage: { goradamian_sessions: JSON.stringify([good("z1"), null, good("z2")]) } });
  ok("K4 kopia z jednym złym wpisem: wczytuje dobre (2 treningi) i pyta o przywrócenie", !(await p.isHidden("#rsSheet")) && /2 trening/.test(await p.textContent("#rsTxt")), await p.textContent("#rsTxt"));
  await p.context().close();

  // ---- bezpieczne przywracanie: błąd zapisu w trakcie nie kasuje danych ----
  p = await open({ goradamian_sessions: JSON.stringify([good("a"), good("bb"), good("ccc")]), goradamian_plan: JSON.stringify({ PN: { name: "Push", sub: "s", ex: [{ k: "bench", n: "Wyciskanie", s: 3, r: "5" }] } }) });
  const r = await p.evaluate(() => {
    const before = localStorage.getItem("goradamian_sessions");
    const orig = Storage.prototype.setItem;
    let thrown = false;
    Storage.prototype.setItem = function (k, v) {
      if (k === "goradamian_plan" && !thrown) {
        thrown = true;
        throw new Error("QuotaExceededError");
      }
      return orig.call(this, k, v);
    };
    window.__reloaded = false;
    const store = { goradamian_sessions: JSON.stringify([]), goradamian_plan: JSON.stringify({ PN: { name: "Inny", sub: "s", ex: [] } }) };
    try { applySnapshot(store, "test", false); } catch (e) { return { err: String(e) }; }
    Storage.prototype.setItem = orig;
    return { before, after: localStorage.getItem("goradamian_sessions"), plan: localStorage.getItem("goradamian_plan"), thrown };
  });
  ok("P1 błąd zapisu w trakcie przywracania: treningi nietknięte", r.thrown && r.before === r.after, r);
  ok("P2 …i plan wrócił do poprzedniego", /"name":"Push"/.test(r.plan || ""), r.plan);
  ok("P3 …a użytkownik dostaje komunikat o zachowanych danych", /zostały bez zmian/.test(await p.textContent("#toast")), await p.textContent("#toast"));
  await p.context().close();
  await b.close();
})();
