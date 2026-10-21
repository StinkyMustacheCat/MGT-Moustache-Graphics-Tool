> Archivo hist?rico: este documento describe versiones anteriores de MGT y no sustituye la documentaci?n de la versi?n 1.6.4. Consulta [Documentaci?n actual](README.md).

# Documentaci?n hist?rica de MGT 0.9.4

# MGT 0.9.4

Entradas MP3, FLAC, M4A, OGG, MOV, WebM y MP4 ampliado. Preparación local con FFmpeg incluido, originales conservados y salida MP4 existente. Tabla de códecs y límites en FORMATOS-ENTRADA.md. Pruebas nuevas: tests/media-input.test.cjs y tests/media-input.integration.cjs.

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

# MGT 0.5 — Moustache Graphics Tool
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


Herramienta local para Windows x64: composiciones HTML/CSS/JavaScript en JSON, controles declarativos y exportación MP4/H.264 a 60 FPS.

## Empezar
Portable: extraer completo y abrir Iniciar MGT.cmd. Copiar el prompt de la bienvenida, pedir una animación a una IA, pegar el JSON en Código y pulsar Aplicar. Guardar efecto conserva manualmente la composición aplicada y sus parámetros; exportar genera el video. No hay autoguardado.

Desde código fuente: seguir BUILD.md. El paquete fuente no incluye Node, Chromium/Chrome, Playwright ni FFmpeg.

## Esta versión
- Galería: importar JSON, agregar sin ejecutar o agregar/aplicar; buscar y eliminar con confirmación.
- Autor y licencia declarados visibles; metadatos y avisos conservados.
- Hasta 48 parámetros, con recomendación de 24 o menos en el prompt. 24 paradas.
- Bienvenida sencilla y limpieza manual de copias internas de exportación.
- Aviso desde 1 GB por sesión, sin borrar automáticamente.
- Mantiene zoom 10–400%, temas, errores, semilla, slider/número, fuentes y 60 FPS.

Guía: LEEME.md. Contrato: public/contract.txt. Prompt: public/prompt.txt. Pruebas: PRUEBAS.md.

Galería pública: https://stinkymustachecat.github.io/moustache-graphics-gallery/

## Licencia y distribución
Código propio GPL-3.0-or-later. Documentación CC BY-SA 4.0; composiciones básicas expresamente señaladas CC0. Los presets de terceros conservan sus licencias. Alcance, logotipo y componentes: LICENSING.md.

Antes de publicar el portable, completar PUBLICACION.md: sigue pendiente cerrar la auditoría de fuentes y redistribución de los binarios incluidos. Esta carpeta no constituye una release pública ya autorizada.

## Imágenes
MGT 0.5 permite PNG, JPEG, WebP y SVG estáticos como parámetros image en composiciones v3, con recursos incrustados. La galería incluye tres plantillas sin imágenes personales: fondo, corazón y tarjeta con perspectiva. LEEME.md describe los límites; public/contract.txt documenta el formato.



GIF como recurso: ver GIF-RECURSOS.md y examples/10-gif-recurso.mgt.json (MGT 0.9.1).

MGT 0.9.3 añade Vídeo base MP4 en pista propia. Ver VIDEO-BASE.md. Mantiene SVG animado y reglas de 0.9.2; guardar toda la estructura sigue pendiente.
# MGT 1.0.0 · uso por sesión

Primera versión estable con los componentes actuales: composiciones MGT, vídeo base, overlays, subtítulos, audio, efectos, recursos animados, modelos 3D y exportación MP4. Los proyectos completos aún no se guardan ni se restauran; prepara y exporta el conjunto en la sesión actual. La galería conserva composiciones individuales, no el proyecto entero. Para una instalación limpia, extrae el ZIP completo en una carpeta nueva y abre `MGT.exe` o `Iniciar MGT.cmd`.

## Historial
