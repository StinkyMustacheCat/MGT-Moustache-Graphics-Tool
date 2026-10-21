// SPDX-License-Identifier: GPL-3.0-or-later
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),runtime=path.dirname(path.resolve(root,JSON.parse(fs.readFileSync(root+'/config.json')).playwright)),{chromium}=require(runtime+'/playwright-core'),temp=path.join(root,'test-results','overlay-ui-'+crypto.randomUUID());
fs.mkdirSync(temp,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const child=spawn(process.execPath,[root+'/server.cjs'],{cwd:root,env:{...process.env,MGT_DATA_ROOT:temp+'/data'},windowsHide:true,stdio:'ignore'});let browser,url,info;
 try{
  const instance=crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,16);
  for(let i=0;i<100;i++){try{const running=JSON.parse(fs.readFileSync(temp+'/data/'+instance+'/running.json'));url=running.url;info=await(await fetch(url+'/api/info')).json();break;}catch{await delay(100);}}
  assert(info,'El servidor no arrancó');browser=await chromium.launch({executablePath:runtime+'/chromium/chrome.exe',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.type()==='prompt'?dialog.accept('1'):dialog.accept());
  await page.goto(url);await page.waitForFunction(()=>initialized&&ready);if(await page.locator('#welcomeDialog').isVisible())await page.click('#startWelcome');await page.evaluate(async()=>{state=Scene.normalize({...state,duration:3});await rebuild();});
  assert.equal(await page.locator('.track-label[data-track=mgt]').isVisible(),false);
  assert.equal(await page.locator('.track-label[data-track=video]').isVisible(),false);
  await page.click('#addTrack');await page.click('#trackPicker [data-add-track=visual]');assert.equal(await page.locator('.overlay-sub-lane').count(),2);
  await page.locator('.overlay-sub-lane').first().click({position:{x:20,y:18}});
  const lower={version:3,name:'Inferior',parameters:[],html:'<div id="tile"></div>',css:'#tile{position:absolute;inset:0;background:#ff0000}',render:'ctx.root.dataset.time=String(ctx.time);ctx.root.dataset.progress=String(ctx.progress);',recommended:{duration:2}};
  const upper={...lower,name:'Superior',css:'#tile{position:absolute;inset:0;background:#00ff00}'};
  await page.evaluate(doc=>{showFrame(0);return MGTTrackUIAddCode(doc,2,0);},lower);
  await page.locator('.overlay-sub-lane').nth(1).click({position:{x:20,y:18}});
  await page.evaluate(doc=>{showFrame(0);return MGTTrackUIAddCode(doc,2,0);},upper);
  await page.waitForFunction(()=>!MGTTrackUI.preparing()&&MGTTrackUI.snapshot().length===2);
  const state=await page.evaluate(()=>({lanes:MGTTrackUI.capture().overlayLanes.map(l=>({id:l.id,count:l.clips.length})),exported:MGTTrackUI.exportOverlayLanes().map(l=>l.clips.length),visible:[...document.querySelectorAll('.overlay-view:not([hidden])')].length}));
  assert.deepEqual(state.lanes.map(l=>l.count),[1,1]);assert.equal(state.exported.reduce((a,b)=>a+b,0),2);assert.equal(state.visible,2);assert.deepEqual(errors,[]);
  const lowerId=await page.evaluate(()=>MGTTrackUI.capture().overlayLanes[0].clips[0].id);
  await page.locator('[data-clip="'+lowerId+'"]').click();
  await page.locator('#overlaySourceDuration').fill('4');await page.locator('#overlaySourceDuration').press('Tab');
  assert.deepEqual(await page.evaluate(id=>{const c=MGTTrackUI.snapshot().find(x=>x.id===id);return [c.frames,c.sourceFrames,c.authoredFrames];},lowerId),[120,240,120]);
  await page.evaluate(()=>showFrame(60));
  await page.waitForFunction(()=>{const v=document.querySelector('iframe[title="MGT · Inferior"]');return v&&!v.hidden;});
  await page.waitForFunction(()=>{const c=MGTTrackUI.snapshot().find(x=>x.document.name==='Inferior');return MGTOverlayLanes.sourceFrame(c,60)===30;});
  const time=Number(await page.frameLocator('iframe[title="MGT · Inferior"]').locator('#root').getAttribute('data-time'));
  const progress=Number(await page.frameLocator('iframe[title="MGT · Inferior"]').locator('#root').getAttribute('data-progress'));
  assert.equal(time,.5);assert(progress>.24&&progress<.26);
  await page.locator('#overlaySourceDuration').fill('2');await page.locator('#overlaySourceDuration').press('Tab');
  const clip=page.locator('[data-clip="'+lowerId+'"]');let bounds=await clip.boundingBox(),target=await page.locator('.overlay-sub-lane').nth(1).boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2,target.y+target.height/2,{steps:8});await page.mouse.up();
  assert.deepEqual(await page.evaluate(()=>MGTTrackUI.capture().overlayLanes.map(l=>l.clips.length)),[1,1]);
  await page.evaluate(async()=>{state=Scene.normalize({...state,duration:4});await rebuild();});
  bounds=await clip.boundingBox();target=await page.locator('.overlay-sub-lane').nth(1).boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2,target.y+target.height/2,{steps:8});await page.mouse.up();
  assert.deepEqual(await page.evaluate(()=>MGTTrackUI.capture().overlayLanes.map(l=>l.clips.length)),[0,2]);assert.equal(await page.evaluate(id=>MGTTrackUI.snapshot().find(c=>c.id===id).start,lowerId),120);
  bounds=await clip.boundingBox();await page.mouse.move(bounds.x+3,bounds.y+bounds.height/2);await page.mouse.down();await page.mouse.move(bounds.x+40,bounds.y+bounds.height/2,{steps:8});await page.mouse.up();
  const trimmed=await page.evaluate(id=>MGTTrackUI.capture().overlayLanes[1].clips.find(c=>c.id===id),lowerId);assert(trimmed.inFrame>0);assert.equal(trimmed.sourceFrames,120);
  await page.evaluate(async()=>{state=Scene.normalize({...state,duration:3});await rebuild();});
  assert((await page.evaluate(id=>MGTTrackUI.capture().overlayLanes[1].clips.find(c=>c.id===id).frames,lowerId))<=60);
  await page.locator('.overlay-sub-lane').nth(1).click({button:'right',position:{x:20,y:18}});await page.locator('#trackContextMenu button',{hasText:'Eliminar pista'}).click();assert.deepEqual(await page.evaluate(()=>MGTTrackUI.capture().overlayLanes.map(l=>l.clips.length)),[2]);
  assert.deepEqual(errors,[]);console.log('Visual lanes reject overlap, snap on cross-lane moves, trim without speed changes and move clips on lane deletion.');
 }finally{if(browser)await browser.close();if(url&&info)await fetch(url+'/api/shutdown',{method:'POST',headers:{Origin:url,'X-Motion-Token':info.token,'Content-Type':'application/json'},body:'{}'}).catch(()=>{});child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
