// SPDX-License-Identifier: GPL-3.0-or-later
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'..','config.json'),'utf8'));
const playwright=path.resolve(path.join(__dirname,'..'),config.playwright);
const runtime=path.dirname(playwright);
const {chromium}=require(playwright);

const root=path.resolve(__dirname,'..');
const temp=path.join(root,'test-results','prompts-'+crypto.randomUUID());
fs.mkdirSync(path.join(temp,'data'),{recursive:true});
const node=process.execPath;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

(async()=>{
  let child,browser,context;
  try{
    const log=fs.openSync(path.join(temp,'server.log'),'a');
    child=spawn(node,[path.join(root,'server.cjs')],{cwd:root,env:{...process.env,MGT_DATA_ROOT:path.join(temp,'data')},windowsHide:true,stdio:['ignore',log,log]});
    fs.closeSync(log);
    const instance=crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,16);
    let info;
    for(let i=0;i<200;i++){
      try{info=JSON.parse(fs.readFileSync(path.join(temp,'data',instance,'running.json'),'utf8'));if(info.pid===child.pid)break;}catch{}
      await delay(100);
    }
    assert.ok(info?.url,'El servidor local no inició.');
    browser=await chromium.launch({executablePath:path.resolve(path.join(__dirname,'..'),config.chromium),headless:true});
    context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
    const page=await context.newPage();
    await page.goto(info.url);
    await page.waitForFunction(()=>initialized===true);
    if(await page.locator('#welcomeDialog').isVisible())await page.click('#startWelcome');
    await page.click('#codeTab');
    await page.click('#copyPrompt');
    assert.equal(await page.locator('#promptMenu').getAttribute('hidden'),null,'El menú debe abrirse.');
    assert.equal(await page.locator('#promptMenu [data-prompt]').count(),5);
    await page.click('#promptMenu [data-prompt="media"]');
    await page.waitForFunction(()=>/Vídeo y recursos animados copiado/.test(document.querySelector('#promptStatus')?.textContent||''));
    assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/^MGT 1\.0\.0 · PROMPT ESPECIALIZADO · VÍDEO/);
    assert.match(await page.locator('#promptStatus').textContent(),/Vídeo y recursos animados copiado/);
    await page.click('#copyPrompt');
    await page.keyboard.press('Escape');
    assert.notEqual(await page.locator('#promptMenu').getAttribute('hidden'),null,'Escape debe cerrar el menú.');
    console.log('Prompt menu integration: 5 actions, copy and Escape OK');
  }finally{
    await browser?.close().catch(()=>{});
    if(child&&!child.killed)child.kill();
  }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
