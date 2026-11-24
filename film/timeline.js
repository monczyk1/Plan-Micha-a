const TOTAL=50;
const $=id=>document.getElementById(id);
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const io=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const oc=x=>1-Math.pow(1-x,3);
const back=x=>{const c1=1.7,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const pr=(T,a,b)=>cl((T-a)/(b-a));

// ---------- icons ----------
const ic={
 back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
 tabs:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="7" y="7" width="12" height="12" rx="2.5"/><path d="M5 15V7a2 2 0 0 1 2-2h8"/></svg>',
 dots:'<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
 share:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2"/></svg>',
 copy:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
 book:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z"/></svg>',
 star:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
 find:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
 plus:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
 note:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
 sig:'<svg width="56" height="14" viewBox="0 0 56 14" fill="#fff"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="11" rx="1"/><rect x="15" y="0" width="3" height="14" rx="1"/><rect x="27" y="1" width="25" height="12" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".5"/><rect x="29" y="3" width="17" height="8" rx="2"/><rect x="53" y="5" width="2" height="4" rx="1" fill-opacity=".5"/></svg>'
};
const sbar='<div class="island"></div><div class="sbar"><span>9:41</span>'+ic.sig+'</div>';
const safari=(extra='')=>'<div class="ios" style="position:absolute;inset:0;background:#141716">'+sbar+'<div class="page"><img src="cap/c1.jpg"></div>'+
 '<div class="tb"><div class="circ">'+ic.back+'</div><div class="pill"><span id="DOTS">'+ic.dots+'</span><span class="u">github.io</span><span style="opacity:.8">↻</span></div><div class="circ">'+ic.tabs+'</div></div>'+extra+'</div>';

// ---------- screens ----------
const SCR={};
const imgs=['c1','w0','w1','w2','e0','e1','e2','e3','t1','a1','f0','h1','p1','s1','s2'];
const scrs=$('scrs');
function add(id,html){const d=document.createElement('div');d.className='scr';d.id='S_'+id;d.innerHTML=html;scrs.appendChild(d);SCR[id]=d;return d}
imgs.forEach(n=>add(n,'<img class="full" src="cap/'+n+'.jpg">'));
add('f1','<img class="full" src="cap/f1.jpg"><div class="sheetpart" style="position:absolute;left:0;top:380px;width:393px;height:472px;overflow:hidden"><img src="cap/f1.jpg" style="position:absolute;left:0;top:-380px;width:393px;height:852px"></div>');
add('saf',safari());
add('safm',safari('<div class="dim"></div><div class="menu pop">'+
  '<div class="mi" id="miShare">'+ic.share+'Udostępnij</div><div class="mi">'+ic.copy+'Kopiuj</div><div class="sep"></div><div class="mi">'+ic.book+'Dodaj zakładkę</div><div class="mi">'+ic.find+'Szukaj na stronie</div></div>').replace('id="DOTS"','id="dotsM"'));
add('share',safari('<div class="dim"></div><div class="sheet ios">'+
  '<div class="shead"><img src="icon.png"><div><div style="font-weight:600;font-size:17px">Tytanowa siła</div><div style="font-size:14px;color:#98989d">github.io</div><div style="display:inline-block;margin-top:6px;font-size:13px;background:#3a3a3c;border-radius:12px;padding:3px 10px">Opcje ›</div></div><div class="x">✕</div></div>'+
  '<div class="acts"><div class="act"><div class="ic">'+ic.copy+'</div>Kopiuj</div><div class="act"><div class="ic">'+ic.book+'</div>Dodaj zakładkę</div><div class="act"><div class="ic">'+ic.star+'</div>Ulubione</div><div class="act"><div class="ic">'+ic.note+'</div>Notatka</div></div>'+
  '<div class="list"><div class="li">'+ic.book+'Dodaj zakładkę…</div><div class="li">'+ic.star+'Dodaj do ulubionych</div><div class="li">'+ic.find+'Szukaj na stronie</div><div class="li" id="liHome">'+ic.plus+'<b style="font-weight:600">Do ekranu początkowego</b></div></div></div>').replace('id="DOTS"',''));
add('dlg','<div class="ios dlg">'+sbar+'<div class="dh"><div class="circ" style="width:40px;height:40px;background:#2c2c2e">✕</div><div class="ttl">Do ekranu początkowego</div><div class="add" id="dAdd">Dodaj</div></div>'+
  '<div class="grp" style="display:flex;gap:14px;align-items:center;padding:14px"><img src="icon.png" style="width:64px;height:64px;border-radius:15px"><div style="flex:1"><div style="font-size:17px;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:10px">Tytanowa siła</div><div style="font-size:14px;color:#8e8e93;padding-top:10px">https://…github.io/…</div></div></div>'+
  '<div class="grp" style="margin-top:22px;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;font-size:17px">Otwórz jako aplikację<div style="width:52px;height:32px;border-radius:16px;background:#30d158;position:relative"><div style="position:absolute;right:2px;top:2px;width:28px;height:28px;border-radius:50%;background:#fff"></div></div></div>'+
  '<div style="font-size:13px;color:#8e8e93;padding:10px 30px;line-height:1.4">Ikona zostanie dodana do ekranu początkowego, aby szybko otwierać tę stronę.</div></div>');
add('home','<div class="ios home">'+sbar+'<div class="hicon" id="hIcon"><img id="hImg" src="icon.png"><span>Tytanowa siła</span></div><div class="srch">'+ic.find.replace(/22/g,'13')+'Szukaj</div><div class="dock"><i></i><i></i><i></i><i></i></div></div>');
add('app','<div class="ios home">'+sbar+'<div class="hicon"><img src="icon.png"><span>Tytanowa siła</span></div><div class="srch">'+ic.find.replace(/22/g,'13')+'Szukaj</div><div class="dock"><i></i><i></i><i></i><i></i></div></div><div class="apz" style="position:absolute;inset:0;z-index:20;overflow:hidden;background:#141716"><img src="cap/c1.jpg" style="width:393px;height:852px"></div>');
SCR.safm.querySelector('#dotsM')&&0;

// ---------- timeline data ----------
const shots=[
 {t:0,id:'c1',tr:'cut'},
 {t:6.4,id:'w0',tr:'fade',d:.3},{t:7.2,id:'w1',tr:'fade',d:.25},{t:8.35,id:'w2',tr:'fade',d:.2},
 {t:9.8,id:'e0',tr:'fade',d:.3},{t:11.0,id:'e1',tr:'fade',d:.2},{t:12.2,id:'e2',tr:'fade',d:.2},
 {t:15.0,id:'e3',tr:'fade',d:.3},
 {t:17.6,id:'t1',tr:'fade',d:.3},{t:20.4,id:'a1',tr:'fade',d:.3},
 {t:22.6,id:'f0',tr:'fade',d:.3},{t:23.7,id:"f1",tr:"sheet",d:.45},
 {t:27.0,id:'h1',tr:'fade',d:.3},{t:29.15,id:'p1',tr:'fade',d:.25},
 {t:31.35,id:'s1',tr:'fade',d:.25},{t:33.3,id:'s2',tr:'up',d:.4},
 {t:35.8,id:'saf',tr:'fade',d:.35},{t:37.2,id:'safm',tr:'pop',d:.25},{t:38.55,id:'share',tr:'sheet',d:.4},
 {t:40.25,id:'dlg',tr:'up',d:.4},{t:41.8,id:'home',tr:'fade',d:.35},{t:43.4,id:'app',tr:'appopen',d:.45}
];
const caps=[
 {t:2.6,k:'01',h:'Wybierz trening',s:'A lub B — każdy ma numer T1…T9'},
 {t:6.4,k:'02',h:'Rozgrzewka',s:'Rozwijana lista, odhaczasz po kolei'},
 {t:9.8,k:'03',h:'Wpisz serię',s:'Ciężar, powtórzenia i ✓'},
 {t:12.6,k:'03',h:'Minutnik przerwy',s:'Po ✓ odliczanie startuje samo'},
 {t:15.0,k:'04',h:'Zwija się samo',s:'Skończone ćwiczenie = jedna linia'},
 {t:17.6,k:'05',h:'Technika',s:'Rysunek, wskazówki i film'},
 {t:20.4,k:'05',h:'Sprzęt zajęty?',s:'Zamień na gotowy zamiennik'},
 {t:22.6,k:'06',h:'Zakończ trening',s:'Podsumowanie, rekordy i zapis'},
 {t:27.0,k:'07',h:'Historia',s:'Każdy trening zapisany — można poprawić'},
 {t:29.15,k:'07',h:'Postępy',s:'Ciężar na starcie i dziś'},
 {t:31.35,k:'08',h:'Kopia zapasowa',s:'Jeden plik = cała historia i plan'},
 {t:33.1,k:'08',h:'Twój plan',s:'Zmieniasz ćwiczenia, serie i powtórzenia'},
 {t:35.8,k:'09 · SKRÓT NA EKRANIE',h:'Otwórz link w Safari',s:'Stuknij ⋯ na dolnym pasku'},
 {t:38.1,k:'09 · SKRÓT NA EKRANIE',h:'Udostępnij',s:'Potem „Do ekranu początkowego”'},
 {t:39.85,k:'09 · SKRÓT NA EKRANIE',h:'Stuknij „Dodaj”',s:'Nazwa wpisze się sama'},
 {t:41.85,k:'GOTOWE',h:'Ikona na ekranie',s:'Otwiera się jak zwykła aplikacja'}
];
const taps=[
 {t:3.3,x:104.25,y:151.9},{t:4.6,x:148,y:294.6},
 {t:7.0,x:196.5,y:116.2},{t:7.85,x:344,y:218.75},{t:8.25,x:344,y:317.1},
 {t:10.5,x:128.5,y:374.3},{t:10.85,x:249.5,y:374.3},{t:12.0,x:334,y:374.3},
 {t:18.8,x:214.6,y:315.5},
 {t:23.35,x:196.5,y:683.5},{t:25.95,x:196.5,y:810},
 {t:26.85,x:150.9,y:820.4},{t:29.0,x:242.1,y:820.4},{t:31.15,x:333.4,y:820.4},
 {t:33.1,x:196.5,y:201.9},
 {t:37.0,sel:['saf','#DOTS']},{t:38.1,sel:['safm','#miShare']},{t:39.8,sel:['share','#liHome']},{t:41.4,sel:['dlg','#dAdd']},{t:43.2,sel:['home','#hImg']}
];
const hls=[
 {a:13.1,b:14.8,x:164,y:740,w:216,h:46},
 {a:15.4,b:17.4,x:10,y:18,w:373,h:104},
 {a:20.7,b:22.4,x:16,y:150,w:322,h:84},
 {a:24.3,b:25.6,x:10,y:508,w:373,h:88},
 {a:27.4,b:29.0,x:14,y:120,w:365,h:136},
 {a:31.6,b:32.9,x:14,y:390,w:365,h:262}
];
const cams=[ // keyframes t,s,cx,cy
 {t:0,s:1,x:196.5,y:426},
 {t:9.9,s:1,x:196.5,y:426},{t:10.3,s:1.16,x:200,y:400},{t:12.45,s:1.16,x:200,y:400},{t:12.95,s:1,x:196.5,y:426},
 {t:99,s:1,x:196.5,y:426}
];

// ---------- caption DOM ----------
const capWrap=$('caps');
caps.forEach((c,i)=>{const d=document.createElement('div');d.className='cap';d.id='cap'+i;d.innerHTML='<div class="k">'+c.k+'</div><div class="h">'+c.h+'</div><div class="s">'+c.s+'</div>';capWrap.appendChild(d)});
// tap DOM
const fx=$('fx');
taps.forEach((t,i)=>{const d=document.createElement('div');d.className='tap';d.id='tap'+i;d.innerHTML='<div class="ring"></div><div class="dot"></div>';fx.appendChild(d)});
hls.forEach((h,i)=>{const d=document.createElement('div');d.className='hl';d.id='hl'+i;Object.assign(d.style,{left:h.x+'px',top:h.y+'px',width:h.w+'px',height:h.h+'px'});fx.appendChild(d)});

function measure(){
 const base=scrs.getBoundingClientRect();const k=base.width/393;
 taps.forEach(t=>{if(!t.sel)return;const s=SCR[t.sel[0]];s.style.display='block';const e=s.querySelector(t.sel[1]);const r=e.getBoundingClientRect();t.x=(r.left+r.width/2-base.left)/k;t.y=(r.top+r.height/2-base.top)/k;s.style.display='none'});
 const r=SCR.home.querySelector('#hImg');SCR.home.style.display='block';const rr=r.getBoundingClientRect();window.ICON={x:(rr.left+rr.width/2-base.left)/k,y:(rr.top+rr.height/2-base.top)/k};SCR.home.style.display='none';
}

function reset(el){el.style.opacity=1;el.style.transform='';el.querySelectorAll('.dim,.sheet,.pop,.sheetpart,.apz').forEach(x=>{x.style.opacity=1;x.style.transform=''})}
function applyTr(el,tr,p){
 const e=oc(p);
 if(tr==='fade'){el.style.opacity=p}
 else if(tr==='up'){el.style.transform='translateY('+((1-e)*852)+'px)'}
 else if(tr==='sheet'){const dim=el.querySelector('.dim');if(dim)dim.style.opacity=p;
   const sh=el.querySelector('.sheet,.sheetpart');sh.style.transform='translateY('+((1-e)*500)+'px)';
   if(el.id==='S_f1'){el.querySelector('img.full').style.opacity=p}}
 else if(tr==='pop'){const d=el.querySelector('.dim');d.style.opacity=p;const m=el.querySelector('.pop');m.style.opacity=p;m.style.transform='scale('+(.8+.2*back(p))+')'}
 else if(tr==='appopen'){const a=el.querySelector('.apz');const s=.16+.84*e;const x=ICON.x*(1-e),y=ICON.y*(1-e);
   a.style.transformOrigin='0 0';a.style.transform='translate('+(x-196.5*s+196.5*e*0)+'px,'+(y-426*s+426*e*0)+'px) scale('+s+')';
   // keep centred on icon at start, full screen at end
   const tx=ICON.x-196.5*s, ty=ICON.y-426*s; a.style.transform='translate('+(tx*(1-e))+'px,'+(ty*(1-e))+'px) scale('+s+')';
   a.style.borderRadius=(40*(1-e)+0)+'px';a.style.opacity=cl(p*3)}
}

window.render=function(T){
 // progress
 $('prog').style.width=(cl(T/TOTAL)*1080)+'px';
 // title
 const tOut=pr(T,2.05,2.5);const ti=$('title');ti.style.opacity=1-tOut;ti.style.transform='translateY('+(-90*oc(tOut))+'px)';
 const ip=pr(T,.1,.75);$('tIcon').style.transform='scale('+(ip<=0?0:back(ip))+') rotate('+(-8*(1-oc(ip)))+'deg)';
 const tp=pr(T,.45,1.0);$('tT').style.opacity=tp;$('tT').style.transform='translateY('+(50*(1-oc(tp)))+'px)';$('tT').style.letterSpacing=(.02+.12*(1-oc(tp)))+'em';
 const sp=pr(T,.8,1.3);$('tS').style.opacity=sp;$('tS').style.transform='translateY('+(30*(1-oc(sp)))+'px)';
 const sp2=pr(T,1.05,1.5);$('tS2').style.opacity=sp2;
 // phone in/out
 const pin=oc(pr(T,2.2,2.95)), pout=io(pr(T,46.55,47.2));
 const ph=$('phone');ph.style.transform='translateY('+((1-pin)*1600+pout*1650)+'px) rotate('+((1-pin)*6)+'deg)';
 // captions
 const cOut=pr(T,46.3,46.7);capWrap.style.opacity=1-cOut;
 let ci=-1;caps.forEach((c,i)=>{if(T>=c.t)ci=i});
 caps.forEach((c,i)=>{const d=$('cap'+i);d.style.display='none'});
 if(ci>=0){const c=caps[ci];const p=pr(T,c.t,c.t+.45);const d=$('cap'+ci);d.style.display='block';
   const same=ci>0&&caps[ci-1].k===c.k;
   d.querySelector('.k').style.opacity=same?1:p;
   const h=d.querySelector('.h'),s=d.querySelector('.s');
   h.style.opacity=p;h.style.transform='translateX('+(70*(1-oc(p)))+'px)';
   const p2=pr(T,c.t+.12,c.t+.6);s.style.opacity=p2;s.style.transform='translateX('+(70*(1-oc(p2)))+'px)';
   if(ci>0&&p<1){const q=$('cap'+(ci-1));q.style.display='block';const o=1-pr(T,c.t,c.t+.2);q.style.opacity=o;q.style.transform='translateX('+(-60*(1-o))+'px)';
     if(same)q.querySelector('.k').style.opacity=0}
   d.style.opacity=1;d.style.transform='';
 }
 // screens
 Object.values(SCR).forEach(s=>{s.style.display='none'});
 let si=0;shots.forEach((s,i)=>{if(T>=s.t)si=i});
 const cur=shots[si],prev=shots[si-1];const p=cur.tr==='cut'?1:pr(T,cur.t,cur.t+(cur.d||.3));
 if(prev&&p<1){const e=SCR[prev.id];e.style.display='block';e.style.zIndex=1;reset(e)}
 const ce=SCR[cur.id];ce.style.display='block';ce.style.zIndex=2;reset(ce);if(p<1)applyTr(ce,cur.tr,p);
 // list highlight / dialog
 const li=SCR.share.querySelector('#liHome');li.classList.toggle('on',T>=39.8);
 // home icon pop
 const hp=pr(T,42.05,42.55);const hi=SCR.home.querySelector('#hIcon');hi.style.transform=si>=0&&cur.id==='home'?'scale('+(hp<=0?0:back(hp))+')':'';hi.style.opacity=hp>0?1:0;
 if(cur.id!=='home'){hi.style.opacity=1;hi.style.transform=''}
 // camera
 let a=cams[0],b=cams[0];for(let i=0;i<cams.length-1;i++){if(T>=cams[i].t&&T<cams[i+1].t){a=cams[i];b=cams[i+1];break}}
 const cp=a===b?0:io(pr(T,a.t,b.t));let s=a.s+(b.s-a.s)*cp,cx=a.x+(b.x-a.x)*cp,cy=a.y+(b.y-a.y)*cp;
 cx=cl(cx,196.5/s,393-196.5/s);cy=cl(cy,426/s,852-426/s);
 $('cam').style.transform='translate(196.5px,426px) scale('+s+') translate('+(-cx)+'px,'+(-cy)+'px)';
 // taps
 taps.forEach((t,i)=>{const d=$('tap'+i);const a0=t.t-.28,a1=t.t+.55;if(T<a0||T>a1){d.style.display='none';return}
   d.style.display='block';d.style.left=t.x+'px';d.style.top=t.y+'px';
   const dot=d.querySelector('.dot'),ring=d.querySelector('.ring');
   const inP=pr(T,a0,t.t-.1),press=pr(T,t.t-.1,t.t),rel=pr(T,t.t,t.t+.3),outP=pr(T,t.t+.25,a1);
   dot.style.opacity=oc(inP)*(1-outP);dot.style.transform='scale('+((.6+.4*oc(inP))*(1-.25*press+.25*rel))+')';
   ring.style.opacity=T>=t.t?(1-oc(pr(T,t.t,a1))):0;ring.style.transform='scale('+(1+1.6*oc(pr(T,t.t,a1)))+')'});
 hls.forEach((h,i)=>{const d=$('hl'+i);if(T<h.a||T>h.b){d.style.display='none';return}d.style.display='block';
   const o=Math.min(pr(T,h.a,h.a+.25),1-pr(T,h.b-.25,h.b));d.style.opacity=o;d.style.transform='scale('+(1.04-.04*oc(pr(T,h.a,h.a+.3))+.008*Math.sin((T-h.a)*7))+')'});
 // android card
 const di=oc(pr(T,44.2,44.65)),dout=pr(T,46.0,46.4);const dr=$('droid');dr.style.transform='translateY('+((1-di)*460+dout*460)+'px)';dr.style.opacity=di*(1-dout);
 // end
 const en=$('end');en.style.opacity=T>=46.8?1:0;
 const e1=pr(T,46.9,47.5);$('eIcon').style.transform='scale('+(e1<=0?0:back(e1))+')';
 const e2=pr(T,47.3,47.9);$('eT').style.opacity=e2;$('eT').style.transform='translateY('+(50*(1-oc(e2)))+'px)';
 [...$('eC').children].forEach((c,i)=>{const q=pr(T,47.8+i*.25,48.3+i*.25);c.style.opacity=q;c.style.transform='translateY('+(40*(1-oc(q)))+'px)'});
};
window.ready=async function(){await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));measure();return true};
