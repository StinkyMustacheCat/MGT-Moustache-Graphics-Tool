// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Composition=require('./public/composition.js'),Subtitles=require('./public/subtitles.js');
function checked(input){const value=Composition.parse(input);if(value.subtitles?.kind!=='template')throw Error('La biblioteca solo guarda plantillas sin transcripción.');new Function('ctx',value.render);return {...input,...value,...(input.metadata?{metadata:{...input.metadata,...value.metadata}}:{})};}
function createStore(dir){
 fs.mkdirSync(dir,{recursive:true});
 function directory(){if(fs.lstatSync(dir).isSymbolicLink())throw Error('La biblioteca no puede ser una carpeta enlazada.');}
 function filename(name){directory();if(typeof name!=='string'||name!==path.basename(name)||!name.endsWith('.wmgt.json'))throw Error('Nombre de plantilla no válido.');const full=path.resolve(dir,name);if(path.dirname(full)!==path.resolve(dir))throw Error('Ruta no válida.');return full;}
 function read(file){const full=filename(file),stat=fs.lstatSync(full);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>36000000)throw Error('Archivo de plantilla no válido o demasiado grande.');const raw=fs.readFileSync(full,'utf8'),parsed=checked(JSON.parse(raw));return {raw,parsed};}
 function add(input){directory();const parsed=checked(input),stem=parsed.name.replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,70)||'Plantilla';const file=stem+'-'+crypto.randomUUID()+'.wmgt.json';fs.writeFileSync(filename(file),JSON.stringify(parsed,null,2),{flag:'wx'});return {file,name:parsed.name};}
 function remove(file){read(file);fs.unlinkSync(filename(file));return {file};}
 function list(){directory();const items=[],errors=[];for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.wmgt.json')).sort()){try{const {parsed}=read(file);items.push({file,name:parsed.name,author:parsed.metadata?.author||'',license:parsed.metadata?.license||''});}catch(e){errors.push({file,error:e.message});}}return {items,errors};}
 function seed(source){directory();const marker=path.join(dir,'.inicializado');if(fs.existsSync(marker))return;if(fs.existsSync(source))for(const file of fs.readdirSync(source).filter(f=>f.endsWith('.wmgt.json'))){const target=filename(file);if(!fs.existsSync(target)){const doc=checked(JSON.parse(fs.readFileSync(path.join(source,file),'utf8')));fs.writeFileSync(target,JSON.stringify(doc,null,2),{flag:'wx'});}}fs.writeFileSync(marker,'MGT 0.5\n',{flag:'wx'});}
 return {read,add,remove,list,seed};
}
module.exports={createStore,checked};
