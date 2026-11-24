// Kamienie milowe (odznaki): liczone na bieżąco z zapisanych treningów – jak rekordy, tylko z treningów w aplikacji.
// Nic nie zapisują w telefonie. „Nowa” odznaka = spełniona z bieżącym treningiem, a bez niego jeszcze nie.
// Tylko definicje – wywoływane z kod/aplikacja.js (ładowany później).

// Najlepszy ciężar (kg) w ćwiczeniu k z co najmniej 1 powtórzeniem; literówki (>1000 kg, >200 powt.) pomijane
function odzMaxKg(list, keys) {
  let m = 0;
  for (const s of list)
    for (const e of s.ex || [])
      if (keys.includes(e.k) && !e.kind)
        for (const t of e.sets || []) {
          const kg = num(t.kg),
            r = parseInt(t.r) || 0;
          if (r >= 1 && r <= 200 && kg <= 1000 && kg > m) m = kg;
        }
  return m;
}
function odzMaxReps(list, keys) {
  let m = 0;
  for (const s of list)
    for (const e of s.ex || [])
      if (keys.includes(e.k) && !e.kind)
        for (const t of e.sets || []) m = Math.max(m, Math.min(200, parseInt(t.r) || 0));
  return m;
}
// Najdłuższa seria tygodni (PN–ND) z co najmniej jednym treningiem
function odzWeeks(list) {
  const w = [...new Set(list.map((s) => monOf(s.date).getTime()))].sort((a, b) => a - b);
  let best = 0,
    run = 0;
  for (let i = 0; i < w.length; i++) {
    run = i && Math.round((w[i] - w[i - 1]) / 864e5) === 7 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}
const ODZ = [
  { id: "t10", big: "10", sm: "treningów", val: (L) => L.length, cel: 10, jed: "" },
  { id: "t50", big: "50", sm: "treningów", val: (L) => L.length, cel: 50, jed: "" },
  { id: "t100", big: "100", sm: "treningów", val: (L) => L.length, cel: 100, jed: "" },
  { id: "v10", big: "10 t", sm: "tonażu łącznie", val: (L) => L.reduce((a, s) => a + volOf(s), 0), cel: 1e4, proc: 1 },
  { id: "v50", big: "50 t", sm: "tonażu łącznie", val: (L) => L.reduce((a, s) => a + volOf(s), 0), cel: 5e4, proc: 1 },
  {
    id: "v100",
    big: "100 t",
    sm: "tonażu łącznie",
    val: (L) => L.reduce((a, s) => a + volOf(s), 0),
    cel: 1e5,
    proc: 1,
  },
  { id: "w4", big: "4 tyg.", sm: "bez przerwy", val: odzWeeks, cel: 4, jed: " tyg." },
  { id: "w12", big: "12 tyg.", sm: "bez przerwy", val: odzWeeks, cel: 12, jed: " tyg." },
  {
    id: "b100",
    big: "100 kg",
    sm: "ławka",
    val: (L) => odzMaxKg(L, ["bench"]),
    cel: 100,
    kg: 1,
    nazwa: "Pierwsze 100 kg na ławce",
  },
  {
    id: "s140",
    big: "140 kg",
    sm: "przysiad",
    val: (L) => odzMaxKg(L, ["squat"]),
    cel: 140,
    kg: 1,
    nazwa: "Pierwsze 140 kg w przysiadzie",
  },
  {
    id: "d180",
    big: "180 kg",
    sm: "martwy ciąg",
    val: (L) => odzMaxKg(L, ["dl"]),
    cel: 180,
    kg: 1,
    nazwa: "Pierwsze 180 kg w martwym ciągu",
  },
  {
    id: "p10",
    big: "10×",
    sm: "podciągania z rzędu",
    val: (L) => odzMaxReps(L, ["pull", "chinup"]),
    cel: 10,
    nazwa: "10 podciągnięć w jednej serii",
  },
];
function odzNazwa(o) {
  return o.nazwa || o.big + " – " + o.sm;
}
function odzStan(list) {
  return ODZ.map((o) => {
    const v = o.val(list);
    return { o, v, ok: v >= o.cel };
  });
}
// Brakująca część celu – krótko, do kafelka
function odzBrak(x) {
  const pl = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
  if (x.o.proc) return Math.floor((x.v / x.o.cel) * 100) + " %";
  if (x.o.kg) return x.v ? "brakuje " + pl(x.o.cel - x.v) + " kg" : "bez wpisu";
  return x.v + " / " + x.o.cel + (x.o.jed || "");
}

// Postępy → „Odznaki”
function odzBlock() {
  const st = odzStan(sessions),
    n = st.filter((x) => x.ok).length;
  return (
    '<div class="odz"><div class="odzh"><span>Odznaki</span><span>' +
    n +
    " / " +
    st.length +
    '</span></div><div class="odzg">' +
    st
      .map(
        (x) =>
          '<div class="odzk' +
          (x.ok ? " zdobyta" : "") +
          '" title="' +
          esc(odzNazwa(x.o)) +
          '"><b>' +
          esc(x.o.big) +
          "</b><small>" +
          esc(x.o.sm) +
          "</small>" +
          (x.ok ? "" : "<i>" + esc(odzBrak(x)) + "</i>") +
          "</div>"
      )
      .join("") +
    '</div><div class="hint">Odznaki liczą się tylko z treningów zapisanych w aplikacji – tak jak rekordy.</div></div>'
  );
}

// Podsumowanie treningu → nowe odznaki zdobyte tym treningiem
function odzNowe(cur) {
  const przed = odzStan(sessions),
    po = odzStan([cur, ...sessions]);
  const nowe = po.filter((x, i) => x.ok && !przed[i].ok);
  return nowe
    .map(
      (x) =>
        '<div class="odznew"><b>' +
        esc(x.o.big) +
        "</b><div><small>NOWY KAMIEŃ MILOWY</small><span>" +
        esc(odzNazwa(x.o)) +
        "</span></div></div>"
    )
    .join("");
}
