// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),destination=path.resolve(process.argv[2]||path.join(root,'examples','asset-v2','proyecto.mgtproj'));
(async()=>{if(fs.existsSync(destination))throw Error('El fixture ya existe; no se sobrescribe.');const temporary=path.join(path.dirname(destination),'fixture-'+crypto.randomUUID()+'.wav');try{
 const wav=Buffer.concat([require('../audio-store.cjs').pcmHeader(96000),Buffer.alloc(96000)]);fs.writeFileSync(temporary,wav,{flag:'wx'});
 const document=require('../examples/asset-v2/composition.mgt.json'),scene={...require('../public/scene.js').defaults,duration:.5},project={format:'mgt-project',version:1,settings:{resolution:720,fps:24,quality:'auto',bitrate:16},resources:[{kind:'audio',id:'sample-audio',name:'Silencio de ejemplo',entry:'audio/1.wav'}],snapshot:{state:scene,tracks:{overlayLanes:[{id:'overlay-1',name:'Visual 1',clips:[{id:'sample-card',kind:'mgt',document,start:0,frames:30,sourceFrames:30,inFrame:0}]}]},effects:[],audio:{audio:{id:'sample-audio',name:'Silencio de ejemplo',duration:.5},volume:1,muted:false},flags:{}}};
 await require('../project-archive.cjs').create(destination,[{name:'project.json',data:JSON.stringify(project)},{name:'audio/1.wav',file:temporary}]);console.log(destination);
}finally{await fs.promises.rm(temporary,{force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
