# MGT 0.7.1 · pistas de subtítulos e imágenes por clip

Orden de arriba abajo: Subtítulos, Overlay, Efectos de sonido, MGT y Audio. La capa Subtítulos se dibuja por encima de Overlay.

Aplicar desde la pestaña Subtítulos crea o reemplaza solo esa pista. MGT y los overlays conservan su código, parámetros, imágenes y tiempos. Selecciona la pista para ajustar sus parámetros declarables y duración; vuelve a MGT con el botón de regreso. Quitar contenido del borrador no elimina la pista aplicada: utiliza «Quitar pista de subtítulos» en su inspector.

Subtítulos y MGT tienen duración propia. Una entrada más larga pregunta si ampliar el proyecto. Aceptar amplía; rechazar conserva el final y corta la pista sin acelerar su animación. Una entrada más corta no reduce automáticamente el proyecto. Las recomendaciones de Overlay siguen afectando únicamente al clip. El inspector MGT muestra su duración propia y el encabezado de pistas la del proyecto. Si quitas todas las capas y necesitas volver a una exportación principal simple, indica de nuevo la duración MGT: sin Subtítulos, esa duración establece el proyecto.

La opción de duración automática de Subtítulos usa el final del contenido más su salida. Desactívala para indicar una duración propia. Un WMGT con duración recomendada recupera ese valor. Los subtítulos largos se recortan al final si rechazas ampliar. Los envoltorios html/body/root de esta pista son transparentes; se conservan cajas, contornos y dibujos propios de la plantilla. Este cambio no elimina los fondos explícitos de otros JSON ni reescribe su código.

Los parámetros de imagen de un overlay permiten escoger un recurso incluido o importar/reemplazar PNG, JPEG, WebP o SVG local. Se reutilizan los límites y validación del motor. Cada clip conserva recursos propios; las copias importadas repetidas se deduplican y las reemplazadas sin uso se liberan. Un archivo inválido conserva el recurso anterior. No se modifican los originales.

## Límites de esta cota

Esta entrega es de vista previa. No guarda ni exporta el conjunto de pistas. La exportación se desactiva con subtítulos, overlays o duraciones independientes que todavía requieren el exportador del conjunto. Guardar en Galería sigue guardando solo MGT principal; descargar WMGT desde Subtítulos sigue descargando solo esa composición. No cierres esperando recuperar automáticamente todas las pistas.

0.7.2: guardar/reabrir el proyecto y exportar el conjunto con audio principal. 0.7.3: WAV breves en Efectos de sonido, sin recorte ni edición. No se implementan todavía vídeo en escena, modelos 3D importados ni las otras mejoras pendientes.

## Instalación y revisión

Parche incremental de reemplazo sobre 0.7.0. Cierra MGT, copia el contenido del ZIP en su carpeta y acepta reemplazar archivos. Conserva runtime, galeria y subtitulos. Prueba cargar una plantilla y SRT, aplicar, seleccionar cada pista, aceptar/rechazar ampliación, importar una imagen en Overlay y volver al principal.

66 pruebas automáticas de componentes y 32 comprobaciones de interfaz aprobaron. La interfaz se probó con Chromium real y respuestas de API locales simuladas, sin conexiones de red. Se comprobaron por píxeles transparencia y orden visual, aislamiento de recursos y recuperación de un render fallido. No se pudo repetir en esta sesión el arranque integrado de MGT.exe ni la exportación real anterior: las conexiones al servidor local dieron EACCES. No se presentan las simulaciones como prueba de esas funciones. Los lanzadores y el exportador permanecen funcionalmente como en 0.7.0; el ejecutable fue recompilado con la versión e icono existentes.
