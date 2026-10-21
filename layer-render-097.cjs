// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const Composition=require('./public/composition.js'),Tracks=require('./public/tracks.js'),OverlayLanes=require('./public/overlay-lanes.js');

function normalizeBase(input,spec){
 if(!input||typeof input!=='object')throw Error('Estructura de pistas no válida.');
 const mainDuration=input.mainDuration??spec.duration,mainStart=input.mainStart??0;Tracks.frames(mainDuration);
 if(input.mainPresent!==false&&(!Number.isFinite(mainStart)||mainStart<0||mainStart+mainDuration>spec.duration+1/60))throw Error('Ubicación de MGT fuera del proyecto.');
 const flags={};for(const id of ['mgt','overlay','subtitles','audio','effects','video']){flags[id]={visible:true,muted:false};for(const k of ['visible','muted'])if(input.flags?.[id]?.[k]!==undefined){if(typeof input.flags[id][k]!=='boolean')throw Error('Estado de pista no válido.');flags[id][k]=input.flags[id][k];}}
 const video=require('./public/base-video.js').validate(input.video??[]),overlays=Tracks.create(),subtitles=Tracks.create();overlays.restore(input.overlays??[]);
 if(!Array.isArray(input.subtitles??[])||(input.subtitles??[]).length>1)throw Error('Solo una pista de subtítulos.');subtitles.restore(input.subtitles??[]);
 if(subtitles.snapshot().some(c=>c.document.subtitles?.kind!=='composition'||c.start!==0))throw Error('Pista de subtítulos no válida.');
 if(JSON.stringify(input).length>128*1024*1024)throw Error('Las capas superan el límite de exportación.');
 return {mainDuration,mainStart,video,overlays:overlays.snapshot(),subtitles:subtitles.snapshot(),flags};
}

function normalize(input,spec){
 if(input.overlayLanes!==undefined){
  const lanes=require('./public/overlay-lanes.js').create();lanes.restore(input.overlayLanes);
  const result=normalizeBase({...input,mainPresent:false,video:[],overlays:[]},spec),flags={...result.flags};
  for(const lane of lanes.snapshot()){const raw=input.flags?.[lane.id];if(raw!==undefined&&(typeof raw!=='object'||raw===null||raw.visible!==undefined&&typeof raw.visible!=='boolean'))throw Error('Visibilidad de pista visual no válida.');flags[lane.id]={visible:raw?.visible!==false,muted:false};}
  for(const [id,raw] of Object.entries(input.flags??{})){if(!/^audio-[a-z0-9-]+$/i.test(id))continue;if(!raw||typeof raw!=='object'||raw.muted!==undefined&&typeof raw.muted!=='boolean')throw Error('Silencio de pista de audio no válido.');flags[id]={visible:true,muted:raw.muted===true};}
  return {...result,flags,mainPresent:false,mgt:[],video:[],overlayLanes:lanes.snapshot()};
 }
 const mgt=input.mgt??[];if(!Array.isArray(mgt)||mgt.length>16||input.mainPresent!==undefined&&typeof input.mainPresent!=='boolean')throw Error('Pista MGT no válida.');
 const clips=Tracks.create();clips.restore(mgt);const result=normalizeBase(input,spec);
 for(const c of clips.snapshot())if(c.start+c.frames>Math.round(spec.duration*60))throw Error('MGT fuera del proyecto.');
 return {...result,mainPresent:input.mainPresent!==false,mgt:clips.snapshot()};
}

async function open(page,spec,composition,params,seed,layers,width,height,bounded,alpha=false,videoSource=null){
 await page.setContent('<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:'+(alpha?'transparent':spec.background)+';color-scheme:normal}iframe{position:absolute;inset:0;border:0;width:100%;height:100%;color-scheme:normal;background:transparent}iframe[hidden]{display:none}</style>');
 const hasVideo=layers.video.length>0,entries=[];
 if(layers.overlayLanes){for(const lane of [...layers.overlayLanes].reverse())if(layers.flags[lane.id]?.visible!==false)entries.push(...lane.clips);}
 else{
  if(layers.flags.video.visible)entries.push(...layers.video);
  if(layers.flags.mgt.visible){if(layers.mainPresent!==false)entries.push({main:true,start:Math.round(layers.mainStart*60),frames:Math.round(layers.mainDuration*60),document:composition,params,seed});entries.push(...(layers.mgt??[]));}
  if(layers.flags.overlay.visible)entries.push(...layers.overlays);
 }
 if(layers.flags.subtitles.visible)entries.push(...layers.subtitles.map(c=>({...c,document:{...c.document,css:c.document.css+'\nhtml,body,#root{background:transparent!important}'}})));
 const frames=[];
 for(const entry of entries){
  const e=entry.document?.subtitles?.kind==='composition'?{...entry,document:{...entry.document,css:entry.document.css+'\nhtml,body,#root{background:transparent!important}'}}:entry;
  const videoSources=e.projectVideoId&&videoSource?{[e.params?.videoFile]:videoSource(e.projectVideoId)}:undefined;
  const html=e.main&&!e.document?require('./public/scene.js').documentHTML({...spec,duration:layers.mainDuration},false,false,hasVideo||alpha):Composition.documentHTML(e.document,{width,height,duration:(e.authoredFrames??e.sourceFrames??e.frames)/60,background:e.main&&!hasVideo&&!alpha?spec.background:'transparent',overlay:!e.main||hasVideo||alpha,params:e.params,seed:e.seed,videoSources});
  const handle=await page.evaluateHandle(html=>{const el=document.createElement('iframe');el.setAttribute('sandbox','allow-scripts');el.srcdoc=html;document.body.append(el);return el;},html);
  const scene=await handle.asElement().contentFrame();await scene.waitForFunction(()=>!!window.sceneReady);await bounded(scene.evaluate(()=>window.sceneReady));frames.push({handle,scene,start:e.start,length:e.frames,clip:e});
 }
 return async frame=>{for(const e of frames){const local=frame-e.start,active=local>=0&&local<e.length;await e.handle.evaluate((el,active)=>el.hidden=!active,active);if(active)await bounded(e.scene.evaluate(async f=>{await window.setFrame(f);if(window.mgtError)throw Error(window.mgtError);},OverlayLanes.sourceFrame(e.clip,local)));}};
}
module.exports={normalize,open};
