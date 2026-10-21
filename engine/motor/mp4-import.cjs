// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),{runFile}=require('./child-command.cjs'),M=require('./mp4-metadata.cjs'),{convert}=require('./wav-subtitles.cjs');
function command(file,args,signal,timeout){return runFile(file,args,{windowsHide:true,signal,timeout,maxBuffer:1024*1024}).catch(()=>{throw Error(signal.aborted?'Importación cancelada.':'No se pudo leer o extraer el audio del MP4.');});}
async function read(stream,{retainAudio,name,store,dataDir,ffmpeg,signal}){
 let temp,fd,audio;
 try{
  if(retainAudio){temp=fs.mkdtempSync(path.join(dataDir,'mp4-import-'));fd=fs.openSync(path.join(temp,'input.mp4'),'wx');}
  const metadata=await M.read(stream,{onData:retainAudio?chunk=>{let offset=0;while(offset<chunk.length)offset+=fs.writeSync(fd,chunk,offset,chunk.length-offset);}:undefined});
  if(fd!==undefined){fs.closeSync(fd);fd=undefined;}
  if(signal.aborted)throw Error('Importación cancelada.');
  if(!retainAudio&&!metadata.payload)throw Error('Este MP4 no contiene subtítulos con el perfil Moustache MP4 1.0.');
  const result=metadata.payload?convert(metadata.payload):{subtitles:null,warnings:['Este MP4 no contiene subtítulos compatibles. Se conservan los subtítulos anteriores.']};
  if(retainAudio){
   const input=path.join(temp,'input.mp4'),wav=path.join(temp,'audio.wav'),probe=path.join(path.dirname(ffmpeg),'ffprobe.exe');
   const description=JSON.parse(await command(probe,['-v','error','-show_streams','-show_format','-of','json',input],signal,30000));
   const track=description.streams?.find(s=>s.codec_type==='audio'),duration=Number(track?.duration??description.format?.duration);
   if(!track)throw Error('El MP4 no tiene una pista de audio.');
   if(!Number.isFinite(duration)||duration<.1||duration>3600)throw Error('El audio del MP4 debe durar entre 0.1 segundos y 60 minutos. No se recorta al importarlo.');
   await command(ffmpeg,['-nostdin','-hide_banner','-v','error','-y','-i',input,'-map','0:a:0','-vn','-sn','-dn','-map_metadata','-1','-ac','2','-ar','48000','-c:a','pcm_s16le','-t','3600.01',wav],signal,300000);
   audio=await store.upload(fs.createReadStream(wav),String(name).replace(/\.mp4$/i,'')+' · audio extraído',{signal});
   if(signal.aborted)throw Error('Importación cancelada.');
   if(metadata.payload&&Math.round(audio.duration*48000)!==metadata.payload.audio.frame_count)throw Error('La duración del audio extraído no coincide con los metadatos MP4.');
   result.audio=audio;
  }
  return result;
 }catch(error){if(audio)store.discard(audio.id);throw error;}
 finally{
  if(fd!==undefined)fs.closeSync(fd);
  if(temp){const resolved=path.resolve(temp);if(path.dirname(resolved)!==path.resolve(dataDir)||!path.basename(resolved).startsWith('mp4-import-'))throw Error('Carpeta temporal fuera de la sesión.');fs.rmSync(resolved,{recursive:true,force:true});}
 }
}
module.exports={read};
