// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {root,config,dataDir,instanceId,version}=require('./runtime.cjs');
const {waitForReady}=require('./startup.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const lockFile=path.join(dataDir,'desktop.lock'),recordFile=path.join(dataDir,'desktop.json'),focusFile=path.join(dataDir,'desktop-focus.json');
const alive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};
function claim(){
 const identity={pid:process.pid,id:crypto.randomUUID(),instanceId,version};
 for(let attempt=0;attempt<2;attempt++){
  try{fs.writeFileSync(lockFile,JSON.stringify(identity),{flag:'wx'});return identity;}
  catch(error){if(error.code!=='EEXIST')throw error;
   const owner=JSON.parse(fs.readFileSync(lockFile,'utf8'));
   if(alive(owner.pid)){fs.writeFileSync(focusFile,JSON.stringify({id:owner.id}));return null;}
   fs.rmSync(lockFile,{force:true});
  }
 }
 throw Error('No se pudo abrir la sesión de MGT.');
}
async function run({running,log}){
 const identity=claim();if(!identity){log('ventana-existente-solicitada');return;}
 let backend,chrome,connection,iconHelper,current,page,closing=false,record;
 async function post(route){const response=await fetch(current.url+route,{method:'POST',headers:{Origin:current.url,'X-Motion-Token':current.info.token,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(25000)});await response.arrayBuffer();return response;}
 const stop=()=>{closing=true;};process.once('SIGINT',stop);process.once('SIGTERM',stop);
 try{
  for(const file of [config.chromium,config.ffmpeg,path.join(config.playwright,'package.json')])if(!fs.existsSync(file))throw Error('Falta un componente. Extrae el ZIP completo: '+file);
  current=await running();
  if(!current){
   log('iniciando-motor');const fd=fs.openSync(path.join(dataDir,'startup.log'),'a');
   backend=spawn(process.execPath,[path.join(root,'server.cjs')],{cwd:root,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
   let spawnError;backend.once('error',e=>{spawnError=e;});
   current=await waitForReady(running,{check:()=>{if(spawnError)throw spawnError;if(backend.exitCode!==null)throw Error('El motor terminó durante el inicio. Consulta startup.log.');}});
   if(!current)throw Error('El motor no respondió. Consulta startup.log.');
  }
  if(closing)return;
  const profile=path.join(dataDir,'browser-profile'),portFile=path.join(profile,'DevToolsActivePort');fs.mkdirSync(profile,{recursive:true});fs.rmSync(portFile,{force:true});
  const fd=fs.openSync(path.join(dataDir,'desktop-browser.log'),'a');
  chrome=spawn(config.chromium,['--user-data-dir='+profile,'--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--app='+current.url],{windowsHide:false,stdio:['ignore',fd,fd]});fs.closeSync(fd);
  let chromeError;chrome.once('error',e=>{chromeError=e;});chrome.once('exit',stop);
  const endpoint=await waitForReady(async()=>{try{const lines=fs.readFileSync(portFile,'utf8').trim().split(/\r?\n/);if(!/^\d+$/.test(lines[0]))return null;const url='http://127.0.0.1:'+lines[0];const response=await fetch(url+'/json/version',{signal:AbortSignal.timeout(1000)});const debug=await response.json();return debug.webSocketDebuggerUrl?url:null;}catch{return null;}},{timeoutMs:30000,check:()=>{if(chromeError)throw chromeError;if(chrome.exitCode!==null)throw Error('La ventana terminó antes de estar lista.');}});
  if(!endpoint)throw Error('No se pudo conectar con la ventana. Consulta desktop-browser.log.');
  connection=await require(config.playwright).chromium.connectOverCDP(endpoint);
  const context=connection.contexts()[0];
  // Keep native dialogs under user control, including beforeunload on the title-bar X.
  const dialogs=p=>p.on('dialog',()=>{});context.pages().forEach(dialogs);context.on('page',dialogs);
  page=await waitForReady(async()=>context.pages().find(p=>p.url().startsWith(current.url))||null,{timeoutMs:15000});
  if(!page)throw Error('No se encontró la ventana de MGT.');
  page.once('close',stop);connection.once('disconnected',stop);
  // Verify the actual page, rather than only receiving the HTML from the server.
  for(let attempt=0;attempt<2;attempt++){
   try{await page.waitForFunction(()=>typeof initialized!=='undefined'&&initialized&&ready,{},{timeout:45000});break;}
   catch(error){if(closing||attempt===1)throw Error('La interfaz no terminó de iniciar. Consulta startup-stages.log.');log('reintentando-vista-inicial');await page.reload();}
  }
  log('ventana-y-vista-listas');
  record={...identity,serverPid:current.pid,chromePid:chrome.pid,url:current.url,debugEndpoint:endpoint,ready:true};fs.writeFileSync(recordFile,JSON.stringify(record));
  const executable=path.join(path.basename(root)==='programa'?path.dirname(root):root,'MGT.exe');if(fs.existsSync(executable)){const iconLog=fs.openSync(path.join(dataDir,'window-icon.log'),'a');iconHelper=spawn(executable,['--window-icon',String(chrome.pid),path.join(root,'public','icon.ico')],{windowsHide:true,stdio:['ignore',iconLog,iconLog]});fs.closeSync(iconLog);iconHelper.on('error',()=>log('icono-de-ventana-no-disponible'));}
  while(!closing){
   try{const requested=JSON.parse(fs.readFileSync(focusFile,'utf8'));if(requested.id===identity.id){fs.rmSync(focusFile,{force:true});await page.bringToFront();log('ventana-existente-en-primer-plano');}}catch{}
   if((backend&&backend.exitCode!==null)||!alive(current.pid))closing=true;
   await delay(250);
  }
 }finally{
  log('cerrando-sesion-propia');
  if(current)try{const response=await post('/api/shutdown');log(response.ok?'motor-detenido':'fallo-cierre-motor-'+response.status);}catch{log('motor-no-disponible-al-cerrar');}
  if(connection)await connection.close().catch(()=>{});
  if(chrome&&chrome.exitCode===null){chrome.kill();await delay(200);}
  if(iconHelper&&iconHelper.exitCode===null)iconHelper.kill();
  if(backend&&backend.exitCode===null){await delay(500);if(backend.exitCode===null)backend.kill();}
  for(const file of [recordFile,lockFile,focusFile])try{if(JSON.parse(fs.readFileSync(file,'utf8')).id===identity.id)fs.rmSync(file,{force:true});}catch{}
  process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
 }
}
module.exports={run,claim};
