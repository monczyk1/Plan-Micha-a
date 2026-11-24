const {chromium}=require('playwright');const fs=require('fs');
const W=393,H=852,DSF=2.5;const pos={};
(async()=>{const b=await chromium.launch({args:['--lang=pl-PL']});const c=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:DSF,colorScheme:'dark',locale:'pl-PL',isMobile:true,hasTouch:true});
await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
const mk=(d,cr,day,ex)=>({id:"loc"+cr,local:true,day,week:1,date:d,created:cr,bw:"",notes:"",ex});
const S=(kg,r,n)=>Array.from({length:n},()=>({kg,r}));
const ses=[mk("2026-11-10",1,"A",[{k:"incline",n:"Wyciskanie hantli na ławce skośnej dodatniej",sets:S("20","9",3),rir:"2"},{k:"bench",n:"Wyciskanie sztangi leżąc",sets:S("50","8",3),rir:"2"},{k:"chestrow",n:"Wiosłowanie hantlami z klatką opartą o ławkę",sets:S("18","10",3)}]),
 mk("2026-11-13",2,"B",[{k:"dbohp",n:"Wyciskanie hantli siedząc",sets:S("14","9",3)},{k:"bbrow",n:"Wiosłowanie sztangą",sets:S("50","10",3)}]),
 mk("2026-11-17",3,"A",[{k:"incline",n:"Wyciskanie hantli na ławce skośnej dodatniej",sets:S("22,5","9",3),rir:"2"},{k:"bench",n:"Wyciskanie sztangi leżąc",sets:S("52,5","8",3),rir:"1"},{k:"chestrow",n:"Wiosłowanie hantlami z klatką opartą o ławkę",sets:S("20","10",3)}]),
 mk("2026-11-20",4,"B",[{k:"dbohp",n:"Wyciskanie hantli siedząc",sets:S("16","8",3)},{k:"bbrow",n:"Wiosłowanie sztangą",sets:S("52,5","10",3)}])];
await c.addInitScript(s=>{try{if(!localStorage.getItem("seeded")){localStorage.setItem("gora_sessions",JSON.stringify(s));localStorage.setItem("gora_welcome","1");localStorage.setItem("gora_lastbk",String(Date.now()+1e9));localStorage.setItem("seeded","1")}}catch(e){}},ses);
const p=await c.newPage();await p.goto('file:///home/claude/plan-micha-a/index.html');await p.addStyleTag({path:'fonts.css'});await p.waitForTimeout(800);
const shot=async n=>{await p.waitForTimeout(250);await p.screenshot({path:'cap/'+n+'.jpg',type:'jpeg',quality:92})};
const box=async sel=>{const r=await p.$eval(sel,e=>{const b=e.getBoundingClientRect();return[b.x+b.width/2,b.y+b.height/2]});return r};
await p.click('#seg button:nth-child(1)');await p.evaluate(()=>scrollTo(0,0));await shot('c1');pos.c1={segA:await box('#seg button:nth-child(1)'),t3:await box('#tgrid button[aria-pressed="true"]')};
// warm-up
await p.evaluate(()=>{const w=document.querySelector('.wup');w.scrollIntoView({block:'start'});scrollBy(0,-90)});pos.w0={sum:await box('.wup summary')};await shot('w0');
await p.click('.wup summary');await p.evaluate(()=>{const w=document.querySelector('.wup');w.scrollIntoView({block:'start'});scrollBy(0,-90)});await shot('w1');
await p.click('[data-wu="0"]');await p.click('[data-wu="1"]');pos.w2={ok0:await box('[data-wu="0"]'),ok1:await box('[data-wu="1"]')};await shot('w2');
await p.click('.wup summary');
// exercise
const card='.ex[data-card="incline"]';const toCard=async()=>{await p.evaluate(s=>{const e=document.querySelector(s);e.scrollIntoView({block:'start'});scrollBy(0,-14)},card)};
await toCard();await shot('e0');pos.e0={kg:await box('#incline_kg_0'),r:await box('#incline_r_0'),ok:await box('.ok[data-k="incline"][data-i="0"]')};
await p.fill('#incline_kg_0','25');await p.fill('#incline_r_0','8');await toCard();await shot('e1');
await p.click('.ok[data-k="incline"][data-i="0"]');await toCard();await shot('e2');pos.e2={rest:await box('#rest')};
for(const i of [1,2]){await p.fill('#incline_kg_'+i,'25');await p.fill('#incline_r_'+i,'8');await p.click('.ok[data-k="incline"][data-i="'+i+'"]')}
await p.click('#restX');await toCard();await shot('e3');pos.e3={sum:await box(card+' .csum')};
// technique on bench card
const bc='.ex[data-card="bench"]';await p.click(bc+' .meta details:first-child summary');await p.evaluate(s=>{const e=document.querySelector(s);e.scrollIntoView({block:'start'});scrollBy(0,-14)},bc);await shot('t1');pos.t1={vid:await box(bc+' .vid')};
await p.click(bc+' .meta details:first-child summary');
// alternatives
await p.click(bc+' .meta details:nth-child(2) summary');await p.evaluate(s=>{const e=document.querySelector(s);e.scrollIntoView({block:'start'});scrollBy(0,-14)},bc);await shot('a1');await p.click(bc+' .meta details:nth-child(2) summary');
// finish
await p.evaluate(()=>{document.querySelector('#finish').scrollIntoView({block:'end'});scrollBy(0,140)});await shot('f0');pos.f0={fin:await box('#finish')};
await p.click('#finish');await shot('f1');pos.f1={save:await box('#save')};
// tabs
await p.click('#finBack');await p.click('.tabs [data-view="hist"]');await p.click('#hist details summary');await shot('h1');pos.h1={tab:await box('.tabs [data-view="hist"]')};
await p.click('.tabs [data-view="prog"]');await shot('p1');pos.p1={tab:await box('.tabs [data-view="prog"]')};
await p.addStyleTag({content:'#cloudBox{display:none!important}'});await p.click('.tabs [data-view="set"]');await shot('s1');pos.s1={tab:await box('.tabs [data-view="set"]'),edit:await box('#editPlan')};
await p.click('#editPlan');await shot('s2');
fs.writeFileSync('pos.json',JSON.stringify(pos));console.log('ok',Object.keys(pos).length);await b.close()})();
