// SPDX-License-Identifier: GPL-3.0-or-later
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const media=require('../media-input.cjs'),root=path.resolve(__dirname,'..'),runtime=path.dirname(path.resolve(root,require('../config.json').playwright)),ffmpeg=path.join(runtime,'ffmpeg','ffmpeg.exe');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mgt-media-compat-'));
(async()=>{try{
 const fixtures=path.join(__dirname,'fixtures','media-input'),avi=path.join(temp,'sample.avi');
 execFileSync(ffmpeg,['-v','error','-f','lavfi','-i','testsrc2=size=64x64:rate=25','-t','0.5','-c:v','mpeg4',avi],{windowsHide:true});
 for(const [file,name]of [[avi,'sample.avi'],[path.join(fixtures,'libvpx.webm'),'libvpx.webm'],[path.join(fixtures,'prores_ks.mov'),'prores_ks.mov'],[path.join(fixtures,'fast.webm'),'fast.webm']]){
  const result=await media.prepare(fs.createReadStream(file),{name,kind:'video',ffmpeg,directory:temp},async(prepared,metadata)=>({size:fs.statSync(prepared).size,metadata}));
  assert(result.size>0);assert(result.metadata.fps<=60.1);assert(result.metadata.duration>0);
 }
 const big=path.join(temp,'dense.mkv');execFileSync(ffmpeg,['-v','error','-f','lavfi','-i','testsrc2=size=1280x720:rate=30','-vf','noise=alls=100:allf=t','-t','2','-c:v','ffv1',big],{windowsHide:true,timeout:120000});
 const project=await media.prepare(fs.createReadStream(big),{name:'dense.mkv',kind:'video',ffmpeg,directory:temp,maxBytes:512*1024*1024},async(preview,meta)=>({preview:fs.statSync(preview).size,full:fs.statSync(meta.preparedFile).size,embedded:meta.embedded}));
 assert.equal(project.embedded,false);assert(project.full>10000000);assert(project.preview<10000000);
 await assert.rejects(media.prepare(fs.createReadStream(avi),{name:'sample.mp4',kind:'video',ffmpeg,directory:temp},()=>{}),/contenedor|códec/i);
 console.log('AVI, WebM, MOV y alta tasa de fotogramas se preparan; extensión falsa se rechaza.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
