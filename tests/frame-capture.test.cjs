// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCapture}=require('../frame-capture.cjs');
test('Lost renderer retries only the pending frame, with a bounded number of recoveries',async()=>{
  let opened=0,closed=0,recovered=0;const calls=[];
  const c=createCapture({cancelled(){},recovered:n=>recovered=n,open:async()=>{const id=++opened;return {capture:async f=>{calls.push([id,f]);if(id<3&&f===1)throw Error('lost');return f;},lost:e=>e.message==='lost',close:async()=>{closed++;}};}});
  const result=[];for(let f=0;f<3;f++)result.push(await c.capture(f));await c.close();
  assert.deepEqual(result,[0,1,2]);assert.deepEqual(calls,[[1,0],[1,1],[2,1],[3,1],[3,2]]);assert.equal(recovered,2);assert.equal(closed,3);
});
test('Repeated crashes stop after two recoveries',async()=>{
  let opened=0;const c=createCapture({cancelled(){},open:async()=>{opened++;return {capture:async()=>{throw Error('lost');},lost:()=>true,close:async()=>{}};}});
  await assert.rejects(c.capture(0),/lost/);assert.equal(opened,3);await c.close();
});
test('Composition errors are not retried and cancellation never reopens the browser',async()=>{
  let opened=0,cancelled=false;
  const c=createCapture({cancelled(){if(cancelled)throw Error('cancelled');},open:async()=>{opened++;return {capture:async()=>{throw Error('composition');},lost:()=>false,close:async()=>{}};}});
  await assert.rejects(c.capture(0),/composition/);assert.equal(opened,1);cancelled=true;
  await assert.rejects(c.capture(0),/cancelled/);assert.equal(opened,1);await c.close();
});
