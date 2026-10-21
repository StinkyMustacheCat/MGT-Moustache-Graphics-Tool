# MGT 1.6.3 — entrega única (histórica)

La entrega 1.6.3 incluía dos carpetas independientes:

- `MGT-1.6.3-portable/`: editor de MGT completo. Se extraía la carpeta y se abría `MGT.exe`.
- `MGT-1.6.3-engine/`: motor autónomo, sin `MGT.exe` y sin abrir la interfaz. La aplicación anfitriona debía iniciar `runtime/node/node.exe motor/server.cjs` con ventana oculta y un `MGT_DATA_ROOT` propio.

El motor ofrecía los contratos de assets v1/v2 y ejemplos de petición, respuesta, `.mgt.json` y `.mgtproj` en `ejemplos/`. La API y su documentación describen capacidades del motor; no proporcionan un adaptador de NLE. No se incluían transiciones MGT, Web Bridge ni edición de parámetros de audio desde una aplicación anfitriona.

Este archivo conserva el alcance de esa entrega anterior. Para la versión actual, consulta [MGT 1.6.4](ENTREGA-1.6.4.md).
