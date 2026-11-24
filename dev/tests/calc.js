// Szybki test obliczeń (kilka sekund): tonaż, serie, masa ciała, daty, wczytanie planu, profile osób.
// Nie potrzebuje serwerów – otwiera aplikację z dysku. Uruchom: ./run-tests.sh calc
// Gdy celowo zmieniasz zasadę liczenia, popraw oczekiwany wynik tutaj w tej samej zmianie.
const { chromium } = require("playwright");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const ok = (n, c, i) => console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  → " + JSON.stringify(i)));

(async () => {
  const b = await chromium.launch();
  const open = async (sub, init) => {
    const c = await b.newContext();
    await c.route(/script\.google\.com|fonts\.(googleapis|gstatic)/, (r) => r.abort()); // nigdy prawdziwy arkusz
    if (init) await c.addInitScript(init);
    const p = await c.newPage();
    p.errs = [];
    p.on("pageerror", (e) => p.errs.push(e.message));
    await p.goto("file://" + path.join(ROOT, sub, "index.html"));
    await p.waitForTimeout(300);
    return p;
  };

  // ---- Michał (adres główny): zasady tonażu ----
  let p = await open("");
  const R = await p.evaluate(() => {
    const f = (k) => tonRule(k);
    const st = (k, sets) => ({ k, n: k, sets: sets.map(([kg, r, w]) => (w ? { kg: String(kg), r: String(r), w: true } : { kg: String(kg), r: String(r) })) });
    return {
      prefix: P,
      days: DAYS.join(","),
      bench: f("bench"),
      incline: f("incline"),
      lunge: f("lunge"),
      cablecross: f("cablecross"),
      platepress: f("platepress"),
      dbrow: f("dbrow"),
      pull: f("pull"),
      pushup: f("pushup"),
      plank: f("plank"),
      farmer: f("farmer"),
      benchmax: f("benchmax"),
      // sztanga 60×8 + rozgrzewka R 40×5 (liczy się) = 680; hantle 20×10 ×2 = 400; pompki się nie liczą
      vol1: volOf({ date: "2026-11-20", ex: [st("bench", [[40, 5, 1], [60, 8]]), st("incline", [[20, 10]]), st("pushup", [[0, 15]])] }),
      // literówka 6000 kg nie liczy się
      volTypo: volOf({ date: "2026-11-20", ex: [st("bench", [[6000, 8], [60, 8]])] }),
      // cardio / core z planu (kind) się nie liczy
      volKind: volOf({ date: "2026-11-20", ex: [Object.assign(st("bench", [[60, 8]]), { kind: "core" })] }),
      sets: setsOfS({ ex: [st("bench", [[40, 5, 1], [60, 8], ["", ""]]), Object.assign(st("plank", [["", "30"]]), { kind: "core" })] }),
      num: [num("7,5"), num(""), num(null), num("abc")],
      topRep: [topRep("8–12"), topRep("6-8"), topRep("max")],
      unit: [unitOf({ r: "30 s" }), unitOf({ r: "200 m" }), unitOf({ r: "8–12" })],
      mon: ["2026-11-23", "2026-11-26", "2026-11-29"].map((d) => monOf(d).toDateString()),
      errs: (window.BLEDY || []).length,
    };
  });
  ok("C1 profil Michała: prefiks gora_, dni A/B", R.prefix === "gora_" && R.days === "A,B", [R.prefix, R.days]);
  ok("C2 sztanga ×1", R.bench.f === 1, R.bench);
  ok("C3 hantle ×2 (wpisuje się jeden hantel)", R.incline.f === 2, R.incline);
  ok("C4 wykroki z hantlami /nogę ×4", R.lunge.f === 4, R.lunge);
  ok("C5 brama ×2 (jedna strona)", R.cablecross.f === 2, R.cablecross);
  ok("C6 maszyna na talerze ×2", R.platepress.f === 2, R.platepress);
  ok("C7 hantel jednorącz ×2 (strony)", R.dbrow.f === 2, R.dbrow);
  ok("C8 podciąganie: masa ciała + obciążenie", R.pull.f === 1 && /masa/.test(R.pull.l), R.pull);
  ok("C9 pompki i plank poza tonażem", !!R.pushup.x && !!R.plank.x, [R.pushup, R.plank]);
  ok("C10 spacer farmera (dystans) poza tonażem", !!R.farmer.x, R.farmer);
  ok("C11 wyjątek „max w 2 min” z ciężarem liczy się", R.benchmax.f === 1, R.benchmax);
  ok("C12 tonaż: rozgrzewka R wliczona, hantle ×2, pompki pominięte", R.vol1 === 1080, R.vol1);
  ok("C13 literówka 6000 kg pominięta", R.volTypo === 480, R.volTypo);
  ok("C14 core/cardio z planu poza tonażem", R.volKind === 0, R.volKind);
  ok("C15 serie: z wpisem, z rozgrzewką, bez core", R.sets === 2, R.sets);
  ok("C16 liczby z przecinkiem", JSON.stringify(R.num) === "[7.5,0,0,0]", R.num);
  ok("C17 górna granica powtórzeń", JSON.stringify(R.topRep) === "[12,8,null]", R.topRep);
  ok("C18 jednostki s / m / powt.", JSON.stringify(R.unit) === '["s","m","powt."]', R.unit);
  ok("C19 tydzień od poniedziałku (PN, CZ, ND → ten sam PN)", new Set(R.mon).size === 1 && R.mon[0].startsWith("Mon"), R.mon);
  ok("C20 brak błędów przy starcie", !p.errs.length && !R.errs, [p.errs, R.errs]);
  await p.context().close();

  // ---- Masa ciała: podciąganie/dipy liczone z masą, przeliczenie starych wpisów ----
  p = await open("");
  const B = await p.evaluate(() => {
    const out = {};
    out.reject = [bmSave("20"), bmSave("300")];
    ls.set(P + "bm", [{ d: "2026-11-01", kg: 80 }, { d: "2026-11-15", kg: 82 }]);
    out.at = [bmAt("2026-10-01"), bmAt("2026-11-10"), bmAt("2026-11-20")];
    // nowy wpis (bw2): 0 = bez obciążenia, 7,5 = z pasem
    out.volNew = volOf({ date: "2026-11-20", bw2: 1, ex: [{ k: "pull", sets: [{ kg: "0", r: "8" }, { kg: "7,5", r: "6" }] }] });
    // stary wpis „masa + obciążenie” (83) → po przeliczeniu samo obciążenie (83 − 80 = 3)
    sessions = [{ id: "t1", date: "2026-11-10", day: "A", ex: [{ k: "pull", sets: [{ kg: "83", r: "6" }, { kg: "", r: "" }] }] }];
    out.mig1 = bwMigrate();
    out.kg = sessions[0].ex[0].sets.map((t) => t.kg);
    out.flag = sessions[0].bw2;
    out.mig2 = bwMigrate(); // drugi raz nic nie zmienia
    return out;
  });
  ok("M1 nierealna masa odrzucona (20, 300)", B.reject[0] === null && B.reject[1] === null, B.reject);
  ok("M2 masa z dnia treningu (przed pierwszym wpisem = pierwszy)", JSON.stringify(B.at) === "[80,80,82]", B.at);
  ok("M3 podciąganie: (masa + dodatkowe kg) × powt.", B.volNew === 82 * 8 + 89.5 * 6, B.volNew);
  ok("M4 przeliczenie starego wpisu 83 → 3, puste zostaje puste", B.mig1 === 1 && B.kg[0] === "3" && B.kg[1] === "" && B.flag === 1, B);
  ok("M5 przeliczenie tylko raz", B.mig2 === -1, B.mig2);
  await p.context().close();

  // ---- Plan zapisany w telefonie ma pierwszeństwo; zepsuty zapis nie psuje startu ----
  p = await open("", () => {
    if (!sessionStorage.s) {
      sessionStorage.s = 1;
      localStorage.setItem("gora_plan", JSON.stringify({ X: { sub: "Mój", ex: [{ k: "bench", n: "Wyciskanie", s: 3, r: "5" }] } }));
    }
  });
  const pl = await p.evaluate(() => DAYS.join(","));
  ok("P1 plan z telefonu wczytany zamiast planu z kodu", pl === "X", pl);
  await p.context().close();
  p = await open("", () => localStorage.setItem("gora_plan", "{zepsuty"));
  const bad = await p.evaluate(() => ({ days: DAYS.join(","), log: (window.BLEDY || []).map((x) => x.gdzie) }));
  ok("P2 zepsuty plan w telefonie → plan startowy, aplikacja działa", bad.days === "A,B" && !p.errs.length, [bad, p.errs]);
  ok("P3 zepsuty plan zapisany w dzienniku błędów", bad.log.includes("wczytanie planu"), bad.log);
  await p.context().close();

  // ---- Profile: Damian i Mateusz – osobne dane i plany ----
  for (const [sub, pre, days] of [["damian", "goradamian_", "PN,WT,SR,CZ,PT"], ["mateusz", "goramateusz_", "KL,LA,PL,BB,NG"]]) {
    p = await open(sub);
    const x = await p.evaluate(() => ({ P, d: DAYS.join(","), css: getComputedStyle(document.body).fontFamily !== "", err: (window.BLEDY || []).length }));
    ok("U-" + sub + " prefiks " + pre + ", dni " + days + ", wspólne pliki wczytane", x.P === pre && x.d === days && x.css && !p.errs.length && !x.err, [x, p.errs]);
    await p.context().close();
  }
  await b.close();
})();
