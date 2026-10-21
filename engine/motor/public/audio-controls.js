// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
(()=>{
 let selected=null,loading=false,volume=1,muted=false;
 const player=$('audioPreview');
 function controls(){const disabled=loading||busy||!info;$('audioLoad').disabled=disabled;$('audioRemove').disabled=disabled||!selected;}
 function status(message,error=false){$('audioStatus').textContent=message;$('audioStatus').classList.toggle('error',error);}
 function summary(){window.MGTHistory?.schedule();status(selected?selected.name+' · '+selected.duration.toFixed(3)+' s · cargado para exportar.':'Sin audio cargado.');updateEstimate();setButtons();}
 async function upload(file,operation){
  if(loading||busy)throw Error('Espera a que termine la carga o exportación actual.');
  if(!info)throw Error('Espera a que MGT termine de iniciar.');
  loading=true;pause();setButtons();
  try{return await operation();}finally{loading=false;setButtons();}
 }
 async function accept(audio){
  pause();
  try{await request('/api/audio/select',{id:audio.id});}catch(error){await request('/api/audio/discard',{id:audio.id}).catch(()=>{});throw error;}
  selected=audio;player.src=audio.url;player.load();
  if(Math.round(state.duration*60)!==Math.round(audio.duration*60)){
   const adjust=confirm('La duración del audio ('+audio.duration.toFixed(3)+' s) no coincide con la duración actual ('+state.duration.toFixed(3)+' s). ¿Quieres ajustar la duración?\nSí: usar la duración del audio. No: conservar la duración; el audio se corta al final o el resto queda sin sonido.');
   if(adjust){remember();state=Scene.normalize({...state,duration:window.MGTTrackUI?.hasSubtitles()?Math.max(state.duration,audio.duration):audio.duration});if(!window.MGTTrackUI?.hasSubtitles())mgDuration=state.duration;valid=true;syncBuiltin();await rebuild();}
  }
  summary();seek(currentFrame/60,false);
 }
 async function load(file){
  if(!file)return;if(window.MGTTrackState?.locked('audio'))throw Error('La pista Audio está bloqueada.');
  if(!/\.(wav|mp3|flac|m4a|ogg)$/i.test(file.name))throw Error('Selecciona WAV, MP3, FLAC, M4A o OGG.');
  if(file.size>1536*1024*1024)throw Error('El audio supera 1.5 GiB.');if(selected&&!confirm('¿Quieres reemplazar el audio principal?'))return;
  const result=await upload(file,()=>new Promise((resolve,reject)=>{
   const xhr=new XMLHttpRequest();xhr.open('POST','/api/audio');xhr.setRequestHeader('X-Motion-Token',info.token);xhr.setRequestHeader('X-Audio-Name',encodeURIComponent(file.name));xhr.setRequestHeader('Content-Type','application/octet-stream');xhr.responseType='json';xhr.timeout=300000;
   xhr.upload.onprogress=e=>status(e.lengthComputable?'Cargando audio · '+Math.round(e.loaded/e.total*100)+' %':'Cargando audio…');
   xhr.upload.onload=()=>status('Comprobando formato y duración del audio…');
   xhr.onload=()=>xhr.status===201?resolve(xhr.response):reject(Error(xhr.response?.error||'No se pudo cargar el audio.'));
   xhr.onerror=()=>reject(Error('Se interrumpió la carga del audio.'));xhr.ontimeout=()=>reject(Error('La carga del audio agotó el tiempo de espera.'));xhr.send(file);
  }));
  await accept(result.audio);
 }
 function seek(time,isPlaying){player.volume=muted||window.MGTTrackState?.muted('audio')?0:volume;
  if(!selected)return;
  if(time>=selected.duration){player.pause();return;}
  // The animation clock remains absolute. Seek on user jumps or material drift.
  if(!isPlaying||Math.abs(player.currentTime-time)>.15){try{player.currentTime=Math.max(0,time);}catch{}}
 }
 function play(time){if(!selected||time>=selected.duration)return;seek(time,false);player.play().catch(()=>status('No se pudo reproducir este audio en la vista previa. Su audio sigue disponible para exportar.',true));}
 async function remove(){if(window.MGTTrackState?.locked('audio')||busy)return;pause();await request('/api/audio/select',{id:null});selected=null;player.removeAttribute('src');player.load();summary();}
 function attempt(fn){return async()=>{try{await fn();}catch(error){status(error.message+' El audio anterior se conserva.',true);showError(error.message);controls();}};}
 $('audioLoad').onclick=()=>$('audioFile').click();$('audioFile').onchange=attempt(async()=>{const file=$('audioFile').files[0];$('audioFile').value='';if(window.MGTEffectUI?.addFile)await MGTEffectUI.addFile(file,currentFrame/60);else await load(file);});$('audioRemove').onclick=attempt(remove);
 player.addEventListener('loadedmetadata',()=>seek(currentFrame/60,playing));
 async function restore(s){await request('/api/audio/select',{id:s.audio?.id??null});selected=s.audio;volume=s.volume;muted=s.muted;if(selected){player.src=selected.url;player.load();}else{player.pause();player.removeAttribute('src');player.load();}summary();}window.MGTAudio={restore,capture:()=>({audio:selected?{...selected}:null,volume,muted}),settings:()=>({volume,muted}),adjust:(v,m)=>{if(!Number.isFinite(v)||v<0||v>1||typeof m!=='boolean')throw Error('Volumen no válido.');volume=v;muted=m;setButtons();seek(currentFrame/60,playing);window.MGTHistory?.schedule();},track:()=>selected?{...selected}:null,id:()=>selected?.id||null,loading:()=>loading,controls,accept,upload,seek,play,pause:()=>player.pause()};
 controls();
})();
