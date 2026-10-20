// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const config=require(path.join(root,'config.json'));
const {chromium}=require(path.resolve(root,config.playwright));
const temp=path.join(root,'test-results','stability-0985-'+crypto.randomUUID());
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
fs.mkdirSync(path.join(temp,'data'),{recursive:true});
let child,browser,url,info;

(async()=>{
  try{
    const fd=fs.openSync(path.join(temp,'server.log'),'a');
    child=spawn(process.execPath,[path.join(root,'server.cjs')],{cwd:root,env:{...process.env,MGT_DATA_ROOT:path.join(temp,'data')},windowsHide:true,stdio:['ignore',fd,fd]});
    fs.closeSync(fd);
    const instance=crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,16);
    for(let i=0;i<200;i++){
      try{
        const running=JSON.parse(fs.readFileSync(path.join(temp,'data',instance,'running.json'),'utf8'));
        if(running.pid===child.pid){url=running.url;info=await(await fetch(url+'/api/info')).json();break;}
      }catch{}
      await delay(100);
    }
    assert.equal(info?.version,require(path.join(root,'package.json')).version);
    console.log('API informa '+info.version);

    browser=await chromium.launch({executablePath:path.resolve(root,config.chromium),headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url);await page.waitForFunction(()=>initialized&&ready);
    assert((await page.locator('.brand small').textContent()).includes(info.version));
    assert((await page.locator('#settingsDialog section h3').last().textContent()).includes(info.version));
    assert((await page.locator('#welcomeDialog .dialog-intro').textContent()).includes(info.version));
    if(await page.locator('#welcomeDialog').isVisible())await page.click('#startWelcome');
    console.log('Interfaz y API muestran la misma versión');

    const composition={version:3,name:'Estabilidad',parameters:[],html:'<div id="mark">OK</div>',css:'#mark{position:absolute;inset:20%;background:#cc2233;color:#fff;font:40px Arial}',render:'',recommended:{duration:.5}};
    await page.click('#codeTab');await page.locator('#code').fill(JSON.stringify(composition));await page.click('#applyCode');
    await page.waitForFunction(()=>MGTTrackUI.snapshot().length===1&&!MGTTrackUI.preparing());
    const clip=await page.evaluate(()=>({mainPresent,custom,clip:MGTTrackUI.snapshot()[0],inspector:!$('overlayInspector').hidden}));
    assert.equal(clip.mainPresent,false);assert.equal(clip.custom,null);
    assert.equal(clip.clip.document.name,'Estabilidad');assert.equal(clip.clip.frames,30);assert.equal(clip.inspector,true);
    await page.evaluate(()=>{showFrame(0);});
    assert.equal(await page.locator('.overlay-view:not([hidden])').count(),1);
    await page.evaluate(()=>{showFrame(30);});
    assert.equal(await page.locator('.overlay-view:not([hidden])').count(),0);
    console.log('Aplicar código crea un clip independiente con límite exacto de 30 fotogramas');

    await page.evaluate(()=>MGTTrackUI.select(null));
    assert(await page.locator('#projectDuration').isVisible());
    assert(await page.locator('#duration').isHidden());
    await page.locator('#projectDuration').fill('0.5');
    await page.locator('#projectDuration').dispatchEvent('change');
    await page.waitForFunction(()=>ready&&state.duration===.5);
    assert.equal(await page.evaluate(()=>MGTTrackUI.snapshot()[0].frames),30);
    console.log('Ajustes generales cambian la duración sin alterar el clip');

    await page.click('#openExport');await page.selectOption('#quality','quick');await page.click('#beginExport');
    await page.waitForFunction(()=>!document.querySelector('#download').hidden,{},{timeout:120000});
    const href=await page.locator('#download').getAttribute('href');
    const response=await fetch(url+href);assert(response.ok);
    const video=path.join(temp,'estabilidad.mp4');fs.writeFileSync(video,Buffer.from(await response.arrayBuffer()));
    const probe=JSON.parse(execFileSync(path.join(path.dirname(path.resolve(root,config.ffmpeg)),'ffprobe.exe'),['-v','error','-show_streams','-of','json',video],{encoding:'utf8',windowsHide:true}));
    assert.equal(probe.streams.find(stream=>stream.codec_type==='video').nb_frames,'30');
    console.log('Exportación real: MP4 de 30 fotogramas');

    const invalid={scene:{...await page.evaluate(()=>structuredClone(state)),duration:.3},resolution:480,layers:{mainPresent:true,mainDuration:.5,mainStart:0,overlays:[],subtitles:[],mgt:[]}};
    const rejected=await fetch(url+'/api/export',{method:'POST',headers:{Origin:url,'X-Motion-Token':info.token,'Content-Type':'application/json'},body:JSON.stringify(invalid)});
    assert.equal(rejected.status,400);
    assert.match((await rejected.json()).error,/Ubicación de MGT fuera del proyecto/);
    console.log('El servidor rechaza una pista principal que excede el proyecto');
    assert.deepEqual(errors,[]);
  }catch(error){console.error(error);process.exitCode=1;}
  finally{
    if(browser)await browser.close();
    if(url&&info)try{await fetch(url+'/api/shutdown',{method:'POST',headers:{Origin:url,'X-Motion-Token':info.token,'Content-Type':'application/json'},body:'{}'});}catch{}
    if(child&&child.exitCode===null){for(let i=0;i<30&&child.exitCode===null;i++)await delay(100);if(child.exitCode===null)child.kill();}
  }
})();
