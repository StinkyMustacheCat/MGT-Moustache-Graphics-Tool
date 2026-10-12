// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {runFile}=require('./child-command.cjs');
const audioFormats={mp3:['mp3','mp3'],flac:['flac','flac'],m4a:['mov,mp4,m4a,3gp,3g2,mj2','aac'],ogg:['ogg','vorbis,opus']};
const videoFormats={mp4:['mov,mp4,m4a,3gp,3g2,mj2','h264,hevc'],mov:['mov,mp4,m4a,3gp,3g2,mj2','h264,hevc,prores'],webm:['matroska,webm','vp8,vp9,av1']};
async function prepare(stream,{name,kind,ffmpeg,directory,signal,maxBytes=128*1024*1024,maxDuration=120},consume){
 const ext=path.extname(name||'').slice(1).toLowerCase(),formats=kind==='video'?videoFormats:audioFormats,rule=formats[ext];
 if(!rule)throw Error('Formato de entrada no compatible.');
 const dir=path.join(directory,'media-'+crypto.randomUUID());fs.mkdirSync(dir,{recursive:true});const source=path.join(dir,'input.'+ext),output=path.join(dir,kind==='video'?'prepared.mp4':'prepared.wav');let handle;
 try{
  handle=await fs.promises.open(source,'wx');let size=0;
  for await(const raw of stream){if(signal?.aborted)throw Error('Carga cancelada.');const chunk=Buffer.from(raw);size+=chunk.length;if(size>maxBytes)throw Error('El archivo supera '+Math.round(maxBytes/1024/1024)+' MiB.');let offset=0;while(offset<chunk.length){const r=await handle.write(chunk,offset,chunk.length-offset);if(!r.bytesWritten)throw Error('No se pudo guardar el archivo.');offset+=r.bytesWritten;}}
  await handle.close();handle=null;
  const safe=['-protocol_whitelist','file','-format_whitelist','mov,mp3,flac,ogg,matroska,webm'];
  const meta=JSON.parse(await runFile(path.join(path.dirname(ffmpeg),'ffprobe.exe'),['-v','error',...safe,'-show_streams','-show_format','-of','json',source],{windowsHide:true,signal,timeout:30000,maxBuffer:1024*1024}));
  const streams=meta.streams||[],visual=streams.filter(s=>s.codec_type==='video'&&!s.disposition?.attached_pic),audio=streams.filter(s=>s.codec_type==='audio'),selected=kind==='video'?visual:audio;
  if(meta.format?.format_name!==rule[0]||selected.length!==1||!rule[1].split(',').includes(selected[0].codec_name)||(kind==='audio'&&visual.length))throw Error('El contenedor o códec no coincide con los formatos compatibles.');
  const s=selected[0],duration=Number(s.duration??meta.format?.duration);if(!Number.isFinite(duration)||duration<=0||duration>maxDuration||(kind==='audio'&&duration<.1))throw Error('Duración incompatible: máximo '+maxDuration+' segundos.');
  if(kind==='video'){const [n,d]=String(s.avg_frame_rate).split('/').map(Number),fps=n/d;if(!s.width||!s.height||s.width>1920||s.height>1920||s.width*s.height>2073600||!Number.isFinite(fps)||fps<=0||fps>60.1)throw Error('Vídeo: máximo 1920 px por lado, 1920×1080 píxeles y 60 fps.');}
  const args=kind==='video'?['-map','0:'+s.index,'-an','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2,setsar=1,setpts=PTS-STARTPTS','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-fps_mode','cfr','-movflags','+faststart','-fs','10000001']:['-map','0:'+s.index,'-vn','-af','asetpts=PTS-STARTPTS','-c:a','pcm_s16le','-ar','48000','-ac','2'];
  await runFile(ffmpeg,['-v','error','-xerror','-nostdin',...safe,'-i',source,...args,'-map_metadata','-1',output],{windowsHide:true,signal,timeout:300000,maxBuffer:1024*1024});
  if(signal?.aborted)throw Error('Carga cancelada.');
  if(kind==='video'){const bytes=fs.readFileSync(output),metadata=require('./public/videos.js').inspect(bytes);if(Math.abs(metadata.duration-duration)>.15)throw Error('No se pudo conservar la duración del vídeo dentro del límite de 10 MB.');return await consume(output,metadata);}
  return await consume(output,{duration});
 }catch(error){if(signal?.aborted)throw Error('Carga cancelada.');if(error.code||error instanceof SyntaxError)throw Error('No se pudo preparar el archivo. Revisa el formato, el códec y que esté completo.');throw error;}
 finally{if(handle)await handle.close().catch(()=>{});fs.rmSync(dir,{recursive:true,force:true});}
}
module.exports={prepare,audioFormats,videoFormats};
