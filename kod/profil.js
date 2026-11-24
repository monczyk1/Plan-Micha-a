// Kto korzysta: osoba rozpoznawana po adresie (…/damian/ itd.) i prefiks danych w telefonie.
// Uczestnicy: ta sama aplikacja pod adresem …/<id>/ (np. …/damian/) ma osobne miejsce na dane w telefonie.
// Nowa osoba: wpis tutaj + folder z manifest.webmanifest (patrz README) + wiersz z PIN-em w karcie „Uczestnicy” w arkuszu.
// plan: "damian" = plan 5 dni (PN–PT); bez „plan” – plan startowy A/B. owner – właściciel arkusza (inne teksty o chmurze).
const PROFILES={damian:{name:"Damian",plan:"damian",owner:true},mateusz:{name:"Mateusz",plan:"mateusz"}};
const PROF=(()=>{const seg=location.pathname.split("/").filter(Boolean);let s=seg.pop()||"";if(s==="index.html")s=seg.pop()||"";return Object.prototype.hasOwnProperty.call(PROFILES,s)?s:""})();
const PRO=PROFILES[PROF]||{};
const P=PROF?"gora"+PROF+"_":"gora_";
