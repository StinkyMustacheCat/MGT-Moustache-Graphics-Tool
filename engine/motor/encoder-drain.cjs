// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
function waitForDrain(stream) {
  return new Promise((resolve,reject)=>{
    function cleanup(){stream.removeListener('drain',drained);stream.removeListener('error',failed);stream.removeListener('close',closed);}
    function drained(){cleanup();resolve();}
    function failed(error){cleanup();reject(error);}
    function closed(){failed(new Error('El compresor cerró la entrada de fotogramas.'));}
    if(stream.destroyed||!stream.writable)return closed();
    stream.once('drain',drained);stream.once('error',failed);stream.once('close',closed);
  });
}
module.exports={waitForDrain};
