// SPDX-License-Identifier: GPL-3.0-or-later
(function(root){
 'use strict';
 const resolutions=Object.freeze([480,540,720,1080,1440,2160]);
 const defaults=Object.freeze({resolution:1080,quality:'auto',bitrate:16});
 function normalize(value={}){if(!value||typeof value!=='object')value={};const quality=['auto','bitrate','quick'].includes(value.quality)?value.quality:defaults.quality;return {resolution:quality==='quick'?540:resolutions.includes(value.resolution)?value.resolution:1080,quality,bitrate:Number.isFinite(value.bitrate)&&value.bitrate>=1&&value.bitrate<=200?value.bitrate:16};}
 function dimensions(aspect,resolution){if(!resolutions.includes(resolution))throw Error('Resolución no admitida.');const long=Math.round(resolution*16/9/2)*2;if(aspect==='horizontal')return [long,resolution];if(aspect==='vertical')return [resolution,long];if(aspect==='square')return [resolution,resolution];if(aspect==='classic')return [Math.round(resolution*4/3/2)*2,resolution];throw Error('Proporción no válida.');}
 function compression(quick,bitrate){if(quick)return ['-preset','superfast','-crf','23'];return ['-preset','veryfast',...(bitrate===null?['-crf','18']:['-b:v',String(bitrate)+'M'])];}
 const api={resolutions,defaults,normalize,dimensions,compression};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MGTExport=api;
})(typeof window!=='undefined'?window:globalThis);
