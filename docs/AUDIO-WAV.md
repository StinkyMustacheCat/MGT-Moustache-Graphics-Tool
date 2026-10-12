# Audio WAV · MGT 0.6.1

En Escenario, pulsa **Cargar WAV**. Se admite una pista WAV RIFF PCM de 0.1 segundos a 60 minutos (hasta 1.5 GiB). No se edita ni transcribe el audio. RF64, WAV comprimido y otros formatos no están incluidos en esta versión.

Si la duración no coincide, MGT pregunta si quieres ajustar la composición. Sí usa la duración del audio, ajustada al fotograma de 60 FPS más cercano. No conserva la duración actual: el audio sobrante se corta y, si falta audio, el final queda sin sonido.

El audio se escucha con los controles de reproducción del escenario. **Quitar audio** vuelve a la exportación sin sonido. El MP4 con audio usa H.264 + AAC estéreo a 48 kHz y 192 kbps. El WAV original no se modifica.

En **Subtítulos → Carga el contenido**, un WAV editable de Wordline ofrece cargar también su audio. Si eliges No, se recuperan solo texto y tiempos, como en 0.6.0. Si eliges Sí, se valida el PCM y los metadatos una vez y se conserva una copia PCM limpia para el escenario; los mapas, análisis y anotaciones no se incorporan al audio ni al WMGT.

El WAV queda disponible durante la sesión del servidor. Los archivos WMGT no contienen ni enlazan el audio: cárgalo de nuevo al abrir otra sesión. No hay autoguardado. Una carga inválida conserva el audio y los subtítulos anteriores.

La duración del escenario siempre manda en la exportación. Compruébala después de aplicar una plantilla o composición que traiga sus propios ajustes. La biblioteca de subtítulos aparece arriba y el flujo se organiza como plantilla, contenido, revisión y aplicación/guardado.

La entrada MP4, el arranque y el cierre automático de procesos pertenecen a objetivos posteriores.
