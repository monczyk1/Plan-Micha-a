// Plan Damiana – 5 dni PN–PT.
// ===== Plan Damiana (adres …/damian/) – 5 dni: push / pull / nogi / góra lżej / dół + brzuch =====
if(PRO.plan==="damian"){
 const CARD=()=>({k:"stair",kind:"cardio",n:"StairMaster (schody)",s:1,r:"15–20 min · Z2 147–154"});
 const PD={
 PN:{sub:"Push",ex:[
  {k:"mbchest",kind:"dyn",n:"Wyrzut piłki lekarskiej sprzed klatki",s:3,r:"5"},
  {k:"plyopush",kind:"dyn",n:"Pompki eksplozywne na podwyższeniu",s:2,r:"5"},
  {k:"bench",m:1,n:"Wyciskanie sztangi na ławce płaskiej",s:4,r:"6–8"},
  {k:"ohp",m:1,n:"Wyciskanie nad głowę (OHP)",s:3,r:"8–10"},
  {k:"incline",m:1,n:"Wyciskanie hantli na skosie",s:3,r:"10",ss:"A"},
  {k:"latraise",n:"Unoszenie hantli bokiem",s:3,r:"12–15",ss:"A"},
  {k:"pushdown",n:"Prostowanie ramion na wyciągu",s:3,r:"12"},
  {k:"pallof",kind:"core",n:"Pallof press",s:3,r:"10/str."},
  {k:"hollow",kind:"core",n:"Hollow hold",s:2,r:"20 s"},CARD()]},
 WT:{sub:"Pull",ex:[
  {k:"mbslam",kind:"dyn",n:"Slam piłką lekarską",s:3,r:"5"},
  {k:"latpd",m:1,n:"Ściąganie drążka (lub podciąganie)",s:4,r:"6–10"},
  {k:"chestrow",m:1,n:"Wiosłowanie z podparciem klatki",s:3,r:"8–10"},
  {k:"cablerow",n:"Wiosłowanie na wyciągu siedząc",s:3,r:"10–12",ss:"A"},
  {k:"facepull",n:"Face pulls",s:3,r:"15",ss:"A"},
  {k:"bbcurl",n:"Uginanie ramion ze sztangą",s:3,r:"10–12"},
  {k:"deadbug",kind:"core",n:"Dead bug",s:3,r:"8/str."},
  {k:"hang",kind:"core",n:"Zwis na drążku",s:2,r:"20 s"},CARD()]},
 SR:{sub:"Nogi",ex:[
  {k:"pogo",kind:"dyn",n:"Pogo – sprężyste podskoki",s:3,r:"15 s"},
  {k:"boxjump",kind:"dyn",n:"Wskok na skrzynię",s:3,r:"3"},
  {k:"squat",m:1,n:"Przysiad ze sztangą (lub hack)",s:4,r:"6–8"},
  {k:"rdl",m:1,n:"Martwy ciąg rumuński",s:3,r:"8–10"},
  {k:"lunge",n:"Wykroki w marszu",s:3,r:"10/nogę"},
  {k:"legcurl",n:"Uginanie nóg leżąc",s:3,r:"12"},
  {k:"calf",n:"Wspięcia na łydki",s:3,r:"15"},
  {k:"copen",kind:"core",n:"Deska kopenhaska",s:2,r:"15 s/str."},
  {k:"sideplank",kind:"core",n:"Deska boczna",s:2,r:"30 s/str."},CARD()]},
 CZ:{sub:"Góra lżej",ex:[
  {k:"mbrot",kind:"dyn",n:"Rzut piłką z rotacją o ścianę",s:3,r:"5/str."},
  {k:"lmpunch",kind:"dyn",n:"Landmine punch",s:2,r:"5/str."},
  {k:"dbbench",m:1,n:"Wyciskanie hantli na ławce",s:3,r:"12"},
  {k:"closepd",n:"Ściąganie drążka wąskim chwytem",s:3,r:"12"},
  {k:"dbrow",m:1,n:"Wiosłowanie hantlem",s:3,r:"12"},
  {k:"latraise",n:"Unoszenie bokiem",s:3,r:"15",ss:"A"},
  {k:"reversefly",n:"Tył barku (odwrotne rozpiętki)",s:3,r:"15",ss:"A"},
  {k:"curl",n:"Biceps – uginanie hantlami",s:3,r:"12–15",ss:"B"},
  {k:"pushdown",n:"Triceps – prostowanie na wyciągu",s:3,r:"12–15",ss:"B"},
  {k:"woodchop",kind:"core",n:"Woodchop na wyciągu",s:3,r:"10/str."},
  {k:"core",kind:"core",n:"Ab wheel",s:2,r:"8"},CARD()]},
 PT:{sub:"Dół + brzuch",ex:[
  {k:"kbswing",kind:"dyn",n:"Swing kettlebell",s:3,r:"10"},
  {k:"broadjump",kind:"dyn",n:"Skok w dal z miejsca",s:3,r:"3"},
  {k:"thrust",m:1,n:"Hip thrust",s:3,r:"8–10"},
  {k:"legpress",m:1,n:"Suwnica",s:3,r:"12"},
  {k:"stepup",n:"Step-upy (lub wykroki w marszu)",s:3,r:"10/nogę"},
  {k:"legcurl",n:"Uginanie nóg leżąc",s:3,r:"12"},
  {k:"slcalf",n:"Wspięcia na łydki jednonóż",s:3,r:"12/nogę"},
  {k:"tib",n:"Unoszenie stopy (tibialis)",s:2,r:"15"},
  {k:"plank",kind:"core",n:"Deska",s:3,r:"45 s"},
  {k:"hangraise",kind:"core",n:"Unoszenie nóg w zwisie",s:3,r:"12"},
  {k:"suitcase",kind:"core",n:"Spacer walizkowy",s:2,r:"30 m/str."},CARD()]}};
 const cardio=(n,c)=>({n,d:"3 min",c:c||"Spokojnie, tętno 120–135, da się swobodnie mówić",f:"cardio"});
 const rope={n:"Skakanka",d:"3 × 45 s",c:"2–3 cm nad podłogą, na przodostopiu, pięty nie dotykają ziemi. Kręcisz nadgarstkami, łokcie przy tułowiu, miękko w kolanach.",f:"rope"};
 const book={n:"Otwieranie książki",d:"5/str.",c:"Leżysz na boku, kolana ugięte. Górną rękę prowadzisz łukiem na drugą stronę, wzrok za dłonią.",f:"open"};
 const cat={n:"Koci grzbiet",d:"8",c:"Na czworakach powoli zaokrąglasz i wyginasz plecy, z oddechem.",f:"quad"};
 const hip90={n:"Biodro 90/90",d:"5/str.",c:"Siedzisz, obie nogi zgięte pod kątem 90°. Przekładasz kolana z jednej strony na drugą, tułów prosto.",f:"kneel"};
 const flex={n:"Rozciąganie zginacza biodra w klęku",d:"30 s/str.",c:"Klęk jednonóż. Napnij pośladek nogi z tyłu i przesuń biodro lekko w przód.",f:"kneel"};
 const bridge={n:"Mostek biodrowy",d:"10",c:"Leżysz, stopy blisko pośladków. Unieś biodra, ściśnij pośladki, 1 s na górze.",f:"bridge"};
 const band={n:"Rozciąganie gumy przed sobą",d:"15",c:"Proste ręce na wysokości barków, rozciągasz gumę ściągając łopatki.",f:"band"};
 const WD={
 PN:[cardio("Wioślarz"),rope,book,{n:"Ślizgi rąk po ścianie",d:"8",c:"Plecy i ręce przy ścianie. Przesuwasz ręce w górę i w dół bez odrywania lędźwi.",f:"vpush"},band,{n:"Przekładanie gumy nad głową",d:"10",c:"Szeroki chwyt, proste ręce, przenosisz gumę za plecy i z powrotem.",f:"vpush"},{n:"Pompki łopatkowe",d:"10",c:"Podpór na prostych rękach. Ruch tylko łopatkami: zbliżasz i rozsuwasz.",f:"core"},{n:"Serie dochodzące – wyciskanie",d:"4 serie",c:"Pusta sztanga × 10 → 50% × 6 → 70% × 3 → 85% × 1–2",f:"hpush"}],
 WT:[cardio("Wioślarz"),rope,cat,book,{n:"Zwis na drążku",d:"20 s",c:"Luźny zwis nachwytem, barki lekko aktywne.",f:"vpull"},{n:"Ściąganie łopatek na drążku",d:"10",c:"Proste ręce na drążku lub wyciągu. Ruch tylko łopatkami w dół, bez zginania łokci.",f:"vpull"},{n:"Face pull lekko",d:"15",c:"Lina do twarzy, łokcie wysoko.",f:"hpull"},{n:"Serie dochodzące – ściąganie",d:"2 serie",c:"50% × 10 → 75% × 5",f:"vpull"}],
 SR:[cardio("Rower","Spokojnie, tętno 120–135 – najłagodniejszy start dla kolan"),rope,hip90,{n:"Kostka przy ścianie",d:"10/str.",c:"Stopa ok. 10 cm od ściany. Kolano do ściany, pięta zostaje na podłodze.",f:"kneel"},flex,{n:"Przysiad z pauzą na dole",d:"2 × 5",c:"Bez ciężaru, 3 s na dole. Łokcie rozpychają kolana na zewnątrz.",f:"squat"},bridge,{n:"Wykrok w tył bez ciężaru",d:"5/str.",c:"Krok w tył, kolano prawie do podłogi, tułów prosto.",f:"lunge"},{n:"Serie dochodzące – przysiad",d:"5 serii",c:"Pusta × 10 → pusta × 8 → 50% × 5 → 70% × 3 → 85% × 1–2",f:"squat"}],
 CZ:[cardio("Orbitrek","Spokojnie, z pracą rąk, tętno 120–135"),rope,book,{n:"Rotacja zewnętrzna z gumą",d:"12/str.",c:"Łokieć przy boku zgięty 90°. Odciągasz przedramię na zewnątrz, łokieć zostaje przy tułowiu.",f:"band"},band,{n:"Rotacje tułowia w staniu",d:"10/str.",c:"Luźne ręce, obrót z bioder i tułowia, pięta tylnej nogi się odrywa – jak przy ciosie.",f:"rot"},{n:"Serie dochodzące – hantle",d:"1 seria",c:"Około 50% ciężaru roboczego × 10",f:"hpush"}],
 PT:[cardio("Bieżnia – marsz pod górę","Marsz, nachylenie 8–10%, rozgrzewa biodra i pośladki"),rope,flex,hip90,cat,{n:"Bird dog",d:"5/str.",c:"Na czworakach wyprostuj rękę i przeciwną nogę, plecy płasko, 2 s pauzy.",f:"quad"},bridge,{n:"Serie dochodzące – hip thrust",d:"3 serie",c:"Pusta sztanga × 10 → 50% × 8 → 75% × 4",f:"bridge"}]};
 for(const k of Object.keys(PLAN))delete PLAN[k];Object.assign(PLAN,PD);
 for(const k of Object.keys(WARM))delete WARM[k];Object.assign(WARM,WD);
 for(const k of Object.keys(DAYLBL))delete DAYLBL[k];Object.assign(DAYLBL,{PN:"PN",WT:"WT",SR:"ŚR",CZ:"CZW",PT:"PT"});
}
