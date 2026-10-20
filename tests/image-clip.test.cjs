// SPDX-License-Identifier: GPL-3.0-or-later
const test=require('node:test'),assert=require('node:assert/strict');
const ImageClip=require('../public/image-clip.js'),Composition=require('../public/composition.js');

test('image clip declares framing and position without changing its source asset',()=>{
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="#f00"/></svg>';
 const incoming={id:'pictureAsset',asset:{name:'source.svg',mime:'image/svg+xml',data:Buffer.from(svg).toString('base64')}};
 const document=ImageClip.create(incoming,'source.svg',3),params=Composition.values(document);
 assert.deepEqual([params.imageX,params.imageY,params.imageWidth,params.imageHeight,params.fit],[50,50,100,100,'contain']);
 assert.deepEqual(document.parameters.find(p=>p.id==='fit').options,['contain','cover','fill']);
 assert.equal(document.resources.pictureAsset.data,incoming.asset.data);
 assert.match(document.render,/objectFit:p\.fit/);
 assert.equal(document.recommended.duration,3);
});
