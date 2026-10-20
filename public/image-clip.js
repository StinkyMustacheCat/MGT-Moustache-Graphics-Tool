// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
(function(root){
 function create(incoming,name,duration){
  if(!incoming||!incoming.id||!incoming.asset)throw Error('Imagen no preparada.');
  const document={version:3,name:('Imagen · '+name).slice(0,100),seed:1,recommended:{duration},resources:{[incoming.id]:incoming.asset},parameters:[{id:'picture',label:'Imagen',type:'image',default:incoming.id},{id:'imageX',label:'Imagen · posición X (%)',type:'number',default:50,min:-100,max:200,step:.1,control:'slider'},{id:'imageY',label:'Imagen · posición Y (%)',type:'number',default:50,min:-100,max:200,step:.1,control:'slider'},{id:'imageWidth',label:'Imagen · anchura (%)',type:'number',default:100,min:1,max:200,step:1,control:'slider'},{id:'imageHeight',label:'Imagen · altura (%)',type:'number',default:100,min:1,max:200,step:1,control:'slider'},{id:'fit',label:'Encuadrar medio',type:'select',options:['contain','cover','fill'],default:'contain'}],html:'<img data-mgt-image="picture" alt="">',css:'img{position:absolute;left:50%;top:50%;width:100%;height:100%;transform:translate(-50%,-50%);object-fit:contain}',render:'const p=ctx.params,img=ctx.root.querySelector("img");Object.assign(img.style,{left:p.imageX+"%",top:p.imageY+"%",width:p.imageWidth+"%",height:p.imageHeight+"%",objectFit:p.fit});'};
  return root.MGTComposition?root.MGTComposition.parse(document):require('./composition.js').parse(document);
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MGTImageClip=api;
})(typeof window!=='undefined'?window:globalThis);
