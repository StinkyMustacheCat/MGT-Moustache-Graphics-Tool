// SPDX-License-Identifier: GPL-3.0-or-later
(function(root){'use strict';
 const Composition=typeof module!=='undefined'&&module.exports?require('./composition.js'):root.MGTComposition,FPS=60,MAX_CLIPS=16,MAX_BYTES=96*1024*1024;
 function frames(seconds){if(!Number.isFinite(seconds)||seconds<1/FPS||seconds>3600)throw Error('Duración MGT no válida.');return Math.max(1,Math.round(seconds*FPS));}
 function create(){let clips=[];const snapshot=()=>structuredClone(clips);
  function add(document,duration,start,projectFrames){if(clips.length>=MAX_CLIPS)throw Error('MGT admite hasta 16 composiciones.');const parsed=Composition.parse(document),length=frames(duration);if(!Number.isInteger(start)||start<0||start>=projectFrames)throw Error('El comienzo de MGT debe estar dentro del proyecto.');if(start+length>projectFrames)throw Error('La composición MGT no cabe en el proyecto.');if(clips.some(c=>start<c.start+c.frames&&start+length>c.start))throw Error('Las composiciones MGT no pueden solaparse.');const bytes=new TextEncoder().encode(JSON.stringify(parsed)).length;if(clips.reduce((n,c)=>n+c.bytes,0)+bytes>MAX_BYTES)throw Error('Las composiciones MGT superan 96 MiB.');const c={id:crypto.randomUUID(),document:parsed,params:Composition.values(parsed),seed:parsed.seed??1,start,frames:length,bytes,revision:0};clips=[...clips,c];return structuredClone(c);}
  function get(id){const c=clips.find(x=>x.id===id);if(!c)throw Error('Composición MGT no encontrada.');return structuredClone(c);}
  function move(id,start,length,projectFrames){const c=get(id);clips=clips.filter(x=>x.id!==id);try{return add(c.document,length/60,start,projectFrames);}catch(e){clips.push(c);throw e;}}
  function remove(id){get(id);clips=clips.filter(x=>x.id!==id);}
  function replace(id,document,params){const c=get(id),parsed=Composition.parse(document);clips=clips.map(x=>x.id===id?{...x,document:parsed,params:Composition.values(parsed,params),revision:x.revision+1}:x);return get(id);}
  function parameters(id,params){const c=get(id);return replace(id,c.document,params);}
  function at(frame){const c=clips.find(x=>frame>=x.start&&frame<x.start+x.frames);return c?{clip:structuredClone(c),localFrame:frame-c.start}:null;}
  function restore(input,projectFrames){clips=[];for(const c of input)add(c.document,c.frames/60,c.start,projectFrames);}
  return {add,get,move,remove,replace,parameters,at,restore,snapshot};
 }
 const api={FPS,MAX_CLIPS,MAX_BYTES,frames,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MGTMGTClips=api;
})(typeof window!=='undefined'?window:globalThis);
