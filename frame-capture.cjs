// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
// Only a lost renderer is recoverable. Composition errors and timeouts remain errors.
function createCapture({open, cancelled, recovered=()=>{}, limit=2}) {
  let session, recoveries=0;
  async function close() { const old=session; session=null; if(old)await old.close().catch(()=>{}); }
  async function start() { cancelled(); session=await open(); cancelled(); }
  async function capture(frame) {
    if(!session)await start();
    for(;;) {
      cancelled();
      try { return await session.capture(frame); }
      catch(error) {
        cancelled();
        if(!session.lost(error)||recoveries>=limit)throw error;
        await close(); recoveries++; recovered(recoveries);
        await start();
      }
    }
  }
  return {start,capture,close};
}
module.exports={createCapture};
