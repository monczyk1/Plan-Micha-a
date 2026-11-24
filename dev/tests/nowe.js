// Wersja 13: kalkulator talerzy, odznaki (kamienie milowe), edycja i usuwanie treningu z ekranu treningu, notatka, duplikat.
const { chromium } = require("playwright");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const ok = (n, c, i) => console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  → " + JSON.stringify(i)));
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};
const S = (date, day, ex, i) => ({ id: "t" + i, date, day, week: 1, created: Date.parse(date) + i, bw2: 1, ex });
const st = (k, sets) => ({ k, n: k, sets: sets.map(([kg, r]) => ({ kg: String(kg), r: String(r) })) });

(async () => {
  const b = await chromium.launch();
  const open = async (seed) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "pl-PL" });
    await c.route(/script\.google\.com|fonts\.(googleapis|gstatic)/, (r) => r.abort());
    await c.addInitScript(
      ([s]) => {
        if (sessionStorage.s) return;
        sessionStorage.s = 1;
        localStorage.setItem("goradamian_welcome", "1");
        localStorage.setItem("goradamian_lastbk", String(Date.now() + 1e9));
        localStorage.setItem("goradamian_bm", JSON.stringify([{ d: "2026-01-01", kg: 80 }]));
        localStorage.setItem("goradamian_bmask", "9999-01-01");
        if (s) localStorage.setItem("goradamian_sessions", JSON.stringify(s));
      },
      [seed || null]
    );
    const p = await c.newPage();
    p.errs = [];
    p.on("pageerror", (e) => p.errs.push(e.message));
    p.on("dialog", (d) => d.dismiss().catch(() => {}));
    await p.goto("file://" + path.join(ROOT, "damian", "index.html"));
    await p.waitForTimeout(400);
    await p.click("#welcomeOk", { timeout: 1500 }).catch(() => {});
    await p.click("#bmLater", { timeout: 800 }).catch(() => {});
    return p;
  };
  const pick = (p, d) => p.evaluate((d) => [...document.querySelectorAll("#seg button")].find((b) => b.textContent.startsWith(d)).click(), d);

  // ---- Talerze: obliczenia ----
  let p = await open();
  const T = await p.evaluate(() => ({
    a: platesFor(31.25, PLATES_ALL),
    b: platesFor(31.25, [20, 15, 10, 5, 2.5, 1.25]),
    c: platesFor(15, [25, 20, 15, 10]),
    t82: platesText("82,5"),
    t20: platesText("20"),
    t15: platesText("15"),
    tNo: (() => {
      localStorage.setItem(P + "plates", JSON.stringify({ off: [25, 15, 5, 2.5, 1.25] }));
      const t = platesText("82,5");
      localStorage.removeItem(P + "plates");
      return t;
    })(),
  }));
  ok("T1 82,5 kg → na stronę 25 + 5 + 1,25", JSON.stringify(T.a) === "[25,5,1.25]", T.a);
  ok("T2 bez 25 → 20 + 10 + 1,25", JSON.stringify(T.b) === "[20,10,1.25]", T.b);
  ok("T3 najmniej talerzy (15 = jeden talerz 15)", JSON.stringify(T.c) === "[15]", T.c);
  ok("T4 tekst z rozpiską", /25 \+ 5 \+ 1,25/.test(T.t82) && /2 × 31,25/.test(T.t82), T.t82);
  ok("T5 sama sztanga / mniej niż sztanga", /Sama sztanga/.test(T.t20) && /Mniej niż sama sztanga/.test(T.t15), [T.t20, T.t15]);
  ok("T6 brak talerzy → najbliższe możliwe ciężary", /nie da się/.test(T.tNo) && /80 kg/.test(T.tNo) && /100 kg/.test(T.tNo), T.tNo);

  // ---- Talerze: na karcie i w Ustawieniach ----
  await pick(p, "PN");
  await p.fill("#bench_kg_0", "82,5");
  await p.waitForTimeout(100);
  let pl = await p.textContent("#bench_pl");
  ok("T7 pod wyciskaniem sztangi: 25 + 5 + 1,25", /25 \+ 5 \+ 1,25/.test(pl) && !(await p.isHidden("#bench_pl")), pl);
  ok("T8 przy hantlach brak kalkulatora", !(await p.$("#incline_pl")));
  await p.focus("#bench_kg_1");
  pl = await p.textContent("#bench_pl");
  ok("T9 kolejna seria (podpowiedź 82,5) też pokazuje talerze", /25 \+ 5 \+ 1,25/.test(pl), pl);
  await p.click('.tabs [data-view="set"]');
  await p.click('#plSet [data-plate="25"]');
  ok("T10 odznaczony talerz 25", (await p.getAttribute('#plSet [data-plate="25"]', "aria-pressed")) === "false");
  await p.click('.tabs [data-view="train"]');
  pl = await p.textContent("#bench_pl");
  ok("T11 bez 25: podpowiedź 20 + 10 + 1,25", /20 \+ 10 \+ 1,25/.test(pl), pl);
  await p.reload();
  await p.waitForTimeout(400);
  ok("T12 ustawienie talerzy zostaje po ponownym otwarciu", (await p.evaluate(() => platesOn().includes(25))) === false);
  ok("T13 brak błędów", !p.errs.length && !(await p.evaluate(() => BLEDY.length)), [p.errs, await p.evaluate(() => BLEDY)]);
  await p.context().close();

  // ---- Odznaki ----
  const hist = [];
  for (let w = 0; w < 4; w++) hist.push(S(daysAgo(7 * w + 1), "PN", [st("bench", [[95, 3], [90, 5]]), st("pull", [[0, 10]])], w + 1));
  p = await open(hist);
  const O = await p.evaluate(() => {
    const m = Object.fromEntries(odzStan(sessions).map((x) => [x.o.id, x]));
    return { w4: m.w4.ok, p10: m.p10.ok, b100: m.b100.ok, brak: odzBrak(m.b100), t10: odzBrak(m.t10), n: ODZ.length };
  });
  ok("O1 4 tygodnie z rzędu → odznaka", O.w4, O);
  ok("O2 10 podciągnięć w serii → odznaka", O.p10, O);
  ok("O3 ławka 95 kg: do 100 brakuje 5 kg", !O.b100 && O.brak === "brakuje 5 kg", O);
  ok("O4 licznik treningów 4 / 10", O.t10 === "4 / 10", O);
  await p.click('.tabs [data-view="prog"]');
  const prog = await p.textContent("#prog");
  ok("O5 Postępy: blok Odznaki z licznikiem", /Odznaki/.test(prog) && /2 \/ 12/.test(prog), prog.slice(0, 200));
  await p.click('.tabs [data-view="train"]');
  await pick(p, "PN");
  await p.fill("#bench_kg_0", "100");
  await p.fill("#bench_r_0", "2");
  await p.click("#finish");
  await p.waitForTimeout(300);
  const fin = await p.textContent("#finCmp");
  ok("O6 podsumowanie: nowy kamień milowy 100 kg na ławce", /NOWY KAMIEŃ MILOWY/.test(fin) && /100 kg na ławce/.test(fin), fin);
  ok("O7 bez fałszywych nowych odznak (4 tyg. już była)", !/bez przerwy/.test(fin), fin);
  ok("O8 brak błędów", !p.errs.length, p.errs);
  await p.context().close();

  // ---- Edycja i usuwanie treningu z ekranu treningu ----
  p = await open([S(daysAgo(1), "PN", [st("bench", [[80, 5]])], 1)]);
  await p.click(".addt");
  await p.fill("#ntName", "Nogi 1");
  await p.evaluate(() => document.querySelector("#ntList input[type=checkbox]").click());
  await p.click("#ntGo");
  await p.waitForTimeout(200);
  const days0 = await p.evaluate(() => DAYS.length);
  ok("E1 pod kafelkami: Edytuj i Usuń dla „Nogi 1”", /Edytuj „Nogi 1”/.test(await p.textContent("#dayTools")) && !!(await p.$("#dtDel")));
  await p.click("#dtDel");
  ok("E2 pierwsze stuknięcie tylko pyta", /Na pewno/.test(await p.textContent("#dtDel")) && (await p.evaluate(() => DAYS.length)) === days0);
  await p.click("#dtDel");
  await p.waitForTimeout(150);
  const afterDel = await p.evaluate(() => ({ n: DAYS.length, has: DAYS.some((d) => PLAN[d].name === "Nogi 1"), ses: sessions.length }));
  ok("E3 drugie stuknięcie usuwa trening, historia zostaje", afterDel.n === days0 - 1 && !afterDel.has && afterDel.ses === 1, afterDel);
  ok("E4 pasek „Cofnij”", !(await p.isHidden("#undo")) && /Usunięto/.test(await p.textContent("#undo")));
  await p.click("#undoBtn");
  await p.waitForTimeout(150);
  ok("E5 Cofnij przywraca trening", await p.evaluate(() => DAYS.some((d) => PLAN[d].name === "Nogi 1")));
  await p.reload();
  await p.waitForTimeout(400);
  ok("E6 przywrócony trening zostaje po ponownym otwarciu", await p.evaluate(() => DAYS.some((d) => PLAN[d].name === "Nogi 1")));
  await pick(p, "PT");
  await p.click("#dtDel");
  await p.click("#dtDel");
  await p.waitForTimeout(150);
  ok("E7 dzień planu też da się usunąć (zostają inne)", !(await p.evaluate(() => DAYS.includes("PT"))));
  await p.click("#undoBtn");
  ok("E8 i przywrócić", await p.evaluate(() => DAYS.includes("PT")));

  // ---- Edytor: notatka, duplikat, wyjście bez zapisu ----
  await pick(p, "PN");
  await p.click("#dtEdit");
  ok("E9 Edytuj otwiera edytor na tym treningu", !(await p.isHidden("#edSheet")) && (await p.getAttribute("#edTabs [aria-pressed=true]", "data-ed")) === "PN");
  const bi = await p.evaluate(() => PLAN.PN.ex.findIndex((e) => e.k === "bench"));
  await p.fill('[data-f="note"][data-i="' + bi + '"]', "ławka nr 2, stojaki 5");
  await p.click("#edX");
  ok("E10 Anuluj przy zmianach najpierw pyta", !(await p.isHidden("#edSheet")) && /bez zapisu/.test(await p.textContent("#edX")));
  await p.click("#edSave");
  await p.waitForTimeout(150);
  ok("E11 notatka widoczna na karcie ćwiczenia", /ławka nr 2, stojaki 5/.test(await p.textContent('[data-card="bench"]')));
  await p.click("#dtEdit");
  await p.click("#edDup");
  await p.click("#edSave");
  await p.waitForTimeout(150);
  const dup = await p.evaluate(() => {
    const d = DAYS.find((d) => /kopia/.test(PLAN[d].name || ""));
    return d ? { name: PLAN[d].name, n: PLAN[d].ex.length, src: PLAN.PN.ex.length, warm: !!PLAN[d].warm } : null;
  });
  ok("E12 duplikat treningu jako dodatkowy, te same ćwiczenia", dup && dup.n === dup.src && dup.warm, dup);
  await p.click("#dtEdit");
  await p.click("#edX");
  ok("E13 Anuluj bez zmian zamyka od razu", await p.isHidden("#edSheet"));
  ok("E14 brak błędów", !p.errs.length && !(await p.evaluate(() => BLEDY.length)), [p.errs, await p.evaluate(() => BLEDY)]);
  await b.close();
})();
