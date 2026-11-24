const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:375,height:740}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);await p.click('#welcomeOk');await p.fill('#incline_kg_0','20');await p.fill('#incline_r_0','8');await p.click('#finish');await p.click('#save');await p.waitForTimeout(300);
await p.reload();await p.waitForTimeout(800);
await c.setOffline(true);await p.reload();await p.waitForTimeout(800);
const t=await p.title();const h=await p.$$eval('#hist summary',x=>x.length);const sw=await p.evaluate(()=>!!navigator.serviceWorker.controller);
const ok=(n,c,i)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));ok('OFF1 działa bez internetu',!!t&&h>=1,{t,h});ok('OFF2 service worker',!!sw);ok('OFF3 brak błędów JS',!errs.length,errs);await b.close()})();
