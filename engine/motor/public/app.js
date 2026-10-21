// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const $ = id => document.getElementById(id);
const Scene = window.MotionScene;
const Composition = window.MGTComposition;
let custom = null, params = {}, mainPresent = false, draftDirty = false, customChannel = '', readyTimer;
let seed = 1, selectedStop = '', customRect = null, undoSnapshot = null;
let mgDuration=Scene.defaults.duration, mgStart=0, projectFps=60;
let state = structuredClone(Scene.defaults), mode = 'start', currentFrame = 0;
let playing = false, raf = 0, ready = false, valid = true, info = null, busy = false, renderId = null;
let zoomPercent = 30;
let scale = 1, sceneGeneration = 0, dragging = null;
let activeGalleryFile='', importedCode='', galleryItems=[], galleryErrors=[], storageSnapshot=null, storageNoticeShown=false;
let fitView=true, lastScale=0, pendingApply=null, appliedDraft='', cleanDraft='', savedSignature='', initialized=false;
const frameCount = () => Math.round(state.duration * Scene.FPS);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function tell(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
function setButtons() { window.MGTAudio?.controls();window.MGTTrackUI?.sync(); $('openExport').disabled = !ready || !valid || !info?.ready || busy || window.MGTAudio?.loading() || window.MGTTrackUI?.preparing() || window.MGTEffectUI?.loading() || window.MGTHistory?.status().applying;$('openExportFromInspector').disabled=$('openExport').disabled;$('projectFps').disabled=busy; $('play').disabled = !ready || !valid || window.MGTTrackUI?.preparing();window.MGTTrackState?.sync();window.MGTHistory?.controls(); }
function updateCode() {}
function refreshLabels() {
  const [w, h] = Scene.sizes[state.aspect];
  $('dimensions').textContent = `${w} × ${h}`;
  $('workingFps').textContent=projectFps+' FPS';
  $('previewFps').textContent=projectFps+' FPS';
  $('durationLabel').textContent = `${Number(state.duration.toFixed(3))} s`;
  $('colorValue').textContent = state.color.toUpperCase(); $('backgroundValue').textContent = state.background.toUpperCase();
  $('scrub').max = frameCount() - 1;
  updateCoordinates(); updateCode();
}
function updateCoordinates() { $('x').value = Number(state[mode].x.toFixed(1)); $('y').value = Number(state[mode].y.toFixed(1)); }
function resizeStage() {
  const area=$('stageArea'),box=$('stageBox'),surface=$('stageSurface'),[w,h]=Scene.sizes[state.aspect];
  if(!area.clientWidth||$('previewPanel').hidden)return;
  const vw=area.clientWidth,vh=area.clientHeight;
  const previousX=(area.scrollLeft+vw/2)/(surface.offsetWidth||vw),previousY=(area.scrollTop+vh/2)/(surface.offsetHeight||vh);
  // Reservar el espacio de ambas barras a partir del tamaño exterior evita
  // alternar dos porcentajes cuando una barra aparece o desaparece.
  if(fitView){zoomPercent=Math.max(10,Math.min(400,Math.floor(Math.min((area.offsetWidth-40)/w,(area.offsetHeight-40)/h)*100)));}
  scale=zoomPercent/100;$('zoom').value=Math.min(200,zoomPercent);$('zoomNumber').value=zoomPercent;
  const sw=Math.max(vw,w*scale*3),sh=Math.max(vh,h*scale*3);
  Object.assign(surface.style,{width:sw+'px',height:sh+'px'});
  Object.assign(box.style,{width:w*scale+'px',height:h*scale+'px',left:(sw-w*scale)/2+'px',top:(sh-h*scale)/2+'px'});
  Object.assign($('scene').style,{width:w*3+'px',height:h*3+'px',left:-w*scale+'px',top:-h*scale+'px',transform:'scale('+scale+')'});
  if(fitView||!lastScale){area.scrollLeft=(sw-vw)/2;area.scrollTop=(sh-vh)/2;}else{area.scrollLeft=previousX*sw-vw/2;area.scrollTop=previousY*sh-vh/2;}
  lastScale=scale;window.MGTTrackUI?.resize();drawGuides();
}
function drawGuides() {
  const stop = custom?.stops?.find(s=>s.id===selectedStop);
  const editing = mainPresent && window.MGTTrackState?.visible('mgt')!==false && !window.MGTTrackState?.locked('mgt') && !window.MGTEffectUI?.selected() && !window.MGTTrackUI?.selected() && !$('cropPreview').checked && ready && !playing && (custom?Boolean(stop&&customRect):currentFrame===(mode==='start'?0:frameCount()-1));
  $('stageBox').classList.toggle('cropped', playing || $('cropPreview').checked);
  $('dragHandle').hidden = !editing; $('pathGuide').toggleAttribute('hidden', !editing||Boolean(custom));
  $('editLabel').textContent = playing ? 'REPRODUCIENDO' : editing ? (custom?'EDITANDO '+stop.label.toUpperCase():mode==='start'?'EDITANDO POSICIÓN INICIAL':'EDITANDO POSICIÓN FINAL') : 'VISTA PREVIA';
  if(custom){
    if(editing){ Object.assign($('dragHandle').style,{left:customRect.left*scale+'px',top:customRect.top*scale+'px',width:customRect.width*scale+'px',height:customRect.height*scale+'px'}); $('handleLabel').textContent=stop.label; }
    $('clipWarning').textContent=stop&&ready&&!customRect?'El objeto de esta parada no está visible.':''; return;
  }
  if (!ready) { $('clipWarning').textContent = ''; return; }
  const [w, h] = Scene.sizes[state.aspect];
  const doc = $('scene').contentDocument, label = doc?.getElementById('text');
  if (!label) return;
  const raw = label.getBoundingClientRect();
  const rect = { left:raw.left-w, top:raw.top-h, right:raw.right-w, bottom:raw.bottom-h, width:raw.width, height:raw.height };
  const handle = $('dragHandle');
  Object.assign(handle.style, { left: rect.left * scale + 'px', top: rect.top * scale + 'px', width: rect.width * scale + 'px', height: rect.height * scale + 'px' });
  const points = [state.start.x * w * scale / 100, state.start.y * h * scale / 100, state.end.x * w * scale / 100, state.end.y * h * scale / 100];
  ['x1', 'y1', 'x2', 'y2'].forEach((k, i) => $('motionLine').setAttribute(k, points[i]));
  $('startDot').setAttribute('cx', points[0]); $('startDot').setAttribute('cy', points[1]);
  $('endDot').setAttribute('cx', points[2]); $('endDot').setAttribute('cy', points[3]);
  $('clipWarning').textContent = rect.left < -.5 || rect.top < -.5 || rect.right > w + .5 || rect.bottom > h + .5 ? 'El contenido fuera del borde no se exporta.' : '';
}
function showFrame(frame) {
  const outputFrames=Math.max(1,Math.round(state.duration*projectFps)),outputFrame=Math.max(0,Math.min(outputFrames-1,Math.round(frame/60*projectFps)));
  currentFrame = Math.max(0, Math.min(frameCount() - 1, Math.round(outputFrame*60/projectFps)));
  const mgtFrame=currentFrame-Math.round(mgStart*60);$('scene').hidden=!mainPresent||mgtFrame<0||mgtFrame>=Math.round(mgDuration*60)||window.MGTTrackState?.visible('mgt')===false;$('useText').hidden=!mainPresent;
  if (ready&&mainPresent) {
    if (custom) $('scene').contentWindow.postMessage({ mgt:customChannel, type:'frame', frame:Math.max(0,mgtFrame), stopId:selectedStop||null }, '*');
    else if(mgtFrame>=0)$('scene').contentWindow.setFrame(mgtFrame);
  }
  $('scrub').value = currentFrame;
  const ms = Math.round(currentFrame / 60 * 1000), seconds = Math.floor(ms / 1000);
  $('timecode').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
  $('frameLabel').textContent = `Fotograma ${outputFrame + 1} / ${outputFrames}`;
  window.MGTAudio?.seek(currentFrame/60,playing);window.MGTEffectUI?.seek(currentFrame/60,playing);window.MGTTrackUI?.frame();
  drawGuides();
}
function pause() { window.MGTAudio?.pause();window.MGTEffectUI?.pause(); playing = false; cancelAnimationFrame(raf); $('play').textContent = '▶'; $('play').setAttribute('aria-label', 'Reproducir'); drawGuides(); }
function selectMode(next) {
  pause(); mode = next;
  $('cropPreview').checked = false;
  for (const key of ['start', 'end']) { $(key + 'Mode').classList.toggle('selected', key === mode); $(key + 'Mode').setAttribute('aria-pressed', String(key === mode)); }
  $('handleLabel').textContent = mode === 'start' ? 'INICIO' : 'FINAL'; updateCoordinates();
  showFrame(mode === 'start' ? 0 : frameCount() - 1);
}
async function rebuild() {
  pause(); ready = false; setButtons();
  clearTimeout(readyTimer);
  const generation = ++sceneGeneration;
  const frame = currentFrame;
  if(!mainPresent){$('scene').onload=null;$('scene').hidden=true;$('scene').srcdoc='';ready=true;refreshLabels();resizeStage();showFrame(frame);setButtons();return;}
  if (custom) {
    const [width, height] = Scene.sizes[state.aspect];
    customChannel = crypto.randomUUID();
    $('scene').onload = null;
    $('scene').setAttribute('sandbox', 'allow-scripts');
    customRect=null;
    $('scene').srcdoc = Composition.documentHTML(custom, { width, height, duration:mgDuration, background:window.MGTTrackUI?.hasVideo()?'transparent':state.background, params, seed, workspace:true,overlay:window.MGTTrackUI?.hasVideo() }, customChannel);
    readyTimer = setTimeout(() => { if (generation === sceneGeneration && !ready) { failComposition('La composición no respondió en 30 segundos. Revisa render o pulsa Refrescar vista.'); } }, 30000);
    refreshLabels(); resizeStage(); return;
  }
  $('scene').setAttribute('sandbox', 'allow-scripts allow-same-origin');
  $('scene').onload = async () => {
    try {
      await $('scene').contentWindow.sceneReady;
      if (generation !== sceneGeneration) return;
      ready = true; resizeStage(); showFrame(frame); setButtons();
    } catch { tell('No se pudo cargar la composición. Prueba otra fuente.', true); }
  };
  $('scene').srcdoc = Scene.documentHTML({...state,duration:mgDuration}, false, true,window.MGTTrackUI?.hasVideo());
  refreshLabels(); resizeStage();
}
function readControls() {if(window.MGTTrackState?.locked('mgt')||busy)return;
  const alpha=$('textAlpha').valueAsNumber;
  if(!Number.isFinite(alpha)||alpha<0||alpha>100){valid=false;setButtons();tell('La opacidad debe estar entre 0 y 100.',true);return;}
  $('textAlphaSlider').value=alpha;
  const candidate = { ...state, text: $('text').value, font: $('font').value, size: $('size').valueAsNumber, color: $('color').value+(alpha===100?'':Math.round(alpha*255/100).toString(16).padStart(2,'0')), background: $('background').value, duration: $('duration').valueAsNumber, easing: $('easing').value, aspect: $('aspect').value };
  try { const normalized=Scene.normalize(candidate);if(normalized.duration!==mgDuration){mgDuration=normalized.duration;if(!window.MGTTrackUI?.hasSubtitles()&&!window.MGTTrackUI?.hasVideo()&&!window.MGTAudio?.id())normalized.duration=Math.max(state.duration,mgStart+mgDuration);}else normalized.duration=state.duration;state=normalized; valid = true; tell('Duración propia de MGT actualizada.'); rebuild(); }
  catch (error) { valid = false; pause(); tell(error.message, true); setButtons(); }
}
function moveTo(x, y) {if(window.MGTTrackState?.locked('mgt')||busy)return;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  state[mode] = { x: Math.round(Math.max(-100, Math.min(200, x)) * 100) / 100, y: Math.round(Math.max(-100, Math.min(200, y)) * 100) / 100 };
  if (ready) $('scene').contentWindow.setPositions(state.start, state.end);
  updateCoordinates(); showFrame(mode === 'start' ? 0 : frameCount() - 1); updateCode();
}
for (const id of ['text', 'size', 'color', 'background','textAlpha']) $(id).addEventListener('input', readControls);
$('textAlphaSlider').oninput=()=>{$('textAlpha').value=$('textAlphaSlider').value;readControls();};
for (const id of ['font', 'easing', 'aspect']) $(id).addEventListener('change', readControls);
$('duration').addEventListener('change',readControls);$('duration').addEventListener('blur', () => { if (valid) $('duration').value = Number(mgDuration.toFixed(3)); });
(()=>{const main=$('mainInspector'),duration=$('duration');if(!main||!duration)return;const box=document.createElement('div');box.className='field';box.innerHTML='<label for="mgtStart">Comienzo de MGT <span class="unit">s</span></label><input id="mgtStart" type="number" min="0" max="3600" step="0.016667" value="0"><p class="hint">Duración propia de MGT. No amplía automáticamente el proyecto.</p>';duration.closest('.field')?.after(box);$('mgtStart').onchange=()=>{if(window.MGTTrackState?.locked('mgt')||busy)return;const n=$('mgtStart').valueAsNumber;if(!Number.isFinite(n)||n<0){$('mgtStart').value=mgStart;return;}mgStart=Math.round(n*60)/60;$('mgtStart').value=mgStart;showFrame(currentFrame);window.MGTTrackUI?.sync();MGTHistory?.schedule?.();tell('MGT desplazado en la línea de tiempo.');};})();
$('startMode').onclick = () => selectMode('start'); $('endMode').onclick = () => selectMode('end');
for (const id of ['x', 'y']) $(id).addEventListener('change', () => { remember();pause(); moveTo($('x').valueAsNumber, $('y').valueAsNumber); updateCoordinates(); });
$('dragHandle').addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  e.preventDefault(); $('dragHandle').focus(); $('dragHandle').setPointerCapture(e.pointerId);
  remember();
  const stop=custom?.stops?.find(s=>s.id===selectedStop);
  dragging = { id:e.pointerId,x:e.clientX,y:e.clientY,origin:stop?{x:params[stop.x],y:params[stop.y]}:{...state[mode]} };
});
$('dragHandle').addEventListener('pointermove', e => {
  if (!dragging || e.pointerId !== dragging.id) return;
  const r = $('stageBox').getBoundingClientRect();
  const x=dragging.origin.x+(e.clientX-dragging.x)/r.width*100,y=dragging.origin.y+(e.clientY-dragging.y)/r.height*100;
  if(custom)moveCustom(x,y);else moveTo(x,y);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) $('dragHandle').addEventListener(type, () => { dragging = null; });
$('dragHandle').addEventListener('keydown', e => {
  const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (delta) { e.preventDefault();remember();const step=e.shiftKey?5:.5; const stop=custom?.stops?.find(s=>s.id===selectedStop); if(stop)moveCustom(params[stop.x]+delta[0]*step,params[stop.y]+delta[1]*step);else moveTo(state[mode].x+delta[0]*step,state[mode].y+delta[1]*step); }
});
$('play').onclick = () => {
  if (playing) { pause(); return; }
  if (!ready) return;
  if(custom){selectedStop='';$('stopSelect').value='';customRect=null;}
  if (currentFrame >= frameCount() - 1) showFrame(0);
  playing = true; $('play').textContent = 'Ⅱ'; $('play').setAttribute('aria-label', 'Pausar');
  const from = currentFrame, start = performance.now();
  function tick(now) { if (!playing) return; showFrame(from + Math.floor((now - start) * 60 / 1000)); if (currentFrame >= frameCount() - 1) pause(); else raf = requestAnimationFrame(tick); }
  window.MGTAudio?.play(currentFrame/60);window.MGTEffectUI?.seek(currentFrame/60,true);
  raf = requestAnimationFrame(tick); drawGuides();
};
$('restart').onclick = () => {if(custom){pause();selectedStop='';$('stopSelect').value='';showFrame(0);}else selectMode('start');};
$('scrub').oninput = () => { pause();if(custom){selectedStop='';$('stopSelect').value='';customRect=null;} showFrame(Number($('scrub').value)); };
function setTab(code) {
  const active=code===true?'code':code==='subtitles'?'subtitle':'preview';
  for(const name of ['preview','code','subtitle']){const yes=name===active;$(name+'Panel').hidden=!yes;$(name+'Tab').classList.toggle('active',yes);$(name+'Tab').setAttribute('aria-selected',String(yes));$(name+'Tab').tabIndex=yes?0:-1;}
  if(active==='preview')requestAnimationFrame(resizeStage);
  if(active==='subtitle')window.MGTSubtitleUI?.refresh();
}
$('previewTab').onclick = () => setTab(false); $('codeTab').onclick = () => setTab(true);
for (const id of ['previewTab', 'codeTab', 'subtitleTab']) $(id).onkeydown = e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); const tabs=['previewTab','codeTab','subtitleTab'],next=(tabs.indexOf(id)+(e.key==='ArrowRight'?1:2))%3;setTab([false,true,'subtitles'][next]);$(tabs[next]).focus(); } };
$('copyCode').onclick = async () => {
  try { await navigator.clipboard.writeText($('code').value); $('copyCode').textContent = 'Copiado'; setTimeout(() => { $('copyCode').textContent = 'Copiar código'; }, 1800); }
  catch { $('code').focus(); $('code').select(); tell('Seleccioné el código. Usa Ctrl+C para copiarlo.'); }
};
new ResizeObserver(resizeStage).observe($('stageArea'));
$('zoom').oninput=()=>{fitView=false;zoomPercent=$('zoom').valueAsNumber;resizeStage();};
$('zoomNumber').onchange=()=>{const n=$('zoomNumber').valueAsNumber;if(!Number.isFinite(n)){ $('zoomNumber').value=zoomPercent;return;}fitView=false;zoomPercent=Math.max(10,Math.min(400,Math.round(n)));resizeStage();};
$('fitZoom').onclick=()=>{fitView=true;resizeStage();};
$('actualZoom').onclick=()=>{fitView=false;zoomPercent=100;resizeStage();};
$('refreshView').onclick=()=>{clearError();setTab(false);rebuild();tell('Vista reconstruida con los ajustes actuales.');};
$('cropPreview').onchange = () => { pause(); drawGuides(); };
function updateExportSize() { const [w,h]=MGTExport.dimensions(state.aspect,Number($('resolution').value));$('exportResolution').textContent=w+' × '+h; }
function updateEstimate(){const mov=$('exportFormat').value==='mov',manual=!mov&&$('quality').value==='bitrate',quick=!mov&&$('quality').value==='quick';$('bitrateControls').hidden=!manual;$('quality').disabled=mov||busy;$('quickExport').disabled=mov||busy;$('resolution').disabled=busy;$('exportFormat').disabled=busy;$('exportAlpha').disabled=busy;const b=$('bitrate').valueAsNumber;$('estimatedSize').textContent=Number.isFinite(b)&&b>=1&&b<=200?'Peso estimado: ≈ '+(b*state.duration/8).toFixed(1)+' MB. El tamaño real puede variar.':'Introduce de 1 a 200 Mbps.';$('exportModeNote').textContent=mov?'MOV ProRes 4444 conserva el canal alfa cuando la casilla está activada.':quick?'Compresión rápida a la resolución del lienzo y '+projectFps+' FPS.':'Configuración de exportación · se recuerda para la próxima sesión.';$('exportQualityLabel').textContent=(mov?'ProRes 4444':quick?'Borrador rápido':manual?'Bitrate objetivo':'Alta')+((window.MGTAudio?.id()||window.MGTEffectUI?.hasClips())?' / audio AAC':' / sin audio');$('exportFpsLabel').textContent=projectFps+' FPS';$('exportFormatLabel').textContent=mov?'MOV / ProRes 4444':'MP4 / H.264';$('workingFormat').textContent=mov?'MOV':'MP4';$('exportExtension').textContent=mov?'.mov':'.mp4';$('beginExport').textContent=mov?'Generar MOV ↗':'Generar MP4 ↗';updateExportSize();}
function rememberExport(){const raw={resolution:Number($('resolution').value),quality:$('quality').value,bitrate:$('bitrate').valueAsNumber};if(!Number.isFinite(raw.bitrate)||raw.bitrate<1||raw.bitrate>200)return;try{localStorage.setItem('mgt.export',JSON.stringify(MGTExport.normalize(raw)));}catch{tell('Ajustes aplicados; no se pudieron recordar en este navegador.',true);}}
let exportPreferences=MGTExport.defaults;try{exportPreferences=MGTExport.normalize(JSON.parse(localStorage.getItem('mgt.export')||'{}'));}catch{}
$('resolution').value=exportPreferences.resolution;$('quality').value=exportPreferences.quality;$('bitrate').value=exportPreferences.bitrate;
$('quality').onchange=()=>{updateEstimate();rememberExport();};$('bitrate').oninput=()=>{updateEstimate();rememberExport();};
$('resolution').onchange=()=>{updateExportSize();rememberExport();};
$('quickExport').onclick=()=>{$('quality').value='quick';updateEstimate();rememberExport();};
$('exportAlpha').onchange=()=>{if($('exportAlpha').checked)$('exportFormat').value='mov';updateEstimate();};
$('exportFormat').onchange=()=>{if($('exportFormat').value==='mp4'&&$('exportAlpha').checked){if(!confirm('MP4 no conserva transparencias. ¿Cambiar a MP4 y quitar la transparencia?')){$('exportFormat').value='mov';return;}$('exportAlpha').checked=false;}updateEstimate();};
updateEstimate();
$('openExport').onclick = () => {
  if(window.MGTSubtitleUI?.hasPending()&&!confirm('Hay cambios de subtítulos pendientes. ¿Exportar la composición ya aplicada sin esos cambios?'))return;
  pause(); const [w, h] = Scene.sizes[state.aspect];
  updateExportSize();updateEstimate();$('quality').disabled=false;$('bitrate').disabled=false;$('quickExport').disabled=false;
  $('exportDuration').textContent = `${Number(state.duration.toFixed(3))} s · ${Math.round(state.duration*projectFps)} fotogramas`;
  $('exportProgress').hidden = true; $('download').hidden = true; $('beginExport').hidden = false;
  $('beginExport').disabled = false; $('filename').disabled = false; $('cancelRender').hidden = true;
  $('exportDialog').showModal();
};
$('closeExport').onclick = () => { if (!busy) $('exportDialog').close(); };
$('openExportFromInspector').onclick=()=>$('openExport').click();
$('exportDialog').addEventListener('cancel', e => { if (busy) e.preventDefault(); });
async function request(url, data) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Motion-Token': info.token }, body: JSON.stringify(data) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || 'No se pudo completar la solicitud.'); return result;
}
$('saveProject').onclick=async()=>{
 if(busy||!ready||MGTTrackUI.preparing()||MGTAudio.loading()||MGTEffectUI.loading())return;
 const button=$('saveProject'),filename=($('filename').value||'Proyecto MGT').replace(/\.mgtproj$/i,'');let handle;
 button.disabled=true;
 try{
  // El selector debe abrirse durante el gesto del usuario, antes de cualquier petición.
  if(window.showSaveFilePicker){try{handle=await window.showSaveFilePicker({suggestedName:filename+'.mgtproj',types:[{description:'Proyecto MGT',accept:{'application/zip':['.mgtproj']}}],excludeAcceptAllOption:true});}catch(error){if(error.name==='AbortError')return;tell('No se pudo abrir el selector de archivos; se descargará el proyecto.');}}
  MGTHistory.flush();
  const result=await request('/api/project/save',{filename,snapshot:MGTHistory.capture(),settings:{resolution:Number($('resolution').value),quality:$('quality').value,bitrate:$('bitrate').valueAsNumber,fps:projectFps}});
  if(handle){const response=await fetch(result.url);if(!response.ok)throw Error('No se pudo recuperar el proyecto.');const writable=await handle.createWritable();await response.body.pipeTo(writable);tell('Proyecto guardado como '+handle.name+'.');}
  else{const link=document.createElement('a');link.href=result.url;link.download=result.filename+'.mgtproj';document.body.append(link);link.click();link.remove();tell('El navegador descargó '+link.download+' en su carpeta de descargas.');}
 }catch(error){if(error.name!=='AbortError')tell('No se pudo guardar el proyecto: '+error.message,true);}finally{button.disabled=false;}
};
$('openProject').onclick=()=>{if(!busy)$('projectFile').click();};
$('projectFile').onchange=async()=>{
 const file=$('projectFile').files[0];$('projectFile').value='';if(!file)return;
 if(!/\.mgtproj$/i.test(file.name)){tell('Selecciona un proyecto .mgtproj.',true);return;}
 if(hasUnsaved()&&!confirm('¿Abrir otro proyecto? Guarda antes el trabajo actual si quieres conservarlo.'))return;
 const button=$('openProject');button.disabled=true;let token=null;
 try{
  const response=await fetch('/api/project/open',{method:'POST',headers:{'Content-Type':'application/zip','X-Motion-Token':info.token},body:file});
  let result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo abrir el proyecto.');token=result.relinkToken??null;
  if(token){const dialog=$('projectRelinkDialog'),input=$('projectRelinkFile');dialog.showModal();
   try{for(const missing of result.missing){const video=missing.kind==='video';$('projectRelinkName').textContent=missing.name;$('projectRelinkStatus').textContent=video?'Selecciona el MP4 preparado para reenlazar este vídeo.':'Selecciona el WAV para reenlazar este audio.';input.accept=video?'.mp4,video/mp4':'.wav,audio/wav';input.value='';
    const replacement=await new Promise((resolve,reject)=>{const cancel=()=>{cleanup();reject(Error('Apertura cancelada.'));},choose=()=>{const chosen=input.files[0];if(!chosen)return;cleanup();resolve(chosen);},cleanup=()=>{input.removeEventListener('change',choose);$('projectRelinkCancel').removeEventListener('click',cancel);dialog.removeEventListener('cancel',cancel);};input.addEventListener('change',choose);$('projectRelinkCancel').addEventListener('click',cancel);dialog.addEventListener('cancel',cancel);});
    $('projectRelinkStatus').textContent=video?'Comprobando MP4…':'Comprobando WAV…';const relink=await fetch('/api/project/'+token+'/relink?id='+encodeURIComponent(missing.id),{method:'POST',headers:{'Content-Type':video?'video/mp4':'audio/wav','X-Motion-Token':info.token},body:replacement});const data=await relink.json();if(!relink.ok)throw Error(data.error||'No se pudo reenlazar el recurso.');
   }const complete=await request('/api/project/'+token+'/complete',{});result=complete;token=null;}finally{dialog.close();}
  }
  await MGTHistory.apply(result.snapshot);$('resolution').value=String(result.settings.resolution);projectFps=[15,24,30,60].includes(result.settings.fps)?result.settings.fps:60;
  if(['auto','quick','bitrate'].includes(result.settings.quality))$('quality').value=result.settings.quality;if(Number.isFinite(result.settings.bitrate))$('bitrate').value=result.settings.bitrate;
  syncProjectInspector();refreshLabels();updateEstimate();MGTHistory.initialize();tell('Proyecto abierto: '+file.name);
 }catch(error){if(token)await request('/api/project/'+token+'/cancel',{}).catch(()=>{});tell('No se pudo abrir el proyecto: '+error.message,true);}finally{button.disabled=false;}
};
$('beginExport').onclick = async () => {
  if (busy || window.MGTAudio?.loading()) return;
  const bitrate=$('exportFormat').value==='mp4'&&$('quality').value==='bitrate'?$('bitrate').valueAsNumber:null;
  if(bitrate!==null&&(!Number.isFinite(bitrate)||bitrate<1||bitrate>200)){ $('exportProgress').hidden=false;$('exportStatus').textContent='Introduce un bitrate de 1 a 200 Mbps.';return;}
  $('quality').disabled=true;$('bitrate').disabled=true;$('quickExport').disabled=true;rememberExport();
  busy = true; setButtons(); $('beginExport').disabled = true; $('filename').disabled = true; $('closeExport').disabled = true; $('resolution').disabled = true;
  $('exportProgress').hidden = false; $('progress').value = 0; $('exportStatus').textContent = 'Preparando la composición…'; $('cancelRender').hidden = false; $('cancelRender').disabled = false;
  renderId = null;
  try {
  const format=$('exportFormat').value,result = await request('/api/export', { scene:structuredClone(state),filename:$('filename').value,resolution:Number($('resolution').value),fps:projectFps,format,alpha:$('exportAlpha').checked,composition:custom,params,seed,bitrate:format==='mov'?null:bitrate,audioId:window.MGTAudio?.id()||null,audioSettings:MGTAudio.settings(),effects:MGTEffectUI.snapshot(),layers:{...MGTTrackUI.capture(),overlayLanes:MGTTrackUI.exportOverlayLanes(),mainDuration:mgDuration,mainStart:mgStart,mainPresent,flags:MGTTrackState.capture()},quick:format==='mp4'&&$('quality').value==='quick' }); renderId = result.id;
    for (;;) {
      const response = await fetch('/api/jobs/' + renderId); if (!response.ok) throw new Error('No se pudo consultar la exportación.');
      const job = await response.json();
      $('progress').value = job.status === 'done' ? 100 : job.completed / job.frames * 98;
      if (job.status === 'done') {
        $('exportStatus').textContent = 'Video listo. Pulsa Guardar video para elegir dónde guardarlo.';
        $('download').href = '/api/jobs/' + renderId + '/download'; $('download').download = job.filename; $('download').hidden = false; $('beginExport').hidden = true; break;
      }
      if (['error', 'cancelled'].includes(job.status)) throw new Error(job.error);
      $('exportStatus').textContent = job.status === 'preparing' ? 'Preparando la composición…' : job.status === 'encoding' ? 'Terminando de comprimir el video…' : `Generando fotograma ${job.completed} de ${job.frames}…`;
      await sleep(650);
    }
  } catch (error) { $('exportStatus').textContent = error.message; $('beginExport').textContent = 'Volver a generar'; }
  finally { busy = false;$('quality').disabled=false;$('bitrate').disabled=false;$('quickExport').disabled=false;updateEstimate();renderId = null; $('beginExport').disabled = false; $('filename').disabled = false; $('closeExport').disabled = false; $('cancelRender').hidden = true; setButtons(); checkStorageNotice(); }
};
$('cancelRender').onclick = async () => {
  if (!renderId) return;
  $('cancelRender').disabled = true;
  try { await request('/api/jobs/' + renderId + '/cancel', {}); }
  catch (error) { $('exportStatus').textContent = error.message; $('cancelRender').disabled = false; }
};
$('download').onclick = async e => {
  if (!window.showSaveFilePicker) return;
  e.preventDefault();
  try {
    const handle = await window.showSaveFilePicker({ suggestedName: $('download').download, types: [{ description: 'Video MP4', accept: { 'video/mp4': ['.mp4'] } }] });
    const response = await fetch($('download').href); if (!response.ok) throw new Error('No se pudo recuperar el video.');
    const stream = await handle.createWritable(); await response.body.pipeTo(stream);
    $('exportStatus').textContent = 'Video guardado.';
  } catch (error) { if (error.name !== 'AbortError') $('exportStatus').textContent = 'No se pudo guardar: ' + error.message; }
};
window.addEventListener('beforeunload', e => { if (busy || hasUnsaved()) { e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('message', e => {
  if (!custom || e.source !== $('scene').contentWindow || e.data?.mgt !== customChannel) return;
  if(e.data.type==='bounds'&&e.data.stopId===selectedStop){const r=e.data.rect;customRect=r&&['left','top','width','height'].every(k=>Number.isFinite(r[k])&&Math.abs(r[k])<1e7)?r:null;drawGuides();}
  if(e.data.type==='drawn'&&ready){if(pendingApply){appliedDraft=pendingApply.code;activeGalleryFile=pendingApply.galleryFile||'';if(pendingApply.fromGallery){cleanDraft=appliedDraft;savedSignature=signature();}pendingApply=null;$('codeState').textContent='Composición aplicada · el borrador conserva sus valores iniciales';setButtons();}}
  if (e.data.type === 'ready') { clearTimeout(readyTimer); ready = true;  showFrame(currentFrame); resizeStage(); requestAnimationFrame(resizeStage);setButtons(); tell('Composición aplicada. Los controles vienen de sus parámetros.'); }
  if (e.data.type === 'error') { failComposition(String(e.data.error),String(e.data.stack||'')); }
});
function remember() {
  undoSnapshot=structuredClone({params,seed,state,selectedStop});$('undo').disabled=false;
}
function syncBuiltin(){
  for(const id of ['text','font','size','background','aspect','easing'])$(id).value=state[id];$('duration').value=mgDuration;
  $('color').value=state.color.slice(0,7);$('textAlpha').value=state.color.length===9?Math.round(parseInt(state.color.slice(7),16)/255*100):100;$('textAlphaSlider').value=$('textAlpha').value;
  refreshLabels();
}
function pushParams(){
  valid=true;pause();setButtons();syncParamValues();
  if(ready)$('scene').contentWindow.postMessage({mgt:customChannel,type:'params',params,seed},'*');else rebuild();
}
function moveCustom(x,y){if(window.MGTTrackState?.locked('mgt')||busy)return;
  const stop=custom?.stops?.find(s=>s.id===selectedStop);if(!stop)return;
  const px=custom.parameters.find(p=>p.id===stop.x),py=custom.parameters.find(p=>p.id===stop.y);
  params={...params,[stop.x]:Composition.snap(px,x),[stop.y]:Composition.snap(py,y)};pushParams();
}
function syncParamValues(){
  if(!custom)return;
  for(const p of custom.parameters){
    const input=$('param-'+p.id);if(!input)continue;
    if(['model','video','gif','svgAnimation'].includes(p.type)){input.value=params[p.id];continue;}if(p.type==='image')continue;
    if(p.type==='boolean')input.checked=params[p.id];else input.value=params[p.id];
    if($('slider-'+p.id))$('slider-'+p.id).value=params[p.id];
    if(p.type==='color'){
      $('swatch-'+p.id).value=params[p.id].slice(0,7);
      $('alpha-'+p.id).value=params[p.id].length===9?Math.round(parseInt(params[p.id].slice(7),16)/255*100):100;
    }
  }
  $('seed').value=seed;refreshImageControls();
}
function buildParameterControls() {
  releaseImageThumbs();const panel=$('parameterControls');panel.replaceChildren();
  for(const p of custom.parameters){
    const field=document.createElement('div');field.className='field';
    const label=document.createElement('label');label.htmlFor='param-'+p.id;label.textContent=p.label;
    if(['model','video','gif','svgAnimation'].includes(p.type)){(p.type==='svgAnimation'?MGTAnimatedSVGControls:p.type==='gif'?MGTGIFControls:p.type==='video'?MGTVideoControls:MGTModelControls).build(p,field,custom,params,async next=>{if(imageImporting||busy||MGTTrackState.locked('mgt'))return;const checked=Composition.parse(next);MGTHistory.flush();custom=checked;params=Composition.values(checked,{...params,[p.id]:checked.parameters.find(q=>q.id===p.id).default});valid=true;setupCustomUI();pause();rebuild();MGTHistory.schedule();});panel.append(field);continue;}if(p.type==='image'){buildImageControl(p,field,label);panel.append(field);continue;}
    const input=document.createElement(['select','font'].includes(p.type)?'select':p.type==='text'?'textarea':'input');input.id=label.htmlFor;
    if(p.type==='select')for(const option of p.options)input.add(new Option(p.label==='Encuadrar medio'?({contain:'Contener',cover:'Rellenar y recortar',fill:'Estirar'})[option]??option:Object.values(custom.playback??{}).some(r=>r.end?.param===p.id)?({hold:"Conservar último fotograma",loop:"Repetir",hide:"Ocultar"})[option]:option,option));
    else if(p.type==='font'){
      if(!info.fonts.includes(params[p.id]))input.add(new Option(params[p.id]+' (no instalada)',params[p.id]));
      for(const font of info.fonts)input.add(new Option(font,font));
    }else if(p.type==='text'){input.rows=2;input.maxLength=1000;}
    else input.type=p.type==='boolean'?'checkbox':p.type==='color'?'text':p.type;
    if(p.type==='number'){input.min=p.min;input.max=p.max;input.step=p.step;}
    if(p.type==='color'){input.type='text';input.maxLength=9;input.spellcheck=false;input.placeholder='#RRGGBBAA';input.className='hex-input';}
    field.append(label);
    let before=null;
    const begin=()=>{if(!before)before=structuredClone({params,seed,state,selectedStop});};
    const change=()=>{
      if(window.MGTTrackState?.locked('mgt')||busy)return;begin();
      try{
        const next={};for(const item of custom.parameters){const ctl=$('param-'+item.id);next[item.id]=item.type==='boolean'?ctl.checked:item.type==='number'?ctl.valueAsNumber:ctl.value;}
        const checked=Composition.values(custom,next);undoSnapshot=before;$('undo').disabled=false;params=checked;pushParams();tell('Parámetros actualizados.');
      }catch(error){valid=false;pause();setButtons();tell(error.message,true);}
    };
    field.addEventListener('focusin',begin);field.addEventListener('pointerdown',begin);
    field.addEventListener('change',()=>{before=null;});field.addEventListener('focusout',e=>{if(!field.contains(e.relatedTarget))before=null;});
    input.oninput=change;
    if(p.type==='number'&&p.control==='slider'){
      const pair=document.createElement('div');pair.className='slider-pair';const slider=document.createElement('input');slider.type='range';slider.id='slider-'+p.id;slider.min=p.min;slider.max=p.max;slider.step=p.step;slider.setAttribute('aria-label',p.label);
      slider.oninput=()=>{input.value=slider.value;change();};pair.append(slider,input);field.append(pair);
    }else if(p.type==='color'){
      const pair=document.createElement('div');pair.className='alpha-color';
      const swatch=document.createElement('input');swatch.type='color';swatch.id='swatch-'+p.id;swatch.setAttribute('aria-label',p.label+' · color');
      const alpha=document.createElement('input');alpha.type='number';alpha.min=0;alpha.max=100;alpha.step=1;alpha.id='alpha-'+p.id;alpha.setAttribute('aria-label',p.label+' · opacidad en porcentaje');
      const opacityLabel=document.createElement('span');opacityLabel.textContent='Opacidad %';
      swatch.oninput=()=>{input.value=swatch.value+(input.value.length===9?input.value.slice(7):'');change();};
      alpha.oninput=()=>{const v=alpha.valueAsNumber;if(!Number.isFinite(v)||v<0||v>100){valid=false;setButtons();tell('Opacidad: de 0 a 100.',true);return;}input.value=swatch.value+Math.round(v*255/100).toString(16).padStart(2,'0');change();};
      const opaque=custom.scene3d?.objects.some(o=>o.color?.param===p.id);alpha.hidden=opacityLabel.hidden=!!opaque;if(opaque){input.maxLength=7;input.placeholder='#RRGGBB';}pair.append(swatch,input);field.append(pair,opacityLabel,alpha);
    }else field.append(input);
    panel.append(field);
  }
  if(!custom.parameters.length){const empty=document.createElement('p');empty.className='hint';empty.textContent='Esta composición no declara parámetros.';panel.append(empty);}
  MGTThreeControls.decorate(panel,custom,'param-',items=>{if(busy||pendingApply||imageImporting||MGTTrackState.locked('mgt'))return;MGTHistory.flush();pause();params=Composition.values(custom,{...params,...Object.fromEntries(items.map(p=>[p.id,p.default]))});valid=true;syncParamValues();pushParams();MGTHistory.schedule();tell('Controles del grupo restablecidos.');});
  syncParamValues();
}
function setupCustomUI(){
  $('textControls').hidden=true;$('parameterControls').hidden=false;$('useText').hidden=false;$('codeFromCurrent').disabled=false;
  $('sourceName').textContent=custom.name;$('randomControls').hidden=custom.version<2;
  $('randomize').disabled=!custom.parameters.some(p=>p.randomize);
  const stops=custom.stops??[];$('stopControls').hidden=!stops.length;
  $('stopSelect').replaceChildren(new Option('Vista previa (sin edición)',''),...stops.map(s=>new Option(s.label,s.id)));
  $('stopSelect').value=selectedStop;buildParameterControls();
}
$('stopSelect').onchange=()=>{
  pause();selectedStop=$('stopSelect').value;customRect=null;$('cropPreview').checked=false;
  const stop=custom.stops.find(s=>s.id===selectedStop);showFrame(stop?Math.round(stop.at*(frameCount()-1)):currentFrame);
};
$('undo').onclick=()=>{
  if(!undoSnapshot)return;
  const previous=undoSnapshot;({params,seed,state,selectedStop}=structuredClone({params:previous.params,seed:previous.seed,state:previous.state,selectedStop:previous.selectedStop}));if(custom&&previous.resources){custom={...custom,resources:previous.resources,parameters:custom.parameters.map(p=>p.type==='image'?{...p,default:previous.imageDefaults[p.id]}:p)};}undoSnapshot=null;$('undo').disabled=true;valid=true;
  syncBuiltin();if(custom){$('stopSelect').value=selectedStop;syncParamValues();}rebuild();tell('Último cambio deshecho.');
};
$('seed').onchange=()=>{
  try{const n=Composition.seedValue($('seed').valueAsNumber);remember();seed=n;pushParams();}
  catch(error){$('seed').value=seed;tell(error.message,true);}
};
$('newSeed').onclick=()=>{remember();seed=crypto.getRandomValues(new Uint32Array(1))[0];pushParams();};
$('randomize').onclick=()=>{remember();params=Composition.randomized(custom,params,seed);pushParams();tell('Controles aleatorizados con la semilla '+seed+'.');};
for(const el of document.querySelectorAll('#textControls input,#textControls textarea,#textControls select'))el.addEventListener('focus',()=>{if(!custom)remember();});
$('openLibrary').onclick=()=>{$('libraryDialog').showModal();loadGallery();};$('closeLibrary').onclick=()=>{$('libraryDialog').close();};
$('code').oninput = () => { draftDirty = true; $('codeState').textContent = 'Borrador editado · pulsa Agregar a pista para usarlo'; };
$('codeFromText').onclick = () => {
  if (draftDirty && !confirm('¿Reemplazar el borrador por el código de la composición de texto?')) return;
  $('code').value = JSON.stringify(Composition.fromText({...state,duration:mgDuration}), null, 2); draftDirty = true;
  $('codeState').textContent = 'Código del texto · listo para editar o aplicar'; clearError();
};
$('codeFromCurrent').onclick=()=>{
  if(!custom)return;
  if(draftDirty&&!confirm('¿Reemplazar el borrador por la composición aplicada y sus valores actuales?'))return;
  const snapshot=structuredClone(custom);snapshot.version=Math.max(2,custom?.version??2);snapshot.seed=seed;snapshot.stops??=[];
  snapshot.parameters.forEach(p=>{p.default=params[p.id];});snapshot.recommended={duration:mgDuration,aspect:state.aspect,resolution:Number($('resolution').value)};
  $('code').value=JSON.stringify(snapshot,null,2);draftDirty=true;$('codeState').textContent='Valores y semilla capturados · listo para copiar';
};
$('codeFromGLB').onclick=()=>{if(draftDirty&&!confirm('¿Reemplazar el borrador por la plantilla GLB?'))return;$('code').value=JSON.stringify(MGTModelTemplate(),null,2);draftDirty=true;$('codeState').textContent='Modelo GLB · pulsa Agregar a pista e importa el archivo desde Propiedades';clearError();};
$('codeFrom3D').onclick=()=>{if(draftDirty&&!confirm('¿Reemplazar el borrador por la escena 3D inicial?'))return;$('code').value=JSON.stringify(MGTThreeTemplate(),null,2);draftDirty=true;$('codeState').textContent='Escena 3D · pulsa Agregar a pista para usarla';clearError();};
$('applyCode').onclick=()=>applyCode();
function openOverlayCode(raw){$('overlayCode').value=raw??$('code').value;$('overlayCodeStatus').textContent='';$('overlayCodeDialog').showModal();}
$('closeOverlayCode').onclick=()=>$('overlayCodeDialog').close();$('cancelOverlayCode').onclick=()=>$('overlayCodeDialog').close();
$('confirmOverlayCode').onclick=async()=>{const status=$('overlayCodeStatus');status.textContent='Validando y colocando…';try{const ok=await window.MGTTrackUIAddCode($('overlayCode').value);if(ok!==false){$('overlayCodeDialog').close();setTab(false);tell('MGT agregado a la pista visual.');}}catch(e){status.textContent=e.message;status.classList.add('error');}};
// Both toolbar and context menu use the same lane-aware actions.
(()=>{const panel=$('tracksPanel'),heading=panel?.querySelector('.tracks-heading');if(!panel||!heading)return;
 const actions={visual:()=>window.MGTTrackUI?.addLane(),audio:()=>window.MGTEffectUI?.addLane(),image:()=>document.querySelector('.visual-image-button')?.click(),video:()=>$('baseVideoFile').click(),sound:()=>$('effectFile').click(),code:()=>openOverlayCode(),json:()=>$('overlayFile').click()};
 function invoke(id,laneId){if(busy||imageImporting||window.MGTTrackUI?.preparing()||window.MGTEffectUI?.loading())return;if(['image','video','code','json'].includes(id)&&laneId)window.MGTTrackUI?.selectLane(laneId);if(id==='sound'&&laneId)window.MGTEffectUI?.selectLane(laneId);if(!actions[id])throw Error('Acción de pista no válida.');actions[id]();}
 window.MGTAddActions={invoke};
 const menu=(buttonId,menuId,label)=>{const button=document.createElement('button');button.id=buttonId;button.type='button';button.className='secondary';button.textContent='+ '+label;button.setAttribute('aria-expanded','false');const popup=document.createElement('div');popup.id=menuId;popup.className='track-picker';popup.hidden=true;heading.append(button,popup);button.onclick=()=>{for(const other of heading.querySelectorAll('.track-picker'))if(other!==popup)other.hidden=true;popup.hidden=!popup.hidden;popup.style.left=button.offsetLeft+'px';button.setAttribute('aria-expanded',String(!popup.hidden));};return {button,popup};};
 const track=menu('addTrack','trackPicker','Agregar pista');
 [['visual','Pista visual'],['audio','Pista de audio']].forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.dataset.addTrack=id;b.textContent=label;b.onclick=()=>{track.popup.hidden=true;track.button.setAttribute('aria-expanded','false');invoke(id);};track.popup.append(b);});
 const media=menu('addMedia','mediaPicker','Agregar medio');const addChoice=(parent,id,label)=>{const b=document.createElement('button');b.type='button';b.dataset.addMedia=id;b.textContent=label;b.onclick=()=>{media.popup.hidden=true;media.button.setAttribute('aria-expanded','false');invoke(id);};parent.append(b);return b;};
 addChoice(media.popup,'image','Imagen');addChoice(media.popup,'video','Vídeo');addChoice(media.popup,'sound','Audio');const mgtGroup=document.createElement('div');mgtGroup.className='context-submenu';const mgtTrigger=document.createElement('button');mgtTrigger.type='button';mgtTrigger.textContent='MGT  ›';mgtTrigger.setAttribute('aria-haspopup','menu');mgtTrigger.onclick=()=>mgtGroup.classList.toggle('open');mgtTrigger.onmouseenter=()=>mgtGroup.classList.add('open');const mgtChoices=document.createElement('div');mgtChoices.className='context-submenu-popup';addChoice(mgtChoices,'json','Desde JSON');addChoice(mgtChoices,'code','Desde código');mgtGroup.append(mgtTrigger,mgtChoices);media.popup.append(mgtGroup);
 media.button.addEventListener('click',()=>{const audio=window.MGTTrackEdit?.selected()?.track==='effects';for(const b of media.popup.querySelectorAll('[data-add-media]'))b.hidden=audio?b.dataset.addMedia!=='sound':b.dataset.addMedia==='sound';mgtGroup.hidden=audio;});
 document.addEventListener('click',e=>{for(const {button,popup} of [track,media])if(!popup.contains(e.target)&&e.target!==button){popup.hidden=true;button.setAttribute('aria-expanded','false');}});
 document.addEventListener('keydown',e=>{if(e.key!=='Delete'||e.target.closest('input,textarea,select,[contenteditable=true]')||document.querySelector('dialog[open]'))return;const pick=window.MGTTrackUI?.selected();if(pick&&!window.MGTTrackState?.locked(pick)){e.preventDefault();window.MGTTrackUI.remove(pick);tell('Clip visual eliminado.');}});
 const inspector=$('overlayInspector');if(inspector&&!$('overlayMiniPreview')){const box=document.createElement('div');box.id='overlayMiniPreview';box.className='overlay-mini-preview';box.innerHTML='<span>Vista previa del clip</span>';inspector.querySelector('#overlayName')?.after(box);const name=$('overlayName');new MutationObserver(()=>{const id=window.MGTTrackUI?.selected?.(),c=window.MGTTrackUI?.snapshot?.().find(x=>x.id===id);if(!c){box.querySelector('iframe')?.remove();return;}const old=box.querySelector('iframe');old?.remove();const iframe=document.createElement('iframe');iframe.setAttribute('sandbox','allow-scripts');iframe.srcdoc=Composition.documentHTML(c.document,{width:320,height:180,duration:c.sourceFrames/60,background:'transparent',workspace:true,overlay:true,params:c.params,seed:c.seed});iframe.onload=()=>iframe.contentWindow.postMessage({type:'frame',frame:c.inFrame+Math.max(0,currentFrame-c.start)},'*');box.append(iframe);}).observe(name,{childList:true,characterData:true,subtree:true});}
})();
async function applyCode(){if(window.MGTTrackState?.locked(window.MGTTrackUI?.selectedLane())||busy||imageImporting||pendingApply){showError('Espera a que termine la operación actual o desbloquea la pista visual.');return;}try{await window.MGTTrackUIAddCode($('code').value);draftDirty=false;clearError();$('codeState').textContent='MGT agregado a la pista visual.';tell('MGT agregado a la pista visual.');setTab(false);}catch(e){showError(e.message);}}
$('useText').onclick=()=>{if(!mainPresent||window.MGTTrackState?.locked('mgt'))return;window.MGTHistory?.flush();mainPresent=false;pause();showFrame(currentFrame);window.MGTTrackUI?.sync();window.MGTHistory?.schedule();tell('MGT eliminado. La pista quedó vacía.');};
let starting=false,startupComplete=false;
async function init(){
 if(starting||startupComplete)return;starting=true;$('retryStartup').hidden=true;$('startupNotice').hidden=false;
 let connected=false;
 try{
  for(let attempt=0;attempt<5;attempt++){
   $('startupMessage').textContent=attempt?'Esperando al motor local…':'Preparando MGT…';
   try{const response=await fetch('/api/info',{signal:AbortSignal.timeout(4000)});if(!response.ok)throw Error('Motor no disponible');const next=await response.json();if(!Array.isArray(next.fonts)||!next.fonts.length)throw Error('Respuesta incompleta');info=next;connected=true;break;}catch(error){if(attempt===4)throw error;await sleep(600);}
  }
  $('font').replaceChildren(...info.fonts.map(name=>new Option(name,name)));
  document.querySelector('.brand small').textContent='ESTUDIO LOCAL · '+info.version;
  $('tracksPanel').setAttribute('aria-label','Pistas visuales y de audio');$('tracksStatus').textContent='Arrastra medios a pistas visuales o de audio.';$('codeState').textContent='Código y parámetros · composición MGT para agregar como medio visual';
  $('overlaysNotice').textContent=info.version+' · los clips se detienen al tocar otro medio de su pista. Guarda el proyecto completo como .mgtproj.';
  $('settingsDialog').querySelectorAll('section h3')[1].textContent='MGT '+info.version;
  $('welcomeDialog').querySelector('.dialog-intro').textContent='MGT '+info.version+' · animaciones con código generado por IA.';
  if(!info.fonts.includes(state.font))state.font=info.fonts[0];$('font').value=state.font;$('font').disabled=false;
  custom=null;params={};$('code').value='';$('mainInspector').hidden=true;$('generalInspector').hidden=false;await rebuild();cleanDraft=$('code').value;savedSignature=signature();window.MGTHistory?.initialize();initialized=true;startupComplete=true;
  $('startupNotice').hidden=true;maybeWelcome();checkStorageNotice();tell(info.ready?'Todo se procesa en tu equipo.':'Falta el motor de exportación. Revisa las rutas de config.json.',!info.ready);
 }catch(error){$('startupMessage').textContent=connected?'No se pudo preparar la interfaz. Puedes reintentar sin cerrar MGT.':'No se pudo conectar con el motor local. Puedes reintentar sin cerrar MGT.';$('retryStartup').hidden=false;tell($('startupMessage').textContent,true);}
 finally{starting=false;}
}
$('retryStartup').onclick=init;void init();

// MGT 0.9.6: compact tracks, contextual editing and overlay preview.
function signature(){return JSON.stringify({custom,mainPresent,params,seed,state,resolution:$('resolution').value});}
function hasUnsaved(){return Boolean(window.MGTTrackUI?.hasClips())||Boolean(window.MGTEffectUI?.hasClips())||Boolean(window.MGTAudio?.id())||Boolean(window.MGTSubtitleUI?.isUnsaved())||initialized&&(signature()!==savedSignature||$('code').value!==cleanDraft);}
function clearError(){$('codeError').textContent='';$('errorPanel').hidden=true;}
function showError(message,stack=''){
  let text=String(message).slice(0,1600),fragment='';
  const match=stack.match(/mgt-render\.js:(\d+):(\d+)/);
  if(match){const line=Math.max(1,Number(match[1])-3);text+='\nrender · línea '+line+', columna '+match[2];try{const lines=JSON.parse($('code').value).render.split('\n');fragment=lines.slice(Math.max(0,line-2),line+1).map((v,i)=>(Math.max(0,line-2)+i+1)+': '+v).join('\n');}catch{}}
  else {const pos=text.match(/position (\d+)/i);if(pos){const n=Number(pos[1]),before=$('code').value.slice(0,n).split('\n');text+='\nJSON · línea '+before.length+', columna '+(before.at(-1).length+1);fragment=$('code').value.split('\n')[before.length-1]?.slice(0,300)||'';}}
  $('codeError').textContent=text+(fragment?'\n\n'+fragment:'');$('errorPanel').hidden=false;tell('Revisa el panel de errores.',true);
}
function failComposition(message,stack=''){
  clearTimeout(readyTimer);ready=false;pause();setButtons();
  const previous=pendingApply?.previous,wasImported=pendingApply?.imported;pendingApply=null;
  if(previous){({custom,params,seed,state,mgDuration,mgStart,mainPresent,selectedStop,currentFrame,mode,appliedDraft,activeGalleryFile}=previous);$('resolution').value=previous.resolution;customRect=null;valid=true;syncBuiltin();
    if(custom)setupCustomUI();else{ $('textControls').hidden=false;$('parameterControls').hidden=true;$('useText').hidden=true;$('stopControls').hidden=true;$('randomControls').hidden=true;$('codeFromCurrent').disabled=true;$('sourceName').textContent='Composición de texto';}
    rebuild();$('codeState').textContent='No se aplicó el borrador. Se recuperó la composición anterior.';
  }
  showError(message+(wasImported?'\nEl archivo quedó agregado a la galería, pero no se aplicó.':''),stack);
}
async function copyText(text){await navigator.clipboard.writeText(text);}
$('copyError').onclick=async()=>{try{await copyText('MGT '+(info?.version||'desconocida')+'\n'+$('codeError').textContent);tell('Error copiado.');}catch{tell('No se pudo copiar. Selecciona el texto del error y usa Ctrl+C.',true);}};
$('dismissError').onclick=clearError;
$('pasteCode').onclick=async()=>{
  try{const text=await navigator.clipboard.readText();if(!text){tell('El portapapeles está vacío.');return;}if(draftDirty&&$('code').value.trim()&&!confirm('¿Reemplazar el borrador actual por el portapapeles?'))return;$('code').value=text;$('code').oninput();clearError();}
  catch{showError('No se pudo leer el portapapeles. Pulsa dentro del editor y usa Ctrl+V.');}
};
$('clearCode').onclick=()=>{if(confirm('¿Vaciar el editor de código? La composición aplicada se conserva.')){$('code').value='';$('code').oninput();clearError();$('code').focus();}};
const promptMenu=$('promptMenu'),promptButton=$('copyPrompt');
function closePromptMenu(){if(!promptMenu)return;promptMenu.hidden=true;promptButton?.setAttribute('aria-expanded','false');}
function togglePromptMenu(){if(!promptMenu)return;promptMenu.hidden=!promptMenu.hidden;promptButton.setAttribute('aria-expanded',String(!promptMenu.hidden));if(!promptMenu.hidden)promptMenu.querySelector('button')?.focus();}
async function copySpecializedPrompt(kind,statusId='promptStatus'){
  const item=window.MGTPrompts?.[kind]||window.MGTPrompts?.general;
  if(!item){$(statusId).textContent='No hay prompts disponibles.';return;}
  try{const response=await fetch(item.endpoint);if(!response.ok)throw Error('No se pudo leer el prompt.');await copyText(await response.text());$(statusId).textContent=item.label+' copiado. Pégalo en tu IA y añade tu solicitud al final.';tell(item.label+' copiado.');}
  catch(e){$(statusId).textContent='No se pudo copiar. Puedes abrir Código > Copiar prompt y volver a intentarlo.';if(statusId==='promptStatus')showError(e.message+' Puedes abrir /prompt y copiarlo manualmente.');}
  closePromptMenu();
}
promptButton?.addEventListener('click',togglePromptMenu);
promptMenu?.addEventListener('click',e=>{const button=e.target.closest('[data-prompt]');if(button)copySpecializedPrompt(button.dataset.prompt);});
document.addEventListener('click',e=>{if(promptMenu&&!promptMenu.hidden&&!e.target.closest('.prompt-picker'))closePromptMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!promptMenu?.hidden)closePromptMenu();});
function selectedEffectClip(){const id=window.MGTTrackUI?.selected?.();return [...(window.MGTTrackUI?.snapshot?.()??[]),...(window.MGTMGTModel?.snapshot?.()??[])].find(c=>c.id===id)||null;}
function captureEffect(clip=null){
  if(clip){const snapshot=structuredClone(clip.document);snapshot.seed=clip.seed;snapshot.parameters.forEach(p=>{p.default=clip.params[p.id];});snapshot.recommended={...snapshot.recommended,duration:clip.frames/60,aspect:state.aspect,resolution:Number($('resolution').value)};snapshot.editorSettings={...snapshot.editorSettings,background:state.background};return snapshot;}
  let original={};if(custom)try{original=JSON.parse(appliedDraft);}catch{}
  const snapshot=custom?{...original,...structuredClone(custom),...(original.metadata?{metadata:{...original.metadata,...custom.metadata}}:{})}:Composition.fromText({...state,duration:mgDuration});snapshot.version=Math.max(2,custom?.version??2);snapshot.seed=seed;snapshot.stops??=[];
  if(custom)snapshot.parameters.forEach(p=>{p.default=params[p.id];});
  snapshot.recommended={duration:mgDuration,aspect:state.aspect,resolution:Number($('resolution').value)};
  snapshot.editorSettings={background:state.background};return snapshot;
}
let savingEffectClip=null;
$('saveEffect').onclick=()=>{
  savingEffectClip=selectedEffectClip();
  if((!ready||!valid)&&!savingEffectClip||pendingApply||imageImporting){showError('Aplica o selecciona una composición válida antes de guardarla.');return;}
  $('saveKind').value='composition';$('effectName').value=savingEffectClip?.document.name||custom?.name||'Texto en movimiento';$('saveStatus').textContent='';
  $('saveNotice').textContent=(savingEffectClip?'Se guardará únicamente el clip seleccionado. ':'Se guardará la composición principal. ')+'Para conservar toda la línea de tiempo y el audio usa «Guardar proyecto». Se crea una copia nueva; no se sobrescribe ningún archivo.'+(!savingEffectClip&&draftDirty&&$('code').value!==appliedDraft?' El borrador sin aplicar NO se guarda.':'');
  $('saveDialog').showModal();$('effectName').focus();
};
$('cancelSave').onclick=()=>$('saveDialog').close();
$('confirmSave').onclick=async()=>{
  const name=$('effectName').value.trim();if(!name){$('saveStatus').textContent='Escribe un nombre.';return;}
  $('confirmSave').disabled=true;
  try{const effect=captureEffect(savingEffectClip);effect.name=name;const isTemplate=$('saveKind').value==='template';if(isTemplate&&effect.subtitles)effect.subtitles=MGTSubtitles.asTemplate(effect.subtitles);if(isTemplate&&effect.version>=3){effect.resources={};effect.parameters.forEach(p=>{if(p.type==='image')p.default='';});}const sig=signature(),draft=$('code').value;const result=await request('/api/gallery/save',{composition:effect});if(!isTemplate&&!savingEffectClip){savedSignature=sig;activeGalleryFile=result.file;}
    if(!isTemplate&&!savingEffectClip&&(!draftDirty||draft===appliedDraft))cleanDraft=draft;
    $('saveDialog').close();tell('Guardado en galeria/'+result.file);
  }catch(e){$('saveStatus').textContent='No se pudo guardar: '+e.message;}
  finally{$('confirmSave').disabled=false;}
};
async function galleryCode(file){const response=await fetch('/api/gallery/item?file='+encodeURIComponent(file));const data=await response.json();if(!response.ok)throw Error(data.error);return data.code;}
async function loadGallery(){
  $('libraryStatus').textContent='Leyendo galería…';
  try{const response=await fetch('/api/gallery');if(!response.ok)throw Error('No se pudo leer la galería.');const data=await response.json();galleryItems=data.items;galleryErrors=data.errors;renderGallery();}
  catch(e){$('libraryStatus').textContent=e.message;}
}
function renderGallery(){
  $('libraryList').replaceChildren();const query=$('gallerySearch').value.trim().toLocaleLowerCase();
  const shown=galleryItems.filter(item=>item.name.toLocaleLowerCase().includes(query));
  for(const item of [...shown,...galleryErrors.map(e=>({...e,name:e.file,invalid:true}))]){
    const row=document.createElement('div');row.className='gallery-row';const title=document.createElement('div'),strong=document.createElement('strong'),detail=document.createElement('small');strong.textContent=item.name;
    detail.textContent=item.invalid?'No válido: '+item.error:(item.author||'Autor no declarado')+' · '+(item.license||'Licencia no declarada')+' · '+(item.images?item.images+' imágenes incrustadas':'Sin imágenes');const filename=document.createElement('small');filename.textContent=item.file;title.append(strong,detail,filename);
    const actions=document.createElement('div');
    const choices=item.invalid?[]:[['Agregar a MGT',async()=>{if(pendingApply)throw Error('Espera a que termine de aplicarse la composición.');const code=await galleryCode(item.file);$('code').value=code;draftDirty=true;$('libraryDialog').close();applyCode(true,item.file);}],['Copiar código',async()=>{await copyText(await galleryCode(item.file));$('libraryStatus').textContent='Código copiado.';}]];
    if(!item.invalid)choices.push(['Descargar JSON',async()=>{const code=await galleryCode(item.file),url=URL.createObjectURL(new Blob([code],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=item.file;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}]);
    choices.push(['Eliminar',async()=>{if(!confirm('¿Eliminar «'+item.name+'» de la galería?\nSe elimina esta copia. El archivo original importado y la escena abierta se conservan.'))return;await request('/api/gallery/delete',{file:item.file,confirm:true});if(activeGalleryFile===item.file){savedSignature='';activeGalleryFile='';}await loadGallery();$('libraryStatus').textContent='Efecto eliminado de la galería.';}]);
    for(const [label,action]of choices){const button=document.createElement('button');button.className='secondary';button.textContent=label;button.onclick=async()=>{button.disabled=true;try{await action();}catch(e){$('libraryStatus').textContent=e.message;}finally{button.disabled=false;}};actions.append(button);}
    row.append(title,actions);$('libraryList').append(row);
  }
  $('libraryStatus').textContent=(galleryItems.length?shown.length+' de '+galleryItems.length+' efectos.':'Galería vacía. Agrega un archivo o guarda un efecto.')+(galleryErrors.length?' '+galleryErrors.length+' archivos no válidos.':'');
}
$('refreshLibrary').onclick=loadGallery;
const preferenceDefaults={theme:'dark',accent:'purple',uiSize:'normal'};
function applyPreferences(persist=true){
  const theme=$('theme').value,accent=$('accent').value,uiSize=$('uiSize').value;
  document.documentElement.dataset.theme=theme;document.documentElement.dataset.accent=accent;document.documentElement.dataset.size=uiSize;
  if(persist)try{localStorage.setItem('mgt.appearance',JSON.stringify({theme,accent,uiSize}));}catch{tell('La apariencia se aplicó, pero no se pudo recordar en este navegador.');}
  requestAnimationFrame(resizeStage);
}
let preferences=preferenceDefaults;try{preferences={...preferenceDefaults,...JSON.parse(localStorage.getItem('mgt.appearance')||'{}')};}catch{}
for(const id of ['theme','accent','uiSize']){$(id).value=preferences[id];if(!$(id).value)$(id).value=preferenceDefaults[id];$(id).onchange=()=>applyPreferences();}
applyPreferences(false);
$('openSettings').onclick=()=>{$('settingsDialog').showModal();refreshStorage();};$('closeSettings').onclick=()=>$('settingsDialog').close();
$('resetSettings').onclick=()=>{for(const id of ['theme','accent','uiSize'])$(id).value=preferenceDefaults[id];applyPreferences();};
function syncProjectInspector(){$('projectDuration').value=Number(state.duration.toFixed(3));$('projectAspect').value=state.aspect;$('projectFps').value=String(projectFps);$('projectBackground').value=state.background;$('projectCanvasSize').textContent=MGTExport.dimensions(state.aspect,Number($('resolution').value)).join(' × ')+' px';}
$('projectDuration').onchange=()=>{try{const duration=$('projectDuration').valueAsNumber;if(!Number.isFinite(duration)||duration<.1||duration>3600)throw Error('La duración debe estar entre 0,1 y 3600 segundos.');state=Scene.normalize({...state,duration});currentFrame=Math.min(currentFrame,frameCount()-1);refreshLabels();rebuild();window.MGTHistory?.schedule();}catch(e){tell(e.message,true);}syncProjectInspector();};
$('projectAspect').onchange=()=>{state=Scene.normalize({...state,aspect:$('projectAspect').value});refreshLabels();rebuild();window.MGTHistory?.schedule();syncProjectInspector();};
$('projectFps').onchange=()=>{const next=Number($('projectFps').value);if(![15,24,30,60].includes(next))return;window.MGTHistory?.flush();projectFps=next;showFrame(currentFrame);refreshLabels();updateEstimate();window.MGTHistory?.schedule();tell('Proyecto configurado a '+next+' FPS. Los clips conservan su duración y velocidad.');};
$('projectBackground').oninput=()=>{state=Scene.normalize({...state,background:$('projectBackground').value});$('stageBox').style.background=state.background;refreshLabels();showFrame(currentFrame);window.MGTHistory?.schedule();syncProjectInspector();};
const canvasDialog=document.createElement('dialog');canvasDialog.id='canvasDialog';canvasDialog.innerHTML='<div class="dialog-heading"><h2>Configurar lienzo</h2><button id="closeCanvas" class="secondary" type="button">Cerrar</button></div><p>Proporción, duración y fondo se editan en Ajustes generales.</p><label for="canvasResolution">Resolución de salida</label><select id="canvasResolution"></select><p id="projectCanvasSize" class="hint"></p>';document.body.append(canvasDialog);$('canvasResolution').replaceChildren(...[...$('resolution').options].map(o=>new Option(o.textContent,o.value)));$('openCanvas').onclick=()=>{$('canvasResolution').value=$('resolution').value;syncProjectInspector();canvasDialog.showModal();};$('closeCanvas').onclick=()=>canvasDialog.close();$('canvasResolution').onchange=()=>{$('resolution').value=$('canvasResolution').value;updateEstimate();syncProjectInspector();window.MGTHistory?.schedule();};syncProjectInspector();

// Importing never executes a composition; only Apply starts its render function.
$('gallerySearch').oninput=renderGallery;
$('importFile').onclick=()=>{$('importInput').value='';$('importInput').click();};
$('importInput').onchange=async()=>{
 const file=$('importInput').files[0];if(!file)return;
 try{if(!/\.json$/i.test(file.name))throw Error('Selecciona un archivo .json o .mgt.json.');if(file.size>MGTAssets.limits.json)throw Error('El archivo supera 36 MB.');
  const code=(await file.text()).replace(/^\uFEFF/,'');const parsed=JSON.parse(code),validated=Composition.parse(parsed);new Function('ctx',validated.render);
  importedCode=code;$('importSummary').textContent=validated.name+'\n'+(parsed.metadata?.author||'Autor no declarado')+' · '+(parsed.metadata?.license||'Licencia no declarada');$('importStatus').textContent='JSON validado. El código todavía no se ha ejecutado.';
  $('libraryDialog').close();$('importDialog').showModal();
 }catch(e){$('libraryStatus').textContent='No se agregó el archivo: '+e.message;}
};
function cancelImport(){importedCode='';$('importDialog').close();$('libraryDialog').showModal();}
$('cancelImport').onclick=cancelImport;
$('importDialog').addEventListener('cancel',e=>{if($('addOnly').disabled){e.preventDefault();return;}e.preventDefault();cancelImport();});
async function importEffect(apply){
 if(pendingApply){$('importStatus').textContent='Espera a que termine de aplicarse la composición.';return;}
 if(apply&&hasUnsaved()&&!confirm('¿Agregar y aplicar este efecto, reemplazando el trabajo actual sin guardar?'))return;
 $('addOnly').disabled=true;$('addApply').disabled=true;$('cancelImport').disabled=true;
 try{const result=await request('/api/gallery/import',{code:importedCode});importedCode='';$('importDialog').close();
  if(apply){$('code').value=result.code;draftDirty=true;applyCode(true,result.file,true);}
  else{$('libraryDialog').showModal();await loadGallery();$('libraryStatus').textContent='Efecto agregado. La composición actual no cambió.';}
 }catch(e){$('importStatus').textContent='No se pudo agregar: '+e.message;}
 finally{$('addOnly').disabled=false;$('addApply').disabled=false;$('cancelImport').disabled=false;}
}
$('addOnly').onclick=()=>importEffect(false);$('addApply').onclick=()=>importEffect(true);
async function copyPromptInto(status){await copySpecializedPrompt('general',status);}
function welcomeHidden(){try{return localStorage.getItem('mgt.hideWelcome')==='true';}catch{return false;}}
function maybeWelcome(){if(!welcomeHidden()){$('hideWelcome').checked=false;$('welcomeDialog').showModal();}}
function closeWelcome(){try{localStorage.setItem('mgt.hideWelcome',String($('hideWelcome').checked));}catch{}$('welcomeDialog').close();}
$('welcomePrompt').onclick=()=>copyPromptInto('welcomeStatus');$('closeWelcome').onclick=closeWelcome;$('startWelcome').onclick=closeWelcome;
$('welcomeDialog').addEventListener('cancel',e=>{e.preventDefault();closeWelcome();});
$('showWelcome').onclick=()=>{$('settingsDialog').close();$('hideWelcome').checked=welcomeHidden();$('welcomeStatus').textContent='';$('welcomeDialog').showModal();};
function formatBytes(n){return n>=1e9?(n/1e9).toFixed(2)+' GB':n>=1e6?(n/1e6).toFixed(1)+' MB':Math.ceil(n/1000)+' KB';}
async function readStorage(){const r=await fetch('/api/storage');if(!r.ok)throw Error('No se pudo consultar el espacio.');return r.json();}
async function refreshStorage(){
 $('cleanStorage').disabled=true;$('storageStatus').textContent='Consultando…';
 try{storageSnapshot=await readStorage();$('storageStatus').textContent=storageSnapshot.count+' copias · '+formatBytes(storageSnapshot.bytes)+(storageSnapshot.busy?' · Espera a que terminen la exportación y las descargas.':'');$('cleanStorage').disabled=!storageSnapshot.count||storageSnapshot.busy;}
 catch(e){storageSnapshot=null;$('storageStatus').textContent=e.message;}
}
$('refreshStorage').onclick=refreshStorage;
$('cleanStorage').onclick=async()=>{
 if(!storageSnapshot||storageSnapshot.busy)return;
 const files=storageSnapshot.files.map(f=>f.name);
 if(!confirm('¿Eliminar '+storageSnapshot.count+' copias internas ('+formatBytes(storageSnapshot.bytes)+')?\nLos videos que NO hayas guardado en otra ubicación se perderán.\nLa galería y los archivos guardados fuera de esta carpeta no se borran. Esta acción no se puede deshacer.'))return;
 $('cleanStorage').disabled=true;
 try{const result=await request('/api/storage/clean',{files,confirm:true});await refreshStorage();$('storageStatus').textContent+='\nEliminadas: '+result.deleted.length+' · Liberado: '+formatBytes(result.bytes)+(result.failed.length?' · No se pudieron eliminar '+result.failed.length+' archivos. Puedes volver a intentarlo.':'');
 if(result.deleted.some(f=>$('download').getAttribute('href')?.includes(f.replace(/\.mp4$/,'')))){$('download').hidden=true;$('beginExport').hidden=false;}
 $('storageNotice').hidden=true;
 }catch(e){await refreshStorage();$('storageStatus').textContent=e.message;}
};
async function checkStorageNotice(){if(storageNoticeShown)return;try{const s=await readStorage();if(s.bytes>=s.thresholdBytes){storageNoticeShown=true;$('storageNoticeText').textContent='Copias internas de exportaciones: '+formatBytes(s.bytes)+'. Puedes liberar espacio en Ajustes.';$('storageNotice').hidden=false;}}catch{}}
$('dismissStorageNotice').onclick=()=>$('storageNotice').hidden=true;
$('manageStorage').onclick=()=>{$('settingsDialog').showModal();refreshStorage();};
$('copyDiagnostics').onclick=async()=>{
 const location=$('codeError').textContent.match(/(?:render|JSON) · línea \d+, columna \d+/)?.[0];
 const diagnostic=['MGT '+(info?.version||'desconocida'),'Plataforma: Windows x64','FPS de exportación: '+projectFps,'Vista: '+($('codePanel').hidden?'Escenario':'Código'),'Estado: '+(busy?'Exportación activa':pendingApply?'Aplicando composición':ready?'Vista preparada':'Vista no preparada'),'Panel de errores: '+($('errorPanel').hidden?'sin error visible':'error visible; copiar por separado si deseas compartirlo'),...(location?['Ubicación: '+location]:[])].join('\n');
 try{await copyText(diagnostic);$('diagnosticStatus').textContent='Diagnóstico copiado: no incluye tu código, texto, nombres de archivos ni rutas personales. Puedes adjuntarlo al reportar un error.';}catch{$('diagnosticStatus').textContent='No se pudo copiar el diagnóstico.';}
};



$('codeFromVideo').onclick=()=>{if(busy||pendingApply||imageImporting||MGTTrackState.locked('mgt'))return;if(draftDirty&&!confirm('¿Reemplazar el borrador actual por la plantilla MP4?'))return;setTab(true);$('code').value=JSON.stringify(MGTVideoTemplate(),null,2);draftDirty=true;tell('Aplica el código y carga el MP4 en sus propiedades.');};

$('codeFromGIF').onclick=()=>{if(busy||pendingApply||imageImporting||MGTTrackState.locked('mgt'))return;if(draftDirty&&!confirm('¿Reemplazar el borrador actual por la plantilla GIF?'))return;setTab(true);$('code').value=JSON.stringify(MGTGIFTemplate(),null,2);draftDirty=true;tell('Aplica el código y carga el GIF en sus propiedades.');};

$('codeFromSVG').onclick=()=>{if(busy||pendingApply||imageImporting||MGTTrackState.locked('mgt'))return;if(draftDirty&&!confirm('¿Reemplazar el borrador actual por la plantilla SVG animado?'))return;setTab(true);$('code').value=JSON.stringify(MGTAnimatedSVGTemplate(),null,2);draftDirty=true;tell('Aplica el código y carga el SVG animado en sus propiedades.');};
