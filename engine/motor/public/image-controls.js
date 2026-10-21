// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
let imageImporting=false;
const imageThumbs=new Map();
function releaseImageThumbs(){for(const item of imageThumbs.values())URL.revokeObjectURL(item.url);imageThumbs.clear();}
window.addEventListener('pagehide',releaseImageThumbs);
function refreshImageControls(){
 if(!custom)return;
 const used=new Set(custom.parameters.filter(p=>p.type==='image').map(p=>params[p.id]).filter(Boolean));
 for(const [id,item]of imageThumbs)if(!used.has(id)||item.asset!==custom.resources?.[id]){URL.revokeObjectURL(item.url);imageThumbs.delete(id);}
 for(const p of custom.parameters.filter(p=>p.type==='image')){
  const a=custom.resources?.[params[p.id]],thumb=$('imagePreview-'+p.id),status=$('imageStatus-'+p.id);if(!thumb)continue;
  if(a){if(!imageThumbs.has(params[p.id])){const url=URL.createObjectURL(new Blob([MGTAssets.decode64(a.data)],{type:a.mime}));imageThumbs.set(params[p.id],{asset:a,url});}const src=imageThumbs.get(params[p.id]).url;if(thumb.getAttribute('src')!==src)thumb.src=src;}else thumb.removeAttribute('src');
  thumb.hidden=!a;status.textContent=a?a.name+' · '+a.width+' × '+a.height+' · '+formatBytes(a.data.length*3/4-(a.data.endsWith('==')?2:a.data.endsWith('=')?1:0)):'Sin imagen. Importa un archivo local.';
  $('param-'+p.id).value=params[p.id];$('imageRemove-'+p.id).disabled=!a||imageImporting;$('imagePick-'+p.id).disabled=imageImporting;$('imagePick-'+p.id).textContent=a?'Reemplazar imagen':'Importar imagen';
 }
}
function buildImageControl(p,field,label){
 field.classList.add('image-field');const input=document.createElement('input');input.type='hidden';input.id='param-'+p.id;
 const thumb=document.createElement('img');thumb.id='imagePreview-'+p.id;thumb.alt='Vista previa de '+p.label;thumb.className='image-preview';thumb.hidden=true;
 const status=document.createElement('p');status.id='imageStatus-'+p.id;status.className='hint';status.setAttribute('role','status');
 const picker=document.createElement('input');picker.type='file';picker.accept='.png,.jpg,.jpeg,.webp,.svg';picker.hidden=true;
 const actions=document.createElement('div');actions.className='image-actions';const choose=document.createElement('button'),remove=document.createElement('button');choose.className=remove.className='secondary';choose.id='imagePick-'+p.id;remove.id='imageRemove-'+p.id;remove.textContent='Quitar';label.htmlFor=choose.id;
 choose.onclick=()=>{if(busy||pendingApply){tell('Espera a que termine la operación actual.',true);return;}picker.value='';picker.click();};
 remove.onclick=()=>{if(imageImporting||busy||pendingApply)return;try{commitImage(p,null);}catch(e){showError(e.message);}};
 picker.onchange=async()=>{const file=picker.files[0];if(!file)return;const composition=custom;if(imageImporting)return;imageImporting=true;refreshImageControls();status.textContent='Preparando imagen…';
  try{const asset=await prepareImage(file);if(custom!==composition)throw Error('La composición cambió. Importa la imagen nuevamente.');if(asset)await commitImage(p,asset);}
  catch(e){showError(e.message);}finally{imageImporting=false;refreshImageControls();}
 };
 actions.append(choose,remove);field.append(label,input,thumb,status,actions,picker);
}
async function decodeImage(blob){const url=URL.createObjectURL(blob),img=new Image();img.src=url;try{await img.decode();return {img,url};}catch{URL.revokeObjectURL(url);throw Error('No se pudo abrir la imagen. Puede estar dañada o usar un SVG no compatible.');}}
async function prepareImage(file){
 if(file.size>50000000)throw Error('El archivo supera 50 MB. Reduce la imagen antes de importarla.');
 let bytes=new Uint8Array(await file.arrayBuffer()),info=MGTAssets.inspect(bytes),name=file.name.slice(0,160);
 if(info.width*info.height>64000000||info.width>16384||info.height>16384)throw Error('La imagen supera el límite de lectura segura (64 MP / 16384 px). Redúcela externamente.');
 const mustReduce=info.mime!=='image/svg+xml'&&(bytes.length>MGTAssets.limits.file||info.width>4096||info.height>4096||info.width*info.height>16000000);
 let ratio=Math.min(1,4096/info.width,4096/info.height,Math.sqrt(16000000/(info.width*info.height)));
 if(mustReduce&&!confirm('La imagen supera el límite. ¿Crear una copia reducida para MGT?\nResultado aproximado: '+Math.floor(info.width*ratio)+' × '+Math.floor(info.height*ratio)+' px, WebP. El original no se modifica.'))return null;
 const loaded=await decodeImage(new Blob([bytes],{type:info.mime}));
 try{
  if(mustReduce){const canvas=document.createElement('canvas');ratio=Math.min(1,4096/loaded.img.naturalWidth,4096/loaded.img.naturalHeight,Math.sqrt(16000000/(loaded.img.naturalWidth*loaded.img.naturalHeight)));canvas.width=Math.max(1,Math.floor(loaded.img.naturalWidth*ratio));canvas.height=Math.max(1,Math.floor(loaded.img.naturalHeight*ratio));canvas.getContext('2d').drawImage(loaded.img,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.9));canvas.width=canvas.height=1;if(!blob)throw Error('No se pudo crear la copia reducida.');bytes=new Uint8Array(await blob.arrayBuffer());info=MGTAssets.inspect(bytes);name=name.replace(/\.[^.]+$/,'')+'-MGT.webp';
  }
 }finally{loaded.img.src='';URL.revokeObjectURL(loaded.url);}
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('No se pudo leer la imagen.'));reader.readAsDataURL(new Blob([bytes]));});
 const asset={name:name.slice(0,160),mime:info.mime,width:info.width,height:info.height,data};MGTAssets.validate({['img_'+hash]:asset});return {id:'img_'+hash,asset};
}
function commitImage(p,incoming){
 if(!custom||pendingApply||busy)return;
 const oldCustom=custom,oldParams=params;let id=incoming?.id||'';
 if(incoming){const same=Object.entries(custom.resources??{}).find(([,a])=>a.mime===incoming.asset.mime&&a.data===incoming.asset.data);if(same)id=same[0];}
 const nextParams={...params,[p.id]:id},resources={...custom.resources,...(incoming?{[id]:incoming.asset}:{})};
 const used=new Set(custom.parameters.filter(q=>q.type==='image').map(q=>nextParams[q.id]).filter(Boolean));for(const key of Object.keys(resources))if(!used.has(key))delete resources[key];
 const next=Composition.parse({...custom,resources,parameters:custom.parameters.map(q=>q.type==='image'?{...q,default:nextParams[q.id]}:q)});
 undoSnapshot={params:structuredClone(oldParams),seed,state:structuredClone(state),selectedStop,resources:oldCustom.resources,imageDefaults:Object.fromEntries(oldCustom.parameters.filter(q=>q.type==='image').map(q=>[q.id,q.default]))};$('undo').disabled=false;
 custom=next;params=nextParams;refreshImageControls();pause();rebuild();tell(incoming?'Imagen importada. Guarda la composición para conservarla.':'Imagen retirada de este espacio.');
}
