// SPDX-License-Identifier: GPL-3.0-or-later
window.MGTMediaInput={async video(file){
 if(!/\.(mp4|mov|webm)$/i.test(file.name)||file.size>128*1024*1024)throw Error('Selecciona MP4, MOV o WebM de hasta 128 MiB.');
 let bytes;
 if(/\.mp4$/i.test(file.name)&&file.size<=MGTVideos.limits.file){bytes=new Uint8Array(await file.arrayBuffer());try{MGTVideos.inspect(bytes);}catch{bytes=null;}}
 if(!bytes){tell('Preparando vídeo para MGT…');const response=await fetch('/api/media/video',{method:'POST',headers:{'X-Motion-Token':info.token,'X-Audio-Name':encodeURIComponent(file.name),'Content-Type':'application/octet-stream'},body:file});const result=await response.json();if(!response.ok)throw Error(result.error);bytes=Uint8Array.from(atob(result.data),c=>c.charCodeAt(0));}
 const metadata=MGTVideos.inspect(bytes),blob=new Blob([bytes],{type:'video/mp4'}),data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(Error('No se pudo leer el vídeo preparado.'));r.readAsDataURL(blob);});return {bytes,data,metadata};
}};
