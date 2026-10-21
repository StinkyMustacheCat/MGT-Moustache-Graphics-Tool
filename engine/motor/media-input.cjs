// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {runFile}=require('./child-command.cjs');
const audioFormats={mp3:['mp3','mp3'],flac:['flac','flac'],m4a:['mov,mp4,m4a,3gp,3g2,mj2','aac'],ogg:['ogg','vorbis,opus']};
const videoFormats={mp4:'mov',mov:'mov',m4v:'mov',mkv:'matroska',webm:'matroska',avi:'avi',mpg:'mpeg',mpeg:'mpeg',vob:'mpeg',ts:'mpegts',m2ts:'mpegts',mts:'mpegts',wmv:'asf',asf:'asf',flv:'flv',ogv:'ogg',ogg:'ogg',mxf:'mxf',nut:'nut',gif:'gif', '3gp':'mov'};
async function prepare(stream,{name,kind,ffmpeg,directory,signal,maxBytes=128*1024*1024,maxDuration=120},consume){
 const ext=path.extname(name||'').slice(1).toLowerCase(),formats=kind==='video'?videoFormats:audioFormats,rule=formats[ext];
 if(!rule)throw Error('Formato de entrada no compatible.');
 const dir=path.join(directory,'media-'+crypto.randomUUID());fs.mkdirSync(dir,{recursive:true});const source=path.join(dir,'input.'+ext),output=path.join(dir,kind==='video'?'prepared.mp4':'prepared.wav');let handle;
 try{
  handle=await fs.promises.open(source,'wx');let size=0;
  for await(const raw of stream){if(signal?.aborted)throw Error('Carga cancelada.');const chunk=Buffer.from(raw);size+=chunk.length;if(size>maxBytes)throw Error('El archivo supera '+Math.round(maxBytes/1024/1024)+' MiB.');let offset=0;while(offset<chunk.length){const r=await handle.write(chunk,offset,chunk.length-offset);if(!r.bytesWritten)throw Error('No se pudo guardar el archivo.');offset+=r.bytesWritten;}}
  await handle.close();handle=null;
  const safe=['-protocol_whitelist','file','-format_whitelist','mov,mp3,flac,ogg,matroska,webm,avi,mpeg,mpegts,asf,flv,mxf,nut,gif'];
  const meta=JSON.parse(await runFile(path.join(path.dirname(ffmpeg),'ffprobe.exe'),['-v','error',...safe,'-show_streams','-show_format','-of','json',source],{windowsHide:true,signal,timeout:30000,maxBuffer:1024*1024}));
  const streams=meta.streams||[],visual=streams.filter(s=>s.codec_type==='video'&&!s.disposition?.attached_pic),audio=streams.filter(s=>s.codec_type==='audio'),selected=kind==='video'?visual:audio;
  const format=String(meta.format?.format_name||'').split(',');
  if(kind==='video'?!format.includes(rule)||!visual.length:meta.format?.format_name!==rule[0]||selected.length!==1||!rule[1].split(',').includes(selected[0].codec_name)||visual.length)throw Error('El contenedor o códec no coincide con los formatos compatibles.');
  const s=kind==='video'?[...visual].sort((a,b)=>Number(b.disposition?.default||0)-Number(a.disposition?.default||0))[0]:selected[0],duration=Number(s.duration??meta.format?.duration);if(!Number.isFinite(duration)||duration<=0||duration>maxDuration||(kind==='audio'&&duration<.1))throw Error('Duración incompatible: máximo '+maxDuration+' segundos.');
  const [n,d]=String(s.avg_frame_rate??s.r_frame_rate??'30/1').split('/').map(Number),inputFps=n/d,outputFps=Math.min(60,Math.max(1,Number.isFinite(inputFps)&&inputFps>0?Math.ceil(inputFps):30));
  if(kind==='video'&&(!s.width||!s.height||s.width>16384||s.height>16384||s.width*s.height>134217728))throw Error('Vídeo demasiado grande para una conversión segura.');
  const warnings=kind==='video'?[...(visual.length>1?['Se usó la pista de vídeo principal.']:[]),...(audio.length?['El audio del archivo no se agrega a la pista visual.']:[]),...(/^(yuva|rgba|bgra|argb|gbrap|ya)/.test(s.pix_fmt||'')?['El canal alfa del vídeo original no se conserva en esta conversión.']:[]),...(inputFps>60?['Se redujo a 60 FPS sin acelerar la reproducción.']:[])]:[];
  const maxW=s.width>=s.height?1920:1080,maxH=s.width>=s.height?1080:1920,scale='scale='+Math.min(s.width,maxW)+':'+Math.min(s.height,maxH)+':force_original_aspect_ratio=decrease:force_divisible_by=2';
  const args=kind==='video'?['-map','0:'+s.index,'-an','-vf',scale+',setsar=1,setpts=PTS-STARTPTS','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-fps_mode','cfr','-r',String(outputFps),'-movflags','+faststart']:['-map','0:'+s.index,'-vn','-af','asetpts=PTS-STARTPTS','-c:a','pcm_s16le','-ar','48000','-ac','2'];
  await runFile(ffmpeg,['-v','error','-xerror','-nostdin',...safe,'-i',source,...args,'-map_metadata','-1',output],{windowsHide:true,signal,timeout:300000,maxBuffer:1024*1024});
  if(signal?.aborted)throw Error('Carga cancelada.');
  if(kind==='video'){const probe=JSON.parse(await runFile(path.join(path.dirname(ffmpeg),'ffprobe.exe'),['-v','error','-select_streams','v:0','-show_entries','stream=width,height,duration,nb_frames','-show_entries','format=duration','-of','json',output],{windowsHide:true,signal,timeout:30000,maxBuffer:1024*1024})),track=probe.streams?.[0],preparedDuration=Number(track?.duration??probe.format?.duration);if(!Number.isFinite(preparedDuration)||Math.abs(preparedDuration-duration)>.2)throw Error('La conversión no conservó la duración del vídeo.');const embedded=fs.statSync(output).size<=require('./public/videos.js').limits.file;let preview=output;if(!embedded){preview=path.join(dir,'preview.mp4');await runFile(ffmpeg,['-v','error','-xerror','-nostdin','-i',output,'-an','-vf','scale='+Math.min(Number(track.width),640)+':'+Math.min(Number(track.height),640)+':force_original_aspect_ratio=decrease:force_divisible_by=2','-c:v','libx264','-preset','veryfast','-b:v','350k','-maxrate','400k','-bufsize','800k','-pix_fmt','yuv420p','-movflags','+faststart',preview],{windowsHide:true,signal,timeout:300000,maxBuffer:1024*1024});}const metadata=require('./public/videos.js').inspect(fs.readFileSync(preview));return await consume(preview,{...metadata,embedded,warnings,sourceDuration:duration,preparedFile:output});}
  return await consume(output,{duration});
 }catch(error){if(signal?.aborted)throw Error('Carga cancelada.');if(error.code||error instanceof SyntaxError){const detail=String(error.stderr||'');throw Error(/Unknown decoder|Decoder .* not found|Unsupported codec/i.test(detail)?'El códec de vídeo no tiene un decodificador disponible en esta instalación.':'No se pudo preparar el archivo. Comprueba que no esté dañado o protegido y que tenga una pista de vídeo decodificable.');}throw error;}
 finally{if(handle)await handle.close().catch(()=>{});fs.rmSync(dir,{recursive:true,force:true});}
}
module.exports={prepare,audioFormats,videoFormats};
