// Wczytanie planu: plan zapisany w telefonie ma pierwszeństwo przed planem z kodu.
const INFO_TXT=PRO.plan==="damian"?"5 treningów w tygodniu · PN–PT":PRO.plan==="mateusz"?"5 treningów po kolei · Klata → Nogi":"2 treningi w tygodniu · A / B";
const OLD={A:{n:"FBW A"},B:{n:"FBW B"},C:{n:"FBW C"}};
const PLAN_DEFAULT=JSON.parse(JSON.stringify(PLAN));
const LETTERS="ABCDEF";
try{const sp=JSON.parse(localStorage.getItem(P+"plan")||"null");if(sp&&typeof sp==="object"&&Object.keys(sp).length){for(const k of Object.keys(PLAN))delete PLAN[k];Object.assign(PLAN,sp)}}catch(e){}
// Plan zapisuje się w telefonie przy pierwszym uruchomieniu – późniejsze zmiany planu startowego w kodzie nie zmienią planu osobom, które już korzystają
try{if(!localStorage.getItem(P+"plan"))localStorage.setItem(P+"plan",JSON.stringify(PLAN))}catch(e){}
DAYS.length=0;DAYS.push(...Object.keys(PLAN));
