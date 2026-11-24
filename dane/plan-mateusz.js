// Plan Mateusza – 5 dni po kolei (Klata → Nogi) i podpowiedzi z wcześniejszych treningów (SEED).
// Podpowiedzi (cień w seriach) z ostatnich treningów przed aplikacją – nie są zapisane jako treningi, więc nie liczą się do rekordów
const SEED={};
if(PRO.plan==="mateusz"){
 const R3=(a,b,c)=>[a,b,c],E=r=>["",r];
 Object.assign(SEED,{
 KL:{bench:[[97.5,5],[97.5,5],[97.5,5],[97.5,5],[97.5,5]],dips:[[7.5,15],[10,15],[12,15]],kneeraise:[E(20),E(20),E(20)],platepress:[[25,12],[30,10],[32.5,8]],pecdeck:[[55,16],[65,12],[75,10]],core:[E(16),E(16),E(16)],lowcablefly:[[20,12],[25,10],[30,8]],pullover:[[30,12],[32,10],[34,8]],squeeze:[[16,16]]},
 LA:{ezskull:[[20,12],[22.5,10],[25,8]],curl:[[14,12],[16,10],[17.5,8]],ohext1:[[12,12],[14,10],[16,8]],hammer:[[14,12],[16,10],[17.5,8]],pushdown:[[35,12],[40,10],[50,10]],cablecurl:[[40,12],[45,10],[55,10]]},
 PL:{pull:[[4,9],[6,7],[7.5,6],[10,5]],dbshrug:[[30,30],[32,25],[34,22]],hyper:[[10,16],[15,14],[20,12]],latpd:[[50,12],[55,10],[60,10]],cablerow:[[60,12],[70,10],[80,8]],bbrow:[[40,12],[50,10],[60,8]]},
 BB:{dbohp:[[14,12],[16,10],[18,8]],kneeraise:[E(20),E(20),E(20)],pronerear:[[6,20],[8,20],[10,16]],core:[E(16),E(16),E(16)],latraise:[[12,16],[14,14],[14,12]],rtwist:[[16,40],[17.5,40],[20,40]],frontraise:[[10,12],[12,10],[14,8]],sidebend:[[25,20],[25,25],[25,30]],latraisestr:[[10,12],[12,8],[12,6]],cablecrunch:[[50,30],[55,30],[60,30]],declcrunch:[[5,30],[10,25],[15,20]]},
 NG:{legpress:[[80,12],[100,10],[120,8]],calf:[[32.5,30],[42.5,25],[52.5,20]],legcurl:[[12.5,12],[17.5,10],[22.5,8]],legext:[[15,12],[20,10],[25,8]],benchmax:[[40,40],[40,20],[40,25]]}});
 const PM={
 KL:{sub:"Klatka + dipy",ex:[
  {k:"bench",m:1,n:"Wyciskanie sztangi na ławce płaskiej",s:5,r:"5"},
  {k:"dips",n:"Pompki na poręczach (dipy)",s:3,r:"15",ss:"A"},
  {k:"kneeraise",n:"Unoszenie kolan w podporze na poręczach",s:3,r:"20",ss:"A"},
  {k:"platepress",m:1,n:"Wyciskanie siedząc na maszynie (talerze)",s:3,r:"12–8"},
  {k:"pecdeck",n:"Rozpiętki na maszynie (butterfly)",s:3,r:"16–10",ss:"B"},
  {k:"core",n:"Kółko do brzucha (roller)",s:3,r:"16",ss:"B"},
  {k:"lowcablefly",n:"Rozpiętki z dolnych wyciągów",s:3,r:"12–8"},
  {k:"pullover",n:"Pullover z hantlem leżąc",s:3,r:"12–8"},
  {k:"squeeze",n:"Squeeze press – hantle dociśnięte (opcjonalnie)",s:3,r:"16"},
  {k:"atwfly",n:"Rozpiętki „dookoła świata” (opcjonalnie)",s:3,r:"12"}]},
 LA:{sub:"Biceps + triceps",ex:[
  {k:"ezskull",m:1,n:"Francuz – sztanga łamana",s:3,r:"12–8"},
  {k:"curl",n:"Uginanie ramion z hantlami z supinacją",s:3,r:"12–8"},
  {k:"ohext1",n:"Prostowanie ramienia z hantlem zza głowy",s:3,r:"12–8/rękę"},
  {k:"hammer",n:"Uginanie młotkowe hantli",s:3,r:"12–8"},
  {k:"pushdown",n:"Prostowanie ramion na wyciągu (linka)",s:3,r:"12–10"},
  {k:"cablecurl",n:"Uginanie ramion na wyciągu dolnym",s:3,r:"12–10"}]},
 PL:{sub:"Podciąganie + wiosła",ex:[
  {k:"pull",m:1,n:"Podciąganie z obciążeniem",s:4,r:"9–5"},
  {k:"dbshrug",n:"Szrugsy z hantlami (kaptury)",s:3,r:"30–22"},
  {k:"hyper",n:"Wyprosty na ławce rzymskiej z talerzem",s:3,r:"16–12"},
  {k:"latpd",m:1,n:"Ściąganie drążka do klatki (wyciąg górny)",s:3,r:"12–10"},
  {k:"cablerow",n:"Wiosłowanie na wyciągu dolnym siedząc",s:3,r:"12–8"},
  {k:"bbrow",m:1,n:"Wiosłowanie sztangą w opadzie",s:3,r:"12–8"}]},
 BB:{sub:"Barki + brzuch",ex:[
  {k:"dbohp",m:1,n:"Wyciskanie hantli siedząc",s:3,r:"12–8"},
  {k:"kneeraise",n:"Unoszenie nóg w podporze na poręczach",s:3,r:"20"},
  {k:"pronerear",n:"Unoszenie hantli na tył barku leżąc na skosie",s:3,r:"20–16"},
  {k:"core",n:"Kółko do brzucha (roller)",s:3,r:"16"},
  {k:"latraise",n:"Unoszenie hantli bokiem",s:3,r:"16–12"},
  {k:"rtwist",n:"Russian twist z kettlem",s:3,r:"40"},
  {k:"frontraise",n:"Unoszenie hantli w przód z supinacją",s:3,r:"12–8"},
  {k:"sidebend",n:"Skłony boczne z hantlem",s:3,r:"20–30/str."},
  {k:"latraisestr",n:"Unoszenie hantli bokiem na prostych rękach",s:3,r:"12–6"},
  {k:"cablecrunch",n:"Allahy (spięcia brzucha na wyciągu)",s:3,r:"30"},
  {k:"declcrunch",n:"Brzuszki na skosie w dół z talerzem",s:3,r:"30–20"}]},
 NG:{sub:"Nogi + core",ex:[
  {k:"legpress",m:1,n:"Suwnica",s:3,r:"12–8",ss:"A"},
  {k:"plank",n:"Deska (front plank)",s:3,r:"1,5 min",ss:"A"},
  {k:"calf",n:"Wspięcia na palce stojąc (maszyna)",s:3,r:"30–20"},
  {k:"legcurl",n:"Uginanie nóg leżąc",s:3,r:"12–8"},
  {k:"legext",n:"Prostowanie nóg siedząc (maszyna)",s:3,r:"12–8"},
  {k:"dl",m:1,n:"Martwy ciąg klasyczny",s:3,r:"5–8",ss:"B"},
  {k:"sideplank",n:"Deska boczna",s:3,r:"1,5 min",ss:"B"},
  {k:"benchmax",n:"Wyciskanie sztangi – max powtórzeń w 2 min",s:3,r:"max w 2 min"},
  {k:"farmer",n:"Spacer farmera",s:3,r:"30–40 m"},
  {k:"zercher",m:1,n:"Przysiad Zerchera",s:3,r:"8–10"}]}};
 for(const k of Object.keys(PLAN))delete PLAN[k];Object.assign(PLAN,PM);
 for(const k of Object.keys(WARM))delete WARM[k];
 for(const k of Object.keys(DAYLBL))delete DAYLBL[k];Object.assign(DAYLBL,{KL:"KLATA",LA:"ŁAPY",PL:"PLECY",BB:"BARKI",NG:"NOGI"});
}
