// Wczytanie planu: plan zapisany w telefonie ma pierwszeństwo przed planem z kodu.
const INFO_TXT =
  PRO.plan === "damian"
    ? "5 treningów w tygodniu · PN–PT"
    : PRO.plan === "mateusz"
      ? "5 treningów po kolei · Klata → Nogi"
      : "2 treningi w tygodniu · A / B";
const OLD = { A: { n: "FBW A" }, B: { n: "FBW B" }, C: { n: "FBW C" } };
const PLAN_DEFAULT = JSON.parse(JSON.stringify(PLAN));
const LETTERS = "ABCDEF";
// Plan z telefonu / kopii: tylko poprawne dni i ćwiczenia, teksty bez znaczników HTML (klucze ćwiczeń trafiają do atrybutów strony).
function planClean(sp) {
  const txt = (v, n) =>
    String(v == null ? "" : v)
      .replace(/[<>]/g, "")
      .slice(0, n);
  const out = {};
  if (!sp || typeof sp !== "object" || Array.isArray(sp)) return out;
  for (const d of Object.keys(sp)) {
    const day = sp[d];
    if (!/^[A-Za-z0-9_-]{1,20}$/.test(d) || !day || typeof day !== "object" || !Array.isArray(day.ex)) continue;
    const c = Object.assign({}, day);
    for (const f of ["name", "sub"]) if (day[f] != null) c[f] = txt(day[f], 40);
    c.ex = day.ex
      .filter((e) => e && typeof e === "object" && typeof e.k === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(e.k))
      .map((e) => {
        const x = Object.assign({}, e);
        if (e.n != null) x.n = txt(e.n, 80);
        if (e.r != null) x.r = txt(e.r, 30);
        if (e.note != null) x.note = txt(e.note, 60);
        if (e.swapOf != null && !/^[A-Za-z0-9_-]{1,40}$/.test(String(e.swapOf))) delete x.swapOf;
        return x;
      });
    out[d] = c;
  }
  return out;
}
try {
  const sp = planClean(JSON.parse(localStorage.getItem(P + "plan") || "null"));
  if (Object.keys(sp).length) {
    for (const k of Object.keys(PLAN)) delete PLAN[k];
    Object.assign(PLAN, sp);
  }
} catch (e) {
  blad("wczytanie planu", e);
}
// Plan zapisuje się w telefonie przy pierwszym uruchomieniu – późniejsze zmiany planu startowego w kodzie nie zmienią planu osobom, które już korzystają
try {
  if (!localStorage.getItem(P + "plan")) localStorage.setItem(P + "plan", JSON.stringify(PLAN));
} catch (e) {
  blad("zapis planu startowego", e);
}
DAYS.length = 0;
DAYS.push(...Object.keys(PLAN));
