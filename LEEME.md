# MGT 1.6.4 · Windows x64

Descomprime el ZIP completo en una carpeta y abre `MGT.exe` (o `Iniciar MGT.cmd`). No ejecutes el programa dentro del ZIP.

La línea de tiempo tiene dos tipos de pista: Visual y Audio. Puedes añadir varias de cada tipo. Las pistas visuales aceptan MGT, video, imágenes y subtítulos; permiten superposición, recorte no destructivo, orden de capas y movimiento de varios clips a la vez. Las pistas de audio admiten varios clips, silencio y traslado entre pistas. El video importado se trata como contenido visual: su audio incrustado no se incorpora automáticamente a la mezcla.

«Guardar proyecto» crea un archivo `.mgtproj` autocontenido con línea de tiempo, ajustes, composiciones, medios incrustados y WAV utilizados. «Abrir proyecto» restaura ese estado; si falta un WAV, solicita reenlazarlo. Guarda el `.mgtproj` descargado como respaldo: no hay guardado automático.

El editor conserva su exportación habitual MP4 a 60 FPS. Para integraciones propias, el motor local ofrece contratos de assets v1/v2 para inspección, preflight y render a MOV ProRes 4444 con transparencia. Consulta `engine/docs/` para la API y sus límites. No se incluyen adaptadores para DaVinci Resolve, Adobe Premiere Pro, Vegas Pro ni otros NLE; cada aplicación anfitriona debe implementar y validar el suyo. Esta entrega no incorpora Web Bridge, transiciones MGT, controles de parámetros externos, keyframes avanzados ni chroma key. Debido a la reconstrucción de pistas, los proyectos de versiones anteriores pueden requerir ajustes manuales.

Para detener MGT, usa `Detener MGT.cmd`. La documentación completa y las licencias están en `docs/`.

Chromium puede mostrar un aviso por la opción `--no-sandbox`. Es una advertencia sobre el aislamiento de seguridad reducido del navegador, no necesariamente un fallo de inicio. Consulta `documentacion/ARRANQUE.md` antes de decidir si continuar.
