# Moustache Graphics Tool (MGT) 1.0.0

Código fuente de MGT para Windows x64. La v1 permite crear composiciones y exportar MP4 durante una sesión; todavía no guarda ni reabre proyectos completos.

## Desarrollo local

Requiere Node.js 24, Playwright Core 1.62.1, un navegador compatible y FFmpeg con libx264 y ffprobe. Las versiones probadas figuran en [COMPONENTES.json](COMPONENTES.json). Copia `config.example.json` a `config.json` y ajusta las rutas a las dependencias instaladas en tu equipo. `config.json` queda fuera de Git porque puede contener rutas locales.

Ejecuta `node launcher.cjs` para abrir la aplicación. Las pruebas unitarias se ejecutan con `node --test tests/*.test.cjs`. Las pruebas de integración requieren las dependencias anteriores y se ejecutan individualmente desde `tests/`.

La guía ampliada de construcción está en [docs/BUILD.md](docs/BUILD.md). Parte de la documentación en `docs/` conserva notas históricas de versiones anteriores; este README y `package.json` identifican la versión actual.

## Distribución y licencia

El código propio de MGT se publica bajo GPL-3.0-or-later; consulta [LICENSE](LICENSE) y [LICENSING.md](LICENSING.md). Las dependencias externas mantienen sus propias licencias. Este repositorio no incluye Node, Chromium/Chrome for Testing, Playwright Core ni FFmpeg. Tampoco incluye perfiles, galerías personales ni resultados de pruebas.

El ejecutable `MGT.exe` se construye a partir de [scripts/MGT.cs](scripts/MGT.cs); el empaquetado portátil requiere un runtime preparado aparte. Los ejemplos incluidos en `examples/` se declaran CC0; antes de publicar, confirma que los recursos multimedia son propios o cuentan con autorización suficiente. Para distribuir binarios a terceros, revisar además los pendientes de [docs/PUBLICACION.md](docs/PUBLICACION.md), incluidos FFmpeg, navegador y pruebas en un PC limpio.
