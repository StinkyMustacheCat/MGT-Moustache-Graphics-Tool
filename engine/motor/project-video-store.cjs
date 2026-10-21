// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const UUID=/^[a-f0-9-]{36}$/i,MAX_VIDEO=512*1024*1024;
function create(root,ffprobe){fs.mkdirSync(root,{recursive:true});
 function validate(target){
  let probe;try{probe=JSON.parse(execFileSync(ffprobe,['-v','error','-show_streams','-show_format','-of','json',target],{windowsHide:true,timeout:30000,maxBuffer:1024*1024}));}catch{throw Error('El vídeo del proyecto está dañado o no se puede leer.');}
  const tracks=probe.streams??[],video=tracks.filter(s=>s.codec_type==='video');
  const duration=Number(video[0]?.duration??probe.format?.duration),fps=String(video[0]?.avg_frame_rate??'0/1').split('/').map(Number);
  if(!String(probe.format?.format_name??'').split(',').includes('mov')||tracks.length!==1||video.length!==1||video[0].codec_name!=='h264'||!Number.isFinite(duration)||duration<=0||duration>120.2||!Number.isInteger(video[0].width)||!Number.isInteger(video[0].height)||video[0].width>1920||video[0].height>1920||video[0].width<2||video[0].height<2||!Number.isFinite(fps[0]/fps[1])||fps[0]/fps[1]>60.1)throw Error('El vídeo del proyecto no corresponde a un MP4 preparado por MGT.');
 }
 const file=id=>{if(!UUID.test(id))throw Error('Referencia de vídeo no válida.');const target=path.join(root,id+'.mp4');if(!fs.existsSync(target))throw Error('Falta un vídeo del proyecto. Abre de nuevo el proyecto y reenlázalo.');return target;};
 async function add(source){const id=crypto.randomUUID(),target=path.join(root,id+'.mp4');if((await fs.promises.stat(source)).size>MAX_VIDEO)throw Error('El vídeo preparado supera 512 MiB.');validate(source);await fs.promises.copyFile(source,target,fs.constants.COPYFILE_EXCL);return id;}
 async function restore(stream){const id=crypto.randomUUID(),target=path.join(root,id+'.mp4');let size=0,handle;try{handle=await fs.promises.open(target,'wx');for await(const chunk of stream){size+=chunk.length;if(size>MAX_VIDEO)throw Error('El vídeo del proyecto supera 512 MiB.');let offset=0;while(offset<chunk.length){const result=await handle.write(chunk,offset,chunk.length-offset);if(!result.bytesWritten)throw Error('No se pudo escribir el vídeo del proyecto.');offset+=result.bytesWritten;}}if(!size)throw Error('El vídeo del proyecto está vacío.');await handle.close();handle=null;validate(target);return id;}catch(error){await handle?.close().catch(()=>{});await fs.promises.rm(target,{force:true});throw error;}}
 const discard=id=>{if(UUID.test(id))fs.rmSync(path.join(root,id+'.mp4'),{force:true});};
 return {add,file,restore,discard,MAX_VIDEO};
}
module.exports={create,MAX_VIDEO};
