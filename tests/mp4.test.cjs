// SPDX-License-Identifier: GPL-3.0-or-later
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{Readable}=require('node:stream');
const M=require('../mp4-metadata.cjs'),{convert}=require('../wav-subtitles.cjs'),F=require('./mp4-fixtures.cjs');
function stream(bytes){return Readable.from((function*(){for(let i=0;i<bytes.length;i+=7)yield bytes.subarray(i,i+7);})());}
test('MP4 preserves exact word times and ignores unrelated UUID boxes',async()=>{
 const core=Buffer.concat([F.basic(),F.box('uuid',Buffer.concat([Buffer.alloc(16,1),Buffer.from('unrelated')]),true)]),tag=F.metadata(F.payload(core)),bytes=Buffer.concat([core,tag]),copy=[];
 const read=await M.read(stream(bytes),{onData:b=>copy.push(b)}),sub=convert(read.payload).subtitles;
 assert.equal(sub.cues[0].words[0].start,.123456);assert.deepEqual(Buffer.concat(copy),bytes);assert.equal(read.coreBytes,core.length);
});
test('Ordinary MP4 can be distinguished without inventing subtitles',async()=>{assert.equal((await M.read(stream(F.basic()))).payload,null);});
test('Metadata-only MP4 import needs no temporary video, audio decoder, or audio store',async t=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'mgt-mp4-test-'));t.after(()=>fs.rmSync(dataDir,{recursive:true,force:true}));const core=F.basic(),bytes=Buffer.concat([core,F.metadata(F.payload(core))]);
 const result=await require('../mp4-import.cjs').read(stream(bytes),{retainAudio:false,dataDir,ffmpeg:'must-not-run',store:null,signal:new AbortController().signal});
 assert.equal(result.subtitles.cues[0].start,.123456);assert(!result.audio);assert.deepEqual(fs.readdirSync(dataDir),[]);
});
test('Modified media bytes, duplicate blocks, wrong source length and temporal inconsistencies are rejected',async()=>{
 const core=F.basic(),tag=F.metadata(F.payload(core)),changed=Buffer.from(core);changed[changed.length-1]^=1;
 await assert.rejects(M.read(stream(Buffer.concat([changed,tag]))),/no corresponden/);
 await assert.rejects(M.read(stream(Buffer.concat([core,tag,tag]))),/duplicados/);
 for(const change of [p=>p.association.byte_count++,p=>p.audio.frame_count++,p=>p.audio.stream_ordinal=1,p=>p.analysis.transcript.timeline[0].words[0].end=2,p=>p.analysis.annotations.push({type:'partial_word_unverified',target_id:'missing',original_id:'old'})]){
  const p=F.payload(core);change(p);await assert.rejects(M.read(stream(Buffer.concat([core,F.metadata(p)]))));
 }
});
test('Malformed, truncated, non-MP4 and oversized boxes are rejected before allocating payloads',async()=>{
 const core=F.basic();await assert.rejects(M.read(stream(core.subarray(0,core.length-1))),/truncado/);
 const bad=Buffer.from(core);bad.writeUInt32BE(4);await assert.rejects(M.read(stream(bad)),/Tamaño/);
 const invalid64=F.box('free',Buffer.alloc(0),true);invalid64.writeBigUInt64BE(0n,8);await assert.rejects(M.read(stream(Buffer.concat([core,invalid64]))),/Tamaño extendido/);
 const large=Buffer.alloc(16);large.writeUInt32BE(1);large.write('mdat',4);large.writeBigUInt64BE(BigInt(M.MAX_FILE+1),8);await assert.rejects(M.read(stream(large)),/grande/);
 const mov=F.box('ftyp',Buffer.from('qt  \0\0\0\0qt  ','binary'));await assert.rejects(M.read(stream(mov)),/contenedor MP4/);
});
test('A zero-size final mdat is hashed to EOF and supported without metadata',async()=>{
 const core=F.basic(),at=core.indexOf(Buffer.from('mdat'))-4;core.writeUInt32BE(0,at);const r=await M.read(stream(core));assert.equal(r.coreBytes,core.length);assert.equal(r.payload,null);
});
