// Chmura dla wielu osób: Michał (…/) i Damian (…/damian/) na jednym arkuszu, każdy z własnym PIN-em
const {chromium}=require('playwright');
const B='http://localhost:8766/',M='http://localhost:8792';
const res=[];const ok=(n,c,i)=>{const l=(c?'PASS ':'FAIL ')+n+(c?'':'  → '+JSON.stringify(i));res.push(l);console.log(l)};
const st=async()=>(await fetch(M+'/state')).json();
const post=async o=>(await fetch(M+'/exec',{method:'POST',body:JSON.stringify(o)})).json();
(async()=>{await fetch(M+'/reset');await fetch(M+'/setup?pins=MICHAL-111,DAMIAN-222');
let s=await st();ok('U1 setup: karty Uczestnicy + 4 karty osób',['Uczestnicy','Treningi','Kopie','Treningi – Damian','Kopie – Damian'].every(k=>s.sheets[k]),Object.keys(s.sheets));
ok('U1 karty kopii ukryte',s.sheets['Kopie'].hidden&&s.sheets['Kopie – Damian'].hidden);
const b=await chromium.launch({args:['--lang=pl-PL']});
const mk=async url=>{const c=await b.newContext({viewport:{width:393,height:852},locale:'pl-PL'});await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));await p.goto(url);await p.waitForTimeout(300);await p.click('#welcomeOk').catch(()=>{});return p};
const go=async(p,v)=>{await p.click('.tabs [data-view="'+v+'"]');await p.waitForTimeout(40)};
const connect=async(p,pin)=>{await go(p,'set');await p.check('#cloudOn');await p.fill('#cloudPin',pin);await p.click('#cloudConnect');await p.waitForTimeout(700);return p.textContent('#toast')};
// Michał
const m=await mk(B);let t=await connect(m,'MICHAL-111');ok('U2 Michał: połączono jako Michał',t.includes('jako Michał'),t);
await go(m,'train');await m.fill('#incline_kg_0','20');await m.fill('#incline_r_0','8');await m.click('#finish');await m.click('#save');await m.waitForTimeout(900);await m.click('#ssLater').catch(()=>{});
s=await st();ok('U2 kopia Michała w „Kopie”',s.sheets['Kopie'].rows===2&&s.sheets['Kopie – Damian'].rows===1,[s.sheets['Kopie'].rows,s.sheets['Kopie – Damian'].rows]);
ok('U2 treningi Michała w „Treningi”',JSON.stringify(s.sheets['Treningi'].cells).includes('Wyciskanie hantli'));
// Damian
const d=await mk(B+'damian/');
ok('U3 Damian: opis PIN-u dla właściciela',(await d.textContent('label[for="cloudPin"]')).includes('Uczestnicy'));
t=await connect(d,'MICHAL-111');ok('U3 Damian z PIN-em Michała łączy się jako Michał (PIN = osoba)',t.includes('jako Michał'),t);
await d.evaluate(()=>{cloud={on:false,pin:""};saveCloud()});await d.reload();await d.waitForTimeout(300);
t=await connect(d,'DAMIAN-222');ok('U3 Damian: połączono jako Damian',t.includes('jako Damian'),t);
await go(d,'train');await d.click('#seg button:nth-child(1)');await d.fill('#bench_kg_0','60');await d.fill('#bench_r_0','8');await d.click('#finish');await d.click('#save');await d.waitForTimeout(900);await d.click('#ssLater').catch(()=>{});
s=await st();ok('U3 kopia Damiana w „Kopie – Damian”',s.sheets['Kopie – Damian'].rows>=2,s.sheets['Kopie – Damian'].rows);
ok('U3 treningi Damiana w „Treningi – Damian”',JSON.stringify(s.sheets['Treningi – Damian'].cells).includes('PN'));
ok('U3 treningi Michała bez danych Damiana',!JSON.stringify(s.sheets['Treningi'].cells).includes('PN'));
const ucz=s.sheets['Uczestnicy'].cells;ok('U3 „Ostatnia kopia” wpisana',ucz[1][5]&&ucz[2][5],ucz);
// izolacja na poziomie API
const lm=await post({pin:'MICHAL-111',action:'list'}),ld=await post({pin:'DAMIAN-222',action:'list'});
ok('U4 listy rozłączne',lm.items.length&&ld.items.length&&!lm.items.some(x=>ld.items.some(y=>y.id===x.id)),[lm.items.length,ld.items.length]);
const g=await post({pin:'DAMIAN-222',action:'get',id:lm.items[0].id});ok('U4 Damian nie pobierze kopii Michała',!g.ok&&g.error==='not_found',g);
const g2=await post({pin:'DAMIAN-222',action:'get',id:ld.items[0].id});ok('U4 Damian pobiera swoją',g2.ok&&JSON.parse(g2.content).storage['goradamian_sessions']);
// błędne PIN-y
ok('U5 zły PIN',(await post({pin:'XXXXXXXX',action:'ping'})).error==='pin');
ok('U5 pusty / krótki PIN',(await post({pin:'',action:'ping'})).error==='pin'&&(await post({pin:'12',action:'ping'})).error==='pin');
await fetch(M+'/addrow?name=Tomek&pin=TOMEK-333');ok('U6 nowa osoba bez wdrażania',(await post({pin:'TOMEK-333',action:'ping'})).name==='Tomek');
const sv=await post({pin:'TOMEK-333',action:'save',snapshot:{sessions:[]}});s=await st();ok('U6 nowe karty Tomka utworzone same',sv.ok&&s.sheets['Kopie – Tomek']&&s.sheets['Kopie – Tomek'].hidden,Object.keys(s.sheets));
await fetch(M+'/addrow?name=Klon&pin=TOMEK-333');ok('U7 powtórzony PIN blokowany',(await post({pin:'TOMEK-333',action:'ping'})).error==='pin_dup');
await fetch(M+'/reset');await fetch(M+'/setup?pins=MICHAL-111,DAMIAN-222&off=1');
ok('U8 „NIE” w Aktywny blokuje',(await post({pin:'MICHAL-111',action:'ping'})).error==='pin'&&(await post({pin:'DAMIAN-222',action:'ping'})).ok);
ok('U9 brak błędów JS',!m.errs.length&&!d.errs.length,[m.errs,d.errs]);
await b.close()})();
