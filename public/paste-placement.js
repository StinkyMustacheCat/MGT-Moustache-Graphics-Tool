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
 const api={plan,planNext};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MGTPastePlacement=api;
})(typeof window!=='undefined'?window:globalThis);
