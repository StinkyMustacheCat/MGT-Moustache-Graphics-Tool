// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(__dirname,'..');
function stage(destination,runtimeSource){
 if(!destination||!runtimeSource)throw Error('Indica carpeta nueva y runtime existente.');
 const output=path.resolve(destination),runtime=path.resolve(runtimeSource);
 if(fs.existsSync(output))throw Error('El destino ya existe; no se sobrescribe.');
 for(const name of ['node/node.exe','chromium/chrome.exe','ffmpeg/ffmpeg.exe','ffmpeg/ffprobe.exe','playwright-core/package.json'])if(!fs.existsSync(path.join(runtime,name)))throw Error('Falta dependencia: '+name);
 const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.cpSync(from,to,{recursive:true,errorOnExist:true,force:false});};
 fs.mkdirSync(output,{recursive:true});copy(runtime,path.join(output,'runtime'));
 const motor=path.join(output,'motor');fs.mkdirSync(motor);
 for(const item of fs.readdirSync(source,{withFileTypes:true}))if(item.isFile()&&item.name.endsWith('.cjs'))copy(path.join(source,item.name),path.join(motor,item.name));
 for(const name of ['public','examples','schemas','package.json'])copy(path.join(source,name),path.join(motor,name));
 fs.writeFileSync(path.join(motor,'config.json'),JSON.stringify({chromium:'../runtime/chromium/chrome.exe',dataMode:'local',port:43871,playwright:'../runtime/playwright-core',ffmpeg:'../runtime/ffmpeg/ffmpeg.exe'},null,2)+'\n');
 fs.mkdirSync(path.join(motor,'galeria'));fs.mkdirSync(path.join(motor,'subtitulos'));
 for(const name of ['MGT-ASSET-CONTRACT.md','MGT-ASSET-CONTRACT-v2.md','README.md','LICENSE','LICENSING.md','COMPONENTES.json'])copy(path.join(source,name),path.join(output,'documentacion',name));
 copy(path.join(source,'licenses'),path.join(output,'documentacion','licenses'));
 copy(path.join(source,'third-party','ffmpeg'),path.join(output,'documentacion','third-party','ffmpeg'));
 copy(path.join(source,'examples','asset-v2'),path.join(output,'ejemplos'));
 const hashes={};function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else if(item.isFile()){const relative=path.relative(output,file).split(path.sep).join('/');if(relative!=='SHA256-MANIFEST.json')hashes[relative]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}else throw Error('Enlace no admitido: '+file);}}walk(output);
 fs.writeFileSync(path.join(output,'SHA256-MANIFEST.json'),JSON.stringify(hashes,null,2)+'\n');
 return {output,files:Object.keys(hashes).length,version:require(path.join(motor,'package.json')).version};
}
if(require.main===module){try{console.log(stage(process.argv[2],process.argv[3]));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={stage};
