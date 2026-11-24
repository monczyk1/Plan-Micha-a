// „⇅ Kolejność” – zmiana kolejności ćwiczeń strzałkami, superserie, tylko dziś / na stałe
const {chromium}=require('playwright');
const R='http://localhost:8765/damian/';
const ok=(n,c,i)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));
(async()=>{const b=await chromium.launch({args:['--lang=pl-PL']});
const mk=async()=>{const c=await b.newContext({viewport:{width:393,height:852},locale:'pl-PL',serviceWorkers:'block'});c.setDefaultTimeout(5000);await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await c.route(/version\.json/,r=>r.abort());const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));await p.goto(R);await p.waitForTimeout(300);await p.click('#welcomeOk').catch(()=>{});await p.click('#seg button:nth-child(1)');return p};
const str=p=>p.evaluate(()=>exList().filter(e=>!e.kind).map(e=>e.k+(e.ss?'('+e.ss+')':'')).join(','));
const mv=async(p,k,d)=>{await p.click('.ordr [data-id="'+k+'"][data-mv="'+d+'"]');await p.waitForTimeout(60)};
let p=await mk();
ok('O1 przycisk „⇅ Kolejność”',await p.isVisible('#ordGo'));
await p.fill('#bench_kg_0','60');await p.fill('#bench_r_0','8');await p.click('.ok[data-k="bench"][data-i="0"]');await p.click('#restX').catch(()=>{});
for(const i of [0,1,2]){await p.click('.ok[data-k="mbchest"][data-i="'+i+'"]');await p.click('#restX').catch(()=>{})}
await p.click('#ordGo');await p.waitForTimeout(100);
ok('O2 tryb kolejności: lista 10 ćwiczeń, bez kart i rozgrzewki',(await p.$$('.ordr')).length===10&&!(await p.$('.ex[data-card]'))&&!(await p.$('.wup')));
ok('O2 sekcje',JSON.stringify(await p.$$eval('.ordg',x=>x.map(e=>e.textContent)))==='["Dynamika","Ćwiczenia","Core","Cardio na koniec"]');
ok('O3 strzałki na granicach sekcji wyłączone',await p.isDisabled('.ordr [data-id="bench"][data-mv="-1"]')&&await p.isDisabled('.ordr [data-id="plyopush"][data-mv="1"]')&&await p.isDisabled('.ordr [data-id="stair"][data-mv="1"]'));
// superseria – pytanie
await mv(p,'incline',-1);ok('O4 pytanie przy superserii',await p.isVisible('#ssAsk')&&(await p.textContent('#ssAskB')).includes('Unoszenie hantli bokiem'),await p.textContent('#ssAskB'));
await p.click('#ssNo');ok('O4 Anuluj nic nie zmienia',(await str(p))==='bench,ohp,incline(A),latraise(A),pushdown',await str(p));
await mv(p,'incline',-1);await p.click('#ssOne');
ok('O5 tylko to ćwiczenie: superseria rozdzielona',(await str(p))==='bench,incline,ohp,latraise,pushdown',await str(p));
ok('O5 podświetlone przesunięte',(await p.$eval('.ordr.moved',e=>e.textContent)).includes('skos'));
await mv(p,'incline',-1);ok('O6 drugi ruch bez pytania',await p.isHidden('#ssAsk')&&(await str(p))==='incline,bench,ohp,latraise,pushdown',await str(p));
ok('O6 zrobione ćwiczenie oznaczone, częściowe nie',(await p.$eval('.ordr.done',e=>e.textContent)).includes('piłki')&&(await p.$$('.ordr.done')).length===1);
await p.click('#ordDone');await p.waitForTimeout(100);
const cards=await p.$$eval('#exList .ex[data-card]:not(.lite)',x=>x.map(e=>e.dataset.card));ok('O7 karty w nowej kolejności',cards.join(',')==='incline,bench,ohp,latraise,pushdown',cards);
ok('O7 wpisane serie zostały',await p.inputValue('#bench_kg_0')==='60');
await p.reload();await p.waitForTimeout(300);ok('O8 kolejność po odświeżeniu',(await str(p))==='incline,bench,ohp,latraise,pushdown');
// zakończenie – tylko dziś
await p.click('#finish');ok('O9 pytanie przy zakończeniu, domyślnie „Tylko dziś”',await p.isVisible('#finOrd')&&(await p.getAttribute('#ordToday','aria-pressed'))==='true');
await p.click('#save');await p.waitForTimeout(250);await p.click('#ssLater').catch(()=>{});await p.click('#tipX').catch(()=>{});
const saved=await p.evaluate(()=>sessions[0].ex.filter(e=>!e.kind).map(e=>e.k).join(','));ok('O10 historia zapisana w kolejności z dziś',saved==='incline,bench,ohp,latraise,pushdown',saved);
ok('O10 plan bez zmian',await p.evaluate(()=>PLAN.PN.ex.filter(e=>!e.kind).map(e=>e.k+(e.ss?'('+e.ss+')':'')).join(','))==='bench,ohp,incline(A),latraise(A),pushdown');
// cała superseria + skok nad parą
await p.click('#seg button:nth-child(1)');await p.click('#ordGo');
await mv(p,'incline',1);await p.click('#ssPair');ok('O11 cała superseria w dół',(await str(p))==='bench,ohp,pushdown,incline(A),latraise(A)',await str(p));
await mv(p,'pushdown',1);ok('O12 pojedyncze przeskakuje nad całą parą',(await str(p))==='bench,ohp,incline(A),latraise(A),pushdown',await str(p));
await mv(p,'ohp',1);ok('O12 ...i w drugą stronę',(await str(p))==='bench,incline(A),latraise(A),ohp,pushdown',await str(p));
await p.click('#ordDone');await p.fill('#bench_kg_0','60');await p.fill('#bench_r_0','8');
await p.click('#finish');await p.click('#ordPerm');await p.click('#save');await p.waitForTimeout(250);await p.click('#ssLater').catch(()=>{});await p.click('#tipX').catch(()=>{});
ok('O13 „Na stałe” zapisuje plan',await p.evaluate(()=>PLAN.PN.ex.filter(e=>!e.kind).map(e=>e.k+(e.ss?'('+e.ss+')':'')).join(','))==='bench,incline(A),latraise(A),ohp,pushdown');
ok('O13 plan zapisany w telefonie',await p.evaluate(()=>JSON.parse(localStorage.getItem('goradamian_plan')).PN.ex.filter(e=>!e.kind).map(e=>e.k)[1])==='incline');
await p.click('#seg button:nth-child(1)');await p.fill('#bench_kg_0','60');await p.fill('#bench_r_0','8');await p.click('#finish');ok('O14 bez zmian kolejności – bez pytania',await p.isHidden('#finOrd'));await p.click('#finBack');
// na stałe z rozdzieloną superserią → superseria znika z planu
await p.click('#ordGo');await mv(p,'latraise',1);await p.click('#ssOne');await p.click('#ordDone');await p.click('#finish');await p.click('#ordPerm');await p.click('#save');await p.waitForTimeout(250);await p.click('#ssLater').catch(()=>{});await p.click('#tipX').catch(()=>{});
ok('O15 rozdzielona superseria usunięta z planu',await p.evaluate(()=>PLAN.PN.ex.filter(e=>!e.kind).map(e=>e.k+(e.ss?'('+e.ss+')':'')).join(','))==='bench,incline,ohp,latraise,pushdown',await p.evaluate(()=>PLAN.PN.ex.filter(e=>!e.kind).map(e=>e.k+(e.ss?'('+e.ss+')':'')).join(',')));
// trening dodatkowy: domyślnie „Na stałe”
await p.click('#seg .addt');await p.fill('#ntName','Nogi 1');await p.click('#ntChips [data-g="Nogi"]');for(const k of ['squat','lunge'])await p.check('#ntList [data-k="'+k+'"]');await p.click('#ntGo');await p.waitForTimeout(150);
await p.click('#ordGo');await mv(p,'lunge',-1);await p.click('#ordDone');await p.fill('#squat_kg_0','100');await p.fill('#squat_r_0','5');await p.click('#finish');
ok('O16 trening dodatkowy: domyślnie „Na stałe”',(await p.getAttribute('#ordPerm','aria-pressed'))==='true'&&(await p.textContent('#finOrdT')).includes('Nogi 1'));
await p.click('#finBack');await p.click('#seg button:nth-child(1)');await p.fill('#bench_kg_0','70');await p.fill('#bench_r_0','6');await p.click('#ordGo');await p.click('#finish');await p.waitForTimeout(100);
ok('O17 „Zakończ” w trybie kolejności nie gubi serii',(await p.textContent('#finStats')).includes('1serii z wpisem')||(await p.textContent('#finStats')).includes('1 serii'),await p.textContent('#finStats'));
await p.click('#finBack');ok('O17 wartość została',await p.inputValue('#bench_kg_0')==='70');
ok('Z brak błędów JS',!p.errs.length,p.errs);
await b.close()})();
