const {chromium}=require('playwright');const res=[];const ok=(n,c,i)=>res.push((c?'PASS ':'FAIL ')+n+(c?'':'  → '+JSON.stringify(i).slice(0,400)));
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:375,height:740}});await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const go=async v=>{await p.click('.tabs [data-view="'+v+'"]');await p.waitForTimeout(30)};
await p.goto('file://'+require('path').resolve(__dirname,'../../index.html'));await p.waitForTimeout(300);await p.click('#welcomeOk');
// N1 tabs
for(const v of ['hist','prog','set','train']){await go(v);const vis=await p.$$eval('.view',x=>x.filter(e=>!e.hidden).map(e=>e.id));ok('N1 zakładka '+v,vis.length===1&&vis[0]==='v-'+v,vis)}
await go('hist');ok('N1 pasek serii tylko na treningu',await p.isHidden('#statusRow'));await go('train');ok('N1 pasek serii na treningu',await p.isVisible('#statusRow'));
// N5 T row
const tb=await p.$$eval('#tgrid button',x=>x.map(e=>e.getBoundingClientRect().height));ok('N5 przyciski T ≥ 44 px',tb.length>=9&&tb.every(h=>h>=44),tb);
// N4 warm-up sets toggle
ok('N4 R1/R2 schowane',await p.isHidden('#incline_wkg_0'));await p.click('[data-wus="incline"]');ok('N4 R1/R2 po kliknięciu',await p.isVisible('#incline_wkg_0'));
await p.fill('#incline_wkg_0','10');await p.reload();await p.waitForTimeout(300);ok('N4 rozgrzewka zostaje po odświeżeniu',await p.isVisible('#incline_wkg_0')&&(await p.inputValue('#incline_wkg_0'))==='10');
// N3 collapse
for(let i=0;i<3;i++){await p.fill('#incline_kg_'+i,'20');await p.fill('#incline_r_'+i,'8');await p.click('.ok[data-k="incline"][data-i="'+i+'"]')}
const card='.ex[data-card="incline"]';ok('N3 zwija się po 3/3',await p.$eval(card,e=>e.classList.contains('collapsed')));ok('N3 podsumowanie',/20 kg × 8/.test(await p.textContent(card+' .csum')),await p.textContent(card+' .csum'));
await p.click(card+' .csum');ok('N3 rozwija po kliknięciu',!(await p.$eval(card,e=>e.classList.contains('collapsed'))));await p.click(card+' .csum');ok('N3 zwija ponownie',await p.$eval(card,e=>e.classList.contains('collapsed')));
await p.click(card+' .csum');await p.click('.ok[data-k="incline"][data-i="2"]');ok('N3 odznaczenie ✓ rozwija',!(await p.$eval(card,e=>e.classList.contains('collapsed'))));await p.click('.ok[data-k="incline"][data-i="2"]');
await go('set');await p.uncheck('#optCollapse');await go('train');ok('N3 wyłączone zwijanie',!(await p.$eval(card,e=>e.classList.contains('collapsed'))));await go('set');await p.check('#optCollapse');await go('train');
// N2 finish + PR
await p.click('#finish');ok('N2 podsumowanie otwarte',await p.isVisible('#finSheet'));const st=await p.textContent('#finStats');ok('N2 statystyki (3 serie, 960 kg – hantle ×2)',/4serii/.test(st.replace(/\s/g,''))&&/960/.test(st),st);
await p.click('#finBack');ok('N2 wróć zamyka',await p.isHidden('#finSheet'));await p.click('#finish');await p.click('#save');await p.waitForTimeout(200);await p.click('#ssLater').catch(()=>{});
await go('train');await p.click('#seg button:nth-child(1)');await p.fill('#incline_kg_0','22,5');await p.fill('#incline_r_0','8');await p.click('#finish');
ok('N2 nowy rekord',/rekord/i.test(await p.textContent('#finPR'))&&/22,5 kg × 8/.test(await p.textContent('#finPR')),await p.textContent('#finPR'));await p.click('#finBack');
// N6 names + no stage select
const names=await p.$$eval('#catalog option',x=>x.map(o=>o.textContent));ok('N6 polskie nazwy (Suwnica, Allahy)',names.some(n=>n.startsWith('Suwnica'))&&names.some(n=>n.startsWith('Allahy')),names.slice(0,5));
ok('N6 brak „Podciąganie – etap”',!names.some(n=>n.includes('etap')));
// N7 removal regression
await p.selectOption('#catalog','legext');await p.click('#addEx');await p.fill('#legext_kg_0','40');await p.click('[data-drop="legext"]');await p.click('[data-drop="legext"]');ok('N7 usunięcie dodanego ćwiczenia po wpisaniu ciężaru',!(await p.$('#legext_kg_0')));
// N8/N9 technique figures + video
const tech=await p.$$eval('.ex[data-card] .meta details:first-child',ds=>ds.map(d=>{const h=d.innerHTML;return{svg:h.includes('class="fig"')&&h.includes('class="hd"'),vid:h.includes('youtube.com/results')}}));
ok('N9 rysunek przy każdym ćwiczeniu',tech.length>=7&&tech.every(t=>t.svg),tech);ok('N8 link do filmu',tech.every(t=>t.vid));
await p.click('.wup summary');const wf=await p.$$eval('.wlist .wfig',x=>x.map(e=>e.innerHTML.includes('class="hd"')));ok('N9 rysunki rozgrzewki',wf.length===7&&wf.every(Boolean),wf);
// N10 popraw switches view
await go('hist');await p.click('#hist details summary');await p.click('[data-fix]');ok('N10 Popraw przechodzi do treningu',await p.isVisible('#v-train')&&await p.isVisible('#pvSave'));
ok('N* brak błędów JS',errs.length===0,errs);
console.log(res.join('\n'));await b.close()})().catch(e=>{console.log(res.join('\n'));console.log('CRASH',e.message.split('\n')[0])});
