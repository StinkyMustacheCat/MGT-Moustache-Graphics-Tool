// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {root,config,dataDir,instanceId,runtimeFile,version}=require('./runtime.cjs');
const {waitForReady}=require('./startup.cjs');
const log=stage=>{try{fs.appendFileSync(path.join(dataDir,'startup-stages.log'),new Date().toISOString()+' '+version+' '+stage+'\n');}catch{}};
async function running(){
 try{
  const saved=JSON.parse(fs.readFileSync(runtimeFile,'utf8'));
  if(saved.instanceId!==instanceId||!/^http:\/\/127\.0\.0\.1:\d+$/.test(saved.url))return null;
  const r=await fetch(saved.url+'/api/info',{signal:AbortSignal.timeout(1000)});const info=await r.json();
  if(info.instanceId!==instanceId||info.version!==version||info.pid!==saved.pid)return null;
  const page=await fetch(saved.url+'/',{signal:AbortSignal.timeout(3000)});
  if(!page.ok||!(await page.text()).includes('id="scene"'))return null;
  return {...saved,info};
 }catch{return null;}
}
(async()=>{
 log('inicio');
 if(!process.argv.includes('--stop')&&!process.argv.includes('--no-open'))return require('./desktop.cjs').run({running,log});
 let current=await running();
 if(process.argv.includes('--stop')){
  if(!current){console.log('MGT ya está detenido.');return;}
  const r=await fetch(current.url+'/api/stop',{method:'POST',headers:{Origin:current.url,'X-Motion-Token':current.info.token,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});
  if(!r.ok)throw Error((await r.json()).error);console.log('MGT detenido.');return;
 }
 for(const file of [config.chromium,config.ffmpeg,path.join(config.playwright,'package.json')])if(!fs.existsSync(file))throw Error('Falta un componente. Extrae el ZIP completo antes de abrir MGT: '+file);
 if(!current){
  log('iniciando-motor');
  const fd=fs.openSync(path.join(dataDir,'startup.log'),'a');
  const child=spawn(process.execPath,[path.join(root,'server.cjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',fd,fd]});
  fs.closeSync(fd);let error;child.on('error',e=>{error=e;});child.unref();
  current=await waitForReady(running,{check:()=>{if(error)throw error;if(child.exitCode!==null)throw Error('El motor terminó antes de estar listo. Consulta startup.log.');}});
  if(!current)throw Error('No se pudo iniciar MGT. Consulta '+path.join(dataDir,'startup.log'));
 }
 console.log('MGT '+version+' · '+current.url);
 log('motor-e-interfaz-listos');
 if(!process.argv.includes('--no-open')){
  const browser=spawn(config.chromium,['--user-data-dir='+path.join(dataDir,'browser-profile'),'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--app='+current.url],{detached:true,windowsHide:false,stdio:'ignore'});
  await new Promise((resolve,reject)=>{browser.once('spawn',resolve);browser.once('error',reject);});
  log('navegador-iniciado');browser.unref();
 }
})().catch(error=>{log('fallo-de-arranque');console.error(error.message);process.exitCode=1;});

