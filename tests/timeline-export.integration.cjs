// SPDX-License-Identifier: GPL-3.0-or-later
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),config=require(path.join(root,'config.json'));
const runtime=path.dirname(path.resolve(root,config.playwright)),ffmpeg=path.join(runtime,'ffmpeg','ffmpeg.exe');
const temp=path.join(root,'test-results','timeline-export-'+crypto.randomUUID());fs.mkdirSync(temp,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const instance=crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,16);
const doc=(name,color)=>({version:3,name,parameters:[],html:'<div id="tile"></div>',css:'#tile{position:absolute;inset:0;background:'+color+'}',render:'',recommended:{duration:.2}});
const post=async(url,token,payload)=>{const response=await fetch(url+'/api/export',{method:'POST',headers:{Origin:url,'X-Motion-Token':token,'Content-Type':'application/json'},body:JSON.stringify(payload)});const body=await response.json();assert(response.ok,JSON.stringify(body));return body.id;};
(async()=>{let child,url,info;try{
 const wav=path.join(temp,'tone.wav');execFileSync(ffmpeg,['-v','error','-y','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=0.2','-c:a','pcm_s16le',wav],{windowsHide:true});
 child=spawn(process.execPath,[path.join(root,'server.cjs')],{cwd:root,env:{...process.env,MGT_DATA_ROOT:path.join(temp,'data')},windowsHide:true,stdio:'ignore'});
 for(let i=0;i<200;i++){try{const running=JSON.parse(fs.readFileSync(path.join(temp,'data',instance,'running.json')));if(running.pid!==child.pid)throw Error('stale');url=running.url;info=await(await fetch(url+'/api/info')).json();break;}catch{await delay(100);}}assert(info,'El servidor no inició');
 const upload=await fetch(url+'/api/audio',{method:'POST',headers:{Origin:url,'X-Motion-Token':info.token,'X-Audio-Name':'tone.wav','Content-Type':'application/octet-stream'},body:fs.readFileSync(wav)});assert(upload.ok);const {audio}=await upload.json();
 const lanes=require('../public/overlay-lanes.js').create(),lower=lanes.addLane('Visual 2');
 lanes.addClip('overlay-1',{id:'red',document:doc('Rojo','#ff0000'),start:0,frames:12});
 lanes.addClip(lower,{id:'blue',document:doc('Azul','#0000ff'),start:0,frames:12});
 const scene=require('../public/scene.js').normalize({text:'Prueba',font:'Arial',size:100,color:'#ffffff',background:'#000000',duration:.2,aspect:'horizontal',easing:'linear',start:{x:30,y:50},end:{x:70,y:50}});
 const run=async(flags,name)=>{const id=await post(url,info.token,{scene,resolution:480,layers:{overlayLanes:lanes.snapshot(),mainPresent:false,flags},effects:[{id:'tone',audio:{id:audio.id,duration:audio.duration},start:0,input:0,output:audio.duration,volume:1,muted:false,trackId:'audio-1'}],filename:name});let job;for(let i=0;i<1200;i++){job=await(await fetch(url+'/api/jobs/'+id)).json();if(['done','error','cancelled'].includes(job.status))break;await delay(50);}assert.equal(job.status,'done',JSON.stringify(job));const file=path.join(temp,name+'.mp4');fs.writeFileSync(file,Buffer.from(await(await fetch(url+'/api/jobs/'+id+'/download')).arrayBuffer()));return file;};
 const rgb=file=>{const raw=execFileSync(ffmpeg,['-v','error','-i',file,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{windowsHide:true,maxBuffer:4e6}),offset=(240*854+427)*3;return Array.from(raw.subarray(offset,offset+3));};
 const top=await run({},'top-red');const red=rgb(top);assert(red[0]>180&&red[1]<70&&red[2]<70,JSON.stringify(red));
 const hidden=await run({'overlay-1':{visible:false},'audio-1':{muted:true}},'hidden-red');const blue=rgb(hidden);assert(blue[2]>180&&blue[0]<70&&blue[1]<70,JSON.stringify(blue));
 const pcm=file=>execFileSync(ffmpeg,['-v','error','-i',file,'-vn','-ar','48000','-ac','1','-f','f32le','pipe:1'],{windowsHide:true});
 const peak=data=>{let max=0;for(let i=0;i<data.length;i+=4)max=Math.max(max,Math.abs(data.readFloatLE(i)));return max;};
 assert(peak(pcm(top))>.01);assert(peak(pcm(hidden))<.001);
 console.log('Export respeta la prioridad de pistas visuales, visibilidad y silencio de audio.');
}finally{if(url&&info)await fetch(url+'/api/shutdown',{method:'POST',headers:{Origin:url,'X-Motion-Token':info.token,'Content-Type':'application/json'},body:'{}'}).catch(()=>{});child?.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
