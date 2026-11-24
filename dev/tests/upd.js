// Aktualizacje (pasek, sprawdzanie, co nowego) + zaległa kopia w chmurze po powrocie internetu
const VB=require('../../version.json');const B=VB.build;
const {chromium}=require('playwright');
const R='http://localhost:8765/',SV='http://localhost:8766/',M='http://localhost:8792';
const ok=(n,c,i)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));
const st=async()=>(await fetch(M+'/state')).json();
(async()=>{const b=await chromium.launch({args:['--lang=pl-PL']});
const mk=async(url,init,clock)=>{const c=await b.newContext({viewport:{width:393,height:852},locale:'pl-PL',serviceWorkers:'block'});await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());if(init)await c.addInitScript(init);const p=await c.newPage();if(clock)await p.clock.install();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.ctx=c;await p.goto(url);await p.waitForTimeout(500);await p.click('#welcomeOk',{timeout:1500}).catch(()=>{});return p};
const go=async(p,v)=>{await p.click('.tabs [data-view="'+v+'"]');await p.waitForTimeout(60)};
// 1. aktualna wersja
let p=await mk(R);ok('A1 brak paska przy aktualnej wersji',!(await p.$('#updBar')));
await go(p,'set');ok('A1 numer wersji',(await p.textContent('#verTxt')).includes(B+' ('+VB.data+')'),await p.textContent('#verTxt'));
ok('A1 lista zmian (najnowszy wpis widoczny)',(await p.innerHTML('#verList')).includes(VB.zmiany[0].lista[0].slice(0,8)));
await p.click('#verChk');await p.waitForTimeout(300);ok('A2 ręczne sprawdzenie: najnowsza',(await p.textContent('#toast')).includes('najnowszą'));
ok('A3 nowy użytkownik bez okna „co nowego”',await p.isHidden('#tipSheet'));
// 2. nowsza wersja na serwerze
await p.ctx.route(/version\.json/,r=>r.fulfill({contentType:'application/json',body:JSON.stringify({build:B+1,data:'30.11.2026',zmiany:[{build:B+1,data:'30.11.2026',lista:['Testowa zmiana A','Druga zmiana']},{build:4,data:'23.11.2026',lista:['x']}]})}));
await go(p,'train');await p.fill('#incline_kg_0','27,5');await p.waitForTimeout(100);
await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(400);
const ub=await p.textContent('#updBar').catch(()=>null);ok('B1 pasek „Jest nowa wersja” z pierwszą zmianą',ub&&ub.includes('Jest nowa wersja')&&ub.includes('Testowa zmiana A')&&ub.includes('i więcej'),ub);
await p.click('#updGo');await p.waitForLoadState();await p.waitForTimeout(600);
ok('B2 po odświeżeniu trening w toku zostaje',await p.inputValue('#incline_kg_0')==='27,5');
const ub2=await p.textContent('#updBar').catch(()=>null);ok('B3 serwer wciąż nowszy → „jeszcze dociera”',ub2&&ub2.includes('jeszcze dociera'),ub2);
// 3. po aktualizacji – okno „co nowego”
p=await mk(R,()=>{if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('gora_seenBuild','2')}});
ok('C1 okno „Zaktualizowano” z wersjami 3 i 4',await p.isVisible('#tipSheet')&&(await p.textContent('#tipT')).includes('Zaktualizowano')&&(await p.textContent('#tipB')).includes('Ranking')&&(await p.textContent('#tipB')).includes('wersja 3')&&!(await p.textContent('#tipB')).includes('wersja 2'),await p.textContent('#tipB'));
await p.click('#tipX');await p.reload();await p.waitForTimeout(400);ok('C2 pokazuje się tylko raz',await p.isHidden('#tipSheet'));
p=await mk(R,()=>{if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('gora_welcome','1');localStorage.setItem('gora_sessions',JSON.stringify([{day:'A',date:'2026-11-20',ex:[],created:1}]))}});
ok('C3 obecny użytkownik bez numeru wersji też widzi zmiany',await p.isVisible('#tipSheet')&&(await p.textContent('#tipB')).includes('wersja '+B));
ok('C4 wersja Damiana ma własny version.json',(await (await fetch(R+'damian/version.json')).json()).build===B);
// 4. zaległa kopia bez zdarzenia „online”
await fetch(M+'/reset');await fetch(M+'/setup?pins=MICHAL-111,DAMIAN-222');
p=await mk(SV+'damian/',null,true);await p.evaluate(()=>{cloud={on:true,pin:'DAMIAN-222'};saveCloud()});
await p.ctx.route(/localhost:8792/,r=>r.abort());await p.evaluate(()=>Object.defineProperty(navigator,'onLine',{get:()=>false,configurable:true}));
await go(p,'train');await p.fill('#bench_kg_0','60');await p.fill('#bench_r_0','8');await p.click('#finish');await p.click('#save');await p.waitForTimeout(500);
ok('D1 zapis offline: komunikat o wysyłce później',(await p.textContent('#toast')).includes('Brak internetu'),await p.textContent('#toast'));
await p.ctx.unroute(/localhost:8792/);await p.evaluate(()=>Object.defineProperty(navigator,'onLine',{get:()=>true,configurable:true}));
let s=await st();ok('D2 kopia jeszcze nie wysłana',s.sheets['Kopie – Damian'].rows===1);
await p.clock.fastForward(31000);await p.waitForTimeout(800);s=await st(); // przyspieszony zegar zamiast czekania 30 s
ok('D3 po ≤30 s kopia sama trafia do chmury',s.sheets['Kopie – Damian'].rows===2,s.sheets['Kopie – Damian'].rows);
ok('D3 komunikat „Zaległa kopia wysłana”',(await p.textContent('#toast')).includes('Zaległa kopia'),await p.textContent('#toast'));
ok('Z brak błędów JS',!p.errs.length,p.errs);
await b.close()})();
