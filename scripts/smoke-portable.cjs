// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const portable=path.resolve(process.argv[2]||'');
const node=path.join(portable,'runtime','node','node.exe'),app=path.join(portable,'programa');
const version=require(path.join(app,'package.json')).version;
const dataRoot=fs.mkdtempSync(path.join(path.resolve(__dirname,'..','..'),'mgt-smoke-'));
const instance=crypto.createHash('sha256').update(app.toLowerCase()).digest('hex').slice(0,16);
const record=path.join(dataRoot,instance,'running.json');
const child=spawn(node,[path.join(app,'server.cjs')],{cwd:app,env:{...process.env,MGT_DATA_ROOT:dataRoot},windowsHide:true,stdio:['ignore','pipe','pipe']});
let logs='';for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{logs+=chunk.toString();});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{let origin,token;try{
 for(let i=0;i<80;i++){if(child.exitCode!==null)throw Error('El servidor terminó: '+logs);if(fs.existsSync(record)){origin=JSON.parse(fs.readFileSync(record,'utf8')).url;try{const response=await fetch(origin+'/api/info');if(response.ok){const info=await response.json();if(info.version!==version||!info.ready)throw Error('Versión o runtime no listos.');token=info.token;break;}}catch{}}await wait(250);}
 if(!token)throw Error('El servidor no respondió: '+logs);
 for(const route of ['/','/help','/api/subtitles']){const response=await fetch(origin+route);if(!response.ok)throw Error(route+' devolvió '+response.status);if(route==='/'){const html=await response.text();if(!html.includes('id="subtitlePanel"'))throw Error('Falta la interfaz de Subtítulos.');}}
 console.log('Portable '+version+': servidor, interfaz, ayuda y biblioteca correctos.');
}catch(error){console.error(error.message);process.exitCode=1;}finally{if(origin&&token)await fetch(origin+'/api/stop',{method:'POST',headers:{Origin:origin,'X-Motion-Token':token,'Content-Type':'application/json'},body:'{}'}).catch(()=>{});await wait(300);if(child.exitCode===null)child.kill();}})();
