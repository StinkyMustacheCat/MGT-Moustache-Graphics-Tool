# MGT 1.6.4 - guía de pruebas

La verificación de MGT 1.6.4 ejecutó `node --test tests/*.test.cjs`: 143 pruebas pasaron, sin fallos ni omisiones. También se inició el Editor portable y se comprobó el servidor, la interfaz, la ayuda y la biblioteca; el smoke test del Engine comprobó importación y render de JSON/proyecto, alfa, audio y cierre. No se probó compatibilidad con NLE ni con un segundo equipo, y no se incluyen adaptadores para NLE.

El paquete incluye pruebas para el archivo y reapertura de proyectos (project-archive.test.cjs, project-roundtrip.integration.cjs), los assets MGT v1/v2, pistas de línea de tiempo y edición. Ejecuta las unitarias desde la raíz con `node --test tests/*.test.cjs`; las integraciones requieren el runtime configurado y se ejecutan individualmente desde `tests/`. Los resultados de pruebas consignados bajo encabezados de versiones anteriores describen esas versiones, no esta entrega.

Los resultados y conteos bajo encabezados de versiones anteriores describen esas versiones; no son una declaracion de ejecucion de pruebas para este ZIP.

## MGT 1.4.0 - pruebas (historico)

`node --test tests/*.test.cjs` cubre 131 contratos internos. Las 11 integraciones vigentes en `tests/*.integration.cjs` pasaron con el runtime incluido. `overlay-lanes.integration.cjs` verifica pistas Overlay, superposición, traslado, recorte y ajuste al proyecto; `tracks-edit.integration.cjs` cubre duración recomendada/manual, historial, reemplazo de recursos, guardado contextual en Galería, pegado y Ctrl+Z. `project-roundtrip.integration.cjs` guarda un proyecto, reinicia el servidor y comprueba la reapertura de pistas y WAV, además del reenlace de un WAV omitido; `project-effects.integration.cjs` verifica efectos, recortes, ganancia y ajustes de exportación. `resources.integration.cjs` abre ejemplos 3D, GLB, vídeo, GIF y SVG animado en Overlay y salta entre fotogramas; `media-input.integration.cjs` cubre formatos de entrada. `export-tracks.integration.cjs` produce MP4 y comprueba fotogramas, capas, transparencia y mezcla de audio. Las suites de la interfaz antigua de seis pistas se conservan en `tests/legacy/` como referencia histórica y no se ejecutan contra 1.4.0.


# MGT 1.0.0 · pruebas de la primera versión estable

## Medios y lienzo para 1.0.3 (rama de desarrollo)

`tests/tracks-edit.integration.cjs` comprueba que el menú contextual ofrece reemplazo cuando el clip tiene un recurso cargado en un parámetro declarado; usa el selector de archivos existente y conserva las validaciones de cada tipo. Comprueba también que una imagen agregada como clip se mueve desde el lienzo con ratón o teclado, actualiza sus parámetros de posición, admite deshacer y expone «Encuadrar medio». `tests/base-video.integration.cjs` verifica la misma posición directa y el menú de reemplazo para vídeo base, además de su exportación real. El control de arrastre se muestra para los clips de imagen/vídeo que usan los parámetros de posición y tamaño de las plantillas integradas; un MGT arbitrario sin esos parámetros sigue editándose por su inspector, no se mueve a ciegas.

## Medición de exportación para 1.0.2 (rama de desarrollo)

Con `MGT_PROFILE_EXPORT=1`, la respuesta de `/api/jobs/:id` añade `metrics` (milisegundos de preparación, dibujo, captura, espera del codificador, cierre y total). La medición se desactiva por defecto. Ejecutar `node tests/export-tracks.integration.cjs` verifica los MP4 normales y rápidos; el modo rápido usa capturas JPEG de calidad 95 y el modo normal conserva PNG. El FFmpeg incluido solo ofrece `libx264`, sin H.264 por hardware. En este equipo (Ryzen 9 3900, 24 hilos), dos exportaciones de 72 fotogramas a 480p dieron 4,56–4,68 s con PNG y 4,29 s con JPEG experimental; la captura consumió 3,59–3,67 s y la espera del codificador fue 0 ms. La comparación entre los MP4 arrojó PSNR promedio de 51,13 dB. Es una muestra acotada, no una garantía de rendimiento en otros equipos ni en 4K.

Las 114 pruebas unitarias y las 15 integraciones de navegador están en el alcance de esta versión. Las nueve integraciones históricas se adaptaron a clips MGT independientes, duración general y pistas compactas; también resuelven las rutas del runtime desde la configuración de la aplicación, no desde el directorio actual de la terminal. La prueba de medios usa fixtures sintéticos incluidos en `tests/fixtures/media-input/`, por lo que no necesita codificadores opcionales en el FFmpeg del producto. La regresión de edición comprueba que Ctrl+V pega subtítulos tras cortar esa pista aunque antes se haya copiado un MGT. Las pruebas verifican el funcionamiento por sesión; no implican guardado y restauración de proyectos completos ni sustituyen una prueba en otro equipo.

## Historial de 0.9.8.5

Ejecutar `node --test tests/*.test.cjs` para los contratos y validaciones internas. Las integraciones actuales verificadas individualmente son `base-clean.integration.cjs`, `prompts.integration.cjs`, `stability-0985.integration.cjs`, `media-input.integration.cjs`, `overlay-window.integration.cjs` y `export-tracks.integration.cjs`. Las pruebas de navegador usan `process.execPath` para iniciar el servidor local y requieren permiso de conexión a 127.0.0.1.

En 1.0.0, las 15 integraciones —incluidas las que eran históricas en 0.9.8.5— se ejecutan contra el runtime empacado. `stability-0985.integration.cjs` cubre el recorrido de código a clip, duración y exportación, y que el servidor rechace una pista principal que excede el proyecto. `media-input.integration.cjs` verifica importación de MP3, FLAC, AAC/M4A, Vorbis, Opus, H.264, HEVC, ProRes, VP8, VP9 y AV1, además de límites, rechazos y exportación combinada.

# MGT 0.9.4

Entradas MP3, FLAC, M4A, OGG, MOV, WebM y MP4 ampliado. Preparación local con FFmpeg incluido, originales conservados y salida MP4 existente. Tabla de códecs y límites en FORMATOS-ENTRADA.md. Pruebas nuevas: tests/media-input.test.cjs y tests/media-input.integration.cjs.

# MGT 0.9.3

Vídeo base MP4 en pista propia debajo de MGT, duración coordinada con MGT/Subtítulos, propiedades declarables, ojo/candado, portapapeles e historial. Exportación con las seis pistas. Mantiene SVG y reglas de 0.9.2. Ver VIDEO-BASE.md. No guarda toda la estructura.

# MGT 0.9.2

SVG animado compatible y reglas declarables de conservar/repetir/ocultar para MP4, GIF y SVG. Código SVG animado y ejemplo 11. Ver RECURSOS-ANIMADOS.md. Sin guardado completo.

# MGT 0.9.1

GIF animado independiente en MGT/Overlay. Código GIF y ejemplo 10; ver GIF-RECURSOS.md. Un ciclo y último fotograma. Repetición/ocultar siguen para 0.9.2. Pruebas nuevas: tests/gifs.test.cjs y tests/gifs.integration.cjs, incluidas comparaciones exactas con FFmpeg y convivencia con MP4.

# Pruebas MGT 0.8.1

81 unitarias. Integración GLB: tests/models.integration.cjs (8 comprobaciones). Regresión de pistas/audio: 34, 3D previo: 12, exportación: 10. Usar Node del runtime y la carpeta de instalación como argumento; resultados en test-results. Ver informe para inicio/cierre y prueba sintética de 100 000 triángulos.

Sin prueba de todas las cargas máximas simultáneas, 4K ni una hora. No reproduce animaciones GLB ni guarda el proyecto completo.

MGT 0.8.2: animación declarable de cámara/objetos, reproducción de clips GLB, iluminación y texto extruido Helvetiker. Ver 3D-ANIMACION.md; ejemplos 07 y 08. Esta versión sustituye las limitaciones de animación/extrusión descritas para versiones anteriores.

MGT 0.9.0: MP4 H.264 como recurso visual en version:4, parámetro type:video y videos autocontenidos. Reloj local del clip, último fotograma conservado, sin audio del recurso ni ajuste de duración. ctx.video(id).element es el canvas del fotograma actual; canvas[data-mgt-video="idDelParametro"] es el enlace automático. Requiere controles declarados. Ver MP4-RECURSOS.md o /video-contract; ejemplo 09. Esta nota sustituye limitaciones anteriores sobre MP4 como recurso; no añade vídeo base ni guardado del proyecto.
