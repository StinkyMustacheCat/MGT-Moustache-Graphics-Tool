# MGT 0.5.1

- Resoluciones 480p, 540p, 720p, 1080p, 1440p y 2160p en horizontal, vertical y cuadrado, siempre a 60 FPS. 480p horizontal usa 854 × 480; vertical 480 × 854.
- Exportación rápida: 540p, H.264 CRF 23, preset superfast. Mantiene duración y encuadre. La calidad automática normal mantiene CRF 18 / veryfast.
- Se recuerdan resolución, calidad y bitrate en el perfil local del navegador. Cargar ajustes recomendados de una composición puede cambiar la selección.
- Subtítulos muestra borrador sin aplicar, aplicación en curso y composición aplicada. Importar contenido no lo ejecuta. Los errores SRT/VTT indican bloque y línea; se preserva el contenido previo cuando falla la importación.
- Arranque: espera del motor ampliada a 60 segundos y comprobación de que sirve la interfaz. Recuperación de fallos transitorios de conexión y botón Reintentar sin cerrar la ventana. Registro de etapas sin transcripciones en startup-stages.log.

El fallo original de primera apertura no se reprodujo. Estas mejoras cubren arranque lento y conexión transitoria; falta confirmar su efecto en el equipo que presentó el fallo. No se añade actualizador ni revisión de desbordamientos.

Extrae en una carpeta nueva para conservar la 0.5. Puedes copiar tu galeria y subtitulos a la nueva carpeta con MGT detenido. Las preferencias se asocian al perfil/ubicación de esa copia.
