// Prawdziwy Code.gs v2 w Node; atrapy arkuszy jak w Google Sheets. Start: node gas-mock3.js  (PIN-y ustawia /admin)
const http=require('http'),fs=require('fs'),vm=require('vm');
const coerce=v=>{if(typeof v!=="string")return v;if(v.startsWith("'"))return v.slice(1);if(v.startsWith("="))throw new Error("formula "+v.slice(0,20));if(/^-?\d+(\.\d+)?$/.test(v))return Number(v);if(/^\d{4}-\d{2}-\d{2}/.test(v))return new Date(v);if(v.length>50000)throw new Error("cell>50000");return v};
function Sheet(name){this.name=name;this.cells=[];this.hidden=false;this.textCols=new Set()}
Sheet.prototype={getLastRow(){return this.cells.length},getLastColumn(){return Math.max(0,...this.cells.map(r=>r.length))},
 appendRow(r){this.cells.push(r.map(coerce))},deleteRows(s,n){this.cells.splice(s-1,n)},clearContents(){this.cells=[]},setFrozenRows(){},hideSheet(){this.hidden=true},
 getRange(r,c,nr,nc){const sh=this;if(typeof r==="string"){return{setNumberFormat(){sh.textCols.add(r.charCodeAt(0)-64)}}}nr=nr||1;nc=nc||1;
  const cv=(x,col)=>sh.textCols.has(col)&&typeof x==="string"?x:coerce(x);
  return{setValues(v){v.forEach((row,i)=>{sh.cells[r-1+i]=sh.cells[r-1+i]||[];row.forEach((x,j)=>sh.cells[r-1+i][c-1+j]=cv(x,c+j))})},
  setValue(x){sh.cells[r-1]=sh.cells[r-1]||[];sh.cells[r-1][c-1]=cv(x,c)},
  getValues(){const o=[];for(let i=0;i<nr;i++){const row=[];for(let j=0;j<nc;j++){const v=(sh.cells[r-1+i]||[])[c-1+j];row.push(v===undefined?"":v)}o.push(row)}return o}}}};
let sheets={};const CACHE=new Map();const ss={getSheetByName:n=>sheets[n]||null,insertSheet:n=>(sheets[n]=new Sheet(n))};
const ctx={SpreadsheetApp:{getActive:()=>ss},ContentService:{MimeType:{JSON:"json"},createTextOutput:t=>({t,setMimeType(){return this},getContent(){return this.t}})},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},CacheService:{getScriptCache:()=>({get:k=>CACHE.has(k)?CACHE.get(k):null,put:(k,v)=>{CACHE.set(k,v)},removeAll:ks=>ks.forEach(k=>CACHE.delete(k))})},Utilities:{sleep(){}},console,Date,JSON};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(''+require('path').resolve(__dirname,'../../chmura/Code.gs')+'','utf8'),ctx);
const log=[];
http.createServer((req,res)=>{const h={"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};const u=new URL(req.url,"http://x");
 if(u.pathname==="/reset"){sheets={};CACHE.clear();log.length=0;res.writeHead(200,h);return res.end("{}")}
 if(u.pathname==="/setup"){ctx.setup();const sh=sheets.Uczestnicy;(u.searchParams.get("pins")||"").split(",").forEach((p,i)=>{if(p){sh.getRange(2+i,2).setValue(p)}});
   if(u.searchParams.get("off"))sh.getRange(1+Number(u.searchParams.get("off")),3).setValue("NIE");res.writeHead(200,h);return res.end(JSON.stringify(sh.cells))}
 if(u.pathname==="/addrow"){const sh=sheets.Uczestnicy;sh.appendRow([u.searchParams.get("name"),u.searchParams.get("pin"),"TAK","","",""]);res.writeHead(200,h);return res.end("{}")}
 if(u.pathname==="/cache"){res.writeHead(200,h);return res.end(JSON.stringify([...CACHE.keys()]))}
 if(u.pathname==="/state"){res.writeHead(200,h);const k=sheets.Kopie;const o={log,sheets:{},files:k?k.cells.slice(1).map(r=>r[0]):[],rows:sheets.Treningi?sheets.Treningi.cells:[],kopieHidden:k&&k.hidden};for(const k in sheets)o.sheets[k]={hidden:sheets[k].hidden,rows:sheets[k].cells.length,cells:k.startsWith("Kopie")?sheets[k].cells.map(r=>r.slice(0,3)):sheets[k].cells};return res.end(JSON.stringify(o))}
 let b="";req.on("data",d=>b+=d);req.on("end",()=>{let a="?";try{a=JSON.parse(b).action}catch(e){}log.push(a);
  let out;try{out=req.method==="POST"?ctx.doPost({postData:{contents:b}}):ctx.doGet()}catch(e){res.writeHead(500,h);return res.end(JSON.stringify({ok:false,error:String(e)}))}res.writeHead(200,h);res.end(out.getContent())})}).listen(Number(process.argv[2]||8792),()=>{if(process.argv[3]){ctx.setup();process.argv[3].split(",").forEach((p,i)=>sheets.Uczestnicy.getRange(2+i,2).setValue(p))}console.log("mock3 ready")});
