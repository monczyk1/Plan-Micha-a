const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext();await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
await c.route(/script\.google\.com/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
const p=await c.newPage();await p.goto('http://localhost:8765/damian/');await p.click('#welcomeOk').catch(()=>{});await p.click('.tabs [data-view="set"]');await p.check('#cloudOn');await p.fill('#cloudPin','MICHAL-111');await p.click('#cloudConnect');await p.waitForTimeout(500);
const t=await p.textContent('#toast');const on=await p.evaluate(()=>cloud.on);console.log((t.includes('wersja dla jednej osoby')&&!on?'PASS':'FAIL')+' v1-guard',t,on);await b.close()})();
