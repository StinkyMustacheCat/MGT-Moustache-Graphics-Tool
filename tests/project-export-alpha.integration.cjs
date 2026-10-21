// SPDX-License-Identifier: GPL-3.0-or-later
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),runtime=path.dirname(path.resolve(root,require('../config.json').playwright));
const ffmpeg=path.join(runtime,'ffmpeg','ffmpeg.exe'),ffprobe=path.join(runtime,'ffmpeg','ffprobe.exe');
const temp=path.join(root,'test-results','project-alpha-'+crypto.randomUUID());fs.mkdirSync(temp,{recursive:true});
const instance=crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,16),delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const document={version:3,name:'Cuadro rojo',parameters:[],html:'<div id="tile"></div>',css:'#tile{position:absolute;left:25%;top:25%;width:50%;height:50%;background:red}',render:'',recommended:{duration:.2}};
(async()=>{let child,url,info;try{
 child=spawn(process.execPath,[path.join(root,'server.cjs')],{cwd:root,env:{...process.env,MGT_DATA_ROOT:path.join(temp,'data')},windowsHide:true,stdio:'ignore'});
 for(let i=0;i<200;i++){try{const running=JSON.parse(fs.readFileSync(path.join(temp,'data',instance,'running.json')));if(running.pid!==child.pid)throw Error('stale');url=running.url;info=await(await fetch(url+'/api/info')).json();break;}catch{await delay(100);}}assert(info,'Servidor no inició');
 const post=async(route,value)=>{const response=await fetch(url+route,{method:'POST',headers:{Origin:url,'X-Motion-Token':info.token,'Content-Type':'application/json'},body:JSON.stringify(value)});return {status:response.status,body:await response.json()};};
 const scene={...require('../public/scene.js').defaults,duration:.2};
 const layers={mainPresent:false,overlayLanes:[{id:'overlay-1',name:'Visual 1',clips:[{id:'red',kind:'mgt',document,start:0,frames:12,sourceFrames:12,inFrame:0}]}],flags:{}};
 async function exportVideo(format,alpha,fps){const started=await post('/api/export',{scene,layers,format,alpha,fps,resolution:480,filename:'timeline-test'});assert.equal(started.status,202,JSON.stringify(started.body));let job;for(let i=0;i<1200;i++){job=await(await fetch(url+'/api/jobs/'+started.body.id)).json();if(['done','error','cancelled'].includes(job.status))break;await delay(50);}assert.equal(job.status,'done',JSON.stringify(job));const file=path.join(temp,format+'-'+fps+'.'+format);fs.writeFileSync(file,Buffer.from(await(await fetch(url+'/api/jobs/'+started.body.id+'/download')).arrayBuffer()));const stream=JSON.parse(execFileSync(ffprobe,['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,pix_fmt,nb_frames,r_frame_rate,width,height','-of','json',file],{windowsHide:true})).streams[0];assert.equal(stream.nb_frames,String(Math.round(scene.duration*fps)));assert.equal(stream.r_frame_rate,fps+'/1');return {file,stream};}
 assert.equal((await post('/api/export',{scene,layers,format:'mp4',alpha:true,fps:24,resolution:480})).status,400);
 const mov=await exportVideo('mov',true,24);assert.equal(mov.stream.codec_name,'prores');assert.match(mov.stream.pix_fmt,/^yuva/);
 const raw=execFileSync(ffmpeg,['-v','error','-i',mov.file,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1'],{windowsHide:true,maxBuffer:20e6});
 const pixel=(x,y)=>Array.from(raw.subarray((Math.floor(y*mov.stream.height)*mov.stream.width+Math.floor(x*mov.stream.width))*4,(Math.floor(y*mov.stream.height)*mov.stream.width+Math.floor(x*mov.stream.width))*4+4));
 assert(pixel(.05,.05)[3]<12,JSON.stringify(pixel(.05,.05)));assert(pixel(.5,.5)[0]>150&&pixel(.5,.5)[3]>230,JSON.stringify(pixel(.5,.5)));
 const mp4=await exportVideo('mp4',false,15);assert.equal(mp4.stream.codec_name,'h264');
 console.log('Proyecto: MOV con alfa a 24 FPS, MP4 a 15 FPS y contrato de formato verificados.');
}finally{if(url&&info)await fetch(url+'/api/shutdown',{method:'POST',headers:{Origin:url,'X-Motion-Token':info.token,'Content-Type':'application/json'},body:'{}'}).catch(()=>{});child?.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
