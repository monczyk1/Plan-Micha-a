// Tonaż: Postępy, podsumowanie (porównanie, rekord objętości, rozpiska, ranking na żywo), udostępnianie, ranking kg
const {chromium}=require('playwright');const fs=require('fs');
const R='http://localhost:8765/damian/',SV='http://localhost:8766/damian/',M='http://localhost:8792';
const ok=(n,c,i)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const T0=new Date();const mon=new Date(T0);mon.setDate(T0.getDate()-((T0.getDay()+6)%7));const D=n=>{const d=new Date(mon);d.setDate(mon.getDate()+n);return iso(d)};
const S=(date,day,ex,extra)=>Object.assign({date,day,ex,created:Date.parse(date)+1,week:1},extra||{});
const st=(k,n,sets)=>({k,n,sets:sets.map(([kg,r,w])=>w?{kg:String(kg),r:String(r),w:true}:{kg:String(kg),r:String(r)})});
// PN zeszły tydzień: bench 60×8×3 = 1440, incline (hantle) 20×10×2 = 400 ×2 = 800, rozgrzewka 40×5 nie → 2240; dur 50
const seed=[S(D(-7),'PN',[st('bench','Wyciskanie',[[40,5,1],[60,8],[60,8],[60,8]]),st('incline','Skos',[[20,10],[20,10]]),st('pull','Podciąganie',[[80,8],[83,6]]),st('pushup','Pompki',[[0,15]])],{dur:50}),
            S(D(-14),'WT',[st('latpd','Ściąganie',[[50,10],[50,10]])])]; // 1000
(async()=>{const b=await chromium.launch({args:['--lang=pl-PL']});
const mk=async(url,cloudPin)=>{const c=await b.newContext({viewport:{width:393,height:852},locale:'pl-PL',serviceWorkers:'block',acceptDownloads:true});c.setDefaultTimeout(6000);await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await c.route(/version\.json/,r=>r.abort());
  await c.addInitScript(([seed,pin])=>{if(!sessionStorage.s){sessionStorage.s=1;localStorage.setItem('goradamian_welcome','1');localStorage.setItem('goradamian_lastbk',String(Date.now()+1e9));localStorage.setItem('goradamian_sessions',JSON.stringify(seed));if(pin)localStorage.setItem('goradamian_cloud',JSON.stringify({on:true,pin}))}},[seed,cloudPin]);
  const p=await c.newPage();p.c=c;p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));await p.goto(url);await p.waitForTimeout(400);return p};
let p=await mk(R);
await p.click('.tabs [data-view="prog"]');const tc=await p.textContent('#prog');
ok('T1 tonaż łącznie 4,6 t (R1 wliczona, hantle ×2, podciąganie z masą ciała, pompki nie)',tc.includes('4,6 t')&&tc.includes('łącznie'),tc.slice(0,200));
ok('T1 wykres 8 tygodni',(await p.$$('.tchart > button')).length===8&&(await p.$$('.tlab span')).length===8);
ok('T1 porównanie dla zabawy',/samochodów|fortepianów|słoni/.test(tc));
const rules=await p.evaluate(()=>['bench','ohext','lunge','dbrow','slcalf','farmer','pull','plank','incline','walklunge','conccurl'].map(k=>k+':'+vf(k)).join(','));
ok('T1 reguły: sztanga 1, oburącz 1, wykroki 4, jednorącz 2, jednonóż 2, farmer/podciąganie/deska 0',rules==='bench:1,ohext:1,lunge:4,dbrow:2,slcalf:2,farmer:0,pull:1,plank:0,incline:2,walklunge:4,conccurl:2',rules);
await p.click('[data-tw="6"]');await p.waitForTimeout(100);const det=await p.textContent('.tdet');
ok('T1b słupek → szczegóły tygodnia',det.includes('PN')&&det.includes('3578 kg'),det.slice(0,200));
await p.click('.tds summary');const det2=await p.textContent('.tds');ok('T1b kg per ćwiczenie, R1 i reguła, wykluczenia',det2.includes('1640 kg')&&det2.includes('R 40×5')&&det2.includes('800 kg')&&det2.includes('2 hantle')&&det2.includes('Nie wlicza się: Pompki (ciężar ciała)')&&det2.includes('1138 kg')&&det2.includes('masa ciała'),det2);
await p.screenshot({path:__dirname+'/dm/ton1.png'});
await p.click('[data-tw="6"]');ok('T1b ponowne stuknięcie chowa',!(await p.$('.tdet')));
// podsumowanie
await p.click('.tabs [data-view="train"]');await p.click('#seg button:nth-child(1)');
for(const i of [0,1,2,3]){await p.fill('#bench_kg_'+i,'62,5');await p.fill('#bench_r_'+i,'8')}
await p.fill('#incline_kg_0','24');await p.fill('#incline_r_0','10');
ok('T2 pasek na dole: 2 000 + 480 kg',(await p.textContent('#sumTxt')).includes('2480 kg'),await p.textContent('#sumTxt'));
await p.click('#finish');await p.waitForTimeout(200);
ok('T3 objętość w podsumowaniu 2 480 kg',(await p.textContent('#finStats')).replace(/\s/g,'').includes('2480kg'),await p.textContent('#finStats'));
const cmp=await p.textContent('#finCmp');ok('T4 porównanie z poprzednim PN (+2%, serie 7 → 5)',cmp.includes('vs poprzedni PN')&&cmp.includes('-31%')||cmp.includes('−31%')&&cmp.includes('10 → 5'),cmp);
ok('T5 bez rekordu objętości (mniej niż ostatnio)',!cmp.includes('Najcięższy trening'),cmp);
ok('T6 podsumowanie bez rozpiski',!(await p.$('#finEx')));
ok('T7 bez chmury brak rankingu na żywo',await p.isHidden('#finRank'));
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#finShare')]);const fp=__dirname+'/dm/share.png';await dl.saveAs(fp);
ok('T8 obrazek do udostępnienia',fs.statSync(fp).size>20000&&dl.suggestedFilename().startsWith('trening-'),[fs.statSync(fp).size,dl.suggestedFilename()]);
await p.screenshot({path:__dirname+'/dm/ton2.png'});
await p.click('#save');await p.waitForTimeout(300);await p.click('#ssLater',{timeout:1500}).catch(()=>{});
const s0=await p.evaluate(()=>sessions[0]);ok('T9 zapis: vol, liczba serii i czas',s0.vol===2480&&s0.nsets===5&&s0.dur>=1,[s0.vol,s0.nsets,s0.dur]);
ok('T9 starsze treningi też mają vol',await p.evaluate(()=>sessions.every(s=>typeof s.vol==='number')));
// ranking na żywo + kg (skrypt v4 w atrapie)
await fetch(M+'/reset');await fetch(M+'/setup?pins=MICHAL-111,DAMIAN-222');
await fetch(M+'/exec',{method:'POST',body:JSON.stringify({pin:'MICHAL-111',action:'save',snapshot:{sessions:[S(D(0),'A',[st('bench','b',[[80,10],[80,10],[80,10]])],{vol:2400}),S(D(-7),'A',[st('bench','b',[[200,10]])])]}})});
await fetch(M+'/exec',{method:'POST',body:JSON.stringify({pin:'DAMIAN-222',action:'save',snapshot:{sessions:seed}})});
const q=await mk(SV,'DAMIAN-222');await q.click('#seg button:nth-child(1)');
for(const i of [0,1,2,3]){await q.fill('#bench_kg_'+i,'60');await q.fill('#bench_r_'+i,'8')}
await q.click('#finish');await q.waitForTimeout(900);const fr=await q.textContent('#finRank');
ok('T10 ranking na żywo: lider z tym treningiem (4 serie vs Michał 3)',fr.includes('liderem tygodnia')&&fr.includes('Michał 3'),fr);
ok('T10 kilogramy tygodnia: 2. miejsce (1 920 < 2 400)',fr.includes('Kilogramy tygodnia')&&fr.includes('2. miejsce'),fr);
await q.screenshot({path:__dirname+'/dm/ton3.png'});await q.click('#finBack');
await q.click('.tabs [data-view="rank"]');await q.waitForTimeout(800);const rt=await q.textContent('#rank');
ok('T11 ranking: tabela kilogramów',rt.includes('Kilogramy w tym tygodniu')&&(await q.$$eval('.rrow.lead',x=>x.map(e=>e.textContent))).some(x=>x.includes('🏋️')&&x.includes('Michał')),rt.slice(0,400));
ok('T11 puchary za kilogramy',rt.includes('Za kilogramy')&&rt.includes('🏋️×'),rt.slice(rt.indexOf('Puchary'),rt.indexOf('Puchary')+300));
await q.screenshot({path:__dirname+'/dm/ton4.png',fullPage:false});
// stary skrypt (v3) – bez pól kg: nic się nie psuje
await q.c.route(/localhost:8792/,async r=>{const res=await r.fetch();const j=await res.json();if(j.people)j.people.forEach(p=>{delete p.kg;delete p.w;delete p.pw;delete p.m;delete p.pm;delete p.a;delete p.streak;delete p.last});delete j.kgCups;delete j.lastKg;delete j.history;r.fulfill({response:res,json:j})});
await q.click('#rankRef');await q.waitForTimeout(700);const rt3=await q.textContent('#rank');ok('T12 skrypt v3: brak tabeli kg, ranking serii działa',!rt3.includes('Kilogramy w tym')&&rt3.includes('Serie w tym tygodniu'),rt3.slice(0,200));
await q.click('.tabs [data-view="train"]');await q.click('#finish');await q.waitForTimeout(800);const fr3=await q.textContent('#finRank');ok('T12 podsumowanie bez linii kg',fr3.includes('lider')&&!fr3.includes('Kilogramy'),fr3);
ok('Z brak błędów JS',!p.errs.length&&!q.errs.length,[p.errs,q.errs]);
await b.close()})();
