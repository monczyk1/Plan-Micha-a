const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');
const D=__dirname,FPS=30;
const cuts=[0,2.6,6.4,9.8,15,17.6,22.6,27,31.4,35.8,41.5,46.6,50];
const only=process.argv[2]?process.argv[2].split(',').map(Number):null;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+D+'/stage.html');await p.evaluate(()=>ready());fs.mkdirSync(D+'/scenes',{recursive:true});
for(let i=0;i<cuts.length-1;i++){if(only&&!only.includes(i))continue;
 const f0=Math.round(cuts[i]*FPS),f1=Math.round(cuts[i+1]*FPS);const tmp=D+'/scenes/s'+String(i).padStart(2,'0')+'.tmp.mp4',out=tmp.replace('.tmp','');
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-crf','18','-preset','veryfast','-pix_fmt','yuv420p','-r',String(FPS),tmp]);
 let err='';ff.stderr.on('data',d=>err+=d);
 for(let f=f0;f<f1;f++){await p.evaluate(t=>render(t),f/FPS);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
 ff.stdin.end();const code=await new Promise(r=>ff.on('close',r));if(code!==0){console.log('fail',i,err);process.exit(1)}
 fs.renameSync(tmp,out);console.log('scene',i,f1-f0,'frames')}
await b.close()})();
