const test=require('node:test'),assert=require('node:assert/strict'),Clips=require('../public/mgt-clips.js');
const doc={version:4,name:'MGT',parameters:[],html:'<div></div>',css:'',render:''};
test('MGT clips keep independent timing and reject overlap',()=>{const m=Clips.create();const a=m.add(doc,1,0,180),b=m.add(doc,1,60,180);assert.equal(a.start,0);assert.equal(b.start,60);assert.throws(()=>m.add(doc,1,90,180),/solap/);assert.equal(m.at(75).clip.id,b.id);});
test('Removing the only MGT leaves an empty persistent track',()=>{const m=Clips.create(),a=m.add(doc,1,0,180);m.remove(a.id);assert.deepEqual(m.snapshot(),[]);assert.doesNotThrow(()=>m.add(doc,1,0,180));});
