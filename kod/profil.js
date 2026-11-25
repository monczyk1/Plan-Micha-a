// Kto korzysta: osoba rozpoznawana po adresie (…/damian/ itd.) i prefiks danych w telefonie.
// Dziennik błędów: w ważnych miejscach błąd nie znika po cichu, tylko trafia tutaj (wyłącznie w pamięci, nic nie zapisuje w telefonie).
// Podgląd: w konsoli przeglądarki wpisz BLEDY. Testy sprawdzają, że po zwykłym używaniu dziennik jest pusty.
window.BLEDY = [];
function blad(gdzie, e) {
  window.BLEDY.push({ gdzie, msg: String((e && e.message) || e), t: Date.now() });
  if (window.BLEDY.length > 50) window.BLEDY.shift();
  console.warn("[Tytanowa siła] " + gdzie + ":", e);
  if (window.onBlad) window.onBlad(); // czerwona kropka u właściciela (kod/raport.js)
}
// Uczestnicy: ta sama aplikacja pod adresem …/<id>/ (np. …/damian/) ma osobne miejsce na dane w telefonie.
// Nowa osoba: wpis tutaj + folder z manifest.webmanifest (patrz README) + wiersz z PIN-em w karcie „Uczestnicy” w arkuszu.
// plan: "damian" = plan 5 dni (PN–PT); bez „plan” – plan startowy A/B. owner – właściciel arkusza (inne teksty o chmurze).
const PROFILES = {
  damian: { name: "Damian", plan: "damian", owner: true },
  mateusz: { name: "Mateusz", plan: "mateusz" },
};
const PROF = (() => {
  const seg = location.pathname.split("/").filter(Boolean);
  let s = seg.pop() || "";
  if (s === "index.html") s = seg.pop() || "";
  return Object.prototype.hasOwnProperty.call(PROFILES, s) ? s : "";
})();
const PRO = PROFILES[PROF] || {};
const P = PROF ? "gora" + PROF + "_" : "gora_";
// Wygląd: automatycznie (jak telefon), jasny albo ciemny – P+"theme". Ustawiane od razu, żeby ekran nie mrugał w złym kolorze.
function applyTheme() {
  try {
    const t = JSON.parse(localStorage.getItem(P + "theme"));
    if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  } catch (e) {} // uszkodzone ustawienie = automatycznie
}
applyTheme();
