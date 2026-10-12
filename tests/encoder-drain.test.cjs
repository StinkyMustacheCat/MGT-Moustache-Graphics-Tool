// SPDX-License-Identifier: GPL-3.0-or-later
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),{waitForDrain}=require('../encoder-drain.cjs');
test('Cancelled encoder closes a pending frame without waiting forever or retaining listeners',async()=>{
 const stream=new EventEmitter();stream.writable=true;
 const pending=waitForDrain(stream);stream.emit('close');await assert.rejects(pending,/cerró/);
 for(const event of ['drain','error','close'])assert.equal(stream.listenerCount(event),0);
});
test('Drain removes the temporary error/close listeners on every frame',async()=>{
 const stream=new EventEmitter();stream.writable=true;
 for(let i=0;i<200;i++){const pending=waitForDrain(stream);stream.emit('drain');await pending;}
 for(const event of ['drain','error','close'])assert.equal(stream.listenerCount(event),0);
});
