// SPDX-License-Identifier: GPL-3.0-or-later
(function(root){'use strict';
 function plan(clips,reader,length,end){
  if(![reader,length,end].every(Number.isInteger)||reader<0||reader>=end||length<1)throw Error('Tiempo de pegado no válido.');
  const ordered=[...clips].sort((a,b)=>a.start-b.start);let start=reader;
  for(const c of ordered)if(start>=c.start&&start<c.start+c.frames)start=c.start+c.frames;
  const next=ordered.find(c=>c.start>=start),available=Math.max(0,Math.min(end,next?.start??end)-start);
  return {start,frames:Math.min(length,available),available,trim:length>available};
 }
 function planNext(clips,reader,length,end,wrap=false){let result=plan(clips,reader,length,end),wrapped=false;if(wrap&&!result.available&&reader>0){const earlier=plan(clips,0,length,end);if(earlier.available){result=earlier;wrapped=true;}}return {plan:result,wrapped};}
 function snapStart(clips,id,start,length,end,tolerance){
  const others=clips.filter(c=>c.id!==id),fits=value=>value>=0&&value<end&&!others.some(c=>value<c.start+c.frames&&value+length>c.start);
  let best=start,distance=tolerance+1;
  for(const c of others)for(const edge of [c.start,c.start+c.frames])for(const candidate of [edge,edge-length]){
   const delta=Math.abs(candidate-start);
   if(delta<distance&&delta<=tolerance&&fits(candidate)){best=candidate;distance=delta;}
  }
  return best;
 }
 const api={plan,planNext,snapStart};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MGTPastePlacement=api;
})(typeof window!=='undefined'?window:globalThis);
