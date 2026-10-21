# MGT 0.9.0 · MP4 como recurso

En Código, abre Capturar código y ayuda y pulsa Código vídeo MP4. Aplica el código; en Propiedades aparece Importar MP4. También puedes importar examples/09-video-recurso.mgt.json en la biblioteca o cargar ese JSON como Overlay. Incluye un vídeo de prueba de 2 segundos dentro de una composición de 3 segundos, para comprobar el movimiento y la conservación del último fotograma.

Cada MP4 pertenece a su composición. Importar/reemplazar un vídeo de un overlay conserva los recursos de MGT y de los otros clips. El archivo original no se modifica. Guardar/capturar un JSON conserva su MP4 incluido; todavía no guarda toda la estructura del proyecto.

## Funcionamiento de esta cota

- Recurso visual: su audio no se reproduce ni se incorpora a la exportación. Audio y Efectos conservan su mezcla habitual.
- Comienza en el segundo 0 del clip que lo contiene; un overlay situado más tarde comienza igualmente en el segundo 0 de su recurso.
- No cambia la duración del proyecto ni la del overlay. Si el vídeo termina antes, mantiene su último fotograma. Si el clip termina antes, deja de verse con el clip.
- La plantilla declara posición, tamaño, giro, opacidad, ajuste y visibilidad. Se editan en Propiedades. No hay pista de vídeo propia, editor de vídeo ni recorte del recurso en esta cota.
- La vista previa busca los fotogramas de forma asíncrona y descarta solicitudes superadas por otra más reciente. Puede tardar en alcanzar el lector en equipos lentos; la exportación espera el fotograma decodificado antes de capturarlo.

Repetición, reglas de congelar/ocultar y recursos GIF/SVG animado quedan para sus cotas. La pista de vídeo base sigue prevista para 0.9.3.

## Compatibilidad inicial

MP4 autocontenido H.264/AVC de 8 bits, una pista visual, hasta 10 MB por archivo, 120 segundos, 60 fotogramas/s, 1920 px por lado y 1920×1080 píxeles. Puede contener audio, que se ignora como recurso. Hasta 2 MP4 por composición, dentro del presupuesto conjunto de 25 MB de imágenes/modelos/vídeos y 36 MB de JSON. No admite WebM, HEVC, cifrado, referencias externas ni MP4 fragmentado. No hay conversión automática ni recuperación de recursos en esta versión. El importador inspecciona el contenedor y prueba la decodificación antes de reemplazar el recurso.

## Contrato JSON declarable

Usa version:4, un parámetro {id:"videoFile",label:"Vídeo",type:"video",default:"recurso"} y videos:{recurso:{name:"archivo.mp4",mime:"video/mp4",data:"BASE64"}}. Para un espacio vacío, default:"" y videos:{}. Las dimensiones/duración se obtienen del archivo, sin confiar en metadatos escritos en el JSON.

html puede declarar <canvas data-mgt-video="videoFile"></canvas>. El motor pinta el recurso seleccionado por ese parámetro en el fotograma local. Cambia posición y tamaño mediante CSS; el motor controla las dimensiones internas del canvas. También puedes usar ctx.video(ctx.params.videoFile): devuelve {width,height,duration,element} o null. element es un canvas con el fotograma actual, utilizable con drawImage como un recurso de imagen. Declara los espacios de vídeo en parameters. No uses video.play(), URL externos o relojes de pared: el lector controla el tiempo.

render sigue siendo síncrono. window.setFrame devuelve una promesa cuando hay vídeos; los renderizadores/exportadores del programa esperan esa promesa. Las composiciones anteriores sin vídeo conservan su contrato síncrono.
