# MGT 0.9.1 · GIF como recurso

En Código, abre Capturar código y ayuda, pulsa Código GIF y aplica el código. Importa el GIF desde Propiedades. El ejemplo examples/10-gif-recurso.mgt.json incluye una animación transparente de 1,1 segundos en una composición recomendada de 3 segundos. Puedes cargarlo en la biblioteca o en Overlay; gif-prueba.gif y gif-paleta.gif permiten probar reemplazos.

Cada composición conserva sus archivos y controles. Importar un GIF en Overlay no cambia el recurso de MGT, la duración del proyecto ni la del clip. El GIF comienza en el tiempo cero local del clip. Recorre un ciclo y conserva el último fotograma; si termina el clip antes, deja de verse con él. Esta cota ignora las repeticiones incorporadas al GIF. Los controles de repetición y de ocultar al terminar quedan para 0.9.2.

La plantilla declara archivo, posición, tamaño, giro, opacidad, ajuste y visibilidad. El GIF conserva su transparencia: el programa no elimina un fondo opaco incluido en el archivo. No se añade una pista GIF ni un editor de fotogramas. Capturar/guardar el JSON conserva el recurso incluido, pero todavía no guarda la estructura completa del proyecto.

## Compatibilidad y límites

GIF87a/89a autocontenido, hasta 10 MB, 2048 px por lado, 4.194.304 píxeles de lienzo, 300 fotogramas y 120 segundos por ciclo. Hasta 2 GIF y 32 millones de píxeles de parches decodificados por composición. El presupuesto conjunto de imágenes, modelos, MP4 y GIF es 25 MB, dentro de 36 MB de JSON. Los retrasos de 0 o 1 centésima se interpretan como 100 ms; los demás conservan sus centésimas originales.

Admite paletas globales/locales, transparencia, entrelazado y disposiciones conservar, restaurar fondo o restaurar anterior. Texto gráfico incrustado y espera de interacción del usuario se rechazan. El importador comprueba todos los datos LZW antes de reemplazar el recurso; un archivo inválido conserva el anterior. No usa imágenes GIF animadas del navegador ni relojes autónomos. Compone los parches necesarios y reconstruye al retroceder, sin guardar todos los fotogramas completos en memoria. Los saltos largos pueden tardar; la exportación espera el fotograma correcto.

## Contrato declarable

Usa version:4, parameters con {id:"gifFile",label:"GIF",type:"gif",default:"recurso"} y gifs:{recurso:{name:"archivo.gif",mime:"image/gif",data:"BASE64"}}. Un espacio vacío usa default:"" y gifs:{}. El motor obtiene dimensiones, duración y número de fotogramas del archivo; los metadatos escritos no los sustituyen.

Un canvas con data-mgt-gif="gifFile" recibe automáticamente el fotograma seleccionado por ese parámetro. El motor controla sus dimensiones internas; html/css/render controlan posición y apariencia. ctx.gif(ctx.params.gifFile) devuelve {width,height,duration,element} o null; element es el canvas actual y se puede usar en drawImage. Declara los espacios de recurso en parameters.

render(ctx) sigue siendo síncrono. window.setFrame devuelve una promesa para composiciones con MP4 o GIF; vista previa y exportación esperan esa promesa. Las composiciones anteriores sin esos recursos conservan su contrato síncrono.

Decodificador original incluido bajo GPL-3.0-or-later. No añade dependencias externas. La especificación GIF89a reconoce GIF como marca de servicio de CompuServe Incorporated.
