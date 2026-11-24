// Kalkulator talerzy: pod seriami ze sztangą olimpijską (20 kg) podpowiada, co założyć na każdą stronę.
// Talerze, których nie ma na siłowni, osoba odznacza w Ustawieniach (zapis: P+"plates" = {off:[…]}).
// Tylko definicje – wywoływane z kod/aplikacja.js (ładowany później).
const BAR_KG = 20;
const PLATES_ALL = [25, 20, 15, 10, 5, 2.5, 1.25];
// Ćwiczenia na prostej sztandze 20 kg (bez gryfu łamanego, T-bara, Smitha – tam waga gryfu jest inna)
const BAR20 = new Set([
  "bench",
  "inclinebar",
  "declinebench",
  "cgbench",
  "benchmax",
  "squat",
  "frontsquat",
  "dl",
  "rdl",
  "thrust",
  "ohp",
  "bbrow",
  "pendlay",
  "shrug",
  "goodmorning",
  "bblunge",
]);

function platesOn() {
  const s = ls.get(P + "plates");
  const off = new Set(s && Array.isArray(s.off) ? s.off.map(Number) : []);
  return PLATES_ALL.filter((p) => !off.has(p));
}

// Najmniej talerzy na stronę, żeby dokładnie wyszło `side` kg (liczone w ćwiartkach kg). null = nie da się.
function platesFor(side, avail) {
  const U = Math.round(side * 4);
  if (U < 0) return null;
  if (U === 0) return [];
  const coins = avail.map((p) => Math.round(p * 4)).filter((c) => c > 0);
  const best = new Array(U + 1).fill(Infinity),
    from = new Array(U + 1).fill(0);
  best[0] = 0;
  for (let u = 1; u <= U; u++)
    for (const c of coins)
      if (c <= u && best[u - c] + 1 < best[u]) {
        best[u] = best[u - c] + 1;
        from[u] = c;
      }
  if (best[U] === Infinity) return null;
  const out = [];
  for (let u = U; u > 0; u -= from[u]) out.push(from[u] / 4);
  return out.sort((a, b) => b - a);
}

// Tekst pod seriami dla podanego ciężaru całkowitego (kg na sztandze z talerzami)
function platesText(total) {
  const t = Math.round(num(total) * 4) / 4;
  if (!t) return "";
  const pl = (v) => String(v).replace(".", ",");
  if (t < BAR_KG) return "Mniej niż sama sztanga (" + BAR_KG + " kg).";
  if (t === BAR_KG) return "Sama sztanga " + BAR_KG + " kg.";
  const avail = platesOn(),
    side = (t - BAR_KG) / 2;
  const list = platesFor(side, avail);
  if (list)
    return (
      "<b>Na stronę: " +
      list.map(pl).join(" + ") +
      "</b> <small>(sztanga " +
      BAR_KG +
      " + 2 × " +
      pl(side) +
      " kg)</small>"
    );
  // nie da się dokładnie – najbliższy możliwy ciężar w dół i w górę
  let lo = null,
    hi = null;
  for (let d = 0.25; d <= 10 && (!lo || !hi); d += 0.25) {
    if (!lo && side - d >= 0 && platesFor(side - d, avail)) lo = side - d;
    if (!hi && platesFor(side + d, avail)) hi = side + d;
  }
  const opt = [lo, hi]
    .filter((x) => x != null)
    .map((x) => pl(BAR_KG + 2 * x) + " kg (" + (platesFor(x, avail).map(pl).join(" + ") || "sama sztanga") + ")");
  return (
    "Z Twoich talerzy nie da się złożyć " +
    pl(t) +
    " kg." +
    (opt.length ? " Najbliżej: " + opt.join(" albo ") + "." : "")
  );
}

// Odświeża podpowiedź na karcie ćwiczenia k; i = numer serii (gdy wiadomo, którą osoba wpisuje), w = rozgrzewka
function plUpd(k, i, w) {
  const box = document.getElementById(k + "_pl");
  if (!box) return;
  let el = i != null ? document.getElementById(k + (w ? "_wkg_" : "_kg_") + i) : null;
  if (!el)
    for (let j = 0; j < 12; j++) {
      const x = document.getElementById(k + "_kg_" + j);
      if (!x) break;
      if (num(x.value || x.placeholder)) {
        el = x;
        if (!x.value) break;
      }
    }
  const html = el ? platesText(el.value || el.placeholder) : "";
  box.innerHTML = html;
  box.hidden = !html;
}

// Ustawienia → „Sztanga i talerze”
function renderPlatesSet() {
  const box = document.getElementById("plSet");
  if (!box) return;
  const on = new Set(platesOn());
  box.innerHTML = PLATES_ALL.map(
    (p) =>
      '<button data-plate="' + p + '" aria-pressed="' + on.has(p) + '">' + String(p).replace(".", ",") + " kg</button>"
  ).join("");
  box.querySelectorAll("[data-plate]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = Number(b.dataset.plate),
          s = ls.get(P + "plates") || {};
        const off = new Set(Array.isArray(s.off) ? s.off.map(Number) : []);
        if (off.has(p)) off.delete(p);
        else off.add(p);
        if (off.size === PLATES_ALL.length) {
          toast("Zostaw zaznaczony co najmniej jeden talerz.");
          return;
        }
        ls.set(P + "plates", { off: [...off] });
        renderPlatesSet();
        document.querySelectorAll(".plates").forEach((x) => plUpd(x.id.replace(/_pl$/, "")));
      })
  );
}
