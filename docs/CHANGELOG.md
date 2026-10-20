# MGT 1.5.2 - proyectos completos y assets MGT

La linea de tiempo se organiza en pistas visuales y de audio, se pueden guardar y reabrir proyectos completos y se incorpora un contrato local para renderizar composiciones MGT como assets con transparencia. La especificacion del contrato esta en MGT-ASSET-CONTRACT.md.

# MGT 1.0.0 · primera versión estable por sesión

Entrega completa para Windows x64. El portapapeles de MGT ya no intercepta Ctrl+V cuando otra pista está activa; cortar y pegar subtítulos tras copiar MGT vuelve a funcionar. Las nueve integraciones históricas se adaptaron al flujo de clips y pistas compactas y pasan junto con las pruebas vigentes y unitarias. Esta versión trabaja por sesión; guardar y volver a abrir proyectos completos queda para una etapa posterior.

# MGT 0.9.8.5

Actualización incremental de estabilidad sobre 0.9.8.4. La versión del servidor, la interfaz y los cinco prompts especializados muestran 0.9.8.5. El servidor toma la versión directamente de package.json para evitar discrepancias futuras. El flujo de clips MGT independientes y la exportación se verificaron con pruebas actuales; las integraciones heredadas que dependen de la composición principal anterior siguen requiriendo migración.

# MGT 0.9.4

Entradas MP3, FLAC, M4A, OGG, MOV, WebM y MP4 ampliado. Preparación local con FFmpeg incluido, originales conservados y salida MP4 existente. Tabla de códecs y límites en FORMATOS-ENTRADA.md. Pruebas nuevas: tests/media-input.test.cjs y tests/media-input.integration.cjs.

# MGT 0.9.3

Vídeo base MP4 en pista propia debajo de MGT, duración coordinada con MGT/Subtítulos, propiedades declarables, ojo/candado, portapapeles e historial. Exportación con las seis pistas. Mantiene SVG y reglas de 0.9.2. Ver VIDEO-BASE.md. No guarda toda la estructura.

# MGT 0.9.2

SVG animado compatible y reglas declarables de conservar/repetir/ocultar para MP4, GIF y SVG. Código SVG animado y ejemplo 11. Ver RECURSOS-ANIMADOS.md. Sin guardado completo.

# 0.9.1

GIF animado declarable en MGT y Overlay, transparencia y reloj local determinista; importación independiente, búsqueda hacia atrás y exportación esperada. Un ciclo seguido del último fotograma; reglas de repetición siguen para 0.9.2. Ejemplo 10 y Código GIF. Sin dependencias nuevas.

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

# 0.6.3 · Cota 3

- Entrada MP4 en Subtítulos; lectura por bloques de metadatos compatibles.
- Extracción opcional de la primera pista como WAV PCM independiente.
- MP4 común sin subtítulos: extracción de audio conserva el borrador.
- Asociación SHA-256 del contenedor, límites y comprobación de duración normalizada.
- No se importa ni exporta el vídeo de origen. Parche incremental sobre 0.6.2.

# 0.6.2 · Cota 2

- Sesión gestionada: apertura directa, comprobación de la vista y cierre de procesos propios.
- Confirmación nativa de cierre durante exportación o con cambios sin guardar.
- Segunda apertura solicita enfocar la ventana existente.
- MGT.exe sin consola e icono proporcionado en ejecutable, interfaz y ventana.
- Perfil existente conservado; entrega incremental sobre 0.6.1.

# 0.6.1 · Cota 1

- Una pista WAV PCM en Escenario, reproducción sincronizada y botón Quitar audio.
- Confirmación de duración; recorte o silencio al conservar la duración elegida.
- MP4 H.264 con AAC estéreo opcional, 60 FPS.
- WAV de Wordline: recuperación solo de subtítulos o también de audio, en una sola lectura/verificación de PCM y metadatos.
- Biblioteca arriba y flujo de subtítulos por pasos.
- WMGT y plantillas mantienen su contrato; no se incluye audio ni autoguardado.
- ZIP completo por esta entrega; próximas cotas mediante reemplazo incremental.

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


# 0.5.0 — Subtítulos

Pestaña y biblioteca de plantillas de subtítulos, importación independiente SRT/VTT/WMGT, datos separados, controles declarativos, correcciones básicas y guardado manual. Contrato WMGT 1 documentado en SUBTITULOS.md. Compatibilidad con los ejemplos Wordline recibidos.

Integra el parche Wordline/60 minutos y el ajuste de zoom 10–200 % en barra / 10–400 % en número. Mantiene exportación MP4 opaca a 60 FPS. No incorpora las demás propuestas pendientes.

# MGT 0.4

- Parámetro image y recursos incrustados en formato v3; compatibilidad con v1/v2.
- Importar, reemplazar, quitar, vista previa y deshacer; detección del formato y límites.
- PNG, JPEG, WebP y SVG estáticos; reducción raster opcional.
- Precarga antes de render, reutilización y liberación al cambiar de escena.
- Guardar composición completa o plantilla vacía; descargar JSON desde galería.
- Tres plantillas: fondo, corazón y perspectiva. Prompt y contrato actualizados.
- Se conservan 60 FPS, MP4 con fondo sólido y guardado manual.

# Cambios

## 0.32
- Importar .json/.mgt.json con Agregar o Agregar y aplicar.
- Eliminación confirmada, buscador, autor/licencia y enlace a galería pública.
- Preservar campos y avisos originales al importar y volver a guardar.
- Hasta48 parámetros; prompt recomienda24 o menos. No se añadieron curvas Bézier ni imágenes.
- Bienvenida con prompt, tres pasos y preferencia para no mostrar.
- Espacio ocupado por exportaciones de esta instancia, limpieza manual confirmada y aviso a partir de1GB.
- Bloquear limpieza durante exportaciones/descargas; no borrar galería ni archivos externos.
- Diagnóstico básico, documentación, licencias y paquete fuente separado.

## 0.31
Galería manual, zoom10–400%, configuración de apariencia, errores y recuperación de composición, acciones arriba y aviso de cierre. Sin autoguardado.



MGT 0.8.2: animación declarable de cámara/objetos, reproducción de clips GLB, iluminación y texto extruido Helvetiker. Ver 3D-ANIMACION.md; ejemplos 07 y 08. Esta versión sustituye las limitaciones de animación/extrusión descritas para versiones anteriores.

MGT 0.9.0: MP4 H.264 como recurso visual en version:4, parámetro type:video y videos autocontenidos. Reloj local del clip, último fotograma conservado, sin audio del recurso ni ajuste de duración. ctx.video(id).element es el canvas del fotograma actual; canvas[data-mgt-video="idDelParametro"] es el enlace automático. Requiere controles declarados. Ver MP4-RECURSOS.md o /video-contract; ejemplo 09. Esta nota sustituye limitaciones anteriores sobre MP4 como recurso; no añade vídeo base ni guardado del proyecto.
