# Entrada MP4 en 0.6.3

Consulta MP4-METADATOS.md. El MP4 puede aportar subtítulos compatibles y audio extraído; no añade vídeo al escenario. La biblioteca y el contrato WMGT continúan iguales.

# Subtítulos en MGT 0.6.1 y contrato WMGT 1

La pestaña Subtítulos permite importar una transcripción, elegir una plantilla y exportar una animación sin depender de BB Wordline. Todo se procesa localmente. No transcribe audio ni sincroniza palabras mediante IA.

## Uso

1. Abre Subtítulos y pulsa Usar en una plantilla de su biblioteca. Se incluyen Pop, Frases y Drop. También puedes importar una plantilla JSON o pegarla en el editor de esa pestaña.
2. Carga un SRT, VTT, una composición `.wmgt.json` o un WAV editable de Wordline (con opción de cargar su audio). Al cargar una composición WMGT se recuperan su plantilla, parámetros y contenido. Al elegir después otra plantilla se conservan los subtítulos y se usan los valores declarados por la nueva plantilla.
3. Aplica subtítulos. Los controles del JSON aparecen a la izquierda. Modifica esos controles para cambiar fuente, tamaño, colores, posición o cualquier propiedad que haya declarado el autor.
4. Guarda la composición WMGT para conservar todo en un archivo. Guardar plantilla actual crea una copia en la biblioteca, sin transcripción. Descargar plantilla permite compartirla.
5. Exporta usando el botón habitual. El MP4 H.264 es opaco; no se añade transparencia ni vídeo de referencia. En 0.6.1 se incluye el WAV cargado como audio AAC; véase AUDIO-WAV.md.

Los cambios de contenido se aplican con Aplicar subtítulos. Ver en escenario permite volver a la vista existente. Revisar y corregir bloques muestra 20 bloques por página: edita texto/inicio/final y pulsa Actualizar bloque. Cambiar el texto de un bloque con tiempos por palabra requiere confirmación y quita esos tiempos de ese bloque; cambiar solo su inicio/final reescala sus tiempos internos. Desplazar modifica todos los tiempos por una cantidad de segundos; se rechaza si algún tiempo queda fuera de 0–3600 s. No hay autoguardado.

La biblioteca se guarda en `subtitulos/` junto al programa. La inicialización copia las tres plantillas incluidas una sola vez; eliminar una no la vuelve a crear al reiniciar. Renombrar copia crea una nueva entrada, preservando la anterior. Los archivos de subtítulos del usuario nunca se copian a esa biblioteca al guardar una plantilla. Las imágenes propias de una plantilla sí se conservan como recursos.

## Importación de SRT y WebVTT

- Texto UTF-8 (con o sin BOM) o UTF-16 con BOM. Máximo 8 MB después de decodificar a UTF-8.
- Tiempos por bloque y varias líneas. Se ordenan los bloques por inicio. Máximo 20 000 bloques, 4000 caracteres por bloque, 60 000 palabras con tiempos y 8 bloques simultáneos. Inicio >= 0; final > inicio; final <= 3600 segundos.
- SRT acepta separador decimal coma o punto. WebVTT admite horas opcionales, identificadores de bloque y marcas internas de tiempo que delimitan palabras individuales.
- Se omiten comentarios NOTE. Los bloques STYLE/REGION y posiciones VTT no se reproducen; se muestra un aviso. Las etiquetas se convierten en texto, nunca en HTML ejecutable. No se admite VTT segmentado HLS/X-TIMESTAMP-MAP ni todos los dialectos de subtítulos de plataformas.
- Si las marcas internas VTT abarcan varias palabras, se conservan los tiempos del bloque y se avisa. MGT no inventa tiempos precisos por palabra.
- Estimar tiempos por palabra es opcional y requiere confirmación. Distribuye el tiempo del bloque proporcionalmente a la longitud de las palabras y marca la composición como `estimated`. No analiza audio y mantiene las marcas individuales que ya existían.

## Archivo `.wmgt.json`

Es JSON UTF-8. La extensión abrevia Wordline/MGT; la estructura, no el nombre del archivo, determina su validez. Mantiene los campos de composición MGT `version: 3`, `name`, `parameters`, `html`, `css`, `render`, `seed`, `resources` y los campos opcionales existentes. Añade la sección `subtitles`, versión 1. Requiere MGT 0.5 o un consumidor que implemente este contrato; MGT 0.4 no entiende esta sección.

`parameters` sigue siendo la única declaración de controles de la animación. Se conservan los tipos text, number, color, boolean, select, font e image, con sus límites. MGT no deduce propiedades del render. Los datos de la transcripción no deben ponerse en `render`, `parameters`, `metadata` o `resources`.

Plantilla vacía:

```json
"subtitles": {
  "version": 1,
  "kind": "template",
  "timing": "cue",
  "tail": 0.25,
  "cues": []
}
```

Composición con tiempos por palabra:

```json
"subtitles": {
  "version": 1,
  "kind": "composition",
  "timing": "word",
  "tail": 0.25,
  "cues": [
    {
      "start": 0.2,
      "end": 2.0,
      "text": "Una palabra activa",
      "words": [
        {"text": "Una", "start": 0.2, "end": 0.7},
        {"text": "palabra", "start": 0.7, "end": 1.3},
        {"text": "activa", "start": 1.3, "end": 2.0}
      ]
    }
  ]
}
```

- `kind`: `template` exige `cues: []`; `composition` almacena la transcripción. Para aplicar/exportar desde Subtítulos se requiere al menos un bloque.
- `timing`: `cue` para bloques (puede conservar palabras en algunos bloques); `word` exige tiempos importados en todas las palabras; `estimated` identifica una sincronización aproximada. No se verifica contra el audio.
- `tail`: salida máxima de la animación, entre 0 y 5 segundos, predeterminado 0.25. Es un dato de la plantilla: al cambiar de plantilla se utiliza su salida.
- Todos los tiempos son segundos numéricos absolutos desde el inicio de la escena. Conserva milisegundos en los datos; el render se muestrea a 60 FPS.
- `cues` debe estar ordenado por `start`. Cada `words`, si existe, es no vacío, ordenado, contenido en el intervalo del bloque y su texto unido con espacios coincide con el texto del bloque, normalizando espacios/saltos de línea. Se permiten pausas entre palabras y solapamientos; hay un máximo de 8 bloques simultáneos.
- Los subtítulos y metadatos cuentan dentro del límite de código/datos de 8 MiB. El JSON completo sigue limitado a 36 MB incluyendo imágenes; se mantienen los límites de recursos de MGT.

## Acceso desde `render`

El render recibe `ctx.subtitles` además del contexto habitual:

- `ctx.subtitles.cues`: bloques completos, preparados una vez y de solo lectura.
- `ctx.subtitles.words`: lista plana de las palabras que tienen tiempos. Los bloques sin palabras no se convierten automáticamente.
- `ctx.subtitles.timing` y `ctx.subtitles.tail`.
- `ctx.subtitles.at(ctx.time, cola)`: devuelve los bloques activos ordenados, usando inicio inclusivo y final exclusivo. El segundo argumento opcional amplía su permanencia hasta 5 segundos; usa `ctx.subtitles.tail` si tu animación necesita salida. Sin segundo argumento vale 0. Los solapamientos devuelven varios bloques.

Ejemplo de render para frases (el HTML declara `<div id="caption"></div>`):

```javascript
const blocks = ctx.subtitles.at(ctx.time);
const label = ctx.root.querySelector('#caption');
label.textContent = blocks.map(block => block.text).join('\n');
label.style.color = ctx.params.color;
```

Las plantillas deben funcionar al saltar hacia delante o atrás; no deben acumular historia. Calcula el aspecto a partir del tiempo actual y sus parámetros. La API indexa los bloques una vez; las plantillas incluidas dibujan solo los activos. Una plantilla de terceros puede tener otro coste de ejecución.

## Duración y guardado

Al ajustar al contenido, la duración es `(ceil((último final + tail) * 60) + 1) / 60`, con mínimo 0.1 s. Si supera 3600 s se pide ajustar el contenido o la salida; no se recorta silenciosamente. Si desactivas ajustar duración, se exige una duración que no corte el final y la salida.

Guardar composición incluye datos, parámetros actuales como valores predeterminados, recursos, semilla y `recommended` con duración/proporción/resolución. `editorSettings.background` conserva el fondo opaco. Guardar plantilla vacía únicamente la transcripción y la marca como `template`; mantiene la animación y sus recursos. No añade licencias a archivos de terceros; conserva sus avisos.

## Compatibilidad con Wordline anterior

Se reconocen las variantes proporcionadas: render que comienza con `var WORDS=__WORDLINE_WORDS__;` y `wordline_template_version: 1`, o `var WORDS=[...];` con un array JSON literal de `{text,start,end}`. Se extraen los datos sin ejecutar JavaScript. Se adapta el acceso a `ctx.subtitles.words` y se guarda en el nuevo formato. Las palabras se agrupan inicialmente por el `perBlock` declarado, puntuación y pausas de más de 0.6 s; sus tiempos se conservan.

Esto no es un lector de cualquier código JavaScript que construya WORDS. Otras variantes requieren adaptación explícita. Las plantillas Wordline importadas que acceden directamente a `ctx.subtitles.words` requieren tiempos por palabra: importa datos que los contengan o activa la estimación. Su código de animación original se conserva y puede ser menos eficiente que las plantillas nativas con `at`.

## Para BB Wordline

1. Mantener el contenedor MGT v3 y los parámetros declarados.
2. Escribir la transcripción en `subtitles.cues`, con palabras temporizadas cuando existan.
3. Usar `ctx.subtitles` en render; no incrustar WORDS en el código.
4. Distinguir plantilla/composición con `kind` y guardar con extensión `.wmgt.json`.
5. Respetar texto, orden, intervalos y límites de este documento.

Los archivos de `examples/subtitulos/` incluyen tres plantillas, un SRT, un VTT por palabra y `ejemplo-composicion.json`, que también puede guardarse como `.wmgt.json`.


## Importación WAV en MGT 0.6.0

El WAV editable de Wordline se convierte a este mismo contrato, sin ampliar WMGT. Se conserva texto y tiempos; no se guardan audio ni metadatos de análisis. Las advertencias se muestran únicamente al importar. Véase WAV-SUBTITULOS.md.

