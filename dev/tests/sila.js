// Wersja 15: wykres siły w ćwiczeniu (kod/sila.js) i „Wyślij raport” (kod/raport.js).
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
const set = (kg, r) => ({ kg: String(kg), r: String(r) });
const ex = (k, n, sets) => ({ k, n, sets });
const S = (w, i, exs) => ({ id: "t" + w + "_" + i, date: daysAgo(7 * w), day: "PN", week: 1, created: Date.now() - w * 7 * 864e5, bw2: 1, ex: exs });

(async () => {
  const b = await chromium.launch();
  const open = async (seed, extra) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "pl-PL" });
    await c.route(/script\.google\.com|fonts\.(googleapis|gstatic)/, (r) => r.abort());
    await c.addInitScript(
      ([s, e]) => {
        if (sessionStorage.s) return;
        sessionStorage.s = 1;
        delete navigator.share;
        localStorage.setItem("goradamian_welcome", "1");
        localStorage.setItem("goradamian_lastbk", String(Date.now() + 1e9));
        localStorage.setItem("goradamian_bm", JSON.stringify([{ d: "2026-01-01", kg: 80 }]));
        if (s) localStorage.setItem("goradamian_sessions", JSON.stringify(s));
        if (e) for (const k in e) localStorage.setItem(k, e[k]);
      },
      [seed || null, extra || null]
    );
    const p = await c.newPage();
    p.errs = [];
    p.on("pageerror", (x) => p.errs.push(x.message));
    p.on("dialog", (d) => d.dismiss().catch(() => {}));
    await p.goto("file://" + path.join(ROOT, "damian", "index.html"));
    await p.waitForTimeout(400);
    await p.click("#welcomeOk", { timeout: 1500 }).catch(() => {});
    await p.click("#bmLater", { timeout: 800 }).catch(() => {});
    return p;
  };

  // ---- obliczenia ----
  let p = await open();
  const C = await p.evaluate(() => ({ a: silaE1(85, 5), b: silaE1(100, 1), c: silaE1(60, 20), d: silaE1(0, 8), e: silaE1(80, 8) }));
  ok("S1 szacowany max: 85×5 ≈ 99; 100×1 = 100; 80×8 = 101,5", C.a === 99 && C.b === 100 && C.e === 101.5, C);
  ok("S2 serie powyżej 12 powt. i bez ciężaru nie liczą się", C.c === 0 && C.d === 0, C);
  await p.click('.tabs [data-view="prog"]');
  ok("S3 brak treningów: brak bloku „Siła w ćwiczeniu”", !(await p.$(".sila")));
  await p.context().close();

  // ---- wykres, zastój, wzrosty ----
  const hist = [];
  const bench = { 8: 70, 7: 72.5, 6: 75, 5: 80, 4: 80, 3: 80, 2: 80, 1: 80, 0: 80 };
  const ohp = { 7: 40, 6: 40, 5: 42.5, 4: 42.5, 3: 45, 2: 47.5, 1: 50, 0: 50 };
  for (let w = 0; w <= 8; w++) {
    const e = [ex("bench", "Wyciskanie sztangi na ławce płaskiej", [set(bench[w], 5), set(bench[w] - 10, 8)])];
    if (ohp[w]) e.push(ex("ohp", "Wyciskanie nad głowę", [set(ohp[w], 6)]));
    e.push(ex("chinup", "Podciąganie", [set(0, 10)]));
    hist.push(S(w, 0, e));
  }
  p = await open(hist);
  await p.click('.tabs [data-view="prog"]');
  await p.waitForTimeout(300);
  const opts = await p.$$eval("#silaSel option", (o) => o.map((x) => x.value));
  ok("W1 lista ćwiczeń: ławka i OHP, bez podciągania bez ciężaru", opts.includes("bench") && opts.includes("ohp") && !opts.includes("chinup"), opts);
  ok("W2 pierwsze jest ćwiczenie trenowane najczęściej (ławka)", opts[0] === "bench", opts);
  const mx = await p.textContent(".silamax b");
  ok("W3 szacowany max ławki 93,5 kg (80×5)", /93,5 kg/.test(mx), mx);
  ok("W4 wykres: linia, punkty i opis", (await p.$$(".silaw .sd")).length >= 8 && !!(await p.$(".silaw .sp")) && /Wykres: szacowany max/.test(await p.getAttribute(".silaw", "aria-label")));
  const z = await p.textContent(".silaz");
  ok("W5 zastój: „od 5 tygodni” + propozycje", /Zastój od 5 tygodni/.test(z) && /tydzień lżejszy/.test(z), z);
  ok("W6 zaznaczony zakres zastoju na wykresie", !!(await p.$(".silaw .sz")) && /5 tyg\. bez rekordu/.test(await p.textContent(".silaw")));
  const g = await p.textContent(".silag");
  ok("W7 największy wzrost w 8 tygodni: OHP +12 kg", /Wyciskanie nad głowę/.test(g) && /\+12 kg/.test(g), g);
  await p.selectOption("#silaSel", "ohp");
  await p.waitForTimeout(150);
  ok("W8 zmiana ćwiczenia: OHP 60 kg i brak zastoju", /60 kg/.test(await p.textContent(".silamax b")) && !(await p.$(".silaz")), await p.textContent(".silamax b"));
  ok("W9 brak błędów", !p.errs.length && !(await p.evaluate(() => BLEDY.length)), [p.errs, await p.evaluate(() => BLEDY)]);
  await p.context().close();

  // ---- dawno nietrenowane to nie zastój ----
  const stare = [];
  for (let w = 20; w >= 12; w--) stare.push(S(w, 0, [ex("bench", "Wyciskanie sztangi na ławce płaskiej", [set(w === 20 ? 80 : 70, 5)])]));
  p = await open(stare);
  const zz = await p.evaluate(() => silaZastoj(silaTygodnie(sessions, "bench")));
  ok("W10 ćwiczenie nietrenowane od miesięcy to nie „zastój”", zz === 0, zz);
  await p.context().close();

  // ---- raport ----
  p = await open(hist, { goradamian_cloud: JSON.stringify({ on: true, pin: "SEKRETNY-PIN-123" }) });
  await p.click('.tabs [data-view="set"]');
  await p.fill("#rapOpis", "Po zapisie nie widzę treningu");
  const t = await p.evaluate(() => raportTekst($("rapOpis").value));
  ok("R1 raport: osoba, wersja, telefon, treningi, chmura, opis", /Osoba: Damian · wersja \d+/.test(t) && /Telefon: /.test(t) && /Treningów w telefonie: 9/.test(t) && /Chmura: włączona/.test(t) && /Opis: Po zapisie nie widzę treningu/.test(t), t);
  ok("R2 raport NIE zawiera PIN-u, adresu chmury ani ćwiczeń", !/SEKRETNY|script\.google|Wyciskanie/.test(t), t);
  await p.click("#rapSend");
  await p.waitForTimeout(300);
  ok("R3 bez udostępniania: raport skopiowany albo pokazany do skopiowania", /skopiowany|skopiuj/i.test(await p.textContent("#toast")) || !(await p.isHidden("#rapPodglad")), await p.textContent("#toast"));
  ok("R4 bez błędów: brak czerwonej kropki", !(await p.$eval('.tabs [data-view="set"]', (e) => e.classList.contains("errdot"))) && (await p.isHidden("#rapBledy")));
  await p.evaluate(() => blad("zapis masy ciała", new Error("QuotaExceeded")));
  ok("R5 właściciel: po błędzie czerwona kropka i „Są błędy (1)”", (await p.$eval('.tabs [data-view="set"]', (e) => e.classList.contains("errdot"))) && /Są błędy \(1\)/.test(await p.textContent("#rapBledy")));
  const t2 = await p.evaluate(() => raportTekst(""));
  ok("R6 błąd trafia do raportu z godziną", /Błędy \(1\):/.test(t2) && /zapis masy ciała – QuotaExceeded/.test(t2), t2);
  await p.click("#rapBledy");
  ok("R7 „Są błędy” pokazuje treść raportu", !(await p.isHidden("#rapPodglad")) && /QuotaExceeded/.test(await p.inputValue("#rapPodglad")));
  await p.context().close();

  const c2 = await b.newContext({ viewport: { width: 390, height: 844 } });
  await c2.route(/script\.google\.com|fonts\./, (r) => r.abort());
  const m = await c2.newPage();
  await m.goto("file://" + path.join(ROOT, "mateusz", "index.html"));
  await m.waitForTimeout(400);
  await m.evaluate(() => blad("test", new Error("x")));
  ok("R8 zwykły użytkownik: bez czerwonej kropki, raport podpisany jego imieniem", !(await m.$eval('.tabs [data-view="set"]', (e) => e.classList.contains("errdot"))) && /Osoba: Mateusz/.test(await m.evaluate(() => raportTekst(""))));
  await c2.close();
  await b.close();
})();
