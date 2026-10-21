> Archivo hist?rico: este documento describe versiones anteriores de MGT y no sustituye la documentaci?n de la versi?n 1.6.4. Consulta [Documentaci?n actual](README.md).

# Gu?a hist?rica de MGT 0.9.4

# MGT 0.9.4

Entradas MP3, FLAC, M4A, OGG, MOV, WebM y MP4 ampliado. Preparación local con FFmpeg incluido, originales conservados y salida MP4 existente. Tabla de códecs y límites en FORMATOS-ENTRADA.md. Pruebas nuevas: tests/media-input.test.cjs y tests/media-input.integration.cjs.

# MGT 0.9.3

Vídeo base MP4 en pista propia debajo de MGT, duración coordinada con MGT/Subtítulos, propiedades declarables, ojo/candado, portapapeles e historial. Exportación con las seis pistas. Mantiene SVG y reglas de 0.9.2. Ver VIDEO-BASE.md. No guarda toda la estructura.

# MGT 0.9.2

SVG animado compatible y reglas declarables de conservar/repetir/ocultar para MP4, GIF y SVG. Código SVG animado y ejemplo 11. Ver RECURSOS-ANIMADOS.md. Sin guardado completo.

# MGT 0.9.1

GIF animado independiente en MGT/Overlay. Código GIF y ejemplo 10; ver GIF-RECURSOS.md. Un ciclo y último fotograma. Repetición/ocultar siguen para 0.9.2. Pruebas nuevas: tests/gifs.test.cjs y tests/gifs.integration.cjs, incluidas comparaciones exactas con FFmpeg y convivencia con MP4.

# MGT 0.8.1

Importar GLB estático como recurso con materiales/texturas, controles declarables y exportación. Código modelo GLB abre una plantilla; examples/06-modelo-glb.mgt.json incluye un modelo de prueba. Leer MODELOS-GLB.md. Sin animaciones ni guardado del proyecto completo.

# MGT 0.8.0

Pulido 3D: grupos de cámara/objetos, restablecer valores declarados, suelo y visibilidad editables; compatible con las pistas actuales. Lee 3D-DECLARABLE.md. Sin importación de modelos ni guardado de proyectos.

# MGT 0.7.4

Selección y menú contextual de pistas, copiar/cortar/pegar, iconos de ojo/candado y lector en todas las pistas. Ver PISTAS-0.7.4.md. Sin guardado completo de proyectos.

# MGT 0.7.3

Exportación de todas las pistas y mezcla AAC del audio principal con efectos recortados; respeta tiempos, visibilidad, volúmenes y silencios. Incluye los controles de 0.7.2. El guardado de proyectos queda para una cota posterior. Lee PISTAS-0.7.3.md.

## Historial anterior

# MGT 0.7.1

Subtítulos independientes, cinco pistas ordenadas, duración coordinada con MGT e importación de imágenes por overlay. Exportación y guardado del conjunto pendientes de 0.7.2; efectos de sonido en 0.7.3. Ver PISTAS-0.7.1.md para uso, instalación y limitaciones de las pruebas.

## Historial anterior

# MGT 0.7.0 · Cota 1: pistas y overlays en vista previa

Cuatro pistas visibles: Audio, Efectos (pendiente), MG y Overlay. Agrega JSON completos mediante archivo o arrastre, acepta o indica su duración propia y colócalos sin solapamientos. Seleccionar un overlay muestra sus parámetros; MG devuelve los principales. Cada código se dibuja por separado. La transparencia la prepara el usuario en su JSON.

Esta cota es de vista previa: no guarda ni exporta el conjunto. 0.7.1 incorpora exportación y guardado; 0.7.2 activa los efectos de sonido. Con overlays, la exportación se desactiva para evitar resultados incompletos. Consulta PISTAS-0.7.0.md.

Parche incremental de reemplazo sobre 0.6.4. Cierra MGT, copia el contenido en su carpeta y reemplaza archivos. Conserva runtime, galeria y subtitulos.

## Historial anterior

# MGT 0.6.4 · Primera cota 3D

Cámara en perspectiva, cajas, planos y texto situado en profundidad. Los controles se declaran en parameters y la escena en scene3d, con composición version:4. Abre Código → Capturar código y ayuda → Código 3D y pulsa Aplicar código. Guarda manualmente la escena con sus valores actuales. Consulta 3D-DECLARABLE.md.

Actualización incremental de reemplazo sobre 0.6.3. Cierra MGT y copia el contenido del parche sobre la misma carpeta. Conserva runtime, galeria y subtitulos. Sin modelos importados, texto extruido ni editor de animación 3D todavía.

## Historial anterior

# MGT 0.6.3 · Cota 3: entrada MP4

Subtítulos acepta MP4 para recuperar metadatos compatibles y extraer opcionalmente la primera pista de audio. El vídeo no se añade a Escenario ni se incorpora a la exportación. Un MP4 sin subtítulos compatibles puede aportar audio; conserva el borrador anterior. Escenario continúa aceptando WAV directamente. Sin edición ni transcripción de audio.

Esta entrega es un parche de reemplazo sobre **0.6.2**. Cierra MGT, copia los archivos del parche en su carpeta y acepta reemplazar. No contiene runtime, galeria ni subtitulos. Consulta MP4-METADATOS.md para uso y perfil de intercambio; el productor de un MP4 debe incorporar ese perfil para recuperar sus subtítulos. No se modifica Wordline Pro.

## Historial anterior

# MGT 0.6.2 · Cota 2: inicio, cierre e icono

Abre MGT.exe o Iniciar MGT.cmd. Al cerrar la ventana, MGT retira los procesos de su sesión y su audio temporal. La confirmación nativa permite conservar una exportación en curso o aceptar su cancelación al cerrar. La segunda apertura trae la misma ventana al frente. Se incorpora el icono suministrado a la interfaz, ejecutable y ventana.

Esta entrega es un parche de reemplazo sobre **0.6.1**. Con el programa y servidor anteriores cerrados, copia los archivos del parche en la carpeta de MGT y acepta reemplazar. No contiene runtime, galeria ni subtitulos; conserva los de la base completa. Consulta ARRANQUE.md y PRUEBAS.md. La entrada MP4 pertenece a 0.6.3.

## Historial anterior

# MGT 0.6.1 · Audio WAV y subtítulos

Carga una pista WAV desde Escenario y expórtala junto con la animación. Si la duración no coincide, puedes ajustarla al audio o conservarla: MGT corta el audio sobrante y completa con silencio cuando termina antes. Sin edición ni transcripción de audio.

Al importar un WAV editable de Wordline desde Subtítulos, elige si quieres cargar también su audio. La biblioteca ahora aparece arriba, con pasos de plantilla, contenido, revisión y aplicación/guardado. Consulta AUDIO-WAV.md.

Esta entrega es un ZIP portable completo. Extrae en una carpeta nueva para conservar 0.6.0. Con MGT detenido puedes copiar tus carpetas galeria y subtitulos; no se reemplazan automáticamente. Los WMGT siguen sin contener audio: cárgalo de nuevo en cada sesión.

La apertura y cierre automático, el icono nuevo y la entrada MP4 pertenecen a las siguientes cotas. Esta entrega conserva el arranque existente.

## Historial y documentación de versiones anteriores

# MGT 0.6.0

Importación de subtítulos desde WAV editable de Wordline Pro 0.4.5. Convierte los metadatos a una copia de trabajo WMGT independiente, cargada sin aplicar. Lectura por bloques, validación de integridad, avisos de sincronización incompleta y conservación del borrador ante errores. No incorpora reproducción de audio, transcripción ni motores de Wordline.

Consulta WAV-SUBTITULOS.md para uso, límites y mantenimiento. Extrae en una carpeta nueva para conservar tu versión anterior.

# MGT 0.5.1

- Resoluciones 480p, 540p, 720p, 1080p, 1440p y 2160p en horizontal, vertical y cuadrado, siempre a 60 FPS. 480p horizontal usa 854 × 480; vertical 480 × 854.
- Exportación rápida: 540p, H.264 CRF 23, preset superfast. Mantiene duración y encuadre. La calidad automática normal mantiene CRF 18 / veryfast.
- Se recuerdan resolución, calidad y bitrate en el perfil local del navegador. Cargar ajustes recomendados de una composición puede cambiar la selección.
- Subtítulos muestra borrador sin aplicar, aplicación en curso y composición aplicada. Importar contenido no lo ejecuta. Los errores SRT/VTT indican bloque y línea; se preserva el contenido previo cuando falla la importación.
- Arranque: espera del motor ampliada a 60 segundos y comprobación de que sirve la interfaz. Recuperación de fallos transitorios de conexión y botón Reintentar sin cerrar la ventana. Registro de etapas sin transcripciones en startup-stages.log.

El fallo original de primera apertura no se reprodujo. Estas mejoras cubren arranque lento y conexión transitoria; falta confirmar su efecto en el equipo que presentó el fallo. No se añade actualizador ni revisión de desbordamientos.

Extrae en una carpeta nueva para conservar la 0.5. Puedes copiar tu galeria y subtitulos a la nueva carpeta con MGT detenido. Las preferencias se asocian al perfil/ubicación de esa copia.


## Documentación de la base 0.5

# Moustache Graphics Tool — MGT 0.5
## Subtítulos en 0.5

- Pestaña Subtítulos con biblioteca propia de plantillas JSON, independiente de BB Wordline.
- Importación SRT, VTT y WMGT; compatibilidad con los dos patrones Wordline documentados.
- Controles declarados por cada plantilla; tres plantillas iniciales: Pop, Frases y Drop.
- Texto/tiempos separados del render; guardar composición .wmgt.json o plantilla sin transcripción.
- Revisión de bloques, desplazamiento temporal y estimación opcional de palabras (no sincronización con audio).
- Duración hasta 60 minutos a 60 FPS y zoom: barra 10–200 %, campo 10–400 %, paso 1.

Lee SUBTITULOS.md para el uso, límites y contrato de intercambio con BB Wordline. No incluye exportación rápida 540p, transcripción, audio, vídeo de referencia ni transparencia de vídeo.

## Conservar tus datos al cambiar de versión

Extrae esta versión en una carpeta nueva. No reemplaces tu copia anterior. Con MGT detenido, puedes copiar tu carpeta galeria a la nueva versión si quieres conservar tus composiciones. La biblioteca nueva vive en subtitulos. Las exportaciones internas y las preferencias pertenecen a la ubicación de cada instalación; los MP4 ya descargados permanecen donde los guardaste.


## Abrir
Extrae el ZIP completo en una carpeta local donde puedas escribir. Abre **Iniciar MGT.cmd**. Windows 10/11 x64; incluye Node.js, Chrome for Testing, Playwright Core y FFmpeg. No requiere Codex, instalaciones adicionales ni conexión para editar o exportar.

Esta versión está separada de MGT 0.31. No borres tu copia anterior hasta haber probado tus composiciones. Su icono se muestra en la cabecera y en el navegador; la ventana sigue siendo Chrome for Testing y puede mostrar sus avisos.

## Imágenes en 0.4
Carga una de las tres plantillas de la galería e importa PNG, JPEG, WebP estático o SVG desde «Tu imagen». El código define los marcos, movimiento y efectos.

Guardar composición incluye las imágenes una sola vez en resources del JSON. Guardar plantilla deja sus espacios vacíos, conservando los demás ajustes. En la misma galería, «Descargar JSON» entrega el archivo completo para compartir. No requiere los originales ni carpetas de recursos; los archivos originales no se modifican.

Hasta 8 recursos, 10 MB por raster, 4096 px por lado, 16 MP por imagen; máximo combinado 25 MB y 32 MP raster. SVG hasta 1 MB. Si un raster supera el límite, MGT ofrece una copia WebP reducida. No lee para reducción archivos mayores de 50 MB o imágenes mayores de 64 MP / 16384 px: deben reducirse externamente. Estos límites no garantizan un consumo total de RAM fijo.

SVG: subconjunto estático de formas, trazados, grupos, gradientes, máscaras y texto; sin scripts, animación, imágenes enlazadas, estilos CSS, use, entidades o recursos externos. Hasta 5000 elementos, 64 niveles y 100000 caracteres por trazado. Exporta SVG sencillo con atributos de presentación y texto convertido a trazados si necesitas compartirlo sin depender de fuentes. No todos los SVG de editores externos son compatibles; se indica qué elemento no se admite.

Los PNG y SVG con transparencia se componen sobre el fondo. El video sigue siendo MP4 opaco a 60 FPS. Las imágenes se preparan antes del primer fotograma; un archivo dañado muestra un error. No se admiten GIF, APNG, WebP animado, SVG animado ni video.

## Funciones conservadas
- Bienvenida con tres pasos, Copiar prompt para IA, Empezar y No mostrar al iniciar. Se puede reabrir desde Ajustes.
- Galería: Agregar desde archivo (.json o .mgt.json, máximo 36 MB, con límites propios para código e imágenes), Agregar sin ejecutar o Agregar y aplicar, búsqueda por nombre y eliminación con confirmación. Se conserva el JSON importado, incluidos avisos y licencias. El original no se modifica.
- Autor y licencia visibles cuando se declaran en metadata; enlace a la galería pública. No hay sincronización ni descarga automática.
- Hasta 48 parámetros por composición. El prompt recomienda 24 o menos y usar más solo cuando aporten controles útiles. El máximo de paradas continúa siendo 24.
- Limpieza MANUAL de copias internas en Ajustes: espacio, cantidad, confirmación y bloqueo durante exportaciones o descargas. Aviso discreto desde 1 GB, como máximo una vez por sesión de la página.
- Versión, instrucciones, licencias y diagnóstico sin contenido del proyecto en Ajustes. Copiar error sigue siendo una acción distinta y puede incluir el fragmento de código mostrado.

## Funciones conservadas
- Icono proporcionado por el usuario y apariencia violeta inicial.
- Canvas visible mientras desplazas el panel de parámetros, en escritorio.
- Zoom de vista previa del 10 al 400 %, slider y campo numérico, Ajustar y 100 %. Las barras de desplazamiento permiten recorrer el área ampliada. Ajustar deja espacio alrededor para editar fuera del cuadro. El zoom no cambia el video exportado.
- Refrescar vista reconstruye el canvas con los parámetros y el fotograma actuales.
- Barra superior de Código: Pegar, Limpiar, Aplicar código, Copiar código y Guardar efecto. Limpiar pide confirmación y solo vacía el editor; Pegar no aplica automáticamente.
- Panel de errores visible en ambas pestañas, botón Copiar error, ubicación cuando Chromium la proporciona. Al fallar la aplicación de una composición se recupera la anterior. No es un depurador: la sintaxis o ciertos errores pueden no incluir línea; un bucle infinito puede bloquear la vista previa.
- Galería funcional de archivos .mgt.json, sin miniaturas.
- Botón Copiar prompt IA con instrucciones de esta versión, sin el ejemplo completo extenso.
- Ajustes de apariencia: oscuro, claro y alto contraste; acento violeta, verde, azul o ámbar; texto normal, grande o extra grande. Restablecer preferencias vuelve al aspecto inicial. Estos cambios solo afectan a la interfaz.

## Guardar y compartir efectos
**Guardar efecto** está arriba en Código. Guarda la composición APLICADA con los valores actuales del panel, las posiciones, semilla, duración, proporción, resolución y fondo del escenario. Elige un nombre: cada guardado crea una copia nueva en la carpeta **galeria** junto al programa, con sufijo único. No sobrescribe archivos existentes.

Un borrador editado sin aplicar NO forma parte de ese guardado. Si quieres conservarlo, usa Copiar código y guárdalo externamente, o aplícalo primero si es válido. Capturar valores actuales, dentro de “Capturar código y ayuda”, escribe los valores actuales en el editor para copiarlos.

Para compartir, copia el archivo .mgt.json de galeria. Para añadir uno recibido, usa Agregar desde archivo; también puedes colocarlo allí y pulsar Actualizar galería. Se leen archivos de hasta 36 MB; los inválidos se indican sin impedir cargar los demás. Cargar coloca el código y lo aplica con los ajustes guardados/recomendados. Copiar código copia el archivo guardado. No se ejecutan efectos solo por listar la galería.

El campo opcional editorSettings.background conserva el color del escenario. Las composiciones v1 y v2 anteriores siguen admitidas; v3 añade imágenes.

## Sin guardado automático
No se guardan ni recuperan automáticamente proyectos ni borradores. El navegador muestra su aviso estándar al cerrar o recargar con cambios sin guardar, si permite ese aviso y hubo interacción. No se puede personalizar con tres botones. Guarda manualmente antes de cerrar.

Solo se recuerdan las preferencias de apariencia en el perfil del navegador. Cargar un efecto guardado o guardarlo deja limpia la composición; un borrador distinto sigue siendo un cambio pendiente. No hay historial de versiones automático.

## Exportación
MP4/H.264, fondo sólido, **60 FPS fijos**. En 0.6.1 incluye audio AAC si hay un WAV cargado. Duración de 0,1 a 3600 segundos (60 minutos).

| Proporción | 1080 | 1440 | 2160 |
|---|---|---|---|
| Horizontal | 1920×1080 | 2560×1440 | 3840×2160 |
| Vertical | 1080×1920 | 1440×2560 | 2160×3840 |
| Cuadrada | 1080×1080 | 1440×1440 | 2160×2160 |

Compresión automática o bitrate objetivo de 1 a 200 Mbps. El peso mostrado es aproximado. La resolución escala toda la escena sin cambiar el encuadre. Las fuentes son las instaladas en cada PC: una fuente ausente puede alterar el resultado. Se admiten imágenes estáticas locales y tres plantillas de ejemplo. No hay transparencia de video, capas ni pestañas de proyectos.

## Cerrar y mover la herramienta
Cierra la ventana y abre **Detener MGT.cmd** para detener el motor. Termina o cancela una exportación antes de detenerlo. Mantén toda la carpeta junta al moverla; la galería viaja dentro de ella.

Perfiles del navegador, registros y archivos de exportación del motor se guardan en %LOCALAPPDATA%\MGT, separados por ubicación de la aplicación. Guardar MP4 permite elegir el destino final. Mover el programa puede crear un perfil nuevo y no borra datos de la ubicación anterior.

MGT solo escucha en el equipo local. Busca un puerto libre entre 43871 y 43891. Los componentes incluidos no se actualizan solos. Licencias y avisos de terceros: licenses. Versiones y fuentes: COMPONENTES.json.

## Liberar espacio
Ajustes > Exportaciones almacenadas > Eliminar copias muestra una confirmación. Si no guardaste un video en otra ubicación, perderás esa copia al eliminarla. La limpieza se limita al directorio de exportaciones de ESTA ubicación de MGT; no recorre datos de versiones o carpetas anteriores, no borra perfiles, galería ni videos guardados en otra ubicación. Se incluyen archivos parciales abandonados, pero no se limpia mientras exista una exportación o descarga activa. No hay borrado automático.

## Publicación
Código propio: GPL-3.0-or-later; alcance y excepciones en LICENSING.md. Antes de redistribuir el portable públicamente, revisa PUBLICACION.md: la auditoría de fuentes/licencias de todos los binarios empaquetados no está cerrada. No se ha publicado ni modificado ningún repositorio remoto.



MGT 0.8.2: animación declarable de cámara/objetos, reproducción de clips GLB, iluminación y texto extruido Helvetiker. Ver 3D-ANIMACION.md; ejemplos 07 y 08. Esta versión sustituye las limitaciones de animación/extrusión descritas para versiones anteriores.

MGT 0.9.0: MP4 H.264 como recurso visual en version:4, parámetro type:video y videos autocontenidos. Reloj local del clip, último fotograma conservado, sin audio del recurso ni ajuste de duración. ctx.video(id).element es el canvas del fotograma actual; canvas[data-mgt-video="idDelParametro"] es el enlace automático. Requiere controles declarados. Ver MP4-RECURSOS.md o /video-contract; ejemplo 09. Esta nota sustituye limitaciones anteriores sobre MP4 como recurso; no añade vídeo base ni guardado del proyecto.
# MGT 1.0.0 · portable completo

Extrae el ZIP en una carpeta nueva de Windows x64 y abre `MGT.exe` o `Iniciar MGT.cmd`. Trabaja por sesión: puedes combinar las pistas y exportar MP4, pero todavía no guardar ni reabrir un proyecto completo. No copies este paquete sobre una instalación anterior ni incluyas sus datos personales. Para conservar composiciones individuales de una versión anterior, copia manualmente tus archivos de `galeria` después de cerrar ambas copias.

## Historial
