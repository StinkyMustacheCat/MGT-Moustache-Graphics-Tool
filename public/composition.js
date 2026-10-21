// SPDX-License-Identifier: GPL-3.0-or-later
(function (root) {
  'use strict';
  const Assets = typeof module !== 'undefined' && module.exports ? require('./assets.js') : root.MGTAssets;
  const Subtitles = typeof module !== 'undefined' && module.exports ? require('./subtitles.js') : root.MGTSubtitles;
  const Three = typeof module !== 'undefined' && module.exports ? require('./three.js') : root.MGTThree;
  const Models=typeof module!=='undefined'&&module.exports?require('./models.js'):root.MGTModels;const Engine=typeof module!=='undefined'&&module.exports?require('./glb-engine.js'):root.MGTGLBEngineSource;
  const Videos=typeof module!=='undefined'&&module.exports?require('./videos.js'):root.MGTVideos;
  const Gifs=typeof module!=='undefined'&&module.exports?require('./gifs.js'):root.MGTGIFs;
  const Svg=typeof module!=='undefined'&&module.exports?require('./animated-svg.js'):root.MGTAnimatedSVG;
  function mediaTime(time,duration,rule,params){const end=rule?.end,mode=end&&typeof end==='object'?params[end.param]:end??'hold',t=Math.max(0,time);if(mode==='hide'&&t>=duration-1e-9)return null;if(mode==='loop'){const v=t%duration;return Math.abs(v-duration)<1e-9||v<1e-9?0:v;}return Math.min(t,Math.max(0,duration-1e-7));}
  const types = ['svgAnimation','gif','video','model','image', 'text', 'number', 'color', 'boolean', 'select', 'font'];
  function randomAt(seed, index) {
    let n = ((seed >>> 0) ^ Math.imul((index >>> 0) + 1, 0x9e3779b1)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x21f0aaad);
    n = Math.imul(n ^ (n >>> 15), 0x735a2d97);
    return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
  }
  function seedValue(v) { if (!Number.isInteger(v) || v < 0 || v > 4294967295) throw new Error('La semilla debe ser un entero entre 0 y 4294967295.'); return v; }
  function snap(p, n) { return Math.max(p.min, Math.min(p.max, Number((p.min + Math.round((n-p.min)/p.step)*p.step).toFixed(10)))); }
  function randomized(c, current, seed) {
    seedValue(seed); const result = { ...current };
    c.parameters.forEach((p, i) => {
      if (!p.randomize) return;
      const r = randomAt(seed, i);
      if (p.type === 'number') result[p.id] = snap(p, p.min + r*(p.max-p.min));
      if (p.type === 'boolean') result[p.id] = r >= .5;
      if (p.type === 'select') result[p.id] = p.options[Math.floor(r*p.options.length)];
      if (p.type === 'color') result[p.id] = '#' + Math.floor(r*16777216).toString(16).padStart(6,'0') + (current[p.id].length === 9 ? current[p.id].slice(7) : '');
    });
    return result;
  }
  function value(p, v) {
    const fail = () => { throw new Error('Valor no válido para «' + p.label + '».'); };
    if (['image','model','video','gif','svgAnimation'].includes(p.type) && (typeof v !== 'string' || (v !== '' && !/^[A-Za-z][\w-]{0,79}$/.test(v)))) fail();
    if (p.type === 'number' && (typeof v !== 'number' || !Number.isFinite(v) || v < p.min || v > p.max)) fail();
    if (p.type === 'text' && (typeof v !== 'string' || v.length > 1000)) fail();
    if (p.type === 'color' && (typeof v !== 'string' || !/^#[a-f0-9]{6}([a-f0-9]{2})?$/i.test(v))) fail();
    if (p.type === 'font' && (typeof v !== 'string' || !v.trim() || v.length > 160)) fail();
    if (p.type === 'boolean' && typeof v !== 'boolean') fail();
    if (p.type === 'select' && !p.options.includes(v)) fail();
    return v;
  }
  function parse(input) {
    let c = input;
    if(typeof c==='string'&&new TextEncoder().encode(c).length>Assets.limits.json)throw Error('El JSON supera 36 MB.');
    if (typeof c === 'string') { try { c = JSON.parse(c); } catch { throw new Error('El código debe ser un documento JSON MGT válido. Usa «Código del texto» como ejemplo.'); } }
    if (!c || ![1,2,3,4].includes(c.version)) throw new Error('Se requiere una composición MGT con version: 1, 2, 3 o 4.');
    if(c.scene3d!==undefined&&c.version!==4)throw Error('La escena 3D requiere version: 4.');
    const {resources:ignoredResources,models:ignoredModels,videos:ignoredVideos,gifs:ignoredGifs,animatedSVGs:ignoredSVGs,...codeOnly}=c;if(new TextEncoder().encode(JSON.stringify(codeOnly)).length>Assets.limits.code)throw Error('El código y los metadatos sin imágenes superan 8 MB.');
    if (typeof c.name !== 'string' || !c.name.trim() || c.name.length > 100) throw new Error('Indica un nombre de composición (máximo 100 caracteres).');
    for (const key of ['html', 'css', 'render']) if (typeof c[key] !== 'string' || c[key].length > 2000000) throw new Error(key + ' debe ser texto de hasta 2 000 000 caracteres.');
    if (!Array.isArray(c.parameters) || c.parameters.length > 48) throw new Error('Declara de 0 a 48 parámetros.');
    if (c.version < 3 && (c.resources !== undefined || c.parameters.some(p=>p?.type==='image'))) throw Error('Las imágenes requieren version: 3.');
    const resources=c.version>=3?Assets.validate(c.resources??{}):{};
    if(c.parameters.some(p=>p.type==='model')&&c.version!==4)throw Error('GLB requiere version:4.');const models=Models.validate(c.models??{});if(Object.keys(models).length&&c.version!==4)throw Error('GLB requiere version:4.');if(Object.values(models).reduce((n,a)=>n+a.bytes,0)+Object.values(resources).reduce((n,a)=>n+a.data.length*3/4,0)>25000000)throw Error('Recursos de la composición superan 25 MB.');if(Object.keys(models).length&&c.version!==4)throw Error('GLB requiere version:4.');if(Object.values(models).reduce((n,a)=>n+a.bytes,0)+Object.values(resources).reduce((n,a)=>n+a.data.length*3/4,0)>25000000)throw Error('Recursos de la composición superan 25 MB.');if(Object.keys(models).length&&c.version!==4)throw Error('GLB requiere version:4.');if(Object.values(models).reduce((n,a)=>n+a.bytes,0)+Object.values(resources).reduce((n,a)=>n+a.data.length*3/4,0)>25000000)throw Error('Recursos de la composición superan 25 MB.');const videos=Videos.validate(c.videos??{});if((c.videos!==undefined||c.parameters.some(p=>p.type==='video'))&&c.version!==4)throw Error('Los vídeos requieren version:4.');if(Object.values(videos).reduce((n,a)=>n+a.bytes,0)+Object.values(models).reduce((n,a)=>n+a.bytes,0)+Object.values(resources).reduce((n,a)=>n+a.data.length*3/4,0)>25000000)throw Error('Recursos de la composición superan 25 MB.');const gifs=Gifs.validate(c.gifs??{});if((c.gifs!==undefined||c.parameters.some(p=>p.type==='gif'))&&c.version!==4)throw Error('GIF requiere version:4.');if([...Object.values(resources),...Object.values(models),...Object.values(videos),...Object.values(gifs)].reduce((n,a)=>n+(a.bytes??a.data.length*3/4),0)>25000000)throw Error('Recursos de la composición superan 25 MB.');const animatedSVGs=Svg.validate(c.animatedSVGs??{});if((c.animatedSVGs!==undefined||c.parameters.some(p=>p.type==='svgAnimation'))&&c.version!==4)throw Error('SVG animado requiere version:4.');if([...Object.values(resources),...Object.values(models),...Object.values(videos),...Object.values(gifs),...Object.values(animatedSVGs)].reduce((n,a)=>n+(a.bytes??a.data.length*3/4),0)>25000000)throw Error('Recursos de la composición superan 25 MB.');const ids = new Set();
    const parameters = c.parameters.map(p => {
      if (!p || !/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(p.id) || ['constructor','prototype','__proto__'].includes(p.id) || ids.has(p.id)) throw new Error('Los identificadores de parámetros deben ser únicos y usar letras, números o guion bajo.');
      ids.add(p.id);
      if (!types.includes(p.type)) throw new Error('Tipo de parámetro no admitido: ' + String(p.type));
      if (typeof p.label !== 'string' || !p.label.trim() || p.label.length > 80) throw new Error('Cada parámetro necesita una etiqueta de hasta 80 caracteres.');
      const out = { id: p.id, label: p.label, type: p.type };
      if (p.control !== undefined && (p.type !== 'number' || !['slider','number'].includes(p.control))) throw new Error('Solo los números admiten control: slider o number.');
      if (p.control) out.control = p.control;
      if (p.randomize !== undefined && typeof p.randomize !== 'boolean') throw new Error('randomize debe ser true o false.');
      if (p.randomize && !['number','color','boolean','select'].includes(p.type)) throw new Error('No se aleatorizan textos ni fuentes.');
      out.randomize = p.randomize === true;
      if (p.type === 'number') {
        if (![p.min, p.max, p.step].every(Number.isFinite) || p.min >= p.max || p.step <= 0) throw new Error('«' + p.label + '» requiere min < max y step > 0.');
        Object.assign(out, { min: p.min, max: p.max, step: p.step });
      }
      if (p.type === 'select') {
        if (!Array.isArray(p.options) || !p.options.length || p.options.length > 30 || p.options.some(o => typeof o !== 'string' || o.length > 100) || new Set(p.options).size !== p.options.length) throw new Error('Opciones no válidas para «' + p.label + '».');
        out.options = [...p.options];
      }
      out.default = value(out, p.default);
      if(p.type==='svgAnimation'&&out.default&&!Object.hasOwn(animatedSVGs,out.default))throw Error('SVG animado no encontrado: '+p.label);if(p.type==='gif'&&out.default&&!Object.hasOwn(gifs,out.default))throw Error('GIF no encontrado: '+p.label);if(p.type==='video'&&out.default&&!Object.hasOwn(videos,out.default))throw Error('Vídeo no encontrado: '+p.label);if(p.type==='model'&&out.default&&!Object.hasOwn(models,out.default))throw Error('Modelo no encontrado: '+p.label);if(p.type==='image'&&out.default&&!Object.hasOwn(resources,out.default))throw Error('Recurso no encontrado para «'+p.label+'».');
      return out;
    });
    if (c.version === 1 && (c.stops || c.recommended || c.metadata || c.seed !== undefined || parameters.some(p=>p.type==='font'||p.control||p.randomize||p.type==='color'&&p.default.length===9))) throw new Error('Estas funciones requieren version: 2.');
    const stops = c.stops ?? [];
    if (!Array.isArray(stops) || stops.length > 24) throw new Error('Declara hasta 24 paradas.');
    const stopIds = new Set();
    const validatedStops = stops.map(s => {
      if (!s || typeof s.id !== 'string' || !/^[a-zA-Z][\w-]{0,39}$/.test(s.id) || stopIds.has(s.id)) throw new Error('Cada parada necesita un id único.');
      stopIds.add(s.id);
      if (typeof s.label !== 'string' || !s.label.trim() || s.label.length > 80 || typeof s.element !== 'string' || !/^#[a-zA-Z][\w-]{0,79}$/.test(s.element)) throw new Error('La parada necesita label y element con un selector #id.');
      if (!Number.isFinite(s.at) || s.at < 0 || s.at > 1 || s.x === s.y || ![s.x,s.y].every(id=>parameters.some(p=>p.id===id&&p.type==='number'))) throw new Error('La parada necesita at entre 0 y 1 y parámetros numéricos X/Y distintos (en %).');
      return { id:s.id, label:s.label, element:s.element, x:s.x, y:s.y, at:s.at };
    });
    let recommended;
    if (c.recommended !== undefined) {
      const r = c.recommended;
      if (!r || typeof r !== 'object' || Array.isArray(r)) throw new Error('recommended debe ser un objeto.');
      if (r.duration !== undefined && (!Number.isFinite(r.duration)||r.duration<.1||r.duration>3600)) throw new Error('Duración recomendada fuera de rango.');
      if (r.aspect !== undefined && !['horizontal','vertical','square','classic'].includes(r.aspect)) throw new Error('Proporción recomendada no válida.');
      if (r.resolution !== undefined && ![480,540,720,1080,1440,2160].includes(r.resolution)) throw new Error('Resolución recomendada no válida.');
      recommended = Object.fromEntries(['duration','aspect','resolution'].filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
    }
    let metadata;
    if (c.metadata !== undefined) {
      if (!c.metadata || typeof c.metadata !== 'object' || Array.isArray(c.metadata)) throw new Error('metadata debe ser un objeto.');
      metadata = {};
      for (const key of ['id','description','category','author','license','templateVersion','thumbnail']) {
        const v=c.metadata[key]; if(v===undefined||v===null)continue;
        if(typeof v!=='string'||v.length>(key==='description'?1000:200))throw new Error('Metadato no válido: '+key);
        metadata[key]=v;
      }
      if(c.metadata.tags!==undefined) {
        if(!Array.isArray(c.metadata.tags)||c.metadata.tags.length>20||c.metadata.tags.some(t=>typeof t!=='string'||t.length>50))throw new Error('Etiquetas no válidas.');
        metadata.tags=[...c.metadata.tags];
      }
    }
    const subtitles=c.subtitles===undefined?undefined:Subtitles.validate(c.subtitles);
    if(subtitles&&c.version<3)throw Error('Los subtítulos requieren version: 3 o 4.');
    const scene3d=c.scene3d===undefined?undefined:Three.validate(c.scene3d,parameters);
    if(scene3d)for(const o of scene3d.objects)if(o.type==='model'&&typeof o.resource==='string'&&o.resource&&!models[o.resource])throw Error('Modelo no encontrado: '+o.resource);if(scene3d)for(const o of scene3d.objects)if(o.type==='model'&&typeof o.resource==='string'&&o.resource&&!models[o.resource])throw Error('Modelo no encontrado: '+o.resource);if(scene3d)for(const o of scene3d.objects)if(o.type==='model'&&typeof o.resource==='string'&&o.resource&&!models[o.resource])throw Error('Modelo no encontrado: '+o.resource);const playback={};if(c.playback!==undefined){if(!c.playback||typeof c.playback!=='object'||Array.isArray(c.playback))throw Error('Reglas de reproducción no válidas.');for(const [id,r]of Object.entries(c.playback)){const p=parameters.find(p=>p.id===id);if(!p||!['video','gif','svgAnimation'].includes(p.type)||!r||Object.keys(r).some(k=>k!=='end'))throw Error('Regla de recurso no válida.');if(typeof r.end==='string'){if(!['hold','loop','hide'].includes(r.end))throw Error('Final de recurso no válido.');}else{const target=parameters.find(p=>p.id===r.end?.param);if(!r.end||Object.keys(r.end).length!==1||!target||target.type!=='select'||target.options.some(v=>!['hold','loop','hide'].includes(v)))throw Error('El final debe referenciar un parámetro select de hold, loop o hide.');}playback[id]={end:r.end};}}return { ...(c.playback!==undefined?{playback}:{}),...(c.animatedSVGs!==undefined?{animatedSVGs}:{}),...(c.gifs!==undefined?{gifs}:{}),...(c.videos!==undefined?{videos}:{}),...(c.models!==undefined?{models}:{}),...(scene3d?{scene3d}:{}), ...(subtitles?{subtitles}:{}), version:c.version, name:c.name, parameters, html:c.html, css:c.css, render:c.render, ...(c.version>=2?{seed:seedValue(c.seed??1),stops:validatedStops}:{}), ...(recommended?{recommended}:{}), ...(metadata?{metadata}:{}), ...(c.version>=3?{resources}:{}) };
  }
  function values(c, input = {}) { const out=Object.fromEntries(c.parameters.map(p => [p.id, (()=>{const v=value(p,Object.hasOwn(input,p.id)?input[p.id]:p.default);if(p.type==='svgAnimation'&&v&&!Object.hasOwn(c.animatedSVGs??{},v))throw Error('SVG animado no encontrado: '+p.label);if(p.type==='gif'&&v&&!Object.hasOwn(c.gifs??{},v))throw Error('GIF no encontrado: '+p.label);if(p.type==='video'&&v&&!Object.hasOwn(c.videos??{},v))throw Error('Vídeo no encontrado: '+p.label);if(p.type==='model'&&v&&!Object.hasOwn(c.models??{},v))throw Error('Modelo no encontrado: '+p.label);if(p.type==='image'&&v&&!Object.hasOwn(c.resources??{},v))throw Error('Recurso no encontrado: '+p.label);if(c.scene3d?.objects.some(o=>o.color?.param===p.id)&&!/^#[a-f0-9]{6}$/i.test(v))throw Error('El color 3D debe ser opaco: '+p.label);return v;})()]));const val=v=>v&&typeof v==='object'?out[v.param]:v;let glyphs=0;for(const o of c.scene3d?.objects??[]){if(o.extrusion!==undefined){glyphs+=String(val(o.text)).length;if(String(val(o.text)).length>120||glyphs>240)throw Error('Texto extruido: máximo 120 caracteres por objeto y 240 en la composición.');}if(o.type==='model'&&o.animation&&val(o.animation.enabled)){const asset=c.models?.[val(o.resource)],clip=val(o.animation.clip);if(!Number.isInteger(clip)||asset?.animations&&clip>=asset.animations)throw Error('GLB: índice de animación inexistente (empieza en 0).');}}if(c.scene3d?.lighting&&!/^#[a-f0-9]{6}$/i.test(val(c.scene3d.lighting.color)))throw Error('El color de luz debe ser opaco.');return out; }
  function runtime(data, randomAt, prepareSubtitles, mountThree, animateThree, mountVideos, gifFactory, svgFactory, resourceTime) {
    const { composition: c, params, width, height, duration, channel, workspace } = data;
    const subtitles=prepareSubtitles(c.subtitles);
    let seed = data.seed, editingStop = null;
    let lastFrame = 0;
    const notify = (type, detail = {}) => parent.postMessage({ mgt: channel, type, ...detail }, '*');
    const report = error => { window.mgtError = String(error?.message || error); notify('error', { error: window.mgtError, stack: String(error?.stack||'').slice(0,3000) }); };
    window.addEventListener('error', e => report(e.error || e.message));
    window.addEventListener('unhandledrejection', e => report(e.reason));
    const root = document.getElementById('root');
    function bounds() {
      const stop = c.stops?.find(s=>s.id===editingStop);
      const el = stop && root.querySelector(stop.element);
      if (!el) { notify('bounds',{stopId:editingStop,rect:null}); return; }
      const r=el.getBoundingClientRect(), box=root.getBoundingClientRect();
      const visible=r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';
      notify('bounds',{stopId:editingStop,rect:visible?{left:r.left-box.left,top:r.top-box.top,width:r.width,height:r.height}:null});
    }
    const style = document.createElement('style'); style.textContent = c.css; document.head.appendChild(style);
    root.innerHTML = c.html;
    const usesModels=c.scene3d&&(c.scene3d.lighting||c.scene3d.animation?.length||c.scene3d.objects.some(o=>o.type==='model'||o.extrusion!==undefined));let drawThree=c.scene3d&&!usesModels?mountThree(root,c.scene3d,width,height):null;
    const images=Object.create(null),urls=[];
    const image=id=>id&&Object.hasOwn(images,id)?images[id]:null;let videoResources=null,gifResources=null,svgResources=null;const svgAnimation=id=>svgResources?.get(id)??null;const gif=id=>gifResources?.get(id)??null;const video=id=>videoResources?.get(id)??null;
    const bindings=Array.from(root.querySelectorAll('img[data-mgt-image]'));
    function bindImages(){for(const el of bindings){const resource=image(params[el.dataset.mgtImage]);if(resource){if(el.getAttribute('src')!==resource.src)el.src=resource.src;el.style.visibility='';}else{el.removeAttribute('src');el.style.visibility='hidden';}}}
    window.addEventListener('pagehide',()=>{urls.forEach(url=>URL.revokeObjectURL(url));});
    let draw;
    try { draw = new Function('ctx', '"use strict";\n' + c.render + '\n//# sourceURL=mgt-render.js'); } catch (e) { report(e); }
    window.setFrame = function (frame) {
      if (!draw) throw new Error(window.mgtError || 'Falta render.');
      lastFrame = Math.max(0, Math.min(Math.round(duration * 60) - 1, Math.round(frame)));
      try {
        const stop = workspace && c.stops?.find(s=>s.id===editingStop);
        const progress=stop?stop.at:lastFrame/Math.max(1,Math.round(duration*60)-1);
        bindImages();
        if(drawThree)drawThree(params,stop?progress*(Math.round(duration*60)-1)/60:lastFrame/60,animateThree(c.scene3d,params,stop?progress*(Math.round(duration*60)-1)/60:lastFrame/60));
        const result = draw({ root, image, video, gif, svgAnimation, subtitles, params: { ...params }, width, height, frame: lastFrame, fps: 60, time:stop?progress*(Math.round(duration*60)-1)/60:lastFrame/60, duration, progress, seed, random:index=>randomAt(seed,index), editingStop:stop?.id??null });
        if (result && typeof result.then === 'function') throw new Error('render debe ser síncrono.');
        if(workspace){bounds();notify('drawn');}
      } catch (e) { report(e); throw e; }
    };
    if(Object.keys(c.videos??{}).length||Object.keys(c.gifs??{}).length||Object.keys(c.animatedSVGs??{}).length){const synchronous=window.setFrame;let sequence=0,queue=Promise.resolve();window.setFrame=function(frame){const ticket=++sequence,target=Math.max(0,Math.min(Math.round(duration*60)-1,Math.round(frame))),stop=workspace&&c.stops?.find(s=>s.id===editingStop),time=stop?stop.at*(Math.round(duration*60)-1)/60:target/60;lastFrame=target;queue=queue.catch(()=>{}).then(async()=>{if(ticket!==sequence)return;if(videoResources)await videoResources.frame(time,params);if(gifResources)await gifResources.frame(time,params);if(svgResources)await svgResources.frame(time,params);if(ticket===sequence)synchronous(target);}).catch(e=>{report(e);throw e;});return queue;};}
    window.addEventListener('message', e => {
      if (e.source !== parent || e.data?.mgt !== channel) return;
      try {
        if (e.data.type === 'frame') { editingStop=e.data.stopId??null; Promise.resolve(window.setFrame(e.data.frame)).catch(()=>{}); }
        if (e.data.type === 'params') { Object.assign(params, e.data.params); seed=e.data.seed??seed; Promise.resolve(window.setFrame(lastFrame)).catch(()=>{}); document.fonts.ready.then(()=>{if(workspace)bounds();}); }
      } catch {}
    });
    window.sceneReady = (async () => {
      let decodedPixels=0;
      for(const [id,a]of Object.entries(c.resources??{})){
        const raw=atob(a.data),bytes=Uint8Array.from(raw,x=>x.charCodeAt(0));
        const src=URL.createObjectURL(new Blob([bytes],{type:a.mime}));urls.push(src);
        const element=new Image();element.src=src;try{await element.decode();}catch{throw Error('No se pudo decodificar la imagen «'+a.name+'».');}
        const width=element.naturalWidth,height=element.naturalHeight;if(!width||!height||width>4096||height>4096||width*height>16000000)throw Error('Dimensiones de imagen fuera de límite.');
        if(a.mime!=='image/svg+xml')decodedPixels+=width*height;if(decodedPixels>32000000)throw Error('Más de 32 megapíxeles de imágenes.');
        images[id]=Object.freeze({src,width,height,element});
      }
      await document.fonts.ready;if(usesModels)drawThree=await window.MGTMountModels(root,c.scene3d,c.models??{},width,height,params);
      if(Object.keys(c.videos??{}).length)videoResources=await mountVideos(root,c,resourceTime,data.videoSources);if(Object.keys(c.gifs??{}).length)gifResources=await gifFactory().mount(root,c,resourceTime);if(Object.keys(c.animatedSVGs??{}).length)svgResources=await svgFactory().mount(root,c,resourceTime);await window.setFrame(0);
      await document.fonts.ready;
      await Promise.all(Array.from(root.querySelectorAll('img'), img => img.hasAttribute('src')?img.decode().catch(()=>{throw Error('Una imagen de la composición no pudo cargarse.');}):Promise.resolve()));
      if (window.mgtError) throw new Error(window.mgtError);
      notify('ready');
    })();
    window.sceneReady.catch(report);
  }
  function documentHTML(input, settings, channel = 'render') {
    const composition = parse(input), params = values(composition, settings.params);
    const workspace=Boolean(settings.workspace),w=settings.width,h=settings.height,videoSources=settings.videoSources??{};
    for(const [id,url]of Object.entries(videoSources))if(!composition.videos?.[id]||typeof url!=='string'||!/^http:\/\/127\.0\.0\.1:\d{2,5}\/api\/project-video\/[a-f0-9-]{36}\?token=[a-f0-9]{64}$/i.test(url))throw Error('Fuente de vídeo de proyecto no válida.');
    const data = JSON.stringify({ composition, params, seed:seedValue(settings.seed??composition.seed??1), width:w, height:h, duration:settings.duration, channel, workspace, videoSources }).replace(/</g, '\\u003c');
    const localMedia=Object.keys(videoSources).length?' http://127.0.0.1:*':'';
    return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\' \'unsafe-eval\'; style-src \'unsafe-inline\'; img-src data: blob:; media-src blob:'+localMedia+'; font-src data:; connect-src blob:'+localMedia+'; form-action \'none\'; base-uri \'none\'"><style>html,body{margin:0;overflow:hidden;width:100%;height:100%;background:'+(settings.overlay?'transparent':workspace?'#20262b':settings.background)+'}*{box-sizing:border-box}</style></head><body><div id="root" style="position:absolute;left:'+(workspace?w:0)+'px;top:'+(workspace?h:0)+'px;width:'+w+'px;height:'+h+'px;background:'+settings.background+';overflow:'+(workspace?'visible':'hidden')+'"></div><script>'+(composition.scene3d&&(composition.scene3d.lighting||composition.scene3d.animation?.length||composition.scene3d.objects.some(o=>o.type==='model'||o.extrusion!==undefined))?Engine.replace(/<\/script/gi,'<\\/script'):'')+'</script><script>(' + runtime.toString() + ')(' + data + ','+randomAt.toString()+','+Subtitles.prepare.toString()+','+Three.mount.toString()+','+Three.animate.toString()+','+Videos.mount.toString()+','+Gifs.factory.toString()+','+Svg.factory.toString()+','+mediaTime.toString()+');</script></body></html>';
  }
  function fromText(s) {
    const number = (id, label, v, min, max, step = 1) => ({ id, label, type:'number', default:v, min, max, step });
    return {
      version:2, name:'Texto en movimiento', seed:1, recommended:{duration:s.duration,aspect:s.aspect,resolution:1080},
      stops:[{id:'start',label:'Inicio',element:'#title',x:'startX',y:'startY',at:0},{id:'end',label:'Final',element:'#title',x:'endX',y:'endY',at:1}],
      parameters:[{id:'text',label:'Texto',type:'text',default:s.text},{id:'color',label:'Color',type:'color',default:s.color,randomize:true},{id:'font',label:'Fuente instalada',type:'font',default:s.font},{...number('size','Tamaño',s.size,12,400),control:'slider'},number('startX','Inicio horizontal (%)',s.start.x,-100,200,.1),number('startY','Inicio vertical (%)',s.start.y,-100,200,.1),number('endX','Final horizontal (%)',s.end.x,-100,200,.1),number('endY','Final vertical (%)',s.end.y,-100,200,.1),{id:'easing',label:'Movimiento',type:'select',default:s.easing,options:['linear','smooth']},{id:'visible',label:'Mostrar texto',type:'boolean',default:true}],
      html:'<div id="title"></div>',
      css:'#title { position:absolute; transform:translate(-50%,-50%); white-space:pre; text-align:center; line-height:1.15; font-weight:400; }',
      render:"const { root, params: p, progress, width, height } = ctx;\nconst title = root.querySelector('#title');\nconst t = p.easing === 'smooth' ? progress * progress * (3 - 2 * progress) : progress;\ntitle.textContent = p.text;\nObject.assign(title.style, { display: p.visible ? 'block' : 'none', fontFamily: JSON.stringify(p.font), fontSize: p.size + 'px', color: p.color, left: (p.startX + (p.endX - p.startX) * t) * width / 100 + 'px', top: (p.startY + (p.endY - p.startY) * t) * height / 100 + 'px' });"
    };
  }
  const api = {mediaTime, parse, values, value, documentHTML, fromText, randomAt, randomized, seedValue, snap };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MGTComposition = api;
})(typeof window !== 'undefined' ? window : globalThis);
