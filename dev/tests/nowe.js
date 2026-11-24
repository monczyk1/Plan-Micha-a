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
  const more = async (p) => {
    if (await p.isHidden("#dayMore")) await p.click("#moreBtn");
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
  await more(p);
  await p.click("#dtDel");
  ok("E2 pierwsze stuknięcie tylko pyta", /Na pewno/.test(await p.textContent("#dtDel")) && (await p.evaluate(() => DAYS.length)) === days0);
  await more(p);
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
  await more(p);
  await p.click("#dtDel");
  await more(p);
  await p.click("#dtDel");
  await p.waitForTimeout(150);
  ok("E7 dzień planu też da się usunąć (zostają inne)", !(await p.evaluate(() => DAYS.includes("PT"))));
  await p.click("#undoBtn");
  ok("E8 i przywrócić", await p.evaluate(() => DAYS.includes("PT")));

  // ---- Edytor: notatka, duplikat, wyjście bez zapisu ----
  await pick(p, "PN");
  await more(p);
  await p.click("#dtEdit");
  ok("E9 Edytuj otwiera edytor na tym treningu", !(await p.isHidden("#edSheet")) && (await p.getAttribute("#edTabs [aria-pressed=true]", "data-ed")) === "PN");
  const bi = await p.evaluate(() => PLAN.PN.ex.findIndex((e) => e.k === "bench"));
  await p.fill('[data-f="note"][data-i="' + bi + '"]', "ławka nr 2, stojaki 5");
  await p.click("#edX");
  ok("E10 Anuluj przy zmianach najpierw pyta", !(await p.isHidden("#edSheet")) && /bez zapisu/.test(await p.textContent("#edX")));
  await p.click("#edSave");
  await p.waitForTimeout(150);
  ok("E11 notatka widoczna na karcie ćwiczenia", /ławka nr 2, stojaki 5/.test(await p.textContent('[data-card="bench"]')));
  await more(p);
  await p.click("#dtEdit");
  await p.click("#edDup");
  await p.click("#edSave");
  await p.waitForTimeout(150);
  const dup = await p.evaluate(() => {
    const d = DAYS.find((d) => /kopia/.test(PLAN[d].name || ""));
    return d ? { name: PLAN[d].name, n: PLAN[d].ex.length, src: PLAN.PN.ex.length, warm: !!PLAN[d].warm } : null;
  });
  ok("E12 duplikat treningu jako dodatkowy, te same ćwiczenia", dup && dup.n === dup.src && dup.warm, dup);
  await more(p);
  await p.click("#dtEdit");
  await p.click("#edX");
  ok("E13 Anuluj bez zmian zamyka od razu", await p.isHidden("#edSheet"));
  ok("E14 brak błędów", !p.errs.length && !(await p.evaluate(() => BLEDY.length)), [p.errs, await p.evaluate(() => BLEDY)]);
  // ---- Wygląd (wersja 14): tylko bieżące ćwiczenie rozwinięte, „Więcej”, pasek postępu ----
  p = await open();
  await pick(p, "PN");
  const cards = () =>
    p.evaluate(() =>
      [...document.querySelectorAll("#exList .ex[data-card]")]
        .filter((c) => c.querySelector(".csum"))
        .map((c) => ({ k: c.dataset.card, cur: c.classList.contains("cur"), col: c.classList.contains("collapsed"), todo: c.classList.contains("todo"), done: c.classList.contains("alldone"), txt: (c.querySelector(".csum") || {}).textContent }))
    );
  let C = await cards();
  ok("F1 jedno ćwiczenie „teraz” rozwinięte (pierwsze)", C.length > 3 && C[0].cur && !C[0].col && C.filter((x) => x.cur).length === 1, C.map((x) => x.k + (x.cur ? "*" : "")));
  ok("F2 pozostałe zwinięte do jednej linii z planem", C.slice(1).every((x) => x.col && x.todo && /×/.test(x.txt)), C.slice(1));
  const k0 = C[0].k;
  await p.evaluate((k) => document.querySelectorAll('#exList .ok[data-k="' + k + '"]').forEach((b) => b.click()), k0);
  await p.click("#restX", { timeout: 800 }).catch(() => {});
  C = await cards();
  ok("F3 po skończeniu ćwiczenia bieżące przechodzi na następne", C[0].done && C[0].col && C[1].cur && !C[1].col && C.filter((x) => x.cur).length === 1, C.slice(0, 3));
  await p.click('#exList [data-card="' + C[3].k + '"] .csum');
  C = await cards();
  ok("F4 stuknięcie zwiniętego rozwija je", !C[3].col && C[1].cur, C.slice(0, 4).map((x) => x.k + (x.col ? "-" : "+")));
  const sum = await p.textContent("#sumTxt"),
    wd = await p.$eval("#pbar", (e) => e.style.width);
  ok("F5 pasek: „N / M serii” i wypełnienie", /^\d+ \/ \d+ serii ~\d+ min do końca/.test(sum) && parseInt(wd) > 0 && (await p.isHidden("#finishBar")), [sum, wd]);
  await p.evaluate(() => document.querySelectorAll("#exList .ok[data-k]").forEach((b) => b.getAttribute("aria-pressed") !== "true" && b.click()));
  await p.click("#restX", { timeout: 800 }).catch(() => {});
  ok("F6 wszystko zrobione: zielony pasek i „Zakończ trening” w pasku", !(await p.isHidden("#finishBar")) && (await p.$eval(".ptrack", (e) => e.classList.contains("full"))) && /wszystko zrobione/.test(await p.textContent("#sumTxt")), await p.textContent("#sumTxt"));
  await p.click("#finishBar");
  ok("F7 „Zakończ trening” z paska otwiera podsumowanie", !(await p.isHidden("#finSheet")));
  await p.keyboard.press("Escape");
  ok("F8 dolny pasek ma wysokość dla pytań nad nim", (await p.evaluate(() => parseInt(getComputedStyle(document.documentElement).getPropertyValue("--barh")) || 0)) > 80);
  ok("F9 domyślnie „Więcej” zwinięte, po stuknięciu T1… widoczne, zapamiętane", (await p.isHidden("#dayMore")) && /Więcej/.test(await p.textContent("#moreBtn")) && (await (async () => { await p.click("#moreBtn"); return !(await p.isHidden("#tgrid")) && /Mniej/.test(await p.textContent("#moreBtn")); })()));
  await p.reload();
  await p.waitForTimeout(400);
  ok("F10 „Więcej” zostaje otwarte po ponownym otwarciu", !(await p.isHidden("#dayMore")));
  await p.click('.tabs [data-view="set"]');
  ok("F11 Ustawienia: widok „tylko bieżące” zaznaczony", await p.isChecked("#optFocus1"));
  await p.check("#optFocus0");
  await p.click('.tabs [data-view="train"]');
  await pick(p, "PN");
  C = await cards();
  ok("F12 „Wszystkie rozwinięte”: żadne niezrobione ćwiczenie nie jest zwinięte ani wyróżnione", C.length > 3 && C.every((x) => !x.todo && !x.cur), C.map((x) => x.k + (x.col ? "-" : "+")));
  await p.reload();
  await p.waitForTimeout(400);
  ok("F13 wybrany widok zostaje po ponownym otwarciu", !(await p.evaluate(() => focusOn())));
  ok("F14 brak błędów", !p.errs.length && !(await p.evaluate(() => BLEDY.length)), [p.errs, await p.evaluate(() => BLEDY)]);
  await p.context().close();
  await b.close();
})();
