// Wersja 16: cel z przyciskiem „Wstaw” w podpowiedzi i „Nowy rekord!” na karcie w trakcie treningu.
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
const sets = (kg, rs) => rs.map((r) => ({ kg: String(kg), r: String(r) }));
const ses = (id, ex) => ({ id, date: daysAgo(3), day: "PN", week: 1, created: Date.now() - 3 * 864e5, bw2: 1, ex });

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
        if (s) localStorage.setItem("goradamian_sessions", JSON.stringify(s));
      },
      [seed || null]
    );
    const p = await c.newPage();
    p.errs = [];
    p.on("pageerror", (x) => p.errs.push(x.message));
    p.on("dialog", (d) => d.dismiss().catch(() => {}));
    await p.goto("file://" + path.join(ROOT, "damian", "index.html"));
    await p.waitForTimeout(400);
    await p.click("#welcomeOk", { timeout: 1500 }).catch(() => {});
    await p.click("#bmLater", { timeout: 800 }).catch(() => {});
    await p.evaluate(() => [...document.querySelectorAll("#seg button")].find((x) => x.textContent.startsWith("PN")).click());
    await p.waitForTimeout(200);
    return p;
  };
  const okSet = async (p, k, i, kg, r) => {
    await p.fill("#" + k + "_kg_" + i, String(kg));
    await p.fill("#" + k + "_r_" + i, String(r));
    await p.click('.ok[data-k="' + k + '"][data-i="' + i + '"]');
    await p.click("#restX", { timeout: 600 }).catch(() => {});
  };

  // ---- cel + „Wstaw”: wszystkie serie na górze zakresu → +2,5 kg ----
  let p = await open([ses("a", [{ k: "bench", n: "Wyciskanie sztangi na ławce płaskiej", sets: sets(80, [8, 8, 8, 8]) }, { k: "latraise", n: "Unoszenie hantli bokiem", sets: sets(10, [15, 15, 15, 15]) }])]);
  const sug = await p.textContent('[data-card="bench"] .sug');
  ok("P1 podpowiedź: dziś 82,5 kg + przycisk „Wstaw 82,5 kg × 6”", /82,5 kg/.test(sug) && /Wstaw 82,5 kg × 6/.test(sug), sug);
  ok("P2 przy hantlach (następne po 24 kg) brak przycisku Wstaw", /cięższe hantle/.test(await p.textContent('[data-card="latraise"] .sug')) && !(await p.$('[data-card="latraise"] .sugb')));
  await p.click('[data-card="bench"] .sugb');
  const ph = await p.$$eval('[id^="bench_kg_"]', (e) => e.map((x) => x.placeholder + "|" + x.value));
  const pr = await p.$$eval('[id^="bench_r_"]', (e) => e.map((x) => x.placeholder + "|" + x.value));
  ok("P3 Wstaw: kg i powt. jako szary podgląd, pola nadal puste", ph.every((x) => x === "82,5|") && pr.every((x) => x === "6|"), [ph, pr]);
  ok("P4 przycisk potwierdza i się blokuje", (await p.textContent('[data-card="bench"] .sugb')).includes("wstawiono") && (await p.isDisabled('[data-card="bench"] .sugb')));
  ok("P5 kalkulator talerzy widzi wstawiony ciężar", /25 \+ 5 \+ 1,25/.test(await p.textContent("#bench_pl")), await p.textContent("#bench_pl"));
  await p.click('.ok[data-k="bench"][data-i="0"]');
  await p.click("#restX", { timeout: 600 }).catch(() => {});
  ok("P6 ✓ przepisuje podgląd do pola (82,5 × 6)", (await p.inputValue("#bench_kg_0")) === "82,5" && (await p.inputValue("#bench_r_0")) === "6");
  ok("P7 82,5 × 6 to jeszcze nie rekord (80 × 8 jest mocniejsze) – tak jak w podsumowaniu", await p.isHidden("#bench_prl"));

  // ---- Nowy rekord ----
  await okSet(p, "bench", 1, 85, 8);
  const banner = await p.textContent("#bench_prl");
  ok("P8 85 × 8 po 80 × 8: baner „Nowy rekord!” z poprzednim wynikiem", !(await p.isHidden("#bench_prl")) && /Nowy rekord/.test(banner) && /85 kg × 8/.test(banner) && /dotąd 80 kg × 8/.test(banner), banner);
  await okSet(p, "bench", 2, 85, 8);
  ok("P9 kolejna taka sama seria: baner zostaje (bez zmiany)", !(await p.isHidden("#bench_prl")) && /85 kg × 8/.test(await p.textContent("#bench_prl")));
  await p.click('.ok[data-k="bench"][data-i="1"]');
  await p.click('.ok[data-k="bench"][data-i="2"]');
  ok("P10 odznaczenie serii z rekordem chowa baner", await p.isHidden("#bench_prl"));
  await p.click('.ok[data-k="bench"][data-i="1"]');
  await okSet(p, "bench", 3, 85, 8);
  await p.click('.ok[data-k="bench"][data-i="2"]');
  await p.waitForTimeout(150);
  const cs = await p.textContent('[data-card="bench"] .csum');
  ok("P11 po skończeniu ćwiczenia zwinięta linia ma ✓🏆", /✓🏆/.test(cs), cs);
  await p.click("#finish");
  ok("P12 podsumowanie zgadza się z banerem (to samo ćwiczenie jako nowy rekord)", /Wyciskanie sztangi na ławce płaskiej/.test(await p.textContent("#finPR")) && /85 kg × 8/.test(await p.textContent("#finPR")), await p.textContent("#finPR"));
  await p.keyboard.press("Escape");
  ok("P13 brak błędów", !p.errs.length && !(await p.evaluate(() => BLEDY.length)), [p.errs, await p.evaluate(() => BLEDY)]);
  await p.context().close();

  // ---- bez wcześniejszego wyniku nie ma rekordu; „zostań przy” z celem powtórzeń ----
  p = await open([ses("b", [{ k: "bench", n: "Wyciskanie sztangi na ławce płaskiej", sets: sets(80, [6, 6, 7, 6]) }])]);
  const s2 = await p.textContent('[data-card="bench"] .sug');
  ok("P14 „Zostań przy 80 kg” + Wstaw 80 kg × 7 (najsłabsza seria 6 + 1)", /Zostań przy 80 kg/.test(s2) && /Wstaw 80 kg × 7/.test(s2), s2);
  await p.click('[data-card="ohp"] .ok[data-i="0"]').catch(() => {});
  ok("P15 ćwiczenie bez historii: ✓ nie daje „rekordu”", await (async () => { await okSet(p, "ohp", 0, 40, 8); return p.isHidden("#ohp_prl"); })());
  await p.context().close();
  await b.close();
})();
