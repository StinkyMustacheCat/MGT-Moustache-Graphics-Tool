# Formatos de entrada — MGT 0.9.4

Las combinaciones siguientes se comprobaron con archivos reales y el FFmpeg incluido. La extensión sola no garantiza compatibilidad. Los archivos dañados, los códecs fuera de esta tabla y los límites excedidos se rechazan sin sustituir el clip anterior.

| Entrada | Códec comprobado | Destino |
| --- | --- | --- |
| WAV RIFF | PCM | Audio principal y efectos |
| MP3 | MP3 | Audio principal y efectos |
| FLAC | FLAC | Audio principal y efectos |
| M4A | AAC | Audio principal y efectos |
| OGG | Vorbis, Opus | Audio principal y efectos |
| MP4 | H.264, HEVC/H.265 | Vídeo base y recursos visuales de MGT/Overlay |
| MOV | H.264, HEVC/H.265, ProRes | Vídeo base y recursos visuales de MGT/Overlay |
| WebM | VP8, VP9, AV1 | Vídeo base y recursos visuales de MGT/Overlay |

Los audios comprimidos se convierten a una copia temporal WAV PCM estéreo de 48 kHz y 16 bits. Conservan el nombre del original. El WAV PCM existente mantiene su importación directa. La copia temporal alimenta reproducción, onda, recorte de efectos y exportación; no modifica el archivo original. Límites: audio principal 1.5 GiB y 60 minutos; efectos 128 MiB y 120 segundos. Audio principal completo; los efectos conservan sus tiradores, volumen y silencio.

MOV, WebM y MP4 que requieren preparación se convierten a una copia H.264 de 8 bits, sin audio ni metadatos incorporados. El MP4 ya compatible se carga directamente. Entrada máxima 128 MiB, una pista visual, 120 segundos, hasta 60 fps, 1920 px por lado y 1920×1080 píxeles en total. El recurso preparado conserva el límite de 10 MB y el presupuesto de composición existente. Si la conversión no cabe o no conserva la duración, se rechaza; no se recorta silenciosamente. Un tamaño impar puede recibir una fila/columna de relleno para H.264. La conversión puede perder precisión de color, transparencia o calidad; no es una copia de archivo para conservación profesional.

Vídeos visuales no añaden su audio a la pista Audio. La salida sigue siendo MP4 H.264/AAC. No se amplían los formatos de exportación en esta versión.

Subtítulos mantiene sus importadores y el contrato Wordline anterior de WAV/MP4. Cargar MP3/MOV/WebM como medios no genera transcripciones ni convierte automáticamente metadatos Wordline. Las copias visuales incorporadas en JSON son MP4 preparados; no contienen el original MOV/WebM. Guardar toda la sesión sigue pendiente de 0.10.0.

Preparación local, máximo cinco minutos por conversión, cancelada al cerrar MGT o interrumpir la carga. Los temporales de conversión se eliminan al terminar o fallar.
