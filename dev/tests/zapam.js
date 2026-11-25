// Wersja 18: pytanie przy „Zakończ” o zapamiętanie zmian w planie (zamiana/dodanie/usunięcie/serie/kolejność) i wybór motywu.
const { chromium } = require("playwright");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const ok = (n, c, i) => console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  → " + JSON.stringify(i)));
(async () => {
  const b = await chromium.launch();
  const open = async () => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } });
    await c.route(/script\.google\.com|fonts\./, (r) => r.abort());
    await c.addInitScript(() => {
      if (sessionStorage.s) return;
      sessionStorage.s = 1;
      localStorage.setItem("goradamian_welcome", "1");
      localStorage.setItem("goradamian_lastbk", String(Date.now() + 1e9));
      localStorage.setItem("goradamian_bmW", JSON.stringify("2000-1-1"));
    });
    const p = await c.newPage();
    p.errs = [];
    p.on("pageerror", (x) => p.errs.push(x.message));
    p.on("dialog", (d) => d.dismiss().catch(() => {}));
    await p.goto("file://" + path.join(ROOT, "damian", "index.html"));
    await p.waitForTimeout(500);
    await p.evaluate(() => [...document.querySelectorAll("#seg button")].find((x) => x.textContent.startsWith("PN")).click());
    await p.waitForTimeout(200);
    return p;
  };
  const planKeys = (p) => p.evaluate(() => PLAN.PN.ex.filter((e) => !e.kind).map((e) => e.k + ":" + e.s).join(","));
  const fillOne = async (p) => {
    await p.fill('#exList input[id$="_kg_0"] >> nth=0', "50");
    await p.fill('#exList input[id$="_r_0"] >> nth=0', "8");
  };
  const done = async (p) => {
    await p.click("#save");
    await p.waitForTimeout(250);
    await p.click("#ssLater", { timeout: 1200 }).catch(() => {});
    await p.click("#tipX", { timeout: 1200 }).catch(() => {});
  };
  const change = async (p) => {
    // zamiana ławki, dodanie łydek, usunięcie OHP, dodatkowa seria przy wyciskaniu na skosie
    await p.evaluate(() => {
      const to = ALT.bench.find((a) => CATALOG[a]);
      document.querySelector('[data-swap="bench"][data-to="' + to + '"]').click();
    });
    await p.selectOption("#catalog", "calf");
    await p.click("#addEx");
    await p.waitForTimeout(150);
    await p.click('[data-drop="ohp"]');
    await p.click('[data-drop="ohp"]');
    await p.waitForTimeout(150);
    await p.click('[data-add="latraise"]');
    await p.waitForTimeout(150);
  };

  // ---- bez zmian: bez pytania ----
  let p = await open();
  await fillOne(p);
  await p.click("#finish");
  ok("Z1 bez zmian w planie – bez pytania", await p.isHidden("#finOrd"));
  await p.context().close();

  // ---- zmiany + „Tylko dziś” ----
  p = await open();
  const before = await planKeys(p);
  await change(p);
  await fillOne(p);
  await p.click("#finish");
  const t = await p.textContent("#finOrdT");
  ok("Z2 pytanie pokazuje wszystkie zmiany", !(await p.isHidden("#finOrd")) && /Dodane: .*Wspięcia/i.test(t) && /Usunięte: .*nad głowę/i.test(t) && /Zamiana: .* → /.test(t) && /Liczba serii: .*\+1/.test(t), t);
  ok("Z3 nagłówek ogólny, domyślnie „Tylko dziś”", /Zmieniłeś plan/.test(await p.textContent("#finOrdH")) && (await p.getAttribute("#ordToday", "aria-pressed")) === "true");
  await done(p);
  ok("Z4 „Tylko dziś”: plan bez zmian", (await planKeys(p)) === before, [before, await planKeys(p)]);
  ok("Z5 …a następny trening znów ma plan z kodu", await p.evaluate(() => (S().added || []).length === 0 && Object.keys(S().swaps).length === 0 && S().removed.length === 0));
  await p.context().close();

  // ---- zmiany + „Zapamiętaj w planie” ----
  p = await open();
  await change(p);
  await fillOne(p);
  await p.click("#finish");
  await p.click("#ordPerm");
  await done(p);
  const after = await p.evaluate(() => ({
    keys: PLAN.PN.ex.filter((e) => !e.kind).map((e) => e.k),
    s: Object.fromEntries(PLAN.PN.ex.map((e) => [e.k, e.s])),
    sw: PLAN.PN.ex.some((e) => e.swapOf || e.added),
    la: (JSON.parse(localStorage.getItem("goradamian_plan")).PN.ex.find((e) => e.k === "latraise") || {}).s,
  }));
  ok("Z6 plan zapamiętany: brak OHP, ławka zamieniona, łydki na końcu", !after.keys.includes("ohp") && !after.keys.includes("bench") && after.keys[after.keys.length - 1] === "calf", after.keys);
  ok("Z7 dodatkowa seria zapamiętana (latraise 3 → 4) i zapisana w telefonie", after.s.latraise === 4 && after.la === 4 && !after.sw, after);
  ok("Z8 nowe ćwiczenia mają pełne dane (nazwa, zakres, serie)", await p.evaluate(() => PLAN.PN.ex.every((e) => e.k && e.n && e.r && e.s > 0)));
  await p.evaluate(() => [...document.querySelectorAll("#seg button")].find((x) => x.textContent.startsWith("PN")).click());
  await p.waitForTimeout(200);
  ok("Z9 po zapisie ekran PN pokazuje zapamiętany plan (łydki są, OHP nie ma)", await p.evaluate(() => { const k = exList().map((e) => e.k); return k.includes("calf") && !k.includes("ohp"); }));
  await p.reload();
  await p.waitForTimeout(400);
  ok("Z10 plan zostaje po ponownym otwarciu aplikacji", await p.evaluate(() => PLAN.PN.ex.some((e) => e.k === "calf") && !PLAN.PN.ex.some((e) => e.k === "ohp")));
  ok("Z11 brak błędów", !p.errs.length && !(await p.evaluate(() => BLEDY.length)), [p.errs, await p.evaluate(() => BLEDY)]);
  await p.context().close();

  // ---- usunięcie wszystkiego nie zostawia pustego planu ----
  p = await open();
  await p.evaluate(() => { const st = S(); st.removed = PLAN.PN.ex.map((e) => e.k); renderEx(); });
  const kept = await p.evaluate(() => planKeep("PN"));
  ok("Z12 plan bez ćwiczeń nie zostaje zapamiętany", kept === false && (await p.evaluate(() => PLAN.PN.ex.length)) > 0);
  await p.context().close();

  // ---- motyw ----
  p = await open();
  const th = () => p.evaluate(() => document.documentElement.dataset.theme || "auto");
  await p.click('.tabs [data-view="set"]');
  ok("M1 domyślnie „Automatycznie”", (await p.isChecked("#themeAuto")) && (await th()) === "auto");
  await p.check("#themeDark");
  ok("M2 „Zawsze ciemna” działa od razu", (await th()) === "dark" && (await p.evaluate(() => getComputedStyle(document.body).backgroundColor)) !== "rgb(245, 242, 237)");
  await p.reload();
  await p.waitForTimeout(400);
  ok("M3 wybór zostaje po ponownym otwarciu", (await th()) === "dark");
  await p.click('.tabs [data-view="set"]');
  ok("M4 w Ustawieniach zaznaczone „Zawsze ciemna”", await p.isChecked("#themeDark"));
  await p.check("#themeLight");
  ok("M5 „Zawsze jasna”", (await th()) === "light" && (await p.evaluate(() => getComputedStyle(document.body).backgroundColor)) === "rgb(245, 242, 237)");
  await p.check("#themeAuto");
  ok("M6 z powrotem „Automatycznie”", (await th()) === "auto");
  await p.context().close();
  await b.close();
})();
