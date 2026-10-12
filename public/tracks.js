// SPDX-License-Identifier: GPL-3.0-or-later
(function(root){
 'use strict';
 const Composition=typeof module!=='undefined'&&module.exports?require('./composition.js'):root.MGTComposition;
 const MAX_CLIPS=16,MAX_BYTES=96*1024*1024,FPS=60;
 function frames(seconds,label='Duración'){if(!Number.isFinite(seconds)||seconds<1/FPS||seconds>3600)throw Error(label+': de un fotograma a 3600 segundos.');return Math.max(1,Math.round(seconds*FPS));}
 function interval(clip,projectFrames){return {start:clip.start,end:Math.min(clip.start+clip.frames,projectFrames),active:clip.start<projectFrames};}
 function validPlacement(clips,id,start,length,projectFrames){
  if(!Number.isInteger(projectFrames)||projectFrames<1||projectFrames>216000)throw Error('Duración de proyecto no válida.');
  if(!Number.isInteger(start)||start<0||start>=projectFrames)throw Error('El comienzo debe estar dentro de la duración del proyecto.');
  if(!Number.isInteger(length)||length<1||length>216000)throw Error('Duración de overlay no válida.');
  if(clips.some(c=>c.id!==id&&start<c.start+c.frames&&start+length>c.start))throw Error('Los overlays no pueden solaparse. Colócalo cuando termine el otro.');
 }
 function coordinateDuration(current,incoming,ask){frames(current);frames(incoming);const accepted=incoming<=current||ask('La duración de esta pista ('+incoming.toFixed(3)+' s) supera la del proyecto ('+current.toFixed(3)+' s). ¿Ajustar la duración del proyecto?');return {duration:accepted?Math.max(current,incoming):current,cut:!accepted};}
 function create(){
  let clips=[];
  const snapshot=()=>structuredClone(clips);
  function addMany(entries,projectFrames){const next=snapshot();for(const e of entries){
   if(next.length>=MAX_CLIPS)throw Error('Esta primera versión admite hasta 16 overlays.');
   if(typeof e.id!=='string'||! /^[A-Za-z0-9-]{1,80}$/.test(e.id)||next.some(c=>c.id===e.id))throw Error('Identificador de clip no válido.');
   const document=Composition.parse(e.document);if(document.subtitles?.kind==='template')throw Error('Carga una composición con contenido, no una plantilla vacía de subtítulos.');new Function('ctx',document.render);
   const length=frames(e.duration),raw=JSON.stringify(document),bytes=new TextEncoder().encode(raw).length;
   if(next.reduce((n,c)=>n+c.bytes,0)+bytes>MAX_BYTES)throw Error('Los overlays superan 96 MiB de JSON en esta sesión.');
   let start=e.start;
   if(start===undefined){start=0;for(const c of [...next].sort((a,b)=>a.start-b.start)){if(start+length<=c.start)break;start=Math.max(start,c.start+c.frames);}}
   validPlacement(next,e.id,start,length,projectFrames);
   next.push({id:e.id,document,params:Composition.values(document),seed:document.seed??1,start,frames:length,bytes,revision:0});
  }clips=next;return snapshot();}
  function get(id){const c=clips.find(c=>c.id===id);if(!c)throw Error('Overlay no encontrado.');return structuredClone(c);}
  function move(id,start,length,projectFrames){const c=get(id);validPlacement(clips,id,start,length,projectFrames);clips=clips.map(c=>c.id===id?{...c,start,frames:length}:c);return get(id);}
  function parameters(id,input){const c=get(id),params=Composition.values(c.document,input);clips=clips.map(c=>c.id===id?{...c,params}:c);return get(id);}
  function replace(id,raw,input){get(id);const document=Composition.parse(raw);new Function('ctx',document.render);const params=Composition.values(document,input),bytes=new TextEncoder().encode(JSON.stringify(document)).length;if(clips.filter(c=>c.id!==id).reduce((n,c)=>n+c.bytes,0)+bytes>MAX_BYTES)throw Error('Los recursos superan 96 MiB de JSON.');clips=clips.map(c=>c.id===id?{...c,document,params,bytes,revision:(c.revision??0)+1}:c);return get(id);}
  function remove(id){get(id);clips=clips.filter(c=>c.id!==id);}
  function at(frame,projectFrames){if(!Number.isInteger(frame)||frame<0||frame>=projectFrames)return null;const c=clips.find(c=>frame>=c.start&&frame<c.start+c.frames);return c?{clip:structuredClone(c),localFrame:frame-c.start}:null;}
  function restore(input){const next=create();next.addMany(input.map(c=>({id:c.id,document:c.document,start:c.start,duration:c.frames/60})),216000);const restored=next.snapshot().map(c=>{const raw=input.find(x=>x.id===c.id),seed=raw.seed??c.seed;if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Semilla de clip no válida.');return {...c,seed,params:Composition.values(c.document,raw.params)};});clips=restored;}
  return {restore,snapshot,get,addMany,move,parameters,replace,remove,at};
 }
 const api={FPS,MAX_CLIPS,MAX_BYTES,frames,interval,validPlacement,coordinateDuration,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MGTTracks=api;
})(typeof window!=='undefined'?window:globalThis);
