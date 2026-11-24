// Logika aplikacji: trening, tonaż, historia, postępy, kopie, chmura, ranking, aktualizacje.
function topRep(r) {
  const m = String(r).match(/(\d+)\s*[–-]\s*(\d+)/);
  return m ? +m[2] : null;
}
function num(v) {
  return parseFloat(String(v == null ? "" : v).replace(",", ".")) || 0;
}
function unitOf(ex) {
  return ex.unit || (/\ds?\s*s\b/.test(ex.r) ? "s" : /\dm?\s*m\b/.test(ex.r) ? "m" : "powt.");
}
function suggest(ex, prev) {
  if (!prev || ex.pull) return "";
  const t = topRep(ex.r);
  if (!t) return "";
  const need = WEEK[week].f(ex.s);
  const pl = (v) => String(v).replace(".", ",");
  if (BW.has(ex.k)) {
    const rs = prev.e.sets.filter((x) => x.r);
    if (!rs.length || rs.some((x) => num(x.kg))) 0;
    else {
      return rs.length >= need && rs.every((x) => (parseInt(x.r) || 0) >= t)
        ? '<div class="sug up">Wszystkie serie na górze zakresu → dodaj obciążenie (pas, hantel między nogami) albo wolniejsze opuszczanie</div>'
        : '<div class="sug">Cel: ' + t + " powtórzeń w każdej serii</div>";
    }
  }
  const ws = prev.e.sets.filter((x) => x.kg);
  if (!ws.length) return "";
  const kg = Math.max(...ws.map((x) => num(x.kg)));
  if (!kg) return "";
  const all = ws.length >= need && ws.every((x) => (parseInt(x.r) || 0) >= t);
  if (week === NWEEK) return '<div class="sug">Deload: ok. ' + pl(r25(kg * 0.9)) + " kg, połowa serii</div>";
  if (all)
    return (
      '<div class="sug up">Wszystkie serie na górze zakresu → dziś ' +
      (DB.has(ex.k) ? "cięższe hantle (następne po " + pl(kg) + " kg)" : pl(kg + (BIG.has(ex.k) ? 5 : 2.5)) + " kg") +
      "</div>"
    );
  return '<div class="sug">Zostań przy ' + pl(kg) + " kg i dołóż powtórzenia (cel: " + t + " w każdej serii)</div>";
}
const PULL = [
  "1 · ściąganie 3×8–12 + negatywy 3×3",
  "2 · guma / maszyna 3×6–8",
  "3 · podciąganie 3–5×1–3",
  "4 · podciąganie 3×6–10",
];
const WEEK = new Proxy({}, { get: () => ({ t: "", f: (s) => s }) });
const NWEEK = 999;
const NEXT = {};
function rebuildNext() {
  for (const k in NEXT) delete NEXT[k];
  const R = DAYS.filter((d) => !(PLAN[d] && PLAN[d].extra));
  R.forEach((d, i) => (NEXT[d] = R[(i + 1) % R.length]));
}
rebuildNext();

let day = DAYS[0],
  week = 1,
  sessions = [],
  pullStage = 0;
const $ = (id) => document.getElementById(id);
let lsFailShown = false;
const ls = {
  get(k) {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) {
      if (!lsFailShown) {
        lsFailShown = true;
        setTimeout(
          () =>
            toast(
              "Uwaga: przeglądarka nie pozwala zapisać danych (tryb prywatny albo brak miejsca). Zrób kopię zapasową!"
            ),
          0
        );
      }
      return false;
    }
  },
};
const blank = () => ({
  vals: {},
  done: {},
  swaps: {},
  added: [],
  removed: [],
  extra: {},
  open: {},
  wus: {},
  start: 0,
  order: [],
});
let draft = ls.get(P + "draft") || {};
for (const d of DAYS) draft[d] = Object.assign(blank(), draft[d] || {});
draft.common = draft.common || {};
const S = () => {
  const b = blank();
  if (!draft[day]) draft[day] = b;
  else for (const k in b) if (draft[day][k] == null) draft[day][k] = b[k];
  return draft[day];
};
const hasDraft = (d) =>
  !!draft[d] && (Object.keys(draft[d].vals || {}).length > 0 || Object.values(draft[d].done || {}).some(Boolean));
const COMMON = ["bw", "notes"];

function today() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function esc(t) {
  return String(t == null ? "" : t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function fmtDate(d) {
  if (!d) return "";
  const p = String(d).split("-");
  return p[2] + "." + p[1];
}
function r25(x) {
  return Math.round(x / 2.5) * 2.5;
}
function sortS() {
  sessions.sort((a, b) => String(b.date).localeCompare(String(a.date)) || (b.created || 0) - (a.created || 0));
}
function dl(d) {
  return PLAN[d] && PLAN[d].extra ? PLAN[d].name : DAYLBL[d] || d;
}
function isX(d) {
  return !!(PLAN[d] && PLAN[d].extra);
}
function regDays() {
  return DAYS.filter((d) => !isX(d));
}
function nextReg() {
  const l = sessions.find((x) => PLAN[x.day] && !isX(x.day));
  const R = regDays();
  return l ? NEXT[l.day] : R[0];
}
function lastFor(k) {
  for (const s of sessions) {
    const e = (s.ex || []).find((x) => x.k === k && !x.kind);
    if (e && e.sets && e.sets.some((t) => !t.w && (t.kg || t.r)))
      return { s, e: Object.assign({}, e, { sets: e.sets.filter((t) => !t.w) }) };
  }
  return null;
}

let toastT = null;
function toast(msg, ok) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast" + (ok ? " ok" : "");
  t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => {
    t.hidden = true;
  }, 4500);
}

function oid(e) {
  return e.swapOf || e.k;
}
function exList(noOrder) {
  const s = S();
  let L = PLAN[day].ex
    .filter((e) => !s.removed.includes(e.k))
    .map((e) =>
      s.swaps[e.k] && CATALOG[s.swaps[e.k]]
        ? Object.assign({}, CATALOG[s.swaps[e.k]], { swapOf: e.k, s: e.s }, e.ss ? { ss: e.ss } : {})
        : e
    )
    .concat(s.added.filter((k) => CATALOG[k]).map((k) => Object.assign({}, CATALOG[k], { added: 1 })));
  if (!noOrder && s.order && s.order.length) {
    const pos = (id) => {
      const i = s.order.indexOf(id);
      return i < 0 ? 1e6 : i;
    };
    L = L.map((e, i) => [e, i])
      .sort((a, b) => pos(oid(a[0])) - pos(oid(b[0])) || a[1] - b[1])
      .map((x) => x[0]);
  }
  // superseria działa tylko, gdy oba ćwiczenia są obok siebie
  return L.map((e, i) =>
    e.ss && !((L[i - 1] && L[i - 1].ss === e.ss) || (L[i + 1] && L[i + 1].ss === e.ss))
      ? Object.assign({}, e, { ss: undefined })
      : e
  );
}
function nSets(ex) {
  return WEEK[week].f(ex.s) + (S().extra[ex.k] || 0);
}
function snap() {
  const o = {};
  document.querySelectorAll("#exList input").forEach((i) => {
    if (i.value) o[i.id] = i.value;
  });
  return o;
}
let restoring = false;
function persist() {
  if (restoring) return;
  if (!ordMode) S().vals = snap();
  if (!S().start && (Object.keys(S().vals).length || Object.values(S().done).some(Boolean))) S().start = Date.now();
  draft.day = day;
  draft.common = {};
  COMMON.forEach((i) => {
    if ($(i).value) draft.common[i] = $(i).value;
  });
  ls.set(P + "draft", draft);
}

function renderSeg() {
  $("seg").innerHTML = "";
  $("seg").style.gridTemplateColumns = "repeat(" + Math.min(DAYS.length + 1, 3) + ",1fr)";
  for (const d of DAYS) {
    const b = document.createElement("button");
    b.setAttribute("aria-pressed", d === day);
    if (isX(d)) b.className = "xt";
    b.innerHTML =
      esc(dl(d)) +
      "<small>" +
      esc(isX(d) ? "dodatkowy" : PLAN[d].sub) +
      (d !== day && hasDraft(d) ? " · w toku" : "") +
      "</small>";
    b.onclick = () => {
      if (d === day) return;
      persist();
      if (viewT !== null) reloadSessions();
      day = d;
      viewT = null;
      render(true);
    };
    $("seg").append(b);
  }
  {
    const a = document.createElement("button");
    a.className = "addt";
    a.innerHTML = "+<small>Nowy trening</small>";
    a.setAttribute("aria-label", "Nowy trening dodatkowy");
    a.onclick = openNT;
    $("seg").append(a);
  }
  const last = sessions[0];
  const nx = nextReg();
  $("nextHint").textContent = last
    ? "Ostatnio: " +
      (PLAN[last.day]
        ? dl(last.day) + " " + (isX(last.day) ? "(dodatkowy)" : PLAN[last.day].sub)
        : (OLD[last.day] || { n: last.dn || last.day }).n) +
      " (" +
      fmtDate(last.date) +
      ")" +
      (nx ? " → następny " + dl(nx) : "")
    : "Jeszcze nie ma zapisanych treningów.";
}
let viewT = null,
  pvDirty = false;
// Tonaż: seria × kg × powtórzenia, razem z seriami rozgrzewkowymi R1/R2.
// ×2 gdy dwa hantle naraz, ×2 gdy powtórzenia są na stronę (/nogę, /rękę, /str., jednorącz).
// Nie wlicza się: ćwiczenia z ciężarem ciała, na czas lub dystans, dynamika, core i cardio z planu.
// Podciąganie i dipy: w kg wpisujesz masę ciała (z obciążeniem razem) – liczy się do tonażu
const BWL = new Set(["pull", "chinup", "dips"]);
// Brama: dwie linki, dwa stosy – wpisujesz ciężar jednej strony, liczymy ×2 (jak dwa hantle)
const CAB2 = new Set(["cablecross", "lowcablefly", "highcablefly"]);
// Maszyna na talerze: talerze wpisujesz z jednej strony, liczymy ×2
const PLATE2 = new Set(["platepress"]);
// Ćwiczenia „na czas”, w których liczą się zrobione powtórzenia z ciężarem
const TONF = new Set(["benchmax"]);
// Masa ciała: lista pomiarów [{d,kg}], dodawana do obciążenia przy podciąganiu i dipach
function bmList() {
  const a = ls.get(P + "bm");
  return Array.isArray(a) ? a.filter((x) => x && x.d && num(x.kg) > 0) : [];
}
function bmAt(d) {
  const L = bmList();
  if (!L.length) return 0;
  let v = num(L[0].kg);
  for (const x of L) {
    if (String(x.d) <= String(d)) v = num(x.kg);
    else break;
  }
  return v;
}
function bmLast() {
  const L = bmList();
  return L.length ? L[L.length - 1] : null;
}
function pl1(v) {
  return String(Math.round(num(v) * 10) / 10).replace(".", ",");
}
function bwMigrate() {
  if (!bmList().length) return -1;
  let n = 0,
    ch = false;
  for (const x of sessions) {
    if (x.bw2) continue;
    const m = bmAt(x.date);
    for (const e of x.ex || [])
      if (BWL.has(e.k) && !e.kind)
        for (const t of e.sets || []) {
          const v = String(t.kg == null ? "" : t.kg).trim();
          if (v) {
            t.kg = pl1(Math.max(0, num(v) - m));
            n++;
          }
        }
    x.bw2 = 1;
    ch = true;
  }
  return ch ? n : -1;
}
function bmSave(kg, d) {
  const v = Math.round(num(kg) * 10) / 10;
  if (!(v >= 30 && v <= 250)) return null;
  d = d || today();
  const L = bmList().filter((x) => x.d !== d);
  L.push({ d, kg: v });
  L.sort((a, b) => String(a.d).localeCompare(String(b.d)));
  ls.set(P + "bm", L.slice(-400));
  const n = bwMigrate();
  saveSessions();
  return { v, n };
}
const DB1 = new Set([
  "ohext1",
  "ohext",
  "dbrow",
  "goblet",
  "kbswing",
  "pullover",
  "conccurl",
  "kickback",
  "sidebend",
  "suitcase",
  "landmine",
]);
const TONX = new Set([
  ...BW,
  "hang",
  "hollow",
  "copen",
  "hangraise",
  "mbslam",
  "mbrot",
  "mbchest",
  "boxjump",
  "broadjump",
  "plyopush",
  "pogo",
  "lmpunch",
  "stepdown",
]);
function rOf(k) {
  const c = CATALOG[k];
  return c ? String(c.r || "") : "";
}
function tonRule(k) {
  const c = CATALOG[k] || {};
  const r = rOf(k);
  if (c.kind) return { x: "poza sekcją Ćwiczenia" };
  if (BWL.has(k)) return { f: 1, l: "masa ciała + obciążenie" };
  if (TONX.has(k)) return { x: "ciężar ciała" };
  if (!TONF.has(k) && /\d\s*(s|sek|min)\b|\d\s*m\b|^max$/i.test(r)) return { x: "na czas lub dystans" };
  let f = 1;
  const l = [];
  if (DB.has(k) && !DB1.has(k)) {
    f *= 2;
    l.push("2 hantle");
  }
  if (CAB2.has(k)) {
    f *= 2;
    l.push("2 linki");
  }
  if (PLATE2.has(k)) {
    f *= 2;
    l.push("2 strony");
  }
  if (/\/(nogę|rękę|str)/.test(r) || /jednorącz|jednonóż|na jednej nodze/i.test(c.n || "")) {
    f *= 2;
    l.push("2 strony");
  }
  return { f, l: l.join(" × ") };
}
function vf(k) {
  const R = tonRule(k);
  return R.x ? 0 : R.f;
}
function exVol(e, s) {
  if (e.kind) return 0;
  const f = vf(e.k);
  if (!f) return 0;
  const nb = BWL.has(e.k) && s && s.bw2;
  const bm = nb ? bmAt(s.date) : 0;
  let v = 0;
  for (const t of e.sets || []) {
    let kg = num(t.kg);
    const r = parseInt(t.r) || 0;
    if (nb) {
      if (!r) continue;
      kg += bm;
    }
    if (kg <= 1000 && r <= 200) v += kg * r;
  }
  return v * f;
}
function volOf(s) {
  return Math.round((s.ex || []).reduce((a, e) => a + exVol(e, s), 0));
}
// Serie do rankingu i porównań: wszystkie serie z wpisem w sekcji Ćwiczenia, razem z R1/R2 (bez listy rozgrzewki, dynamiki, core i cardio z planu)
function setsOfS(s) {
  let n = 0;
  for (const e of s.ex || []) {
    if (e.kind) continue;
    for (const t of e.sets || []) {
      if (String(t.kg || "").trim() || String(t.r || "").trim()) n++;
    }
  }
  return n;
}
function fmtKg(v) {
  return Math.round(v).toLocaleString("pl") + " kg";
}
function fmtT(v) {
  return v >= 1000 ? (Math.round(v / 100) / 10).toLocaleString("pl") + " t" : fmtKg(v);
}
function monOf(d) {
  const x = new Date(String(d) + "T12:00:00");
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
const RULES_V = 4; // podbij przy zmianie zasad liczenia tonażu/serii
function saveSessions() {
  sessions.forEach((x) => {
    x.vol = volOf(x);
    x.nsets = setsOfS(x);
    x.rv = RULES_V;
  });
  const ok = ls.set(P + "sessions", sessions);
  ls.set(P + "changed", Date.now());
  try {
    cloudDirty();
  } catch (e) {
    blad("oznaczenie zmian do chmury", e);
  }
  return ok;
}
function reloadSessions() {
  sessions = (ls.get(P + "sessions") || []).map((x) => Object.assign(x, { local: true }));
  sortS();
}
function sessOf(d) {
  return sessions
    .filter((x) => x.day === d)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.created || 0) - (b.created || 0));
}
function renderWeeks() {
  const list = sessOf(day),
    cur = list.length + 1,
    max = Math.max(9, cur);
  week = cur;
  $("tLbl").innerHTML =
    "Trening " + dl(day) + ' – numer <button class="tip" data-tip="tnum" aria-label="Wyjaśnienie">?</button>';
  $("tgrid").innerHTML = Array.from({ length: max }, (_, i) => {
    const t = i + 1,
      done = t < cur,
      isCur = t === cur,
      sel = viewT === i || (viewT === null && isCur);
    return (
      '<button data-t="' +
      i +
      '" class="' +
      (done ? "done" : isCur ? "cur" : "fut") +
      '" aria-pressed="' +
      sel +
      '"' +
      (t > cur ? " disabled" : "") +
      ">T" +
      t +
      "</button>"
    );
  }).join("");
  {
    const g = $("tgrid"),
      cb = g.querySelector('[aria-pressed="true"]');
    if (cb) g.scrollLeft = cb.offsetLeft - g.clientWidth / 2 + cb.offsetWidth / 2;
  }
  $("tgrid")
    .querySelectorAll("button:not([disabled])")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const i = +b.dataset.t;
          reloadSessions();
          const l2 = sessOf(day);
          viewT = i < l2.length ? i : null;
          pvDirty = false;
          render();
        })
    );
  $("weekHint").textContent =
    viewT !== null
      ? "Podgląd T" + (viewT + 1) + " · kliknij T" + cur + ", żeby wrócić do dzisiejszego treningu"
      : list.length
        ? "Dziś: T" + cur + " · kliknij wcześniejszy numer, żeby zobaczyć, co wtedy robiłeś"
        : "Pierwszy trening " + dl(day) + " – T1";
  const past = viewT !== null ? list[viewT] : null,
    pv = $("pastView");
  pv.hidden = !past;
  ["exList", "finish"].forEach((id) => {
    $(id).hidden = !!past;
  });
  if (past) {
    const exs = past.ex || [];
    let h =
      '<div class="ex plain pvedit"><div class="exh"><span class="exn">Trening ' +
      esc(dl(past.day)) +
      " · T" +
      (viewT + 1) +
      '</span><span class="target">' +
      fmtDate(past.date) +
      '</span></div><div class="hint">Możesz poprawić wpisy i zapisać zmiany.</div>';
    exs.forEach((e, ei) => {
      if (e.kind) return;
      let wi = 0,
        ri = 0;
      h +=
        '<div class="pvx"><div class="pvn">' +
        esc(e.n) +
        '</div><div class="pvsets">' +
        (e.sets || [])
          .map(
            (t, si) =>
              '<div class="pvrow' +
              (t.w ? " w" : "") +
              '"><span class="n">' +
              (t.w ? "R" + ++wi : ++ri) +
              '</span><input id="pv_' +
              ei +
              "_" +
              si +
              '_kg" inputmode="decimal" value="' +
              esc(t.kg || "") +
              '" placeholder="kg" aria-label="kg"><input id="pv_' +
              ei +
              "_" +
              si +
              '_r" inputmode="numeric" value="' +
              esc(t.r || "") +
              '" placeholder="powt." aria-label="powtórzenia"><button class="x" data-pvdel="' +
              ei +
              "_" +
              si +
              '" aria-label="Usuń serię">✕</button></div>'
          )
          .join("") +
        '</div><div class="pvtools"><button class="mini" data-pvadd="' +
        ei +
        '">+ seria</button><label>RIR <input id="pv_' +
        ei +
        '_rir" inputmode="numeric" value="' +
        esc(e.rir || "") +
        '"></label></div></div>';
    });
    h +=
      '<div class="row2"><div class="field"><label class="lbl" for="pv_date">Data</label><input type="date" id="pv_date" value="' +
      esc(past.date) +
      '"></div><div class="field"><label class="lbl" for="pv_bw">Masa (kg)</label><input id="pv_bw" inputmode="decimal" value="' +
      esc(past.bw || "") +
      '"></div></div>';
    h +=
      '<div class="field"><label class="lbl" for="pv_notes">Notatki</label><textarea id="pv_notes" rows="2">' +
      esc(past.notes || "") +
      "</textarea></div>";
    h +=
      '<button class="save" id="pvSave">Zapisz poprawki</button><div class="tools"><button class="mini plus" id="pvBack">← Wróć do T' +
      cur +
      '</button><button class="del" id="pvDel">Usuń ten trening</button></div></div>';
    pv.innerHTML = h;
    const pull = () => {
      exs.forEach((e, ei) => {
        if (e.kind) return;
        (e.sets || []).forEach((t, si) => {
          const k = $("pv_" + ei + "_" + si + "_kg"),
            r = $("pv_" + ei + "_" + si + "_r");
          if (k) t.kg = k.value.trim();
          if (r) t.r = r.value.trim();
        });
        const ri = $("pv_" + ei + "_rir");
        if (ri) e.rir = ri.value.trim();
      });
    };
    pv.querySelectorAll("[data-pvdel]").forEach(
      (b) =>
        (b.onclick = () => {
          pull();
          const [ei, si] = b.dataset.pvdel.split("_").map(Number);
          exs[ei].sets.splice(si, 1);
          pvDirty = true;
          renderWeeks();
        })
    );
    pv.querySelectorAll("[data-pvadd]").forEach(
      (b) =>
        (b.onclick = () => {
          pull();
          const e = exs[+b.dataset.pvadd];
          const last = [...(e.sets || [])].reverse().find((t) => !t.w) || {};
          (e.sets = e.sets || []).push({ kg: last.kg || "", r: "" });
          pvDirty = true;
          renderWeeks();
        })
    );
    $("pvSave").onclick = () => {
      pull();
      past.date = $("pv_date").value || past.date;
      past.bw = $("pv_bw").value.trim();
      past.notes = $("pv_notes").value.trim();
      sortS();
      saveSessions();
      pvDirty = false;
      viewT = null;
      render();
      renderHist();
      toast("Poprawki zapisane.", true);
      window.scrollTo({ top: 0 });
    };
    $("pvBack").onclick = () => {
      viewT = null;
      pvDirty = false;
      reloadSessions();
      render();
      window.scrollTo({ top: 0 });
    };
    $("pvDel").onclick = () => {
      const b = $("pvDel");
      if (b.dataset.armed !== "1") {
        b.dataset.armed = "1";
        b.textContent = "Na pewno usunąć? Kliknij ponownie";
        return;
      }
      sessions = sessions.filter((x) => x !== past);
      saveSessions();
      viewT = null;
      render();
      renderHist();
      toast("Usunięto trening.");
    };
  }
}
// ===== Zmiana kolejności ćwiczeń (tryb ze strzałkami) =====
var ordMode = false,
  ordDay = null;
const ssPick = {};
const SECTN = { dyn: "Dynamika", str: "Ćwiczenia", core: "Core", cardio: "Cardio na koniec" };
function renderOrd(box, list) {
  const st = S();
  const kinds = list.map((e) => e.kind || "str");
  let h =
    '<div class="ordbar"><span class="ordhint">Przesuwasz w obrębie sekcji</span><button class="ordbtn done" id="ordDone">Gotowe</button></div><div class="ord">';
  let last = null;
  list.forEach((e, i) => {
    const k = kinds[i];
    if (k !== last) {
      h += '<div class="ordg">' + SECTN[k] + "</div>";
      last = k;
    }
    const n = nSets(e);
    let dn = 0;
    for (let j = 0; j < n; j++) if (st.done[e.k + "_" + j]) dn++;
    const up = i > 0 && kinds[i - 1] === k,
      down = i < list.length - 1 && kinds[i + 1] === k;
    h +=
      '<div class="ordr' +
      (oid(e) === st.moved ? " moved" : "") +
      (n && dn >= n ? " done" : "") +
      '"><span class="no">' +
      (i + 1) +
      '</span><div class="nm">' +
      esc(e.n) +
      "<small>" +
      n +
      " × " +
      esc(e.r) +
      (e.ss ? " · superseria " + esc(e.ss) : "") +
      '</small></div><div class="ar"><button data-mv="-1" data-id="' +
      oid(e) +
      '" aria-label="Przesuń wyżej: ' +
      esc(e.n) +
      '"' +
      (up ? "" : " disabled") +
      '>▲</button><button data-mv="1" data-id="' +
      oid(e) +
      '" aria-label="Przesuń niżej: ' +
      esc(e.n) +
      '"' +
      (down ? "" : " disabled") +
      ">▼</button></div></div>";
  });
  const w = document.createElement("div");
  w.innerHTML = h + "</div>";
  box.append(w);
  w.querySelector("#ordDone").onclick = () => {
    ordMode = false;
    renderEx(true);
    updSum();
    const b = document.querySelector("#exList .ordbar");
    if (b) b.scrollIntoView({ block: "start" });
  };
  w.querySelectorAll("[data-mv]").forEach((b) => (b.onclick = () => ordMove(b.dataset.id, +b.dataset.mv)));
}
function ordMove(id, dir, mode) {
  const st = S();
  const L = exList();
  const ids = L.map(oid);
  const kinds = L.map((e) => e.kind || "str");
  const i = ids.indexOf(id);
  if (i < 0) return;
  const e = L[i];
  const pt = e.ss ? (L[i - 1] && L[i - 1].ss === e.ss ? i - 1 : L[i + 1] && L[i + 1].ss === e.ss ? i + 1 : -1) : -1;
  mode = mode || ssPick[id];
  if (pt >= 0 && !mode) {
    askSS(e, L[pt], (m) => {
      ssPick[id] = m;
      ordMove(id, dir, m);
    });
    return;
  }
  let a = i,
    b = i;
  if (pt >= 0 && mode === "pair") {
    a = Math.min(i, pt);
    b = Math.max(i, pt);
  }
  const blk = (j) => {
    let x = j,
      y = j;
    const q = L[j];
    if (q.ss) {
      if (L[j - 1] && L[j - 1].ss === q.ss && (j - 1 < a || j - 1 > b)) x = j - 1;
      else if (L[j + 1] && L[j + 1].ss === q.ss && (j + 1 < a || j + 1 > b)) y = j + 1;
    }
    return [x, y];
  };
  const m = b - a + 1;
  if (dir < 0) {
    const j = a - 1;
    if (j < 0 || kinds[j] !== kinds[i]) return;
    const [x] = blk(j);
    const mv = ids.splice(a, m);
    ids.splice(x, 0, ...mv);
  } else {
    const j = b + 1;
    if (j >= ids.length || kinds[j] !== kinds[i]) return;
    const [, y] = blk(j);
    const mv = ids.splice(a, m);
    ids.splice(y - m + 1, 0, ...mv);
  }
  st.order = ids;
  st.moved = id;
  persist();
  renderEx(true);
  updSum();
  const r = document.querySelector('.ordr [data-id="' + id + '"]');
  if (r) r.closest(".ordr").scrollIntoView({ block: "nearest" });
}
// Ochrona przed literówkami: pytanie, gdy ciężar jest ponad 2× większy niż Twój najlepszy w tym ćwiczeniu (albo > 300 kg bez historii) lub powtórzeń > 60
function bestKg(k) {
  let b = 0;
  for (const s of sessions)
    for (const e of s.ex || [])
      if (e.k === k && !e.kind)
        for (const t of e.sets || []) {
          const kg = num(t.kg);
          if (kg <= 1000 && kg > b) b = kg;
        }
  return b;
}
$("exList").addEventListener("change", (ev) => {
  const el = ev.target;
  if (!el || el.tagName !== "INPUT" || !el.value || el.dataset.ok === el.value) return;
  const m = el.id.match(/^(.+)_(w?kg|w?r)_(\d+)$/);
  if (!m) return;
  const k = m[1],
    isKg = /kg$/.test(m[2]);
  const v = isKg ? num(el.value) : parseInt(el.value) || 0;
  const c = CATALOG[k] || {};
  let msg = "";
  if (isKg) {
    const b = bestKg(k);
    if (b >= 5 && v > 2 * b)
      msg =
        "Wpisałeś " +
        String(el.value) +
        " kg w ćwiczeniu „" +
        (c.n || k) +
        "”. To ponad 2× więcej niż Twój dotychczasowy najlepszy wynik (" +
        String(b).replace(".", ",") +
        " kg). Na pewno?";
    else if (!b && v > 300) msg = "Wpisałeś " + String(el.value) + " kg w ćwiczeniu „" + (c.n || k) + "”. Na pewno?";
  } else if (v > 60) msg = "Wpisałeś " + v + " powtórzeń w ćwiczeniu „" + (c.n || k) + "”. Na pewno?";
  if (!msg) return;
  $("valAskB").textContent = msg;
  $("valAsk").hidden = false;
  $("valOk").onclick = () => {
    el.dataset.ok = el.value;
    $("valAsk").hidden = true;
  };
  $("valFix").onclick = () => {
    $("valAsk").hidden = true;
    el.value = "";
    try {
      persist();
      updSum();
    } catch (e) {
      blad("zapis po poprawce wpisu", e);
    }
    el.focus();
  };
});
// Jednorazowe pytania kontrolne (np. podejrzany wpis) – pokazywane przy uruchomieniu, aż do odpowiedzi
const ASKS = [
  {
    id: "cc40b",
    prof: "",
    date: "2026-11-24",
    k: "cablecross",
    kg: "40",
    half: true,
    yes: "Tak, 40 kg na każdą stronę",
    no: "Nie, 40 kg razem z obu stron",
    txt: "W treningu A z 24.11 wpisałeś w rozpiętkach na bramie 40 kg × 12. Czy to ciężar na jedną stronę – każda linka osobno? Od teraz przy bramie wpisuje się ciężar jednej strony, a aplikacja liczy obie.",
  },
];
function askOnce() {
  const q = ASKS.find(
    (a) =>
      a.prof === PROF &&
      !ls.get(P + "ask_" + a.id) &&
      sessions.some(
        (s) =>
          s.date === a.date &&
          (s.ex || []).some((e) => e.k === a.k && (e.sets || []).some((t) => String(t.kg) === a.kg))
      )
  );
  if (!q) return;
  $("qAskB").textContent = q.txt;
  $("qFixBox").hidden = true;
  $("qYes").textContent = q.yes || "Tak, zgadza się";
  $("qFix").textContent = q.no || "Popraw ciężar";
  $("qAsk").hidden = false;
  $("qYes").onclick = () => {
    ls.set(P + "ask_" + q.id, "ok");
    $("qAsk").hidden = true;
    toast("Dzięki! Zostaje " + q.kg + " kg" + (q.half ? " na stronę." : "."), true);
  };
  $("qLater").onclick = () => {
    $("qAsk").hidden = true;
  };
  $("qFix").onclick = () => {
    if (q.half) {
      const v = String(num(q.kg) / 2).replace(".", ",");
      let n = 0;
      for (const s of sessions)
        if (s.date === q.date)
          for (const e of s.ex || [])
            if (e.k === q.k)
              for (const t of e.sets || [])
                if (String(t.kg) === q.kg) {
                  t.kg = v;
                  n++;
                }
      saveSessions();
      renderHist();
      ls.set(P + "ask_" + q.id, "half:" + v);
      $("qAsk").hidden = true;
      toast("Zmieniono na " + v + " kg na stronę (" + q.kg + " kg razem). Dzięki!", true);
      return;
    }
    if ($("qFixBox").hidden) {
      $("qFixBox").hidden = false;
      $("qFix").textContent = "Zapisz poprawkę";
      $("qKg").focus();
      return;
    }
    const v = $("qKg").value.trim().replace(".", ",");
    if (!(num(v) > 0)) {
      $("qKg").focus();
      return;
    }
    let n = 0;
    for (const s of sessions)
      if (s.date === q.date)
        for (const e of s.ex || [])
          if (e.k === q.k)
            for (const t of e.sets || [])
              if (String(t.kg) === q.kg) {
                t.kg = v;
                n++;
              }
    saveSessions();
    renderHist();
    ls.set(P + "ask_" + q.id, "fixed:" + v);
    $("qAsk").hidden = true;
    toast("Poprawiono " + n + " " + (n === 1 ? "serię" : "serie") + " na " + v + " kg. Dzięki!", true);
  };
}
function askSS(e, p, cb) {
  $("ssAskB").innerHTML =
    "„" +
    esc(e.n) +
    "” jest w superserii " +
    esc(e.ss) +
    " z „" +
    esc(p.n) +
    "”. Przesunąć tylko to ćwiczenie? Wtedy zrobisz je osobno, z normalną przerwą.";
  $("ssAsk").hidden = false;
  $("ssOne").onclick = () => {
    $("ssAsk").hidden = true;
    cb("one");
  };
  $("ssPair").onclick = () => {
    $("ssAsk").hidden = true;
    cb("pair");
  };
  $("ssNo").onclick = () => {
    $("ssAsk").hidden = true;
  };
}
function orderChanged() {
  const st = S();
  if (!st.order || !st.order.length) return false;
  return exList(true).map(oid).join("|") !== exList().map(oid).join("|");
}
function orderToPlan(d) {
  const ids = exList().map(oid);
  const P_ = PLAN[d];
  const byK = {};
  P_.ex.forEach((e) => (byK[e.k] = e));
  const sorted = ids.filter((id) => byK[id]).map((id) => byK[id]);
  let q = 0;
  let ne = P_.ex.map((e) => (ids.includes(e.k) ? sorted[q++] : e));
  ne = ne.map((e, i, a) =>
    e.ss && !((a[i - 1] && a[i - 1].ss === e.ss) || (a[i + 1] && a[i + 1].ss === e.ss))
      ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== "ss"))
      : e
  );
  P_.ex = ne;
  ls.set(P + "plan", PLAN);
  ls.set(P + "changed", Date.now());
  try {
    cloudDirty();
  } catch (e) {
    blad("oznaczenie zmian do chmury", e);
  }
}
let ordKeep = "today";
function renderEx(fromDraft) {
  if (ordMode && ordDay !== day) ordMode = false;
  const st = S();
  const keep = fromDraft ? st.vals : snap();
  const box = $("exList");
  box.innerHTML = "";
  const list = exList();
  const used = new Set(list.map((e) => e.k));
  const wl = (PLAN[day] && PLAN[day].warm) || WARM[day] || WARM.A || [];
  const wd = wl.filter((w, i) => st.done["wu_" + i]).length;
  const wu = document.createElement("details");
  wu.className = "wup";
  if (st.wuOpen) wu.open = true;
  wu.innerHTML =
    '<summary><span><b>Rozgrzewka</b> · 5–7 min</span><span class="wcount">' +
    wd +
    "/" +
    wl.length +
    '</span></summary><div class="whint">Zrób po kolei i odhaczaj ✓ <button class="tip" data-tip="warm" aria-label="Wyjaśnienie">?</button></div><ol class="wlist">' +
    wl
      .map(
        (w, i) =>
          '<li><div class="wfig">' +
          (FX.F[w.f] || FIG[w.f] || "") +
          '</div><div class="wtxt"><div class="wn">' +
          w.n +
          ' <span class="wd">' +
          w.d +
          '</span></div><div class="wc">' +
          w.c +
          '</div></div><button class="ok" data-wu="' +
          i +
          '" aria-pressed="' +
          !!st.done["wu_" + i] +
          '" aria-label="Zrobione">✓</button></li>'
      )
      .join("") +
    "</ol>";
  wu.addEventListener("toggle", () => {
    st.wuOpen = wu.open;
    persist();
  });
  if (!ordMode) box.append(wu);
  if (list.length > 1 && !ordMode) {
    const ob = document.createElement("div");
    ob.className = "ordbar";
    ob.innerHTML =
      '<span class="ordhint">Maszyna zajęta? Zmień kolejność</span><button class="ordbtn" id="ordGo">⇅ Kolejność</button>';
    box.append(ob);
    ob.querySelector("#ordGo").onclick = () => {
      persist();
      ordMode = true;
      ordDay = day;
      renderEx(true);
      updSum();
      ob.scrollIntoView({ block: "start" });
    };
  }
  if (ordMode) {
    renderOrd(box, list);
    return;
  }
  const SECT = {
    dyn: ["Dynamika", "na świeżo, każde powtórzenie na 100% szybkości, pełna przerwa 60–90 s"],
    str: ["Ćwiczenia", "złożone: przerwa 2–3 min · izolacje: 60–120 s · zostaw 1–2 powtórzenia w zapasie"],
    core: ["Core", "spokojnie, kontrola ruchu, przerwa 30–45 s"],
    cardio: ["Cardio na koniec", "spokojnie, tętno w Z2"],
  };
  let lastKind = null;
  list.forEach((ex, ix) => {
    const kind = ex.kind || "str";
    if (kind !== lastKind) {
      lastKind = kind;
      const hd = document.createElement("div");
      hd.className = "secth";
      hd.innerHTML =
        "<b>" +
        SECT[kind][0] +
        ' <button class="tip" data-tip="ex" aria-label="Wyjaśnienie">?</button></b>' +
        (SECT[kind][1] ? "<span>" + SECT[kind][1] + "</span>" : "");
      box.append(hd);
    }
    const n = nSets(ex),
      prev = lastFor(ex.k),
      rest = restOf(ex),
      unit = unitOf(ex);
    const c = document.createElement("div");
    c.className = "ex" + (ex.kind ? " lite " + ex.kind : "");
    c.dataset.card = ex.k;
    if (ex.kind) {
      const inf = INFO[ex.k];
      let h =
        '<div class="exhead"><span class="no">' +
        (ix + 1) +
        "<small>/" +
        list.length +
        '</small></span><div class="exttl"><span class="exn">' +
        esc(ex.n) +
        '</span><span class="target">' +
        n +
        " × " +
        ex.r +
        '</span></div><button class="x" data-drop="' +
        ex.k +
        '" aria-label="Usuń z tej sesji">✕</button></div>';
      if (WHY[ex.k]) h += '<div class="why">' + WHY[ex.k] + "</div>";
      if (inf)
        h +=
          '<div class="meta"><details><summary>Jak wykonać</summary><div class="infob">' +
          (FIG[inf[0]] || "") +
          '<div><div class="mus">' +
          inf[1] +
          "</div><ul>" +
          inf
            .slice(2)
            .map((x) => "<li>" + x + "</li>")
            .join("") +
          "</ul></div></div></details></div>";
      h +=
        '<div class="lsets"><span class="lbl">Serie</span>' +
        Array.from(
          { length: n },
          (_, i) =>
            '<button class="ok" data-k="' +
            ex.k +
            '" data-i="' +
            i +
            '" data-rest="' +
            (ex.kind === "dyn" ? 75 : ex.kind === "cardio" ? 0 : 40) +
            '" aria-pressed="' +
            !!st.done[ex.k + "_" + i] +
            '">' +
            (i + 1) +
            "</button>"
        ).join("") +
        "</div>";
      c.innerHTML = h;
      box.append(c);
      return;
    }
    let h =
      '<div class="exhead"><span class="no">' +
      (ix + 1) +
      "<small>/" +
      list.length +
      '</small></span><div class="exttl"><span class="exn">' +
      esc(ex.n) +
      (ex.ss && !ex.swapOf ? '<span class="ss">superseria ' + ex.ss + "</span>" : "") +
      (ex.added ? ' <span class="badge">dodane</span>' : "") +
      (ex.swapOf ? ' <span class="badge">zamiast: ' + esc(CATALOG[ex.swapOf].n) + "</span>" : "") +
      '</span><span class="target">' +
      WEEK[week].f(ex.s) +
      " serie × " +
      ex.r +
      " · przerwa " +
      (ex.ss && !ex.swapOf ? "po obu ćwiczeniach" : rest >= 120 ? "2–3 min" : "60–120 s") +
      '</span></div><button class="x" data-drop="' +
      (ex.swapOf || ex.k) +
      '" aria-label="Usuń ćwiczenie z tej sesji">✕</button></div>';
    h += '<button class="csum" data-open="' + ex.k + '" aria-label="Rozwiń ćwiczenie"></button><div class="cbody">';
    if (WHY[ex.k]) h += '<div class="why">' + WHY[ex.k] + "</div>";
    h += '<div class="meta">';
    const inf = INFO[ex.k];
    if (inf)
      h +=
        '<details><summary>Technika</summary><div class="infob">' +
        figFor(ex.k, inf[0]) +
        '<div><div class="mus">' +
        inf[1] +
        "</div><ul>" +
        inf
          .slice(2)
          .map((x) => "<li>" + x + "</li>")
          .join("") +
        "</ul>" +
        (ERR[ex.k] ? '<div class="err"><b>Częsty błąd:</b> ' + ERR[ex.k] + "</div>" : "") +
        vidLink(ex.n) +
        "</div></div></details>";
    else h += '<details><summary>Technika</summary><div class="infob1">' + vidLink(ex.n) + "</div></details>";
    const alts = (ALT[ex.swapOf || ex.k] || []).filter((a) => !used.has(a) && CATALOG[a]);
    if (ex.swapOf) alts.unshift(ex.swapOf);
    if (alts.length)
      h +=
        '<details><summary>Sprzęt zajęty? Zamień</summary><div class="altl">' +
        alts
          .map(
            (a) =>
              '<button class="mini" data-swap="' +
              (ex.swapOf || ex.k) +
              '" data-to="' +
              a +
              '">' +
              (a === ex.swapOf ? "↩ wróć do: " : "") +
              esc(CATALOG[a].n) +
              "</button>"
          )
          .join("") +
        "</div></details>";
    h += "</div>";
    if (ex.pull)
      h +=
        '<select id="pull_stage" aria-label="Etap podciągania">' +
        PULL.map(
          (p, i) => '<option value="' + i + '"' + (i === pullStage ? " selected" : "") + ">Etap " + p + "</option>"
        ).join("") +
        "</select>";
    h += suggest(ex, prev);
    const sd = (!prev && SEED[day] && SEED[day][ex.k]) || null;
    const sdKg = (v) => (v === "" || v == null ? "" : String(v).replace(".", ","));
    if (sd)
      h +=
        '<div class="prev">Z Twojego planu: ' +
        sd.map((t) => esc((sdKg(t[0]) ? (BWL.has(ex.k) ? "+" : "") + sdKg(t[0]) + "×" : "") + t[1])).join(" · ") +
        "</div>";
    if (prev)
      h +=
        '<div class="prev">Ostatnio ' +
        fmtDate(prev.s.date) +
        ": " +
        prev.e.sets
          .filter((t) => t.kg || t.r)
          .map((t) => esc((t.kg ? (BWL.has(ex.k) && prev.s.bw2 ? "+" : "") + t.kg + "×" : "") + (t.r || "–")))
          .join(" · ") +
        (prev.e.rir ? " · RIR " + esc(prev.e.rir) : "") +
        "</div>";
    if (BWL.has(ex.k)) {
      const b = bmLast();
      h +=
        '<div class="hint bwl">⚖️ W kg wpisz tylko <b>dodatkowe kg</b> do masy własnej: bez obciążenia 0, z pasem np. 7,5. ' +
        (b
          ? "Masę ciała (" + pl1(b.kg) + " kg) aplikacja doda sama."
          : 'Do tonażu potrzebna jest Twoja masa ciała – <button class="q" data-bm>wpisz ją</button>.') +
        "</div>";
    } else if (BW.has(ex.k))
      h +=
        '<div class="hint bwl">⚖️ W kg wpisz tylko <b>dodatkowe kg</b> do masy własnej (np. talerz) – albo zostaw puste.</div>';
    else if (PLATE2.has(ex.k))
      h +=
        '<div class="hint bwl">🔩 Wpisz talerze z <b>jednej strony</b> (np. 2 × 10 kg z każdej strony → wpisz 20). Aplikacja policzy obie strony.</div>';
    else if (CAB2.has(ex.k))
      h +=
        '<div class="hint bwl">🔗 Wpisz ciężar <b>jednej strony</b> (jednego stosu). Aplikacja sama policzy obie linki.</div>';
    else if (DB.has(ex.k) && !DB1.has(ex.k))
      h +=
        '<div class="hint bwl">🏋️ Wpisz ciężar <b>jednego</b> hantla (2 × 15 kg → wpisz 15). Aplikacja sama policzy oba.</div>';
    else if (DB1.has(ex.k)) h += '<div class="hint bwl">🏋️ Wpisz ciężar hantla lub odważnika, którym ćwiczysz.</div>';
    h +=
      '<div class="sets"><div class="set cols"><span><button class="tip" data-tip="sets" aria-label="Wyjaśnienie">?</button></span><span>' +
      (DB.has(ex.k)
        ? "kg / hantel"
        : CAB2.has(ex.k) || PLATE2.has(ex.k)
          ? "kg / stronę"
          : BWL.has(ex.k) || BW.has(ex.k)
            ? "+ kg do masy"
            : "kg") +
      "</span><span>" +
      unit +
      "</span><span>✓</span></div>";
    if (ex.m) {
      const top = prev ? Math.max(...prev.e.sets.map((t) => num(t.kg))) : 0;
      const wuOpen = st.wus[ex.k] || [0, 1].some((i) => keep[ex.k + "_wkg_" + i] || keep[ex.k + "_wr_" + i]);
      h +=
        '<button class="wutog" data-wus="' +
        ex.k +
        '" aria-expanded="' +
        wuOpen +
        '">' +
        (wuOpen ? "− " : "+ ") +
        'serie rozgrzewkowe (R1, R2)</button><div class="wubox"' +
        (wuOpen ? "" : " hidden") +
        ">";
      [
        [0.5, "10"],
        [0.75, "5"],
      ].forEach(([f, r], i) => {
        h +=
          '<div class="set wu"><span class="n">R' +
          (i + 1) +
          '</span><input id="' +
          ex.k +
          "_wkg_" +
          i +
          '" inputmode="decimal" placeholder="' +
          (top ? r25(top * f) : Math.round(f * 100) + "%") +
          '" aria-label="Rozgrzewka ' +
          (i + 1) +
          ' kg"><input id="' +
          ex.k +
          "_wr_" +
          i +
          '" inputmode="numeric" placeholder="' +
          r +
          '" aria-label="Rozgrzewka ' +
          (i + 1) +
          ' powtórzenia"><span></span></div>';
      });
      h += '</div><div class="wul">Serie robocze</div>';
    }
    for (let i = 0; i < n; i++) {
      const p = prev && prev.e.sets[i];
      h +=
        '<div class="set"><span class="n">' +
        (i + 1) +
        '</span><input id="' +
        ex.k +
        "_kg_" +
        i +
        '" inputmode="decimal" placeholder="' +
        (p && p.kg ? esc(p.kg) : sd && sd[i] && sdKg(sd[i][0]) ? sdKg(sd[i][0]) : BWL.has(ex.k) ? "0" : "kg") +
        '" aria-label="Seria ' +
        (i + 1) +
        " " +
        (BWL.has(ex.k) || BW.has(ex.k) ? "dodatkowe kg" : "kg") +
        '"><input id="' +
        ex.k +
        "_r_" +
        i +
        '" inputmode="numeric" placeholder="' +
        (p && p.r ? esc(p.r) : sd && sd[i] ? esc(String(sd[i][1])) : unit) +
        '" aria-label="Seria ' +
        (i + 1) +
        " " +
        unit +
        '"><button class="ok" data-k="' +
        ex.k +
        '" data-i="' +
        i +
        '" data-rest="' +
        rest +
        '" aria-pressed="' +
        !!st.done[ex.k + "_" + i] +
        '" aria-label="Seria zrobiona">✓</button></div>';
    }
    h +=
      '</div><div class="tools"><button class="mini" data-add="' +
      ex.k +
      '">+ seria</button>' +
      '<button class="mini" data-rm="' +
      ex.k +
      '"' +
      (n <= 1 ? " disabled" : "") +
      ">− seria</button></div>";
    h +=
      '<div class="field"><span class="lbl">RIR ostatniej serii · cel ' +
      RIRT[week] +
      ' <button class="q" data-rirhelp>co to?</button></span><div class="chips" data-k="' +
      ex.k +
      '">' +
      [0, 1, 2, 3, 4].map((v) => '<button data-v="' + v + '">' + (v === 4 ? "4+" : v) + "</button>").join("") +
      '</div><input type="hidden" id="' +
      ex.k +
      '_rir"></div>';
    h += "</div>";
    c.innerHTML = h;
    box.append(c);
    cardState(ex.k, c, n);
  });
  if (st.removed.length) {
    const rr = document.createElement("div");
    rr.className = "hint";
    rr.innerHTML =
      "Usunięte z tej sesji: " +
      esc(st.removed.map((k) => (CATALOG[k] ? CATALOG[k].n : k)).join(", ")) +
      ' · <button class="q" id="restoreEx">przywróć</button>';
    box.append(rr);
  }
  const addRow = document.createElement("div");
  addRow.className = "addex";
  addRow.innerHTML =
    '<select id="catalog" aria-label="Katalog ćwiczeń"><option value="">Dodaj ćwiczenie z katalogu…</option>' +
    GORDER.map((g) => {
      const it = Object.values(CATALOG)
        .filter((e) => e.g === g && !used.has(e.k))
        .sort((a, b) => a.n.localeCompare(b.n, "pl"));
      return it.length
        ? '<optgroup label="' +
            g +
            '">' +
            it
              .map((e) => '<option value="' + e.k + '">' + esc(e.n) + " · " + e.s + "×" + esc(e.r) + "</option>")
              .join("") +
            "</optgroup>"
        : "";
    }).join("") +
    '</select><button class="mini plus" id="addEx">+ Dodaj</button>';
  box.append(addRow);
  for (const id in keep) {
    const el = $(id);
    if (el) el.value = keep[id];
  }
  box.querySelectorAll(".chips").forEach((c) => {
    const inp = $(c.dataset.k + "_rir");
    const mark = () =>
      c.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === inp.value));
    mark();
    c.querySelectorAll("button").forEach(
      (b) =>
        (b.onclick = () => {
          inp.value = inp.value === b.dataset.v ? "" : b.dataset.v;
          mark();
          persist();
        })
    );
  });
  box.querySelectorAll("[data-rirhelp]").forEach(
    (b) =>
      (b.onclick = () => {
        $("rirSheet").hidden = false;
      })
  );
  box.querySelectorAll("[data-add]").forEach(
    (b) =>
      (b.onclick = () => {
        st.extra[b.dataset.add] = (st.extra[b.dataset.add] || 0) + 1;
        renderEx();
      })
  );
  box.querySelectorAll("[data-rm]").forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.rm;
        const ex = exList().find((e) => e.k === k);
        if (!ex || nSets(ex) <= 1) return;
        const last = nSets(ex) - 1;
        st.extra[k] = (st.extra[k] || 0) - 1;
        delete st.done[k + "_" + last];
        renderEx();
      })
  );
  box.querySelectorAll("[data-drop]").forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.armed !== "1") {
          b.dataset.armed = "1";
          b.textContent = "Usuń?";
          b.classList.add("armed");
          setTimeout(() => {
            if (b.isConnected) {
              b.dataset.armed = "";
              b.textContent = "✕";
              b.classList.remove("armed");
            }
          }, 3000);
          return;
        }
        const k = b.dataset.drop;
        if (st.added.includes(k)) st.added = st.added.filter((x) => x !== k);
        else {
          st.removed.push(k);
          delete st.swaps[k];
        }
        renderEx();
      })
  );
  box.querySelectorAll("[data-swap]").forEach(
    (b) =>
      (b.onclick = () => {
        const o = b.dataset.swap,
          t = b.dataset.to;
        if (t === o) delete st.swaps[o];
        else st.swaps[o] = t;
        renderEx();
      })
  );
  box.querySelectorAll("[data-wu]").forEach(
    (b) =>
      (b.onclick = () => {
        const key = "wu_" + b.dataset.wu;
        st.done[key] = !st.done[key];
        b.setAttribute("aria-pressed", st.done[key]);
        box.querySelector(".wcount").textContent = wl.filter((w, i) => st.done["wu_" + i]).length + "/" + wl.length;
        persist();
      })
  );
  box.querySelectorAll("[data-wus]").forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.wus;
        const bx = b.nextElementSibling;
        const o = bx.hidden;
        bx.hidden = !o;
        st.wus[k] = o;
        b.setAttribute("aria-expanded", o);
        b.textContent = (o ? "− " : "+ ") + "serie rozgrzewkowe (R1, R2)";
        persist();
      })
  );
  box.querySelectorAll("[data-open]").forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.open;
        st.open[k] = !st.open[k];
        const c = b.closest(".ex");
        cardState(k, c, c.querySelectorAll(".ok[data-k]").length);
        persist();
      })
  );
  box.querySelectorAll(".ok[data-k]").forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.k,
          i = b.dataset.i,
          key = k + "_" + i;
        st.done[key] = !st.done[key];
        b.setAttribute("aria-pressed", st.done[key]);
        if (st.done[key]) {
          [$(k + "_kg_" + i), $(k + "_r_" + i)].forEach((el) => {
            if (el && !el.value && /^\d+([.,]\d+)?$/.test(el.placeholder)) el.value = el.placeholder;
          });
          spread(k, +i);
          if (+b.dataset.rest) startRest(+b.dataset.rest);
          wake();
        }
        if (!st.done[key]) st.open[k] = false;
        updSum();
        persist();
        const c = b.closest(".ex");
        if (c && c.dataset.card) cardState(k, c, c.querySelectorAll(".ok[data-k]").length);
      })
  );
  if ($("restoreEx"))
    $("restoreEx").onclick = () => {
      st.removed = [];
      renderEx();
    };
  $("addEx").onclick = () => {
    const k = $("catalog").value;
    if (k && isX(day)) {
      const c = CATALOG[k];
      PLAN[day].ex.push(
        Object.assign({ k, n: c.n, s: c.s || 3, r: c.r || "8–12", m: c.m ? 1 : 0 }, c.kind ? { kind: c.kind } : {})
      );
      PLAN[day].warm = genWarm(PLAN[day].ex);
      ls.set(P + "plan", PLAN);
      ls.set(P + "changed", Date.now());
      try {
        cloudDirty();
      } catch (e) {
        blad("oznaczenie zmian do chmury", e);
      }
      toast("Dodano do treningu „" + PLAN[day].name + "” – zostanie na kolejne razy.", true);
      renderEx();
      const cards = box.querySelectorAll(".ex");
      cards[cards.length - 1].scrollIntoView({ block: "center" });
      return;
    }
    if (k) {
      st.added.push(k);
      renderEx();
      const cards = box.querySelectorAll(".ex");
      cards[cards.length - 1].scrollIntoView({ block: "center" });
    }
  };
  const ps = $("pull_stage");
  if (ps)
    ps.onchange = () => {
      pullStage = +ps.value;
      ls.set(P + "pull", pullStage);
    };
  box.querySelectorAll(".set.cols .tip").forEach((t, i) => {
    if (i) t.remove();
  });
  updSum();
  persist();
}
function spread(k, i) {
  const v = ($(k + "_kg_" + i) || {}).value;
  if (!v) return;
  for (let j = i + 1; j < 12; j++) {
    const el = $(k + "_kg_" + j);
    if (!el) break;
    if (!el.value) el.placeholder = v;
  }
}
function setSummary(k, c) {
  const parts = [];
  c.querySelectorAll(".set:not(.wu):not(.cols)").forEach((r) => {
    const ins = r.querySelectorAll("input");
    if (ins.length < 2) return;
    const kg = ins[0].value || "",
      rr = ins[1].value || "";
    if (kg || rr) parts.push((kg ? kg + " kg × " : "") + (rr || "–"));
  });
  return parts.join(" · ");
}
function cardState(k, c, n) {
  if (!c || !n) return;
  const st = S();
  let all = true;
  for (let i = 0; i < n; i++)
    if (!st.done[k + "_" + i]) {
      all = false;
      break;
    }
  const col = optCollapse && all && !st.open[k];
  c.classList.toggle("collapsed", col);
  c.classList.toggle("alldone", all);
  const b = c.querySelector(".csum");
  if (b) {
    b.hidden = !all;
    b.innerHTML = col
      ? '<span class="chk">✓</span><span class="cs">' + esc(setSummary(k, c)) + '</span><span class="chev">▾</span>'
      : '<span class="chev">▴ zwiń</span>';
    b.setAttribute("aria-label", col ? "Rozwiń ćwiczenie" : "Zwiń ćwiczenie");
    if (!optCollapse) b.hidden = true;
  }
}
let optCollapse = true;
function render(fromDraft) {
  if (fromDraft) {
    COMMON.forEach((i) => {
      $(i).value = draft.common[i] || "";
    });
  }
  renderSeg();
  renderWeeks();
  renderEx(fromDraft);
}
function collect() {
  week = sessOf(day).length + 1;
  const ex = exList().map((e) => {
    if (e.kind) {
      const d = S().done;
      const sets = [];
      for (let i = 0; i < nSets(e); i++) if (d[e.k + "_" + i]) sets.push({ r: e.r, done: true });
      return { k: e.k, n: e.n, kind: e.kind, sets };
    }
    const sets = [];
    if (e.m)
      for (let i = 0; i < 2; i++) {
        const kg = $(e.k + "_wkg_" + i).value.trim(),
          r = $(e.k + "_wr_" + i).value.trim();
        if (kg || r) sets.push({ kg, r, w: true });
      }
    for (let i = 0; i < nSets(e); i++)
      sets.push({ kg: $(e.k + "_kg_" + i).value.trim(), r: $(e.k + "_r_" + i).value.trim() });
    const o = { k: e.k, n: e.n, sets, rir: $(e.k + "_rir").value.trim() };
    if (e.pull) o.stage = pullStage + 1;
    if (e.added) o.added = true;
    if (e.swapOf) o.swapOf = e.swapOf;
    return o;
  });
  return {
    day,
    dn: isX(day) ? PLAN[day].name : undefined,
    dur: S().start ? Math.max(1, Math.round((Date.now() - S().start) / 60000)) : undefined,
    week,
    date: $("date").value || today(),
    bw: $("bw").value.trim(),
    notes: $("notes").value.trim(),
    ex,
    bw2: 1,
    created: Date.now(),
  };
}
// Pasek postępu: zrobione serie / zaplanowane + szacowany czas do końca (serie + zaplanowane przerwy)
function secOf(e) {
  const r = String(e.r || "");
  if (e.kind === "cardio") {
    const m = r.match(/(\d+)\s*[–-]\s*(\d+)\s*min/) || r.match(/(\d+)\s*min/);
    return m ? 60 * (m[2] ? (+m[1] + +m[2]) / 2 : +m[1]) : 900;
  }
  const sm = r.match(/(\d+)\s*s\b/);
  if (sm) return +sm[1] * (/str/.test(r) ? 2 : 1) + 5;
  return e.kind === "dyn" ? 20 : e.kind === "core" ? 40 : 45;
}
function restAfter(e, next) {
  if (e.kind === "cardio") return 0;
  if (e.kind === "dyn") return 75;
  if (e.kind === "core") return 40;
  if (e.ss && next && next.ss === e.ss) return 15;
  return restOf(e);
}
function updSum() {
  let sets = 0,
    doneN = 0,
    vol = 0,
    left = 0;
  const st = S();
  const L = exList();
  const todo = [];
  L.forEach((e, j) => {
    const n = nSets(e);
    for (let i = 0; i < n; i++) {
      sets++;
      if (st.done[e.k + "_" + i]) doneN++;
      else todo.push([e, L[j + 1]]);
    }
  });
  vol = curVol();
  todo.forEach(([e, nx], i) => {
    left += secOf(e) + (i < todo.length - 1 ? restAfter(e, nx) : 0);
  });
  const pct = sets ? Math.round((doneN / sets) * 100) : 0;
  const pb = $("pbar");
  if (pb) {
    pb.style.width = pct + "%";
    pb.parentNode.setAttribute("aria-valuenow", pct);
  }
  const eta = doneN >= sets ? "gotowe 💪" : "~" + Math.max(1, Math.round(left / 60)) + " min";
  $("sumTxt").innerHTML =
    '<b class="pct">' +
    pct +
    "%</b> · " +
    doneN +
    "/" +
    sets +
    " serii · " +
    eta +
    (vol ? '<span class="vol"> · ' + Math.round(vol).toLocaleString("pl") + " kg</span>" : "");
}

function prBest(sets, bw) {
  let best = null;
  for (const t of sets) {
    if (t.w) continue;
    const kg = num(t.kg),
      r = parseInt(t.r) || 0;
    if (!r) continue;
    const v = kg ? kg * (1 + r / 30) : r;
    if (!best || v > best.v) best = { v, kg, r };
  }
  return best;
}
function openFinish() {
  if (ordMode) {
    ordMode = false;
    renderEx(true);
  }
  persist();
  const st = S();
  let done = 0,
    filled = 0,
    total = 0,
    vol = 0;
  const prs = [];
  for (const e of exList()) {
    if (e.kind) continue;
    const n = nSets(e);
    const cur = [];
    for (let i = 0; i < n; i++) {
      total++;
      const kg = ($(e.k + "_kg_" + i) || {}).value || "",
        r = ($(e.k + "_r_" + i) || {}).value || "";
      if (st.done[e.k + "_" + i]) done++;
      if (kg || r) {
        filled++;
        cur.push({ kg, r });
      }
    }
    const nb = prBest(cur);
    if (!nb) continue;
    let old = null;
    for (const s of sessions)
      for (const x of s.ex || [])
        if (x.k === e.k && !x.kind) {
          const b = prBest(x.sets || []);
          if (b && (!old || b.v > old.v)) old = b;
        }
    if (old && nb.v > old.v + 1e-9)
      prs.push(
        "<li>🏆 <b>" +
          esc(e.n) +
          "</b>: " +
          (nb.kg ? String(nb.kg).replace(".", ",") + " kg × " : "") +
          nb.r +
          ' <span class="hint">(dotąd najlepiej ' +
          (old.kg ? String(old.kg).replace(".", ",") + " kg × " : "") +
          old.r +
          ")</span></li>"
      );
  }
  vol = curVol();
  const mins = st.start ? Math.max(1, Math.round((Date.now() - st.start) / 60000)) : null;
  $("finStats").innerHTML =
    "<div><b>" +
    (mins !== null ? (mins >= 60 ? Math.floor(mins / 60) + " h " + (mins % 60) + " min" : mins + " min") : "–") +
    "</b><span>czas</span></div><div><b>" +
    curSets() +
    "</b><span>serii z wpisem</span></div><div><b>" +
    Math.round(vol).toLocaleString("pl") +
    " kg</b><span>objętość</span></div>";
  $("finPR").innerHTML =
    (prs.length ? '<div class="lbl">Nowe rekordy</div><ul>' + prs.join("") + "</ul>" : "") +
    (filled < total
      ? '<div class="hint">' +
        (total - filled) +
        " " +
        (total - filled === 1 ? "seria bez wpisu nie zostanie zapisana" : "serie bez wpisu nie zostaną zapisane") +
        ".</div>"
      : "");
  finExtra(vol, mins, prs.length);
  const oc = orderChanged();
  $("finOrd").hidden = !oc;
  if (oc) {
    ordKeep = isX(day) ? "perm" : "today";
    $("finOrdT").textContent =
      "Zapamiętać tę kolejność w planie " +
      (isX(day) ? "„" + dl(day) + "”" : dl(day)) +
      "? Przy „Tylko dziś” następnym razem wróci kolejność z planu.";
    ordSeg();
  }
  $("finSheet").hidden = false;
}

// ===== Podsumowanie: porównanie z poprzednim, rekord objętości, rozpiska, ranking na żywo, udostępnianie =====
let finData = null;
function finExtra(vol, mins, nPR) {
  const prevs = sessions.filter((x) => x.day === day);
  const prev = prevs[0];
  const lbl = dl(day);
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
  let cmp = [];
  if (prev) {
    const pv = volOf(prev);
    const d = pct(vol, pv);
    if (d !== null)
      cmp.push('objętość <b class="' + (d > 0 ? "up" : d < 0 ? "dn" : "") + '">' + (d > 0 ? "+" : "") + d + "%</b>");
    if (prev.dur && mins) {
      const dt = mins - prev.dur;
      cmp.push("czas <b>" + (dt > 0 ? "+" : dt < 0 ? "−" : "±") + Math.abs(dt) + " min</b>");
    }
    const setsP = setsOfS(prev);
    cmp.push("serie " + setsP + " → <b>" + curSets() + "</b>");
  }
  let rec = "";
  const maxDay = Math.max(0, ...prevs.map(volOf)),
    maxAll = Math.max(0, ...sessions.map(volOf));
  if (vol > 0 && prevs.length && vol > maxDay)
    rec =
      '<div class="volrec">🏆 ' +
      (vol > maxAll && sessions.length > prevs.length
        ? "Najcięższy trening w historii"
        : "Najcięższy trening " + esc(lbl) + " w historii") +
      ' <span class="hint">(dotąd ' +
      fmtKg(vol > maxAll ? maxAll : maxDay) +
      ")</span></div>";
  $("finCmp").innerHTML =
    (cmp.length
      ? '<div class="cmp">vs poprzedni ' + esc(lbl) + " (" + fmtDate(prev.date) + "): " + cmp.join(" · ") + "</div>"
      : "") + rec;
  finData = { vol, mins, sets: curSets(), nPR, lbl, t: sessOf(day).length + 1, date: $("date").value || today() };
  finRank();
}
function curEx() {
  return exList()
    .filter((e) => !e.kind)
    .map((e) => {
      const sets = [];
      if (e.m)
        for (let i = 0; i < 2; i++) {
          const kg = (($(e.k + "_wkg_" + i) || {}).value || "").trim(),
            r = (($(e.k + "_wr_" + i) || {}).value || "").trim();
          if (kg || r) sets.push({ kg, r, w: true });
        }
      for (let i = 0; i < nSets(e); i++)
        sets.push({
          kg: (($(e.k + "_kg_" + i) || {}).value || "").trim(),
          r: (($(e.k + "_r_" + i) || {}).value || "").trim(),
        });
      return { k: e.k, n: e.n, sets };
    });
}
function curS() {
  return { ex: curEx(), bw2: 1, date: $("date").value || today() };
}
function curVol() {
  return volOf(curS());
}
function curSets() {
  return setsOfS({ ex: curEx() });
}
async function finRank() {
  const box = $("finRank");
  box.hidden = true;
  if (!CLOUD_URL || !cloud.on || !rankOn()) return;
  box.hidden = false;
  box.innerHTML = '<span class="hint">Sprawdzam ranking tygodnia…</span>';
  try {
    const j = await cloudPost({ pin: cloud.pin, action: "rank", today: today(), rank: rankOn() });
    if (!j || !j.ok) throw 0;
    ls.set(P + "rankc", { at: Date.now(), d: j });
    const inWeek = monOf(finData.date).toDateString() === monOf(today()).toDateString();
    if (!inWeek) {
      box.hidden = true;
      return;
    }
    const ppl = (j.people || []).map((p) => Object.assign({}, p));
    let me = ppl.find((p) => p.me);
    if (!me) {
      box.hidden = true;
      return;
    }
    me.sets += finData.sets;
    if (me.kg != null) me.kg += finData.vol;
    ppl.sort((a, b) => b.sets - a.sets);
    const pos = ppl.findIndex((p) => p.me) + 1,
      others = ppl.filter((p) => !p.me);
    const first = ppl[0];
    let t =
      pos === 1
        ? others.length
          ? "🏆 Z tym treningiem jesteś <b>liderem tygodnia</b>: " +
            me.sets +
            " " +
            plSerie(me.sets) +
            (others[0] ? " (" + esc(others[0].name) + " " + others[0].sets + ")" : "")
          : "🏆 Z tym treningiem masz " + me.sets + " " + plSerie(me.sets) + " w tym tygodniu"
        : "Z tym treningiem: <b>" +
          pos +
          ". miejsce</b> w tygodniu · do lidera (" +
          esc(first.name) +
          ") brakuje Ci " +
          (first.sets - me.sets) +
          " " +
          plSerie(first.sets - me.sets);
    if (me.kg != null) {
      const kp = [...ppl].sort((a, b) => (b.kg || 0) - (a.kg || 0));
      const kpos = kp.findIndex((p) => p.me) + 1;
      t +=
        "<br>🏋️ Kilogramy tygodnia: " + fmtT(me.kg) + " · " + (kpos === 1 ? "<b>1. miejsce</b>" : kpos + ". miejsce");
    }
    box.innerHTML = t;
  } catch (e) {
    box.hidden = true;
  }
}
// --- karta do udostępnienia (obrazek) ---
async function shareCard() {
  if (!finData) return;
  const W = 1080,
    H = 1350,
    c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  try {
    await document.fonts.ready;
  } catch (e) {} // urządzenie może tego nie obsługiwać – bez znaczenia dla danych
  const F = (w, sz, f) => w + " " + sz + "px " + (f || "'Barlow Condensed', 'Arial Narrow', sans-serif");
  const B = "'IBM Plex Sans', system-ui, sans-serif";
  x.fillStyle = "#111413";
  x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W * 0.8, H * 0.1, 50, W * 0.8, H * 0.1, 900);
  g.addColorStop(0, "rgba(249,115,22,.35)");
  g.addColorStop(1, "rgba(249,115,22,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  x.fillStyle = "#f97316";
  x.fillRect(80, 96, 120, 10);
  x.fillStyle = "#e8ebe9";
  x.font = F("700", 64);
  x.fillText("TYTANOWA SIŁA", 80, 190);
  x.fillStyle = "#9aa39e";
  x.font = F("500", 40, B);
  x.fillText("Trening " + finData.lbl + " · T" + finData.t + " · " + fmtDate(finData.date), 80, 260);
  x.fillStyle = "#f97316";
  x.font = F("700", 200);
  x.fillText(fmtT(finData.vol), 72, 500);
  x.fillStyle = "#9aa39e";
  x.font = F("500", 38, B);
  x.fillText("przerzucone na treningu", 80, 560);
  const st = [
    [finData.sets + "", plSerie(finData.sets)],
    [finData.mins ? finData.mins + " min" : "–", "czas"],
    [String(finData.nPR), finData.nPR === 1 ? "rekord" : "rekordy"],
  ];
  st.forEach((v, i) => {
    const X = 80 + i * 320;
    x.fillStyle = "#1d2120";
    x.beginPath();
    x.roundRect ? x.roundRect(X, 620, 290, 170, 24) : x.rect(X, 620, 290, 170);
    x.fill();
    x.fillStyle = "#e8ebe9";
    x.font = F("700", 84);
    x.fillText(v[0], X + 28, 720);
    x.fillStyle = "#9aa39e";
    x.font = F("500", 32, B);
    x.fillText(v[1], X + 28, 766);
  });
  let y = 880;
  x.font = F("600", 36, B);
  const L = curEx()
    .map((e) => ({ n: e.n, v: exVol(e, curS()) }))
    .filter((e) => e.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);
  L.forEach((r) => {
    x.fillStyle = "#e8ebe9";
    let n = r.n;
    while (x.measureText(n).width > 700 && n.length > 4) n = n.slice(0, -2);
    if (n !== r.n) n += "…";
    x.fillText(n, 80, y);
    x.fillStyle = "#f97316";
    x.textAlign = "right";
    x.fillText(fmtKg(r.v), W - 80, y);
    x.textAlign = "left";
    y += 62;
  });
  const prn = [...$("finPR").querySelectorAll("li b")].map((b) => b.textContent).slice(0, 3);
  if (prn.length) {
    y += 30;
    x.fillStyle = "#f97316";
    x.font = F("700", 48);
    x.fillText("🏆 NOWE REKORDY", 80, y);
    y += 58;
    x.font = F("500", 34, B);
    x.fillStyle = "#e8ebe9";
    prn.forEach((n) => {
      while (x.measureText(n).width > 900 && n.length > 4) n = n.slice(0, -2);
      x.fillText(n, 80, y);
      y += 50;
    });
  }
  x.fillStyle = "#6b746f";
  x.font = F("500", 30, B);
  x.fillText("Tytanowa siła · dziennik treningowy", 80, H - 80);
  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  const file = new File([blob], "trening-" + finData.date + ".png", { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Mój trening" });
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  toast("Zapisano obrazek z wynikiem.", true);
}
$("finShare").onclick = () => shareCard();
function ordSeg() {
  $("ordToday").setAttribute("aria-pressed", ordKeep === "today");
  $("ordPerm").setAttribute("aria-pressed", ordKeep === "perm");
}
$("ordToday").onclick = () => {
  ordKeep = "today";
  ordSeg();
};
$("ordPerm").onclick = () => {
  ordKeep = "perm";
  ordSeg();
};
$("finish").onclick = () => openFinish();
$("finBack").onclick = () => {
  $("finSheet").hidden = true;
};
$("save").onclick = async () => {
  const s = collect();
  if (!s.ex.some((e) => !e.kind && e.sets.some((t) => t.kg || t.r))) {
    toast("Wpisz przynajmniej jedną serię.");
    return;
  }
  $("save").disabled = true;
  $("save").textContent = "Zapisuję…";
  s.local = true;
  s.id = "loc" + s.created;
  $("finSheet").hidden = true;
  if (!$("finOrd").hidden && ordKeep === "perm" && PLAN[s.day]) orderToPlan(s.day);
  ordMode = false;
  for (const k in ssPick) delete ssPick[k];
  sessions.unshift(s);
  sortS();
  saveSessions();
  if (s.bw && num(s.bw)) {
    try {
      bmSave(s.bw, s.date);
    } catch (e) {
      blad("zapis masy ciała", e);
    }
  }
  draft[s.day] = blank();
  draft.common = {};
  $("date").value = today();
  dateAuto = true;
  clearInterval(restIv);
  $("rest").hidden = true;
  day = isX(s.day) ? nextReg() || DAYS[0] : NEXT[s.day] || DAYS[0];
  viewT = null;
  render(true);
  renderHist();
  window.scrollTo({ top: 0 });
  afterSave(s);
  $("save").disabled = false;
  $("save").textContent = "Zapisz trening";
};

function bestSet(e) {
  let b = null;
  for (const t of e.sets || []) {
    if (t.w || !(t.kg || t.r)) continue;
    const kg = num(t.kg),
      r = parseInt(t.r) || 0;
    if (!b || kg > b.kg || (kg === b.kg && r > b.r)) b = { kg, r };
  }
  return b;
}
function fmtSet(b) {
  return b ? (b.kg ? String(b.kg).replace(".", ",") + " kg × " + b.r : b.r + " powt.") : "–";
}
function spark(pts) {
  if (pts.length < 2) return "";
  const W = 96,
    H = 28,
    v = pts.map((p) => p.v),
    mn = Math.min(...v),
    mx = Math.max(...v),
    rg = mx - mn || 1;
  const xy = pts.map((p, i) => [4 + (i * (W - 8)) / (pts.length - 1), H - 4 - ((p.v - mn) / rg) * (H - 8)]);
  return (
    '<svg class="spk" viewBox="0 0 ' +
    W +
    " " +
    H +
    '" aria-hidden="true"><polyline points="' +
    xy.map((q) => q.join(",")).join(" ") +
    '"/><circle cx="' +
    xy[xy.length - 1][0] +
    '" cy="' +
    xy[xy.length - 1][1] +
    '" r="3"/></svg>'
  );
}
let tonSel = null;
function bmBlock() {
  const L = bmList();
  if (!L.length)
    return '<div class="ex plain" style="margin-bottom:12px"><div class="exh"><span class="exn">Masa ciała</span></div><div class="hint">Wpisz masę ciała – doda się do tonażu podciągania i dipów, a tutaj zobaczysz, jak się zmienia.</div><button class="mini plus" data-bm>⚖️ Wpisz masę ciała</button></div>';
  const last = L[L.length - 1],
    first = L[0];
  const P2 = L.slice(-26);
  const mn = Math.min(...P2.map((x) => x.kg)),
    mx = Math.max(...P2.map((x) => x.kg));
  const rg = Math.max(1, mx - mn);
  const pts = P2.map((x, i) => [
    P2.length > 1 ? 8 + i * (284 / (P2.length - 1)) : 150,
    10 + 70 * (1 - (x.kg - mn) / rg),
  ]);
  const ch = Math.round((last.kg - first.kg) * 10) / 10;
  const sv =
    P2.length > 1
      ? '<svg class="bmsvg" viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true"><polyline points="' +
        pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ") +
        '"/>' +
        pts.map((p) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3"/>').join("") +
        '</svg><div class="bmax"><span>' +
        fmtDate(P2[0].d) +
        "</span><span>" +
        fmtDate(last.d) +
        "</span></div>"
      : "";
  return (
    '<div class="ex plain" style="margin-bottom:12px"><div class="exh"><span class="exn">Masa ciała</span></div><div class="bmc"><b>' +
    pl1(last.kg) +
    " kg</b><span>" +
    fmtDate(last.d) +
    (L.length > 1 ? " · " + (ch > 0 ? "+" : "") + pl1(ch) + " kg od " + fmtDate(first.d) : "") +
    "</span></div>" +
    sv +
    '<span class="sr-only">Pomiary: ' +
    P2.map((x) => fmtDate(x.d) + " " + pl1(x.kg) + " kg").join(", ") +
    '</span><button class="mini" data-bm>+ Nowy pomiar</button></div>'
  );
}
function bmWeek() {
  const m = monOf(today());
  return m.getFullYear() + "-" + (m.getMonth() + 1) + "-" + m.getDate();
}
function renderBmSet() {
  const b = bmLast(),
    el = $("bmSetTxt");
  if (!el) return;
  el.textContent = b
    ? pl1(b.kg) +
      " kg (" +
      fmtDate(b.d) +
      "). Dodawana do tonażu podciągania i dipów. Co tydzień zapytam o nowy pomiar."
    : "Nie wpisana. Potrzebna do tonażu podciągania i dipów – w kg przy tych ćwiczeniach wpisujesz już tylko obciążenie.";
  const bw = $("bw");
  if (bw) bw.placeholder = b ? pl1(b.kg) + " (ostatnio)" : "opcjonalnie";
}
function openBm(auto) {
  const b = bmLast();
  $("bmAskB").textContent = !b
    ? "Wpisz swoją masę ciała. Aplikacja doda ją do tonażu podciągania i dipów (tam wpisujesz już tylko obciążenie, np. +7,5), a w Postępach zobaczysz, jak się zmienia. Na początku każdego tygodnia zapytam o nowy pomiar."
    : auto
      ? "Nowy tydzień – ile dziś ważysz? Ostatnio: " + pl1(b.kg) + " kg (" + fmtDate(b.d) + ")."
      : "Ostatni pomiar: " + pl1(b.kg) + " kg (" + fmtDate(b.d) + "). Nowy zapisze się z dzisiejszą datą.";
  $("bmIn").value = "";
  $("bmLater").textContent = auto ? "Nie teraz" : "Anuluj";
  $("bmAsk").hidden = false;
  setTimeout(() => {
    try {
      $("bmIn").focus();
    } catch (e) {} // urządzenie może tego nie obsługiwać – bez znaczenia dla danych
  }, 50);
  $("bmLater").onclick = () => {
    if (auto) ls.set(P + "bmW", bmWeek());
    $("bmAsk").hidden = true;
  };
  $("bmOk").onclick = () => {
    const r = bmSave($("bmIn").value);
    if (!r) {
      toast("Wpisz masę w kg, np. 82,5.");
      return;
    }
    ls.set(P + "bmW", bmWeek());
    $("bmAsk").hidden = true;
    toast(
      "Zapisano " +
        pl1(r.v) +
        " kg." +
        (r.n > 0 ? " Przeliczono " + r.n + " starych serii podciągania/dipów na samo obciążenie." : ""),
      true
    );
    renderBmSet();
    try {
      renderEx(true);
      updSum();
    } catch (e) {
      blad("odświeżenie treningu po masie ciała", e);
    }
    try {
      renderHist();
    } catch (e) {
      blad("odświeżenie historii po masie ciała", e);
    }
    if (view === "prog") renderProg();
  };
}
let bmTry = 0;
function bmAuto() {
  if (ls.get(P + "bmW") === bmWeek()) return;
  if (DAYS.some((d) => hasDraft(d) && draft[d] && draft[d].start && Date.now() - draft[d].start < 4 * 3600e3)) return;
  if (document.querySelector(".sheet:not([hidden]),#welcome:not([hidden])")) {
    if (++bmTry < 300) setTimeout(bmAuto, 2000);
    return;
  }
  openBm(true);
}
document.addEventListener("click", (ev) => {
  const b = ev.target.closest && ev.target.closest("[data-bm]");
  if (b) {
    ev.preventDefault();
    openBm(false);
  }
});
function tonDetail(wk) {
  const a = wk.d,
    b = new Date(a);
  b.setDate(a.getDate() + 6);
  const list = sessions
    .filter((s) => monOf(s.date).toDateString() === a.toDateString())
    .sort((x, y) => String(x.date).localeCompare(String(y.date)));
  const head =
    '<div class="tdh"><b>' +
    a.getDate() +
    "." +
    String(a.getMonth() + 1).padStart(2, "0") +
    " – " +
    b.getDate() +
    "." +
    String(b.getMonth() + 1).padStart(2, "0") +
    "</b> · " +
    fmtT(wk.v) +
    "</div>";
  if (!list.length) return head + '<div class="hint">W tym tygodniu nie ma treningów.</div>';
  return (
    head +
    list
      .map((s) => {
        const rows = [],
          out = [];
        for (const e of s.ex || []) {
          if (e.kind) continue;
          const R = tonRule(e.k);
          const ss = (e.sets || []).filter((t) => t.kg || t.r);
          if (!ss.length) continue;
          if (R.x) {
            out.push(esc(e.n) + " (" + R.x + ")");
            continue;
          }
          const v = exVol(e, s);
          rows.push(
            '<div class="frow"><div><b>' +
              esc(e.n) +
              "</b><small>" +
              ss
                .map(
                  (t) =>
                    (t.w ? "R " : "") +
                    (BWL.has(e.k) && s.bw2 ? pl1(bmAt(s.date)) + "+" : "") +
                    String(t.kg || 0).replace(".", ",") +
                    "×" +
                    (t.r || 0)
                )
                .join(" · ") +
              (R.l ? " · " + R.l : "") +
              "</small></div><span>" +
              fmtKg(v) +
              "</span></div>"
          );
        }
        return (
          '<details class="tds"><summary><span>' +
          fmtDate(s.date) +
          " · " +
          esc(PLAN[s.day] ? dl(s.day) : s.dn || s.day) +
          "</span><b>" +
          fmtKg(volOf(s)) +
          "</b></summary>" +
          rows.join("") +
          (out.length ? '<div class="hint tout">Nie wlicza się: ' + out.join(", ") + "</div>" : "") +
          "</details>"
        );
      })
      .join("")
  );
}
function tonBlock() {
  const tot = sessions.reduce((a, s) => a + volOf(s), 0);
  if (!tot) return "";
  const now = monOf(today());
  const wk = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - 7 * i);
    wk.push({ d, v: 0 });
  }
  let month = 0;
  const ym = today().slice(0, 7);
  for (const s of sessions) {
    const v = volOf(s);
    if (String(s.date).slice(0, 7) === ym) month += v;
    const m = monOf(s.date).toDateString();
    const w = wk.find((x) => x.d.toDateString() === m);
    if (w) w.v += v;
  }
  const mx = Math.max(1, ...wk.map((w) => w.v));
  const fun =
    tot >= 6000
      ? ["🐘", tot / 6000, "słoni afrykańskich (6 t)"]
      : tot >= 1500
        ? ["🚗", tot / 1500, "samochodów osobowych (1,5 t)"]
        : ["🎹", tot / 400, "fortepianów (400 kg)"];
  return (
    '<div class="tonc"><div><b>' +
    fmtT(tot) +
    "</b><span>łącznie</span></div><div><b>" +
    fmtT(wk[7].v) +
    "</b><span>ten tydzień</span></div><div><b>" +
    fmtT(month) +
    "</b><span>ten miesiąc</span></div></div>" +
    '<div class="lbl">Tonaż tygodniowo</div><div class="tchart">' +
    wk
      .map(
        (w, i) =>
          '<button type="button" data-tw="' +
          i +
          '" class="' +
          (i === 7 ? "now" : "") +
          (tonSel === i ? " sel" : "") +
          '" aria-label="Tydzień od ' +
          w.d.getDate() +
          "." +
          String(w.d.getMonth() + 1).padStart(2, "0") +
          ": " +
          fmtT(w.v) +
          '" aria-pressed="' +
          (tonSel === i) +
          '"><em>' +
          (w.v ? fmtT(w.v).replace(" kg", "") : "") +
          '</em><i style="height:' +
          Math.round((w.v / mx) * 100) +
          '%"></i></button>'
      )
      .join("") +
    "</div>" +
    '<div class="tlab">' +
    wk.map((w) => "<span>" + w.d.getDate() + "." + String(w.d.getMonth() + 1).padStart(2, "0") + "</span>").join("") +
    "</div>" +
    (tonSel != null
      ? '<div class="tdet">' + tonDetail(wk[tonSel]) + "</div>"
      : '<div class="hint" style="margin-top:6px">Stuknij słupek, żeby zobaczyć, skąd wziął się tonaż.</div>') +
    '<div class="tfun">' +
    fun[0] +
    " To już " +
    (Math.round(fun[1] * 10) / 10).toLocaleString("pl") +
    " " +
    fun[2] +
    ".</div>"
  );
}
function renderProg() {
  const el = $("prog");
  const by = {};
  for (const s of [...sessions].reverse()) {
    if (!PLAN[s.day]) continue;
    for (const e of s.ex || []) {
      if (e.kind) continue;
      const b = bestSet(e);
      if (!b) continue;
      const w = s.created || 0;
      by[e.k] = by[e.k] || { n: e.n, w: {}, d: {} };
      by[e.k].d[w] = fmtDate(s.date);
      const cur = by[e.k].w[w];
      const val = b.kg ? b.kg * (1 + b.r / 30) : b.r;
      if (!cur || val > cur.v) by[e.k].w[w] = { b, v: val };
    }
  }
  const keys = Object.keys(by);
  if (!keys.length) {
    setTimeout(
      () =>
        el.querySelectorAll("[data-tw]").forEach(
          (b) =>
            (b.onclick = () => {
              const i = +b.dataset.tw;
              tonSel = tonSel === i ? null : i;
              renderProg();
            })
        ),
      0
    );
    el.innerHTML =
      bmBlock() +
      tonBlock() +
      '<div class="hint">Po kilku treningach zobaczysz tu, jak rosną ciężary i powtórzenia – tydzień po tygodniu.</div>';
    return;
  }
  const order = [];
  for (const d of DAYS) for (const e of PLAN[d].ex) if (by[e.k] && !order.includes(e.k)) order.push(e.k);
  for (const k of keys) if (!order.includes(k)) order.push(k);
  setTimeout(
    () =>
      el.querySelectorAll("[data-tw]").forEach(
        (b) =>
          (b.onclick = () => {
            const i = +b.dataset.tw;
            tonSel = tonSel === i ? null : i;
            renderProg();
          })
      ),
    0
  );
  el.innerHTML =
    bmBlock() +
    tonBlock() +
    '<div class="phead"><span>Ćwiczenie</span><span>Start → teraz</span><span></span></div>' +
    order
      .map((k) => {
        const o = by[k];
        const ws = Object.keys(o.w)
          .map(Number)
          .sort((a, b) => a - b);
        const f = o.w[ws[0]],
          l = o.w[ws[ws.length - 1]];
        let d = "";
        if (ws.length > 1) {
          if (f.b.kg && l.b.kg) {
            const dk = Math.round((l.b.kg - f.b.kg) * 10) / 10;
            d = dk
              ? (dk > 0 ? "+" : "") + String(dk).replace(".", ",") + " kg"
              : l.b.r - f.b.r
                ? (l.b.r > f.b.r ? "+" : "") + (l.b.r - f.b.r) + " powt."
                : "bez zmian";
          } else {
            const dr = l.b.r - f.b.r;
            d = dr ? (dr > 0 ? "+" : "") + dr + " powt." : "bez zmian";
          }
        }
        return (
          '<div class="prow"><div class="pn">' +
          esc(o.n) +
          '<span class="pd' +
          (d.startsWith("+") ? " up" : "") +
          '">' +
          d +
          '</span></div><div class="pv">' +
          o.d[ws[0]] +
          ": " +
          fmtSet(f.b) +
          (ws.length > 1 ? "<br>" + o.d[ws[ws.length - 1]] + ": <b>" + fmtSet(l.b) + "</b>" : "") +
          "</div>" +
          spark(ws.map((w) => o.w[w])) +
          "</div>"
        );
      })
      .join("");
}
let histLimit = 20;
function renderHist() {
  setTimeout(() => {
    try {
      renderProg();
    } catch (e) {
      blad("Postępy", e);
    }
  }, 0);
  setTimeout(() => {
    try {
      bkCheck();
    } catch (e) {
      blad("sprawdzenie kopii zapasowej", e);
    }
  }, 0);
  const h = $("hist");
  h.innerHTML = "";
  if (!sessions.length) {
    h.innerHTML = '<div class="hint">Tu pojawią się zapisane sesje.</div>';
    return;
  }
  for (const s of sessions.slice(0, histLimit)) {
    const d = document.createElement("details");
    let body = '<div class="hl">';
    for (const e of s.ex || []) {
      const st = (e.sets || []).filter((t) => t.kg || t.r);
      if (!st.length) continue;
      body +=
        "<div><b>" +
        esc(e.n) +
        (e.stage ? " (etap " + esc(e.stage) + ")" : "") +
        "</b>: " +
        st.map((t) => esc((t.w ? "r " : "") + (t.kg ? t.kg + "×" : "") + (t.r || "–"))).join(" · ") +
        (e.rir ? " · RIR " + esc(e.rir) : "") +
        "</div>";
    }
    if (s.bw) body += "<div><b>Masa</b>: " + esc(s.bw) + " kg</div>";
    if (s.notes) body += "<div><b>Notatki</b>: " + esc(s.notes) + "</div>";
    body +=
      '</div><div class="tools">' +
      (PLAN[s.day] ? '<button class="mini" data-fix="' + esc(s.id) + '">✎ Popraw</button>' : "") +
      '<button class="del" data-id="' +
      esc(s.id) +
      '">Usuń wpis</button></div><div class="ai" id="ai_' +
      esc(s.id) +
      '"></div>';
    d.innerHTML =
      "<summary>" +
      esc(PLAN[s.day] ? dl(s.day) + " " + PLAN[s.day].sub : (OLD[s.day] || { n: s.dn || s.day }).n) +
      " · " +
      fmtDate(s.date) +
      (PLAN[s.day] ? " <span>T" + (sessOf(s.day).indexOf(s) + 1) + "</span>" : "") +
      "</summary>" +
      body;
    h.append(d);
  }
  if (sessions.length > histLimit) {
    const m = document.createElement("button");
    m.className = "mini";
    m.textContent = "Pokaż starsze (" + (sessions.length - histLimit) + ")";
    m.onclick = () => {
      histLimit += 30;
      renderHist();
    };
    h.append(m);
  }
  h.querySelectorAll("[data-fix]").forEach(
    (b) =>
      (b.onclick = () => {
        const s = sessions.find((x) => String(x.id) === b.dataset.fix);
        if (!s) return;
        persist();
        setView("train");
        day = s.day;
        viewT = sessOf(day).indexOf(s);
        render(true);
        $("pastView").scrollIntoView({ block: "start" });
      })
  );
  h.querySelectorAll(".del").forEach(
    (b) =>
      (b.onclick = async () => {
        if (b.dataset.armed !== "1") {
          b.dataset.armed = "1";
          b.textContent = "Na pewno? Kliknij ponownie";
          return;
        }
        const id = b.dataset.id,
          s = sessions.find((x) => String(x.id) === id);
        if (!s) return;
        try {
          sessions = sessions.filter((x) => x !== s);
          saveSessions();
          render();
          renderHist();
          toast("Usunięto wpis.");
        } catch (e) {
          b.textContent = "Nie udało się usunąć";
        }
      })
  );
}

let restEnd = 0,
  restIv = null,
  actx = null,
  lock = null;
function startRest(sec) {
  if (!actx)
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {} // urządzenie może tego nie obsługiwać – bez znaczenia dla danych
  restEnd = Date.now() + sec * 1000;
  $("rest").hidden = false;
  clearInterval(restIv);
  tick();
  restIv = setInterval(tick, 250);
}
function tick() {
  const left = Math.max(0, Math.round((restEnd - Date.now()) / 1000));
  $("restT").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
  $("rest").classList.toggle("go", left === 0);
  if (left === 0) {
    clearInterval(restIv);
    try {
      navigator.vibrate && navigator.vibrate([200, 100, 200]);
    } catch (e) {} // urządzenie może tego nie obsługiwać – bez znaczenia dla danych
    beep();
  }
}
function beep() {
  try {
    if (!actx) return;
    const o = actx.createOscillator(),
      g = actx.createGain();
    o.connect(g);
    g.connect(actx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.start();
    o.stop(actx.currentTime + 0.35);
  } catch (e) {} // urządzenie może tego nie obsługiwać – bez znaczenia dla danych
}
function wake() {
  try {
    if (lock || !navigator.wakeLock) return;
    navigator.wakeLock
      .request("screen")
      .then((l) => {
        lock = l;
        l.addEventListener("release", () => {
          lock = null;
        });
      })
      .catch(() => {});
  } catch (e) {} // urządzenie może tego nie obsługiwać – bez znaczenia dla danych
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && Object.values(S().done).some(Boolean)) wake();
});

const SNAP_SKIP = new Set([
  P + "bmW",
  P + "undo",
  P + "restored",
  P + "lastbk",
  P + "welcome",
  P + "verc",
  P + "seenBuild",
  P + "updTry",
]);
function snapKeys() {
  const o = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(P + "") && !SNAP_SKIP.has(k)) o[k] = localStorage.getItem(k);
    }
  } catch (e) {
    blad("kopia: odczyt danych z telefonu", e);
  }
  return o;
}
function snapshot() {
  persist();
  return {
    app: "tytanowa-sila",
    v: 2,
    exported: new Date().toISOString(),
    count: sessions.length,
    storage: snapKeys(),
    sessions: sessions.map((x) => {
      const c = Object.assign({}, x);
      delete c.local;
      return c;
    }),
  };
}
function backupJSON() {
  return JSON.stringify(snapshot());
}
function bkName() {
  const d = new Date();
  return (
    "trening-kopia-" +
    (PROF ? PROF + "-" : "") +
    today() +
    "-" +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    ".json"
  );
}
$("bkFile").onclick = () => {
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([backupJSON()], { type: "application/json" }));
    a.download = bkName();
    document.body.append(a);
    a.click();
    a.remove();
    toast("Pobrano plik z kopią.", true);
    bkDone();
  } catch (e) {
    toast("Nie udało się pobrać. Użyj „Skopiuj do schowka”.");
  }
};
$("bkCopy").onclick = () => {
  const t = backupJSON();
  (navigator.clipboard &&
    navigator.clipboard
      .writeText(t)
      .then(() => (toast("Skopiowano. Wklej np. do notatek albo maila do siebie.", true), bkDone()))
      .catch(() => {
        $("bkBox").hidden = false;
        $("bkIn").value = t;
        $("bkIn").select();
        toast("Zaznaczyłem kopię – skopiuj ją ręcznie.");
      })) ||
    (($("bkBox").hidden = false), ($("bkIn").value = t), $("bkIn").select());
};
if (window.claude) $("bkFile").hidden = true;
function bkFileObj() {
  return new File([backupJSON()], bkName(), { type: "application/json" });
}
try {
  if (navigator.canShare && navigator.canShare({ files: [bkFileObj()] })) $("bkShare").hidden = false;
} catch (e) {} // urządzenie może tego nie obsługiwać – bez znaczenia dla danych
$("bkShare").onclick = async () => {
  try {
    await navigator.share({ files: [bkFileObj()], title: "Kopia treningów" });
    bkDone();
    toast("Wysłano kopię.", true);
  } catch (e) {
    if (e && e.name !== "AbortError") toast("Nie udało się udostępnić. Użyj „Pobierz plik”.");
  }
};
$("bkShow").onclick = () => {
  $("bkBox").hidden = !$("bkBox").hidden;
};
$("bkPickFile").onclick = () => {
  $("bkFileIn").value = "";
  $("bkFileIn").click();
};
$("bkFileIn").onchange = (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => importBackup(String(r.result));
  r.onerror = () => toast("Nie udało się odczytać pliku. Spróbuj jeszcze raz.");
  r.readAsText(f);
};
function plTr(n) {
  return n === 1 ? "trening" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "treningi" : "treningów";
}
let pendingRestore = null;
function fmtTs(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "nieznanej daty";
  return (
    String(d.getDate()).padStart(2, "0") +
    "." +
    String(d.getMonth() + 1).padStart(2, "0") +
    "." +
    d.getFullYear() +
    ", " +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}
function importBackup(txt) {
  let d;
  try {
    d = JSON.parse(String(txt).replace(/^﻿/, "").trim());
  } catch (e) {
    toast("To nie jest plik kopii z tej aplikacji. Wybierz plik trening-kopia-….json.");
    return;
  }
  let store = null;
  if (d && d.storage && typeof d.storage === "object") {
    store = reKey(d.storage);
  } else {
    const list = Array.isArray(d) ? d : d && d.sessions;
    if (!Array.isArray(list)) {
      toast("W tym pliku nie ma treningów z tej aplikacji.");
      return;
    }
    store = { [P + "sessions"]: JSON.stringify(list.filter((x) => x && Array.isArray(x.ex))) };
    if (d.plan && typeof d.plan === "object") store[P + "plan"] = JSON.stringify(d.plan);
  }
  let ses = [];
  try {
    ses = JSON.parse(store[P + "sessions"] || "[]") || [];
  } catch (e) {
    blad("przywracanie: odczyt treningów", e);
  }
  const now = sessions.length,
    inBk = ses.length;
  const bkCreated = new Set(ses.map((x) => x.created));
  const lost = sessions.filter((x) => !bkCreated.has(x.created)).length;
  pendingRestore = { store, label: d.exported ? fmtTs(d.exported) : "kopii" };
  $("rsTxt").innerHTML =
    "Kopia z <b>" +
    esc(pendingRestore.label) +
    "</b> – " +
    inBk +
    " " +
    plTr(inBk) +
    ".<br>Teraz w aplikacji: " +
    now +
    " " +
    plTr(now) +
    ".<br><br>Aplikacja wróci <b>dokładnie</b> do stanu z kopii: historia, plan i niezapisany trening w toku." +
    (lost ? '<br><br><b class="warn">' + lost + " " + plTr(lost) + " zapisanych po tej kopii zniknie.</b>" : "") +
    "<br><br>Jeśli się pomylisz, zaraz po przywróceniu możesz kliknąć „Cofnij”.";
  $("bkBox").hidden = true;
  $("rsSheet").hidden = false;
}
function reKey(store) {
  const o = {};
  for (const k in store) {
    const m = /^gora[a-z]*_(.+)$/.exec(k);
    if (m) o[P + m[1]] = store[k];
  }
  return o;
}
function applySnapshot(store, label, isUndo) {
  store = reKey(store);
  const cur = snapshot();
  restoring = true;
  try {
    const del = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(P + "") && !SNAP_SKIP.has(k)) del.push(k);
    }
    del.forEach((k) => localStorage.removeItem(k));
    for (const k in store) if (k.startsWith(P + "") && !SNAP_SKIP.has(k)) localStorage.setItem(k, store[k]);
    localStorage.setItem(P + "undo", JSON.stringify({ store: cur.storage, label: fmtTs(cur.exported) }));
    localStorage.setItem(P + "restored", JSON.stringify({ label, undo: !!isUndo, ts: Date.now() }));
    localStorage.setItem(P + "lastbk", JSON.stringify(Date.now()));
    try {
      const c = JSON.parse(localStorage.getItem(P + "cloudst") || "{}");
      c.pending = true;
      localStorage.setItem(P + "cloudst", JSON.stringify(c));
    } catch (e) {
      blad("przywracanie: oznaczenie do chmury", e);
    }
  } catch (e) {
    restoring = false;
    toast("Nie udało się przywrócić – przeglądarka nie pozwala zapisać danych.");
    return;
  }
  location.reload();
}
$("rsOk").onclick = () => {
  if (pendingRestore) applySnapshot(pendingRestore.store, pendingRestore.label, false);
};
$("rsCancel").onclick = () => {
  pendingRestore = null;
  $("rsSheet").hidden = true;
};
(function restoredInfo() {
  const r = ls.get(P + "restored");
  if (!r) return;
  try {
    localStorage.removeItem(P + "restored");
  } catch (e) {} // nieistotne
  const u = ls.get(P + "undo");
  const bar = $("rsDone");
  bar.hidden = false;
  $("rsDoneTxt").textContent = r.undo
    ? "Cofnięto przywracanie – aplikacja jest w stanie sprzed wczytania kopii."
    : "Przywrócono kopię z " + r.label + ". Wszystko jest jak w chwili jej zrobienia.";
  $("rsUndo").hidden = !u || r.undo;
  $("rsUndo").onclick = () => {
    if (u) applySnapshot(u.store, u.label, true);
  };
  $("rsDoneX").onclick = () => {
    bar.hidden = true;
  };
})();
$("bkLoad").onclick = () => {
  const t = $("bkIn").value.trim();
  if (!t) {
    toast("Wklej tekst kopii albo kliknij „Wybierz plik kopii”.");
    return;
  }
  importBackup(t);
};
function bkCheck() {
  let cl = 0;
  try {
    cl = (cloud.on && !cst.pending && cst.last) || 0;
  } catch (e) {} // nieistotne
  const last = Math.max(ls.get(P + "lastbk") || 0, cl);
  const newer = sessions.filter((x) => (x.created || 0) > last).length;
  const changed = (ls.get(P + "changed") || 0) > last && sessions.length > 0;
  const days = last ? Math.floor((Date.now() - last) / 864e5) : null;
  const w = $("bkWarn");
  const need =
    newer >= 2 || (newer > 0 && days !== null && days >= 14) || (changed && newer === 0 && days !== null && days >= 1);
  const txt = newer
    ? newer + " " + (newer === 1 ? "trening bez kopii" : newer < 5 ? "treningi bez kopii" : "treningów bez kopii")
    : "zmiany bez kopii";
  if (need) {
    w.hidden = false;
    w.textContent =
      "Masz " + txt + (days !== null ? " (ostatnia kopia " + days + " dni temu)" : "") + ". Zapisz kopię poniżej.";
  } else w.hidden = true;
  if (need && $("bkTop")) $("bkTop").textContent = "⬇ Zapisz kopię zapasową (" + txt + ")";
  if (need && !$("bkTop")) {
    const t = document.createElement("button");
    t.id = "bkTop";
    t.className = "bkwarn";
    t.style.border = "0";
    t.style.width = "100%";
    t.style.cursor = "pointer";
    t.textContent = "⬇ Zapisz kopię zapasową (" + txt + ")";
    t.onclick = () => $("bkFile").click();
    document.querySelector(".wrap header").after(t);
  } else if (!need && $("bkTop")) $("bkTop").remove();
}
function bkDone() {
  ls.set(P + "lastbk", Date.now());
  bkCheck();
}
try {
  navigator.storage && navigator.storage.persist && navigator.storage.persist();
} catch (e) {} // urządzenie może tego nie obsługiwać – bez znaczenia dla danych
/* --- kopia po sesji + stały plik (Chrome/Edge na komputerze) --- */
const fsOK = !!window.showSaveFilePicker;
let fh = null;
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(P + "fs", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("h");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbGet() {
  try {
    const d = await idb();
    return await new Promise((r) => {
      const q = d.transaction("h").objectStore("h").get("file");
      q.onsuccess = () => r(q.result || null);
      q.onerror = () => r(null);
    });
  } catch (e) {
    return null;
  }
}
async function idbSet(v) {
  try {
    const d = await idb();
    d.transaction("h", "readwrite").objectStore("h").put(v, "file");
  } catch (e) {} // urządzenie może tego nie obsługiwać – bez znaczenia dla danych
}
async function writeFixed(ask) {
  if (!fh) return false;
  try {
    let p = await fh.queryPermission({ mode: "readwrite" });
    if (p !== "granted" && ask) p = await fh.requestPermission({ mode: "readwrite" });
    if (p !== "granted") return false;
    const w = await fh.createWritable();
    await w.write(backupJSON());
    await w.close();
    bkDone();
    return true;
  } catch (e) {
    return false;
  }
}
function showPick() {
  $("bkPickInfo").hidden = !fh;
  if (fh) $("bkPickInfo").textContent = "Stały plik kopii: " + fh.name + " – aktualizuje się po każdym zapisie sesji.";
  $("bkPick").textContent = fh ? "Zmień plik kopii" : "Ustaw stały plik kopii";
}
if (fsOK) {
  $("bkPick").hidden = false;
  idbGet().then((h) => {
    fh = h;
    showPick();
  });
  $("bkPick").onclick = async () => {
    try {
      fh = await window.showSaveFilePicker({
        suggestedName: "trening-kopia.json",
        types: [{ description: "Kopia treningów", accept: { "application/json": [".json"] } }],
      });
      await idbSet(fh);
      showPick();
      if (await writeFixed(true)) toast("Kopia zapisana. Od teraz plik aktualizuje się sam.", true);
    } catch (e) {} // anulowany wybór pliku – nic nie robimy
  };
}
async function afterSave(s) {
  const label = "Trening " + dl(s.day) + ", " + fmtDate(s.date);
  if (fh && (await writeFixed(true))) {
    toast("Zapisano: " + label + ". Kopia zaktualizowana.", true);
    return;
  }
  if (cloud.on && CLOUD_URL) {
    toast(
      navigator.onLine === false
        ? "Zapisano: " + label + ". Brak internetu – kopia trafi do chmury sama, gdy złapiesz zasięg."
        : "Zapisano: " + label + ". ☁ Kopia leci do chmury…",
      true
    );
    return;
  }
  toast("Zapisano: " + label + ".", true);
  const last = ls.get(P + "lastbk") || 0;
  const newer = sessions.filter((x) => (x.created || 0) > last).length;
  $("ssTxt").textContent =
    newer +
    " " +
    (newer === 1 ? "trening nie ma" : newer < 5 ? "treningi nie mają" : "treningów nie ma") +
    " kopii zapasowej. Zapisz ją teraz – to jedno kliknięcie. Kopia zapamięta stan całej aplikacji.";
  $("ssShare").hidden = $("bkShare").hidden;
  $("saveSheet").hidden = false;
}
$("ssLater").onclick = () => {
  $("saveSheet").hidden = true;
};
$("ssFile").onclick = () => {
  $("bkFile").click();
  $("saveSheet").hidden = true;
};
$("ssShare").onclick = () => {
  $("bkShare").click();
  $("saveSheet").hidden = true;
};
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost"))
  navigator.serviceWorker.register("sw.js").catch(() => {});
const TIPS = {
  day: [
    "Trening A i B",
    "Przyciskiem <b>✎ Edytuj plan</b> zmienisz ćwiczenia, serie i powtórzenia, dodasz własne ćwiczenie albo nowy trening (C, D…).<br><br>Masz dwa różne treningi. Robisz je na zmianę: A, B, A, B… – najlepiej 2 razy w tygodniu z co najmniej dniem przerwy. Aplikacja sama zaznacza ten, który jest dziś na kolejce.",
  ],
  tnum: [
    "Numer treningu (T1, T2…)",
    "Każdy trening A i B ma swój numer: pierwszy raz to T1, drugi T2 itd. Podświetlony numer to dzisiejszy trening.<br><br>Kliknij wcześniejszy numer, żeby zobaczyć, jakie ciężary i powtórzenia miałeś wtedy. Wracasz przyciskiem „Wróć”.",
  ],
  warm: [
    "Rozgrzewka",
    "Rozwiń listę i zrób punkty po kolei. Przy każdym jest rysunek, ile powtórzeń i krótka instrukcja. Odhaczasz ✓.<br><br>Ostatni punkt to <b>serie dochodzące</b>: 1–2 lekkie serie pierwszego ćwiczenia, zanim weźmiesz ciężar roboczy.",
  ],
  ex: [
    "Ćwiczenia",
    "Robisz je w tej kolejności. Pod nazwą widzisz ile serii, ile powtórzeń i jak długa przerwa.<br><br><b>Technika</b> – jak wykonać ćwiczenie i częsty błąd.<br><b>Sprzęt zajęty? Zamień</b> – podobne ćwiczenie na tym samym sprzęcie.<br><b>✕</b> – pomiń ćwiczenie dziś.<br><b>Serie rozgrzewkowe</b> – rozwiń przy ciężkich ćwiczeniach, jeśli chcesz je zapisać.<br><b>Zwinięte ćwiczenie</b> – gdy odhaczysz wszystkie serie, kliknij linię, żeby ją rozwinąć.<br><b>+ seria / − seria</b> – dodaj albo odejmij serię tylko na dziś (na stałe zmienisz to w „Edytuj plan”).<br><br><b>Zielona podpowiedź</b> mówi, czy dziś dołożyć ciężaru, czy powtórzeń.",
  ],
  sets: [
    "Jak wpisywać serie",
    "<b>R1, R2</b> – serie rozgrzewkowe na lżejszym ciężarze (nie liczą się do postępów).<br><b>1, 2, 3</b> – serie robocze.<br><br>Wpisz <b>ciężar</b> (przy hantlach – jednego hantla) i <b>liczbę powtórzeń</b>. Szare liczby w polach to wynik z ostatniego razu.<br><br>Kliknij <b>✓</b> po serii – jeśli pola są puste, wpisze się ostatni wynik, i ruszy minutnik przerwy na dole.<br><br><b>RIR</b> – ile powtórzeń zostało Ci w zapasie w ostatniej serii. Kliknij „co to?” przy RIR.",
  ],
  data: [
    "Data, masa i notatki",
    "Data podstawia się sama. Zmień ją tylko, jeśli dopisujesz trening z innego dnia. Masa ciała i notatki są opcjonalne – np. „źle spałem”, „bolał bark”.",
  ],
  hist: [
    "Historia",
    "Lista zapisanych treningów. Kliknij, żeby zobaczyć szczegóły.<br><br><b>✎ Popraw</b> – zmień ciężar, powtórzenia, datę albo notatki w zapisanym treningu.<br><b>Usuń wpis</b> – trzeba kliknąć dwa razy.",
  ],
  prog: [
    "Postępy",
    "Dla każdego ćwiczenia: najlepsza seria z pierwszego treningu i z ostatniego oraz wykres. Zielona liczba (np. +5 kg) to Twój postęp.",
  ],
  cloud: [
    "Kopia w chmurze",
    "Gdy pole jest <b>zaznaczone</b>, po każdym zapisanym treningu (i po poprawkach) aplikacja sama wysyła kopię na Dysk Google Damiana. Nie musisz nic klikać. Bez internetu kopia poczeka i wyśle się sama później.<br><br>Gdy pole jest <b>odznaczone</b>, nic nie jest wysyłane.<br><br>Na nowym telefonie: zaznacz pole, wpisz PIN, a aplikacja zaproponuje przywrócenie treningów z chmury. Możesz też wybrać kopię z dowolnego dnia: <b>Przywróć z chmury</b>.",
  ],
  backup: [
    "Kopia zapasowa",
    "Treningi zapisują się tylko w tym telefonie, w przeglądarce. Jeśli wyczyścisz dane przeglądarki albo zmienisz telefon, znikną.<br><br>Dlatego po treningu kliknij <b>„Zapisz kopię”</b> – plik trafi do Pobranych. Najlepiej wyślij go sobie na Dysk albo mailem.<br><br><b>Przywróć z kopii</b> → wybierz plik: aplikacja wróci dokładnie do stanu z chwili zrobienia kopii (historia, plan, trening w toku). Zaraz po przywróceniu możesz to cofnąć.",
  ],
};
function openTip(k) {
  const t = TIPS[k];
  if (!t) return;
  $("tipT").textContent = t[0];
  $("tipB").innerHTML = t[1];
  $("tipSheet").hidden = false;
}
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest && e.target.closest(".tip[data-tip]");
    if (b) {
      e.preventDefault();
      e.stopPropagation();
      openTip(b.dataset.tip);
    }
  },
  true
);
$("tipX").onclick = () => {
  $("tipSheet").hidden = true;
};
if (!ls.get(P + "welcome")) $("welcome").hidden = false;
$("welcomeOk").onclick = () => {
  ls.set(P + "welcome", 1);
  $("welcome").hidden = true;
};
$("howBtn").onclick = () => {
  setView("train");
  $("welcome").hidden = false;
  $("welcome").scrollIntoView({ block: "start" });
};
/* --- edytor planu --- */
let ed = null,
  edDay = null;
function applyPlan(np, save) {
  for (const k of Object.keys(PLAN)) delete PLAN[k];
  Object.assign(PLAN, JSON.parse(JSON.stringify(np)));
  DAYS.length = 0;
  DAYS.push(...Object.keys(PLAN));
  rebuildNext();
  for (const d of DAYS)
    for (const e of PLAN[d].ex)
      if (!CATALOG[e.k]) CATALOG[e.k] = { k: e.k, n: e.n, g: "Własne", s: e.s, r: e.r, m: e.m };
  if (save) {
    ls.set(P + "plan", PLAN);
    ls.set(P + "changed", Date.now());
    try {
      cloudDirty();
    } catch (e) {
      blad("oznaczenie zmian do chmury", e);
    }
  }
  if (!PLAN[day]) day = DAYS[0];
  viewT = null;
  render(true);
  renderHist();
}
for (const d of DAYS)
  for (const e of PLAN[d].ex) if (!CATALOG[e.k]) CATALOG[e.k] = { k: e.k, n: e.n, g: "Własne", s: e.s, r: e.r, m: e.m };

// ===== „+ Nowy trening”: własny trening dodatkowy (kafelek), nie zmienia kolejki planu =====
const NTORD = [
  "Klatka",
  "Plecy",
  "Barki",
  "Biceps",
  "Triceps",
  "Nogi",
  "Pośladki",
  "Łydki",
  "Core",
  "Dynamika",
  "Cardio",
  "Własne",
  "Inne",
];
const NTMAP = {
  Klatka: "Klatka",
  Plecy: "Plecy",
  Barki: "Barki",
  "Nogi – uda": "Nogi",
  "Tył uda i pośladki": "Pośladki",
  Łydki: "Łydki",
  Core: "Core",
  Własne: "Własne",
};
function ntGrp(e) {
  if (e.kind === "dyn") return "Dynamika";
  if (e.kind === "cardio") return "Cardio";
  if (e.g === "Ramiona") return /uginanie|młotkow|biceps/i.test(e.n) ? "Biceps" : "Triceps";
  return NTMAP[e.g] || "Inne";
}
function genWarm(ex) {
  const g = new Set(ex.map((e) => ntGrp(CATALOG[e.k] || e)));
  const has = (a) => a.some((x) => g.has(x));
  const legs = has(["Nogi", "Pośladki", "Łydki"]),
    push = has(["Klatka", "Barki", "Triceps"]),
    pull = has(["Plecy", "Biceps"]);
  const w = [
    {
      n: legs ? "Rower" : "Wioślarz lub orbitrek",
      d: "3 min",
      c: "Spokojnie, tętno 120–135, da się swobodnie mówić.",
      f: "cardio",
    },
  ];
  if (legs)
    w.push(
      {
        n: "Biodro 90/90",
        d: "5/str.",
        c: "Siedzisz, obie nogi zgięte pod kątem 90°. Przekładasz kolana z jednej strony na drugą, tułów prosto.",
        f: "kneel",
      },
      {
        n: "Kostka przy ścianie",
        d: "10/str.",
        c: "Stopa ok. 10 cm od ściany. Kolano do ściany, pięta zostaje na podłodze.",
        f: "kneel",
      },
      {
        n: "Mostek biodrowy",
        d: "10",
        c: "Leżysz, stopy blisko pośladków. Unieś biodra, ściśnij pośladki, 1 s na górze – budzi pośladki przed nogami.",
        f: "bridge",
      },
      {
        n: "Przysiad z pauzą na dole",
        d: "2 × 5",
        c: "Bez ciężaru, 3 s na dole. Łokcie rozpychają kolana na zewnątrz.",
        f: "squat",
      }
    );
  if (push)
    w.push(
      {
        n: "Ślizgi rąk po ścianie",
        d: "8",
        c: "Plecy i ręce przy ścianie. Przesuwasz ręce w górę i w dół bez odrywania lędźwi.",
        f: "vpush",
      },
      {
        n: "Pompki łopatkowe",
        d: "10",
        c: "Podpór na prostych rękach. Ruch tylko łopatkami: zbliżasz i rozsuwasz.",
        f: "core",
      }
    );
  if (pull)
    w.push(
      { n: "Zwis na drążku", d: "20 s", c: "Luźny zwis, barki lekko aktywne.", f: "vpull" },
      {
        n: "Rozciąganie gumy przed sobą",
        d: "15",
        c: "Proste ręce na wysokości barków, rozciągasz gumę ściągając łopatki.",
        f: "band",
      }
    );
  if (g.has("Core") || w.length < 3)
    w.push({
      n: "Bird dog",
      d: "5/str.",
      c: "Na czworakach wyprostuj rękę i przeciwną nogę, plecy płasko, 2 s pauzy.",
      f: "quad",
    });
  if (w.length < 3)
    w.push({
      n: "Koci grzbiet",
      d: "8",
      c: "Na czworakach powoli zaokrąglasz i wyginasz plecy, z oddechem.",
      f: "quad",
    });
  const m = ex.find((e) => e.m && !e.kind) || ex.find((e) => !e.kind);
  if (m) {
    const gg = ntGrp(CATALOG[m.k] || m);
    w.push({
      n: "Serie dochodzące – " + m.n,
      d: m.m ? "2 serie" : "1 seria",
      c: m.m
        ? "Około 50% ciężaru roboczego × 10 → 75% × 5, potem serie robocze."
        : "Lekki ciężar × 15, spokojnie, pełny zakres.",
      f: ["Nogi", "Pośladki", "Łydki"].includes(gg) ? "squat" : ["Plecy", "Biceps"].includes(gg) ? "hpull" : "hpush",
    });
  }
  return w.slice(0, 8);
}
let ntSel = [],
  ntOn = new Set();
function plCw(n) {
  return n === 1
    ? "ćwiczenie"
    : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
      ? "ćwiczenia"
      : "ćwiczeń";
}
function openNT() {
  if (DAYS.filter(isX).length >= 6) {
    toast("Masz już 6 treningów dodatkowych. Usuń któryś w Ustawienia → Edytuj plan.");
    return;
  }
  ntSel = [];
  ntOn = new Set();
  $("ntName").value = "";
  ntRender();
  $("ntSheet").hidden = false;
  setTimeout(() => $("ntName").focus(), 50);
}
function ntRender() {
  const all = Object.values(CATALOG);
  const groups = NTORD.filter((g) => all.some((e) => ntGrp(e) === g));
  $("ntChips").innerHTML = groups
    .map((g) => '<button type="button" data-g="' + g + '" aria-pressed="' + ntOn.has(g) + '">' + g + "</button>")
    .join("");
  $("ntChips")
    .querySelectorAll("[data-g]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const g = b.dataset.g;
          ntOn.has(g) ? ntOn.delete(g) : ntOn.add(g);
          ntRender();
        })
    );
  const show = groups.filter((g) => !ntOn.size || ntOn.has(g));
  $("ntList").innerHTML = show
    .map(
      (g) =>
        '<div class="ntg">' +
        g +
        "</div>" +
        all
          .filter((e) => ntGrp(e) === g)
          .sort((a, b) => a.n.localeCompare(b.n, "pl"))
          .map(
            (e) =>
              '<label class="nti"><input type="checkbox" data-k="' +
              e.k +
              '"' +
              (ntSel.includes(e.k) ? " checked" : "") +
              "><span>" +
              esc(e.n) +
              "<small>" +
              (e.s || 3) +
              " × " +
              esc(e.r || "8–12") +
              "</small></span></label>"
          )
          .join("")
    )
    .join("");
  $("ntList")
    .querySelectorAll("[data-k]")
    .forEach(
      (c) =>
        (c.onchange = () => {
          const k = c.dataset.k;
          if (c.checked) {
            if (!ntSel.includes(k)) ntSel.push(k);
          } else ntSel = ntSel.filter((x) => x !== k);
          ntBtn();
        })
    );
  ntBtn();
}
function ntBtn() {
  const n = ntSel.length;
  $("ntGo").disabled = !n;
  $("ntGo").textContent = n ? "Zacznij trening · " + n + " " + plCw(n) : "Zaznacz ćwiczenia";
}
$("ntX").onclick = () => {
  $("ntSheet").hidden = true;
};
$("ntGo").onclick = () => {
  if (!ntSel.length) return;
  const KO = { dyn: 0, undefined: 1, core: 2, cardio: 3 };
  const ex = ntSel
    .map((k) => {
      const c = CATALOG[k];
      return Object.assign(
        { k, n: c.n, s: c.s || 3, r: c.r || "8–12", m: c.m ? 1 : 0 },
        c.kind ? { kind: c.kind } : {}
      );
    })
    .map((e, i) => [e, i])
    .sort((a, b) => KO[a[0].kind] - KO[b[0].kind] || a[1] - b[1])
    .map((x) => x[0]);
  const name = $("ntName").value.trim().slice(0, 24) || "Dodatkowy " + (DAYS.filter(isX).length + 1);
  const key = "X" + Date.now().toString(36);
  persist();
  const np = JSON.parse(JSON.stringify(PLAN));
  np[key] = { name, sub: "dodatkowy", extra: 1, ex, warm: genWarm(ex) };
  $("ntSheet").hidden = true;
  applyPlan(np, true);
  day = key;
  viewT = null;
  render(true);
  window.scrollTo({ top: 0 });
  toast("Gotowe: „" + name + "” – trening zostaje jako kafelek.", true);
};
function edRender() {
  $("edTabs").innerHTML = Object.keys(ed)
    .map(
      (d) =>
        '<button data-ed="' +
        d +
        '" aria-pressed="' +
        (d === edDay) +
        '">' +
        (ed[d].extra ? esc(ed[d].name || "Dodatkowy") : "Trening " + dl(d)) +
        "</button>"
    )
    .join("");
  $("edTabs")
    .querySelectorAll("[data-ed]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          edPull();
          edDay = b.dataset.ed;
          edRender();
        })
    );
  const P = ed[edDay];
  $("edSub").value = P.extra ? P.name || "" : P.sub || "";
  document.querySelector('label[for="edSub"]').textContent = P.extra ? "Nazwa treningu dodatkowego" : "Opis treningu";
  $("edList").innerHTML =
    P.ex
      .map(
        (e, i) =>
          '<div class="edrow"><div class="edmv"><button class="mini" data-up="' +
          i +
          '" aria-label="W górę"' +
          (i ? "" : " disabled") +
          '>▲</button><button class="mini" data-dn="' +
          i +
          '" aria-label="W dół"' +
          (i < P.ex.length - 1 ? "" : " disabled") +
          '>▼</button></div><div class="edf"><input data-f="n" data-i="' +
          i +
          '" value="' +
          esc(e.n) +
          '" aria-label="Nazwa"><div class="edsr"><label>Serie <input data-f="s" data-i="' +
          i +
          '" type="number" min="1" max="10" inputmode="numeric" value="' +
          e.s +
          '"></label><label>Powt. <input data-f="r" data-i="' +
          i +
          '" value="' +
          esc(e.r) +
          '"></label><label class="edm"><input type="checkbox" data-f="m" data-i="' +
          i +
          '"' +
          (e.m ? " checked" : "") +
          '> z rozgrzewką</label></div></div><button class="x" data-del="' +
          i +
          '" aria-label="Usuń ćwiczenie">✕</button></div>'
      )
      .join("") || '<div class="hint">Brak ćwiczeń. Dodaj je poniżej.</div>';
  const used = new Set(P.ex.map((e) => e.k));
  $("edCat").innerHTML =
    '<option value="">Dodaj ćwiczenie z katalogu…</option>' +
    GORDER.map((g) => {
      const it = Object.values(CATALOG)
        .filter((e) => e.g === g && !used.has(e.k))
        .sort((a, b) => a.n.localeCompare(b.n, "pl"));
      return it.length
        ? '<optgroup label="' +
            g +
            '">' +
            it.map((e) => '<option value="' + e.k + '">' + esc(e.n) + "</option>").join("") +
            "</optgroup>"
        : "";
    }).join("");
  const mv = (i, j) => {
    edPull();
    const a = P.ex;
    [a[i], a[j]] = [a[j], a[i]];
    edRender();
  };
  $("edList")
    .querySelectorAll("[data-up]")
    .forEach((b) => (b.onclick = () => mv(+b.dataset.up, +b.dataset.up - 1)));
  $("edList")
    .querySelectorAll("[data-dn]")
    .forEach((b) => (b.onclick = () => mv(+b.dataset.dn, +b.dataset.dn + 1)));
  $("edList")
    .querySelectorAll("[data-del]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          edPull();
          P.ex.splice(+b.dataset.del, 1);
          edRender();
        })
    );
  $("edDelDay").disabled = !ed[edDay].extra && Object.keys(ed).filter((d) => !ed[d].extra).length < 2;
  $("edDelDay").textContent = "Usuń trening " + (ed[edDay].extra ? ed[edDay].name : dl(edDay));
  $("edDelDay").dataset.armed = "";
}
function edPull() {
  if (!ed || !ed[edDay]) return;
  const P = ed[edDay];
  if (P.extra) P.name = $("edSub").value.trim().slice(0, 24) || P.name;
  else P.sub = $("edSub").value.trim();
  $("edList")
    .querySelectorAll("[data-f]")
    .forEach((el) => {
      const e = P.ex[+el.dataset.i];
      if (!e) return;
      const f = el.dataset.f;
      if (f === "m") e.m = el.checked ? 1 : 0;
      else if (f === "s") e.s = Math.max(1, Math.min(10, parseInt(el.value) || 1));
      else e[f] = el.value.trim() || e[f];
    });
}
$("editPlan").onclick = () => {
  ed = JSON.parse(JSON.stringify(PLAN));
  edDay = day;
  edRender();
  $("edSheet").hidden = false;
};
$("edX").onclick = () => {
  $("edSheet").hidden = true;
  ed = null;
};
$("edAddCat").onclick = () => {
  const k = $("edCat").value;
  if (!k) return;
  edPull();
  const c = CATALOG[k];
  ed[edDay].ex.push(
    Object.assign({ k, n: c.n, s: c.s || 3, r: c.r || "8–12", m: c.m ? 1 : 0 }, c.kind ? { kind: c.kind } : {})
  );
  edRender();
};
$("edAddCustom").onclick = () => {
  const n = $("edCustom").value.trim();
  if (!n) return;
  edPull();
  const k = "c_" + Date.now().toString(36);
  CATALOG[k] = { k, n, g: "Własne", s: 3, r: "8–12" };
  ed[edDay].ex.push({ k, n, s: 3, r: "8–12", m: 0 });
  $("edCustom").value = "";
  edRender();
};
$("edNewDay").onclick = () => {
  edPull();
  const L = [...LETTERS].find((x) => !ed[x]);
  if (!L) {
    toast("Maksymalnie 6 treningów.");
    return;
  }
  ed[L] = { sub: "", ex: [] };
  edDay = L;
  edRender();
};
$("edDelDay").onclick = () => {
  const b = $("edDelDay");
  if (b.dataset.armed !== "1") {
    b.dataset.armed = "1";
    b.textContent = "Na pewno usunąć " + dl(edDay) + "?";
    return;
  }
  delete ed[edDay];
  edDay = Object.keys(ed)[0];
  edRender();
};
$("edReset").onclick = () => {
  const b = $("edReset");
  if (b.dataset.armed !== "1") {
    b.dataset.armed = "1";
    b.textContent = "Na pewno? Kliknij ponownie";
    return;
  }
  b.dataset.armed = "";
  b.textContent = "Przywróć plan startowy";
  ed = JSON.parse(JSON.stringify(PLAN_DEFAULT));
  edDay = Object.keys(ed)[0];
  edRender();
};
$("edSave").onclick = () => {
  edPull();
  for (const d of Object.keys(ed)) {
    ed[d].ex = ed[d].ex.filter((e) => e.n);
    if (!ed[d].ex.length) {
      toast("Trening " + dl(d) + " nie ma ćwiczeń. Dodaj ćwiczenie albo usuń trening.");
      edDay = d;
      edRender();
      return;
    }
  }
  const sorted = {},
    ks = Object.keys(ed);
  for (const d of ks.filter((d) => !ed[d].extra)) sorted[d] = ed[d];
  for (const d of ks.filter((d) => ed[d].extra)) {
    ed[d].warm = genWarm(ed[d].ex);
    sorted[d] = ed[d];
  }
  $("edSheet").hidden = true;
  ed = null;
  applyPlan(sorted, true);
  toast("Plan zapisany.", true);
};
/* --- kopia w chmurze (Google Apps Script) --- */
// Adres skryptu w arkuszu. Musi zostać w jednej linii – testy podmieniają go na atrapę (dev/run-tests.sh).
// prettier-ignore
const CLOUD_URL = "https://script.google.com/macros/s/AKfycbzzzjP1Do6FjKgOA32tp6YX6x52G4By6UHoqB8Yyvd2jz6Jgi95mdhGZM4YsY7cg8MGVA/exec"; // adres wdrożonego skryptu Google
SNAP_SKIP.add(P + "cloud");
SNAP_SKIP.add(P + "cloudst");
SNAP_SKIP.add(P + "rankc");
let cloud = Object.assign({ on: false, pin: "" }, ls.get(P + "cloud") || {});
let cst = Object.assign({ last: 0, pending: false, err: "" }, ls.get(P + "cloudst") || {});
let cloudBusy = false,
  cloudAgain = false;
function saveCloud() {
  ls.set(P + "cloud", cloud);
  ls.set(P + "cloudst", cst);
}
function fmtShort(ts) {
  const d = new Date(ts);
  return (
    String(d.getDate()).padStart(2, "0") +
    "." +
    String(d.getMonth() + 1).padStart(2, "0") +
    ", " +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}
async function cloudPost(body, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms || 25000);
  try {
    const r = await fetch(CLOUD_URL, {
      method: "POST",
      body: JSON.stringify(body),
      redirect: "follow",
      signal: ctl.signal,
    });
    const j = await r.json();
    return j;
  } finally {
    clearTimeout(t);
  }
}
function renderCloud() {
  const box = $("cloudBox");
  box.hidden = !CLOUD_URL;
  if (!CLOUD_URL) return;
  $("cloudOn").checked = cloud.on || !$("cloudPinBox").hidden;
  const st = $("cloudSt");
  let t = "",
    cls = "";
  if (!cloud.on) t = !$("cloudPinBox").hidden ? "Wpisz PIN i kliknij „Połącz”." : "Wyłączona – nic nie jest wysyłane.";
  else if (cloudBusy) {
    t = "⏳ Wysyłam kopię…";
  } else if (cst.err === "pin") {
    t = "⚠ PIN nie pasuje. Wpisz go ponownie.";
    cls = "bad";
    $("cloudPinBox").hidden = false;
  } else if (cst.pending) {
    t =
      navigator.onLine === false
        ? "⏳ Brak internetu – kopia wyśle się sama, gdy wróci sieć."
        : "⏳ Kopia czeka na wysłanie" + (cst.err ? " (ostatnia próba nieudana)" : "") + ".";
    cls = "wait";
  } else if (cst.last) {
    t = "✓ Kopia w chmurze aktualna (" + fmtShort(cst.last) + ").";
    cls = "good";
  } else t = "✓ Połączono z chmurą.";
  st.textContent = t;
  st.className = "cloudst " + cls;
  $("cloudNow").hidden = !(cloud.on && cst.pending && !cloudBusy);
}
function cloudDirty() {
  if (!cloud.on || !CLOUD_URL) return;
  cst.pending = true;
  saveCloud();
  cloudSync();
}
async function cloudSync(quiet) {
  if (!cloud.on || !CLOUD_URL || !cst.pending) return renderCloud();
  if (cloudBusy) {
    cloudAgain = true;
    return;
  }
  if (!sessions.length) {
    cst.pending = false;
    saveCloud();
    return renderCloud();
  }
  cloudBusy = true;
  renderCloud();
  try {
    const j = await cloudPost({ pin: cloud.pin, action: "save", rank: rankOn(), snapshot: snapshot() }, 60000);
    if (j && j.ok) {
      const late = !!cst.err;
      cst = { last: Date.now(), pending: false, err: "" };
      if (!quiet || late)
        toast(late ? "☁ Zaległa kopia wysłana do chmury." : "☁ Kopia w chmurze zaktualizowana.", true);
    } else {
      cst.err = j && j.error === "pin" ? "pin" : "server";
      if (cst.err === "pin") toast("☁ PIN do chmury nie pasuje – sprawdź go w sekcji Kopia zapasowa.");
    }
  } catch (e) {
    cst.err = "net";
  }
  cloudBusy = false;
  saveCloud();
  renderCloud();
  bkCheck();
  if (cloudAgain) {
    cloudAgain = false;
    if (cst.pending) cloudSync(true);
  }
}
$("cloudOn").onchange = () => {
  const on = $("cloudOn").checked;
  if (on) {
    if (cloud.pin) {
      cloud.on = true;
      cst.err = "";
      saveCloud();
      renderCloud();
      cloudCheckRemote();
    } else {
      $("cloudPinBox").hidden = false;
      $("cloudPin").focus();
      renderCloud();
    }
  } else {
    cloud.on = false;
    cst.pending = false;
    cst.err = "";
    $("cloudPinBox").hidden = true;
    saveCloud();
    renderCloud();
    bkCheck();
    toast("☁ Kopia w chmurze wyłączona. Nic nie będzie wysyłane.");
  }
};
$("cloudConnect").onclick = async () => {
  const pin = $("cloudPin").value.trim();
  if (!pin) {
    toast("Wpisz PIN.");
    return;
  }
  const b = $("cloudConnect");
  b.disabled = true;
  b.textContent = "Sprawdzam…";
  try {
    const j = await cloudPost({ pin, action: "ping" });
    if (j && j.ok && PROF && !j.name) {
      toast(
        "Skrypt w arkuszu to jeszcze wersja dla jednej osoby. Najpierw zaktualizuj go do wersji 2 (chmura/Code.gs)."
      );
      return;
    }
    if (j && j.ok) {
      cloud = { on: true, pin };
      cst.err = "";
      $("cloudPinBox").hidden = true;
      $("cloudPin").value = "";
      saveCloud();
      toast("☁ Połączono z chmurą" + (j.name ? " jako " + j.name : "") + ".", true);
      await cloudCheckRemote();
    } else
      toast(
        j && j.error === "pin_dup"
          ? "Ten PIN ma też inna osoba. Ustawcie różne PIN-y w arkuszu."
          : PRO.owner
            ? "Ten PIN nie pasuje. Sprawdź go w karcie „Uczestnicy”."
            : "Ten PIN nie pasuje. Sprawdź go u Damiana."
      );
  } catch (e) {
    toast("Brak połączenia z chmurą. Sprawdź internet i spróbuj ponownie.");
  }
  b.disabled = false;
  b.textContent = "Połącz";
  renderCloud();
};
async function cloudCheckRemote() {
  if (sessions.length) {
    cst.pending = true;
    saveCloud();
    return cloudSync();
  }
  try {
    const j = await cloudPost({ pin: cloud.pin, action: "list" });
    if (j && j.ok && j.items && j.items.length) {
      showCloudList(
        j.items,
        "W chmurze są kopie Twoich treningów. Ten telefon jest pusty – wybierz kopię, żeby je przywrócić:"
      );
    }
  } catch (e) {
    blad("sprawdzenie kopii w chmurze", e);
  }
  renderCloud();
}
function showCloudList(items, head) {
  const el = $("cloudList");
  el.hidden = false;
  el.innerHTML =
    '<div class="hint">' +
    esc(head) +
    "</div>" +
    items
      .slice(0, 30)
      .map((it, i) => {
        const m = /-(\d+)tr\.json$/.exec(it.name || "");
        return (
          '<button class="mini" data-cid="' +
          esc(it.id) +
          '">' +
          (i === 0 ? "<b>Najnowsza</b> · " : "") +
          esc(fmtTs(it.date)) +
          (m ? " · " + m[1] + " " + plTr(+m[1]) : "") +
          "</button>"
        );
      })
      .join("") +
    '<button class="mini" id="cloudListX">Zamknij</button>';
  el.querySelectorAll("[data-cid]").forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        b.textContent = "Pobieram…";
        try {
          const j = await cloudPost({ pin: cloud.pin, action: "get", id: b.dataset.cid }, 60000);
          if (j && j.ok && j.content) {
            el.hidden = true;
            importBackup(j.content);
          } else toast("Nie udało się pobrać tej kopii.");
        } catch (e) {
          toast("Brak połączenia z chmurą.");
        }
        b.disabled = false;
      })
  );
  $("cloudListX").onclick = () => {
    el.hidden = true;
  };
}
$("cloudRestore").onclick = async () => {
  if (!cloud.pin) {
    $("cloudPinBox").hidden = false;
    $("cloudPin").focus();
    toast("Najpierw wpisz PIN do chmury i kliknij „Połącz”.");
    return;
  }
  const b = $("cloudRestore");
  b.disabled = true;
  b.textContent = "Pobieram listę…";
  try {
    const j = await cloudPost({ pin: cloud.pin, action: "list" });
    if (j && j.ok) {
      if (j.items && j.items.length) showCloudList(j.items, "Wybierz kopię do przywrócenia (najnowsze na górze):");
      else toast("W chmurze nie ma jeszcze żadnej kopii.");
    } else toast(j && j.error === "pin" ? "PIN nie pasuje." : "Chmura nie odpowiada. Spróbuj za chwilę.");
  } catch (e) {
    toast("Brak połączenia z chmurą. Sprawdź internet.");
  }
  b.disabled = false;
  b.textContent = "Przywróć z chmury";
};
$("cloudNow").onclick = () => cloudSync();
window.addEventListener("online", () => cloudSync(true));
// ===== Aktualizacje: numer wersji w aplikacji vs version.json na serwerze =====
const APP_BUILD = 12;
function verItems(j, from) {
  return ((j && j.zmiany) || []).filter((x) => x.build > from);
}
function verHtml(list) {
  return list
    .map(
      (x) =>
        "<h4>" +
        esc(x.data) +
        " · wersja " +
        x.build +
        "</h4><ul>" +
        x.lista.map((t) => "<li>" + esc(t) + "</li>").join("") +
        "</ul>"
    )
    .join("");
}
function renderVer() {
  const j = ls.get(P + "verc");
  const cur = ((j && j.zmiany) || []).find((x) => x.build === APP_BUILD);
  $("verTxt").textContent = "Twoja wersja: " + APP_BUILD + (cur ? " (" + cur.data + ")" : "");
  if (j && j.zmiany && j.zmiany.length) $("verList").innerHTML = verHtml(j.zmiany.slice(0, 6));
}
function showUpd(j) {
  let b = $("updBar");
  if (!b) {
    b = document.createElement("div");
    b.id = "updBar";
    b.className = "updbar";
    b.setAttribute("role", "status");
    document.querySelector(".wrap header").after(b);
  }
  const n = verItems(j, APP_BUILD);
  const first = n.length ? n[0].lista[0] : "";
  const tr = ls.get(P + "updTry");
  const stuck = tr && tr.b === j.build && Date.now() - tr.ts < 120000;
  b.innerHTML =
    "<span><b>" +
    (stuck ? "Aktualizacja jeszcze dociera" : "Jest nowa wersja aplikacji") +
    "</b><small>" +
    (stuck
      ? "Spróbuj za kilka minut."
      : esc(first) + (n.reduce((a, x) => a + x.lista.length, 0) > 1 ? " i więcej" : "")) +
    '</small></span><button id="updGo">Odśwież</button>';
  $("updGo").onclick = () => {
    try {
      persist();
    } catch (e) {
      blad("zapis treningu w toku przed aktualizacją", e);
    }
    ls.set(P + "updTry", { b: j.build, ts: Date.now() });
    location.reload();
  };
}
let updBusy = false;
async function checkUpd(manual) {
  if (updBusy) return;
  updBusy = true;
  try {
    const r = await fetch("version.json?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw 0;
    const j = await r.json();
    ls.set(P + "verc", j);
    renderVer();
    if (j.build > APP_BUILD) showUpd(j);
    else {
      const b = $("updBar");
      if (b) b.remove();
      if (manual) toast("✓ Masz najnowszą wersję (" + APP_BUILD + ").", true);
    }
  } catch (e) {
    if (manual) toast("Brak internetu – nie mogę sprawdzić aktualizacji.");
  } finally {
    updBusy = false;
  }
}
$("verChk").onclick = () => checkUpd(true);
// Po aktualizacji: raz pokaż, co się zmieniło
(() => {
  let seen = ls.get(P + "seenBuild");
  if (seen == null && (ls.get(P + "sessions") || []).length) seen = APP_BUILD - 1;
  ls.set(P + "seenBuild", APP_BUILD);
  renderVer();
  if (seen && seen < APP_BUILD) {
    const show = (j) => {
      const n = verItems(j, seen).filter((x) => x.build <= APP_BUILD);
      if (!n.length) return;
      $("tipT").textContent = "Zaktualizowano ✓ Co nowego";
      $("tipB").innerHTML = verHtml(n);
      $("tipSheet").hidden = false;
    };
    const c = ls.get(P + "verc");
    if (c && verItems(c, seen).some((x) => x.build === APP_BUILD)) show(c);
    else
      fetch("version.json?t=" + Date.now(), { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          ls.set(P + "verc", j);
          renderVer();
          show(j);
        })
        .catch(() => {});
  }
})();
checkUpd(false);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") checkUpd(false);
});

// iPhone z ikony na pulpicie nie zawsze zgłasza powrót internetu – ponawiamy wysyłkę co 30 s, dopóki kopia czeka
setInterval(() => {
  if (document.visibilityState === "visible" && cloud.on && cst.pending && !cloudBusy) cloudSync(true);
}, 30000);
window.addEventListener("pageshow", () => cloudSync(true));
window.addEventListener("focus", () => cloudSync(true));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") cloudSync(true);
});
let view = "train";
const VIEWNAME = { train: "Trening", hist: "Historia", prog: "Postępy", rank: "Ranking", set: "Ustawienia" };

// ===== Ranking (tydzień PN–ND, puchary, rekordy) – liczy go skrypt w arkuszu z ostatnich kopii w chmurze =====
function rankOn() {
  return ls.get(P + "rankOn") !== false;
}
$("rankOn").checked = rankOn();
$("rankOn").onchange = () => {
  const on = $("rankOn").checked;
  ls.set(P + "rankOn", on);
  if (cloud.on && CLOUD_URL)
    cloudPost({ pin: cloud.pin, action: "pref", rank: on })
      .then((j) =>
        toast(
          j && j.ok
            ? on
              ? "🏆 Jesteś w rankingu."
              : "Jesteś ukryty w rankingu."
            : "Zapisane w telefonie – wyślę przy następnej kopii."
        )
      )
      .catch(() => toast("Zapisane w telefonie – wyślę przy następnej kopii."));
  else toast(on ? "🏆 Będziesz w rankingu po włączeniu kopii w chmurze." : "Jesteś ukryty w rankingu.");
};
const MIES = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];
function plSerie(n) {
  return n === 1 ? "seria" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "serie" : "serii";
}
function wkLabel(w) {
  const a = new Date(w + "T12:00:00"),
    b = new Date(a);
  b.setDate(a.getDate() + 6);
  return a.getMonth() === b.getMonth()
    ? a.getDate() + "–" + b.getDate() + " " + MIES[b.getMonth()]
    : a.getDate() + " " + MIES[a.getMonth()] + " – " + b.getDate() + " " + MIES[b.getMonth()];
}
function kgTxt(v) {
  return String(v).replace(".", ",");
}
let rankBusy = false;
function rankCard(t, body) {
  return '<div class="rc">' + (t ? "<h3>" + t + "</h3>" : "") + body + "</div>";
}
// Okres rankingu: w = tydzień, m = miesiąc, a = od początku (skrypt v4); starszy skrypt → tylko tydzień
let rankPer = (() => {
  try {
    return ls.get(P + "rankPer") || "w";
  } catch (e) {
    return "w";
  }
})();
const MIESM = [
  "styczeń",
  "luty",
  "marzec",
  "kwiecień",
  "maj",
  "czerwiec",
  "lipiec",
  "sierpień",
  "wrzesień",
  "październik",
  "listopad",
  "grudzień",
];
function agoTxt(d) {
  if (!d) return "";
  const a = new Date(d + "T12:00:00"),
    t = new Date(today() + "T12:00:00");
  const n = Math.round((t - a) / 864e5);
  return n <= 0
    ? "dziś"
    : n === 1
      ? "wczoraj"
      : n < 7
        ? n + " dni temu"
        : a.getDate() + "." + String(a.getMonth() + 1).padStart(2, "0");
}
function chg(cur, prev) {
  if (!prev) return cur ? '<span class="up">nowość</span>' : "";
  const d = Math.round(((cur - prev) / prev) * 100);
  return d
    ? '<span class="' + (d > 0 ? "up" : "dn") + '">' + (d > 0 ? "▲ " : "▼ ") + Math.abs(d) + "%</span>"
    : "<span>= jak poprzednio</span>";
}
function rankRows(ppl, val, fmt, icon, per) {
  const sorted = [...ppl].sort((a, b) => val(b) - val(a) || a.name.localeCompare(b.name));
  const top = sorted.length ? val(sorted[0]) : 0;
  let pos = 0,
    prev = null;
  return sorted
    .map((p, i) => {
      const v = val(p);
      if (v !== prev) {
        pos = i + 1;
        prev = v;
      }
      const lead = top > 0 && v === top;
      const sub = [];
      if (per && p[per.prev]) sub.push(chg(v, per.prevVal(p)));
      if (p.streak > 1) sub.push("🔥 " + p.streak + " tyg. z rzędu");
      if (p.last) sub.push("ostatnio: " + agoTxt(p.last));
      return (
        '<div class="rrow' +
        (lead ? " lead" : "") +
        '"><div class="pos">' +
        (lead ? icon : pos) +
        '</div><div><div class="nm">' +
        esc(p.name) +
        (p.me ? '<span class="rme">TY</span>' : "") +
        '</div><div class="rbar"><i style="width:' +
        (top ? Math.round((v / top) * 100) : 0) +
        '%"></i></div>' +
        (sub.length ? '<div class="rsub">' + sub.join(" · ") + "</div>" : "") +
        '</div><div class="val">' +
        fmt(v, p) +
        "</div></div>"
      );
    })
    .join("");
}
function drawRank(j, at, state) {
  const box = $("rank");
  const v4 = !!(j.people || []).some((p) => p.w);
  if (!v4) rankPer = "w";
  const per = rankPer;
  const ppl = (j.people || []).map((p) =>
    v4
      ? Object.assign({}, p, { S: p[per].sets, K: p[per].kg, T: p[per].tr })
      : Object.assign({}, p, { S: p.sets, K: p.kg, T: p.trainings })
  );
  let title,
    cd = "";
  if (per === "w") {
    const dl = 7 - ((new Date().getDay() + 6) % 7);
    title = wkLabel(j.week);
    cd = dl > 1 ? "jeszcze " + dl + " dni" : "ostatni dzień!";
  } else if (per === "m") {
    const t = new Date(today() + "T12:00:00");
    const end = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    const left = end - t.getDate() + 1;
    title = MIESM[t.getMonth()] + " " + t.getFullYear();
    cd = left > 1 ? "jeszcze " + left + " dni" : "ostatni dzień!";
  } else title = "Od początku";
  let h = rankCard(
    "",
    (v4
      ? '<div class="rper" role="group" aria-label="Okres rankingu">' +
        [
          ["w", "Tydzień"],
          ["m", "Miesiąc"],
          ["a", "Od początku"],
        ]
          .map(
            ([k, t]) =>
              '<button type="button" data-per="' + k + '" aria-pressed="' + (per === k) + '">' + t + "</button>"
          )
          .join("") +
        "</div>"
      : "") +
      '<div class="wk"><div><div class="sm">' +
      (per === "a" ? "Łączny dorobek" : per === "m" ? "Konkurs miesiąca" : "Konkurs tygodnia") +
      '</div><div class="big">' +
      title +
      "</div></div>" +
      (cd ? '<span class="cd">' + cd + "</span>" : "") +
      "</div>"
  );
  const PV =
    per === "w"
      ? { prev: "pw", prevVal: (p) => p.pw.sets }
      : per === "m"
        ? { prev: "pm", prevVal: (p) => p.pm.sets }
        : null;
  const rows = rankRows(
    ppl,
    (p) => p.S,
    (v, p) => v + "<small>" + plSerie(v) + " · " + p.T + " tr.</small>",
    "🏆",
    v4 ? PV : null
  );
  const top = Math.max(0, ...ppl.map((p) => p.S)),
    me = ppl.find((p) => p.me),
    second = [...ppl].sort((a, b) => b.S - a.S).find((p) => p.S < top),
    leaders = ppl.filter((p) => top > 0 && p.S === top);
  const word = per === "w" ? "w tym tygodniu" : per === "m" ? "w tym miesiącu" : "";
  let note = !top
    ? "Nikt jeszcze nie zrobił serii " + (word || "") + ". Pierwszy trening = prowadzenie!"
    : me
      ? leaders.includes(me) && leaders.length > 1
        ? "Remis na prowadzeniu – jedna seria robi różnicę!"
        : leaders.includes(me)
          ? second
            ? "Prowadzisz! Przewaga: " + (top - second.S) + " " + plSerie(top - second.S) + " nad kolejnym miejscem."
            : "Prowadzisz!"
          : "Do lidera brakuje Ci " + (top - me.S) + " " + plSerie(top - me.S) + "."
      : "";
  if (j.me && j.me.rank === false) note = "Jesteś ukryty w rankingu – zmienisz to w Ustawieniach.";
  h += rankCard(
    "Serie " + (word || "łącznie"),
    '<div class="sm">' +
      (per === "w" ? "PN–ND · " : "") +
      "serie z sekcji Ćwiczenia (z R1/R2)" +
      (PV ? " · zmiana wobec poprzedniego " + (per === "w" ? "tygodnia" : "miesiąca") : "") +
      '</div><div style="margin-top:8px">' +
      (rows || '<div class="rnote">Nikogo jeszcze nie ma w rankingu.</div>') +
      "</div>" +
      (note
        ? '<div class="rnote">' +
          note +
          (per === "w" ? " Nowy konkurs startuje w poniedziałek o 00:00." : "") +
          "</div>"
        : "")
  );
  if (ppl.some((p) => p.K != null)) {
    const KV =
      per === "w"
        ? { prev: "pw", prevVal: (p) => p.pw.kg }
        : per === "m"
          ? { prev: "pm", prevVal: (p) => p.pm.kg }
          : null;
    const kr = rankRows(
      ppl.map((p) => Object.assign({}, p, { streak: 0, last: "" })),
      (p) => p.K || 0,
      (v) => fmtT(v).replace(/ (kg|t)$/, "<small>$1</small>"),
      "🏋️",
      v4 ? KV : null
    );
    h += rankCard(
      "Kilogramy " + (word || "łącznie"),
      '<div class="sm">seria × kg × powtórzenia (z rozgrzewką R1/R2)</div><div style="margin-top:8px">' + kr + "</div>"
    );
  }
  if (per === "w") {
    const cups = j.cups || [];
    const hist = (j.history || [])
      .map((x) => {
        const a = new Date(x.week + "T12:00:00"),
          b = new Date(a);
        b.setDate(a.getDate() + 6);
        return (
          '<div class="hrow"><span>' +
          a.getDate() +
          "." +
          String(a.getMonth() + 1).padStart(2, "0") +
          "–" +
          b.getDate() +
          "." +
          String(b.getMonth() + 1).padStart(2, "0") +
          "</span><span>" +
          (x.sets ? "🏆 " + x.sets.names.map(esc).join(" i ") + " <small>" + x.sets.v + "</small>" : "–") +
          "</span><span>" +
          (x.kg ? "🏋️ " + x.kg.names.map(esc).join(" i ") + " <small>" + fmtT(x.kg.v) + "</small>" : "–") +
          "</span></div>"
        );
      })
      .join("");
    h += rankCard(
      "Puchary",
      '<div class="sm">Wygrane tygodnie' +
        (j.last
          ? " · ostatnio: " + j.last.names.map(esc).join(" i ") + " (" + j.last.sets + " " + plSerie(j.last.sets) + ")"
          : "") +
        "</div>" +
        (cups.length
          ? '<div class="cups">' +
            cups.map((c) => '<div class="cup"><b>🏆×' + c.n + "</b><span>" + esc(c.name) + "</span></div>").join("") +
            "</div>" +
            ((j.kgCups || []).length
              ? '<div class="sm" style="margin-top:10px">Za kilogramy' +
                (j.lastKg
                  ? " · ostatnio: " + j.lastKg.names.map(esc).join(" i ") + " (" + fmtT(j.lastKg.kg) + ")"
                  : "") +
                '</div><div class="cups">' +
                j.kgCups
                  .map((c) => '<div class="cup"><b>🏋️×' + c.n + "</b><span>" + esc(c.name) + "</span></div>")
                  .join("") +
                "</div>"
              : "")
          : '<div class="rnote">Pierwszy puchar dostanie zwycięzca tego tygodnia.</div>') +
        (hist ? '<details class="rhist"><summary>Historia konkursów</summary>' + hist + "</details>" : "")
    );
  }
  const recs = j.records || [];
  const M = ["🥇", "🥈", "🥉"];
  const wk0 = j.week || "";
  h += rankCard(
    "Rekordy w ćwiczeniach",
    '<div class="sm">Największy ciężar w serii roboczej · ćwiczenia, które robią co najmniej 2 osoby</div>' +
      (recs.length
        ? recs
            .map((r) => {
              const c = CATALOG[r.k];
              let l = r.list.slice(0, 3);
              const mi = r.list.findIndex((x) => x.me);
              if (mi > 2) l = l.concat([r.list[mi]]);
              return (
                '<div class="exr"><div class="t">' +
                esc(c ? c.n : r.n) +
                (DB.has(r.k) ? " <small>kg / hantel</small>" : "") +
                "</div>" +
                l
                  .map((x) => {
                    const ix = r.list.indexOf(x);
                    const nw = wk0 && x.date && x.date >= wk0;
                    return (
                      '<div class="pod' +
                      (x.me ? " me" : "") +
                      '"><span>' +
                      (M[ix] || ix + 1 + ".") +
                      "</span><span>" +
                      esc(x.name) +
                      (nw ? ' <b class="new">NOWY</b>' : "") +
                      '</span><span class="k">' +
                      kgTxt(x.kg) +
                      " kg" +
                      (x.r ? " × " + x.r : "") +
                      (x.date ? "<small> · " + fmtDate(x.date).slice(0, 5) + "</small>" : "") +
                      "</span></div>"
                    );
                  })
                  .join("") +
                "</div>"
              );
            })
            .join("")
        : '<div class="rnote">Rekordy pojawią się, gdy co najmniej 2 osoby zrobią to samo ćwiczenie z ciężarem.</div>')
  );
  const d = new Date(at);
  h +=
    '<div class="rfoot"><span class="rnote" style="margin:0">' +
    (state ||
      "Stan z " +
        String(d.getHours()).padStart(2, "0") +
        ":" +
        String(d.getMinutes()).padStart(2, "0") +
        (d.toDateString() !== new Date().toDateString()
          ? " (" + d.getDate() + "." + String(d.getMonth() + 1).padStart(2, "0") + ")"
          : "")) +
    '</span><button class="mini" id="rankRef">↻ Odśwież</button></div>';
  box.innerHTML = h;
  $("rankRef").onclick = () => renderRank(true);
  box.querySelectorAll("[data-per]").forEach(
    (b) =>
      (b.onclick = () => {
        rankPer = b.dataset.per;
        ls.set(P + "rankPer", rankPer);
        drawRank(j, at, state);
      })
  );
}
function rankMsg(t, btn) {
  $("rank").innerHTML = rankCard(
    "Ranking",
    '<div class="rnote" style="font-size:14px">' +
      t +
      "</div>" +
      (btn ? '<div style="margin-top:12px"><button class="mini" id="rankGo">' + btn + "</button></div>" : "")
  );
  const g = $("rankGo");
  if (g) g.onclick = () => setView("set");
}
async function renderRank(fetchNow) {
  if (!CLOUD_URL) return rankMsg("Ranking nie jest dostępny w tej wersji aplikacji.");
  if (!cloud.on)
    return rankMsg(
      "Ranking porównuje uczestników z kopią w chmurze. Włącz „Automatyczną kopię w chmurze” w Ustawieniach i wpisz swój PIN – wtedy dołączysz do konkursu.",
      "Przejdź do Ustawień"
    );
  const c = ls.get(P + "rankc");
  if (c && c.d) drawRank(c.d, c.at, "Odświeżam…");
  else rankMsg("Wczytuję ranking…");
  if (!fetchNow || rankBusy) return;
  rankBusy = true;
  try {
    const j = await cloudPost({ pin: cloud.pin, action: "rank", today: today(), rank: rankOn() });
    if (j && j.ok) {
      ls.set(P + "rankc", { at: Date.now(), d: j });
      if (view === "rank") drawRank(j, Date.now());
    } else if (j && j.error === "action") rankMsg("Ranking zadziała po aktualizacji skryptu w arkuszu do wersji 3.");
    else if (j && j.error === "pin")
      rankMsg("PIN do chmury nie pasuje – sprawdź go w Ustawieniach.", "Przejdź do Ustawień");
    else if (c && c.d) drawRank(c.d, c.at, "Chmura nie odpowiada – pokazuję ostatni stan");
    else rankMsg("Chmura nie odpowiada. Spróbuj za chwilę.");
  } catch (e) {
    if (c && c.d) {
      if (view === "rank") drawRank(c.d, c.at, "Brak internetu – pokazuję ostatni stan");
    } else rankMsg("Brak internetu. Ranking pobierze się, gdy połączysz się z siecią.");
  } finally {
    rankBusy = false;
  }
}
function setView(v) {
  view = v;
  for (const k in VIEWNAME) $("v-" + k).hidden = k !== v;
  document.querySelectorAll(".tabs [data-view]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === v));
  $("viewName").textContent = VIEWNAME[v];
  $("statusRow").hidden = v !== "train";
  if (v === "hist") renderHist();
  if (v === "prog") renderProg();
  if (v === "rank") renderRank(true);
  window.scrollTo({ top: 0 });
}
document.querySelectorAll(".tabs [data-view]").forEach((b) => (b.onclick = () => setView(b.dataset.view)));
optCollapse = ls.get(P + "collapse") !== false;
$("optCollapse").checked = optCollapse;
$("optCollapse").onchange = () => {
  optCollapse = $("optCollapse").checked;
  ls.set(P + "collapse", optCollapse);
  renderEx();
};
$("restX").onclick = () => {
  clearInterval(restIv);
  $("rest").hidden = true;
};
$("restPlus").onclick = () => {
  restEnd = Math.max(restEnd, Date.now()) + 30000;
  clearInterval(restIv);
  tick();
  restIv = setInterval(tick, 250);
};
$("rirClose").onclick = () => {
  $("rirSheet").hidden = true;
};
document.addEventListener("input", (e) => {
  const t = e.target;
  if (!t || !t.id) return;
  if (t.closest("#exList")) {
    const m = t.id.match(/^(.+)_kg_(\d+)$/);
    if (m) spread(m[1], +m[2]);
    updSum();
    persist();
  } else if (COMMON.includes(t.id)) persist();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $("valAsk").hidden = true;
    $("ssAsk").hidden = true;
    $("ntSheet").hidden = true;
    $("finSheet").hidden = true;
    $("edSheet").hidden = true;
    $("tipSheet").hidden = true;
    $("saveSheet").hidden = true;
    $("rirSheet").hidden = true;
  }
});

function pickStart() {
  const wm = ls.get(P + "weekm");
  const lastTs = sessions[0] ? sessions[0].created || 0 : 0;

  if (draft.day && PLAN[draft.day] && hasDraft(draft.day)) day = draft.day;
  else {
    day = nextReg() || DAYS[0];
  }
}
let dateAuto = true;
$("date").addEventListener("input", () => {
  dateAuto = $("date").value === today();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && dateAuto && $("date").value !== today()) $("date").value = today();
});
$("date").value = today();
pullStage = ls.get(P + "pull") || 0;
sessions = (ls.get(P + "sessions") || []).map((s) => Object.assign(s, { local: true }));
sortS();
try {
  if (bwMigrate() >= 0) saveSessions();
} catch (e) {
  blad("przeliczenie masy ciała", e);
}
if (sessions.some((x) => x.rv !== RULES_V))
  try {
    saveSessions();
  } catch (e) {
    blad("przeliczenie tonażu", e);
  }
if (PRO.plan === "mateusz") for (const d of DAYS) if (!isX(d) && !WARM[d]) WARM[d] = genWarm(PLAN[d].ex);
try {
  renderBmSet();
} catch (e) {
  blad("masa ciała w Ustawieniach", e);
} // przeliczenie tonażu i serii wg aktualnych zasad
pickStart();
render(true);
renderHist();
try {
  renderCloud();
  cloudSync(true);
} catch (e) {
  blad("start chmury", e);
}
setTimeout(askOnce, 600);
setTimeout(bmAuto, 1500);

$("storeInfo").textContent = INFO_TXT + " · zapis w tej przeglądarce";
if (PRO.name) {
  document.title = "Tytanowa siła · " + PRO.name;
  const mt = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (mt) mt.content = "Siła · " + PRO.name;
}
if (PRO.owner) {
  const lb = document.querySelector('label[for="cloudPin"]');
  if (lb) lb.textContent = "PIN do chmury (Twój PIN z karty „Uczestnicy” w arkuszu)";
  if (TIPS.cloud) TIPS.cloud[1] = TIPS.cloud[1].replace("na Dysk Google Damiana", "na Twój Dysk Google");
  const ch = document.querySelector('label[for="cloudOn"] .hint');
  if (ch) ch.textContent = ch.textContent.replace("Dysk Google Damiana", "Twój Dysk Google");
}
if (PRO.plan === "mateusz") {
  const w1 = document.querySelector("#welcome .wsteps li");
  if (w1)
    w1.innerHTML =
      "<b>Wybierz dzień</b>: Klata, Łapy, Plecy, Barki, Nogi. Robisz je po kolei – aplikacja sama podpowie następny.";
  TIPS.day = [
    "Dni treningowe",
    "Pięć treningów: Klata, Łapy, Plecy, Barki + brzuch, Nogi + core. Robisz je po kolei – aplikacja sama zaznacza następny. Przyciskiem <b>✎ Edytuj plan</b> zmienisz ćwiczenia, serie i powtórzenia.",
  ];
  TIPS.tnum[1] = TIPS.tnum[1].replace("trening A i B", "dzień");
}
if (PRO.plan === "damian") {
  const w1 = document.querySelector("#welcome .wsteps li");
  if (w1) w1.innerHTML = "<b>Wybierz dzień</b> PN–PT. Aplikacja sama podpowie następny.";
  TIPS.day = [
    "Dni PN–PT",
    "Pięć treningów: push, pull, nogi, góra lżej, dół + brzuch. Robisz je po kolei – aplikacja sama zaznacza następny. Przyciskiem <b>✎ Edytuj plan</b> zmienisz ćwiczenia, serie i powtórzenia.",
  ];
  TIPS.tnum[1] = TIPS.tnum[1].replace("trening A i B", "dzień");
}
