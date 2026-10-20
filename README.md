# Moustache Graphics Tool (MGT) 1.5.2

**Descargas:** [MGT 1.5.2 para Windows x64 (ZIP portable)](https://github.com/StinkyMustacheCat/MGT-Moustache-Graphics-Tool/releases/download/v1.5.2/MGT-1.5.2-portable.zip) | [SHA-256](https://github.com/StinkyMustacheCat/MGT-Moustache-Graphics-Tool/releases/download/v1.5.2/MGT-1.5.2-portable.zip.sha256).


Código fuente de MGT para Windows x64. Esta versión organiza la línea de tiempo en pistas visuales y de audio, permite guardar y reabrir proyectos completos y ofrece un contrato local para renderizar composiciones MGT como assets con transparencia. La especificación de integración está en [MGT-ASSET-CONTRACT.md](docs/MGT-ASSET-CONTRACT.md).

## Desarrollo local

Requiere Node.js 24, Playwright Core 1.62.1, un navegador compatible y FFmpeg con libx264, dav1d (para AV1), zlib (para PNG) y ffprobe. Las versiones probadas figuran en [COMPONENTES.json](COMPONENTES.json). Copia `config.example.json` a `config.json` y ajusta las rutas a las dependencias instaladas en tu equipo. `config.json` queda fuera de Git porque puede contener rutas locales.

Ejecuta `node launcher.cjs` para abrir la aplicación. Las pruebas unitarias se ejecutan con `node --test tests/*.test.cjs`. Las pruebas de integración requieren las dependencias anteriores y se ejecutan individualmente desde `tests/`.

La guía ampliada de construcción está en [docs/BUILD.md](docs/BUILD.md). Parte de la documentación en `docs/` conserva notas históricas de versiones anteriores; este README y `package.json` identifican la versión actual.

## Distribución y licencia

El código propio de MGT se publica bajo GPL-3.0-or-later; consulta [LICENSE](LICENSE) y [LICENSING.md](LICENSING.md). Las dependencias externas mantienen sus propias licencias. Este repositorio no incluye los binarios de Node, Chromium, Playwright Core ni FFmpeg. Sí conserva los archivos fuente exactos de FFmpeg 9.0.1, x264, dav1d y zlib, sus licencias, checksums y receta de construcción. Tampoco incluye perfiles, galerías personales ni resultados de pruebas.

El ejecutable `MGT.exe` se construye a partir de [scripts/MGT.cs](scripts/MGT.cs); el empaquetado portátil requiere un runtime preparado aparte. El titular confirma que posee los derechos sobre los ejemplos actuales en `examples/`, generados con MGT, y los ofrece bajo CC0-1.0 según [LICENSING.md](LICENSING.md). Antes de distribuir el portable, revisar los pendientes de [docs/PUBLICACION.md](docs/PUBLICACION.md), especialmente los avisos de Chromium y la prueba en un PC limpio.
