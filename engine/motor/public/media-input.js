// SPDX-License-Identifier: GPL-3.0-or-later
window.MGTMediaInput={async video(file){
 if(!/\.(mp4|mov|m4v|mkv|webm|avi|mpg|mpeg|vob|ts|m2ts|mts|wmv|asf|flv|ogv|ogg|mxf|nut|gif|3gp)$/i.test(file.name)||file.size>512*1024*1024)throw Error('Formato de vídeo no reconocido o archivo de más de 512 MiB.');
 tell('Analizando y preparando vídeo…');
 const response=await fetch('/api/media/video',{method:'POST',headers:{'X-Motion-Token':info.token,'X-Audio-Name':encodeURIComponent(file.name),'Content-Type':'application/octet-stream'},body:file});
 const result=await response.json();if(!response.ok)throw Error(result.error);
 const bytes=Uint8Array.from(atob(result.data),c=>c.charCodeAt(0)),metadata=MGTVideos.inspect(bytes);
 return {data:result.data,metadata,projectVideoId:result.projectVideoId,classification:result.classification,warnings:result.warnings??[]};
}};
