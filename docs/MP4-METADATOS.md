# MP4 como entrada · MGT 0.6.3

En Subtítulos puedes seleccionar un `.mp4`. MGT pregunta si quieres extraer su audio y cargarlo en Escenario. Después pregunta por el ajuste de duración cuando corresponde. El vídeo no se carga como capa, no se reproduce en la vista y no se incorpora a la exportación.

- **Sí, con metadatos compatibles:** recupera texto y tiempos y crea un WAV independiente, PCM estéreo de 48 kHz y 16 bits. No aplica los subtítulos automáticamente.
- **Sí, sin metadatos compatibles:** extrae la primera pista de audio; conserva los subtítulos anteriores y muestra un aviso.
- **No:** recupera únicamente los metadatos compatibles. No guarda una copia temporal del vídeo ni ejecuta un decodificador de audio. Si no hay metadatos compatibles, informa del problema y conserva el contenido anterior.

El archivo original permanece intacto. La pista extraída es de sesión: debe cargarse de nuevo al abrir el programa. WMGT guarda los subtítulos y sus ajustes, sin incrustar el audio, el vídeo ni los datos de análisis. Escenario continúa aceptando directamente solo WAV; la extracción de MP4 se realiza desde Subtítulos.

Límites: MP4 de hasta 8 GiB; audio de entre 0.1 s y 60 minutos. Se selecciona la primera pista de audio. No se recorta un archivo demasiado largo al importarlo. La extracción utiliza los decodificadores disponibles en el FFmpeg incluido; la extensión MP4 por sí sola no garantiza que una pista dañada o con un códec no disponible pueda leerse.

## Perfil de intercambio Moustache MP4 1.0

Este perfil prepara la integración con productores de metadatos. No añade transcripción automática y no convierte los MP4 comunes en archivos con subtítulos. Tampoco modifica Wordline Pro. Un productor debe implementar este bloque para que MGT pueda recuperar sus datos.

El contenedor debe tener `ftyp` compatible con MP4, `moov` y `mdat`. El bloque privado es **una única caja `uuid` en el nivel raíz**, con UUID `7728da55-63de-4ea8-9e84-f4ab4fd67ab6`. Los UUID ajenos se ignoran. Se admiten tamaños de caja ISO BMFF de 32 y 64 bits y un último `mdat` de tamaño cero. El bloque privado requiere tamaño explícito y hasta 16 MiB de contenido binario.

Después de los 16 bytes del UUID, el contenido emplea la envoltura binaria MM01 ya usada en WAV: cuatro bytes ASCII `MM01`, longitud del JSON UTF-8 en uint32 little-endian, SHA-256 de esos bytes JSON (32 bytes), y el JSON comprimido con gzip. El JSON descomprimido está limitado a 64 MiB. Se rechazan campos duplicados, números no finitos, anidamiento excesivo, sumas incorrectas y bloques repetidos.

El JSON raíz tiene exclusivamente estos campos:

```json
{
  "format": "moustache-mp4",
  "schema_version": "1.0",
  "association": {
    "scope": "top_level_boxes_except_moustache_uuid",
    "byte_count": 123456,
    "sha256": "64 dígitos hexadecimales del contenido asociado"
  },
  "audio": {
    "id": "audio-1",
    "kind": "audio",
    "stream_ordinal": 0,
    "sample_rate": 48000,
    "channels": 2,
    "bits_per_sample": 16,
    "frame_count": 48000,
    "time_origin": "first_decoded_audio_sample"
  },
  "timeline": {"track_id":"audio-1","unit":"sample","rate":48000,"origin":0},
  "editing": {"new_base":true,"exclusions":[]},
  "analysis": "objeto Analysis Fast y transcript Wordline definidos en schemas/"
}
```

El ejemplo describe los campos; `analysis` debe ser un objeto real conforme a `schemas/analysis-fast.schema.json` y `schemas/wordline.schema.json`, no el texto ilustrativo del ejemplo. `frame_count` cuenta muestras de audio por canal después de decodificar la primera pista y normalizarla a PCM estéreo, 48 kHz y 16 bits. No cuenta fotogramas de vídeo. La base cero es la primera muestra de ese audio normalizado, incluyendo el tratamiento de retardo, relleno y listas de edición que aplique el decodificador. El productor debe medir esa misma salida; no basta con multiplicar la duración redondeada que muestra un reproductor.

Para la asociación se concatenan, en orden, **todos los bytes del MP4 excepto la caja privada completa**, incluida su cabecera y UUID. `byte_count` y `sha256` corresponden a esa secuencia. Se incluyen las otras cajas UUID, cabeceras, medios, índices y listas de edición. El productor debe terminar primero cualquier remux o movimiento de `moov`; cambiar esos bytes posteriormente exige volver a generar la asociación. No se usa el hash del PCM anterior a la compresión AAC como si fuera el del audio decodificado.

MGT verifica la asociación del contenedor y todos los límites, mapas, referencias y tiempos del análisis antes de aceptar sus subtítulos. Con **Sí** comprueba además que el número de muestras del WAV extraído coincida exactamente con `frame_count`. Con **No** no decodifica el audio y, por tanto, no afirma haber comprobado su número de muestras real. Si otro decodificador produce una duración distinta, la extracción con metadatos falla de forma explícita.

Los tiempos de subtítulos ya pertenecen a la base final. MGT no vuelve a aplicar `time_map`, exclusiones ni uniones. Las observaciones heredadas se muestran como avisos y no se guardan en WMGT. No se verifica aquí la calidad de la transcripción.
