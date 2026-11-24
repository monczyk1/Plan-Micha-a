// Mateusz: profil, plan, masa ciała, podciąganie/dipy z obciążeniem, poziomy maszyn, migracja starych wpisów
const {chromium}=require('playwright');
const B='http://localhost:8765/';const ok=(n,c,i)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=async()=>{const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});await c.route(/fonts\.(googleapis|gstatic)|script\.google/,r=>r.abort());return c};
let c=await ctx();let p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(B+'mateusz/');await p.waitForTimeout(500);
ok('M1 tytuł',(await p.title()).includes('Mateusz'),await p.title());
const tiles=await p.$$eval('#seg button',x=>x.map(e=>e.childNodes[0].textContent));ok('M1 dni',tiles.slice(0,5).join()==='KLATA,ŁAPY,PLECY,BARKI,NOGI',tiles);
ok('M2 Klata 10 ćwiczeń',await p.evaluate(()=>exList().length)===10);
ok('M2 rozgrzewka',await p.evaluate(()=>WARM.KL&&WARM.KL.length>3));
// powitanie
const wel=await p.$('#welcome:not([hidden])');if(wel){const btn=await p.$('#welcome button.save, #welcome .save, #welClose, #welcome button');if(btn)await btn.click()}
await p.waitForSelector('#bmAsk:not([hidden])',{timeout:12000}).catch(()=>{});
ok('M4 pytanie o masę',await p.isVisible('#bmAsk'));
await p.screenshot({path:'dm/m_bm.png'});
await p.fill('#bmIn','84');await p.click('#bmOk');await p.waitForTimeout(300);
ok('M4 zapis masy',await p.evaluate(()=>bmLast().kg)===84);
ok('M4 tydzień odnotowany',await p.evaluate(()=>ls.get(P+"bmW")===bmWeek()));
ok('M3 tylko goramateusz_',await p.evaluate(()=>Object.keys(localStorage).every(k=>k.startsWith('goramateusz_'))),await p.evaluate(()=>Object.keys(localStorage)));
// PLECY: podciąganie z obciążeniem
await p.click('#seg button:nth-child(3)');await p.waitForTimeout(300);
await p.fill('#pull_kg_0','7,5');await p.fill('#pull_r_0','9');await p.fill('#pull_kg_1','0');await p.fill('#pull_r_1','10');
ok('S1 cień podciągania +4',await p.getAttribute('#pull_kg_0','placeholder')==='4');ok('M5 tonaż podciągania (84+7,5)×9+84×10',await p.evaluate(()=>curVol())===1664,await p.evaluate(()=>curVol()));
ok('M5 podpowiedź obciążenia',(await p.textContent('[data-card="pull"] .hint.bwl')).includes('84 kg'));
await p.locator('[data-card="pull"]').screenshot({path:'dm/m_pull.png'});
// KLATA: talerze ×2, poziomy, max w 2 min
await p.click('#seg button:nth-child(1)');await p.waitForTimeout(300);
await p.fill('#platepress_kg_0','25');await p.fill('#platepress_r_0','12');
ok('M6 maszyna na talerze ×2',await p.evaluate(()=>curVol())===600,await p.evaluate(()=>curVol()));
ok('S1 cień z planu: ławka 97,5×5',await p.getAttribute('#bench_kg_0','placeholder')==='97,5'&&await p.getAttribute('#bench_r_0','placeholder')==='5');
ok('S1 cień: butterfly 55 kg',await p.getAttribute('#pecdeck_kg_0','placeholder')==='55');
ok('S1 opis „Z Twojego planu”',(await p.textContent('[data-card="bench"]')).includes('Z Twojego planu'));
ok('S1 nagłówek dipów',(await p.textContent('[data-card="dips"] .set.cols')).includes('+ kg do masy'));
ok('S1 brak poziomów',!(await p.$('[data-unit]')));
ok('S2 brak zapisanych treningów (rekordy puste)',await p.evaluate(()=>sessions.length===0));
await p.locator('[data-card="dips"]').screenshot({path:'dm/m_dips.png'});
await p.evaluate(()=>{$("platepress_kg_0").value="";$("platepress_r_0").value=""});
// pierwsza karta (ekran startowy)
await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'dm/m_home.png'});
// NOGI: max w 2 min liczone
await p.click('#seg button:nth-child(5)');await p.waitForTimeout(300);
await p.fill('#benchmax_kg_0','40');await p.fill('#benchmax_r_0','40');
ok('M8 max w 2 min liczone',await p.evaluate(()=>curVol())===1600,await p.evaluate(()=>curVol()));
// Postępy
await p.evaluate(()=>{const L=[{d:"2026-10-27",kg:86.2},{d:"2026-11-03",kg:85.4},{d:"2026-11-10",kg:85.1},{d:"2026-11-17",kg:84.6}];ls.set(P+"bm",L.concat(bmList()))});
await p.click('[data-view="prog"]');await p.waitForTimeout(300);
ok('M10 wykres masy',await p.isVisible('#prog .bmsvg'));
await p.screenshot({path:'dm/m_prog.png'});
await p.click('[data-view="set"]');await p.waitForTimeout(200);
ok('M10 ustawienia',(await p.textContent('#bmSetTxt')).length>10);
await p.locator('#bmSetTxt').evaluate(e=>e.closest('section').scrollIntoView());await p.screenshot({path:'dm/m_set.png'});
// tydzień później znów pyta, ten sam tydzień – nie
await p.evaluate(()=>{ls.set(P+"bmW","2000-1-3");localStorage.removeItem(P+"draft")});await p.reload();await p.waitForTimeout(2500);ok('M11 nowy tydzień pyta',await p.isVisible('#bmAsk'));
await p.click('#bmLater');await p.reload();await p.waitForTimeout(2500);ok('M11 ten sam tydzień nie pyta',!(await p.isVisible('#bmAsk')));
await c.close();
// Migracja: Damian ze starym wpisem 83×10
c=await ctx();p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{if(!localStorage.getItem("seed")){localStorage.setItem("seed","1");localStorage.setItem("goradamian_sessions",JSON.stringify([{id:"loc1",day:"WT",week:1,date:"2026-11-18",created:1,ex:[{k:"pull",n:"Podciąganie",sets:[{kg:"83",r:"10"},{kg:"80",r:"8"}]}],rv:3,vol:1470}]));localStorage.setItem("goradamian_bmW",'"x"')}});
await p.goto(B+'damian/');await p.waitForTimeout(800);
ok('M9 bez masy: stary format bez zmian',await p.evaluate(()=>sessions[0].ex[0].sets[0].kg==="83"&&volOf(sessions[0])===1470),await p.evaluate(()=>[sessions[0].ex[0].sets,volOf(sessions[0])]));
{const w=await p.$('#welcomeOk');if(w&&await w.isVisible())await w.click()}if(await p.isVisible('#tipX'))await p.click('#tipX');await p.waitForSelector('#bmAsk:not([hidden])',{timeout:8000}).catch(()=>{});const bmv=await p.isVisible('#bmAsk');ok('M9 pytanie o masę u Damiana',bmv);
if(bmv){await p.fill('#bmIn','80');await p.click('#bmOk');await p.waitForTimeout(300)}
const r=await p.evaluate(()=>({s:sessions[0].ex[0].sets.map(t=>t.kg),v:volOf(sessions[0]),bw2:sessions[0].bw2,vs:sessions[0].vol}));
ok('M9 przeliczone na obciążenie',r.s.join()==='3,0'&&r.bw2===1,r);ok('M9 tonaż bez zmian',r.v===1470&&r.vs===1470,r);
await c.close();
ok('M12 brak błędów JS',!errs.length,errs);await b.close()})();
