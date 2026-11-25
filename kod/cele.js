// Cele: Ustawienia → Cele. P+"goals" = { klucz ćwiczenia: cel }, w kg (ciężar) albo w powtórzeniach (podciąganie, dipy).
const CELE = [
  ["bench", "kg"],
  ["squat", "kg"],
  ["dl", "kg"],
  ["ohp", "kg"],
  ["pendlay", "kg"],
  ["rdl", "kg"],
  ["legpress", "kg"],
  ["incline", "kg"],
  ["pull", "powt"],
  ["dips", "powt"],
];
const CELE_DOL = new Set(["squat", "dl", "rdl", "legpress"]);
const celeTyp = (k) => (CELE.find((x) => x[0] === k) || [0, "kg"])[1];
function celeGet() {
  const g = ls.get(P + "goals");
  return g && typeof g === "object" && !Array.isArray(g) ? g : {};
}
function silaNajkg(k) {
  let b = 0;
  for (const s of sessions)
    for (const e of s.ex || [])
      if (e.k === k && !e.kind)
        for (const t of e.sets || []) if (!t.w && num(t.kg) <= 1000 && num(t.kg) > b) b = num(t.kg);
  return b;
}
function celeNajpowt(k) {
  let b = 0;
  for (const s of sessions)
    for (const e of s.ex || [])
      if (e.k === k && !e.kind)
        for (const t of e.sets || []) if (!t.w) b = Math.max(b, Math.min(100, parseInt(t.r, 10) || 0));
  return b;
}
const celeNum = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
// Podpowiedź, jak dojść do celu (liczona z historii: tempo wzrostu z ostatnich 8 tygodni)
function celePorada(k, goal) {
  const typ = celeTyp(k);
  if (typ === "powt") {
    const best = celeNajpowt(k);
    if (!best) return "Zrób pierwszą serię tego ćwiczenia, a aplikacja policzy, ile Ci brakuje.";
    if (best >= goal) return "Cel osiągnięty! Ustaw wyższy.";
    const gap = goal - best;
    return (
      "Brakuje " +
      gap +
      " powt. (najlepsza seria: " +
      best +
      "). Dodawaj 1 powtórzenie co 1–2 tygodnie: to około " +
      gap * 2 +
      " tyg. Trenuj to ćwiczenie 2 razy w tygodniu, w jednej serii zrób 3–4 powtórzenia mniej niż maksimum, a na końcu jedną serię „na maksa”. Wolne opuszczanie (3–4 s) też buduje siłę."
    );
  }
  const best = silaNajkg(k);
  if (!best) return "Zrób pierwszą serię z ciężarem, a aplikacja policzy, ile Ci brakuje.";
  if (best >= goal) return "Cel osiągnięty! Ustaw wyższy.";
  const gap = goal - best,
    inc = CELE_DOL.has(k) ? 5 : 2.5,
    wks = Math.ceil(gap / inc) * 2;
  const pts = silaTygodnie(sessions, k).slice(-8);
  let tempo = "";
  if (pts.length >= 3) {
    const span = Math.max(1, Math.round((pts[pts.length - 1].d - pts[0].d) / (7 * 864e5)));
    const r = (pts[pts.length - 1].v - pts[0].v) / span;
    tempo =
      r > 0.05
        ? " Przy Twoim tempie (+" + celeNum(r) + " kg na tydzień) to około " + Math.ceil(gap / r) + " tyg."
        : " Ostatnio ciężar stoi w miejscu, więc zacznij od tygodnia lżejszego (–10 %).";
  }
  return (
    "Brakuje " +
    celeNum(gap) +
    " kg (najcięższa seria: " +
    celeNum(best) +
    " kg). Bezpieczny plan: +" +
    celeNum(inc) +
    " kg co 2 tygodnie, czyli około " +
    wks +
    " tyg. Dodawaj ciężar, gdy wszystkie serie zrobisz w górnej granicy zakresu powtórzeń; co 4. tydzień zrób lżejszy." +
    tempo
  );
}
function celeRender() {
  const box = document.getElementById("celeList");
  if (!box) return;
  const g = celeGet();
  box.innerHTML = CELE.map(([k, typ]) => {
    const c = CATALOG[k];
    if (!c) return "";
    const goal = num(g[k]),
      best = typ === "kg" ? silaNajkg(k) : celeNajpowt(k),
      u = typ === "kg" ? "kg" : "powt.",
      pct = goal ? Math.min(100, Math.round((best / goal) * 100)) : 0;
    return (
      '<div class="celerow" data-k="' +
      k +
      '"><div class="celeh"><b>' +
      esc(c.n) +
      '</b><span class="hint" style="margin:0">teraz: ' +
      (best ? celeNum(best) + " " + u : "brak") +
      '</span></div><div class="goaledit"><label class="hint" for="cel_' +
      k +
      '">Cel (' +
      u +
      ')</label><input id="cel_' +
      k +
      '" inputmode="decimal" placeholder="np. ' +
      (typ === "kg" ? "100" : "12") +
      '" value="' +
      (goal ? celeNum(goal) : "") +
      '"><button class="mini plus" data-celeok="' +
      k +
      '">Zapisz</button>' +
      (goal ? '<button class="mini" data-celedel="' + k + '">Usuń</button>' : "") +
      "</div>" +
      (goal
        ? '<div class="goalbar" role="img" aria-label="Postęp do celu: ' +
          pct +
          ' procent"><i class="' +
          (best >= goal ? "ok" : "") +
          '" style="width:' +
          pct +
          '%"></i></div><p class="celetip">' +
          esc(celePorada(k, goal)) +
          "</p>"
        : "") +
      "</div>"
    );
  }).join("");
}
function celeInit() {
  const d = document.getElementById("celeBox");
  if (!d) return;
  d.addEventListener("toggle", () => d.open && celeRender());
  d.addEventListener("click", (ev) => {
    const ok = ev.target.closest("[data-celeok]"),
      del = ev.target.closest("[data-celedel]");
    if (!ok && !del) return;
    const k = (ok || del).dataset.celeok || (ok || del).dataset.celedel,
      g = celeGet();
    if (ok) {
      const v = num(document.getElementById("cel_" + k).value);
      if (!(v > 0) || v > 1000) return toast("Wpisz cel jako liczbę, np. " + (celeTyp(k) === "kg" ? "100." : "12."));
      g[k] = Math.round(v * 100) / 100;
    } else delete g[k];
    ls.set(P + "goals", g);
    ls.set(P + "changed", Date.now());
    cloudDirty();
    celeRender();
    toast(ok ? "Cel zapisany." : "Cel usunięty.", true);
  });
}
celeInit();
