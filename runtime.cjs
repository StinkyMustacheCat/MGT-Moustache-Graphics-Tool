// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const root=__dirname,config={...require('./config.json')};
for(const key of ['playwright','chromium','ffmpeg']){if(typeof config[key]!=='string')throw Error('Falta '+key+' en config.json.');config[key]=path.resolve(root,config[key]);}
if(!Number.isInteger(config.port)||config.port<1024||config.port>65515)throw Error('Puerto no válido en config.json.');
const instanceId=crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,16);
const dataRoot=process.env.MGT_DATA_ROOT||path.join(process.env.LOCALAPPDATA||os.tmpdir(),'MGT');
const dataDir=config.dataMode==='local'?path.join(dataRoot,instanceId):root;
const runtimeFile=path.join(dataDir,'running.json');
fs.mkdirSync(dataDir,{recursive:true});
module.exports={root,config,dataDir,instanceId,runtimeFile,version:require('./package.json').version};


