// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
(()=>{
 const S=window.MGTSubtitles;
 let template=null,content=null,dirty=false,unsaved=false,page=0,library=[],libraryDocs=new Map(),libraryMode=localStorage.getItem('mgt-sub-library-mode')==='list'?'list':'grid',observed=null,queue=Promise.resolve(),templateDirty=false,useCurrent=false,importSettings=null,applying=false,activeLibraryFile=null,originLibraryFile=null,previewTimer=null,previewPlaying=false,previewDocument=null,previewStart=0;
 const status=(message,error=false)=>{$('subStatus').textContent=message;$('subStatus').classList.toggle('error',error);};
 function syncState(){const pending=dirty||templateDirty,ready=Boolean(template&&content?.cues.length);$('subState').textContent=applying?'Aplicando composición…':pending?(content?.cues.length?'Borrador cargado · sin aplicar':'Plantilla o borrador sin aplicar'):window.MGTTrackUI?.hasSubtitles()?'Pista de subtítulos aplicada':'Sin contenido aplicado';$('subState').dataset.pending=String(pending);$('subtitleTab').textContent=pending?'Subtítulos · sin aplicar':'Subtítulos';$('subApply').disabled=applying||!ready;$('subApply').textContent=applying?'Aplicando…':ready?'Aplicar subtítulos':!template?'Selecciona un preset y carga subtítulos':'Carga subtítulos para aplicar';$('subSaveTemplate').disabled=!template||Boolean(activeLibraryFile);$('subUpdateTemplate').disabled=!template||!originLibraryFile;$('subPresetState').textContent=template?(activeLibraryFile?'En biblioteca':originLibraryFile?'Modificado · sin guardar':'Importado · no guardado'):'Ninguno';$('subPresetState').classList.toggle('muted',!template||Boolean(activeLibraryFile));$('subPresetHint').textContent=template?(activeLibraryFile?'Preset guardado en la biblioteca.':originLibraryFile?'Puedes actualizar el preset o guardar una copia nueva.':'Esta animación aún no está guardada en la biblioteca.'):'El preset activo aparecerá aquí.';renderPreview();}
 const changed=()=>{dirty=true;unsaved=true;syncState();};
 const attempt=fn=>()=>{queue=queue.then(async()=>{try{await fn();}catch(e){status(e.message,true);showError(e.message);}finally{applying=false;syncState();}});return queue;};
 function templateSnapshot(){if(!template)throw Error('Selecciona o importa una plantilla.');const t=structuredClone(template);const clip=window.MGTTrackUI?.subtitle();if(useCurrent&&clip?.document.render===t.render){for(const p of t.parameters)if(Object.hasOwn(clip.params,p.id))p.default=Composition.value(p,clip.params[p.id]);t.resources=structuredClone(clip.document.resources||{});}return t;}
 function normalize(raw){const migrated=S.legacy(raw),parsed=Composition.parse(migrated);new Function('ctx',parsed.render);return {...migrated,...parsed,...(raw.metadata?{metadata:{...raw.metadata,...parsed.metadata}}:{})};}
 function choose(raw,origin=null){const parsed=normalize(raw);template={...parsed,subtitles:S.asTemplate(parsed.subtitles)};delete template.editorSettings;activeLibraryFile=origin?.file??null;originLibraryFile=origin?.file??null;previewDocument=null;templateDirty=false;useCurrent=false;$('subTemplateName').textContent=template.name;$('subTemplateCode').value=JSON.stringify(template,null,2);changed();summary();}
 function renderPreview(){
  const frame=$('subPreviewFrame'),ready=Boolean(template);
  for(const id of ['subPreviewPlay','subPreviewPause','subPreviewRestart','subPreviewScrub'])$(id).disabled=!ready;
  if(!ready){frame.replaceChildren(Object.assign(document.createElement('div'),{className:'subtitle-preview-empty',textContent:'Selecciona una animación para previsualizarla.'}));$('subPresetThumb').textContent='—';$('subPreviewDuration').textContent='0.00 s';return;}
  if(previewDocument!==template){
   previewDocument=template;previewPlaying=false;cancelAnimationFrame(previewTimer);$('subPreviewState').textContent='Detenida';
   const cue=content?.cues[Number($('subPreviewCue').value)||0];
   const sample=cue?{start:0,end:Math.max(.6,Math.min(3,cue.end-cue.start)),text:cue.text}:{start:0,end:2.5,text:'Vista previa de subtítulos'};
   const subtitles=S.estimate(S.validate({...template.subtitles,kind:'composition',timing:'cue',cues:[sample]}));
   const doc={...template,subtitles},duration=S.duration(subtitles),params=Composition.values(template);
   $('subPreviewScrub').max=duration;$('subPreviewScrub').value=0;$('subPreviewDuration').textContent=duration.toFixed(2)+' s';$('subPreviewTime').textContent='0.00 s';
   for(const [host,w,h,key]of [[frame,640,360,'subtitle-preview'],[$('subPresetThumb'),640,360,'subtitle-thumb']]){
    const iframe=document.createElement('iframe');iframe.setAttribute('sandbox','allow-scripts');iframe.style.cssText='width:640px;height:360px;max-width:none;flex:none;transform:scale('+Math.min(host.clientWidth/640,host.clientHeight/360)+');transform-origin:top left';
    iframe.srcdoc=Composition.documentHTML(doc,{width:w,height:h,duration,background:'#121820',workspace:false,params,seed:template.seed??1},key);
    host.replaceChildren(iframe);iframe.onload=()=>iframe.contentWindow?.postMessage({mgt:key,type:'frame',frame:0},'*');
   }
  }
  frame.querySelector('iframe')?.contentWindow?.postMessage({mgt:'subtitle-preview',type:'frame',frame:Math.round(Number($('subPreviewScrub').value||0)*60)},'*');
 }
 function previewSet(seconds){const duration=Number($('subPreviewScrub').max)||0;$('subPreviewScrub').value=Math.min(duration,Math.max(0,seconds));$('subPreviewTime').textContent=Number($('subPreviewScrub').value).toFixed(2)+' s';renderPreview();}
 function previewTick(now){if(!previewPlaying)return;const duration=Number($('subPreviewScrub').max)||0,next=(now-previewStart)/1000;if(next>=duration){previewSet(0);previewPlaying=false;$('subPreviewState').textContent='Terminada';return;}previewSet(next);previewTimer=requestAnimationFrame(previewTick);}
 function summary(){const count=content?.cues.length||0;const words=content?.cues.reduce((n,c)=>n+(c.words?.length||0),0)||0;const end=content?.cues.reduce((n,c)=>Math.max(n,c.end),0)||0;const selected=$('subPreviewCue').value;$('subPreviewCue').replaceChildren(...(count?content.cues.map((c,i)=>new Option((i+1)+' · '+c.text.slice(0,32),String(i))):[new Option('Ejemplo','0')]));$('subPreviewCue').value=selected&&Number(selected)<count?selected:'0';previewDocument=null;
  $('subSummary').textContent=count?`${count} bloques · ${words} palabras con tiempos · final ${end.toFixed(3)} s · ${content.timing==='word'?'tiempos por palabra importados':content.timing==='estimated'?'tiempos por palabra aproximados':'tiempos por bloque'}`:'Sin subtítulos cargados.';
  if($('subFit').checked&&count)$('subDuration').value=S.duration({...content,tail:template?.subtitles.tail??.25});$('subDuration').disabled=$('subFit').checked;$('subEstimate').disabled=!count||content.timing!=='cue';renderCues();syncState();
 }
 function renderCues(){const all=content?.cues||[],pages=Math.max(1,Math.ceil(all.length/20));page=Math.min(page,pages-1);$('subPageLabel').textContent=`${page+1} / ${pages}`;$('subPrevious').disabled=page===0;$('subNext').disabled=page===pages-1;$('subCueList').replaceChildren();
  all.slice(page*20,page*20+20).forEach((cue,offset)=>{const index=page*20+offset,row=document.createElement('div');row.className='sub-cue';const title=document.createElement('strong');title.textContent='Bloque '+(index+1);
   const text=document.createElement('textarea');text.value=cue.text;text.maxLength=4000;text.rows=2;text.setAttribute('aria-label','Texto del bloque '+(index+1));
   const start=document.createElement('input'),end=document.createElement('input');for(const [el,name,value]of [[start,'Inicio',cue.start],[end,'Final',cue.end]]){el.type='number';el.min=0;el.max=3600;el.step=.001;el.value=value;el.setAttribute('aria-label',name+' del bloque '+(index+1));}
   const save=document.createElement('button');save.className='secondary';save.textContent='Actualizar bloque';save.onclick=attempt(()=>{
    const next=structuredClone(content),s=start.valueAsNumber,e=end.valueAsNumber,old=next.cues[index],entry={start:s,end:e,text:text.value.trim()};
    if(old.words&&entry.text===old.text){entry.words=old.words.map(w=>({...w,start:s+(w.start-old.start)*(e-s)/(old.end-old.start),end:s+(w.end-old.start)*(e-s)/(old.end-old.start)}));entry.words[entry.words.length-1].end=Math.min(e,entry.words.at(-1).end);}
    else if(old.words&&!confirm('Al cambiar el texto se quitarán los tiempos por palabra de este bloque. Podrás estimarlos de nuevo. ¿Continuar?'))return;
    next.cues[index]=entry;next.cues.sort((a,b)=>a.start-b.start);if(!next.cues.every(c=>c.words))next.timing='cue';content=S.validate(next);changed();summary();status('Bloque actualizado. Aplica los subtítulos para verlo.');
   });
   const jump=document.createElement('button');jump.className='secondary';jump.textContent='Ir al tiempo';jump.onclick=()=>{pause();setTab(false);showFrame(Math.min(frameCount()-1,Math.round(cue.start*60)));if(dirty)tell('Vista de la composición aplicada. Aplica los cambios pendientes para verlos.');};
   for(const el of [text,start,end])el.oninput=()=>{changed();row.dataset.edited='true';};
   row.append(title,text,start,end,save,jump);$('subCueList').append(row);
  });
 }
 function ensureRows(){if($('subCueList').querySelector('[data-edited="true"]'))throw Error('Pulsa «Actualizar bloque» antes de continuar con los cambios de texto o tiempos.');if(templateDirty)throw Error('Pulsa «Usar este JSON» antes de continuar con los cambios de plantilla.');}
 function compose(){ensureRows();if(!content?.cues.length)throw Error('Carga subtítulos antes de continuar.');const doc=templateSnapshot();doc.subtitles=S.validate({...content,kind:'composition',tail:doc.subtitles.tail});if(!doc.subtitles.cues.every(c=>c.words)&&/ctx\.subtitles\.words\b/.test(doc.render))throw Error('Esta plantilla Wordline necesita tiempos por palabra. Usa «Estimar tiempos por palabra» o una plantilla por frases.');const duration=$('subFit').checked?S.duration(doc.subtitles):$('subDuration').valueAsNumber;MGTTracks.frames(duration);$('subDuration').value=duration;
  doc.recommended={duration,aspect:importSettings?.aspect??state.aspect,resolution:importSettings?.resolution??Number($('resolution').value)};doc.editorSettings={background:'transparent'};doc.seed=window.MGTTrackUI?.subtitle()?.seed??doc.seed??1;Composition.parse(doc);return doc;
 }
 function download(doc,name){const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=(name||doc.name).replace(/[^\p{L}\p{N} _.-]/gu,'').slice(0,100)+'.wmgt.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 async function readFile(input,max){const file=input.files[0];input.value='';if(!file)return null;if(file.size>max)throw Error('El archivo supera el límite de '+Math.round(max/1000000)+' MB.');return {name:file.name,text:S.decode(await file.arrayBuffer())};}
 function confirmReplace(){ensureRows();return !content?.cues.length||confirm('¿Reemplazar los subtítulos cargados en esta pestaña? Guarda una composición si quieres conservarlos.');}
 async function loadLibrary(){
  const response=await fetch('/api/subtitles');if(!response.ok)throw Error('No se pudo leer la biblioteca.');
  const data=await response.json();library=data.items;
  $('subLibraryStatus').textContent=library.length+' plantillas.'+(data.errors.length?' '+data.errors.length+' archivos no válidos: '+data.errors.map(e=>e.file+': '+e.error).join('; '):'');
  libraryDocs=new Map();
  await Promise.all(library.map(async item=>{try{const result=await fetch('/api/subtitles/item?file='+encodeURIComponent(item.file));if(result.ok)libraryDocs.set(item.file,JSON.parse((await result.json()).code));}catch{}}));
  if(template){const signature=JSON.stringify(Composition.parse(template));const match=library.find(item=>{const doc=libraryDocs.get(item.file);return doc&&JSON.stringify(Composition.parse(doc))===signature;})?.file??null;activeLibraryFile=match;if(match)originLibraryFile=match;else if(originLibraryFile&&!library.some(x=>x.file===originLibraryFile))originLibraryFile=null;}
  else{activeLibraryFile=null;originLibraryFile=null;}
  renderLibrary();syncState();
 }
 function libraryThumbnail(doc){const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;canvas.className='sub-library-thumbnail';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Miniatura de '+doc.name);const ctx=canvas.getContext('2d');const gradient=ctx.createLinearGradient(0,0,320,180);gradient.addColorStop(0,'#15202c');gradient.addColorStop(1,'#29384a');ctx.fillStyle=gradient;ctx.fillRect(0,0,320,180);ctx.fillStyle='#ffffff18';ctx.fillRect(0,126,320,54);const color=doc.parameters?.find(p=>p.type==='color'&&/text|color|font/i.test(p.id+' '+p.label))?.default||'#ffffff';ctx.fillStyle=/^#[0-9a-f]{6}$/i.test(color)?color:'#ffffff';ctx.textAlign='center';ctx.font='600 21px sans-serif';ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.fillText('Ejemplo de subtítulos',160,149,285);ctx.shadowBlur=0;return canvas;}
 function renderLibrary(){const q=$('subSearch').value.toLocaleLowerCase();$('subLibraryCount').textContent=library.length+' presets';$('subLibraryList').dataset.view=libraryMode;$('subLibraryList').replaceChildren();for(const item of library.filter(x=>x.name.toLocaleLowerCase().includes(q))){const row=document.createElement('div');row.className='gallery-row';row.classList.toggle('selected',item.file===activeLibraryFile);const label=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent=item.name;detail.textContent=(item.author||'Autor no declarado')+' · '+(item.license||'Licencia no declarada');label.append(name,detail);const buttons=document.createElement('div');
   const read=async()=>{const response=await fetch('/api/subtitles/item?file='+encodeURIComponent(item.file));const data=await response.json();if(!response.ok)throw Error(data.error);return JSON.parse(data.code);};
   for(const [text,fn]of [
    ['Usar',async()=>{ensureRows();choose(await read(),item);status('Preset activo seleccionado. Tus subtítulos se conservan.');}],
    ['Descargar',async()=>download(await read())],
    ['Renombrar copia',async()=>{const value=prompt('Nombre de la nueva copia:',item.name);if(!value?.trim())return;const doc=await read();doc.name=value.trim();await request('/api/subtitles/save',{composition:doc});await loadLibrary();status('Copia guardada. La plantilla anterior se conserva.');}],
    ['Eliminar',async()=>{if(!confirm('¿Eliminar «'+item.name+'» de la biblioteca? La escena y el archivo original se conservan.'))return;await request('/api/subtitles/delete',{file:item.file,confirm:true});await loadLibrary();status('Plantilla eliminada.');}]
   ]){const b=document.createElement('button');b.className='secondary';b.textContent=text;b.onclick=attempt(fn);buttons.append(b);}const doc=libraryDocs.get(item.file);if(doc)row.append(libraryThumbnail(doc));row.append(label,buttons);$('subLibraryList').append(row);}
 }
 function refresh(){const clip=window.MGTTrackUI?.subtitle(),parsed=clip?{...clip.document,parameters:clip.document.parameters.map(p=>({...p,default:clip.params[p.id]}))}:custom?.subtitles?captureEffect():null;if(parsed&&!dirty){template={...parsed,subtitles:S.asTemplate(parsed.subtitles)};content=structuredClone(parsed.subtitles);activeLibraryFile=null;originLibraryFile=null;previewDocument=null;observed=clip?.document??custom;useCurrent=Boolean(clip);importSettings=null;$('subTemplateName').textContent=template.name;$('subTemplateCode').value=JSON.stringify(template,null,2);if(clip){$('subFit').checked=false;$('subDuration').value=clip.frames/60;}summary();}loadLibrary().catch(e=>status(e.message,true));}
 const heading=$('subtitlePanel').querySelector('.subtitle-heading');heading.append($('subApply'));$('subApply').classList.add('sub-header-apply');
 const libraryHeading=$('subLibraryModule').querySelector('.sub-module-heading'),viewButtons=document.createElement('div');viewButtons.className='sub-library-view-buttons';for(const [mode,label]of [['grid','Mosaicos'],['list','Lista']]){const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=label;button.setAttribute('aria-pressed',String(libraryMode===mode));button.onclick=()=>{libraryMode=mode;localStorage.setItem('mgt-sub-library-mode',mode);for(const b of viewButtons.children)b.setAttribute('aria-pressed',String(b===button));renderLibrary();};viewButtons.append(button);}libraryHeading.append(viewButtons);
 $('subtitleTab').onclick=()=>setTab('subtitles');$('subPreview').onclick=()=>setTab(false);
 $('subImportTemplate').onclick=()=>$('subTemplateFile').click();
 $('subPreviewCue').onchange=()=>{previewDocument=null;renderPreview();};
 $('subPreviewPlay').onclick=()=>{if(!template)return;previewPlaying=true;previewStart=performance.now()-Number($('subPreviewScrub').value)*1000;$('subPreviewState').textContent='Reproduciendo';cancelAnimationFrame(previewTimer);previewTimer=requestAnimationFrame(previewTick);};$('subPreviewPause').onclick=()=>{previewPlaying=false;$('subPreviewState').textContent='Pausada';cancelAnimationFrame(previewTimer);};$('subPreviewRestart').onclick=()=>{previewPlaying=false;$('subPreviewState').textContent='Detenida';cancelAnimationFrame(previewTimer);previewSet(0);};$('subPreviewScrub').oninput=()=>{previewPlaying=false;$('subPreviewState').textContent='Detenida';previewSet(Number($('subPreviewScrub').value));};
 $('subTemplateFile').onchange=attempt(async()=>{ensureRows();const file=await readFile($('subTemplateFile'),36000000);if(!file)return;const doc=normalize(JSON.parse(file.text));if(doc.subtitles.kind!=='template')throw Error('Este archivo contiene subtítulos. Cárgalo desde «Cargar SRT, VTT o WMGT».');choose(doc);status('Animación importada. Puedes previsualizarla y agregarla a la biblioteca.');});
 $('subUseCode').onclick=attempt(()=>{if($('subCueList').querySelector('[data-edited="true"]'))throw Error('Actualiza los bloques editados primero.');const doc=normalize(JSON.parse($('subTemplateCode').value));if(doc.subtitles.kind!=='template')throw Error('El JSON de plantilla no debe contener transcripción.');choose(doc,originLibraryFile?{file:originLibraryFile}:null);activeLibraryFile=null;loadLibrary().catch(e=>status(e.message,true));status('Animación preparada. Puedes actualizar el preset o guardar una copia nueva.');});
 $('subTemplateCode').oninput=()=>{templateDirty=true;changed();};
 $('subSaveTemplate').onclick=attempt(async()=>{ensureRows();const doc=templateSnapshot(),name=prompt('Nombre de la plantilla:',doc.name);if(!name?.trim())return;doc.name=name.trim();doc.subtitles=S.asTemplate(doc.subtitles);const saved=await request('/api/subtitles/save',{composition:doc});template=doc;previewDocument=null;activeLibraryFile=saved.file;originLibraryFile=saved.file;$('subTemplateName').textContent=doc.name;await loadLibrary();syncState();status('Preset agregado a la biblioteca.');});
 $('subUpdateTemplate').onclick=attempt(async()=>{ensureRows();if(!originLibraryFile)throw Error('Este preset aún no está en la biblioteca.');if(!confirm('¿Actualizar el preset de la biblioteca? Se reemplazará la versión guardada.'))return;const previous=originLibraryFile,doc=templateSnapshot();doc.subtitles=S.asTemplate(doc.subtitles);const saved=await request('/api/subtitles/save',{composition:doc});try{await request('/api/subtitles/delete',{file:previous,confirm:true});}catch(e){status('Se guardó una copia nueva, pero no se pudo eliminar la anterior: '+e.message,true);}activeLibraryFile=saved.file;originLibraryFile=saved.file;await loadLibrary();syncState();status('Preset actualizado en la biblioteca.');});
 $('subDownloadTemplate').onclick=attempt(()=>{ensureRows();download({...templateSnapshot(),subtitles:S.asTemplate(template.subtitles)},template.name+'-plantilla');});
 $('subImportContent').onclick=()=>$('subContentFile').click();
 async function importContent(file){
  if(!file)return;ensureRows();if(!confirmReplace()){status('Importación descartada. Se conservan los subtítulos anteriores.');return;}let importedAudio=null;let next,doc,warnings=[],wav=/\.wav$/i.test(file.name),mp4=/\.mp4$/i.test(file.name),media=wav||mp4,label=mp4?'MP4':'WAV';
  if(media){
   if(!info)throw Error('Espera a que MGT termine de iniciar.');
   if(file.size>(mp4?8*1024*1024*1024:3600*192000+17*1024*1024))throw Error(mp4?'El MP4 supera 8 GiB.':'El WAV supera el tamaño admitido por MGT (hasta 60 minutos).');
   const retainAudio=confirm(mp4?'¿Extraer el audio de este MP4 y cargarlo en el escenario?\nEl vídeo no se añade. Si eliges No, solo se recuperarán los metadatos de subtítulos compatibles.':'¿Cargar este WAV también en la pista de audio del escenario?\nSi eliges No, solo se recuperarán los metadatos de subtítulos.');
   const result=await MGTAudio.upload(file,()=>new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();xhr.open('POST','/api/subtitles/'+(mp4?'mp4':'wav')+(retainAudio?'?audio=1':''));xhr.setRequestHeader('X-Audio-Name',encodeURIComponent(file.name));xhr.setRequestHeader('X-Motion-Token',info.token);xhr.setRequestHeader('Content-Type',mp4?'video/mp4':'audio/wav');xhr.responseType='json';xhr.timeout=mp4?600000:300000;
    xhr.upload.onprogress=e=>status(e.lengthComputable?'Leyendo '+label+' · '+Math.round(e.loaded/e.total*100)+' %':'Leyendo '+label+'…');
    xhr.upload.onload=()=>status(mp4&&retainAudio?'Validando metadatos y extrayendo el audio…':'Validando y recuperando los subtítulos del '+label+'…');
    xhr.onload=()=>xhr.status===200?resolve(xhr.response):reject(Error(xhr.response?.error||'No se pudo importar el '+label+'.'));
    xhr.onerror=()=>reject(Error('Se interrumpió la conexión al importar el '+label+'.'));xhr.ontimeout=()=>reject(Error('La importación del '+label+' agotó el tiempo de espera.'));xhr.send(file);
   }));next=result.subtitles?S.validate(result.subtitles):null;warnings=result.warnings;importedAudio=result.audio||null;
   if(mp4&&!next){if(importedAudio){await MGTAudio.accept(importedAudio);$('subFit').checked=false;}status('Audio extraído del MP4 y cargado en el escenario. '+warnings.join(' '));return;}
  }else{
   if(file.size>36000000)throw Error('El archivo supera 36 MB.');const text=S.decode(await file.arrayBuffer());
   if(/\.json$/i.test(file.name)){doc=normalize(JSON.parse(text));if(doc.subtitles.kind!=='composition'||!doc.subtitles.cues.length)throw Error('Es una plantilla vacía. Impórtala en la sección Plantilla.');next=doc.subtitles;}
   else{if(!/\.(srt|vtt)$/i.test(file.name))throw Error('Usa archivos SRT, VTT, WMGT JSON o WAV de Wordline.');const result=S.parseText(text,file.name.split('.').pop().toLowerCase());next=result.subtitles;warnings=result.warnings;}
  }
  importSettings=doc?{...doc.recommended,...(doc.editorSettings?.background&&/^#[0-9a-f]{6}$/i.test(doc.editorSettings.background)?{background:doc.editorSettings.background}:{})}:null;
  if(doc)choose(doc);content=next;if(doc?.recommended?.duration){$('subFit').checked=false;$('subDuration').value=doc.recommended.duration;}page=0;changed();summary();
  if(importedAudio){await MGTAudio.accept(importedAudio);$('subFit').checked=false;}
  status((media?'Subtítulos recuperados del '+label+'. Copia independiente cargada, sin aplicar. ':'Subtítulos cargados. ')+warnings.join(' '));
 }
 $('subContentFile').onchange=()=>{const file=$('subContentFile').files[0];$('subContentFile').value='';return attempt(()=>importContent(file))();};
 const drop=$('subContentDrop');drop.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';};
 drop.ondrop=e=>{e.preventDefault();e.stopPropagation();const files=[...e.dataTransfer.files];return attempt(()=>{if(files.length!==1)throw Error('Arrastra un solo archivo de subtítulos o WAV.');return importContent(files[0]);})();};
 $('subEstimate').onclick=attempt(()=>{ensureRows();if(!content)throw Error('Carga subtítulos.');if(!confirm('Se repartirán las palabras dentro de cada bloque según su longitud. Es una aproximación, no una sincronización con el audio. ¿Continuar?'))return;content=S.estimate(content);changed();summary();status('Tiempos aproximados preparados; se conservan los tiempos individuales que ya existían.');});
 $('subShift').onclick=attempt(()=>{ensureRows();if(!content)throw Error('Carga subtítulos.');content=S.shift(content,$('subOffset').valueAsNumber);$('subOffset').value=0;changed();summary();status('Tiempos desplazados. Aplica los cambios.');});
 $('subClear').onclick=attempt(()=>{if(!confirmReplace())return;content=null;changed();summary();status('Contenido quitado de esta pestaña. La escena aplicada se conserva.');});
 $('subFit').onchange=()=>{changed();summary();};$('subDuration').oninput=()=>{$('subFit').checked=false;changed();};
 $('subApply').onclick=attempt(async()=>{
  if(pendingApply||imageImporting||!info)throw Error('Espera a que termine la operación actual.');const doc=compose();

  applying=true;syncState();pause();await MGTTrackUI.applySubtitles(doc);
  content=structuredClone(doc.subtitles);dirty=false;unsaved=true;observed=MGTTrackUI.subtitle()?.document;useCurrent=true;importSettings=null;setTab(false);status('Subtítulos aplicados como clip visual y visibles en el escenario.');
 });
 $('subDownload').onclick=attempt(()=>{const doc=compose();download(doc);unsaved=false;status('Composición WMGT descargada con plantilla, textos, tiempos y ajustes.');});
 $('subPrevious').onclick=attempt(()=>{ensureRows();page--;renderCues();});$('subNext').onclick=attempt(()=>{ensureRows();page++;renderCues();});$('subSearch').oninput=renderLibrary;$('subRefreshLibrary').onclick=attempt(loadLibrary);
 window.MGTSubtitleUI={controls:syncState,refresh,isUnsaved:()=>unsaved,hasPending:()=>dirty||templateDirty};summary();
})();
