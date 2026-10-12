# MGT 0.6.1 · Subtítulos desde WAV de Wordline

En Subtítulos, selecciona una plantilla y pulsa «Cargar subtítulos o WAV», o arrastra un archivo a la sección Contenido. Compatible con el WAV editable de Wordline Pro 0.4.5, contrato experimental Moustache Media 1.0.

MGT lee el WAV una sola vez, comprueba su integridad y convierte el texto y los tiempos al modelo interno WMGT. Quedan cargados sin aplicar. Después puedes aplicar, cambiar el aspecto y guardar una composición WMGT con la plantilla elegida. La composición guardada no depende del WAV: no contiene audio, hashes, mapas de cortes, análisis ni anotaciones heredadas. No se crea automáticamente otro archivo en disco.

Si existen advertencias del origen, se muestran al importar y no se guardan en la copia limpia. Importar no verifica acústicamente los tiempos. Si faltan tiempos por palabra, son de duración cero o el texto de palabras no coincide con el segmento, se conserva el texto completo y los tiempos del segmento. Los demás segmentos conservan sus palabras válidas. La estimación sigue siendo una acción manual; las plantillas que exijan tiempos completos pueden requerir otra plantilla o esa estimación explícita.

## Alcance

- Selección y arrastre de un WAV, SRT, VTT o WMGT JSON. Se mantienen los importadores previos.
- Hasta 60 minutos de audio; no se recorta automáticamente un WAV más largo. Los límites habituales de WMGT (20 000 bloques, 60 000 palabras, 8 bloques simultáneos, 4000 caracteres por bloque) siguen vigentes.
- WAV RIFF, un bloque PCM estéreo de 48 kHz / 16 bits y un bloque MSCH. No RF64 ni otros perfiles en esta versión.
- La salida de animación de la plantilla también debe caber en los 60 minutos de composición.
- No transcribe ni instala motores de Wordline. En 0.6.1 puedes elegir cargar también el audio para reproducirlo y exportarlo; véase AUDIO-WAV.md.
- El WAV original no se modifica. El PCM se verifica por bloques una vez: si eliges solo metadatos, se descarta; si eliges cargar audio, se guarda temporalmente una copia PCM limpia sin MSCH, mapas, análisis ni anotaciones. Solo los metadatos se descomprimen en memoria.
- Progreso de lectura visible. Una importación a la vez; tiempo de espera de cinco minutos en la interfaz.
- Límite MSCH de 16 MiB, JSON de 64 MiB y contenedor de 60 minutos PCM más 17 MiB para metadatos/cabeceras. Descompresión acotada durante la operación.
- Validación completa antes de reemplazar el borrador. Ante error, se conserva el contenido previo y la composición aplicada.

## Contrato y mantenimiento

`moustache-media.cjs` lee y valida RIFF, MSCH, JSON estricto (sin campos duplicados ni números no finitos), los esquemas de Wordline/Analysis Fast, mapas, referencias y hashes. El hash canónico del audio es exclusivamente el PCM de `data`, nunca `analysis.source.sha256` ni el hash del WAV completo. Los mapas se validan pero no se aplican de nuevo.

`wav-subtitles.cjs` convierte el resultado validado a una copia limpia. `public/subtitle-controls.js` gestiona la importación y carga sin aplicar. El contrato WMGT existente no cambia.

Los archivos de `schemas/` proceden de Wordline Pro 0.4.5: `wordline/analysis-fast.schema.json` y `wordline/wordline.schema.json`. El lector JavaScript implementa las reglas de `wordline/moustache_media.py`, `fast_export.validate` y `wordline.validate`, sin dependencia de Python. El validador de esquemas local cubre únicamente los términos usados en estos dos esquemas; no es un validador JSON Schema general. Al ampliar el contrato deben revisarse juntos esquemas, lector y pruebas.

## Instalación

Extrae el portable en una carpeta nueva y ejecuta `Iniciar MGT.cmd`. Conserva la versión anterior. Puedes copiar tus carpetas `galeria` y `subtitulos` a la nueva instalación con MGT cerrado. No hay actualizador automático.
