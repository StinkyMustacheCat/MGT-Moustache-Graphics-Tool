// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
async function waitForReady(probe,{timeoutMs=60000,intervalMs=250,check=()=>{},now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 const deadline=now()+timeoutMs;
 while(now()<deadline){check();const current=await probe();if(current)return current;await sleep(intervalMs);}return null;
}
module.exports={waitForReady};
