// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const {execFile}=require('node:child_process');
// Abort can call execFile's callback before the process releases its files.
// Resolve/reject only after close so callers may safely retire temporary media.
function runFile(file,args,options){return new Promise((resolve,reject)=>{
 let failure,output;
 const child=execFile(file,args,options,(error,out,err)=>{failure=error;output=out;if(error){error.stdout=out;error.stderr=err;}});
 child.once('close',()=>failure?reject(failure):resolve(output));
});}
module.exports={runFile};
