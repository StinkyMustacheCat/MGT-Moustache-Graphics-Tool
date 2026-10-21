# MGT Engine 1.6.4

El Engine es el motor autónomo de MGT para inspeccionar y renderizar archivos `.mgt.json` y `.mgtproj` mediante una API HTTP local. No requiere abrir el Editor. La descarga para Windows x64 incluye Node, Playwright Core, Chromium, FFmpeg y ffprobe; en el repositorio solo se publica su código fuente.

Consulta el [contrato v1](MGT-ASSET-CONTRACT.md) y el [contrato v2](MGT-ASSET-CONTRACT-v2.md). El motor escucha en `127.0.0.1` y requiere que la aplicación anfitriona gestione su proceso, token y carpeta `MGT_DATA_ROOT` exclusiva. No trates composiciones de origen no confiable como código seguro.

El Engine es una API, no un plugin. No se incluyen adaptadores para DaVinci Resolve, Adobe Premiere Pro, Vegas Pro ni otros NLE; cada aplicación anfitriona debe implementar y validar el suyo. Versiones y procedencia de los componentes: [COMPONENTES.json](COMPONENTES.json). Licencia y alcance de avisos: [LICENSE](LICENSE) y [LICENSING.md](LICENSING.md).
