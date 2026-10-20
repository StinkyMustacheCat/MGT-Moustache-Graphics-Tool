// SPDX-License-Identifier: GPL-3.0-or-later
const test=require('node:test'),assert=require('node:assert/strict');
const Asset=require('../mgt-asset.cjs');
const document={version:3,name:'Alpha',parameters:[],html:'<div></div>',css:'',render:'',recommended:{duration:1.2,aspect:'horizontal',resolution:1080}};
test('el contrato mantiene duración y recomienda dos tamaños independientes',()=>{
 const preview=Asset.prepare({document,profile:'preview',fps:24}),final=Asset.prepare({document,profile:'final',fps:24});
 assert.equal(preview.frames,29);assert.equal(final.frames,29);assert.equal(preview.width,854);assert.equal(final.width,1920);
 assert.equal(preview.alpha,true);assert.equal(preview.codec,'prores_ks');assert.notEqual(preview.fingerprint,final.fingerprint);
 assert.equal(Asset.prepare({document,profile:'preview',fps:24}).fingerprint,preview.fingerprint);
});
test('rechaza FPS y opciones incompatibles antes del render',()=>{
 for(const fps of [0,25,59,120,'30'])assert.throws(()=>Asset.prepare({document,fps}),/FPS/);
 assert.throws(()=>Asset.prepare({document,profile:'draft'}),/Perfil/);
 assert.throws(()=>Asset.prepare({document,resolution:100}),/Resolución/);
 assert.throws(()=>Asset.prepare({document,aspect:'cinema'}),/Relación/);
 assert.throws(()=>Asset.prepare({document,params:{}}),/contrato de asset v1/);
 assert.throws(()=>Asset.prepare({document:{...document,render:'Math.random()'}}),/aleatoriedad/);
 assert.throws(()=>Asset.prepare({document:{...document,css:'@import url(https://example.com/a.css)'}}),/recursos externos/);
});
