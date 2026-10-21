// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
const S=require('./public/subtitles.js');
function convert(payload){
 const warnings=[],a=payload.analysis;let fallback=0;
 const clean=s=>({text:s.text,start:s.start,end:s.end});
 const cues=a.transcript.timeline.map(s=>{const c=clean(s),words=s.words;
  if(words.length&&words.every(w=>w.start!==null&&w.end>w.start)&&words.map(w=>w.text).join(' ').replace(/\s+/g,' ').trim()===s.text.replace(/\s+/g,' ').trim())c.words=words.map(clean);
  else fallback++;return c;
 });
 if(!cues.length)throw Error('El WAV no contiene segmentos de subtítulos.');
 if(fallback)warnings.push(`${fallback} bloques se conservan por segmento: sus palabras no tienen tiempos completos o no corresponden al texto.`);
 if(a.annotations.length)warnings.push(`${a.annotations.length} advertencias heredadas de Wordline (palabras cortadas o texto sin alineamiento verificado). Revisa el texto; importar no verifica el audio.`);
 const subtitles=S.validate({version:1,kind:'composition',timing:cues.every(c=>c.words)?'word':'cue',tail:.25,cues});
 return {subtitles,warnings};
}
module.exports={convert};
