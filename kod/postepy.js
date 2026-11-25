// Postępy – podsumowania liczone z zapisanych treningów (nic nie jest zapisywane, wszystko liczy się na bieżąco):
// „Ten tydzień” (z poprzednim tygodniem do tego samego dnia), „Ostatnie rekordy”, „Partie mięśniowe”.
const PST_TYDZ = 7 * 864e5;
// Numer tygodnia względem bieżącego: 0 = ten, -1 = poprzedni… (zaokrąglenie: zmiana czasu zimowego/letniego)
function pstIdx(dateIso, nowIso) {
  return Math.round((monOf(dateIso).getTime() - monOf(nowIso || today()).getTime()) / PST_TYDZ);
}
// Ile dni minęło od poniedziałku (0–6) – do porównania z poprzednim tygodniem „do tego samego dnia”
function pstDzien(nowIso) {
  return Math.round(
    (new Date((nowIso || today()) + "T12:00:00").getTime() - monOf(nowIso || today()).getTime()) / 864e5
  );
}
// Rekordy w kolejności zapisu: nowy rekord = serie lepsze niż dotychczasowy najlepszy wynik w tym ćwiczeniu (ta sama reguła prBest co w podsumowaniu)
function pstRekordy(list) {
  const asc = [...list].sort(
    (a, b) => String(a.date).localeCompare(String(b.date)) || (a.created || 0) - (b.created || 0)
  );
  const best = {},
    out = [];
  for (const s of asc)
    for (const e of s.ex || []) {
      if (e.kind || !e.k) continue;
      const nb = prBest(e.sets || []);
      if (!nb) continue;
      const old = best[e.k];
      if (old && nb.v > old.v + 1e-9) out.push({ date: s.date, k: e.k, n: e.n, nb, old });
      if (!old || nb.v > old.v) best[e.k] = nb;
    }
  return out;
}
function pstTydz(list, nowIso) {
  const cut = pstDzien(nowIso),
    z = () => ({ tr: 0, sets: 0, vol: 0 }),
    cur = z(),
    prev = z();
  for (const s of list) {
    const i = pstIdx(s.date, nowIso),
      d = Math.round((new Date(s.date + "T12:00:00").getTime() - monOf(s.date).getTime()) / 864e5);
    const o = i === 0 ? cur : i === -1 && d <= cut ? prev : null;
    if (!o) continue;
    const n = setsOfS(s);
    if (!n) continue;
    o.tr++;
    o.sets += n;
    o.vol += volOf(s);
  }
  const rec = pstRekordy(list).filter((r) => pstIdx(r.date, nowIso) === 0).length;
  return { cur, prev, rec };
}
function pstPartie(list, nowIso) {
  const g = {};
  for (const d of DAYS) for (const e of PLAN[d] ? PLAN[d].ex : []) if (!e.kind) g[ntGrp(CATALOG[e.k] || e)] = 0;
  for (const s of list) {
    const i = pstIdx(s.date, nowIso);
    if (i > 0 || i < -3) continue;
    for (const e of s.ex || []) {
      if (e.kind) continue;
      const n = (e.sets || []).filter((t) => t && !t.w && (t.kg || t.r)).length;
      if (n) {
        const k = ntGrp(CATALOG[e.k] || { n: e.n });
        g[k] = (g[k] || 0) + n;
      }
    }
  }
  return Object.keys(g)
    .filter((k) => !["Inne", "Własne", "Dynamika", "Cardio"].includes(k))
    .map((k) => ({ g: k, n: g[k] }))
    .sort((a, b) => b.n - a.n || a.g.localeCompare(b.g));
}
const pstChg = (a, b) => {
  if (!(b > 0)) return "";
  const p = Math.round(((a - b) / b) * 100);
  return p === 0
    ? '<span class="pchg">bez zmian</span>'
    : '<span class="pchg ' + (p > 0 ? "up" : "dn") + '">' + (p > 0 ? "▲ +" : "▼ ") + p + "%</span>";
};
function pstTydzBlock() {
  if (!sessions.length) return "";
  const t = pstTydz(sessions);
  if (!t.cur.tr && !t.prev.tr) return "";
  const tile = (v, lab, c, p) =>
    '<div class="ptile"><b>' + v + "</b><span>" + lab + "</span>" + pstChg(c, p) + "</div>";
  return (
    '<div class="pst"><div class="exh"><span class="exn">Ten tydzień</span></div><div class="ptiles">' +
    tile(t.cur.tr, "treningi", t.cur.tr, t.prev.tr) +
    tile(t.cur.sets, "serie", t.cur.sets, t.prev.sets) +
    tile(fmtT(t.cur.vol).replace(/ (kg|t)$/, "<small> $1</small>"), "tonaż", t.cur.vol, t.prev.vol) +
    '</div><div class="hint">' +
    (t.rec ? "🏆 Rekordy w tym tygodniu: <b>" + t.rec + "</b> · " : "") +
    "Zmiana wobec poprzedniego tygodnia do tego samego dnia.</div></div>"
  );
}
function pstRekordyBlock() {
  const L = pstRekordy(sessions).slice(-5).reverse();
  if (!L.length) return "";
  return (
    '<div class="pst"><div class="exh"><span class="exn">Ostatnie rekordy</span></div>' +
    L.map(
      (r) =>
        '<div class="prec"><span class="pd2">' +
        esc(fmtDate(r.date).slice(0, 5)) +
        '</span><span class="pn3">🏆 ' +
        esc(r.n) +
        '</span><span class="pk"><b>' +
        esc(prFmt(r.nb)) +
        "</b><small>dotąd " +
        esc(prFmt(r.old)) +
        "</small></span></div>"
    ).join("") +
    "</div>"
  );
}
function pstPartieBlock() {
  const L = pstPartie(sessions);
  const tot = L.reduce((a, x) => a + x.n, 0);
  if (!tot || L.length < 2) return "";
  const mx = Math.max(...L.map((x) => x.n)),
    avg = tot / L.length,
    low = L[L.length - 1];
  const hint =
    L.length >= 3 && low.n < avg * 0.5
      ? "Najmniej serii: <b>" + esc(low.g) + "</b> (" + low.n + "). Przy kolejnych treningach warto o tym pamiętać."
      : "Rozkład serii wygląda równo.";
  return (
    '<div class="pst"><div class="exh"><span class="exn">Partie mięśniowe</span><span class="hint" style="margin:0">ostatnie 4 tygodnie</span></div>' +
    L.map(
      (x) =>
        '<div class="pgrp"><span class="pl">' +
        esc(x.g) +
        '</span><span class="pb"><i style="width:' +
        Math.round((x.n / mx) * 100) +
        '%"></i></span><span class="pc">' +
        x.n +
        "</span></div>"
    ).join("") +
    '<div class="hint">' +
    hint +
    "</div></div>"
  );
}

// Ranking: karta „Razem w tym tygodniu” – wspólny cel treningów i największy skok kilogramów względem poprzedniego tygodnia.
// Liczone z danych, które chmura już zwraca (p.w, p.pw) – bez zmian w skrypcie.
function rankRazemBlock(ppl) {
  const act = ppl.filter((p) => p.w);
  if (act.length < 2) return "";
  const tr = act.reduce((a, p) => a + (p.w.tr || 0), 0),
    prevTr = act.reduce((a, p) => a + ((p.pw && p.pw.tr) || 0), 0),
    goal = Math.max(3 * act.length, prevTr);
  const pct = Math.min(100, Math.round((tr / goal) * 100));
  const jump = act
    .filter((p) => p.w.kg > 0 && p.pw && p.pw.kg > 0)
    .map((p) => ({ p, d: Math.round(((p.w.kg - p.pw.kg) / p.pw.kg) * 100) }))
    .filter((x) => x.d > 0)
    .sort((a, b) => b.d - a.d)[0];
  return (
    '<div class="rc"><h3>Razem w tym tygodniu</h3><div class="goalh"><span>Wspólny cel: <b>' +
    goal +
    " treningów</b></span><span>" +
    (tr >= goal ? "cel zdobyty! 🎉" : tr + " z " + goal) +
    '</span></div><div class="goalbar" role="img" aria-label="Wspólny cel: ' +
    pct +
    ' procent"><i class="' +
    (tr >= goal ? "ok" : "") +
    '" style="width:' +
    pct +
    '%"></i></div><div class="sm" style="margin-top:6px">Cel to więcej niż w zeszłym tygodniu, minimum 3 treningi na osobę.</div>' +
    (jump
      ? '<div class="rjump">📈 Największy skok tygodnia: <b>' +
        esc(jump.p.name) +
        (jump.p.me ? " (TY)" : "") +
        "</b> +" +
        jump.d +
        "% kilogramów wobec zeszłego tygodnia</div>"
      : "") +
    "</div>"
  );
}
