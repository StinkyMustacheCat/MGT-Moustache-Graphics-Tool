// SPDX-License-Identifier: GPL-3.0-or-later
(function(root){
 'use strict';
 function validate(input,parameters){
  const fail=message=>{throw Error('Escena 3D: '+message);};
  const object=(v,keys,label)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))fail(label+' no válido o contiene campos desconocidos.');};
  const reference=(v,type,min,max,label)=>{
   if(v&&typeof v==='object'){object(v,['param'],label);const p=parameters.find(p=>p.id===v.param);if(!p||p.type!==type)fail(label+' necesita un parámetro '+type+' declarado.');if(type==='number'&&(p.min<min||p.max>max))fail(label+' declara límites fuera de '+min+'…'+max+'.');return {param:p.id};}
   if(type==='model'&&(typeof v!=='string'||v!==''&&!/^[A-Za-z][\w-]{0,79}$/.test(v)))fail(label+' no válido.');if(type==='number'&&(!Number.isFinite(v)||v<min||v>max)||type==='text'&&(typeof v!=='string'||v.length>1000)||type==='font'&&(typeof v!=='string'||!v.trim()||v.length>160)||type==='boolean'&&typeof v!=='boolean'||type==='color'&&(typeof v!=='string'||!/^#[a-f0-9]{6}$/i.test(v)))fail(label+' no válido.');
   // Translucency flattens 3D groups. This first contract uses opaque surfaces.
   if(type==='color'&&v&&typeof v==='object')fail(label+' no válido.');return v;
  };
  const n=(v,d,min,max,label)=>reference(v??d,'number',min,max,label);
  const vector=(v,d,min,max,label)=>{v??={};object(v,['x','y','z'],label);return Object.fromEntries(['x','y','z'].map(k=>[k,n(v[k],d,min,max,label+' '+k)]));};
  object(input,['version','camera','objects','lighting','animation'],'scene3d');if(input.version!==1)fail('se requiere scene3d.version:1.');
  const camera=input.camera??{};object(camera,['x','y','distance','yaw','pitch','roll','fov'],'cámara');
  const out={version:1,camera:{x:n(camera.x,0,-5000,5000,'Cámara X'),y:n(camera.y,0,-5000,5000,'Cámara Y'),distance:n(camera.distance,1600,100,10000,'Distancia'),yaw:n(camera.yaw,0,-180,180,'Giro cámara'),pitch:n(camera.pitch,0,-89,89,'Inclinación cámara'),roll:n(camera.roll,0,-180,180,'Rotación cámara'),fov:n(camera.fov,45,15,100,'Campo de visión')},objects:[]};
  if(!Array.isArray(input.objects)||!input.objects.length||input.objects.length>32)fail('declara entre 1 y 32 objetos.');const ids=new Set();
  for(const o of input.objects){
   object(o,['id','type','position','rotation','scale','width','height','depth','color','visible','text','font','fontSize','resource','animation','extrusion'],'objeto');
   if(typeof o.id!=='string'||! /^[a-zA-Z][\w-]{0,39}$/.test(o.id)||ids.has(o.id))fail('identificador duplicado o no válido.');ids.add(o.id);
   if(!['box','plane','text','model'].includes(o.type))fail('tipo de objeto no admitido.');
   const item={id:o.id,type:o.type,position:vector(o.position,0,-5000,5000,'Posición'),rotation:vector(o.rotation,0,-3600,3600,'Rotación'),scale:vector(o.scale,1,.05,10,'Escala'),width:n(o.width,300,1,3000,'Anchura'),height:n(o.height,300,1,3000,'Altura'),color:reference(o.color??'#f4f4f5','color',0,0,'Color'),visible:reference(o.visible??true,'boolean',0,0,'Mostrar objeto')};
   if(o.type==='model'){item.resource=reference(o.resource??'','model',0,0,'Recurso GLB');}else if(o.resource!==undefined)fail('resource requiere type:model.');if(o.type==='box')item.depth=n(o.depth,300,1,3000,'Profundidad');else if(o.depth!==undefined)fail('depth solo se admite para box.');
   if(o.type==='text'){item.text=reference(o.text??'Texto 3D','text',0,0,'Texto');item.font=reference(o.font??'Arial','font',0,0,'Fuente');item.fontSize=n(o.fontSize,100,12,400,'Tamaño de fuente');}
   else if(['text','font','fontSize'].some(k=>o[k]!==undefined))fail('campos de texto requieren type:text.');if(o.extrusion!==undefined){if(o.type!=='text')fail('extrusion requiere texto.');if(o.font!==undefined&&o.font!=='Helvetiker')fail('texto extruido usa la fuente incluida Helvetiker.');item.font='Helvetiker';item.extrusion=n(o.extrusion,20,1,200,'Extrusión');if(typeof item.text==='string'&&item.text.length>120)fail('texto extruido: máximo 120 caracteres.');if(typeof item.text==='object'&&parameters.find(p=>p.id===item.text.param).default.length>120)fail('texto extruido: máximo 120 caracteres.');}
   if(o.animation!==undefined){if(o.type!=='model')fail('animation requiere modelo GLB.');object(o.animation,['clip','speed','start','loop','enabled'],'animación GLB');item.animation={clip:n(o.animation.clip,0,0,31,'Animación GLB'),speed:n(o.animation.speed,1,0,4,'Velocidad GLB'),start:n(o.animation.start,0,0,3600,'Inicio GLB'),loop:reference(o.animation.loop??true,'boolean',0,0,'Repetir GLB'),enabled:reference(o.animation.enabled??true,'boolean',0,0,'Animar GLB')};}
   out.objects.push(item);
  }
  // Color parameters must stay opaque too (their defaults are the contract's initial values).
  if(out.lighting&&typeof out.lighting.color==='object'&&parameters.find(p=>p.id===out.lighting.color.param).default.length!==7)fail('la luz debe usar color opaco.');for(const o of out.objects)if(typeof o.color==='object'&&parameters.find(p=>p.id===o.color.param).default.length!==7)fail('el color 3D debe ser opaco.');
  if(input.lighting!==undefined){const l=input.lighting;object(l,['ambient','key','environment','color','x','y','z'],'iluminación');out.lighting={ambient:n(l.ambient,2,0,10,'Luz ambiente'),key:n(l.key,3,0,10,'Luz principal'),environment:n(l.environment,1,0,5,'Entorno'),color:reference(l.color??'#ffffff','color',0,0,'Color de luz'),x:n(l.x,800,-5000,5000,'Luz X'),y:n(l.y,-1400,-5000,5000,'Luz Y'),z:n(l.z,2000,-5000,5000,'Luz Z')};if(typeof out.lighting.color==='object'&&parameters.find(p=>p.id===out.lighting.color.param).default.length!==7)fail('la luz debe usar color opaco.');}
  if(input.animation!==undefined){if(!Array.isArray(input.animation)||input.animation.length>64)fail('máximo 64 canales animados.');const used=new Set();out.animation=input.animation.map(a=>{object(a,['target','property','from','to','start','duration','loop','smooth','enabled'],'canal animado');const target=a.target==='camera'?out.camera:out.objects.find(o=>o.id===a.target);if(!target)fail('destino animado inexistente.');const allowed=a.target==='camera'?['x','y','distance','yaw','pitch','roll','fov']:['position.x','position.y','position.z','rotation.x','rotation.y','rotation.z','scale.x','scale.y','scale.z'];if(!allowed.includes(a.property))fail('propiedad animada no admitida.');const key=a.target+':'+a.property;if(used.has(key))fail('canal animado duplicado.');used.add(key);let min=-5000,max=5000;if(a.property.startsWith('rotation')){min=-3600;max=3600;}if(a.property.startsWith('scale')){min=.05;max=10;}if(a.target==='camera'){const limits={distance:[100,10000],yaw:[-180,180],pitch:[-89,89],roll:[-180,180],fov:[15,100]};[min,max]=limits[a.property]??[min,max];}return {target:a.target,property:a.property,from:n(a.from,0,min,max,'Desde'),to:n(a.to,0,min,max,'Hasta'),start:n(a.start,0,0,3600,'Inicio'),duration:n(a.duration,2,.016667,3600,'Duración'),loop:reference(a.loop??false,'boolean',0,0,'Repetir'),smooth:reference(a.smooth??true,'boolean',0,0,'Suavizar'),enabled:reference(a.enabled??true,'boolean',0,0,'Animar')};});}
  if(out.objects.filter(o=>o.type==='model').length>2)fail('hasta 2 objetos GLB por composición.');return out;
 }
 // Embedded verbatim in both preview and export documents; no GPU/remote dependency.
 function mount(root,scene,width,height){
  const element=()=>document.createElement('div'),viewport=element(),world=element();
  Object.assign(viewport.style,{position:'absolute',inset:'0',pointerEvents:'none',perspectiveOrigin:'50% 50%'});
  Object.assign(world.style,{position:'absolute',left:'50%',top:'50%',width:'0',height:'0',transformStyle:'preserve-3d'});
  viewport.dataset.mgtThree='viewport';viewport.append(world);root.prepend(viewport);
  const nodes=scene.objects.map(o=>{const node=element();node.dataset.mgtObject=o.id;Object.assign(node.style,{position:'absolute',width:'0',height:'0',transformStyle:'preserve-3d'});world.append(node);const faces=Array.from({length:o.type==='box'?6:1},()=>{const face=element();Object.assign(face.style,{position:'absolute',backfaceVisibility:'hidden',transformStyle:'preserve-3d',boxSizing:'border-box'});node.append(face);return face;});return {o,node,faces};});
  const resolve=(v,params)=>v&&typeof v==='object'?params[v.param]:v;
  return function draw(params){
   const v=x=>resolve(x,params),unit=height/1000,c=scene.camera,focal=height/(2*Math.tan(v(c.fov)*Math.PI/360));
   viewport.style.perspective=focal+'px';
   world.style.transform='translateZ('+focal+'px) rotateZ('+(-v(c.roll))+'deg) rotateX('+(-v(c.pitch))+'deg) rotateY('+(-v(c.yaw))+'deg) translate3d('+(-v(c.x)*unit)+'px,'+(-v(c.y)*unit)+'px,'+(-v(c.distance)*unit)+'px)';
   for(const {o,node,faces} of nodes){
    const vec=p=>['x','y','z'].map(k=>v(p[k])),p=vec(o.position),r=vec(o.rotation),s=vec(o.scale),w=v(o.width)*unit,h=v(o.height)*unit,d=v(o.depth??0)*unit,color=v(o.color);
    if(typeof color!=='string'||!/^#[a-f0-9]{6}$/i.test(color))throw Error('El color 3D debe ser opaco.');
    node.style.display=v(o.visible)?'block':'none';node.style.transform='translate3d('+p.map(x=>x*unit+'px').join(',')+') rotateZ('+r[2]+'deg) rotateY('+r[1]+'deg) rotateX('+r[0]+'deg) scale3d('+s.join(',')+')';
    const shapes=o.type==='box'?[[w,h,'translateZ('+d/2+'px)'],[w,h,'rotateY(180deg) translateZ('+d/2+'px)'],[d,h,'rotateY(90deg) translateZ('+w/2+'px)'],[d,h,'rotateY(-90deg) translateZ('+w/2+'px)'],[w,d,'rotateX(90deg) translateZ('+h/2+'px)'],[w,d,'rotateX(-90deg) translateZ('+h/2+'px)']]:[[w,h,'']];
    faces.forEach((face,i)=>{const [fw,fh,t]=shapes[i];Object.assign(face.style,{width:fw+'px',height:fh+'px',left:-fw/2+'px',top:-fh/2+'px',transform:t,background:o.type==='text'?'transparent':color});
     if(o.type==='box'){const rgb=[1,3,5].map(start=>parseInt(color.slice(start,start+2),16)),shade=[1,.65,.82,.72,.92,.6][i];face.style.background='rgb('+rgb.map(x=>Math.round(x*shade)).join(',')+')';}
     if(o.type==='text'){face.textContent=v(o.text);Object.assign(face.style,{display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:JSON.stringify(v(o.font)),fontSize:v(o.fontSize)*unit+'px',lineHeight:'1.15',color});}
    });
   }
  };
 }
 function animate(scene,params,time){const out=JSON.parse(JSON.stringify(scene)),v=x=>x&&typeof x==='object'?params[x.param]:x;for(const a of out.animation??[]){if(!v(a.enabled))continue;const elapsed=Math.max(0,time-v(a.start)),duration=v(a.duration);let t=Math.min(1,elapsed/duration);if(v(a.loop)&&time>=v(a.start))t=(elapsed%duration)/duration;if(v(a.smooth))t=t*t*(3-2*t);const target=a.target==='camera'?out.camera:out.objects.find(o=>o.id===a.target),parts=a.property.split('.');let owner=target;for(const p of parts.slice(0,-1))owner=owner[p];owner[parts.at(-1)]=v(a.from)+(v(a.to)-v(a.from))*t;}return out;}
 const api={validate,mount,animate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MGTThree=api;
})(typeof window!=='undefined'?window:globalThis);
