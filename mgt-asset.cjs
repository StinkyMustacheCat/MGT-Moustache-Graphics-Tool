// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const crypto=require('node:crypto');
const Composition=require('./public/composition.js');
const Scene=require('./public/scene.js');
const Export=require('./public/export-settings.js');
const FPS=Object.freeze([15,24,30,60]);
const CONTRACT_VERSION=1;
function prepare(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Solicitud de asset MGT no válida.');
 const document=Composition.parse(input.document),profile=input.profile??'preview';
 if(input.params!==undefined||input.seed!==undefined)throw Error('El contrato de asset v1 usa los parámetros y la semilla del JSON sin cambios.');
 if(/\b(?:Date|performance|setTimeout|setInterval|requestAnimationFrame|fetch|XMLHttpRequest|WebSocket)\b|\bMath\s*\.\s*random\s*\(/.test(document.render))throw Error('El render del asset depende de reloj, red o aleatoriedad externa. Usa ctx.time y ctx.random.');
 if(/@import\b|url\(\s*['"]?\s*(?:https?:|\/\/)/i.test(document.css)||/\b(?:src|href)\s*=\s*['"]\s*(?:https?:|\/\/)/i.test(document.html))throw Error('El asset contiene recursos externos; incrústalos en el JSON MGT.');
 if(!['preview','final'].includes(profile))throw Error('Perfil de render no válido.');
 const fps=input.fps??60;if(!FPS.includes(fps))throw Error('FPS no admitido: usa 15, 24, 30 o 60.');
 const duration=input.duration??document.recommended?.duration??3;
 if(!Number.isFinite(duration)||duration<.1||duration>3600)throw Error('Duración de asset no válida.');
 const frames=Math.max(1,Math.round(duration*fps));
 const aspect=input.aspect??document.recommended?.aspect??'horizontal';
 if(!Object.hasOwn(Scene.sizes,aspect))throw Error('Relación de aspecto no válida.');
 const resolution=input.resolution??(profile==='preview'?480:document.recommended?.resolution??1080);
 const [width,height]=Export.dimensions(aspect,resolution);
 const seed=Composition.seedValue(document.seed??1);
 const params=Composition.values(document);
 const fingerprint=crypto.createHash('sha256').update(JSON.stringify({version:CONTRACT_VERSION,document,profile,fps,frames,aspect,resolution,seed,params})).digest('hex');
 const scene=Scene.normalize({...Scene.defaults,duration,aspect,background:'#000000'});
 return {version:CONTRACT_VERSION,document,params,seed,scene,profile,fps,frames,duration,encodedDuration:frames/fps,aspect,resolution,width,height,alpha:true,container:'mov',codec:'prores_ks',pixelFormat:'yuva444p12le',fingerprint,warnings:document.recommended?.duration===undefined?['El JSON no declara duración recomendada; se usaron 3 segundos salvo que la solicitud indique otra.']:[]};
}
function publicContract(value){const {version,profile,fps,frames,duration,encodedDuration,aspect,resolution,width,height,alpha,container,codec,pixelFormat,fingerprint,warnings}=value;return {contractVersion:version,profile,fps,frames,duration,encodedDuration,aspect,resolution,width,height,alpha,container,codec,pixelFormat,colorSpace:'bt709',colorRange:'tv',fingerprint,warnings};}
module.exports={FPS,CONTRACT_VERSION,prepare,publicContract};
