// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const crypto=require('node:crypto');
const Composition=require('./public/composition.js');
const Scene=require('./public/scene.js');
const Export=require('./public/export-settings.js');
const Lanes=require('./public/overlay-lanes.js');
const Effects=require('./public/effects.js');
const AssetV1=require('./mgt-asset.cjs');
const engineVersion=require('./package.json').version;
const EDITABLE=new Set(['text','number','color','boolean','select','font']);
const FORMAT=new Set(['mgt.json','mgtproj']);
const FPS=AssetV1.FPS;

function hash(value){return crypto.createHash('sha256').update(value).digest('hex');}
function assertObject(value,label){if(!value||typeof value!=='object'||Array.isArray(value))throw Error(label+' no válido.');}
function capabilities(){return {engineVersion,assetContracts:[1,2],sourceFormats:[...FORMAT],profiles:['preview','final'],fps:FPS,resolutions:Export.resolutions,outputs:[{container:'mov',videoCodec:'prores_ks',alpha:true,audioCodec:'aac',audioSampleRate:48000}],maxConcurrentRenders:1,transport:'http-local',offline:true};}
function parameterDescriptor(parameter,value,prefix=''){
 const {id,label,type,min,max,step,options,control}=parameter;
 return {id:prefix+id,sourceId:id,label,type,default:value,editable:EDITABLE.has(type),...(min!==undefined?{min,max,step}:{}),...(options?{options}:{}),...(control?{control}:{})};
}
function schema(asset){
 if(asset.format==='mgt.json')return [{id:'composition',label:asset.document.name,parameters:asset.document.parameters.map(p=>parameterDescriptor(p,p.default))}];
 return (asset.project.snapshot.tracks.overlayLanes??[]).flatMap(lane=>lane.clips.map(clip=>({id:'clip/'+clip.id,label:clip.document.name,track:lane.name,parameters:clip.document.parameters.map(p=>parameterDescriptor(p,clip.params?.[p.id]??p.default,'clip/'+clip.id+'/'))}))).filter(group=>group.parameters.length);
}
function validateProject(project,entries){
 assertObject(project,'Proyecto MGT');
 if(project.format!=='mgt-project'||![1,2].includes(project.version)||!Array.isArray(project.resources)||project.resources.length>320)throw Error('Versión o recursos de proyecto no compatibles.');
 const snapshot=project.snapshot;assertObject(snapshot,'Estado de proyecto');
 const scene=Scene.normalize(snapshot.state);
 if(!snapshot.tracks?.overlayLanes)throw Error('El proyecto no contiene pistas visuales actuales. Ábrelo y vuelve a guardarlo en MGT 1.5.4 o posterior.');
 const lanes=Lanes.create();lanes.restore(snapshot.tracks.overlayLanes);
 for(const lane of lanes.snapshot())for(const clip of lane.clips)AssetV1.prepare({document:clip.document});
 if(lanes.snapshot().some(l=>l.clips.some(c=>c.start+c.frames>Math.round(scene.duration*60))))throw Error('El proyecto contiene un clip visual fuera de su duración.');
 if(!Array.isArray(snapshot.effects)||snapshot.effects.length>64||!snapshot.audio||snapshot.audio.volume!==undefined&&(!Number.isFinite(snapshot.audio.volume)||snapshot.audio.volume<0||snapshot.audio.volume>1)||snapshot.audio.muted!==undefined&&typeof snapshot.audio.muted!=='boolean')throw Error('Pistas de audio de proyecto no válidas.');
 const effectState=Effects.create();effectState.restore(snapshot.effects);const effects=effectState.snapshot();
 require('./layer-render-097.cjs').normalize({...snapshot.tracks,flags:snapshot.flags??{}},scene);
 const resources=new Map();
 for(const item of project.resources){const kind=item?.kind??'audio';if(!item||typeof item.id!=='string'||typeof item.name!=='string'||resources.has(item.id)||!['audio','video'].includes(kind)||!(kind==='audio'?/^audio\/[0-9]{1,3}\.wav$/:/^video\/[0-9]{1,3}\.mp4$/).test(item.entry)||!entries.has(item.entry))throw Error('Falta un recurso declarado en el proyecto.');resources.set(item.id,item);}
 const audioRefs=[snapshot.audio.audio?.id,...effects.map(e=>e.audio.id)].filter(Boolean);
 const videoRefs=lanes.snapshot().flatMap(l=>l.clips.map(c=>c.projectVideoId).filter(Boolean));
 for(const id of audioRefs)if(resources.get(id)?.kind!=='audio'&&resources.get(id)?.kind!==undefined)throw Error('Referencia de audio incompatible.');
 for(const id of audioRefs)if(!resources.has(id))throw Error('Falta un audio del proyecto.');
 for(const id of videoRefs)if(resources.get(id)?.kind!=='video')throw Error('Falta un vídeo del proyecto.');
 return {...project,snapshot:{...snapshot,state:scene,flags:snapshot.flags??{},tracks:{...snapshot.tracks,overlayLanes:lanes.snapshot()},effects}};
}
function makeJson(document,sourceHash){const parsed=Composition.parse(document);new Function('ctx',parsed.render);return {format:'mgt.json',document:parsed,sourceHash:sourceHash??hash(JSON.stringify(document))};}
function makeProject(project,entries,sourceHash){return {format:'mgtproj',project:validateProject(project,entries),sourceHash};}
function dependencies(asset,overrides={}){
 const fonts=schema(asset).flatMap(group=>group.parameters.filter(p=>p.type==='font').map(p=>({kind:'font',name:overrides[p.id]??p.default,embedded:false})));
 if(asset.format==='mgtproj')return [...asset.project.resources.map(r=>({kind:r.kind??'audio',name:r.name,embedded:true})),...fonts];
 const c=asset.document;return [...Object.entries({image:c.resources,video:c.videos,gif:c.gifs,svgAnimation:c.animatedSVGs,model:c.models}).flatMap(([kind,items])=>Object.values(items??{}).map(item=>({kind,name:item.name??kind,embedded:true}))),...fonts];
}
function prepare(asset,input={}){
 assertObject(input,'Solicitud de asset');
 if(input.assetId!==undefined&&typeof input.assetId!=='string')throw Error('ID de asset no válido.');
 const profile=input.profile??'preview',fps=input.fps??60;
 if(!['preview','final'].includes(profile)||!FPS.includes(fps))throw Error('Perfil o FPS no admitido.');
 let scene,duration,aspect,resolution,baseParams;
 if(asset.format==='mgt.json'){
  const legacy=AssetV1.prepare({document:asset.document,profile,fps,...(input.duration!==undefined?{duration:input.duration}:{}),...(input.aspect!==undefined?{aspect:input.aspect}:{}),...(input.resolution!==undefined?{resolution:input.resolution}:{})});
  scene=legacy.scene;duration=legacy.duration;aspect=legacy.aspect;resolution=legacy.resolution;baseParams=legacy.params;
 }else{
  scene=structuredClone(asset.project.snapshot.state);duration=scene.duration;
  if(input.duration!==undefined&&input.duration!==duration)throw Error('La duración de un proyecto completo no se puede cambiar desde el contrato de asset.');
  aspect=input.aspect??scene.aspect;scene=Scene.normalize({...scene,aspect});resolution=input.resolution??(profile==='preview'?480:asset.project.settings?.resolution??1080);
 }
 if(!Export.resolutions.includes(resolution))throw Error('Resolución no admitida.');
 const [width,height]=Export.dimensions(aspect,resolution),frames=Math.max(1,Math.round(duration*fps));
 assertObject(input.overrides??{},'Parámetros por instancia');
 const declared=schema(asset).flatMap(group=>group.parameters),map=new Map(declared.map(p=>[p.id,p]));
 for(const [id,value] of Object.entries(input.overrides??{})){const p=map.get(id);if(!p||!p.editable)throw Error('Parámetro no editable o inexistente: '+id);Composition.value(p,value);}
 const overrides=Object.fromEntries(Object.entries(input.overrides??{}).sort(([a],[b])=>a.localeCompare(b)));
 const hasAudio=asset.format==='mgtproj'&&Boolean(asset.project.snapshot.audio.audio||asset.project.snapshot.effects.length);
 const streams=[{kind:'video',codec:'prores_ks',pixelFormat:'yuva444p12le',alpha:true,colorSpace:'bt709',colorRange:'tv',width,height,fps,frames},...(hasAudio?[{kind:'audio',codec:'aac',sampleRate:48000,channels:2}]:[])];
 const fingerprint=hash(JSON.stringify({assetContract:2,engineVersion,sourceHash:asset.sourceHash,profile,fps,frames,aspect,resolution,overrides}));
 const warnings=[];
 if(asset.format==='mgt.json'&&asset.document.recommended?.duration===undefined&&input.duration===undefined)warnings.push('Sin duración recomendada; se usaron 3 segundos.');
 return {contractVersion:2,engineVersion,sourceFormat:asset.format,sourceVersion:asset.format==='mgt.json'?asset.document.version:asset.project.version,name:asset.format==='mgt.json'?asset.document.name:'Proyecto MGT',recommended:asset.format==='mgt.json'?asset.document.recommended??{}:{duration:asset.project.snapshot.state.duration,aspect:asset.project.snapshot.state.aspect,resolution:asset.project.settings?.resolution??1080},profile,fps,frames,duration,encodedDuration:frames/fps,aspect,resolution,width,height,alpha:true,hasAudio,streams,parameters:schema(asset),overrides,dependencies:dependencies(asset,overrides),fingerprint,warnings,scene,baseParams};
}
function publicContract(c){const {scene,baseParams,...result}=c;return result;}
function renderInput(asset,c){
 if(asset.format==='mgt.json')return {spec:c.scene,composition:asset.document,params:Composition.values(asset.document,{...c.baseParams,...c.overrides}),seed:asset.document.seed??1,layers:null,audio:null};
 const snapshot=structuredClone(asset.project.snapshot);
 for(const lane of snapshot.tracks.overlayLanes)for(const clip of lane.clips){const prefix='clip/'+clip.id+'/';const changes=Object.fromEntries(Object.entries(c.overrides).filter(([key])=>key.startsWith(prefix)).map(([key,value])=>[key.slice(prefix.length),value]));clip.params=Composition.values(clip.document,{...clip.params,...changes});}
 return {spec:c.scene,composition:null,params:null,seed:1,layers:{...snapshot.tracks,flags:snapshot.flags},audio:{main:snapshot.audio,effects:snapshot.effects}};
}
module.exports={capabilities,schema,makeJson,makeProject,prepare,publicContract,renderInput,validateProject};
