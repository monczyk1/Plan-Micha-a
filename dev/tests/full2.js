const {chromium}=require('playwright');const fs=require('fs');
const URL0='file://'+require('path').resolve(__dirname,'../../index.html');
const res=[];const ok=(name,cond,info)=>{const l=(cond?'PASS ':'FAIL ')+name+(cond?'':'  → '+JSON.stringify(info));res.push(l);require('fs').appendFileSync('log.txt',l+'\n')};
(async()=>{const b=await chromium.launch();
const mk=async(opts={})=>{const c=await b.newContext(Object.assign({viewport:{width:375,height:740},acceptDownloads:true},opts));await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));await p.goto(URL0);await p.waitForTimeout(300);return {c,p}};
const dlBackup=async(p,file)=>{await p.click('.tabs [data-view="set"]');const [d]=await Promise.all([p.waitForEvent('download'),p.click('#bkFile')]);fs.copyFileSync(await d.path(),file);await p.click('.tabs [data-view="train"]');return JSON.parse(fs.readFileSync(file,'utf8'))};
const restore=async(p,file)=>{await p.click('.tabs [data-view="set"]');if(await p.isHidden('#bkBox'))await p.click('#bkShow');const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#bkPickFile')]);await fc.setFiles(file);await p.waitForTimeout(150)};
const confirmRestore=async p=>{await Promise.all([p.waitForNavigation(),p.click('#rsOk')]);await p.waitForTimeout(300)};
const hist=p=>p.$$eval('#hist summary',x=>x.map(e=>e.textContent));
const nsets=(p,k)=>p.$$eval('[id^="'+k+'_kg_"]',x=>x.length);
const toastT=p=>p.textContent('#toast');
const go=async(p,v)=>{await p.click('.tabs [data-view="'+v+'"]');await p.waitForTimeout(30)};
const saveSess=async p=>{await p.click('#finish');await p.waitForTimeout(50);await p.click('#save')};

// S1 fresh
let {c,p}=await mk();
ok('S1 ekran powitalny',await p.isVisible('#welcome'));ok('S1 pusta historia',(await hist(p)).length===0);
ok('S1 T1 bieżący',(await p.textContent('#tgrid button.cur'))==='T1');
await p.click('#welcomeOk');

// S2 log A
for(let i=0;i<3;i++){await p.fill('#incline_kg_'+i,'20');await p.fill('#incline_r_'+i,'8')}
await p.fill('#bench_kg_0','40');await p.fill('#bench_r_0','8');await p.click('.chips[data-k="incline"] button[data-v="2"]');await p.click('#finish');await p.fill('#notes','dobrze');await p.click('#save');await p.waitForTimeout(200);
ok('S2 zapis w historii',(await hist(p)).length===1,await hist(p));ok('S2 panel kopii po zapisie',await p.isVisible('#saveSheet'));
ok('S2 następny trening B',(await p.$eval('#seg button[aria-pressed="true"]',e=>e.textContent)).startsWith('B'));
await p.click('#ssLater');
const bk1=await dlBackup(p,'bk1.json');ok('S2 kopia v2 ze storage',bk1.v===2&&!!bk1.storage&&!!bk1.storage.gora_sessions,Object.keys(bk1));
ok('S2 baner znika po kopii',!(await p.isVisible('#bkTop')));

// S3 draft on B
await p.fill('#dbohp_kg_0','14');await p.fill('#dbohp_r_0','8');await p.click('[data-rm="bbrow"]');await p.click('[data-add="dbbench"]');
await p.reload();await p.waitForTimeout(300);
ok('S3 szkic po odświeżeniu',(await p.inputValue('#dbohp_kg_0'))==='14');ok('S3 − seria zapamiętana',(await nsets(p,'bbrow'))===2,await nsets(p,'bbrow'));ok('S3 + seria zapamiętana',(await nsets(p,'dbbench'))===4);

// S4 snapshot BK2 then mess
const bk2=await dlBackup(p,'bk2.json');ok('S4 kopia zawiera szkic',!!bk2.storage.gora_draft&&bk2.storage.gora_draft.includes('14'));
await p.fill('#dbohp_kg_0','99');await p.click('[data-rm="dbbench"]');
await p.fill('#bbrow_kg_0','60');await p.fill('#bbrow_r_0','10');await saveSess(p);await p.waitForTimeout(200);await p.click('#ssLater');
ok('S4 drugi trening zapisany',(await hist(p)).length===2);
await go(p,'set');await p.click('#editPlan');await p.click('#edTabs button:nth-child(1)');await p.click('[data-del="0"]');await p.click('#edSave');await p.waitForTimeout(200);
ok('S4 plan zmieniony',!(await p.$('#incline_kg_0')));
await restore(p,'bk2.json');ok('S4 okno potwierdzenia',await p.isVisible('#rsSheet'));const rsTxt=await p.textContent('#rsTxt');ok('S4 ostrzeżenie o utracie',/1 trening zapisanych po tej kopii zniknie/.test(rsTxt),rsTxt);
await confirmRestore(p);
ok('S4 historia jak w kopii',(await hist(p)).length===1,await hist(p));
ok('S4 plan jak w kopii',!!(await p.$('#incline_kg_0'))||(await p.$$eval('#seg button:not(.addt)',x=>x.length))===2);
await go(p,'train');await p.click('#seg button:nth-child(2)');
ok('S4 szkic jak w kopii (14 kg)',(await p.inputValue('#dbohp_kg_0'))==='14',await p.inputValue('#dbohp_kg_0'));
ok('S4 serie jak w kopii',(await nsets(p,'bbrow'))===2&&(await nsets(p,'dbbench'))===4,[await nsets(p,'bbrow'),await nsets(p,'dbbench')]);
await go(p,'train');await p.click('#seg button:nth-child(1)');ok('S4 plan A przywrócony',!!(await p.$('#incline_kg_0')));
ok('S4 pasek „Przywrócono” + Cofnij',await p.isVisible('#rsDone')&&await p.isVisible('#rsUndo'));

// S5 undo
await Promise.all([p.waitForNavigation(),p.click('#rsUndo')]);await p.waitForTimeout(300);
ok('S5 cofnięcie: 2 treningi',(await hist(p)).length===2,await hist(p));ok('S5 cofnięcie: zmieniony plan',!(await p.$('#incline_kg_0'))||(await p.$eval('#seg button[aria-pressed="true"]',e=>e.textContent)).startsWith('B'));
ok('S5 brak błędów JS',p.errs.length===0,p.errs);await c.close();

// S6 fresh device restore bk1
({c,p}=await mk());await restore(p,'bk1.json');await confirmRestore(p);
ok('S6 nowe urządzenie: 1 trening',(await hist(p)).length===1);
// S10 edit past session
await go(p,'hist');await p.click('#hist details summary');await p.click('[data-fix]');ok('S10 tryb poprawiania',await p.isVisible('#pvSave'));
await p.fill('#pv_0_0_kg','22,5');await p.click('[data-pvdel="0_2"]');await p.click('[data-pvadd="1"]');await p.fill('#pv_notes','poprawione');await p.click('#pvSave');await p.waitForTimeout(150);
const h1=await p.$eval('#hist details',d=>{d.open=true;return d.innerText});
ok('S10 poprawka w historii',h1.includes('22,5×8')&&h1.includes('poprawione'),h1);ok('S10 usunięta seria',(h1.match(/20×8/g)||[]).length===1,h1);
ok('S10 podpowiedź po poprawce',/22,5/.test(await p.textContent('.ex .sug').catch(()=>'')),await p.textContent('.ex .sug').catch(()=>null));
// S11 discard
await go(p,'hist');await p.click('#hist details summary');await p.click('[data-fix]');await p.fill('#pv_0_0_kg','999');await p.click('#pvBack');const h2=await p.$eval('#hist details',d=>{d.open=true;return d.innerText});ok('S11 anulowanie bez zmian',!h2.includes('999'),h2);
// S11b switch day while editing discards
await go(p,'hist');await p.click('#hist details summary');await p.click('[data-fix]');await p.click('[data-pvadd="0"]');await go(p,'train');await p.click('#seg button:nth-child(2)');await go(p,'train');await p.click('#seg button:nth-child(1)');const h3=await p.$eval('#hist details',d=>{d.open=true;return d.innerText});ok('S11b zmiana dnia odrzuca niezapisane',(h3.match(/×/g)||[]).length===(h2.match(/×/g)||[]).length,[h2,h3]);
// S13 earlier date
await go(p,'train');await p.click('#seg button:nth-child(1)');await p.fill('#incline_kg_0','18');await p.fill('#incline_r_0','8');await p.click('#finish');await p.fill('#date','2026-11-01');await p.click('#save');await p.waitForTimeout(150);await p.click('#ssLater');
const hs=await hist(p);ok('S13 starsza data = T1',hs.some(x=>x.includes('01.11')&&x.includes('T1'))&&hs.some(x=>x.includes(new Date().toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'}))&&x.includes('T2')),hs);
// S12 delete via past view
await go(p,'train');await p.click('#seg button:nth-child(1)');await p.click('#tgrid button[data-t="0"]');await p.click('#pvDel');await p.click('#pvDel');await p.waitForTimeout(100);
const hs2=await hist(p);ok('S12 usunięcie i przenumerowanie',hs2.length===1&&hs2[0].includes('T1'),hs2);
// S14 rename keeps history
await go(p,'set');await p.click('#editPlan');await p.fill('[data-f="n"][data-i="1"]','Wyciskanie leżąc NOWE');await p.click('#edSave');const h4=await p.$eval('#hist details',d=>{d.open=true;return d.innerText});ok('S14 historia ze starą nazwą',h4.includes('Wyciskanie sztangi leżąc'),h4);
ok('S6-14 brak błędów JS',p.errs.length===0,p.errs);await c.close();

// S7 old format
fs.writeFileSync('old.json',JSON.stringify({app:"gora-ciala",v:1,exported:"2026-11-20T10:00:00Z",sessions:[{id:"loc5",day:"A",week:1,date:"2026-11-20",created:5,ex:[{k:"bench",n:"Wyciskanie sztangi leżąc",sets:[{kg:"50",r:"6"}]}]}]}));
({c,p}=await mk());await restore(p,'old.json');ok('S7 stara kopia: potwierdzenie',await p.isVisible('#rsSheet'));await confirmRestore(p);ok('S7 stara kopia wczytana',(await hist(p)).length===1);
// S8 invalid
fs.writeFileSync('bad.json','hello');await restore(p,'bad.json');ok('S8 zły plik: komunikat',/nie jest plik kopii/.test(await toastT(p)));ok('S8 dane nietknięte',(await hist(p)).length===1);
// S9 paste
await go(p,'set');if(await p.isHidden('#bkBox'))await p.click('#bkShow');await p.fill('#bkIn',fs.readFileSync('bk1.json','utf8'));await p.click('#bkLoad');ok('S9 wklejenie: potwierdzenie',await p.isVisible('#rsSheet'));await p.click('#rsCancel');ok('S9 anuluj nic nie zmienia',(await hist(p)).length===1);
ok('S7-9 brak błędów JS',p.errs.length===0,p.errs);await c.close();

// S16 storage failure
({c,p}=await mk());await p.click('#welcomeOk');await p.evaluate(()=>{const o=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==="gora_sessions")throw new Error("quota");return o.call(this,k,v)}});
await go(p,'train');await p.fill('#incline_kg_0','20');await p.fill('#incline_r_0','8');await saveSess(p);await p.waitForTimeout(200);ok('S16 ostrzeżenie o braku zapisu',/nie pozwala zapisać/.test(await toastT(p)),await toastT(p));await c.close();

// S18 narrow + dark
({c,p}=await mk({viewport:{width:320,height:640},colorScheme:'dark'}));ok('S18 brak przewijania w bok (320px)',!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
await p.click('#welcomeOk');await go(p,'set');await p.click('#editPlan');ok('S18 edytor bez przewijania w bok',!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));await c.close();

// S19 many sessions
({c,p}=await mk());const many=[];for(let i=0;i<150;i++){const d=new Date(2026,0,1+i*2).toISOString().slice(0,10);many.push({id:"loc"+(1000+i),day:i%2?"B":"A",week:1,date:d,created:1000+i,ex:[{k:i%2?"dbohp":"bench",n:i%2?"Wyciskanie hantli siedząc":"Wyciskanie sztangi leżąc",sets:[{kg:String(40+i/4),r:"8"}]}]})}
fs.writeFileSync('many.json',JSON.stringify({sessions:many}));await restore(p,'many.json');await confirmRestore(p);
const t0=Date.now();await go(p,'train');await p.click('#seg button:nth-child(2)');await go(p,'train');await p.click('#seg button:nth-child(1)');const dt=Date.now()-t0;ok('S19 150 treningów: szybkie przełączanie ('+dt+' ms)',dt<1500);
ok('S19 numer T76',(await p.textContent('#tgrid button.cur'))==='T76',await p.textContent('#tgrid button.cur'));ok('S19 brak błędów',p.errs.length===0,p.errs);await c.close();

console.log(res.join('\n'));console.log('\n'+res.filter(x=>x.startsWith('PASS')).length+'/'+res.length+' PASS');await b.close()})().catch(e=>{console.log(res.join('\n'));console.log('CRASH',e.message.split('\n')[0])});
