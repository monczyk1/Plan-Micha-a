// Siła w ćwiczeniu: szacowany max na 1 powtórzenie z najlepszej serii każdego tygodnia, wykres, wykrywanie zastoju.
// Dane tylko z zapisanych treningów (tak jak rekordy). Nic nie jest zapisywane – wszystko liczy się na bieżąco.
let silaSel = "";
const SILA_MAXR = 12; // powyżej 12 powtórzeń wzór przestaje być wiarygodny – takich serii nie liczymy

// Szacowany max (Epley): kg × (1 + powt./30); przy 1 powtórzeniu – po prostu ciężar. Zaokrąglenie do 0,5 kg.
function silaE1(kg, r) {
  if (!(kg > 0) || !(r > 0) || r > SILA_MAXR) return 0;
  return Math.round((r === 1 ? kg : kg * (1 + r / 30)) * 2) / 2;
}
// Tygodnie (poniedziałek = klucz) → najlepszy szacowany max w tym tygodniu, rosnąco po dacie.
function silaTygodnie(list, k) {
  const w = {};
  for (const s of list) {
    const e = (s.ex || []).find((x) => x.k === k && !x.kind);
    if (!e) continue;
    let best = 0;
    for (const t of e.sets || []) {
      if (t.w) continue;
      best = Math.max(best, silaE1(num(t.kg), parseInt(t.r) || 0));
    }
    if (!best) continue;
    const m = monOf(s.date),
      key =
        m.getFullYear() + "-" + String(m.getMonth() + 1).padStart(2, "0") + "-" + String(m.getDate()).padStart(2, "0");
    w[key] = Math.max(w[key] || 0, best);
  }
  return Object.keys(w)
    .sort()
    .map((key) => ({ key, d: new Date(key + "T12:00:00"), v: w[key] }));
}
// Ćwiczenia z ciężarem (które da się opisać szacowanym maksem), od najczęściej trenowanych.
function silaLista(list) {
  const n = {},
    cnt = {};
  for (const s of list)
    for (const e of s.ex || []) {
      if (e.kind) continue;
      if (silaTygodnie([s], e.k).length) {
        n[e.k] = e.n;
        cnt[e.k] = (cnt[e.k] || 0) + 1;
      }
    }
  return Object.keys(n)
    .filter((k) => cnt[k] >= 2)
    .sort((a, b) => cnt[b] - cnt[a])
    .map((k) => ({ k, n: n[k] }));
}
const SILA_DNI_TYDZ = 7 * 864e5;
// Zastój: najlepszy tydzień jest co najmniej 4 tygodnie temu (kalendarzowo), a ćwiczenie było trenowane niedawno.
// Zwraca liczbę tygodni bez rekordu albo 0.
function silaZastoj(pts, nowIso) {
  if (pts.length < 5) return 0;
  const nowM = monOf(nowIso || today()).getTime();
  const lastM = pts[pts.length - 1].d.getTime();
  if (Math.round((nowM - lastM) / SILA_DNI_TYDZ) > 1) return 0; // dawno nietrenowane – to nie zastój
  const mx = Math.max(...pts.map((p) => p.v));
  const rec = pts.find((p) => p.v === mx); // pierwszy tydzień z najlepszym wynikiem
  const wks = Math.round((lastM - rec.d.getTime()) / SILA_DNI_TYDZ);
  return wks >= 4 ? wks : 0;
}
// Największy wzrost szacowanego maksa w ostatnich 8 tygodniach (min. 2 pomiary), do 3 ćwiczeń.
function silaWzrosty(list, nowIso) {
  const nowM = monOf(nowIso || today()).getTime(),
    out = [];
  for (const x of silaLista(list)) {
    const p = silaTygodnie(list, x.k).filter((q) => Math.round((nowM - q.d.getTime()) / SILA_DNI_TYDZ) <= 7); // zaokrąglenie: zmiana czasu zimowego/letniego
    if (p.length < 2) continue;
    const dv = p[p.length - 1].v - p[0].v;
    if (dv > 0) out.push({ n: x.n, dv });
  }
  return out.sort((a, b) => b.dv - a.dv).slice(0, 3);
}
const silaKg = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
const silaDM = (d) => d.getDate() + "." + (d.getMonth() + 1);

function silaWykres(pts, zast) {
  const W = 330,
    H = 176,
    L = 16,
    R = 318,
    T = 20,
    B = 150;
  const win = pts.slice(-12); // do 12 ostatnich tygodni z pomiarem
  const t0 = win[0].d.getTime(),
    span = Math.max(1, Math.round((win[win.length - 1].d.getTime() - t0) / SILA_DNI_TYDZ));
  const vs = win.map((p) => p.v);
  let lo = Math.floor(Math.min(...vs) / 5) * 5,
    hi = Math.ceil(Math.max(...vs) / 5) * 5;
  if (hi - lo < 10) hi = lo + 10;
  const xx = (p) => 20 + (Math.round((p.d.getTime() - t0) / SILA_DNI_TYDZ) / span) * (R - 20 - 8),
    yy = (v) => B - ((v - lo) / (hi - lo)) * (B - T - 8);
  const mid = (lo + hi) / 2;
  const grid = [hi, mid, lo]
    .map(
      (g) =>
        '<line x1="' +
        L +
        '" x2="' +
        R +
        '" y1="' +
        yy(g) +
        '" y2="' +
        yy(g) +
        '" class="sg"/>' +
        '<text x="' +
        R +
        '" y="' +
        (yy(g) - 4) +
        '" text-anchor="end" class="st">' +
        silaKg(g) +
        "</text>"
    )
    .join("");
  const pl = win.map((p) => xx(p).toFixed(1) + "," + yy(p.v).toFixed(1)).join(" ");
  let shade = "";
  if (zast) {
    const x0 = xx(win[Math.max(0, win.length - 1 - zast)]);
    shade =
      '<rect x="' +
      x0.toFixed(1) +
      '" y="' +
      (T + 8) +
      '" width="' +
      (R - x0).toFixed(1) +
      '" height="' +
      (B - T - 8) +
      '" class="sz"/>' +
      '<text x="' +
      ((x0 + R) / 2).toFixed(1) +
      '" y="' +
      (B - 8) +
      '" text-anchor="middle" class="sl">' +
      zast +
      " tyg. bez rekordu</text>";
  }
  const first = win[0],
    last = win[win.length - 1];
  return (
    '<svg class="silaw" viewBox="0 0 ' +
    W +
    " " +
    H +
    '" role="img" aria-label="Wykres: szacowany max z ' +
    silaKg(first.v) +
    " kg (" +
    silaDM(first.d) +
    ") do " +
    silaKg(last.v) +
    " kg (" +
    silaDM(last.d) +
    ")" +
    (zast ? ", od " + zast + " tygodni bez rekordu" : "") +
    '">' +
    grid +
    shade +
    '<polyline points="' +
    pl +
    '" class="sp"/>' +
    win
      .map((p) => '<circle cx="' + xx(p).toFixed(1) + '" cy="' + yy(p.v).toFixed(1) + '" r="4" class="sd"/>')
      .join("") +
    '<text x="20" y="168" text-anchor="start" class="st">' +
    silaDM(first.d) +
    "</text>" +
    '<text x="' +
    R +
    '" y="168" text-anchor="end" class="st">' +
    silaDM(last.d) +
    "</text></svg>"
  );
}

// Cele ustawia się w Ustawieniach → Cele (kod/cele.js); tu tylko podgląd paska dla wybranego ćwiczenia.
function silaCelBlock(k) {
  const goal = num(celeGet()[k]);
  if (!goal || celeTyp(k) !== "kg") return "";
  const best = silaNajkg(k),
    pct = Math.min(100, Math.round((best / goal) * 100));
  return (
    '<div class="goal"><div class="goalh"><span>🎯 Cel: <b>' +
    silaKg(goal) +
    " kg</b></span><span>" +
    (best >= goal ? "osiągnięty!" : silaKg(best) + " kg · " + pct + "%") +
    '</span></div><div class="goalbar" role="img" aria-label="Postęp do celu: ' +
    pct +
    ' procent"><i class="' +
    (best >= goal ? "ok" : "") +
    '" style="width:' +
    pct +
    '%"></i></div><div class="hint">Cel zmienisz w Ustawieniach → Cele.</div></div>'
  );
}
// Siła względem masy ciała (tylko sztanga/maszyna: nie hantle i nie ćwiczenia z ciężarem ciała)
function silaWzgl(k, e1) {
  const b = bmLast();
  if (!b || BWL.has(k) || DB.has(k) || !(num(b.kg) > 0)) return "";
  return (
    '<div class="hint">≈ <b>' +
    String(Math.round((e1 / num(b.kg)) * 100) / 100).replace(".", ",") +
    "× masa ciała</b> (" +
    silaKg(num(b.kg)) +
    " kg)</div>"
  );
}
function silaBlock() {
  const L = silaLista(sessions);
  if (!L.length) return "";
  if (!L.some((x) => x.k === silaSel)) silaSel = L[0].k;
  const pts = silaTygodnie(sessions, silaSel);
  const cur = pts[pts.length - 1],
    zast = silaZastoj(pts);
  const gr = silaWzrosty(sessions);
  let h =
    '<div class="sila"><div class="exh"><span class="exn">Siła w ćwiczeniu</span></div>' +
    '<label class="silasel"><span class="hint">Ćwiczenie</span><select id="silaSel">' +
    L.map(
      (x) => '<option value="' + esc(x.k) + '"' + (x.k === silaSel ? " selected" : "") + ">" + esc(x.n) + "</option>"
    ).join("") +
    "</select></label>" +
    '<div class="silamax"><b>' +
    silaKg(cur.v) +
    " kg</b><span>szacowany max na 1 powt.</span></div>" +
    silaWzgl(silaSel, cur.v) +
    silaCelBlock(silaSel) +
    '<div class="hint">Z najlepszej serii tygodnia (kg × (1 + powt. ÷ 30)). Porównuje treningi z różną liczbą powtórzeń.</div>';
  h +=
    pts.length >= 2
      ? silaWykres(pts, zast)
      : '<div class="hint">Wykres pojawi się po treningach w co najmniej dwóch różnych tygodniach.</div>';
  h += "</div>";
  if (zast)
    h +=
      '<div class="silaz"><div class="exh"><span class="exn">Zastój od ' +
      zast +
      " tygodni</span></div>" +
      "<p>To ćwiczenie stoi w miejscu. Do wyboru na następny tydzień:</p><ul><li>tydzień lżejszy (–10 % kg), potem znowu w górę,</li>" +
      "<li>inny zakres powtórzeń (np. 5 × 5 zamiast 4 × 6–8),</li><li>zamiana na podobne ćwiczenie na 3–4 tygodnie.</li></ul></div>";
  if (gr.length)
    h +=
      '<div class="silag"><div class="exh"><span class="exn">Największy wzrost w 8 tygodni</span></div>' +
      gr.map((x) => '<div class="silar"><span>' + esc(x.n) + "</span><b>+" + silaKg(x.dv) + " kg</b></div>").join("") +
      "</div>";
  return h;
}
// po wstawieniu bloku do strony: obsługa listy wyboru
function silaBind(root) {
  const s = root.querySelector("#silaSel");
  if (s)
    s.onchange = () => {
      silaSel = s.value;
      renderProg();
    };
}
