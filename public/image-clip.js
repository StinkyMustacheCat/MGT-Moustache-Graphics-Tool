// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
(function(root){
 function create(incoming,name,duration){
  if(!incoming||!incoming.id||!incoming.asset)throw Error('Imagen no preparada.');
  const document={version:3,name:('Imagen · '+name).slice(0,100),seed:1,recommended:{duration},resources:{[incoming.id]:incoming.asset},parameters:[{id:'picture',label:'Imagen',type:'image',default:incoming.id},{id:'fit',label:'Ajuste',type:'select',options:['contain','cover'],default:'contain'}],html:'<img data-mgt-image="picture" alt="">',css:'img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}',render:'ctx.root.querySelector("img").style.objectFit=ctx.params.fit;'};
  return root.MGTComposition?root.MGTComposition.parse(document):require('./composition.js').parse(document);
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MGTImageClip=api;
})(typeof window!=='undefined'?window:globalThis);
