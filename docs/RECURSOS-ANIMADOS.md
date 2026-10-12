# MGT 0.9.2 · SVG y final de recursos

Código → Capturar código y ayuda → Código SVG animado → Aplicar. En Propiedades importa tu .svg. examples/11-svg-animado.mgt.json incluye una animación transparente de 0,5 segundos; examples/svg-prueba.svg permite probar el importador. MGT y cada Overlay conservan recursos y propiedades independientes.

Las plantillas Código GIF, Código vídeo MP4 y Código SVG animado declaran Al terminar: Conservar último fotograma, Repetir u Ocultar. No cambian la duración del proyecto ni del clip. El lector controla el tiempo local y la exportación espera cada imagen. Al comenzar un overlay su recurso comienza en cero. Ocultar termina la imagen del recurso, no el resto de su composición. Las repeticiones escritas en GIF o SVG se ignoran: manda la regla declarada en MGT. Composiciones antiguas sin regla conservan el último fotograma; para añadir opciones a un JSON antiguo declara el control y playback según el contrato siguiente.

## SVG compatible

SVG autocontenido de hasta 1 MB, 2048 px por lado y 4.194.304 píxeles. Hasta 2 SVG animados por composición, dentro del presupuesto conjunto de 25 MB de recursos. Usa el subconjunto estático de MGT más animate y animateTransform autocerrados, anidados directamente en una forma o grupo con id único. Hasta 64 animaciones y 32 valores por animación; un ciclo de hasta 120 s, incluyendo comienzos retrasados.

animate admite x/y/x1/x2/y1/y2/cx/cy/r/rx/ry/width/height/opacity/fill-opacity/stroke-opacity/stroke-width y fill/stroke. Números sin unidades y colores #RRGGBB. animateTransform admite translate, scale y rotate; attributeName="transform". Declara values separados con punto y coma, o from/to. dur y begin son números en segundos o con s/ms; begin predeterminado cero. calcMode linear/discrete; fill freeze/remove. repeatCount omitido, 1 o indefinite se reconoce, pero no determina la repetición del recurso. Una animación por propiedad y elemento. No admite eventos, keyTimes/keySplines, animateMotion, morph de trazados, CSS animado, set, scripts, imágenes ni enlaces externos. Usa fill="freeze" para conservar el valor final de una animación que termina antes que otras.

El importador valida el archivo y prueba su representación antes de reemplazar el anterior. Fuera del subconjunto compatible muestra un error; no realiza conversiones. La animación se elimina de la representación SVG y se aplica mediante interpolación y rasterización estática en el tiempo solicitado. No hay reloj autónomo del navegador ni dependencias nuevas. SVG grandes o muy complejos pueden hacer más lenta la vista previa y la exportación.

## Contrato declarable

version:4; parámetro {id:"svgFile",label:"SVG",type:"svgAnimation",default:"recurso"}; animatedSVGs:{recurso:{name:"archivo.svg",mime:"image/svg+xml",data:"BASE64"}}. Espacio vacío: default:"" y animatedSVGs:{}. Dimensiones/duración se derivan del archivo. canvas[data-mgt-svg="svgFile"] se actualiza automáticamente. ctx.svgAnimation(ctx.params.svgFile) devuelve {width,height,duration,element}, o null si no hay recurso o la regla lo oculta. element es un canvas utilizable con drawImage.

playback asigna una regla por parámetro de recurso, por ejemplo playback:{svgFile:{end:{param:"svgEnd"}}}, con un select declarado svgEnd, options:["hold","loop","hide"] y default:"hold". También admite end literal con esos códigos. MP4 y GIF usan la misma estructura para sus parámetros type:video/type:gif. Los controles deben ser declarados. render sigue síncrono; window.setFrame es asíncrono con recursos animados y el programa espera su resultado.

No añade pista de vídeo base ni guardado del proyecto: esas cotas siguen aparte.
