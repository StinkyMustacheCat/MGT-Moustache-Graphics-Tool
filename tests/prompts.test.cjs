// SPDX-License-Identifier: GPL-3.0-or-later
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const promptDir=path.join(root,'public','prompts');
const prompts=Object.fromEntries(['motion','3d','images','media','subtitles'].map(id=>[id,fs.readFileSync(path.join(promptDir,id+'.txt'),'utf8')]));
const index=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'public','app.js'),'utf8');
const server=fs.readFileSync(path.join(root,'server.cjs'),'utf8');

test('MGT 1.0.0 publica las cinco acciones de prompt y sus rutas',()=>{
  for(const id of Object.keys(prompts)){
    assert.match(index,new RegExp('data-prompt="'+id+'"'));
    assert.match(server,new RegExp("'/prompt/"+id+"'"));
  }
  assert.match(index,/id="promptMenu"[^>]*role="menu"/);
  assert.match(index,/id="promptStatus"/);
  assert.match(app,/copySpecializedPrompt/);
  assert.match(app,/data-prompt/);
  assert.match(app,/navigator\.clipboard\.writeText/);
});

test('todos los prompts comparten el contrato vigente y no arrastran la versión antigua',()=>{
  for(const [id,text] of Object.entries(prompts)){
    assert.match(text,/MGT 1\.0\.0/);
    assert.match(text,/JSON completo, válido/);
    assert.match(text,/version/);
    assert.match(text,/parameters/);
    assert.match(text,/html/);
    assert.match(text,/css/);
    assert.match(text,/render/);
    assert.match(text,/ctx/);
    assert.match(text,/60 FPS/);
    assert.match(text,/saltos hacia atrás|retroceder/);
    assert.doesNotMatch(text,/MGT 0\.6\.3|MGT 0\.9\.0|MGT 0\.9\.1/);
    assert.ok(text.includes('SOLICITUD DEL USUARIO'),id);
  }
});

test('cada prompt especializado cubre los campos que realmente implementa MGT',()=>{
  assert.match(prompts.motion,/stops/);
  assert.match(prompts.motion,/SVG inline/);

  assert.match(prompts['3d'],/version:4/);
  assert.match(prompts['3d'],/scene3d:\{version:1/);
  assert.match(prompts['3d'],/models/);
  assert.match(prompts['3d'],/hasta 64 canales/);

  assert.match(prompts.images,/version:3/);
  assert.match(prompts.images,/data-mgt-image/);
  assert.match(prompts.images,/ctx\.image/);
  assert.match(prompts.images,/PNG, JPEG, WebP estático y SVG estático/);

  assert.match(prompts.media,/videos/);
  assert.match(prompts.media,/gifs/);
  assert.match(prompts.media,/animatedSVGs/);
  assert.match(prompts.media,/hold.*loop.*hide/s);
  assert.match(prompts.media,/ctx\.video/);
  assert.match(prompts.media,/ctx\.gif/);
  assert.match(prompts.media,/ctx\.svgAnimation/);

  assert.match(prompts.subtitles,/subtitles:\{version:1/);
  assert.match(prompts.subtitles,/kind.*template.*composition/s);
  assert.match(prompts.subtitles,/timing.*cue.*word.*estimated/s);
  assert.match(prompts.subtitles,/ctx\.subtitles\.at/);
  assert.match(prompts.subtitles,/no transcribas audio/i);
});
