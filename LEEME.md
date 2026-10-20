# MGT 1.5.2 · Windows x64

Descomprime el ZIP completo en una carpeta y abre `MGT.exe` (o `Iniciar MGT.cmd`). No ejecutes el programa dentro del ZIP.

La línea de tiempo tiene dos tipos de pista: Visual y Audio. Puedes añadir varias de cada tipo. Las pistas visuales aceptan MGT, video, imágenes y subtítulos; permiten superposición, recorte no destructivo, orden de capas y movimiento de varios clips a la vez. Las pistas de audio admiten varios clips, silencio y traslado entre pistas. El video importado se trata como contenido visual: su audio incrustado no se incorpora automáticamente a la mezcla.

«Guardar proyecto» crea un archivo `.mgtproj` autocontenido con línea de tiempo, ajustes, composiciones, medios incrustados y WAV utilizados. «Abrir proyecto» restaura ese estado; si falta un WAV, solicita reenlazarlo. Guarda el `.mgtproj` descargado como respaldo: no hay guardado automático.

El editor conserva su exportación habitual MP4 a 60 FPS. Para integración con otros programas, el servidor local ofrece preflight y render de archivos `.mgt.json` completos a 15/24/30/60 FPS en MOV ProRes 4444 con transparencia, perfiles de vista ligera y final, y resolución independiente. Consulta `documentacion/MGT-ASSET-CONTRACT.md` para la API y sus límites. Prometheus aún debe implementar su adaptador; esta entrega no incorpora Web Bridge, transiciones MGT, controles de parámetros externos, keyframes avanzados ni chroma key. Debido a la reconstrucción de pistas, los proyectos de versiones anteriores pueden requerir ajustes manuales.

Para detener MGT, usa `Detener MGT.cmd`. La documentación completa y las licencias están en `documentacion/`.

Chromium puede mostrar un aviso por la opción `--no-sandbox`. Es una advertencia sobre el aislamiento de seguridad reducido del navegador, no necesariamente un fallo de inicio. Consulta `documentacion/ARRANQUE.md` antes de decidir si continuar.
