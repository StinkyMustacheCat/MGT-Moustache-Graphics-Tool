// SPDX-License-Identifier: GPL-3.0-or-later
(function(root){
 'use strict';
 const limits=Object.freeze({count:8,file:10000000,svg:1000000,side:4096,pixels:16000000,totalPixels:32000000,totalBytes:25000000,json:36000000,code:8388608});
 const fail=m=>{throw Error(m);};
 const ascii=(a,s,n)=>String.fromCharCode(...a.subarray(s,s+n));
 function inspect(bytes){
  const a=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),v=new DataView(a.buffer,a.byteOffset,a.byteLength),n=a.length;
  const need=(p,l)=>{if(p<0||p+l>n)fail('Imagen incompleta o dañada.');};
  let mime,width,height;
  if(n>=24&&ascii(a,0,8)==='\x89PNG\r\n\x1a\n'){
   mime='image/png';let p=8,ended=false,header=false;
   while(p<n){need(p,12);const len=v.getUint32(p),type=ascii(a,p+4,4);need(p+8,len+4);
    if(type==='acTL'||type==='fcTL'||type==='fdAT')fail('No se admiten imágenes animadas (APNG).');
    if(!header){if(type!=='IHDR'||len!==13)fail('Cabecera PNG no válida.');width=v.getUint32(p+8);height=v.getUint32(p+12);header=true;}
    p+=len+12;if(type==='IEND'){ended=true;break;}
   }if(!ended||p!==n)fail('PNG incompleto o con datos adicionales.');
  }else if(n>=4&&a[0]===255&&a[1]===216){
   mime='image/jpeg';let p=2;
   while(p<n){need(p,2);if(a[p++]!==255)fail('JPEG no válido.');while(a[p]===255)p++;const marker=a[p++];if(marker===217||marker===218)break;if(marker===1||(marker>=208&&marker<=215))continue;
    need(p,2);const len=v.getUint16(p);if(len<2)fail('JPEG no válido.');need(p,len);
    if(marker===226&&ascii(a,p+2,4)==='MPF\0')fail('No se admiten JPEG de múltiples imágenes.');
    if([192,193,194].includes(marker)){need(p,7);height=v.getUint16(p+3);width=v.getUint16(p+5);}
    p+=len;
   }if(a[n-2]!==255||a[n-1]!==217)fail('JPEG incompleto.');
  }else if(n>=20&&ascii(a,0,4)==='RIFF'&&ascii(a,8,4)==='WEBP'){
   mime='image/webp';if(v.getUint32(4,true)+8!==n)fail('WebP incompleto.');let p=12;
   const u24=i=>a[i]+a[i+1]*256+a[i+2]*65536;
   while(p<n){need(p,8);const type=ascii(a,p,4),len=v.getUint32(p+4,true),start=p+8;need(start,len);
    if(type==='ANIM'||type==='ANMF')fail('No se admiten imágenes WebP animadas.');
    if(type==='VP8X'){if(len!==10)fail('WebP no válido.');if(a[start]&2)fail('No se admiten imágenes WebP animadas.');width=u24(start+4)+1;height=u24(start+7)+1;}
    if(type==='VP8 '&&!width){need(start,10);if(ascii(a,start+3,3)!=='\x9d\x01\x2a')fail('WebP no válido.');width=v.getUint16(start+6,true)&16383;height=v.getUint16(start+8,true)&16383;}
    if(type==='VP8L'&&!width){need(start,5);if(a[start]!==47)fail('WebP no válido.');width=1+((a[start+1]|a[start+2]<<8)&16383);height=1+((a[start+2]>>6|a[start+3]<<2|a[start+4]<<10)&16383);}
    p=start+len+(len%2);
   }if(p!==n)fail('WebP no válido.');
  }else{
   let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(a);}catch{fail('Formato no admitido. Usa PNG, JPEG, WebP estático o SVG.');}
   const svg=inspectSVG(text);return {mime:'image/svg+xml',...svg,bytes:n};
  }
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)fail('No se pudieron leer las dimensiones de la imagen.');
  return {mime,width,height,bytes:n};
 }
 // A deliberately small static SVG subset. Parse every tag/attribute; do not
 // inject uploaded markup into the document. Unsupported content is rejected.
 function inspectSVG(source){
  if(new TextEncoder().encode(source).length>limits.svg)fail('SVG: máximo 1 MB.');
  let text=source.replace(/^\uFEFF/,'').replace(/^\s*<\?xml\s+[^?]*\?>/,'').replace(/<!--[\s\S]*?-->/g,'');
  if(/<\?|<!|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))fail('SVG: declaraciones, entidades y contenido activo no admitidos.');
  const tags=new Set('svg g defs path rect circle ellipse line polyline polygon linearGradient radialGradient stop clipPath mask title desc text tspan'.split(' '));
  const attrs=new Set('id xmlns version width height viewBox preserveAspectRatio x y x1 y1 x2 y2 cx cy r rx ry d points transform fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity clip-path clip-rule mask maskUnits maskContentUnits gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity fx fy fr font-family font-size font-weight font-style text-anchor dominant-baseline dx dy rotate vector-effect paint-order color'.split(' '));
  const stack=[];let count=0,pos=0,rootAttrs=null,closed=false;
  const decode=s=>s.replace(/&(?:amp|lt|gt|quot|apos);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"}[m]));
  while(pos<text.length){
   const next=text.indexOf('<',pos),end=next<0?text.length:next,content=text.slice(pos,end);
   if(/&(?!(?:amp|lt|gt|quot|apos);)/.test(content))fail('SVG: entidad no admitida.');
   if(content.trim()&&!['text','tspan','title','desc'].includes(stack.at(-1)))fail('SVG: texto fuera de un elemento de texto.');
   if(next<0){pos=end;break;}
   const token=/^<\s*(\/?)\s*([A-Za-z][\w-]*)\b((?:[^<>"']|"[^"]*"|'[^']*')*)>/.exec(text.slice(next));
   if(!token)fail('SVG mal formado.');pos=next+token[0].length;
   const [,closing,tag,tail]=token;if(!tags.has(tag))fail('SVG: elemento no admitido «'+tag+'». Exporta un SVG estático con formas y trazados.');
   if(closing){if(tail.trim()||stack.pop()!==tag)fail('SVG: etiquetas no coinciden.');if(!stack.length)closed=true;continue;}
   if(closed||(!stack.length&&tag!=='svg')||(++count>5000))fail('SVG: estructura no válida o más de 5000 elementos.');
   const self=/\/\s*$/.test(tail),body=self?tail.replace(/\/\s*$/,''):tail,values={};let at=0;
   while(at<body.length){if(!body.slice(at).trim())break;const attr=/^\s+([A-Za-z][\w:-]*)\s*=\s*("[^"]*"|'[^']*')/.exec(body.slice(at));if(!attr)fail('SVG: atributo no válido.');at+=attr[0].length;
    const key=attr[1],raw=attr[2].slice(1,-1);if(!attrs.has(key)||Object.hasOwn(values,key))fail('SVG: atributo no admitido «'+key+'».');
    if(/&(?!(?:amp|lt|gt|quot|apos);)/.test(raw)||/[<>\\]/.test(raw))fail('SVG: valor de atributo no admitido.');const val=decode(raw);
    if(key==='xmlns'&&val!=='http://www.w3.org/2000/svg')fail('SVG: namespace no válido.');
    if(key!=='xmlns'&&(/(?:https?:|data:|javascript:|@|\/\/)/i.test(val)||(/url/i.test(val)&&!/^url\(\s*#[A-Za-z_][\w.-]*\s*\)$/.test(val))))fail('SVG: no se permiten recursos externos.');
    if(key==='d'&&val.length>100000)fail('SVG: trazado demasiado complejo.');values[key]=val;
   }
   if(!rootAttrs)rootAttrs=values;if(!self)stack.push(tag);else if(!stack.length)closed=true;if(stack.length>64)fail('SVG: demasiados grupos anidados.');
  }
  if(!rootAttrs||stack.length||!closed)fail('SVG incompleto.');if(rootAttrs.xmlns!=='http://www.w3.org/2000/svg')fail('SVG necesita xmlns="http://www.w3.org/2000/svg".');
  const box=(rootAttrs.viewBox||'').trim().split(/[\s,]+/).map(Number),dim=s=>s&&/^\d*\.?\d+(?:px)?$/.test(s)?Number(s.replace('px','')):NaN;
  let width=dim(rootAttrs.width),height=dim(rootAttrs.height);
  if(!Number.isFinite(width)||!Number.isFinite(height)){if(box.length!==4||!box.every(Number.isFinite)||box[2]<=0||box[3]<=0)fail('SVG necesita width/height en píxeles o un viewBox válido.');width=box[2];height=box[3];}
  if(width<=0||height<=0||width>4096||height>4096||width*height>16000000)fail('SVG: dimensiones de referencia hasta 4096 px y 16 MP.');
  return {width,height};
 }
 function decode64(data){if(typeof data!=='string'||!data.length||data.length%4||data.length>Math.ceil(limits.file/3)*4||/[^A-Za-z0-9+/=]/.test(data)||/=/.test(data.slice(0,-2))||!/[A-Za-z0-9+/](?:[A-Za-z0-9+/]{2}|[A-Za-z0-9+/]=|==)$/.test(data))fail('Recurso: datos base64 no válidos.');
  if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(data,'base64'));const raw=atob(data);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
 function validate(resources={}){
  if(!resources||typeof resources!=='object'||Array.isArray(resources))fail('resources debe ser un objeto.');const entries=Object.entries(resources);if(entries.length>limits.count)fail('Máximo 8 imágenes diferentes.');
  const result={};let bytes=0,pixels=0;
  for(const [id,a]of entries){if(!/^[A-Za-z][\w-]{0,79}$/.test(id)||['constructor','prototype','__proto__'].includes(id)||!a||typeof a!=='object')fail('Identificador de recurso no válido.');
   if(typeof a.name!=='string'||a.name.length>160)fail('Nombre de imagen no válido.');const info=inspect(decode64(a.data));
   if(a.mime!==info.mime)fail('El formato declarado no coincide con el archivo.');
   if(info.bytes>limits.file||info.width>limits.side||info.height>limits.side||info.width*info.height>limits.pixels)fail('Imagen demasiado grande: máximo 10 MB, 4096 px por lado y 16 MP.');
   bytes+=info.bytes;if(info.mime!=='image/svg+xml')pixels+=info.width*info.height;
   result[id]={name:a.name,mime:info.mime,width:info.width,height:info.height,data:a.data};
  }
  if(bytes>limits.totalBytes||pixels>limits.totalPixels)fail('La composición supera 25 MB de imágenes o 32 megapíxeles raster.');return result;
 }
 const url=a=>'data:'+a.mime+';base64,'+a.data;
 const api={limits,inspect,inspectSVG,decode64,validate,url};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MGTAssets=api;
})(typeof window!=='undefined'?window:globalThis);
