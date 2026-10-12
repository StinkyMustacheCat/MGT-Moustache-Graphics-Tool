// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');

const {config,root,dataDir,instanceId,runtimeFile,version}=require('./runtime.cjs');
const userRoot=path.basename(root)==='programa'?path.dirname(root):root;
const Scene = require('./public/scene.js');
const ExportSettings=require('./public/export-settings.js');
const Composition = require('./public/composition.js');
const { chromium } = require(config.playwright);
const output = path.join(dataDir, 'exports');
const gallery = path.join(userRoot, 'galeria');
const store=require('./storage.cjs').createStore(gallery,output);
const readEffect=store.readEffect;
const subtitleStore=require('./subtitle-store.cjs').createStore(path.join(userRoot,'subtitulos'));
subtitleStore.seed(path.join(root,'examples','subtitulos'));
const Audio=require('./audio-store.cjs');
const audioStore=Audio.createStore(path.join(dataDir,'audio'),path.join(path.dirname(config.ffmpeg),'ffprobe.exe'),{keepSession:true});const waves=new Map(),waveAbort=new AbortController();
let wavImporting=false;
let importAbort;
let activeDownloads=0;
let origin = 'http://127.0.0.1:' + config.port;
const token = crypto.randomBytes(32).toString('hex');
const jobs = new Map();
let active = null;
let fonts;
try {
  const script = '[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); Add-Type -AssemblyName System.Drawing; $motionFonts = [System.Drawing.Text.InstalledFontCollection]::new(); ConvertTo-Json -Compress -InputObject @($motionFonts.Families | Where-Object { $_.IsStyleAvailable([System.Drawing.FontStyle]::Regular) } | ForEach-Object { $_.Name } | Sort-Object -Unique)';
  fonts = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', windowsHide: true, timeout: 20000 }).replace(/^\uFEFF/, ''));
} catch (error) { console.error('No se pudo leer la lista de fuentes:', error.message); fonts = ['Arial', 'Segoe UI', 'Times New Roman', 'Courier New']; }
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
async function body(req,max=40000000) {
  const chunks = []; let length = 0;
  for await (const chunk of req) { length += chunk.length; if (length > max) throw new Error('Solicitud demasiado grande.'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function isCancelled(job) { if (job.cancelled) throw new Error('Exportación cancelada.'); }
async function render(job, spec, composition, params, resolution, seed, bitrate, quick=false, audio=null,layers=null) {
  let browser, capture, encoder, encoderDone, finalStatus;
  const temporary = path.join(output, job.id + '.part.mp4');
  try {
    for (const file of [config.chromium, config.ffmpeg]) if (!fs.existsSync(file)) throw new Error('No se encuentra una dependencia. Revisa config.json.');
    const [width, height] = Scene.sizes[spec.aspect];
    job.cancel = () => { encoder?.kill(); browser?.close().catch(() => {}); };
    capture = require('./frame-capture.cjs').createCapture({
      cancelled: () => isCancelled(job),
      recovered: count => { job.recoveries=count; },
      open: async () => {
    browser = await chromium.launch({ executablePath: config.chromium, headless: true });
    const ownedBrowser=browser;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: resolution / 1080 });
    page.setDefaultTimeout(15000);
    await page.route('**/*', route => route.abort());
    let scene = page;
    let drawLayers;
    if(layers){drawLayers=await require('./layer-render-097.cjs').open(page,spec,composition,params,seed,layers,width,height,bounded);}else if (composition) {
      await page.setContent('<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100%}</style><iframe sandbox="allow-scripts"></iframe>');
      await page.locator('iframe').evaluate((el, html) => { el.srcdoc = html; }, Composition.documentHTML(composition, { width, height, duration:spec.duration, background:spec.background, params, seed }));
      scene = await (await page.$('iframe')).contentFrame();
      await scene.waitForFunction(() => !!window.sceneReady);
    } else await page.setContent(Scene.documentHTML(spec));
    async function bounded(promise) {
      let timer;
      try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => { browser.close().catch(() => {}); reject(new Error('La composición no respondió en 15 segundos. Revisa su código.')); }, 15000); })]); }
      finally { clearTimeout(timer); }
    }
    try { if(!layers)await bounded(scene.evaluate(() => window.sceneReady)); }
    catch(error) { await ownedBrowser.close().catch(()=>{}); throw error; }
    return {
      capture: async frame => {
        if(drawLayers)await drawLayers(frame);else await bounded(scene.evaluate(async f => { await window.setFrame(f); if (window.mgtError) throw new Error(window.mgtError); }, frame));
        return page.screenshot({ type:'png', animations:'allow', scale:'device' });
      },
      lost: error => !error.message.includes('La composición no respondió') && (!ownedBrowser.isConnected() || page.isClosed() || /Target crashed|Page crashed/.test(error.message)),
      close: () => ownedBrowser.close()
    };
      }
    });
    await capture.start();
    isCancelled(job);
    const compression=ExportSettings.compression(quick,bitrate),[outWidth,outHeight]=ExportSettings.dimensions(spec.aspect,resolution);
    encoder = spawn(config.ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', '60', '-i', 'pipe:0', ...(audio?.mix?require('./audio-mix.cjs').args(audio.clips,job.frames/60):Audio.muxArgs(audio,job.frames/60)), '-c:v', 'libx264', ...compression, '-vf', 'scale='+outWidth+':'+outHeight+':flags=lanczos,setsar=1', '-pix_fmt', 'yuv420p', '-r', '60', '-frames:v', String(job.frames), '-movflags', '+faststart', temporary], { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
    let encoderError = '', spawnError;
    encoder.stderr.on('data', d => { encoderError = (encoderError + d).slice(-3000); });
    encoder.stdin.on('error', e => { spawnError = e; });
    encoderDone = new Promise(resolve => { encoder.on('error', e => { spawnError = e; resolve(-1); }); encoder.on('close', code => resolve(code)); });
    job.cancel = () => { encoder?.kill(); browser?.close().catch(() => {}); };
    job.status = 'rendering';
    for (let frame = 0; frame < job.frames; frame++) {
      isCancelled(job);
      if (spawnError || encoder.exitCode !== null) throw new Error('No se pudo comprimir el video: ' + (spawnError?.message || encoderError));
      const png = await capture.capture(frame);
      if (!encoder.stdin.write(png)) await require('./encoder-drain.cjs').waitForDrain(encoder.stdin);
      job.completed = frame + 1;
    }
    job.status = 'encoding';
    encoder.stdin.end();
    const code = await encoderDone;
    isCancelled(job);
    if (code !== 0) throw new Error('No se pudo comprimir el video. ' + encoderError);
    fs.renameSync(temporary, path.join(output, job.id + '.mp4'));
    finalStatus = 'done';
  } catch (error) {
    finalStatus = job.cancelled ? 'cancelled' : 'error';
    job.error = job.cancelled ? 'Exportación cancelada.' : error.message;
    encoder?.kill();
    if (encoderDone) await encoderDone;
    fs.rmSync(temporary, { force: true });
  } finally {
    if (capture) await capture.close();
    if (browser) await browser.close().catch(() => {});
    job.cancel = null;
    if(audio?.mix){for(const id of audio.ids)audioStore.release(id);}else if(audio)audioStore.release(audio.id);
    active = null;
    job.status = finalStatus;
  }
}
const server = http.createServer(async (req, res) => {
  try {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    if (req.headers.host !== '127.0.0.1:' + config.port && req.headers.host !== 'localhost:' + config.port) return json(res, 403, { error: 'Dirección no permitida.' });
    const url = new URL(req.url, origin);
    if (req.method === 'POST' && (req.headers.origin !== origin || req.headers['x-motion-token'] !== token)) return json(res, 403, { error: 'Recarga la página para continuar.' });
    if (req.method === 'GET' && url.pathname === '/api/info') return json(res, 200, { name:'texto-motion-local',version,instanceId,pid:process.pid,fonts,token,fps:60,ready:fs.existsSync(config.chromium)&&fs.existsSync(config.ffmpeg) });
    if(req.method==='POST'&&url.pathname==='/api/media/video'){
      if(wavImporting)return json(res,409,{error:'Ya hay un archivo cargándose.'});
      wavImporting=true;importAbort=new AbortController();const controller=importAbort,abort=()=>{if(!res.writableFinished)controller.abort();};req.once('aborted',abort);res.once('close',abort);controller.signal.addEventListener('abort',()=>{if(!req.complete)req.destroy();},{once:true});
      try{const result=await require('./media-input.cjs').prepare(req,{name:decodeURIComponent(req.headers['x-audio-name']||''),kind:'video',ffmpeg:config.ffmpeg,directory:dataDir,signal:controller.signal},async(file)=>({data:fs.readFileSync(file).toString('base64')}));return json(res,201,result);}
      catch(e){req.resume();return json(res,400,{error:e.message});}finally{wavImporting=false;importAbort=null;req.removeListener('aborted',abort);res.removeListener('close',abort);}
    }
    if(req.method==='POST'&&url.pathname==='/api/subtitles/mp4'){
      if(wavImporting)return json(res,409,{error:'Ya hay un archivo cargándose. Espera a que termine.'});
      wavImporting=true;importAbort=new AbortController();const controller=importAbort;
      const abort=()=>{if(!res.writableFinished)controller.abort();};req.once('aborted',abort);res.once('close',abort);
      controller.signal.addEventListener('abort',()=>{if(!req.complete)req.destroy();},{once:true});
      try{
        const result=await require('./mp4-import.cjs').read(req,{retainAudio:url.searchParams.get('audio')==='1',name:decodeURIComponent(req.headers['x-audio-name']||'MP4'),store:audioStore,dataDir,ffmpeg:config.ffmpeg,signal:controller.signal});
        return json(res,200,result);
      }catch(error){req.resume();return json(res,400,{error:error.message});}
      finally{wavImporting=false;importAbort=null;req.removeListener('aborted',abort);res.removeListener('close',abort);}
    }
    if(req.method==='POST'&&(url.pathname==='/api/subtitles/wav'||url.pathname==='/api/audio'||url.pathname==='/api/effects')){
      if(wavImporting)return json(res,409,{error:'Ya hay un WAV cargándose. Espera a que termine.'});
      wavImporting=true;let retained;importAbort=new AbortController();const controller=importAbort;
      const abort=()=>{if(!res.writableFinished)controller.abort();};req.once('aborted',abort);res.once('close',abort);
      controller.signal.addEventListener('abort',()=>{if(!req.complete)req.destroy();},{once:true});
      try{
        const name=decodeURIComponent(req.headers['x-audio-name']||'Audio WAV');
        if(url.pathname==='/api/audio'||url.pathname==='/api/effects'){const effect=url.pathname==='/api/effects';const audio=/\.wav$/i.test(name)?await audioStore.upload(req,name,{signal:controller.signal}):await require('./media-input.cjs').prepare(req,{name,kind:'audio',ffmpeg:config.ffmpeg,directory:dataDir,signal:controller.signal,maxBytes:effect?128*1024*1024:Audio.MAX_BYTES,maxDuration:effect?120:3600},file=>audioStore.upload(fs.createReadStream(file),name,{signal:controller.signal}));if(url.pathname==='/api/effects'&&audio.duration>120){audioStore.discard(audio.id);throw Error('Un efecto admite hasta 120 segundos.');}return json(res,201,{audio});}
        if(url.searchParams.get('audio')==='1')retained=audioStore.wordline();
        const parsed=await require('./moustache-media.cjs').read(req,{onPCM:retained?.write});
        const result=require('./wav-subtitles.cjs').convert(parsed);if(controller.signal.aborted)throw Error('Carga cancelada.');
        if(retained)result.audio=retained.finish(name);
        return json(res,200,result);
      }catch(error){retained?.abort();req.resume();return json(res,400,{error:error.message});}
      finally{wavImporting=false;importAbort=null;req.removeListener('aborted',abort);res.removeListener('close',abort);}
    }
    if(req.method==='POST'&&url.pathname==='/api/audio/select'){const input=await body(req);return json(res,200,{audio:audioStore.select(input.id)});}
    if(req.method==='POST'&&url.pathname==='/api/audio/discard'){const input=await body(req);audioStore.discard(input.id);return json(res,200,{ok:true});}
    const waveMatch=url.pathname.match(/^\/api\/audio\/([a-f0-9-]{36})\/waveform$/);if(req.method==='GET'&&waveMatch){const id=waveMatch[1],audio=audioStore.acquire(id);try{if(!waves.has(id))waves.set(id,require('./waveform.cjs').peaks(config.ffmpeg,audio.file,audio.duration,{signal:waveAbort.signal}).catch(e=>{waves.delete(id);throw e;}));return json(res,200,await waves.get(id));}finally{audioStore.release(id);}}
    const audioMatch=url.pathname.match(/^\/api\/audio\/([a-f0-9-]{36})$/);
    if(req.method==='GET'&&audioMatch){audioStore.serve(req,res,audioMatch[1]);return;}
    if(req.method==='GET'&&url.pathname==='/api/subtitles')return json(res,200,subtitleStore.list());
    if(req.method==='GET'&&url.pathname==='/api/subtitles/item')return json(res,200,{code:subtitleStore.read(url.searchParams.get('file')).raw});
    if(req.method==='POST'&&url.pathname==='/api/subtitles/save'){const input=await body(req);return json(res,201,subtitleStore.add(input.composition));}
    if(req.method==='POST'&&url.pathname==='/api/subtitles/delete'){const input=await body(req);if(input.confirm!==true)throw Error('Confirma la eliminación.');return json(res,200,subtitleStore.remove(input.file));}
    if(req.method==='GET'&&url.pathname==='/api/gallery'){

      const items=[],errors=[];for(const file of fs.readdirSync(gallery).filter(f=>f.endsWith('.mgt.json')).sort()){
        try{const {parsed}=readEffect(file);items.push({file,name:parsed.name,author:parsed.metadata?.author||'',license:parsed.metadata?.license||'',images:Object.keys(parsed.resources??{}).length});}catch(e){errors.push({file,error:e.message});}
      }return json(res,200,{items,errors});
    }
    if(req.method==='GET'&&url.pathname==='/api/gallery/item'){const {raw}=readEffect(url.searchParams.get('file'));return json(res,200,{code:raw});}
    if(req.method==='POST'&&url.pathname==='/api/gallery/save'){
      const input=await body(req);return json(res,201,store.add(JSON.stringify(input.composition,null,2)));
    }
    if(req.method==='POST'&&url.pathname==='/api/gallery/import'){
      const input=await body(req);return json(res,201,store.add(input.code));
    }
    if(req.method==='POST'&&url.pathname==='/api/gallery/delete'){
      const input=await body(req);if(input.confirm!==true)throw Error('Confirma la eliminación.');return json(res,200,store.remove(input.file));
    }
    if(req.method==='GET'&&url.pathname==='/api/storage')return json(res,200,{...store.storage(),busy:Boolean(active)||activeDownloads>0,thresholdBytes:1000000000});
    if(req.method==='POST'&&url.pathname==='/api/storage/clean'){
      const input=await body(req);if(input.confirm!==true)throw Error('Confirma la limpieza.');
      if(active||activeDownloads>0)return json(res,409,{error:'Termina o cancela la exportación y espera las descargas antes de limpiar.'});
      const result=store.clean(input.files);for(const name of result.deleted)jobs.delete(name.replace(/(?:\.part)?\.mp4$/i,''));return json(res,200,result);
    }
    const docs={'/help':'LEEME.md','/licenses':'LICENSING.md','/license':'LICENSE','/publication':'PUBLICACION.md'};
    if(req.method==='GET'&&Object.hasOwn(docs,url.pathname)){res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(path.join(path.basename(root)==='programa'?path.join(userRoot,'documentacion'):root,docs[url.pathname])).on('error',()=>res.destroy()).pipe(res);return;}
    if (req.method === 'POST' && url.pathname === '/api/stop') {
      if (active||wavImporting) return json(res, 409, { error: 'Termina o cancela la operación actual antes de detener el estudio.' });
      json(res, 200, { ok: true }); server.close(); return;
    }
    if (req.method === 'POST' && url.pathname === '/api/shutdown') {
      waveAbort.abort();
      importAbort?.abort();
      if(importAbort){const deadline=Date.now()+20000;while(importAbort&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));}
      const closingJob=active;
      if(closingJob){closingJob.cancelled=true;closingJob.cancel?.();
        const deadline=Date.now()+20000;
        while(active===closingJob&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));
        if(active===closingJob)return json(res,409,{error:'La exportación todavía se está cerrando.'});
      }
      res.setHeader('Connection','close');json(res,200,{ok:true});server.close();server.closeIdleConnections();return;
    }
    if (req.method === 'POST' && url.pathname === '/api/export') {
      if (active) return json(res, 409, { error: 'Ya hay una exportación en curso.' });
      const input = await body(req,160*1024*1024), spec = Scene.normalize(input.scene);
      const composition = input.composition ? Composition.parse(input.composition) : null;
      if(composition?.subtitles?.kind==='template')throw Error('Carga subtítulos antes de exportar esta plantilla.');
      const params = composition ? Composition.values(composition, input.params) : null;
      if(input.quick!==undefined&&typeof input.quick!=='boolean')throw Error('Modo rápido no válido.');
      const quick=input.quick===true,resolution=quick?540:input.resolution??1080;
      const seed=Composition.seedValue(input.seed??composition?.seed??1),bitrate=input.bitrate??null;
      if(bitrate!==null&&(!Number.isFinite(bitrate)||bitrate<1||bitrate>200))throw new Error('El bitrate debe estar entre 1 y 200 Mbps.');
      if (!ExportSettings.resolutions.includes(resolution)) throw new Error('Resolución no admitida.');
      if (!composition && !fonts.includes(spec.font)) throw new Error('Elige una fuente instalada de la lista.');
      const job = { id: crypto.randomUUID(), status: 'preparing', completed: 0, frames: Math.round(spec.duration * 60), cancelled: false, filename: String(input.filename || 'texto-motion').replace(/\.mp4$/i, '').replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 80).trim() || 'texto-motion' };
      const layers=input.layers?require('./layer-render-097.cjs').normalize(input.layers,spec):null;let audio=null;if(input.effects!==undefined||input.audioSettings!==undefined||layers){const refs=[],clips=[];try{const settings=input.audioSettings??{volume:1,muted:false};if(!Number.isFinite(settings.volume)||settings.volume<0||settings.volume>1||typeof settings.muted!=='boolean')throw Error('Volumen principal no válido.');if(input.audioId){const a=audioStore.acquire(input.audioId);refs.push(a.id);clips.push({...a,input:0,output:a.duration,start:0,volume:settings.volume,muted:settings.muted||layers?.flags.audio.muted===true});}if(!Array.isArray(input.effects??[])||(input.effects??[]).length>64)throw Error('Hasta 64 efectos.');for(const raw of input.effects??[]){const a=audioStore.acquire(raw.audio?.id);refs.push(a.id);const c=require('./public/effects.js').normalize({...raw,audio:{id:a.id,duration:a.duration}});if(c.start<spec.duration)clips.push({...c,file:a.file,muted:c.muted||layers?.flags.effects.muted===true});}audio={mix:true,ids:refs,clips};}catch(e){for(const id of refs)audioStore.release(id);throw e;}}else audio=input.audioId?audioStore.acquire(input.audioId):null;
      jobs.set(job.id, job); active = job;
      json(res, 202, { id: job.id });
      void render(job, spec, composition, params, resolution, seed, bitrate, quick, audio,layers);
      return;
    }
    const match = url.pathname.match(/^\/api\/jobs\/([a-f0-9-]{36})(\/download|\/cancel)?$/);
    if (match) {
      const job = jobs.get(match[1]);
      if (!job) return json(res, 404, { error: 'Exportación no encontrada.' });
      if (req.method === 'POST' && match[2] === '/cancel') { if (['preparing', 'rendering', 'encoding'].includes(job.status)) { job.cancelled = true; job.cancel?.(); } return json(res, 200, { ok: true }); }
      if (req.method === 'GET' && match[2] === '/download' && job.status === 'done') {
        const file = path.join(output, job.id + '.mp4');
        res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': fs.statSync(file).size, 'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(job.filename + '.mp4') });
        activeDownloads++;const stream=fs.createReadStream(file);let released=false;const release=()=>{if(!released){released=true;activeDownloads--;}};stream.once('close',release);stream.once('error',()=>res.destroy());res.once('close',()=>stream.destroy());stream.pipe(res); return;
      }
      if (req.method === 'GET' && !match[2]) return json(res, 200, { id: job.id, status: job.status, completed: job.completed, frames: job.frames, error: job.error, filename: job.filename + '.mp4' });
    }
    const files = { '/media-input.js':'media-input.js', '/base-video.js':'base-video.js', '/animated-svg.js':'animated-svg.js','/svg-controls.js':'svg-controls.js','/svg-template.js':'svg-template.js','/animated-contract':'animated-contract.txt', '/gifs.js':'gifs.js','/gif-controls.js':'gif-controls.js','/gif-template.js':'gif-template.js','/gif-contract':'gif-contract.txt', '/videos.js':'videos.js','/video-controls.js':'video-controls.js','/video-template.js':'video-template.js','/video-contract':'video-contract.txt', '/': 'index.html', '/style.css': 'style.css', '/app.js': 'app.js', '/prompts.js': 'prompts.js', '/prompt':'prompts/motion.txt', '/prompt/motion':'prompts/motion.txt', '/prompt/3d':'prompts/3d.txt', '/prompt/images':'prompts/images.txt', '/prompt/media':'prompts/media.txt', '/prompt/subtitles':'prompts/subtitles.txt', '/effects.js':'effects.js','/effects-controls.js':'effects-controls.js','/history-controls.js':'history-controls.js','/paste-placement.js':'paste-placement.js','/track-edit.js':'track-edit.js','/track-state.js':'track-state.js','/tracks.js':'tracks.js', '/track-controls.js':'track-controls.js', '/scene.js': 'scene.js', '/composition.js':'composition.js', '/image-clip.js':'image-clip.js', '/three-controls.js':'three-controls.js','/model-template.js':'model-template.js','/models.js':'models.js','/glb-engine.js':'glb-engine.js','/model-controls.js':'model-controls.js','/three.js':'three.js', '/three-template.js':'three-template.js', '/export-settings.js':'export-settings.js', '/subtitles.js':'subtitles.js', '/subtitle-controls.js':'subtitle-controls.js', '/audio-controls.js':'audio-controls.js', '/subtitle-contract':'SUBTITULOS.md', '/assets.js':'assets.js', '/image-controls.js':'image-controls.js', '/contract':'contract.txt', '/icon.png':'icon.png', '/icon.ico':'icon.ico' };
    if (req.method === 'GET' && Object.hasOwn(files, url.pathname)) {
      const file = files[url.pathname];
      res.writeHead(200, { 'Content-Type': file.endsWith('.ico') ? 'image/x-icon' : file.endsWith('.png') ? 'image/png' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.css') ? 'text/css; charset=utf-8' : file.endsWith('.txt') ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      fs.createReadStream(path.join(root, 'public', file)).pipe(res); return;
    }
    json(res, 404, { error: 'No encontrado.' });
  } catch (error) { if (!res.headersSent) json(res, 400, { error: error.message }); else res.end(); }
});
let attempts=0;
server.on('listening',()=>{
  console.log('MGT: '+origin);fs.appendFileSync(path.join(dataDir,'server.log'),new Date().toISOString()+' '+origin+'\n');
  const temp=runtimeFile+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify({url:origin,pid:process.pid,instanceId,version}));fs.renameSync(temp,runtimeFile);
});
server.on('error',error=>{
  if(error.code==='EADDRINUSE'&&attempts++<20){config.port++;origin='http://127.0.0.1:'+config.port;server.listen(config.port,'127.0.0.1');return;}
  console.error(error.message);fs.appendFileSync(path.join(dataDir,'server-error.log'),error.message+'\n');process.exitCode=1;
});
server.on('close',()=>{waveAbort.abort();audioStore.close();try{if(JSON.parse(fs.readFileSync(runtimeFile,'utf8')).pid===process.pid)fs.rmSync(runtimeFile,{force:true});}catch{}});
server.listen(config.port,'127.0.0.1');
function stop() { importAbort?.abort(); active && (active.cancelled = true); active?.cancel?.(); server.close(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);






