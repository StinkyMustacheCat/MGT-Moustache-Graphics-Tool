# Licencias de MGT

Este documento delimita las licencias de MGT 1.0.0. No cambia licencias de terceros ni concede derechos que sus titulares no hayan otorgado.

## Código propio: GPL-3.0-or-later
El código propio de MGT (server.cjs, audio-store.cjs, moustache-media.cjs, wav-subtitles.cjs, storage.cjs, runtime.cjs, launcher.cjs, public/*.js, index.html, style.css, lanzadores, pruebas y scripts de empaquetado) se distribuye bajo GNU General Public License versión 3 o, a elección del destinatario, cualquier versión posterior. Texto íntegro en LICENSE.

Se permite usar, estudiar, modificar, vender y redistribuir cumpliendo la GPL. No se exige publicar modificaciones que permanezcan privadas. La distribución de binarios cubiertos exige proporcionar el código fuente correspondiente conforme a la licencia, aunque no se hayan modificado. La licencia no incluye garantía.

## Composiciones
Por decisión del titular del proyecto, los ejemplos originales de `examples/` se ofrecen bajo CC0-1.0: composiciones `.mgt.json` y `.wmgt.json` (incluidos `overlays/` y `subtitulos/`), ejemplos `.json`, `.vtt` y `.srt`, y recursos de demostración `.glb`, `.gif`, `.svg` y `.mp4`. La concesión cubre los archivos de ejemplo incluidos en este repositorio, no futuras incorporaciones de terceros. También cubre los fragmentos de HTML/CSS/render de la composición básica que genera «Código del texto» y los ejemplos mínimos de JSON de public/contract.txt y public/prompt.txt. El texto explicativo de estos últimos sigue la licencia documental indicada debajo. Texto de CC0 en licenses/CC0-1.0.txt.

Esta declaración presupone que el titular tiene derechos suficientes sobre cada recurso incluido. CC0 no puede quitar derechos de terceros que pudieran existir en un archivo; si alguno procede de otra fuente, habrá que retirarlo o documentar su permiso antes de publicarlo.

Los archivos importados y los presets externos conservan las licencias, atribuciones y avisos de sus titulares. No se aplicará CC0 automáticamente a la carpeta galeria. Una ausencia de metadata.license no equivale a dominio público. Identificar una licencia por nombre tampoco sustituye los avisos o textos que esa licencia exija conservar.

Los MP4 no quedan automáticamente bajo GPL por haberse generado con MGT. Los derechos y condiciones aplicables dependen del contenido, recursos y presets empleados.

## Documentación
El texto explicativo propio de LEEME.md, README.md, BUILD.md, CONTRIBUTING.md, PUBLICACION.md, PRUEBAS.md, CHANGELOG.md, AUDIO-WAV.md, WAV-SUBTITULOS.md, SUBTITULOS.md, public/contract.txt, public/prompt.txt y Prompt para otras IA.txt se ofrece bajo CC BY-SA 4.0. Atribución: documentación del proyecto Moustache Graphics Tool y sus colaboradores. Texto en licenses/CC-BY-SA-4.0.txt. Ejemplos de composición: excepción CC0 descrita arriba; scripts del programa: GPL-3.0-or-later.

## Nombre y logotipo
El nombre Moustache Graphics Tool/MGT y public/icon.png identifican el proyecto y se excluyen de la concesión GPL/CC0 del código y los presets. Se permite reproducir el logotipo sin modificar para identificar y redistribuir MGT. No se concede autorización para presentar una versión modificada como oficial ni para implicar patrocinio o respaldo. Esta política no afirma que exista una marca registrada y no limita usos permitidos por la ley. Debe confirmarse la titularidad y política definitiva de la marca antes del lanzamiento público.

## Componentes de terceros
- Node.js v24.21.0: licencia principal MIT y avisos de sus componentes; licenses/Node-LICENSE.txt.
- Playwright Core 1.62.1: Apache-2.0 y avisos; licenses/Playwright-*.
- FFmpeg 9.0.1 essentials de Gyan: la compilación incluida declara GPL v3. No significa que todas las compilaciones de FFmpeg tengan esa licencia. Ver licenses/FFmpeg-LICENSE y FFmpeg-README.txt.
- Chrome for Testing 151.0.7922.34: condiciones del navegador y avisos de componentes, incluidos los de Chromium. El LICENSE Apache del repositorio de herramientas de Chrome for Testing no acredita por sí mismo el permiso de redistribuir el binario. Ver licenses/Chromium-Credits.html y Chromium-LICENSE.txt; revisión del binario pendiente.

COMPONENTES.json identifica versiones y orígenes. Mantener estos textos NO sustituye la auditoría de fuentes y obligaciones de distribución. Ver docs/PUBLICACION.md antes de distribuir el portable públicamente.

Three.js 0.180.0 y GLTFLoader: MIT, licenses/Three-LICENSE.txt. Incluidos localmente en public/glb-engine.js.
