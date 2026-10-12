// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(__dirname,'..');
function stage(destination,runtimeSource){
 if(!destination||!runtimeSource)throw Error('Indica carpeta de salida nueva y carpeta runtime existente.');
 const output=path.resolve(destination),runtime=path.resolve(runtimeSource);
 if(fs.existsSync(output))throw Error('La carpeta de salida ya existe.');
 for(const name of ['node/node.exe','chromium/chrome.exe','ffmpeg/ffmpeg.exe','ffmpeg/ffprobe.exe','playwright-core/package.json'])if(!fs.existsSync(path.join(runtime,name)))throw Error('Falta en runtime: '+name);
 const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.cpSync(from,to,{recursive:true,errorOnExist:true,force:false});};
 fs.mkdirSync(output,{recursive:true});
 copy(path.join(source,'MGT.exe'),path.join(output,'MGT.exe'));
 copy(path.join(source,'Iniciar MGT.cmd'),path.join(output,'Iniciar MGT.cmd'));
 copy(path.join(source,'Detener MGT.cmd'),path.join(output,'Detener MGT.cmd'));
 copy(path.join(source,'scripts','portable-launcher.cjs'),path.join(output,'launcher.cjs'));
 copy(runtime,path.join(output,'runtime'));
 const app=path.join(output,'programa');fs.mkdirSync(app,{recursive:true});
 for(const entry of fs.readdirSync(source,{withFileTypes:true}))if(entry.isFile()&&entry.name.endsWith('.cjs'))copy(path.join(source,entry.name),path.join(app,entry.name));
 for(const name of ['public','examples','schemas','scripts','tests','package.json'])copy(path.join(source,name),path.join(app,name));
 fs.writeFileSync(path.join(app,'config.json'),JSON.stringify({chromium:'../runtime/chromium/chrome.exe',dataMode:'local',port:43871,playwright:'../runtime/playwright-core',ffmpeg:'../runtime/ffmpeg/ffmpeg.exe'},null,2)+'\n');
 const docs=path.join(output,'documentacion');fs.mkdirSync(docs);
 for(const entry of fs.readdirSync(source,{withFileTypes:true}))if(entry.isFile()&&(/\.md$/i.test(entry.name)||['LICENSE','LICENSING.md'].includes(entry.name)))copy(path.join(source,entry.name),path.join(docs,entry.name));
 copy(path.join(source,'LEEME.md'),path.join(output,'LEEME.txt'));
 copy(path.join(source,'licenses'),path.join(docs,'licenses'));
 fs.mkdirSync(path.join(output,'galeria'));fs.mkdirSync(path.join(output,'subtitulos'));
 for(const name of ['01-fondo.mgt.json','02-corazon.mgt.json','03-perspectiva.mgt.json'])copy(path.join(source,'examples',name),path.join(output,'galeria',name));
 const hashes={};function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile()){const relative=path.relative(output,full).split(path.sep).join('/');if(relative!=='SHA256-MANIFEST.json')hashes[relative]=crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');}else throw Error('Enlace no admitido: '+full);}}walk(output);
 fs.writeFileSync(path.join(output,'SHA256-MANIFEST.json'),JSON.stringify(hashes,null,2)+'\n');
 return {output,files:Object.keys(hashes).length};
}
if(require.main===module){try{console.log(stage(process.argv[2],process.argv[3]));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={stage};
