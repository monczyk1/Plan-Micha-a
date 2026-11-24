// Starsze testy klikają w ćwiczenia po kolei i w numery treningów (T1…) – dostają stary widok:
// wszystkie ćwiczenia rozwinięte i otwarte „Więcej” pod kafelkami. Nowy widok sprawdza tests/nowe.js (bez tego pliku).
const pw=require('playwright');const orig=pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch=async(...a)=>{const b=await orig(...a);const nc=b.newContext.bind(b);
 b.newContext=async(...x)=>{const c=await nc(...x);await c.addInitScript(()=>{try{const seg=location.pathname.split("/").filter(Boolean);let id=seg.pop()||"";if(id==="index.html")id=seg.pop()||"";const p=["damian","mateusz"].includes(id)?"gora"+id+"_":"gora_";if(localStorage.getItem(p+"focus")===null)localStorage.setItem(p+"focus","false");if(localStorage.getItem(p+"more")===null)localStorage.setItem(p+"more","true")}catch(e){}});return c};
 b.newPage=async(...x)=>{const c=await b.newContext(...x);return c.newPage()};return b};
