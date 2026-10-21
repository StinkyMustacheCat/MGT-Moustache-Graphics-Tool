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
const ProjectArchive=require('./project-archive.cjs');
const MGTAsset=require('./mgt-asset.cjs');
const MGTAssetV2=require('./mgt-asset-v2.cjs');
const audioStore=Audio.createStore(path.join(dataDir,'audio'),path.join(path.dirname(config.ffmpeg),'ffprobe.exe'),{keepSession:true});const waves=new Map(),waveAbort=new AbortController();
const videoStore=require('./project-video-store.cjs').create(path.join(dataDir,'project-video'),path.join(path.dirname(config.ffmpeg),'ffprobe.exe'));
let wavImporting=false;
let importAbort;
let activeDownloads=0;
let origin = 'http://127.0.0.1:' + config.port;
const token = crypto.randomBytes(32).toString('hex');
const jobs = new Map();
const pendingProjects=new Map();
const assetSessions=new Map();
function projectClips(snapshot){return (snapshot.tracks?.overlayLanes??[]).flatMap(lane=>lane.clips??[]);}
function restoredProject(project,map,videoMap=new Map()){const snapshot=project.snapshot,restore=old=>{if(!old)return null;const audio=map.get(old.id);if(!audio)throw Error('Referencia de audio no encontrada: '+old.name);return {...old,...audio};};snapshot.audio.audio=restore(snapshot.audio.audio);for(const effect of snapshot.effects)effect.audio=restore(effect.audio);for(const clip of projectClips(snapshot))if(clip.projectVideoId){const id=videoMap.get(clip.projectVideoId);if(!id)throw Error('Referencia de vídeo no encontrada.');clip.projectVideoId=id;}return {snapshot,settings:project.settings};}
async function discardPending(pending){pendingProjects.delete(pending.token);for(const id of pending.added)audioStore.discard(id);for(const id of pending.addedVideo??[])videoStore.discard(id);await fs.promises.rm(pending.file,{force:true});}
async function importAssetV2(req){
 const id=crypto.randomUUID(),kind=String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase();
 if(kind==='application/json'){
  const input=await body(req,50*1024*1024);
  if(input?.format!=='mgt.json'||!input.document)throw Error('Envía {"format":"mgt.json","document":{…}}.');
  const asset=MGTAssetV2.makeJson(input.document);
  const session={id,asset,createdAt:Date.now()};assetSessions.set(id,session);return session;
 }
 if(kind!=='application/zip')throw Error('Usa application/json para MGT JSON o application/zip para .mgtproj.');
 const file=path.join(output,id+'.asset.mgtproj'),digest=crypto.createHash('sha256');let handle,size=0;
 try{
  handle=await fs.promises.open(file,'wx');
  for await(const chunk of req){size+=chunk.length;if(size>ProjectArchive.MAX_ARCHIVE)throw Error('Proyecto demasiado grande.');digest.update(chunk);let offset=0;while(offset<chunk.length){const result=await handle.write(chunk,offset,chunk.length-offset);if(!result.bytesWritten)throw Error('No se pudo recibir el proyecto.');offset+=result.bytesWritten;}}
  await handle.close();handle=null;
  const entries=await ProjectArchive.inspect(file),project=await ProjectArchive.readJSON(file,entries.get('project.json'));
  for(const resource of project.resources??[]){const entry=entries.get(resource.entry);if(!entry)throw Error('Falta un recurso del proyecto: '+resource.name);await ProjectArchive.verify(file,entry);}
  const asset=MGTAssetV2.makeProject(project,entries,digest.digest('hex'));
  const session={id,asset,file,entries,createdAt:Date.now()};assetSessions.set(id,session);return session;
 }catch(error){await handle?.close().catch(()=>{});await fs.promises.rm(file,{force:true});throw error;}
}
async function prepareProjectAsset(session,contract){
 const input=MGTAssetV2.renderInput(session.asset,contract),project=session.asset.project,resources=new Map(project.resources.map(r=>[r.id,r])),audioIds=[],videoIds=[],audioMap=new Map(),videoMap=new Map(),held=[];
 const dispose=()=>{for(const id of held)audioStore.release(id);for(const id of audioIds)audioStore.discard(id);for(const id of videoIds)videoStore.discard(id);};
 try{
  const audioRefs=[project.snapshot.audio.audio?.id,...project.snapshot.effects.map(c=>c.audio.id)].filter(Boolean),videoRefs=(project.snapshot.tracks.overlayLanes??[]).flatMap(l=>l.clips.map(c=>c.projectVideoId).filter(Boolean));
  for(const old of new Set(audioRefs)){const resource=resources.get(old),entry=session.entries.get(resource.entry),item=await audioStore.upload(ProjectArchive.stream(session.file,entry),resource.name);audioIds.push(item.id);audioMap.set(old,item);}
  for(const old of new Set(videoRefs)){const resource=resources.get(old),entry=session.entries.get(resource.entry),id=await videoStore.restore(ProjectArchive.stream(session.file,entry));videoIds.push(id);videoMap.set(old,id);}
  for(const lane of input.layers.overlayLanes)for(const clip of lane.clips)if(clip.projectVideoId)clip.projectVideoId=videoMap.get(clip.projectVideoId);
  input.layers=require('./layer-render-097.cjs').normalize(input.layers,input.spec);
  const clips=[],flags=input.layers.flags,main=project.snapshot.audio;
  if(main.audio){const item=audioMap.get(main.audio.id),audio=audioStore.acquire(item.id);held.push(audio.id);clips.push({...audio,input:0,output:audio.duration,start:0,volume:main.volume??1,muted:main.muted===true||flags.audio?.muted===true||flags['audio-1']?.muted===true});}
  for(const old of project.snapshot.effects){const item=audioMap.get(old.audio.id),audio=audioStore.acquire(item.id);held.push(audio.id);const clip=require('./public/effects.js').normalize({...old,audio:{id:audio.id,duration:audio.duration}});if(clip.start<input.spec.duration)clips.push({...clip,file:audio.file,muted:clip.muted||flags[clip.trackId]?.muted===true});}
  input.audio=contract.hasAudio?{mix:true,ids:held,clips}:null;
  return {input,dispose};
 }catch(error){dispose();throw error;}
}
async function releaseAssetV2(session){assetSessions.delete(session.id);if(session.file)await fs.promises.rm(session.file,{force:true});}
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
async function render(job, spec, composition, params, resolution, seed, bitrate, quick=false, audio=null,layers=null,renderOptions=null) {
  let browser, capture, encoder, encoderDone, finalStatus;
  const profile=process.env.MGT_PROFILE_EXPORT==='1',jpeg=quick,metrics=profile?{prepareMs:0,drawMs:0,screenshotMs:0,drainMs:0,finalizeMs:0,totalMs:0}:null,started=profile?performance.now():0;
  if(profile)job.metrics=metrics;
  const fps=renderOptions?.fps??60,alpha=renderOptions?.alpha===true,extension=job.extension??'mp4',prores=extension==='mov';
  const temporary = path.join(output, job.id + '.part.'+extension);
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
    await page.route('**/*', route => route.request().url().startsWith(origin+'/api/project-video/')&&new URL(route.request().url()).searchParams.get('token')===token?route.continue():route.abort());
    let scene = page;
    let drawLayers;
    if(layers){drawLayers=await require('./layer-render-097.cjs').open(page,spec,composition,params,seed,layers,width,height,bounded,alpha,id=>origin+'/api/project-video/'+id+'?token='+token);}else if (composition) {
      await page.setContent('<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:'+(alpha?'transparent':spec.background)+'}iframe{border:0;width:100%;height:100%;background:transparent}</style><iframe sandbox="allow-scripts"></iframe>');
      await page.locator('iframe').evaluate((el, html) => { el.srcdoc = html; }, Composition.documentHTML(composition, { width, height, duration:renderOptions?.sourceDuration??spec.duration, background:alpha?'transparent':spec.background, overlay:alpha, params, seed }));
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
        const drawStart=profile?performance.now():0;
        const sourceFrame=Math.round(frame*60/fps);
        if(drawLayers)await drawLayers(sourceFrame);else await bounded(scene.evaluate(async f => { await window.setFrame(f); if (window.mgtError) throw new Error(window.mgtError); }, sourceFrame));
        if(profile)metrics.drawMs+=performance.now()-drawStart;
        const screenshotStart=profile?performance.now():0;
        const png=await page.screenshot({ type:jpeg?'jpeg':'png', ...(jpeg?{quality:95}:{omitBackground:alpha}), animations:'allow', scale:'device' });
        if(profile)metrics.screenshotMs+=performance.now()-screenshotStart;
        return png;
      },
      lost: error => !error.message.includes('La composición no respondió') && (!ownedBrowser.isConnected() || page.isClosed() || /Target crashed|Page crashed/.test(error.message)),
      close: () => ownedBrowser.close()
    };
      }
    });
    await capture.start();
    isCancelled(job);
    if(profile)metrics.prepareMs=performance.now()-started;
    const compression=ExportSettings.compression(quick,bitrate),[outWidth,outHeight]=ExportSettings.dimensions(spec.aspect,resolution);
    const videoArgs=prores?['-c:v','prores_ks','-profile:v','4444','-alpha_bits','16','-vf','scale='+outWidth+':'+outHeight+':flags=lanczos,format=yuva444p10le','-pix_fmt','yuva444p10le','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709']:['-c:v','libx264',...compression,'-vf','scale='+outWidth+':'+outHeight+':flags=lanczos,setsar=1','-pix_fmt','yuv420p'];
    encoder = spawn(config.ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-vcodec', jpeg?'mjpeg':'png', '-framerate', String(fps), '-i', 'pipe:0', ...(audio?.mix?require('./audio-mix.cjs').args(audio.clips,job.frames/fps):Audio.muxArgs(audio,job.frames/fps)), ...videoArgs, '-r', String(fps), '-frames:v', String(job.frames), '-movflags', prores?'+faststart+write_colr':'+faststart', temporary], { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
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
      if (!encoder.stdin.write(png)){const drainStart=profile?performance.now():0;await require('./encoder-drain.cjs').waitForDrain(encoder.stdin);if(profile)metrics.drainMs+=performance.now()-drainStart;}
      job.completed = frame + 1;
    }
    job.status = 'encoding';
    const finalizeStart=profile?performance.now():0;
    encoder.stdin.end();
    const code = await encoderDone;
    if(profile)metrics.finalizeMs=performance.now()-finalizeStart;
    isCancelled(job);
    if (code !== 0) throw new Error('No se pudo comprimir el video. ' + encoderError);
    fs.renameSync(temporary, path.join(output, job.id + '.'+extension));
    finalStatus = 'done';
  } catch (error) {
    finalStatus = job.cancelled ? 'cancelled' : 'error';
    job.error = job.cancelled ? 'Exportación cancelada.' : error.message;
    encoder?.kill();
    if (encoderDone) await encoderDone;
    fs.rmSync(temporary, { force: true });
  } finally {
    if(profile)metrics.totalMs=performance.now()-started;
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
    if(req.method==='GET'&&url.pathname==='/api/asset/v2/capabilities')return json(res,200,MGTAssetV2.capabilities());
    const projectVideo=url.pathname.match(/^\/api\/project-video\/([a-f0-9-]{36})$/i);
    if(req.method==='GET'&&projectVideo){if(url.searchParams.get('token')!==token)return json(res,403,{error:'Recurso no autorizado.'});const file=videoStore.file(projectVideo[1]),size=fs.statSync(file).size,range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||''),start=range?Number(range[1]):0,end=range&&range[2]?Number(range[2]):size-1;if(start>=size||end>=size||end<start){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return;}const headers={'Content-Type':'video/mp4','Content-Length':end-start+1,'Accept-Ranges':'bytes','Access-Control-Allow-Origin':'*','Cross-Origin-Resource-Policy':'cross-origin','Cache-Control':'no-store'};if(range)headers['Content-Range']='bytes '+start+'-'+end+'/'+size;res.writeHead(range?206:200,headers);const stream=fs.createReadStream(file,{start,end});stream.once('error',()=>res.destroy());res.once('close',()=>stream.destroy());stream.pipe(res);return;}
    if(req.method==='POST'&&url.pathname==='/api/media/video'){
      if(wavImporting)return json(res,409,{error:'Ya hay un archivo cargándose.'});
      wavImporting=true;importAbort=new AbortController();const controller=importAbort,abort=()=>{if(!res.writableFinished)controller.abort();};req.once('aborted',abort);res.once('close',abort);controller.signal.addEventListener('abort',()=>{if(!req.complete)req.destroy();},{once:true});
      try{const result=await require('./media-input.cjs').prepare(req,{name:decodeURIComponent(req.headers['x-audio-name']||''),kind:'video',ffmpeg:config.ffmpeg,directory:dataDir,signal:controller.signal,maxBytes:512*1024*1024},async(file,meta)=>{const projectVideoId=meta.embedded?null:await videoStore.add(meta.preparedFile);return {data:fs.readFileSync(file).toString('base64'),metadata:{width:meta.width,height:meta.height,duration:meta.duration,fps:meta.fps},projectVideoId,classification:meta.embedded?'embedded':'project-only',warnings:meta.warnings};});return json(res,201,result);}
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
    if(req.method==='POST'&&url.pathname==='/api/project/save'){
      const input=await body(req,ProjectArchive.MAX_PROJECT),snapshot=input.snapshot;
      if(!snapshot||typeof snapshot!=='object'||!snapshot.state||!snapshot.tracks||!Array.isArray(snapshot.effects)||!snapshot.audio||!ExportSettings.resolutions.includes(input.settings?.resolution)||input.settings?.fps!==undefined&&!MGTAsset.FPS.includes(input.settings.fps))throw Error('Proyecto no válido.');
      const ids=[snapshot.audio.audio?.id,...snapshot.effects.map(effect=>effect.audio?.id)].filter(Boolean),videoIds=[...new Set(projectClips(snapshot).map(clip=>clip.projectVideoId).filter(Boolean))];
      if(new Set(ids).size>64)throw Error('Demasiados recursos de audio.');
      if(videoIds.length>256)throw Error('Demasiados recursos de vídeo de proyecto.');
      const held=[],resources=[],entries=[],id=crypto.randomUUID(),file=path.join(output,id+'.mgtproj');
      try{
        for(const audioId of new Set(ids)){const item=audioStore.acquire(audioId);held.push(item.id);const name='audio/'+(resources.length+1)+'.wav';resources.push({kind:'audio',id:audioId,name:item.name,entry:name});entries.push({name,file:item.file});}
        for(const [index,videoId] of videoIds.entries()){const name='video/'+(index+1)+'.mp4',clip=projectClips(snapshot).find(c=>c.projectVideoId===videoId);resources.push({kind:'video',id:videoId,name:clip?.document?.videos?.baseVideo?.name||'Vídeo del proyecto',entry:name});entries.push({name,file:videoStore.file(videoId)});}
        const project={format:'mgt-project',version:videoIds.length?2:1,snapshot,settings:input.settings,resources};
        entries.unshift({name:'project.json',data:JSON.stringify(project)});
        await ProjectArchive.create(file,entries);
        return json(res,201,{url:'/api/project/'+id+'/download',filename:String(input.filename||'Proyecto MGT').replace(/[^\p{L}\p{N} _.-]/gu,'').slice(0,80).trim()||'Proyecto MGT'});
      }finally{for(const audioId of held)audioStore.release(audioId);}
    }
    const projectDownload=url.pathname.match(/^\/api\/project\/([a-f0-9-]{36})\/download$/);
    if(req.method==='GET'&&projectDownload){const file=path.join(output,projectDownload[1]+'.mgtproj');if(!fs.existsSync(file))return json(res,404,{error:'Proyecto no encontrado.'});res.writeHead(200,{'Content-Type':'application/zip','Content-Length':fs.statSync(file).size,'Content-Disposition':'attachment; filename="Proyecto MGT.mgtproj"'});const stream=fs.createReadStream(file);stream.once('error',()=>res.destroy());stream.once('close',()=>fs.promises.rm(file,{force:true}).catch(()=>{}));res.once('close',()=>stream.destroy());stream.pipe(res);return;}
    if(req.method==='POST'&&url.pathname==='/api/project/open'){
      for(const pending of pendingProjects.values())if(Date.now()-pending.created>60*60*1000)await discardPending(pending);
      if(pendingProjects.size>=4)throw Error('Termina o cancela otro proyecto pendiente de reenlace.');
      const file=path.join(output,crypto.randomUUID()+'.incoming.mgtproj'),handle=await fs.promises.open(file,'wx'),added=[],addedVideo=[];let retained=false;
      try{
        let size=0;for await(const chunk of req){size+=chunk.length;if(size>ProjectArchive.MAX_ARCHIVE)throw Error('Proyecto demasiado grande.');let written=0;while(written<chunk.length){const part=await handle.write(chunk,written,chunk.length-written);if(!part.bytesWritten)throw Error('No se pudo recibir el proyecto.');written+=part.bytesWritten;}}await handle.close();
        const entries=await ProjectArchive.inspect(file),project=await ProjectArchive.readJSON(file,entries.get('project.json'));
        if(project?.format!=='mgt-project'||![1,2].includes(project.version)||!project.snapshot?.state||!project.snapshot?.tracks||!Array.isArray(project.snapshot.effects)||!project.snapshot.audio||!Array.isArray(project.resources)||project.resources.length>320||!ExportSettings.resolutions.includes(project.settings?.resolution))throw Error('Formato de proyecto no compatible.');
        const map=new Map(),videoMap=new Map(),missing=[];
        for(const resource of project.resources){const kind=resource.kind??'audio',valid=kind==='audio'?/^audio\/[0-9]{1,3}\.wav$/:/^video\/[0-9]{1,3}\.mp4$/;if(typeof resource.id!=='string'||typeof resource.name!=='string'||!valid.test(resource.entry)||map.has(resource.id)||videoMap.has(resource.id)||missing.some(m=>m.id===resource.id))throw Error('Manifest de recursos no válido.');const entry=entries.get(resource.entry);if(!entry){missing.push({id:resource.id,name:resource.name,kind});continue;}try{await ProjectArchive.verify(file,entry);if(kind==='audio'){const audio=await audioStore.upload(ProjectArchive.stream(file,entry),resource.name);added.push(audio.id);map.set(resource.id,audio);}else{const id=await videoStore.restore(ProjectArchive.stream(file,entry));addedVideo.push(id);videoMap.set(resource.id,id);}}catch{missing.push({id:resource.id,name:resource.name,kind});}}
        const refs=[project.snapshot.audio.audio?.id,...project.snapshot.effects.map(effect=>effect.audio?.id)].filter(Boolean),videoRefs=projectClips(project.snapshot).map(c=>c.projectVideoId).filter(Boolean);if(refs.some(id=>!project.resources.some(r=>r.id===id&&(r.kind??'audio')==='audio'))||videoRefs.some(id=>!project.resources.some(r=>r.id===id&&r.kind==='video')))throw Error('El proyecto tiene recursos sin declarar.');
        if(missing.length){const token=crypto.randomUUID();pendingProjects.set(token,{token,file,project,map,videoMap,added,addedVideo,missing,created:Date.now()});retained=true;return json(res,200,{relinkToken:token,missing});}
        return json(res,200,restoredProject(project,map,videoMap));
      }catch(error){for(const id of added)audioStore.discard(id);for(const id of addedVideo)videoStore.discard(id);throw error;}finally{await handle.close().catch(()=>{});if(!retained)await fs.promises.rm(file,{force:true});}
    }
    const pendingMatch=url.pathname.match(/^\/api\/project\/([a-f0-9-]{36})\/(relink|complete|cancel)$/);
    if(req.method==='POST'&&pendingMatch){const pending=pendingProjects.get(pendingMatch[1]);if(!pending)return json(res,404,{error:'Proyecto pendiente no encontrado; vuelve a abrirlo.'});const action=pendingMatch[2];if(action==='cancel'){await discardPending(pending);return json(res,200,{ok:true});}if(action==='relink'){const resource=pending.missing.find(item=>item.id===url.searchParams.get('id'));if(!resource)throw Error('Recurso pendiente no encontrado.');if(resource.kind==='video'){const id=await videoStore.restore(req);pending.addedVideo.push(id);pending.videoMap.set(resource.id,id);}else{const audio=await audioStore.upload(req,resource.name);pending.added.push(audio.id);pending.map.set(resource.id,audio);}pending.missing=pending.missing.filter(item=>item!==resource);return json(res,200,{missing:pending.missing});}if(pending.missing.length)throw Error('Faltan recursos por reenlazar.');const result=restoredProject(pending.project,pending.map,pending.videoMap);pendingProjects.delete(pending.token);await fs.promises.rm(pending.file,{force:true});return json(res,200,result);}
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
    if(req.method==='POST'&&url.pathname==='/api/asset/v2/import'){
      if(assetSessions.size>=8)throw Error('Hay demasiados assets abiertos. Libera uno antes de importar otro.');
      const session=await importAssetV2(req);
      try{return json(res,201,{assetId:session.id,...MGTAssetV2.publicContract(MGTAssetV2.prepare(session.asset))});}
      catch(error){await releaseAssetV2(session);throw error;}
    }
    if(req.method==='POST'&&url.pathname==='/api/asset/v2/preflight'){
      const input=await body(req,1024*1024),session=assetSessions.get(input.assetId);
      if(!session)throw Error('Asset no encontrado. Impórtalo de nuevo.');
      session.createdAt=Date.now();
      return json(res,200,{assetId:session.id,...MGTAssetV2.publicContract(MGTAssetV2.prepare(session.asset,input))});
    }
    if(req.method==='POST'&&url.pathname==='/api/asset/v2/render'){
      if(active)return json(res,409,{error:'Ya hay una exportación en curso.'});
      const input=await body(req,1024*1024),session=assetSessions.get(input.assetId);
      if(!session)throw Error('Asset no encontrado. Impórtalo de nuevo.');
      session.createdAt=Date.now();
      const contract=MGTAssetV2.prepare(session.asset,input),job={id:crypto.randomUUID(),assetId:session.id,status:'preparing',completed:0,frames:contract.frames,cancelled:false,kind:'asset',extension:'mov',createdAt:Date.now(),filename:contract.name.replace(/[^\p{L}\p{N} _.-]/gu,'').slice(0,80).trim()||'MGT',fingerprint:contract.fingerprint,streams:contract.streams,contractVersion:2};
      jobs.set(job.id,job);active=job;json(res,202,{id:job.id,assetId:session.id,...MGTAssetV2.publicContract(contract)});
      void (async()=>{let prepared;try{
        prepared=session.asset.format==='mgtproj'?await prepareProjectAsset(session,contract):{input:MGTAssetV2.renderInput(session.asset,contract),dispose:()=>{}};
        if(job.cancelled){job.status='cancelled';job.error='Exportación cancelada.';active=null;return;}
        const {spec,composition,params,seed,layers,audio}=prepared.input;
        await render(job,spec,composition,params,contract.resolution,seed,null,false,audio,layers,{fps:contract.fps,alpha:true,sourceDuration:contract.duration});
      }catch(error){job.status=job.cancelled?'cancelled':'error';job.error=job.cancelled?'Exportación cancelada.':error.message;if(active===job)active=null;}finally{prepared?.dispose();}})();
      return;
    }
    if(req.method==='POST'&&url.pathname==='/api/asset/v2/release'){
      const input=await body(req,1024),session=assetSessions.get(input.assetId);
      if(!session)return json(res,404,{error:'Asset no encontrado.'});
      if(active?.assetId===session.id)return json(res,409,{error:'Espera o cancela la exportación antes de liberar el asset.'});
      await releaseAssetV2(session);return json(res,200,{ok:true});
    }
    if(req.method==='POST'&&url.pathname==='/api/asset/preflight'){
      const contract=MGTAsset.prepare(await body(req,50*1024*1024));
      new Function('ctx',contract.document.render);
      return json(res,200,{ok:true,...MGTAsset.publicContract(contract),name:contract.document.name,recommended:contract.document.recommended??null});
    }
    if(req.method==='POST'&&url.pathname==='/api/asset/render'){
      if(active)return json(res,409,{error:'Ya hay una exportación en curso.'});
      const contract=MGTAsset.prepare(await body(req,50*1024*1024));
      new Function('ctx',contract.document.render);
      const job={id:crypto.randomUUID(),status:'preparing',completed:0,frames:contract.frames,cancelled:false,kind:'asset',extension:'mov',createdAt:Date.now(),filename:contract.document.name.replace(/[^\p{L}\p{N} _.-]/gu,'').slice(0,80).trim()||'MGT',fingerprint:contract.fingerprint};
      jobs.set(job.id,job);active=job;json(res,202,{id:job.id,...MGTAsset.publicContract(contract)});
      void render(job,contract.scene,contract.document,contract.params,contract.resolution,contract.seed,null,false,null,null,{fps:contract.fps,alpha:true,sourceDuration:contract.duration});
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/export') {
      if (active) return json(res, 409, { error: 'Ya hay una exportación en curso.' });
      const input = await body(req,160*1024*1024), spec = Scene.normalize(input.scene),fps=input.fps??60,format=input.format??'mp4',alpha=input.alpha===true;
      if(!MGTAsset.FPS.includes(fps))throw Error('FPS de exportación no válido.');
      if(input.alpha!==undefined&&typeof input.alpha!=='boolean')throw Error('La opción de transparencia debe ser booleana.');
      if(!['mp4','mov'].includes(format)||alpha&&format!=='mov')throw Error('La transparencia requiere MOV ProRes 4444.');
      const composition = input.composition ? Composition.parse(input.composition) : null;
      if(composition?.subtitles?.kind==='template')throw Error('Carga subtítulos antes de exportar esta plantilla.');
      const params = composition ? Composition.values(composition, input.params) : null;
      if(input.quick!==undefined&&typeof input.quick!=='boolean')throw Error('Modo rápido no válido.');
      if(format==='mov'&&(input.quick===true||input.bitrate!=null))throw Error('MOV ProRes 4444 no usa el modo rápido ni bitrate H.264.');
      const quick=input.quick===true,resolution=input.resolution??1080;
      const seed=Composition.seedValue(input.seed??composition?.seed??1),bitrate=input.bitrate??null;
      if(bitrate!==null&&(!Number.isFinite(bitrate)||bitrate<1||bitrate>200))throw new Error('El bitrate debe estar entre 1 y 200 Mbps.');
      if (!ExportSettings.resolutions.includes(resolution)) throw new Error('Resolución no admitida.');
      if (!composition && !fonts.includes(spec.font)) throw new Error('Elige una fuente instalada de la lista.');
      const job = { id: crypto.randomUUID(), status: 'preparing', completed: 0, frames: Math.round(spec.duration * fps), cancelled: false, extension:format, filename: String(input.filename || 'texto-motion').replace(/\.(?:mp4|mov)$/i, '').replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 80).trim() || 'texto-motion' };
      const layers=input.layers?require('./layer-render-097.cjs').normalize(input.layers,spec):null;for(const clip of (layers?.overlayLanes??[]).flatMap(l=>l.clips))if(clip.projectVideoId)videoStore.file(clip.projectVideoId);let audio=null;if(input.effects!==undefined||input.audioSettings!==undefined||layers){const refs=[],clips=[];try{const settings=input.audioSettings??{volume:1,muted:false};if(!Number.isFinite(settings.volume)||settings.volume<0||settings.volume>1||typeof settings.muted!=='boolean')throw Error('Volumen principal no válido.');if(input.audioId){const a=audioStore.acquire(input.audioId);refs.push(a.id);clips.push({...a,input:0,output:a.duration,start:0,volume:settings.volume,muted:settings.muted||layers?.flags.audio.muted===true||layers?.flags['audio-1']?.muted===true});}if(!Array.isArray(input.effects??[])||(input.effects??[]).length>64)throw Error('Hasta 64 clips de audio.');for(const raw of input.effects??[]){const a=audioStore.acquire(raw.audio?.id);refs.push(a.id);const c=require('./public/effects.js').normalize({...raw,audio:{id:a.id,duration:a.duration}});if(c.start<spec.duration)clips.push({...c,file:a.file,muted:c.muted||layers?.flags[c.trackId]?.muted===true});}audio={mix:true,ids:refs,clips};}catch(e){for(const id of refs)audioStore.release(id);throw e;}}else audio=input.audioId?audioStore.acquire(input.audioId):null;
      jobs.set(job.id, job); active = job;
      json(res, 202, { id: job.id });
      void render(job, spec, composition, params, resolution, seed, bitrate, quick, audio,layers,{fps,alpha});
      return;
    }
    const match = url.pathname.match(/^\/api\/jobs\/([a-f0-9-]{36})(\/download|\/cancel|\/release)?$/);
    if (match) {
      const job = jobs.get(match[1]);
      if (!job) return json(res, 404, { error: 'Exportación no encontrada.' });
      if (req.method === 'POST' && match[2] === '/cancel') { if (['preparing', 'rendering', 'encoding'].includes(job.status)) { job.cancelled = true; job.cancel?.(); } return json(res, 200, { ok: true }); }
      if(req.method==='POST'&&match[2]==='/release'){if(job.kind!=='asset')return json(res,400,{error:'Solo se pueden liberar trabajos de assets MGT.'});if(['preparing','rendering','encoding'].includes(job.status)||activeDownloads>0)return json(res,409,{error:'Espera a que termine la exportación y la descarga.'});fs.rmSync(path.join(output,job.id+'.mov'),{force:true});jobs.delete(job.id);return json(res,200,{ok:true});}
      if (req.method === 'GET' && match[2] === '/download' && job.status === 'done') {
        const extension=job.extension??'mp4',file=path.join(output,job.id+'.'+extension);
        res.writeHead(200, { 'Content-Type': extension==='mov'?'video/quicktime':'video/mp4', 'Content-Length': fs.statSync(file).size, 'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(job.filename + '.'+extension) });
        activeDownloads++;const stream=fs.createReadStream(file);let released=false;const release=()=>{if(!released){released=true;activeDownloads--;}};stream.once('close',release);stream.once('error',()=>res.destroy());res.once('close',()=>stream.destroy());stream.pipe(res); return;
      }
      if (req.method === 'GET' && !match[2]) return json(res, 200, { id: job.id, status: job.status, completed: job.completed, frames: job.frames, error: job.error, filename: job.filename + '.'+(job.extension??'mp4'), ...(job.fingerprint?{fingerprint:job.fingerprint}:{}) ,...(job.contractVersion?{contractVersion:job.contractVersion,streams:job.streams}:{}) ,...(job.metrics?{metrics:job.metrics}:{}) });
    }
    const files = { '/media-input.js':'media-input.js', '/base-video.js':'base-video.js', '/animated-svg.js':'animated-svg.js','/svg-controls.js':'svg-controls.js','/svg-template.js':'svg-template.js','/animated-contract':'animated-contract.txt', '/gifs.js':'gifs.js','/gif-controls.js':'gif-controls.js','/gif-template.js':'gif-template.js','/gif-contract':'gif-contract.txt', '/videos.js':'videos.js','/video-controls.js':'video-controls.js','/video-template.js':'video-template.js','/video-contract':'video-contract.txt', '/': 'index.html', '/style.css': 'style.css', '/app.js': 'app.js', '/prompts.js': 'prompts.js', '/prompt':'prompts/motion.txt', '/prompt/motion':'prompts/motion.txt', '/prompt/3d':'prompts/3d.txt', '/prompt/images':'prompts/images.txt', '/prompt/media':'prompts/media.txt', '/prompt/subtitles':'prompts/subtitles.txt', '/effects.js':'effects.js','/effects-controls.js':'effects-controls.js','/history-controls.js':'history-controls.js','/paste-placement.js':'paste-placement.js','/track-edit.js':'track-edit.js','/track-state.js':'track-state.js','/tracks.js':'tracks.js', '/track-controls.js':'track-controls.js', '/scene.js': 'scene.js', '/composition.js':'composition.js', '/image-clip.js':'image-clip.js', '/three-controls.js':'three-controls.js','/model-template.js':'model-template.js','/models.js':'models.js','/glb-engine.js':'glb-engine.js','/model-controls.js':'model-controls.js','/three.js':'three.js', '/three-template.js':'three-template.js', '/export-settings.js':'export-settings.js', '/subtitles.js':'subtitles.js', '/subtitle-controls.js':'subtitle-controls.js', '/audio-controls.js':'audio-controls.js', '/subtitle-contract':'SUBTITULOS.md', '/assets.js':'assets.js', '/image-controls.js':'image-controls.js', '/contract':'contract.txt', '/icon.png':'icon.png', '/icon.ico':'icon.ico' };
    files['/overlay-lanes.js']='overlay-lanes.js';
    files['/prompt']='prompts/general.txt';
    files['/prompt/general']='prompts/general.txt';
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
const assetPruner=setInterval(()=>{if(activeDownloads)return;const cutoff=Date.now()-60*60*1000;for(const job of jobs.values())if(job.kind==='asset'&&job.createdAt<cutoff&&!['preparing','rendering','encoding'].includes(job.status)){try{fs.rmSync(path.join(output,job.id+'.mov'),{force:true});jobs.delete(job.id);}catch(error){console.error('No se pudo liberar el asset '+job.id+': '+error.message);}}for(const session of assetSessions.values())if(session.createdAt<cutoff&&active?.assetId!==session.id)void releaseAssetV2(session).catch(error=>console.error('No se pudo liberar el proyecto asset: '+error.message));},5*60*1000);assetPruner.unref();
server.on('close',()=>{clearInterval(assetPruner);waveAbort.abort();for(const pending of pendingProjects.values())fs.rmSync(pending.file,{force:true});pendingProjects.clear();for(const session of assetSessions.values())if(session.file)fs.rmSync(session.file,{force:true});assetSessions.clear();audioStore.close();try{if(JSON.parse(fs.readFileSync(runtimeFile,'utf8')).pid===process.pid)fs.rmSync(runtimeFile,{force:true});}catch{}});
server.listen(config.port,'127.0.0.1');
function stop() { importAbort?.abort(); active && (active.cancelled = true); active?.cancel?.(); server.close(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);






