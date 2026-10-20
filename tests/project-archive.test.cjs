// SPDX-License-Identifier: GPL-3.0-or-later
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),Archive=require('../project-archive.cjs');
test('project archive carries JSON and separate media without rewriting asset bytes',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'mgt-project-')),file=path.join(directory,'project.mgtproj'),audio=path.join(directory,'sound.wav'),bytes=Buffer.from('RIFFfake-audio-for-archive-test');
 try{fs.writeFileSync(audio,bytes);const project={kind:'mgt-project',version:1,scene:{duration:3},tracks:{overlayLanes:[]}};await Archive.create(file,[{name:'project.json',data:Buffer.from(JSON.stringify(project))},{name:'audio/0.wav',file:audio}]);const entries=await Archive.inspect(file);assert.equal(entries.size,2);assert.deepEqual(await Archive.readJSON(file,entries.get('project.json')),project);await Archive.verify(file,entries.get('audio/0.wav'));assert.deepEqual(Buffer.concat(await Array.fromAsync(Archive.stream(file,entries.get('audio/0.wav')))),bytes);
  const fd=fs.openSync(file,'r+');try{const entry=entries.get('audio/0.wav'),byte=Buffer.from([0]);fs.readSync(fd,byte,0,1,entry.dataStart);byte[0]^=1;fs.writeSync(fd,byte,0,1,entry.dataStart);}finally{fs.closeSync(fd);}await assert.rejects(Archive.verify(file,entries.get('audio/0.wav')),/dañado/);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('project archive rejects unsafe names before writing',async()=>{const file=path.join(os.tmpdir(),'mgt-invalid-'+Date.now()+'.zip');await assert.rejects(Archive.create(file,[{name:'../project.json',data:Buffer.from('{}')}]),/no válidas/);assert.equal(fs.existsSync(file),false);});
