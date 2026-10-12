// SPDX-License-Identifier: GPL-3.0-or-later
(function(root){
 'use strict';
 const limits=Object.freeze({bytes:8000000,cues:20000,words:60000,text:4000,duration:3600});
 const fail=m=>{throw Error(m);};
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 function decode(bytes){const a=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);const encoding=a[0]===255&&a[1]===254?'utf-16le':a[0]===254&&a[1]===255?'utf-16be':'utf-8';try{return new TextDecoder(encoding,{fatal:true}).decode(a).replace(/^\uFEFF/,'');}catch{fail('Codificación no compatible. Guarda el archivo como UTF-8 o UTF-16 con marca BOM.');}}
 function validate(input){
  if(!input||input.version!==1||!['template','composition'].includes(input.kind))fail('Subtítulos: version 1 y kind template/composition requeridos.');
  if(!['cue','word','estimated'].includes(input.timing))fail('Subtítulos: timing debe ser cue, word o estimated.');
  if(!Array.isArray(input.cues)||input.cues.length>limits.cues)fail('Máximo 20 000 bloques de subtítulos.');
  if(input.kind==='template'&&input.cues.length)fail('Una plantilla no debe incluir transcripción.');
  const tail=input.tail??.25;if(!finite(tail)||tail<0||tail>5)fail('Salida de subtítulos: de 0 a 5 segundos.');
  let count=0,last=-1,open=[];
  function entry(x,label){
   if(!x||!finite(x.start)||!finite(x.end))fail(label+': inicio y final deben ser números finitos en segundos.');
   if(x.start<0)fail(label+': el inicio no puede ser negativo ('+x.start+' s).');
   if(x.end<=x.start)fail(label+': el final ('+x.end+' s) debe ser mayor que el inicio ('+x.start+' s).');
   if(x.end>3600)fail(label+': el final supera el máximo de 3600 segundos.');
   if(typeof x.text!=='string'||!x.text.trim())fail(label+': falta el texto.');
   if(x.text.length>limits.text)fail(label+': el texto supera 4000 caracteres.');return {start:x.start,end:x.end,text:x.text};
  }
  const cues=input.cues.map((x,i)=>{
   const c=entry(x,'Bloque '+(i+1));if(c.start<last)fail('Los bloques deben estar ordenados por inicio.');last=c.start;
   open=open.filter(end=>end>c.start);open.push(c.end);if(open.length>8)fail('Máximo 8 bloques simultáneos.');
   if(x.words!==undefined){if(!Array.isArray(x.words)||!x.words.length)fail('words debe ser una lista no vacía.');let previous=c.start;
    c.words=x.words.map((w,wi)=>{const v=entry(w,'Palabra '+(wi+1)+' del bloque '+(i+1));if(v.start<previous||v.start<c.start||v.end>c.end)fail('Palabra '+(wi+1)+' del bloque '+(i+1)+': los tiempos deben estar ordenados y dentro del bloque.');previous=v.start;if(++count>limits.words)fail('Máximo 60 000 palabras.');return v;});
    if(c.words.map(w=>w.text).join(' ').replace(/\s+/g,' ').trim()!==c.text.replace(/\s+/g,' ').trim())fail('El texto del bloque debe coincidir con sus palabras.');
   }else if(input.timing!=='cue')fail('Esta sincronización requiere tiempos en todas las palabras.');
   return c;
  });
  return {version:1,kind:input.kind,timing:input.timing,tail,cues};
 }
 function stamp(s){const m=s.trim().match(/^(?:(\d{2,}):)?(\d{2}):(\d{2})[.,](\d{3})$/);if(!m||+m[2]>59||+m[3]>59)fail('Marca de tiempo no válida: '+s);return (+m[1]||0)*3600+(+m[2])*60+(+m[3])+(+m[4])/1000;}
 function plain(s){return s.replace(/<[^>]*>/g,'').replace(/\{\\[^}]*\}/g,'').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|nbsp|quot|apos);/gi,(_,v)=>{const named={amp:'&',lt:'<',gt:'>',nbsp:' ',quot:'"',apos:"'"};if(v[0]!=='#')return named[v.toLowerCase()];const n=v[1].toLowerCase()==='x'?parseInt(v.slice(2),16):Number(v.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):'�';}).trim();}
 function parseText(text,extension){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>limits.bytes)fail('Subtítulos: máximo 8 MB.');
  text=text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
  const vtt=/^WEBVTT(?:[ \t]|\n|$)/.test(text);if(extension==='vtt'&&!vtt)fail('Falta la cabecera WEBVTT.');
  const warnings=new Set(),cues=[];if(vtt)text=text.replace(/^WEBVTT[^\n]*(?:\n|$)/,'');
  let blockNumber=0,cursor=0,line=vtt?2:1;
  for(const block of text.split(/\n[ \t]*\n/)){
   const position=text.indexOf(block,cursor);line+=(text.slice(cursor,position).match(/\n/g)||[]).length;const sourceLine=line+(block.match(/^\s*/)[0].match(/\n/g)||[]).length;line+=(block.match(/\n/g)||[]).length;cursor=position+block.length;
   const lines=block.trim().split('\n');if(!block.trim())continue;
   if(vtt&&/^(NOTE(?:\s|$)|STYLE$|REGION$)/.test(lines[0])){if(!lines[0].startsWith('NOTE'))warnings.add('Se omiten estilos y regiones VTT; el aspecto lo define la plantilla.');continue;}
   blockNumber++;try{
   let i=lines[0].includes('-->')?0:1;const m=lines[i]?.match(/^(\S+)\s+-->\s+(\S+)(.*)$/);if(!m)fail('Bloque sin tiempos válidos: '+lines[0].slice(0,80));
   if(m[3].trim())warnings.add('Se omiten posiciones del archivo; el aspecto lo define la plantilla.');
   const start=stamp(m[1]),end=stamp(m[2]),raw=lines.slice(i+1).join('\n'),content=plain(raw);
   if(!content)fail('Bloque sin texto cerca de '+m[1]);
   const cue={start,end,text:content};
   const markers=[...raw.matchAll(/<((?:\d{2,}:)?\d{2}:\d{2}\.\d{3})>/g)];
   if(vtt&&markers.length){let at=start,offset=0,words=[],exact=true;
    for(const marker of [...markers,{index:raw.length,0:'',1:null}]){const stop=marker[1]===null?end:stamp(marker[1]);if(stop<at||stop>end)fail('Marcas internas VTT fuera de orden o del bloque.');const segment=plain(raw.slice(offset,marker.index));if(segment){if(stop<=at)fail('Palabra VTT sin duración.');if(segment.split(/\s+/).length!==1)exact=false;words.push({text:segment,start:at,end:stop});}at=stop;offset=marker.index+marker[0].length;}
    if(exact&&words.length&&words.map(w=>w.text).join(' ').replace(/\s+/g,' ')===content.replace(/\s+/g,' '))cue.words=words;else warnings.add('Algunas marcas VTT no delimitan palabras: se conservan los tiempos por bloque.');
   }
   validate({version:1,kind:'composition',timing:cue.words?'word':'cue',cues:[cue]});cues.push(cue);
   }catch(error){throw Error('Bloque '+blockNumber+' (línea '+sourceLine+'): '+error.message.replace(/^Bloque 1: /,''));}
  }
  if(!cues.length)fail('No se encontraron subtítulos.');
  cues.sort((a,b)=>a.start-b.start);
  return {subtitles:validate({version:1,kind:'composition',timing:cues.every(c=>c.words)?'word':'cue',tail:.25,cues}),warnings:[...warnings]};
 }
 function estimate(input){const s=validate(input);return validate({...s,timing:'estimated',cues:s.cues.map(c=>{if(c.words)return c;const parts=c.text.trim().split(/\s+/),total=parts.reduce((n,w)=>n+w.length,0);let offset=0;return {...c,words:parts.map((text,i)=>{const start=c.start+(c.end-c.start)*offset/total;offset+=text.length;return {text,start,end:i===parts.length-1?c.end:c.start+(c.end-c.start)*offset/total};})};})});}
 function asTemplate(input){return {...validate(input),kind:'template',timing:'cue',cues:[]};}
 function duration(input){const s=validate(input),end=s.cues.reduce((n,c)=>Math.max(n,c.end),0);const result=Math.max(.1,(Math.ceil((end+s.tail)*60)+1)/60);if(result>3600)fail('Los subtítulos y su salida exceden 60 minutos. Ajusta el final o la salida; no se recortan automáticamente.');return result;}
 function shift(input,delta){if(!finite(delta))fail('Desplazamiento no válido.');return validate({...input,cues:input.cues.map(c=>({...c,start:c.start+delta,end:c.end+delta,...(c.words?{words:c.words.map(w=>({...w,start:w.start+delta,end:w.end+delta}))}:{})}))});}
 function legacy(raw){
  if(!raw||typeof raw.render!=='string')fail('No es una plantilla o composición de subtítulos reconocida.');
  if(raw.subtitles)return {...raw,subtitles:validate(raw.subtitles)};
  const prefix=raw.render.match(/^\s*var\s+WORDS\s*=\s*/);if(!prefix)fail('JSON sin sección subtitles ni formato Wordline compatible.');
  let text=raw.render.slice(prefix[0].length),length,words=null;
  if(text.startsWith('__WORDLINE_WORDS__')){if(raw.wordline_template_version!==1)fail('Versión de plantilla Wordline no compatible.');length='__WORDLINE_WORDS__'.length;}
  else if(text[0]==='['){let quoted=false,escape=false,depth=0;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='[')depth++;else if(c===']'&&--depth===0){length=i+1;break;}}if(!length)fail('Lista Wordline incompleta.');try{words=JSON.parse(text.slice(0,length));}catch{fail('WORDS debe ser un array JSON literal. No se ejecuta código para leerlo.');}if(!Array.isArray(words)||words.length>limits.words)fail('Lista Wordline demasiado grande.');}
  else fail('Variante Wordline no compatible: WORDS debe ser JSON literal.');
  if(!/^\s*;/.test(text.slice(length)))fail('Asignación Wordline no compatible.');
  const cues=[];let cue;const per=Number(raw.parameters?.find(p=>p.id==='perBlock')?.default)||6;
  if(words)for(const w of words){if(!w||typeof w.text!=='string')fail('Palabra Wordline no válida.');if(!cue||cue.words.length>=per||w.start-cue.end>.6){cue={start:w.start,end:w.end,text:'',words:[]};cues.push(cue);}cue.words.push(w);cue.text=cue.words.map(w=>w.text).join(' ');cue.end=Math.max(cue.end,w.end);if(/[.!?]$/.test(w.text))cue=null;}
  const subtitles=validate({version:1,kind:words?'composition':'template',timing:words?'word':'cue',tail:.25,cues});
  const result={...raw,render:'const root = ctx.root;\nvar WORDS=ctx.subtitles.words;'+text.slice(length).replace(/^\s*;/,''),subtitles};delete result.wordline_template_version;return result;
 }
 // Serialized into the isolated renderer; independent of module scope.
 function prepare(data){
  const cues=data?.cues||[],words=cues.flatMap(c=>c.words||[]),ends=[];let max=0;
  for(const c of cues){if(c.words){c.words.forEach(Object.freeze);Object.freeze(c.words);}Object.freeze(c);max=Math.max(max,c.end);ends.push(max);}Object.freeze(cues);Object.freeze(words);
  return Object.freeze({cues,words,timing:data?.timing||'cue',tail:data?.tail??.25,at(time,tail=0){tail=Math.max(0,Math.min(5,Number(tail)||0));let lo=0,hi=cues.length;while(lo<hi){const mid=(lo+hi)>>>1;if(cues[mid].start<=time)lo=mid+1;else hi=mid;}const found=[];for(let i=lo-1;i>=0&&ends[i]+tail>time;i--)if(cues[i].end+tail>time)found.push(cues[i]);return found.reverse();}});
 }
 const api={limits,decode,validate,parseText,estimate,asTemplate,duration,shift,legacy,prepare};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MGTSubtitles=api;
})(typeof window!=='undefined'?window:globalThis);
