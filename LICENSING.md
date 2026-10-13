# Licencias de MGT

Este documento delimita las licencias de MGT 1.0.0. No cambia licencias de terceros ni concede derechos que sus titulares no hayan otorgado.

## Código propio: GPL-3.0-or-later
El código propio de MGT (server.cjs, audio-store.cjs, moustache-media.cjs, wav-subtitles.cjs, storage.cjs, runtime.cjs, launcher.cjs, public/*.js, index.html, style.css, lanzadores, pruebas y scripts de empaquetado) se distribuye bajo GNU General Public License versión 3 o, a elección del destinatario, cualquier versión posterior. Texto íntegro en LICENSE.

Se permite usar, estudiar, modificar, vender y redistribuir cumpliendo la GPL. No se exige publicar modificaciones que permanezcan privadas. La distribución de binarios cubiertos exige proporcionar el código fuente correspondiente conforme a la licencia, aunque no se hayan modificado. La licencia no incluye garantía.

## Composiciones
Por decisión del titular del proyecto, los ejemplos originales de `examples/` se ofrecen bajo CC0-1.0: composiciones `.mgt.json` y `.wmgt.json` (incluidos `overlays/` y `subtitulos/`), ejemplos `.json`, `.vtt` y `.srt`, y recursos de demostración `.glb`, `.gif`, `.svg` y `.mp4`. La concesión cubre los archivos de ejemplo incluidos en este repositorio, no futuras incorporaciones de terceros. También cubre los fragmentos de HTML/CSS/render de la composición básica que genera «Código del texto» y los ejemplos mínimos de JSON de public/contract.txt y public/prompt.txt. El texto explicativo de estos últimos sigue la licencia documental indicada debajo. Texto de CC0 en licenses/CC0-1.0.txt.

El titular del proyecto confirma que tiene los derechos sobre los ejemplos y recursos multimedia actualmente incluidos en `examples/`, y que son generaciones creadas con MGT. En consecuencia, los ofrece bajo CC0-1.0 en el alcance descrito arriba. Esta declaración corresponde a los archivos presentes en esta versión; futuras incorporaciones deben revisarse por separado. CC0 no puede retirar derechos de terceros que pudieran existir independientemente en un archivo.

Los archivos importados y los presets externos conservan las licencias, atribuciones y avisos de sus titulares. No se aplicará CC0 automáticamente a la carpeta galeria. Una ausencia de metadata.license no equivale a dominio público. Identificar una licencia por nombre tampoco sustituye los avisos o textos que esa licencia exija conservar.

### Cinco composiciones de galería del portable V1
El titular confirma que las cinco composiciones `.mgt.json` incluidas en `galeria/` en el portable MGT 1.0.0 V1 también son creaciones propias y las ofrece bajo CC0-1.0. Esta concesión cubre las composiciones y su código de renderizado, no imágenes, audio, video, modelos u otros medios que la persona usuaria importe, seleccione o incorpore al utilizarlas. Cada persona usuaria es responsable de contar con los derechos, permisos y licencias necesarios para esos medios y de conservar sus atribuciones y avisos. CC0 no concede derechos sobre material de terceros.

Los MP4 no quedan automáticamente bajo GPL por haberse generado con MGT. Los derechos y condiciones aplicables dependen del contenido, recursos y presets empleados.

## Documentación
El texto explicativo propio de LEEME.md, README.md, BUILD.md, CONTRIBUTING.md, PUBLICACION.md, PRUEBAS.md, CHANGELOG.md, AUDIO-WAV.md, WAV-SUBTITULOS.md, SUBTITULOS.md, public/contract.txt, public/prompt.txt y Prompt para otras IA.txt se ofrece bajo CC BY-SA 4.0. Atribución: documentación del proyecto Moustache Graphics Tool y sus colaboradores. Texto en licenses/CC-BY-SA-4.0.txt. Ejemplos de composición: excepción CC0 descrita arriba; scripts del programa: GPL-3.0-or-later.

## Nombre y logotipo
El nombre Moustache Graphics Tool/MGT y public/icon.png identifican el proyecto y se excluyen de la concesión GPL/CC0 del código y los presets. Se permite reproducir el logotipo sin modificar para identificar y redistribuir MGT. No se concede autorización para presentar una versión modificada como oficial ni para implicar patrocinio o respaldo. Esta política no afirma que exista una marca registrada y no limita usos permitidos por la ley. Debe confirmarse la titularidad y política definitiva de la marca antes del lanzamiento público.

## Componentes de terceros
- Node.js v24.21.0: licencia principal MIT y avisos de sus componentes; licenses/Node-LICENSE.txt.
- Playwright Core 1.62.1: Apache-2.0 y avisos; licenses/Playwright-*.
- FFmpeg 9.0.1: compilación estática propia para MGT, enlazada con libx264 0.165.3223, dav1d 1.5.4 (decodificación AV1) y zlib 1.3.2. Se proporcionan los archivos fuente exactos, hashes y receta de construcción en `third-party/ffmpeg/`; ver `licenses/FFmpeg-README.txt` y los avisos FFmpeg/x264/dav1d/zlib en `licenses/`. La configuración habilita GPL y versión 3; el binario resultante se distribuye bajo GPL-3.0-or-later. dav1d conserva su licencia BSD de 2 cláusulas y sus avisos de patentes incluidos.
- Chromium 151.0.7922.173, distribución comunitaria ungoogled-chromium para Windows x64: Chromium y ungoogled-chromium se distribuyen bajo BSD-3-Clause; los componentes integrados mantienen sus licencias individuales. Se incluyen las licencias principales en `licenses/Chromium-LICENSE.txt` y `licenses/Ungoogled-Chromium-LICENSE.txt`, además de los créditos y avisos de terceros expuestos por el binario en `licenses/Chromium-Credits.html`. Los tres archivos se distribuyen también en `documentacion/licenses/` dentro del portable. La versión, origen del paquete, binario y SHA-256 constan en `COMPONENTES.json`. Los binarios son una compilación comunitaria, no una compilación oficial ni una certificación o auditoría legal independiente.

COMPONENTES.json identifica versiones y orígenes. Mantener estos textos NO sustituye la auditoría de fuentes y obligaciones de distribución. Ver docs/PUBLICACION.md antes de distribuir el portable públicamente.

Three.js 0.180.0 y GLTFLoader: MIT, licenses/Three-LICENSE.txt. Incluidos localmente en public/glb-engine.js.
