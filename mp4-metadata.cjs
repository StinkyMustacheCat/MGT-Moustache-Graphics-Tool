// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const crypto=require('node:crypto'),M=require('./moustache-media.cjs');
const UUID=Buffer.from('7728da5563de4ea89e84f4ab4fd67ab6','hex');
const MAX_FILE=8*1024*1024*1024,MAX_BLOCK=16*1024*1024;
const fail=m=>{throw Error(m);};
function validate(payload,bytes,digest){
 const p=payload,keys=(obj,expected)=>obj&&Object.keys(obj).sort().join(',')===expected.sort().join(',');
 if(!keys(p,['format','schema_version','association','audio','timeline','editing','analysis'])||p.format!=='moustache-mp4'||p.schema_version!=='1.0')fail('Perfil de metadatos MP4 no compatible.');
 if(!keys(p.association,['scope','byte_count','sha256'])||p.association.scope!=='top_level_boxes_except_moustache_uuid'||p.association.byte_count!==bytes||p.association.sha256!==digest)fail('Los metadatos no corresponden a este MP4 (SHA-256 del contenedor).');
 const a=p.audio,frames=a?.frame_count;
 if(!keys(a,['id','kind','stream_ordinal','sample_rate','channels','bits_per_sample','frame_count','time_origin'])||a.id!=='audio-1'||a.kind!=='audio'||a.stream_ordinal!==0||a.sample_rate!==48000||a.channels!==2||a.bits_per_sample!==16||a.time_origin!=='first_decoded_audio_sample'||!Number.isSafeInteger(frames)||frames<4800||frames>3600*48000)fail('Base de audio MP4 incompatible: hasta 60 minutos, primera pista normalizada a PCM 48 kHz estéreo.');
 // Reuse the temporal/analysis validator. This does not claim to hash decoded PCM.
 const normalized={id:a.id,kind:a.kind,sample_rate:a.sample_rate,channels:a.channels,bits_per_sample:a.bits_per_sample,frame_count:frames,time_origin:a.time_origin,pcm_sha256:'0'.repeat(64)};
 M.validate({format:'moustache-media',schema_version:'1.0',tracks:[normalized],timeline:p.timeline,editing:p.editing,analysis:p.analysis},frames,normalized.pcm_sha256);
 return p;
}
async function read(stream,{onData}={}){
 const iterator=stream[Symbol.asyncIterator]();let pending=Buffer.alloc(0),offset=0,coreBytes=0,boxes=0,metadata,ftyp=false,moov=false,mdat=false;
 const core=crypto.createHash('sha256'),hashed=b=>{core.update(b);coreBytes+=b.length;};
 async function next(){const step=await iterator.next();if(step.done)return false;pending=Buffer.from(step.value);return true;}
 async function take(n,consume,optional=false){const parts=[];let read=0;while(n){while(!pending.length)if(!await next()){if(optional&&!read)return null;fail('MP4 truncado.');}const size=Math.min(n,pending.length),part=pending.subarray(0,size);offset+=size;if(offset>MAX_FILE)fail('El MP4 supera 8 GiB.');onData?.(part);if(consume)consume(part);else parts.push(part);pending=pending.subarray(size);n-=size;read+=size;}return consume?null:Buffer.concat(parts);}
 async function rest(consume){for(;;){if(pending.length)await take(pending.length,consume);if(!await next())break;}}
 for(;;){let header=await take(8,null,true);if(!header)break;if(++boxes>100000)fail('Demasiados bloques MP4.');const type=header.toString('ascii',4,8);let size=header.readUInt32BE(0);
  if(size===1){const extra=await take(8),large=extra.readBigUInt64BE();if(large<16n)fail('Tamaño extendido de bloque MP4 inválido.');if(large>BigInt(MAX_FILE))fail('Bloque MP4 demasiado grande.');size=Number(large);header=Buffer.concat([header,extra]);}
  if(size&&size<header.length)fail('Tamaño de bloque MP4 inválido.');
  if(size&&offset+size-header.length>MAX_FILE)fail('El MP4 supera 8 GiB.');
  let body=size?size-header.length:null;
  if(type==='uuid'){
   if(body!==null&&body<16)fail('UUID MP4 truncado.');const uuid=await take(16);if(body!==null)body-=16;
   if(uuid.equals(UUID)){
    if(metadata||body===null||body>MAX_BLOCK)fail('Metadatos MP4 duplicados o mayores de 16 MiB.');metadata=await take(body);continue;
   }
   hashed(header);hashed(uuid);if(body===null){await rest(hashed);break;}await take(body,hashed);continue;
  }
  hashed(header);
  if(type==='ftyp'){
   if(ftyp||body===null||body<8||body>4096||body%4)fail('Cabecera MP4 inválida.');
   const brands=await take(body);hashed(brands);const list=[brands.toString('ascii',0,4)];for(let i=8;i<brands.length;i+=4)list.push(brands.toString('ascii',i,i+4));
   if(!list.some(b=>/^(isom|iso[2-9]|mp41|mp42|avc1|dash|M4V )$/.test(b)))fail('Se requiere un contenedor MP4 compatible.');ftyp=true;
  }else{
   if(type==='moov')moov=true;if(type==='mdat')mdat=true;
   if(body===null){await rest(hashed);break;}await take(body,hashed);
  }
 }
 if(!ftyp||!moov||!mdat)fail('El archivo no es un MP4 completo: faltan bloques de estructura o contenido.');
 const digest=core.digest('hex');return {payload:metadata?validate(await M.decode(metadata),coreBytes,digest):null,coreBytes,digest};
}
module.exports={read,validate,UUID,MAX_FILE};
