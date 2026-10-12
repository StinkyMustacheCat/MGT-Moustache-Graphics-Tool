// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const files=['media-input.cjs','FORMATOS-ENTRADA.md','public','examples','licenses','tests','scripts','.gitignore','BUILD.md','CHANGELOG.md','COMPONENTES.json','config.json','CONTRIBUTING.md','Detener MGT.cmd','Ejemplo MGT.mgt.json','Iniciar MGT.cmd','launcher.cjs','startup.cjs','LEEME.md','library.schema.json','LICENSE','LICENSING.md','package.json','Prompt para otras IA.txt','PRUEBAS.md','PUBLICACION.md','README.md','runtime.cjs','server.cjs','moustache-media.cjs','wav-subtitles.cjs','audio-store.cjs','waveform.cjs','layer-render.cjs','layer-render-097.cjs','audio-mix.cjs','child-command.cjs','encoder-drain.cjs','frame-capture.cjs','desktop.cjs','ARRANQUE.md','mp4-metadata.cjs','mp4-import.cjs','MP4-METADATOS.md','3D-DECLARABLE.md','MODELOS-GLB.md','3D-ANIMACION.md','MP4-RECURSOS.md','GIF-RECURSOS.md','RECURSOS-ANIMADOS.md','VIDEO-BASE.md','PISTAS-0.7.0.md','PISTAS-0.7.1.md','PISTAS-0.7.2.md','PISTAS-0.7.3.md','PISTAS-0.7.4.md','MGT.exe','AUDIO-WAV.md','schemas','WAV-SUBTITULOS.md','storage.cjs','subtitle-store.cjs','SUBTITULOS.md','NOVEDADES-0.5.1.md'];
function stage(destination){
 if(!destination)throw Error('Indica una carpeta de salida nueva.');
 const output=path.resolve(destination),relative=path.relative(root,output);
 if(!relative||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw Error('La salida debe estar fuera del proyecto.');
 if(fs.existsSync(output))throw Error('La carpeta de salida ya existe.');
 const runtime=path.resolve(process.env.MGT_RUNTIME_SOURCE||path.join(root,'runtime'));
 for(const file of [...files,'galeria/LEEME.txt'])if(!fs.existsSync(path.join(root,file)))throw Error('Falta: '+file);
 for(const file of ['node/node.exe','chromium/chrome.exe','ffmpeg/ffmpeg.exe','ffmpeg/ffprobe.exe','playwright-core/package.json'])if(!fs.existsSync(path.join(runtime,file)))throw Error('Falta en runtime: '+file);
 fs.mkdirSync(output,{recursive:true});
 for(const file of files)fs.cpSync(path.join(root,file),path.join(output,file),{recursive:true,errorOnExist:true,force:false});
 fs.cpSync(runtime,path.join(output,'runtime'),{recursive:true,errorOnExist:true,force:false});
 fs.writeFileSync(path.join(output,'config.json'),JSON.stringify({chromium:'runtime/chromium/chrome.exe',dataMode:'local',port:43871,playwright:'runtime/playwright-core',ffmpeg:'runtime/ffmpeg/ffmpeg.exe'},null,2)+'\n');
 fs.mkdirSync(path.join(output,'galeria'));fs.copyFileSync(path.join(root,'galeria/LEEME.txt'),path.join(output,'galeria/LEEME.txt'));
 for(const name of ['01-fondo.mgt.json','02-corazon.mgt.json','03-perspectiva.mgt.json'])fs.copyFileSync(path.join(root,'examples',name),path.join(output,'galeria',name));
 const manifest={};function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.isFile())manifest[path.relative(output,full).split(path.sep).join('/')]=crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');else throw Error('Archivo enlazado no admitido: '+full);}}walk(output);
 fs.writeFileSync(path.join(output,'SHA256-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');console.log('Portable preparado: '+output);
}
if(require.main===module){try{stage(process.argv[2]);}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={files,stage};





