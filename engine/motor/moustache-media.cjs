// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const crypto=require('node:crypto'),zlib=require('node:zlib');
const MAX_BLOCK=16*1024*1024,MAX_JSON=64*1024*1024;
const fail=m=>{throw Error(m);};
const hash=b=>crypto.createHash('sha256').update(b).digest();
// Strict JSON: preserve JSON semantics while rejecting duplicate (also escaped) keys.
function strictJSON(text){
 let i=0;const ws=()=>{while(/[\x20\t\r\n]/.test(text[i]||'x'))i++;};
 function string(){const start=i++;while(i<text.length){const c=text[i++];if(c==='"')return JSON.parse(text.slice(start,i));if(c==='\\')i++;}fail('JSON incompleto.');}
 function value(depth=0){if(depth>100)fail('Metadatos demasiado anidados.');ws();const c=text[i];
  if(c==='"')return string();
  if(c==='{'||c==='['){i++;const object=c==='{',out=object?Object.create(null):[],keys=new Set(),end=object?'}':']';ws();if(text[i]===end){i++;return out;}
   for(;;){ws();let key;if(object){if(text[i]!=='"')fail('Campo JSON inválido.');key=string();if(keys.has(key))fail('Campo JSON duplicado: '+key);keys.add(key);ws();if(text[i++]!==':')fail('JSON inválido.');}
    const v=value(depth+1);if(object)out[key]=v;else out.push(v);ws();const next=text[i++];if(next===end)return out;if(next!==',')fail('JSON inválido.');}
  }
  const m=text.slice(i).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/);if(!m)fail('JSON inválido o número no finito.');i+=m[0].length;const v=JSON.parse(m[0]);if(typeof v==='number'&&!Number.isFinite(v))fail('Número no finito.');return v;
 }const result=value();ws();if(i!==text.length)fail('Contenido JSON adicional.');return result;
}
// Validator deliberately limited to the keywords present in the two bundled schemas.
function schema(value,s,label='metadatos'){
 const bad=()=>fail('Contrato Wordline inválido: '+label);
 if(s.anyOf){if(!s.anyOf.some(x=>{try{schema(value,x,label);return true;}catch{return false;}}))bad();}
 if(Object.hasOwn(s,'const')&&value!==s.const)bad();if(s.enum&&!s.enum.includes(value))bad();
 if(s.type){const types=[s.type].flat();if(!types.some(t=>t==='null'?value===null:t==='array'?Array.isArray(value):t==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):t==='integer'?Number.isSafeInteger(value):t==='number'?typeof value==='number'&&Number.isFinite(value):typeof value===t))bad();}
 if(typeof value==='string'&&((s.minLength&&[...value].length<s.minLength)||(s.pattern&&!new RegExp(s.pattern).test(value))))bad();
 if(typeof value==='number'&&s.minimum!==undefined&&value<s.minimum)bad();
 if(Array.isArray(value)&&s.items)value.forEach((v,i)=>schema(v,s.items,label+'['+i+']'));
 if(value&&typeof value==='object'&&!Array.isArray(value)){
  for(const key of s.required||[])if(!Object.hasOwn(value,key))bad();
  for(const key of Object.keys(value)){if(s.properties&&Object.hasOwn(s.properties,key))schema(value[key],s.properties[key],label+'.'+key);else if(s.additionalProperties===false)bad();}
 }
}
function validate(p,frames,digest){
 if(p?.format!=='moustache-media'||p.schema_version!=='1.0')fail('Versión de metadatos Moustache no compatible.');
 const eq=(a,b)=>a&&Object.keys(a).length===Object.keys(b).length&&Object.entries(b).every(([k,v])=>a[k]===v);
 if(!Array.isArray(p.tracks)||p.tracks.length!==1||!eq(p.tracks[0],{id:'audio-1',kind:'audio',sample_rate:48000,channels:2,bits_per_sample:16,frame_count:frames,time_origin:'first_decoded_audio_sample',pcm_sha256:digest}))fail('Los metadatos no corresponden al audio del WAV (PCM).');
 if(!eq(p.timeline,{track_id:'audio-1',unit:'sample',rate:48000,origin:0}))fail('Base temporal incompatible.');
 if(!p.editing||Object.keys(p.editing).length!==2||p.editing.new_base!==true||!Array.isArray(p.editing.exclusions)||p.editing.exclusions.length)fail('El WAV contiene cortes pendientes.');
 const a=p.analysis;schema(a,require('./schemas/analysis-fast.schema.json'),'analysis');schema(a.transcript,require('./schemas/wordline.schema.json'),'transcript');
 const duration=frames/48000;if(a.source.frame_count!==frames||Math.abs(a.source.duration_seconds-duration)>1/48000)fail('Duración de datos incompatible.');
 let cursor=0,previous=0;for(const part of a.time_map){const {original_start_sample:s,original_end_sample:e,edited_start_sample:x,edited_end_sample:y}=part;if(!(previous<=s&&s<e&&x===cursor&&y-x===e-s))fail('Mapa temporal incoherente.');previous=e;cursor=y;}if(cursor!==frames)fail('Mapa temporal incompleto.');
 if(a.joins.some(j=>j.at_sample>=frames))fail('Unión fuera del audio.');
 for(const item of [...a.events,...a.transcript.timeline])if(!(0<=item.start&&item.start<item.end&&item.end<=a.source.duration_seconds+1e-8))fail('Tiempo Fast fuera de duración.');
 const ids=new Set();const identifier=x=>{if(!x.id.trim()||!x.text.trim()||ids.has(x.id))fail('Texto vacío o identificador repetido.');ids.add(x.id);};
 if(!a.transcript.id.trim()||!a.transcript.language.trim())fail('Identificador o idioma vacío.');previous=-1;
 for(const s of a.transcript.timeline){identifier(s);if(s.start<previous||s.end>duration+1/48000)fail('Intervalo de segmento inválido.');previous=s.start;let last=s.start;
  for(const w of s.words){identifier(w);if((w.start===null)!==(w.end===null))fail('Palabra sin alineamiento: ambos tiempos deben ser null.');if(w.start!==null){if(!(s.start<=w.start&&last<=w.start&&w.start<=w.end&&w.end<=s.end&&w.end<=duration+1/48000))fail('Intervalo de palabra inválido.');last=w.start;}}
 }
 if(a.annotations.some(x=>!ids.has(x.target_id)))fail('Observación sin referencia válida.');return p;
}
async function decode(raw){
 if(raw.length<40||raw.toString('ascii',0,4)!=='MM01')fail('Cabecera Moustache no compatible.');
 const length=raw.readUInt32LE(4);if(!length||length>MAX_JSON)fail('JSON descomprimido supera 64 MiB.');
 const decoded=await new Promise((resolve,reject)=>zlib.gunzip(raw.subarray(40),{maxOutputLength:Math.min(length,MAX_JSON)},(e,b)=>e?reject(Error('Metadatos gzip dañados o límite de descompresión excedido.')):resolve(b)));
 if(decoded.length!==length||!hash(decoded).equals(raw.subarray(8,40)))fail('Metadatos dañados: longitud o SHA-256 incorrecto.');
 return strictJSON(new TextDecoder('utf-8',{fatal:true}).decode(decoded));
}
// Consume the request incrementally. Only MSCH (<=16 MiB) is retained; PCM is hashed and discarded.
async function read(stream,{onPCM}={}){
 const iterator=stream[Symbol.asyncIterator]();let pending=Buffer.alloc(0),offset=0;
 async function take(n,consume){const parts=[];while(n){if(!pending.length){const step=await iterator.next();if(step.done)fail('WAV truncado.');pending=Buffer.from(step.value);if(!pending.length)continue;}const size=Math.min(n,pending.length),part=pending.subarray(0,size);if(consume)consume(part);else parts.push(part);pending=pending.subarray(size);n-=size;offset+=size;}return consume?null:Buffer.concat(parts);}
 const head=await take(12);if(head.toString('ascii',0,4)!=='RIFF'||head.toString('ascii',8)!=='WAVE')fail('Se requiere WAV RIFF; RF64 no es compatible.');
 const total=head.readUInt32LE(4)+8;if(total<12||total>3600*192000+MAX_BLOCK+1024*1024)fail('El WAV supera el límite de MGT: 60 minutos o tamaño admitido.');
 let fmt,bytes,metadata;const pcm=crypto.createHash('sha256');
 while(offset<total){if(total-offset<8)fail('Cabecera RIFF incompleta.');const h=await take(8),kind=h.toString('ascii',0,4),n=h.readUInt32LE(4);if(offset+n+(n&1)>total)fail('Bloque fuera del WAV.');
  if(kind==='fmt '){if(fmt||n<16||n>4096)fail('Formato WAV ambiguo.');fmt=await take(n);}
  else if(kind==='data'){if(bytes!==undefined||!n||n%4)fail('Bloque PCM inválido o duplicado.');bytes=n;if(n>3600*192000)fail('MGT admite hasta 60 minutos; no se recorta el audio.');await take(n,b=>{pcm.update(b);onPCM?.(b);});}
  else if(kind==='MSCH'){if(metadata||n>MAX_BLOCK)fail('Metadatos duplicados o mayores de 16 MiB.');metadata=await take(n);}
  else await take(n,()=>{});
  if(n&1)await take(1);
 }
 if(pending.length||!(await iterator.next()).done)fail('Tamaño RIFF incorrecto.');
 if(!metadata)fail('Este WAV no contiene subtítulos de Wordline.');
 if(!fmt||bytes===undefined||fmt.readUInt16LE(0)!==1||fmt.readUInt16LE(2)!==2||fmt.readUInt32LE(4)!==48000||fmt.readUInt32LE(8)!==192000||fmt.readUInt16LE(12)!==4||fmt.readUInt16LE(14)!==16)fail('Se requiere PCM estéreo, 48 kHz y 16 bits.');
 return validate(await decode(metadata),bytes/4,pcm.digest('hex'));
}
module.exports={read,decode,validate,strictJSON,schema};
