// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {createStore,validateCode}=require('../storage.cjs'),C=require('../public/composition.js'),S=require('../public/scene.js');
test('Import preserves notices without executing render; cleanup stays within selected exports',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mgt-storage-test-')),gallery=path.join(root,'gallery'),output=path.join(root,'exports'),store=createStore(gallery,output);
 try{
  const doc=C.fromText(S.defaults);doc.render='throw new Error("Must not execute during import")';doc.metadata={author:'Test',license:'MIT',copyright:'Preserve me'};doc.extraNotice='Also preserve';
  const raw=JSON.stringify(doc),item=store.add(raw);assert.equal(store.readEffect(item.file).raw,raw);
  assert.throws(()=>store.add('{}'));assert.throws(()=>store.remove('../outside.mgt.json'));
  const name=crypto.randomUUID()+'.mp4',file=path.join(output,name),keep=path.join(output,'keep.txt');fs.writeFileSync(file,'12345');fs.writeFileSync(keep,'keep');
  assert.equal(store.storage().bytes,5);assert.throws(()=>store.clean([name,'../keep.txt']));assert.ok(fs.existsSync(file));
  assert.deepEqual(store.clean([name]).deleted,[name]);assert.ok(fs.existsSync(keep));assert.ok(fs.existsSync(path.join(gallery,item.file)));
  store.remove(item.file);assert.ok(!fs.existsSync(path.join(gallery,item.file)));fs.unlinkSync(keep);
 }finally{
  // Only unlink regular files inside these two freshly created test directories.
  for(const dir of [gallery,output]){for(const name of fs.readdirSync(dir)){const file=path.join(dir,name);if(fs.lstatSync(file).isFile())fs.unlinkSync(file);}fs.rmdirSync(dir);}fs.rmdirSync(root);
 }
});
test('Accepts 48 declared parameters and rejects 49',()=>{
 const doc={...C.fromText(S.defaults),parameters:Array.from({length:48},(_,i)=>({id:'p'+i,label:'P'+i,type:'number',default:0,min:0,max:1,step:.1})),stops:[],render:''};
 assert.doesNotThrow(()=>validateCode(JSON.stringify(doc)));doc.parameters.push({id:'extra',label:'Extra',type:'boolean',default:true});assert.throws(()=>validateCode(JSON.stringify(doc)));
});
