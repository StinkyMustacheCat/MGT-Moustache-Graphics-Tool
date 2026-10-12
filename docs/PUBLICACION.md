# Preparación de publicación — MGT 1.0.0

No se ha subido código, publicado una release, registrado una marca ni modificado la galería pública desde esta tarea.

## Preparado
- Código fuente separado de los runtimes y de los datos personales.
- LICENSE GPLv3 y declaración GPL-3.0-or-later con alcance en LICENSING.md.
- Textos CC0 y CC BY-SA para los recursos propios específicamente señalados.
- Documentación de construcción, inicio, límites, contribuciones y cambios.
- Pruebas funcionales y de compatibilidad descritas en PRUEBAS.md.
- Manifiestos SHA256 para comprobar las carpetas empaquetadas.
- .gitignore excluye perfiles, galería personal, exports, logs y runtimes.

## Pendiente ANTES de una release pública del portable
1. FFmpeg: proporcionar una vía conforme a GPL para el código fuente correspondiente EXACTO de la compilación distribuida, incluyendo las bibliotecas enlazadas y los elementos de construcción necesarios. El enlace al commit FFmpeg y los créditos actuales no cierran por sí solos esta obligación. No se incluyó aquí un archivo completo de ese código correspondiente ni se formula una oferta escrita de fuentes que el proyecto no pueda cumplir.
2. Chrome for Testing: confirmar las condiciones aplicables a la redistribución del binario concreto. Conservar créditos es necesario, pero no demuestra por sí solo todos los permisos. Si no resulta adecuado, evaluar otro navegador redistribuible y probarlo; no cambiar de motor silenciosamente.
3. Confirmar titularidad y política de uso del icono/nombre, sin afirmar registro de marca.
4. Probar el ZIP final en otro PC o cuenta limpia. La extracción en otra carpeta del equipo de desarrollo está probada, pero no sustituye esa prueba.
5. Decidir el repositorio público definitivo y su enlace de incidencias. No se inventó una URL de soporte. El diagnóstico se copia desde Ajustes y puede adjuntarse al canal que se elija.
6. Presets: la galería pública y sus archivos deben expresar licencias coherentes. En la descarga revisada hay 15 JSON sin metadata.license y 3 con MIT. Revisar las declaraciones del índice web y completar los archivos solo con autorización del titular. No se relicenció ningún preset externo.

## Repositorio fuente
El titular del proyecto ha declarado CC0-1.0 para los ejemplos originales incluidos en `examples/`; ver `../LICENSING.md`. Antes de hacerlo público, debe confirmar que tiene derechos suficientes sobre los recursos multimedia `.glb`, `.gif`, `.svg` y `.mp4` y que ninguno incorpora material de terceros sin permiso. Esta declaración no sustituye esa comprobación.

## Estructura sugerida en GitHub
Repositorio: código fuente y documentación. Releases: ZIP portable, ZIP fuente y SHA256, únicamente después de completar las obligaciones anteriores. No subir perfiles, videos generados ni galería personal. La galería pública mantiene su repositorio separado.

La publicación del código propio y la redistribución de los binarios de terceros son decisiones distintas: el paquete fuente no contiene esos binarios, pero el portable sí. No presentar el portable como auditado legalmente o certificado por estos documentos.
