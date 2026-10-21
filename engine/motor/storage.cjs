// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Composition=require('./public/composition.js');
const Assets=require('./public/assets.js');
const MAX_FILE=Assets.limits.json;
function regularFile(dir,name,pattern){
 if(typeof name!=='string'||name!==path.basename(name)||!pattern.test(name))throw Error('Nombre de archivo no válido.');
 if(fs.lstatSync(dir).isSymbolicLink())throw Error('No se permiten carpetas enlazadas para esta operación.');
 const full=path.resolve(dir,name);if(path.dirname(full)!==path.resolve(dir))throw Error('Ruta no válida.');
 const stat=fs.lstatSync(full);if(!stat.isFile()||stat.isSymbolicLink())throw Error('No es un archivo regular.');return {full,stat};
}
function validateCode(raw){
 if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>MAX_FILE)throw Error('El JSON debe ocupar como máximo 36 MB.');
 raw=raw.replace(/^\uFEFF/,'');let parsed;try{parsed=JSON.parse(raw);}catch{throw Error('El archivo no contiene JSON válido.');}
 const {resources,models,videos,gifs,animatedSVGs,...codeOnly}=parsed;
 if(Buffer.byteLength(JSON.stringify(codeOnly),'utf8')>Assets.limits.code)throw Error('El código y los metadatos sin imágenes superan 8 MB.');
 const validated=Composition.parse(parsed);
 try{new Function('ctx',validated.render);}catch(e){throw Error('Sintaxis de render: '+e.message);}
 if(parsed.editorSettings!==undefined&&(!parsed.editorSettings||!/^#[0-9a-f]{6}$/i.test(parsed.editorSettings.background)))throw Error('Fondo de escena no válido.');
 return {raw,parsed,validated};
}
function createStore(gallery,output){
 fs.mkdirSync(gallery,{recursive:true});fs.mkdirSync(output,{recursive:true});
 const effectPattern=/\.mgt\.json$/i,exportPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(?:\.part)?\.mp4$/i;
 function readEffect(file){const {full,stat}=regularFile(gallery,file,effectPattern);if(stat.size>MAX_FILE)throw Error('El archivo supera 36 MB.');return validateCode(fs.readFileSync(full,'utf8'));}
 function add(raw){const doc=validateCode(raw),stem=doc.validated.name.replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,70)||'Efecto';
 if(fs.lstatSync(gallery).isSymbolicLink())throw Error('La galería no puede ser una carpeta enlazada.');
 const file=stem+'-'+crypto.randomUUID()+'.mgt.json';fs.writeFileSync(path.join(gallery,file),doc.raw,{encoding:'utf8',flag:'wx'});return {file,name:doc.validated.name,code:doc.raw};}
 function remove(file){const {full}=regularFile(gallery,file,effectPattern);fs.unlinkSync(full);return {file};}
 function storage(){const files=[];for(const name of fs.readdirSync(output)){if(!exportPattern.test(name))continue;try{const {stat}=regularFile(output,name,exportPattern);files.push({name,bytes:stat.size});}catch{}}
 return {files,count:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0)};}
 function clean(files){if(!Array.isArray(files)||files.length>10000||new Set(files).size!==files.length)throw Error('Lista de exportaciones no válida.');
 // Validate the entire selection before removing any file; never recurse.
 const entries=files.map(name=>{try{return {name,...regularFile(output,name,exportPattern)};}catch(e){if(e.code==='ENOENT'&&typeof name==='string'&&name===path.basename(name)&&exportPattern.test(name))return null;throw e;}}).filter(Boolean);
 const deleted=[],failed=[];let bytes=0;for(const e of entries){try{fs.unlinkSync(e.full);deleted.push(e.name);bytes+=e.stat.size;}catch{failed.push(e.name);}}return {deleted,failed,bytes};}
 return {readEffect,add,remove,storage,clean};
}
module.exports={createStore,validateCode,MAX_FILE};
