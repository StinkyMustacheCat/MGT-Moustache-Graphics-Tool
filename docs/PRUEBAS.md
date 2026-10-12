# MGT 1.0.0 · pruebas de la primera versión estable

Las 114 pruebas unitarias y las 15 integraciones de navegador están en el alcance de esta versión. Las nueve integraciones históricas se adaptaron a clips MGT independientes, duración general y pistas compactas. La regresión de edición comprueba que Ctrl+V pega subtítulos tras cortar esa pista aunque antes se haya copiado un MGT. Las pruebas verifican el funcionamiento por sesión; no implican guardado y restauración de proyectos completos ni sustituyen una prueba en otro equipo.

## Historial de 0.9.8.5

Ejecutar `node --test tests/*.test.cjs` para los contratos y validaciones internas. Las integraciones actuales verificadas individualmente son `base-clean.integration.cjs`, `prompts.integration.cjs`, `stability-0985.integration.cjs`, `media-input.integration.cjs`, `overlay-window.integration.cjs` y `export-tracks.integration.cjs`. Las pruebas de navegador usan `process.execPath` para iniciar el servidor local y requieren permiso de conexión a 127.0.0.1.

Las integraciones restantes eran históricas en 0.9.8.5 y no formaban parte de su criterio de aprobación. La prueba `stability-0985.integration.cjs` cubría el recorrido de código a clip, duración y exportación, y el servidor rechazaba una pista principal que excedía el proyecto.

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
