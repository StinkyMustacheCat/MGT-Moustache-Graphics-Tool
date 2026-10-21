# MGT 1.6.4 · Windows x64

Descomprime el ZIP completo en una carpeta y abre `MGT.exe` (o `Iniciar MGT.cmd`). No ejecutes el programa dentro del ZIP.

Esta entrega publica por separado el editor portable y el motor autónomo. El motor ofrece contratos locales de assets v1/v2; consulta `documentacion/MGT-ASSET-CONTRACT-v2.md`. No se incluyen adaptadores para DaVinci Resolve, Adobe Premiere Pro, Vegas Pro ni otros NLE: cada aplicación anfitriona debe implementar y validar el suyo.

La línea de tiempo tiene dos tipos de pista: Visual y Audio. Puedes añadir varias de cada tipo. Las pistas visuales aceptan MGT, video, imágenes y subtítulos; admiten recorte no destructivo y movimiento de varios clips a la vez. Los clips no se superponen dentro de una misma pista; sí pueden coincidir entre pistas diferentes. Las pistas de audio admiten varios clips, silencio y traslado entre pistas. El video importado se trata como contenido visual: su audio incrustado no se incorpora automáticamente a la mezcla.

«Guardar proyecto como…» permite elegir dónde crear un `.mgtproj` autocontenido con línea de tiempo, ajustes, composiciones, audio y vídeos grandes. Si el selector del sistema no está disponible, el archivo se descarga y MGT lo indica. «Abrir proyecto» restaura ese estado; si falta un recurso, solicita reenlazarlo. No hay guardado automático. Los vídeos preparados de hasta 10 MiB se pueden incrustar en MGT JSON; los mayores permanecen como clips del proyecto, con vista ligera al editar y archivo completo al exportar. El audio incluido en un vídeo se omite al importarlo como pista visual.

Los clips MGT tienen controles independientes para la duración visible en la pista y la duración propia de la animación. Esta última reescala el reloj MGT sin cambiar el tramo visible ni modificar el `.mgt.json` original; la vista previa y la exportación aplican el mismo cálculo de fotogramas.

En Ajustes generales puedes elegir 15, 24, 30 o 60 FPS y abrir Configurar lienzo junto a Exportar. La exportación de la línea de tiempo ofrece MP4/H.264 y MOV/ProRes 4444; la casilla de transparencia usa MOV. La resolución elegida se respeta también en el modo rápido. El motor de animación mantiene su reloj interno a 60 FPS y muestrea los cuadros al FPS de salida, sin acelerar los medios. El servidor local ofrece preflight y render de assets MGT en perfiles ligero y final. Web Bridge, adaptadores de NLE, transiciones MGT, parámetros externos, keyframes avanzados y chroma key no forman parte de esta entrega.

Para detener MGT, usa `Detener MGT.cmd`. La documentación completa y las licencias están en `documentacion/`.

Chromium puede mostrar un aviso por la opción `--no-sandbox`. Es una advertencia sobre el aislamiento de seguridad reducido del navegador, no necesariamente un fallo de inicio. Consulta `documentacion/ARRANQUE.md` antes de decidir si continuar.
