// Testy wersji Damiana (…/damian/) + izolacja danych od wersji Michała
const {chromium}=require('playwright');const fs=require('fs');
const BASE='http://localhost:8765/';const OUT=__dirname+'/dm/';fs.mkdirSync(OUT,{recursive:true});
const res=[];const ok=(n,c,i)=>{const l=(c?'PASS ':'FAIL ')+n+(c?'':'  → '+JSON.stringify(i));res.push(l);console.log(l)};
(async()=>{const b=await chromium.launch({args:['--lang=pl-PL']});
const c=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,locale:'pl-PL',colorScheme:'dark',acceptDownloads:true});
await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_FAILED/.test(m.text()))errs.push(m.text())});
const go=async v=>{await p.click('.tabs [data-view="'+v+'"]');await p.waitForTimeout(40)};
const keys=()=>p.evaluate(()=>Object.keys(localStorage).sort());
// D1 start
await p.goto(BASE+'damian/');await p.waitForTimeout(300);
const days=await p.$$eval('#seg button:not(.addt)',bs=>bs.map(x=>x.innerText.split('\n')[0].trim()));
ok('D1 5 dni PN–PT',JSON.stringify(days)===JSON.stringify(['PN','WT','ŚR','CZW','PT']),days);
ok('D1 opis 5 treningów',(await p.textContent('#storeInfo')).includes('5 treningów'),await p.textContent('#storeInfo'));
ok('D1 tytuł',(await p.title()).includes('Damian'));
ok('D1 powitanie PN–PT',(await p.textContent('#welcome')).includes('PN–PT'));
await p.click('#welcomeOk').catch(()=>{});
await p.click('#seg button:nth-child(1)');await p.waitForTimeout(60);
await p.screenshot({path:OUT+'d1.png'});
// D2 rozgrzewka
const wu=await p.$$eval('.wlist li',ls=>ls.map(l=>({n:l.querySelector('.wn').textContent,fig:!!l.querySelector('.wfig svg')})));
ok('D2 rozgrzewka PN 8 punktów ze skakanką',wu.length===8&&wu[1].n.includes('Skakanka'),wu.map(x=>x.n));
ok('D2 każdy punkt ma rysunek',wu.every(x=>x.fig),wu.filter(x=>!x.fig));
// D3 sekcje
const sect=await p.$$eval('.secth b',x=>x.map(e=>e.childNodes[0].textContent.trim()));
ok('D3 sekcje Dynamika/Ćwiczenia/Core/Cardio',JSON.stringify(sect)===JSON.stringify(['Dynamika','Ćwiczenia','Core','Cardio na koniec']),sect);
ok('D3 superseria',(await p.$$('.ss')).length===2);
const exn=await p.$$eval('.ex .exn',x=>x.map(e=>e.innerText));
ok('D3 PN: bench, OHP, StairMaster',exn.some(x=>x.includes('Wyciskanie sztangi na ławce'))&&exn.some(x=>x.includes('OHP'))&&exn.some(x=>x.includes('StairMaster')),exn);
// D4 cardio bez minutnika
await p.click('.ok[data-k="stair"][data-i="0"]');await p.waitForTimeout(60);
ok('D4 cardio ✓ bez minutnika przerwy',await p.isHidden('#rest'));
await p.click('.ok[data-k="mbchest"][data-i="0"]');await p.waitForTimeout(60);
ok('D4 dynamika ✓ startuje minutnik',await p.isVisible('#rest'));await p.click('#restX').catch(()=>{});
// D5 zapis
await p.fill('#bench_kg_0','60');await p.fill('#bench_r_0','8');await p.click('.ok[data-k="bench"][data-i="0"]');await p.click('#restX').catch(()=>{});
await p.click('#finish');await p.waitForTimeout(100);await p.screenshot({path:OUT+'d5.png'});await p.click('#save');await p.waitForTimeout(200);await p.click('#ssLater').catch(()=>{});
const k1=await keys();
ok('D5 dane tylko w goradamian_*',k1.some(k=>k==='goradamian_sessions')&&!k1.some(k=>k.startsWith('gora_')),k1);
const nx=await p.$eval('#seg button.on, #seg button[aria-pressed="true"]',b=>b.innerText).catch(()=>null);
ok('D5 następny dzień WT',nx&&nx.startsWith('WT'),nx);
await go('hist');ok('D5 historia: PN T1',(await p.textContent('#hist')).includes('PN')&&(await p.textContent('#hist')).includes('T1'));
// D6 ustawienia: bez chmury
await go('set');ok('D6 sekcja chmury z PIN-em z arkusza',await p.isVisible('#cloudBox'));await p.screenshot({path:OUT+'d6.png'});
// D7 katalog bez "undefined"
await go('train');await p.click('#addEx');await p.waitForTimeout(100);const cat=await p.textContent('#catalog').catch(()=>'');
ok('D7 katalog bez undefined',cat.length>100&&!/undefined|null/.test(cat),cat.slice(0,200));
await p.keyboard.press('Escape');await p.goto(BASE+'damian/');
// D8 edytor planu: 5 zakładek
await go('set');await p.click('#editPlan');await p.waitForTimeout(100);const tabs=await p.$$eval('#edTabs button',x=>x.map(e=>e.innerText.trim()));
ok('D8 edytor ma PN–PT',tabs.slice(0,5).join(',')==='Trening PN,Trening WT,Trening ŚR,Trening CZW,Trening PT',tabs);await p.click('#edX');
// D9 Michał w tym samym telefonie – osobne dane
await p.goto(BASE);await p.waitForTimeout(300);
const d2=await p.$$eval('#seg button:not(.addt)',bs=>bs.map(x=>x.innerText.split('\n')[0].trim()));
ok('D9 Michał: A/B',JSON.stringify(d2)===JSON.stringify(['A','B']),d2);
await p.click('#welcomeOk').catch(()=>{});await go('hist');
ok('D9 Michał: pusta historia',!(await p.textContent('#hist')).includes('T1'),await p.textContent('#hist'));
await go('train');await p.fill('#incline_kg_0','20');await p.fill('#incline_r_0','8');await p.click('#finish');await p.click('#save');await p.waitForTimeout(200);await p.click('#ssLater').catch(()=>{});
const snapM=await p.evaluate(()=>Object.keys(snapshot().storage));
ok('D9 kopia Michała bez danych Damiana',snapM.length&&snapM.every(k=>k.startsWith('gora_')),snapM);
ok('D9 cloud u Michała widoczny',await p.evaluate(()=>!!CLOUD_URL));
// D10 wracam do Damiana – jego dane nietknięte
await p.goto(BASE+'damian/');await p.waitForTimeout(300);
const sesD=await p.evaluate(()=>sessions.length);ok('D10 Damian nadal 1 trening',sesD===1,sesD);
const snapD=await p.evaluate(()=>snapshot());ok('D10 kopia Damiana tylko jego klucze',Object.keys(snapD.storage).every(k=>k.startsWith('goradamian_')),Object.keys(snapD.storage));
// D11 przywracanie kopii w wersji Damiana
await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('goradamian_sessions'));s.push(Object.assign({},s[0],{created:Date.now()+5,date:'2026-11-20'}));localStorage.setItem('goradamian_sessions',JSON.stringify(s))});
await p.goto(BASE+'damian/');await p.waitForTimeout(200);
await p.evaluate(s=>importBackup(JSON.stringify(s)),snapD);await p.waitForTimeout(100);
ok('D11 okno przywracania',await p.isVisible('#rsSheet'));await p.click('#rsOk');await p.waitForLoadState();await p.waitForTimeout(400);
ok('D11 po przywróceniu 1 trening',await p.evaluate(()=>sessions.length)===1);
const kM=await p.evaluate(()=>JSON.parse(localStorage.getItem('gora_sessions')||'[]').length);ok('D11 dane Michała nietknięte',kM===1,kM);
// D12 kopia Michała wczytana u Damiana → klucze przemapowane
await p.evaluate(s=>importBackup(JSON.stringify({app:'tytanowa-sila',v:2,exported:new Date().toISOString(),storage:s})),await p.evaluate(()=>{const o={};for(const k of Object.keys(localStorage))if(k.startsWith('gora_'))o[k]=localStorage.getItem(k);return o}));
ok('D12 obca kopia rozpoznana (1 trening)',(await p.textContent('#rsTxt')).includes('1 trening'),await p.textContent('#rsTxt'));await p.click('#rsCancel');
ok('D13 brak błędów JS',errs.length===0,errs);
fs.writeFileSync(__dirname+'/damian.out',res.join('\n'));await b.close()})();
