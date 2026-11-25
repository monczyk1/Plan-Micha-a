// Wersja 19: Postępy (tydzień, rekordy, partie, cele, siła do masy ciała) i karta „Razem” w Rankingu.
const { chromium } = require("playwright");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const ok = (n, c, i) => console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  → " + JSON.stringify(i)));
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const set = (kg, r) => ({ kg: String(kg), r: String(r) });
const ex = (k, n, sets) => ({ k, n, sets });
const S = (n, id, exs) => ({ id, date: daysAgo(n), day: "PN", week: 1, created: Date.now() - n * 864e5, bw2: 1, ex: exs });
(async () => {
  const b = await chromium.launch();
  const open = async (seed) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "pl-PL" });
    await c.route(/script\.google\.com|fonts\./, (r) => r.abort());
    await c.addInitScript((s) => {
      if (sessionStorage.s) return; sessionStorage.s = 1;
      localStorage.setItem("goradamian_welcome", "1");
      localStorage.setItem("goradamian_lastbk", String(Date.now() + 1e9));
      localStorage.setItem("goradamian_bmW", "2999-1-1");
      localStorage.setItem("goradamian_bm", JSON.stringify([{ d: "2026-01-01", kg: 80 }]));
      if (s) localStorage.setItem("goradamian_sessions", JSON.stringify(s));
    }, seed || null);
    const p = await c.newPage(); p.errs = [];
    p.on("pageerror", (x) => p.errs.push(x.message));
    await p.goto("file://" + path.join(ROOT, "damian", "index.html"));
    await p.waitForTimeout(400);
    await p.click("#welcomeOk", { timeout: 1500 }).catch(() => {});
    await p.click("#bmLater", { timeout: 800 }).catch(() => {});
    return p;
  };
  const seed = [
    S(35, "z", [ex("bench", "Wyciskanie", [set(60, 8), set(60, 8)])]),
    S(20, "a", [ex("bench", "Wyciskanie", [set(70, 8)]), ex("squat", "Przysiad", [set(90, 5)])]),
    S(9, "b", [ex("bench", "Wyciskanie", [set(75, 8)]), ex("squat", "Przysiad", [set(95, 5)]), ex("latpd", "Ściąganie drążka", [set(50, 10)])]),
    S(1, "c", [ex("bench", "Wyciskanie", [set(80, 8)]), ex("latpd", "Ściąganie drążka", [set(55, 10)])]),
  ];
  let p = await open();
  await p.click('.tabs [data-view="prog"]');
  ok("P0 brak treningów: brak nowych bloków", !(await p.$(".pst")) && !(await p.$(".pall")));
  await p.context().close();

  p = await open(seed);
  await p.click('.tabs [data-view="prog"]');
  await p.waitForTimeout(300);
  const t = await p.evaluate(() => pstTydz(sessions));
  ok("P1 tydzień: liczy tylko bieżący tydzień", t.cur.tr <= 1 && t.cur.sets >= 0, t);
  const R = await p.evaluate(() => pstRekordy(sessions).map((r) => r.k + ":" + r.date));
  ok("P2 rekordy: tylko poprawa względem poprzedniego najlepszego (bench x3, latpd x1, squat x1)", R.filter((x) => x.startsWith("bench")).length === 3 && R.filter((x) => x.startsWith("latpd")).length === 1 && R.filter((x) => x.startsWith("squat")).length === 1, R);
  ok("P3 blok „Ostatnie rekordy” widoczny z 'dotąd'", /Ostatnie rekordy/.test(await p.textContent("#prog")) && /dotąd/.test(await p.textContent(".prec")));
  const g = await p.evaluate(() => pstPartie(sessions).map((x) => x.g + ":" + x.n));
  ok("P4 partie z 4 tygodni: Klatka 3 serie (trening sprzed 35 dni nie liczy się)", g.includes("Klatka:3") && g.includes("Nogi:2"), g);
  ok("P5 lista wszystkich ćwiczeń zwinięta w <details>", !!(await p.$("details.pall")) && !(await p.$eval("details.pall", (e) => e.open)));
  ok("P6 siła względem masy ciała (ławka 80 kg → ok. 1,x×)", /× masa ciała/.test(await p.textContent(".sila")), await p.textContent(".sila"));
  // cele
  await p.click("#goalEdit");
  await p.fill("#goalIn", "100");
  await p.click("#goalSave");
  await p.waitForTimeout(200);
  const gt = await p.textContent(".goal");
  ok("P7 cel 100 kg: pasek i procent (80 kg = 80%)", /100 kg/.test(gt) && /80%/.test(gt), gt);
  ok("P8 cel zapisany w localStorage", (await p.evaluate(() => JSON.parse(localStorage.goradamian_goals).bench)) === 100);
  await p.click("#goalEdit"); await p.click("#goalDel"); await p.waitForTimeout(150);
  ok("P9 usunięcie celu", !!(await p.$("#goalEdit")) && !/Cel:/.test(await p.textContent(".goal")));
  await p.click("#goalEdit"); await p.fill("#goalIn", "abc"); await p.click("#goalSave");
  ok("P10 zły cel odrzucony", /Wpisz cel/.test(await p.textContent("#toast")));
  ok("P11 brak błędów", !p.errs.length && !(await p.evaluate(() => BLEDY.length)), [p.errs, await p.evaluate(() => BLEDY)]);
  await p.context().close();

  // ranking: karta „Razem”
  p = await open(seed);
  const rz = await p.evaluate(() => {
    const m = (n, w, pw, me) => ({ name: n, me, w: { sets: 20, kg: w, tr: 3 }, pw: { sets: 18, kg: pw, tr: 2 } });
    return [rankRazemBlock([m("Michał", 9000, 8000), m("Damian", 7000, 6000, true), m("Mateusz", 3000, 2900)]), rankRazemBlock([m("Michał", 9000, 8000)])];
  });
  ok("R1 karta Razem: cel, skok +16% (Damian) i wspólny pasek", /Wspólny cel/.test(rz[0]) && /Damian/.test(rz[0]) && /\+17%/.test(rz[0]), rz[0]);
  ok("R2 jedna osoba: brak karty", rz[1] === "");
  await p.context().close();
  await b.close();
})();
