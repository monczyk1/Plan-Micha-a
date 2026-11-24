// „Wyślij raport”: krótka wiadomość z wersją, telefonem, stanem chmury i dziennikiem błędów.
// NIE zawiera treningów, PIN-u ani adresu chmury. Wysyłka przez udostępnianie telefonu (WhatsApp / SMS) albo kopiowanie.
function raportTelefon() {
  const u = navigator.userAgent || "";
  let t = "przeglądarka";
  const ios = u.match(/OS (\d+)[_.](\d+)/);
  if (/iPhone|iPad/.test(u)) t = (/iPad/.test(u) ? "iPad" : "iPhone") + (ios ? ", iOS " + ios[1] : "");
  else if (/Android (\d+)/.test(u)) t = "Android " + u.match(/Android (\d+)/)[1];
  else if (/Mac OS X/.test(u)) t = "Mac";
  else if (/Windows/.test(u)) t = "Windows";
  let skrot = false;
  try {
    skrot = !!navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  } catch (e) {} // nieistotne
  return t + " · " + (skrot ? "skrót na ekranie" : "w przeglądarce");
}
const raportGodz = (t) => {
  const d = new Date(t);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
};
function raportTekst(opis) {
  const L = ["Tytanowa siła – raport"];
  L.push("Osoba: " + (PRO.name || "Michał") + " · wersja " + APP_BUILD);
  L.push("Telefon: " + raportTelefon());
  const last = sessions[0];
  L.push("Treningów w telefonie: " + sessions.length + (last ? " · ostatni " + fmtDate(last.date) : ""));
  let ch = "wyłączona";
  if (cloud.on) {
    ch = "włączona";
    if (cst.last) ch += " · ostatnia kopia " + fmtTs(new Date(cst.last).toISOString());
    if (cst.pending) ch += " · czeka na wysłanie";
    if (cst.err) ch += " · błąd: " + cst.err; // „pin”, „net” albo „server” – bez samego PIN-u
  }
  L.push("Chmura: " + ch);
  const B = (window.BLEDY || []).slice(-10);
  L.push("Błędy (" + (window.BLEDY || []).length + "):" + (B.length ? "" : " brak"));
  for (const b of B) L.push("· " + raportGodz(b.t) + " " + b.gdzie + " – " + String(b.msg).slice(0, 120));
  const o = String(opis || "")
    .trim()
    .slice(0, 500);
  if (o) L.push("Opis: " + o);
  return L.join("\n");
}
async function raportWyslij() {
  const txt = raportTekst($("rapOpis").value);
  try {
    if (navigator.share) {
      await navigator.share({ text: txt, title: "Tytanowa siła – raport" });
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return; // użytkownik zamknął okno udostępniania
    blad("wysyłka raportu", e);
  }
  try {
    await navigator.clipboard.writeText(txt);
    toast("Raport skopiowany – wklej go w wiadomości do Damiana.", true);
  } catch (e) {
    $("rapPodglad").hidden = false;
    $("rapPodglad").value = txt;
    $("rapPodglad").select();
    toast("Zaznacz i skopiuj tekst raportu poniżej.");
  }
}
function raportOdswiez() {
  const n = (window.BLEDY || []).length,
    own = !!PRO.owner;
  const dot = document.querySelector('.tabs [data-view="set"]');
  if (dot) dot.classList.toggle("errdot", own && n > 0);
  const b = $("rapBledy");
  if (b) {
    b.hidden = !(own && n > 0);
    b.textContent = "● Są błędy (" + n + ")";
  }
}
function raportInit() {
  $("rapSend").onclick = raportWyslij;
  $("rapBledy").onclick = () => {
    const p = $("rapPodglad");
    p.hidden = false; // zawsze pokazuje aktualną treść (także po wcześniejszym podglądzie)
    p.value = raportTekst($("rapOpis").value);
  };
  window.onBlad = raportOdswiez;
  raportOdswiez();
}
