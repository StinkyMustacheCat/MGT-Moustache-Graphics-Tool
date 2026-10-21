# Moustache Graphics Tool (MGT) 1.6.4

**Descargas para Windows x64**

- **Para usar MGT:** [Editor portable](https://github.com/StinkyMustacheCat/MGT-Moustache-Graphics-Tool/releases/download/v1.6.4/MGT-1.6.4-Editor-Windows-x64.zip) · [SHA-256](https://github.com/StinkyMustacheCat/MGT-Moustache-Graphics-Tool/releases/download/v1.6.4/MGT-1.6.4-Editor-Windows-x64.zip.sha256). Extrae el ZIP completo y abre `MGT.exe`.
- **Para integrar MGT en una aplicación:** [Motor autónomo](https://github.com/StinkyMustacheCat/MGT-Moustache-Graphics-Tool/releases/download/v1.6.4/MGT-1.6.4-Engine-Windows-x64.zip) · [SHA-256](https://github.com/StinkyMustacheCat/MGT-Moustache-Graphics-Tool/releases/download/v1.6.4/MGT-1.6.4-Engine-Windows-x64.zip.sha256). Incluye la API local de assets y sus runtimes; requiere que la aplicación anfitriona implemente su propia integración.

El editor ofrece una línea de tiempo de pistas visuales y de audio, proyectos portables y exportación. El motor expone contratos locales de assets v1/v2 para inspección, preflight y render. Consulta [la documentación del motor](engine/docs/README.md) y los [contratos de integración](engine/docs/).

**No se incluyen adaptadores para DaVinci Resolve, Adobe Premiere Pro, Vegas Pro ni otros NLE.** El motor no es un plugin instalable: cada aplicación anfitriona necesita desarrollar y validar su propio adaptador.

## Desarrollo

Requiere Node.js 24, Playwright Core 1.62.1, un navegador compatible y FFmpeg con libx264, dav1d (para AV1), zlib (para PNG) y ffprobe. Las versiones y avisos incluidos en los paquetes figuran en [COMPONENTES.json](COMPONENTES.json). Copia `config.example.json` a `config.json` y ajusta las rutas locales; `config.json` no se publica.

Ejecuta `node launcher.cjs` para abrir el editor. Las pruebas unitarias se ejecutan con `node --test tests/*.test.cjs`; las pruebas de integración requieren las dependencias anteriores y se ejecutan individualmente desde `tests/`. La guía ampliada está en [docs/BUILD.md](docs/BUILD.md). La [bitácora](docs/CHANGELOG.md) conserva notas históricas de versiones anteriores.

## Código y licencias

El código propio de MGT se publica bajo GPL-3.0-or-later; consulta [LICENSE](LICENSE) y [LICENSING.md](LICENSING.md). Las dependencias externas conservan sus propias licencias. El repositorio no incluye los binarios de Node, Chromium, Playwright Core ni FFmpeg; sí conserva las fuentes exactas de FFmpeg, x264, dav1d y zlib, sus licencias, checksums y receta de construcción. Las descargas del editor y del motor incluyen los runtimes y avisos necesarios para esos paquetes.

Los ejemplos de `examples/` están sujetos al alcance y las excepciones descritos en [LICENSING.md](LICENSING.md). No se incluyen perfiles, galerías personales ni resultados de pruebas.
