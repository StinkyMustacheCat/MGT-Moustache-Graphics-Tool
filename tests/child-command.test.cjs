// SPDX-License-Identifier: GPL-3.0-or-later
const {test}=require('node:test'),assert=require('node:assert/strict'),{runFile}=require('../child-command.cjs');
test('Command output resolves after successful process close',async()=>{const out=await runFile(process.execPath,['-e','console.log("complete")'],{windowsHide:true,timeout:2000});assert.equal(out.trim(),'complete');});
test('Aborted command is no longer alive when rejection permits temporary-file cleanup',async()=>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),700);let failed;
 try{await runFile(process.execPath,['-e','console.log(process.pid);setTimeout(()=>{},30000)'],{windowsHide:true,signal:controller.signal,timeout:3000});}catch(error){failed=error;}finally{clearTimeout(timer);}
 assert.equal(failed?.code,'ABORT_ERR');const pid=Number(failed.stdout.trim());assert(Number.isInteger(pid)&&pid>0);assert.throws(()=>process.kill(pid,0));
});
