// SPDX-License-Identifier: GPL-3.0-or-later
const test=require('node:test'),assert=require('node:assert/strict'),A=require('../public/assets.js'),C=require('../public/composition.js');
const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><defs><linearGradient id="a"><stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#00f"/></linearGradient></defs><rect width="200" height="100" fill="url(#a)"/></svg>';
const resource={name:'test.svg',mime:'image/svg+xml',data:Buffer.from(svg).toString('base64')};
const doc={version:3,name:'Images',parameters:[{id:'photo',label:'Photo',type:'image',default:'sample'}],resources:{sample:resource},html:'<img data-mgt-image="photo">',css:'',render:''};
test('v3 images, dimensions derived from actual content, empty slots and missing references',()=>{
 const parsed=C.parse(doc);assert.equal(parsed.resources.sample.width,200);assert.equal(parsed.resources.sample.height,100);assert.equal(C.values(parsed).photo,'sample');
 assert.throws(()=>C.parse({...doc,version:2}));assert.throws(()=>C.parse({...doc,resources:{}}));assert.throws(()=>C.values(parsed,{photo:'missing'}));
 assert.equal(C.parse({...doc,resources:{},parameters:[{...doc.parameters[0],default:''}]}).parameters[0].default,'');
 assert.equal(C.parse({...doc,resources:{sample:{...resource,width:1,height:1}}}).resources.sample.width,200);
});
test('SVG rejects active, animated, remote, malformed and overly complex content',()=>{
 for(const inner of ['<script>alert(1)</script>','<animate attributeName="x"/>','<image href="https://example.com/x.png"/>','<foreignObject/>','<rect onload="alert(1)"/>','<rect fill="url(https://example.com/x)"/>','<rect style="fill:red"/>','<g><rect/></svg>','<use href="#x"/>','<g>'.repeat(65)+'</g>'.repeat(65)])assert.throws(()=>A.inspectSVG('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'+inner+'</svg>'));
 assert.throws(()=>A.inspectSVG('<!DOCTYPE svg [<!ENTITY e "x">]>'+svg));assert.throws(()=>A.inspectSVG(svg.replace('200 100','9000 9000')));
});
test('resource budget, format and base64 checks',()=>{
 assert.throws(()=>A.validate(Object.fromEntries(Array.from({length:9},(_,i)=>['a'+i,resource]))));
 assert.throws(()=>A.validate({sample:{...resource,mime:'image/png'}}));assert.throws(()=>A.decode64('YW=Jj==='));assert.throws(()=>A.decode64('####'));
 const buffer=Buffer.alloc(1000000,17);assert.equal(A.decode64(buffer.toString('base64')).length,1000000);
});
