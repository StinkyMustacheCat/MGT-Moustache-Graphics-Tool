// SPDX-License-Identifier: GPL-3.0-or-later
const test=require('node:test'),assert=require('node:assert/strict'),Lanes=require('../public/overlay-lanes.js');
const LayerRender=require('../layer-render-097.cjs'),Scene=require('../public/scene.js');
const document={version:2,name:'MGT',parameters:[{id:'size',label:'Tamaño',type:'number',default:20,min:0,max:100,step:1}],html:'<div></div>',css:'',render:'',recommended:{duration:3}};

test('different visual lanes can overlap while same-lane clips collide',()=>{
 const model=Lanes.create(),second=model.addLane('Overlay 2');for(let i=0;i<20;i++)model.addLane('Overlay '+(i+3));
 model.addClip('overlay-1',{id:'lower',document,start:0,frames:180});model.addClip(second,{id:'upper',document,start:0,frames:180});
 assert.equal(model.snapshot().length,22);assert.deepEqual(model.active(60).map(x=>[x.clip.id,x.layer,x.sourceFrame]),[['lower',0,60],['upper',1,60]]);
 assert.throws(()=>model.moveClip('lower',second,30),/choca/);assert.equal(model.find('lower').start,0);
 model.moveClip('lower',second,180);assert.equal(model.find('lower').start,180);
});

test('left and right trims change visibility without changing the source clock or speed',()=>{
 const model=Lanes.create();model.addClip('overlay-1',{id:'clip',document,start:60,frames:180});
 model.trimClip('clip','left',90);assert.deepEqual([model.find('clip').start,model.find('clip').frames,model.find('clip').inFrame,model.find('clip').sourceFrames],[90,150,30,180]);assert.equal(model.active(90)[0].sourceFrame,30);
 model.trimClip('clip','right',180);assert.equal(model.active(179)[0].sourceFrame,119);assert.equal(model.active(180).length,0);
 model.trimClip('clip','left',60);model.trimClip('clip','right',240);assert.deepEqual([model.find('clip').start,model.find('clip').frames,model.find('clip').inFrame],[60,180,0]);
 assert.throws(()=>model.trimClip('clip','right',241),/duración original/);
});

test('MGT source duration retimes both time and progress without changing its visible trim',()=>{
 const model=Lanes.create();model.addClip('overlay-1',{id:'retimed',kind:'mgt',document,start:30,frames:600,sourceFrames:600});
 model.setSourceDuration('retimed',1200);
 assert.deepEqual([model.find('retimed').frames,model.find('retimed').sourceFrames,model.find('retimed').authoredFrames],[600,1200,600]);
 assert.equal(model.active(30)[0].sourceFrame,0);
 assert.equal(model.active(629)[0].sourceFrame,299);
 assert.equal(model.active(630).length,0);
 model.trimClip('retimed','right',1230);
 assert.equal(model.active(1229)[0].sourceFrame,599);
 model.trimClip('retimed','left',630);
 assert.equal(model.active(630)[0].sourceFrame,300);
 const saved=model.snapshot(),restored=Lanes.create();restored.restore(saved);
 assert.equal(restored.active(630)[0].sourceFrame,300);
 assert.throws(()=>restored.setSourceDuration('retimed',500),/Recorta primero/);
 assert.deepEqual(restored.snapshot(),saved);
 restored.setSourceDuration('retimed',1500);
 assert.equal(restored.find('retimed').authoredFrames,600);
});

test('source retiming is restricted to MGT and malformed saved values are rejected',()=>{
 const model=Lanes.create();model.addClip('overlay-1',{id:'video',kind:'video',document,start:0,frames:60});
 assert.throws(()=>model.setSourceDuration('video',120),/solo se ajusta/);
 const invalid=model.snapshot();invalid[0].clips[0].authoredFrames=120;
 assert.throws(()=>model.restore(invalid),/Solo los MGT/);
 assert.equal(model.active(30)[0].sourceFrame,30);
});

test('shortening the project removes clips entirely outside and trims only visible length',()=>{
 const model=Lanes.create(),second=model.addLane();model.addClip('overlay-1',{id:'partial',document,start:90,frames:180});model.addClip(second,{id:'outside',document,start:250,frames:180});
 assert.deepEqual(model.fitProject(180),{removed:['outside'],trimmed:['partial']});assert.deepEqual([model.find('partial').frames,model.find('partial').sourceFrames,model.find('partial').inFrame],[90,180,0]);
 model.trimClip('partial','right',270);assert.equal(model.find('partial').frames,180);
});

test('restoration rejects invalid clips atomically and keeps lanes independent',()=>{
 const model=Lanes.create(),second=model.addLane();model.addClip(second,{id:'saved',document,start:12,frames:90,sourceFrames:180,inFrame:20,params:{size:75}});const saved=model.snapshot();
 model.moveClip('saved','overlay-1',20);model.restore(saved);assert.equal(model.snapshot()[1].clips[0].params.size,75);assert.equal(model.find('saved').inFrame,20);
 const invalid=structuredClone(saved);invalid[1].clips[0].inFrame=100;assert.throws(()=>model.restore(invalid),/duración original/);assert.deepEqual(model.snapshot(),saved);
});

test('clip editing keeps timing and validates changes before committing',()=>{
 const model=Lanes.create();model.addClip('overlay-1',{id:'editable',document,start:40,frames:90,sourceFrames:180,inFrame:25});
 model.parameters('editable',{size:80});assert.equal(model.find('editable').params.size,80);
 assert.throws(()=>model.parameters('editable',{size:200}));assert.equal(model.find('editable').params.size,80);
 const replacement={...document,name:'Nuevo'};model.replaceClip('editable',replacement,{size:30});
 assert.deepEqual([model.find('editable').document.name,model.find('editable').start,model.find('editable').sourceFrames,model.find('editable').inFrame,model.find('editable').revision],['Nuevo',40,180,25,1]);
 assert.throws(()=>model.replaceClip('editable',{...document,render:'invalid('},{size:50}));assert.equal(model.find('editable').document.name,'Nuevo');
 const removed=model.removeClip('editable');assert.equal(removed.id,'editable');assert.deepEqual(model.active(40),[]);
});

test('removing a lane preserves clips only with an explicit destination',()=>{
 const model=Lanes.create(),second=model.addLane('Superior');model.addClip(second,{id:'one',document,start:0,frames:60});
 const before=model.snapshot();assert.throws(()=>model.removeLane(second),/destino/);assert.deepEqual(model.snapshot(),before);
 model.removeLane(second,'overlay-1');assert.equal(model.snapshot().length,1);assert.equal(model.active(0)[0].clip.id,'one');
 assert.throws(()=>model.removeLane('overlay-1'),/al menos una/);
});

test('legacy visual tracks migrate to ordered Overlay lanes without losing clip timing',()=>{
 const clip=(id,start,frames)=>({id,document,start,frames,params:{size:60},seed:7});
 const converted=Lanes.fromLegacy({video:[clip('base',0,120)],mainPresent:true,mainDocument:document,mainFrames:180,mainStart:0,mainParams:{size:40},mainSeed:9,mgt:[clip('graphic',180,90)],overlays:[clip('upper',80,60)]});
 const model=Lanes.create();model.restore(converted);
 assert.deepEqual(model.snapshot().map(l=>l.name),['Overlay 1','Overlay 2','Overlay 3']);
 assert.deepEqual(model.active(90).map(x=>x.clip.id),['base','legacy-main','upper']);
 assert.equal(model.find('graphic').params.size,60);assert.equal(model.find('legacy-main').seed,9);
 assert.throws(()=>Lanes.fromLegacy({mainPresent:true,mainFrames:180}),/principal/);
});

test('recommended-duration mode survives a saved lane snapshot',()=>{
 const model=Lanes.create();model.addClip('overlay-1',{id:'auto',document,start:0,frames:60,sourceFrames:180});model.setAutoDuration('auto',true);
 const saved=model.snapshot(),restored=Lanes.create();restored.restore(saved);assert.equal(restored.find('auto').autoDuration,true);
 restored.trimClip('auto','right',120);assert.equal(restored.find('auto').sourceFrames,180);
});

test('group movement preserves trims, rejects collisions and rolls back invalid destinations',()=>{
 const model=Lanes.create(),upper=model.addLane('Visual 2');
 model.addClip('overlay-1',{id:'a',document,start:15,frames:50,sourceFrames:100,inFrame:10});
 model.addClip('overlay-1',{id:'b',document,start:65,frames:40,sourceFrames:80,inFrame:5});
 assert.throws(()=>model.moveMany([{id:'a',laneId:upper,start:35},{id:'b',laneId:upper,start:75}]),/chocan/);
 model.moveMany([{id:'a',laneId:upper,start:35},{id:'b',laneId:upper,start:85}]);
 assert.deepEqual(model.active(85).map(x=>x.clip.id),['b']);
 assert.deepEqual([model.find('a').inFrame,model.find('b').inFrame],[10,5]);
 const saved=model.snapshot();
 assert.throws(()=>model.moveMany([{id:'a',laneId:'overlay-1',start:4},{id:'b',laneId:'missing',start:2}]),/destino/);
 assert.deepEqual(model.snapshot(),saved);
});

test('export normalizer accepts unified Overlay lanes without reviving the MGT track',()=>{
 const model=Lanes.create();model.addClip('overlay-1',{id:'clip',document,start:0,frames:120,sourceFrames:180,inFrame:30});
 const spec=Scene.normalize({...Scene.defaults,duration:2}),output=LayerRender.normalize({overlayLanes:model.snapshot(),mainPresent:false},spec);
 assert.equal(output.mainPresent,false);assert.deepEqual(output.mgt,[]);assert.equal(output.overlayLanes[0].clips[0].sourceFrames,180);assert.equal(output.overlayLanes[0].clips[0].inFrame,30);
 const invalid=model.snapshot();invalid[0].clips[0].inFrame=120;assert.throws(()=>LayerRender.normalize({overlayLanes:invalid},spec),/duración original/);
 const hidden=LayerRender.normalize({overlayLanes:model.snapshot(),flags:{'overlay-1':{visible:false}}},spec);
 assert.equal(hidden.flags['overlay-1'].visible,false);
 assert.throws(()=>LayerRender.normalize({overlayLanes:model.snapshot(),flags:{'overlay-1':{visible:'no'}}},spec),/Visibilidad/);
});

test('export does not instantiate hidden visual tracks',async()=>{
 const model=Lanes.create();model.addClip('overlay-1',{id:'hidden',document,start:0,frames:60});
 const spec=Scene.normalize({...Scene.defaults,duration:1}),layers=LayerRender.normalize({overlayLanes:model.snapshot(),flags:{'overlay-1':{visible:false}}},spec);
 let created=0;const page={setContent:async()=>{},evaluateHandle:async()=>{created++;throw Error('La pista oculta no debía abrirse.');}};
 const draw=await LayerRender.open(page,spec,null,null,1,layers,1920,1080,async x=>x);
 await draw(0);assert.equal(created,0);
});

test('export samples the same retimed source frames as preview and keeps authored clock',async()=>{
 const model=Lanes.create();model.addClip('overlay-1',{id:'retimed',kind:'mgt',document,start:0,frames:600,sourceFrames:600});model.setSourceDuration('retimed',1200);
 const spec=Scene.normalize({...Scene.defaults,duration:10}),layers=LayerRender.normalize({overlayLanes:model.snapshot()},spec),drawn=[];
 let html='';const scene={waitForFunction:async()=>{},evaluate:async(_fn,frame)=>{if(frame!==undefined)drawn.push(frame);}},page={setContent:async()=>{},evaluateHandle:async(_fn,value)=>{html=value;return {asElement:()=>({contentFrame:async()=>scene}),evaluate:async()=>{}};}};
 const render=await LayerRender.open(page,spec,null,null,1,layers,1920,1080,async x=>x);
 assert(html.includes('"duration":10'));
 await render(0);await render(300);await render(599);
 assert.deepEqual(drawn,[0,150,299]);
});

test('visual rows render bottom first so the top row remains in front',async()=>{
 const model=Lanes.create(),bottom=model.addLane('Visual inferior');
 model.addClip('overlay-1',{id:'top',document:{...document,name:'TOP'},start:0,frames:60});
 model.addClip(bottom,{id:'bottom',document:{...document,name:'BOTTOM'},start:0,frames:60});
 const spec=Scene.normalize({...Scene.defaults,duration:1}),layers=LayerRender.normalize({overlayLanes:model.snapshot()},spec),order=[];
 const scene={waitForFunction:async()=>{},evaluate:async()=>{}},page={setContent:async()=>{},evaluateHandle:async(_fn,html)=>{order.push(html.includes('BOTTOM')?'bottom':'top');return {asElement:()=>({contentFrame:async()=>scene}),evaluate:async()=>{}};}};
 await LayerRender.open(page,spec,null,null,1,layers,1920,1080,async x=>x);
 assert.deepEqual(order,['bottom','top']);
});
