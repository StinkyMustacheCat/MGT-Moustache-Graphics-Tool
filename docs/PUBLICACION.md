# Preparación de publicación — MGT 1.0.0

El código fuente está publicado en [GitHub](https://github.com/StinkyMustacheCat/MGT-Moustache-Graphics-Tool). La release portable MGT 1.0.0 V1 se distribuye por separado en [GitHub Releases](https://github.com/StinkyMustacheCat/MGT-Moustache-Graphics-Tool/releases/tag/v1.0.0). No se ha registrado una marca ni modificado la galería pública.

## Preparado
- Código fuente separado de los runtimes y de los datos personales.
- LICENSE GPLv3 y declaración GPL-3.0-or-later con alcance en LICENSING.md.
- Textos CC0 y CC BY-SA para los recursos propios específicamente señalados. El titular confirma los derechos y la declaración CC0 de los ejemplos de `examples/` y de las cinco composiciones `.mgt.json` empaquetadas en `galeria/`; los medios que cada persona usuaria aporte están fuera de esa concesión y requieren sus propios derechos y licencias.
- Avisos de Chromium incluidos y revisados: licencias BSD-3-Clause de Chromium y ungoogled-chromium, más los créditos/avisos de terceros expuestos por el binario; versión, origen y SHA-256 están registrados en COMPONENTES.json.
- Documentación de construcción, inicio, límites, contribuciones y cambios.
- Pruebas funcionales y de compatibilidad descritas en PRUEBAS.md.
- Manifiestos SHA256 para comprobar las carpetas empaquetadas.
- .gitignore excluye perfiles, galería personal, exports, logs y runtimes.

## Estado de la release portable
- FFmpeg: ya se incluyen los archivos fuente correspondientes exactos de FFmpeg 9.0.1, x264, dav1d y zlib, checksums, licencias/avisos y receta de build. Mantener estos archivos junto al código fuente publicado; no sustituir los binarios sin regenerar y validar la correspondencia.
- Chromium: la candidata usa el paquete comunitario ungoogled-chromium 151.0.7922.173. Se verificó la presencia de `licenses/Chromium-LICENSE.txt`, `licenses/Ungoogled-Chromium-LICENSE.txt` y `licenses/Chromium-Credits.html` (también en `documentacion/licenses/` dentro del portable); versión, fuente, archivo binario y hash están en COMPONENTES.json. El binario comunitario no es una compilación oficial ni una compilación reproducible garantizada.
- Prueba de usuario: el titular confirma que instaló/ejecutó el ZIP en su laptop y no observó errores evidentes. No equivale a una prueba en todos los equipos, versiones de Windows ni una cuenta limpia.
- Repositorio fuente: publicado en https://github.com/StinkyMustacheCat/MGT-Moustache-Graphics-Tool. La publicación de una release portable es un paso separado.
- Soporte: no se definió una URL de incidencias propia. El diagnóstico se copia desde Ajustes y puede adjuntarse al canal que se elija.
- Presets: la galería pública y sus archivos deben expresar licencias coherentes. No se relicenció ningún preset externo.

## Repositorio fuente
El titular del proyecto confirma que posee los derechos de los ejemplos actuales incluidos en `examples/` y de las cinco composiciones `.mgt.json` incluidas en `galeria/` en el portable V1, y las ofrece bajo CC0-1.0. Esta licencia no se extiende a medios que las personas usuarias aporten o incorporen; cada quien debe contar con los derechos y permisos de esos medios. Ver `../LICENSING.md`.

## Estructura sugerida en GitHub
Repositorio: codigo fuente y documentacion, publicado en GitHub. La Release v1.0.0 incluye el ZIP portable y su SHA-256; GitHub genera tambien los archivos fuente ZIP y TAR desde la etiqueta. No subir perfiles, videos generados ni galería personal. La galería pública mantiene su repositorio separado.

La publicación del código propio y la redistribución de los binarios de terceros son decisiones distintas. El código fuente incluye los archivos fuente exactos de FFmpeg, x264, dav1d y zlib y la receta de build; el portable incorpora los binarios construidos desde ellos. No presentar el portable como auditado legalmente o certificado por estos documentos.
