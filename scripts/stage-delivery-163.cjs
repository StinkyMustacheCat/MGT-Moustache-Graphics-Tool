// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(__dirname,'..'),version=require('../package.json').version;
function stage(destination,portable,engine){
 if(!destination||!portable||!engine)throw Error('Indica destino nuevo, portable y motor.');
 const output=path.resolve(destination);if(fs.existsSync(output))throw Error('El destino ya existe.');
 for(const item of [portable,engine])if(!fs.existsSync(path.join(item,'SHA256-MANIFEST.json')))throw Error('Falta manifiesto de paquete: '+item);
 fs.mkdirSync(output,{recursive:true});
 fs.cpSync(path.resolve(portable),path.join(output,'MGT-'+version+'-portable'),{recursive:true,errorOnExist:true,force:false});
 fs.cpSync(path.resolve(engine),path.join(output,'MGT-'+version+'-engine'),{recursive:true,errorOnExist:true,force:false});
 fs.copyFileSync(path.join(source,'ENTREGA-'+version+'.md'),path.join(output,'LEEME.md'));
 const hashes={};function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else if(item.isFile()){const relative=path.relative(output,file).split(path.sep).join('/');if(relative!=='SHA256-MANIFEST.json')hashes[relative]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}else throw Error('Enlace no admitido.');}}walk(output);
 fs.writeFileSync(path.join(output,'SHA256-MANIFEST.json'),JSON.stringify(hashes,null,2)+'\n');return {output,files:Object.keys(hashes).length};
}
if(require.main===module){try{console.log(stage(process.argv[2],process.argv[3],process.argv[4]));}catch(error){console.error(error);process.exitCode=1;}}
module.exports={stage};
