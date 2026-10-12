// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {runFile}=require('./child-command.cjs');
const MAX_BYTES=1536*1024*1024;
function pcmHeader(bytes){
 const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(bytes+36,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(48000,24);h.writeUInt32LE(192000,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(bytes,40);return h;
}
function muxArgs(audio,duration){return audio?['-i',audio.file,'-map','0:v:0','-map','1:a:0','-af','apad,atrim=duration='+duration+',asetpts=PTS-STARTPTS','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t',String(duration),'-map_metadata','-1']:['-an'];}
function createStore(directory,ffprobe,{keepSession=false}={}){
 // Session directories isolate multiple servers; no source file is modified.
 const dir=path.join(directory,'session-'+crypto.randomUUID());fs.mkdirSync(dir,{recursive:true});const items=new Map();let current=null;
 const unlink=f=>fs.rmSync(f,{force:true});
 function collect(item,force=false){if(item&&(!keepSession||force)&&!item.refs&&current!==item.id){items.delete(item.id);unlink(item.file);}}
 function add(file,name,duration){if(Array.from(items.values()).reduce((n,x)=>n+fs.statSync(x.file).size,0)+fs.statSync(file).size>2*1024*1024*1024){unlink(file);throw Error('Los audios de esta sesión superan 2 GiB.');}const item={id:crypto.randomUUID(),file,name:String(name||'Audio WAV').slice(0,180),duration,refs:0};items.set(item.id,item);return publicItem(item);}
 function publicItem(item){return {id:item.id,name:item.name,duration:item.duration,url:'/api/audio/'+item.id};}
 function get(id){const item=items.get(id);if(!item)throw Error('El audio ya no está disponible. Vuelve a cargarlo.');return item;}
 function select(id){const next=id===null?null:get(id),old=items.get(current);current=next?.id||null;collect(old);return next?publicItem(next):null;}
 function release(id){const item=items.get(id);if(item){item.refs=Math.max(0,item.refs-1);collect(item);}}
 function discard(id){if(id===current)throw Error('Quita el audio del escenario antes de descartarlo.');collect(items.get(id),true);}
 function acquire(id){const item=get(id);item.refs++;return item;}
 async function upload(stream,name,{signal}={}){
  const file=path.join(dir,crypto.randomUUID()+'.wav');let bytes=0,handle;
  try{
   handle=await fs.promises.open(file,'wx');
   for await(const raw of stream){if(signal?.aborted)throw Error('Carga de audio cancelada.');const chunk=Buffer.from(raw);bytes+=chunk.length;if(bytes>MAX_BYTES)throw Error('El WAV supera 1.5 GiB.');let offset=0;while(offset<chunk.length){const result=await handle.write(chunk,offset,chunk.length-offset);if(!result.bytesWritten)throw Error('No se pudo guardar el audio.');offset+=result.bytesWritten;}}
   await handle.close();handle=null;
   const h=Buffer.alloc(12),fd=fs.openSync(file,'r');try{
    if(fs.readSync(fd,h,0,12,0)!==12||h.toString('ascii',0,4)!=='RIFF'||h.toString('ascii',8)!=='WAVE'||h.readUInt32LE(4)+8!==bytes)throw Error('Selecciona un WAV RIFF válido; RF64 no es compatible.');
    let offset=12,data=false,fmt=false,chunks=0;const block=Buffer.alloc(8);
    while(offset<bytes){if(++chunks>10000||bytes-offset<8||fs.readSync(fd,block,0,8,offset)!==8)throw Error('Estructura WAV inválida.');const kind=block.toString('ascii',0,4),length=block.readUInt32LE(4);offset+=8;if(offset+length+(length&1)>bytes)throw Error('El WAV contiene un bloque truncado.');if(kind==='data'){if(data||!length)throw Error('Bloque de audio vacío o duplicado.');data=true;}if(kind==='fmt '){if(fmt||length<16||length>4096)throw Error('Formato WAV ambiguo.');fmt=true;}offset+=length+(length&1);}
    if(!data||!fmt)throw Error('Faltan bloques de audio WAV.');
   }finally{fs.closeSync(fd);}
   const data=JSON.parse(await runFile(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file],{windowsHide:true,signal,timeout:30000,maxBuffer:1024*1024}).catch(()=>{throw Error(signal?.aborted?'Carga de audio cancelada.':'No se pudo leer el WAV.');}));
   const audio=data.streams?.filter(s=>s.codec_type==='audio');const duration=Number(audio?.[0]?.duration??data.format?.duration);
   if(data.format?.format_name!=='wav'||audio?.length!==1||!/^pcm_/.test(audio[0].codec_name)||!Number.isFinite(duration)||duration<.1||duration>3600)throw Error('Usa un WAV PCM de entre 0.1 s y 60 minutos.');
   if(signal?.aborted)throw Error('Carga de audio cancelada.');return add(file,name,duration);
  }catch(error){if(handle)await handle.close().catch(()=>{});unlink(file);throw error;}
 }
 function wordline(){
  const file=path.join(dir,crypto.randomUUID()+'.wav'),fd=fs.openSync(file,'wx');let bytes=0,closed=false;fs.writeSync(fd,Buffer.alloc(44));
  return {write(chunk){let offset=0;while(offset<chunk.length)offset+=fs.writeSync(fd,chunk,offset,chunk.length-offset);bytes+=chunk.length;},finish(name){fs.writeSync(fd,pcmHeader(bytes),0,44,0);fs.closeSync(fd);closed=true;return add(file,name,bytes/192000);},abort(){if(!closed){fs.closeSync(fd);closed=true;}unlink(file);}};
 }
 function serve(req,res,id){const item=get(id),size=fs.statSync(item.file).size;let start=0,end=size-1,status=200;const range=req.headers.range;
  if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m||(!m[1]&&!m[2])){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return;}if(m[1]){start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]));}else start=Math.max(0,size-Number(m[2]));if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return;}status=206;}
  item.refs++;res.writeHead(status,{'Content-Type':'audio/wav','Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-store',...(status===206?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});const stream=fs.createReadStream(item.file,{start,end});stream.once('error',()=>res.destroy());res.once('close',()=>stream.destroy());stream.once('close',()=>release(id));stream.pipe(res);
 }
 function close(){fs.rmSync(dir,{recursive:true,force:true});}
 return {upload,wordline,select,acquire,release,discard,serve,close};
}
module.exports={createStore,pcmHeader,muxArgs,MAX_BYTES};
