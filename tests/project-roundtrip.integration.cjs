// SPDX-License-Identifier: GPL-3.0-or-later
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'config.json')));
const runtime=path.dirname(path.resolve(root,config.playwright));
const {chromium}=require(path.join(runtime,'playwright-core'));
const temp=path.join(root,'test-results','project-'+crypto.randomUUID());
const instance=crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,16);
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
fs.mkdirSync(temp,{recursive:true});
let child,url,info,browser;

async function start(){
 child=spawn(process.execPath,[path.join(root,'server.cjs')],{cwd:root,env:{...process.env,MGT_DATA_ROOT:path.join(temp,'data')},windowsHide:true,stdio:'ignore'});
 for(let attempt=0;attempt<200;attempt++){
  try{const running=JSON.parse(fs.readFileSync(path.join(temp,'data',instance,'running.json')));if(running.pid!==child.pid)throw Error('Sesión anterior');url=running.url;info=await(await fetch(url+'/api/info')).json();return;}
  catch{await delay(100);}
 }
 throw Error('Servidor no inició.');
}
async function stop(){
 if(url&&info)await fetch(url+'/api/shutdown',{method:'POST',headers:{Origin:url,'X-Motion-Token':info.token,'Content-Type':'application/json'},body:'{}'}).catch(()=>{});
 for(let attempt=0;attempt<50&&child?.exitCode===null;attempt++)await delay(100);
 if(child?.exitCode===null)child.kill();
}
async function openPage(errors){
 const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
 await page.goto(url);await page.waitForFunction(()=>initialized&&ready);
 if(await page.locator('#welcomeDialog').isVisible())await page.click('#startWelcome');
 return page;
}

(async()=>{
 const wav=path.join(temp,'tone.wav'),zip=path.join(temp,'saved.mgtproj'),errors=[];
 execFileSync(path.join(runtime,'ffmpeg','ffmpeg.exe'),['-v','error','-y','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=1','-c:a','pcm_s16le',wav],{windowsHide:true});
 browser=await chromium.launch({executablePath:path.join(runtime,'chromium','chrome.exe'),headless:true});
 await start();let page=await openPage(errors);
 await page.evaluate(async()=>{state=Scene.normalize({...state,duration:2});await rebuild();});
 const doc={version:3,name:'Roundtrip',parameters:[],html:'<div id="tile"></div>',css:'#tile{position:absolute;inset:0;background:#f00}',render:'',recommended:{duration:1}};
 await page.evaluate(input=>MGTTrackUIAddCode(input,1,0),doc);
 await page.click('#addTrack');await page.click('#trackPicker [data-add-track=visual]');await page.locator('.overlay-sub-lane').nth(1).click({position:{x:20,y:18}});
 await page.evaluate(input=>MGTTrackUIAddCode({...input,name:'Second'},1,0),doc);
 await page.click('#addTrack');await page.click('#trackPicker [data-add-track=audio]');await page.setInputFiles('#audioFile',wav);
 await page.waitForFunction(()=>MGTEffectUI.snapshot().length===1&&!MGTEffectUI.loading());
 const before=await page.evaluate(()=>({lanes:MGTTrackUI.capture().overlayLanes.map(l=>l.clips.length),audio:MGTEffectUI.snapshot()[0].audio.name,audioTracks:MGTEffectUI.captureTracks(),scene:state}));
 assert.deepEqual(before.lanes,[1,1]);assert.equal(before.audioTracks.length,2);
 const downloadReady=page.waitForEvent('download',{timeout:30000});await page.click('#saveProject');const download=await downloadReady;await download.saveAs(zip);assert(fs.statSync(zip).size>1000);
 await page.close();await stop();await start();page=await openPage(errors);
 await page.setInputFiles('#projectFile',zip);
 await page.waitForFunction(()=>MGTTrackUI.snapshot().length===2&&MGTEffectUI.snapshot().length===1&&!MGTHistory.status().applying,{timeout:45000});
 const after=await page.evaluate(()=>({lanes:MGTTrackUI.capture().overlayLanes.map(l=>l.clips.length),audio:MGTEffectUI.snapshot()[0].audio.name,audioTracks:MGTEffectUI.captureTracks(),scene:state,ready:!MGTTrackUI.preparing()}));
 assert.deepEqual(after.lanes,before.lanes);assert.equal(after.audio,before.audio);assert.deepEqual(after.audioTracks,before.audioTracks);assert.deepEqual(after.scene,before.scene);assert(after.ready);assert.deepEqual(errors,[]);
 console.log('Project ZIP reopens visual and audio lanes, including the empty-lane structure.');
 const archive=require(path.join(root,'project-archive.cjs')),entries=await archive.inspect(zip),project=await archive.readJSON(zip,entries.get('project.json')),broken=path.join(temp,'missing.mgtproj');
 await archive.create(broken,[{name:'project.json',data:JSON.stringify(project)}]);await page.setInputFiles('#projectFile',broken);
 await page.locator('#projectRelinkDialog').waitFor({state:'visible'});assert((await page.locator('#projectRelinkName').innerText()).includes('tone.wav'));
 await page.setInputFiles('#projectRelinkFile',wav);
 await page.waitForFunction(()=>!$('projectRelinkDialog').open&&MGTTrackUI.snapshot().length===2&&MGTEffectUI.snapshot().length===1,{timeout:45000});
 assert.deepEqual(errors,[]);console.log('Missing audio is relinked without losing the two-track timeline.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();await stop();});
