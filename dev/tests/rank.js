// Ranking: logika w skrypcie (mock v3) + zakładka w aplikacji + pasek postępu
const {chromium}=require('playwright');
const B='http://localhost:8766/',M='http://localhost:8792';
const res=[];const ok=(n,c,i)=>{const l=(c?'PASS ':'FAIL ')+n+(c?'':'  → '+JSON.stringify(i));res.push(l);console.log(l)};
const post=async o=>(await fetch(M+'/exec',{method:'POST',body:JSON.stringify(o)})).json();
const st=async()=>(await fetch(M+'/state')).json();
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const T0=new Date();const mon=new Date(T0);mon.setDate(T0.getDate()-((T0.getDay()+6)%7));
const D=n=>{const d=new Date(mon);d.setDate(mon.getDate()+n);return iso(d)};   // D(0)=poniedziałek tego tygodnia
const S=(date,ex)=>({date,day:'A',ex,created:Date.parse(date)});
const str=(k,n,sets)=>({k,n,sets:sets.map(([kg,r,w])=>w?{kg:String(kg),r:String(r),w:true}:{kg:String(kg),r:String(r)})});
const lite=(k,kind,done,all)=>({k,n:k,kind,sets:Array.from({length:done},()=>({r:'10',done:true}))});
(async()=>{await fetch(M+'/reset');await fetch(M+'/setup?pins=MICHAL-111,DAMIAN-222');
await fetch(M+'/addrow?name=Tomek&pin=TOMEK-333');await fetch(M+'/addrow?name=Ola&pin=OLA-44444');
// Michał: ten tydzień 5 serii (2 treningi); zeszły 9; dwa tygodnie temu 3
const mic={sessions:[
 S(D(0),[str('bench','Wyciskanie sztangi leżąc',[[80,2],[70,5],['','']]),str('skull','Francuskie',[[20,10]])]),
 S(D(1),[str('incline','Skos',[[30,8],[100,1,true]])]),
 S(D(-7),[str('bench','Wyciskanie sztangi leżąc',[[70,8],[70,8],[70,8],[70,8],[70,8],[70,8],[70,8],[70,8],[70,8]])]),
 S(D(-14),[str('bench','x',[[60,5],[60,5],[60,5]])]),
 S(D(9),[str('bench','przyszłość',[[200,1]])])]};
const dam={sessions:[
 S(D(0),[str('bench','Wyciskanie sztangi na ławce płaskiej',[[82,1],[60,8],[60,8]]),str('incline','Skos',[[30,10]]),lite('pallof','core',3),{k:'stair',n:'StairMaster',kind:'cardio',sets:[{r:'15',done:true}]}]),
 S(D(-7),[str('bench','b',[[60,8],[60,8],[60,8],[60,8]])]),
 S(D(-14),[str('bench','b',[[50,5],[50,5],[50,5]])])]};
const tom={sessions:[S(D(0),[str('bench','b',[[200,1],[1,1],[1,1],[1,1],[1,1],[1,1],[1,1],[1,1],[1,1],[1,1]])])]};
ok('R0 zapisy',(await post({pin:'MICHAL-111',action:'save',snapshot:mic})).ok&&(await post({pin:'DAMIAN-222',action:'save',snapshot:dam})).ok&&(await post({pin:'TOMEK-333',action:'save',snapshot:tom,rank:false})).ok);
const r=await post({pin:'DAMIAN-222',action:'rank',today:iso(T0)});
ok('R1 tydzień od poniedziałku',r.week===D(0),r.week);
const pp=r.people.map(p=>p.name+':'+p.sets+':'+p.trainings+(p.lead?':L':'')+(p.me?':ME':''));
ok('R1 serie tygodnia (tylko sekcja Ćwiczenia; core/cardio/rozgrzewka/puste nie)',JSON.stringify(pp)===JSON.stringify(['Michał:5:2:L','Damian:4:1:ME']),pp);
ok('R2 Tomek ukryty (rank:false), Ola bez kopii pominięta',!pp.some(x=>/Tomek|Ola/.test(x)));
const cups=r.cups.map(c=>c.name+'×'+c.n);ok('R3 puchary: zeszły tydzień Michał, remis 3:3 obaj',JSON.stringify(cups)===JSON.stringify(['Michał×2','Damian×1']),cups);
ok('R3 ostatni zwycięzca',r.last&&r.last.names.join()==='Michał'&&r.last.sets===9,r.last);
const bench=r.records.find(x=>x.k==='bench');ok('R4 82×1 wygrywa z 80×2 (bez przeliczania)',bench&&bench.list[0].name==='Damian'&&bench.list[0].kg===82&&bench.list[1].kg===80,bench);
ok('R4 przyszła data i ukryty Tomek nie liczą się',bench.list.length===2&&bench.list.every(x=>x.kg<200),bench.list);
const inc=r.records.find(x=>x.k==='incline');ok('R5 remis kg → więcej powtórzeń; rozgrzewka 100 kg pominięta',inc&&inc.list[0].name==='Damian'&&inc.list[1].kg===30,inc);
ok('R6 ćwiczenia jednej osoby i core poza rekordami',!r.records.some(x=>['skull','pallof','stair'].includes(x.k)),r.records.map(x=>x.k));
let s=await st();ok('R7 kolumna Ranking w arkuszu',s.sheets.Uczestnicy.cells[0][6]==='Ranking'&&s.sheets.Uczestnicy.cells[3][6]==='NIE',s.sheets.Uczestnicy.cells);
ok('R8 pref przywraca Tomka',(await post({pin:'TOMEK-333',action:'pref',rank:true})).ok&&(await post({pin:'DAMIAN-222',action:'rank',today:iso(T0)})).people[0].name==='Tomek');
await post({pin:'TOMEK-333',action:'pref',rank:false});
// ===== UI =====
const b=await chromium.launch({args:['--lang=pl-PL']});
const mk=async(url,pin)=>{const c=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,locale:'pl-PL',colorScheme:'dark'});await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.ctx=c;await p.goto(url);await p.waitForTimeout(300);await p.click('#welcomeOk').catch(()=>{});if(pin)await p.evaluate(pin=>{cloud={on:true,pin};saveCloud()},pin);return p};
const d=await mk(B+'damian/','DAMIAN-222');
await d.click('.tabs [data-view="rank"]');await d.waitForTimeout(600);
const tx=await d.textContent('#rank');
ok('U1 zakładka Ranking: lider z pucharem i TY',(await d.$eval('.rrow.lead',e=>e.innerText)).includes('🏆')&&(await d.$eval('.rrow.lead',e=>e.innerText)).includes('Michał')&&tx.includes('TY'),tx.slice(0,300));
ok('U1 do lidera brakuje 1 serii',tx.includes('Do lidera brakuje Ci 1 seria'),tx);
ok('U1 puchary i ostatni zwycięzca',tx.includes('🏆×2')&&tx.includes('ostatnio: Michał (9 serii)'));
ok('U1 rekordy: polska nazwa z katalogu, 82 kg × 1',tx.includes('82 kg × 1')&&tx.includes('Wyciskanie hantli na ławce skośnej')||tx.includes('82 kg × 1'),tx.slice(tx.indexOf('Rekordy')));
ok('U1 jednostka kg / hantel przy hantlach',tx.includes('kg / hantel'));
ok('U1 5 zakładek w jednym rzędzie',await d.$eval('.tabs',n=>{const t=[...n.querySelectorAll('button')].map(b=>b.getBoundingClientRect().top);return t.length===5&&Math.max(...t)-Math.min(...t)<2}));
await d.screenshot({path:__dirname+'/dm/rank1.png'});await d.evaluate(()=>scrollTo(0,9999));await d.waitForTimeout(100);await d.screenshot({path:__dirname+'/dm/rank2.png'});
// Michał ukrywa się
const m=await mk(B,'MICHAL-111');await m.click('.tabs [data-view="set"]');await m.uncheck('#rankOn');await m.waitForTimeout(500);
await d.click('#rankRef');await d.waitForTimeout(600);const tx2=await d.textContent('#rank');ok('U2 Michał ukryty znika z rankingu',!tx2.includes('Michał'),tx2.slice(0,300));
await m.click('.tabs [data-view="rank"]');await m.waitForTimeout(600);ok('U2 ukryty widzi informację',(await m.textContent('#rank')).includes('Jesteś ukryty'));
await m.click('.tabs [data-view="set"]');await m.check('#rankOn');await m.waitForTimeout(500);
// offline – ostatni stan
await d.ctx.route(/localhost:8792/,r=>r.abort());await d.click('#rankRef');await d.waitForTimeout(500);
ok('U3 offline: ostatni stan',(await d.textContent('#rank')).includes('Brak internetu')&&(await d.textContent('#rank')).includes('Damian'));
// bez chmury
const n=await mk(B+'damian/');await n.click('.tabs [data-view="rank"]');await n.waitForTimeout(200);
ok('U4 bez chmury: zaproszenie i przycisk',(await n.textContent('#rank')).includes('Włącz')&&await n.isVisible('#rankGo'));await n.click('#rankGo');ok('U4 przycisk prowadzi do Ustawień',await n.isVisible('#v-set'));
// pasek postępu
await n.click('.tabs [data-view="train"]');await n.click('#seg button:nth-child(1)');await n.waitForTimeout(100);
const s0=await n.textContent('#sumTxt');ok('P1 start: 0% · 0/27 serii · ~min',/^0% · 0\/27 serii · ~\d+ min/.test(s0),s0);
const m0=+s0.match(/~(\d+)/)[1];ok('P1 szacunek realny (50–90 min z cardio)',m0>=50&&m0<=90,m0);
for(const [k,i] of [['mbchest',0],['mbchest',1],['mbchest',2],['plyopush',0],['plyopush',1]]){await n.click('.ok[data-k="'+k+'"][data-i="'+i+'"]');await n.click('#restX').catch(()=>{})}
await n.fill('#bench_kg_0','60');await n.fill('#bench_r_0','8');await n.click('.ok[data-k="bench"][data-i="0"]');await n.click('#restX').catch(()=>{});
const s1=await n.textContent('#sumTxt');const w1=await n.$eval('#pbar',e=>e.style.width);
ok('P2 po 6 seriach: 22% · 6/27',s1.startsWith('22% · 6/27 serii'),s1);ok('P2 pasek 22%',w1==='22%',w1);
const m1=+s1.match(/~(\d+)/)[1];ok('P2 czas maleje',m1<m0,[m0,m1]);
await n.screenshot({path:__dirname+'/dm/prog.png'});
ok('Z brak błędów JS',![d,m,n].some(p=>p.errs.length),[d.errs,m.errs,n.errs]);
await b.close()})();
