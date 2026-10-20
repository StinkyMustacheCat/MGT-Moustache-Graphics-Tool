// SPDX-License-Identifier: GPL-3.0-or-later
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),config=require(path.join(root,'config.json'));
const runtime=path.dirname(path.resolve(root,config.playwright)),{chromium}=require(path.join(runtime,'playwright-core'));
const temp=path.join(root,'test-results','timeline-'+crypto.randomUUID());fs.mkdirSync(temp,{recursive:true});
const instance=crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,16),delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

(async()=>{
 const wav=path.join(temp,'sound.wav');execFileSync(path.join(runtime,'ffmpeg','ffmpeg.exe'),['-v','error','-y','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=1','-c:a','pcm_s16le',wav],{windowsHide:true});
 const child=spawn(process.execPath,[path.join(root,'server.cjs')],{cwd:root,env:{...process.env,MGT_DATA_ROOT:path.join(temp,'data')},windowsHide:true,stdio:'ignore'});let browser,url,info;
 try{
  for(let i=0;i<200;i++){try{const running=JSON.parse(fs.readFileSync(path.join(temp,'data',instance,'running.json')));if(running.pid!==child.pid)throw Error('stale');url=running.url;info=await(await fetch(url+'/api/info')).json();break;}catch{await delay(100);}}
  assert(info,'El servidor no inició');browser=await chromium.launch({executablePath:path.join(runtime,'chromium','chrome.exe'),headless:true});
  const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.type()==='prompt'?dialog.accept('1'):dialog.accept());
  await page.goto(url);await page.waitForFunction(()=>initialized&&ready);if(await page.locator('#welcomeDialog').isVisible())await page.click('#startWelcome');
  await page.evaluate(async()=>{state=Scene.normalize({...state,duration:4});await rebuild();});
  assert.equal(await page.locator('.overlay-sub-lane').count(),1);assert.equal(await page.locator('[data-audio-lane]').count(),1);
  await page.click('#addMedia');assert.equal(await page.locator('#mediaPicker [data-add-media]').count(),6);await page.click('#mediaPicker [data-add-media=mgt]');assert(await page.locator('#mediaPicker [data-add-media=code]').isVisible());assert(await page.locator('#mediaPicker [data-add-media=json]').isVisible());await page.click('#addMedia');
  await page.click('#fitZoom');const fit=await page.evaluate(()=>{const a=$('stageArea').getBoundingClientRect(),b=$('stageBox').getBoundingClientRect();return Math.max(b.width/a.width,b.height/a.height);});assert(fit>.85&&fit<=1,fit);
  await page.click('#addTrack');assert.equal(await page.locator('#trackPicker button').count(),2);await page.click('#trackPicker [data-add-track=visual]');
  assert.equal(await page.locator('.overlay-sub-lane').count(),2);
  const headers=await page.evaluate(()=>[...document.querySelectorAll('.overlay-sub-lane')].map(row=>({edge:row.getBoundingClientRect().left,controls:row.querySelector('.visual-lane-actions').getBoundingClientRect().right})));assert(headers.every(row=>row.controls<=row.edge),JSON.stringify(headers));
  await page.locator('.overlay-sub-lane').first().click({button:'right',position:{x:20,y:18}});assert(await page.locator('#trackContextMenu').isVisible());assert.equal(await page.locator('#trackContextMenu button', {hasText:'Agregar medio › MGT · Desde código'}).count(),1);await page.locator('#trackContextMenu button', {hasText:'Agregar medio › MGT · Desde código'}).click();assert(await page.locator('#overlayCodeDialog').isVisible());await page.click('#cancelOverlayCode');
  const doc={version:3,name:'Gráfico',parameters:[],html:'<div></div>',css:'',render:'',recommended:{duration:1}};
  await page.locator('.overlay-sub-lane').first().click({position:{x:8,y:18}});
  await page.evaluate(d=>MGTTrackUIAddCode({...d,name:'A'},1,0),doc);
  await page.evaluate(d=>MGTTrackUIAddCode({...d,name:'B'},1,90),doc);
  await page.waitForFunction(()=>MGTTrackUI.snapshot().length===2&&!MGTTrackUI.preparing());
  const before=await page.evaluate(()=>MGTTrackUI.snapshot().map(c=>({id:c.id,start:c.start,inFrame:c.inFrame}))),a=page.locator('[data-clip="'+before[0].id+'"]'),b=page.locator('[data-clip="'+before[1].id+'"]');
  await a.click();assert.equal(await page.evaluate(()=>MGTTrackUI.selectedClips().length),1);
  await b.click({modifiers:['Control']});assert.equal(await page.evaluate(()=>MGTTrackUI.selectedClips().length),2);
  const rect=await a.boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+65,rect.y+rect.height/2,{steps:8});await page.mouse.up();
  const after=await page.evaluate(()=>MGTTrackUI.snapshot().map(c=>({id:c.id,start:c.start,inFrame:c.inFrame})));assert(after[0].start>before[0].start);assert.equal(after[1].start-before[1].start,after[0].start-before[0].start);assert.deepEqual(after.map(c=>c.inFrame),before.map(c=>c.inFrame));
  const moved=await a.boundingBox();await page.mouse.click(moved.x+moved.width*.75,moved.y+moved.height/2);const seek=await page.evaluate(()=>currentFrame);assert(seek>=after[0].start&&seek<after[0].start+60,JSON.stringify({seek,after,moved}));
  await page.click('#addTrack');await page.click('#trackPicker [data-add-track=audio]');assert.equal(await page.locator('[data-audio-lane]').count(),2);
  await page.setInputFiles('#audioFile',wav);await page.waitForFunction(()=>MGTEffectUI.snapshot().length===1&&!MGTEffectUI.loading());
  const audioLane=await page.evaluate(()=>MGTEffectUI.snapshot()[0].trackId);assert.notEqual(audioLane,'audio-1');
  await page.locator('[data-audio-lane="'+audioLane+'"] .audio-lane-actions [data-action=muted]').click();assert.equal(await page.evaluate(id=>MGTTrackState.muted(id),audioLane),true);
  await page.locator('[data-audio-lane="'+audioLane+'"] .audio-lane-actions button[title^="Eliminar Audio"]').click();assert.equal(await page.locator('[data-audio-lane]').count(),1);assert.equal(await page.evaluate(()=>MGTEffectUI.snapshot()[0].trackId),'audio-1');
  await page.screenshot({path:path.join(temp,'timeline.png')});
  assert.deepEqual(errors,[]);console.log('Only visual/audio rows, group movement, click-to-seek, extra audio rows and mute passed.');
 }finally{await browser?.close();if(url&&info)await fetch(url+'/api/shutdown',{method:'POST',headers:{Origin:url,'X-Motion-Token':info.token,'Content-Type':'application/json'},body:'{}'}).catch(()=>{});child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
