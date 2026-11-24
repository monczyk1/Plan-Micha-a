// Testy: pytanie o masę ciała „na początku tygodnia” uznane za już zadane (chyba że test ustawi inaczej)
const pw=require('playwright');const orig=pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch=async(...a)=>{const b=await orig(...a);const nc=b.newContext.bind(b);
 b.newContext=async(...x)=>{const c=await nc(...x);if(!process.env.BMASK)await c.addInitScript(()=>{try{const m=new Date();m.setHours(12);m.setDate(m.getDate()-((m.getDay()+6)%7));const k=JSON.stringify(m.getFullYear()+"-"+(m.getMonth()+1)+"-"+m.getDate());const seg=location.pathname.split("/").filter(Boolean);let id=seg.pop()||"";if(id==="index.html")id=seg.pop()||"";const p=["damian","mateusz"].includes(id)?"gora"+id+"_":"gora_";if(localStorage.getItem(p+"bmW")===null)localStorage.setItem(p+"bmW",k)}catch(e){}});return c};
 b.newPage=async(...x)=>{const c=await b.newContext(...x);return c.newPage()};return b};
