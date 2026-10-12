# MGT 0.7.2 · propiedades de audio e historial

Seleccionar un efecto abre sus propiedades en el panel izquierdo: onda del archivo completo, tiradores de entrada/salida, campos numéricos, duración utilizada, inicio en el proyecto, volumen, silencio y escuchar/detener fragmento. La pista principal muestra solo el fragmento seleccionado. Mover entrada/salida no cambia su inicio ni amplía el proyecto; lo que sobrepase el final se corta. Se puede mover el clip arrastrándolo en Efectos. Los efectos pueden solaparse.

El audio principal conserva el archivo completo: onda, volumen y silencio, sin tiradores de recorte. Se admite WAV PCM; efectos de 0.1 a 120 segundos, hasta 128 MiB por archivo, hasta 64 clips. El fragmento mínimo es un fotograma. Volumen de 0 a 100 %. Las ondas son una representación resumida y se calculan una vez por archivo. La sesión conserva los originales cargados para permitir deshacer, hasta 2 GiB de audio temporal; se limpia al cerrar.

Subtítulos, Overlay y MGT tienen Ocultar/Mostrar; Audio y Efectos tienen Silenciar/Activar. Todas las pistas tienen Bloquear/Desbloquear. El bloqueo protege carga, eliminación, ubicación y propiedades, pero permite seleccionar y escuchar. No significa ocultar ni silenciar.

Deshacer/Rehacer está en el encabezado de pistas; Ctrl+Z y Ctrl+Y fuera de campos de texto. En campos de texto se conserva su edición nativa. El historial incluye las operaciones aplicadas: composición, parámetros, imágenes, duración, capas de subtítulos/overlays, efectos, fragmentos, audio y estados de pista. Conserva hasta 40 cambios y un presupuesto de 96 MiB; los más antiguos se descartan si supera esos límites. El historial es de sesión y no es guardado del proyecto. No modifica los archivos originales.

0.7.2 es la cota de edición/vista previa de estas funciones. La exportación antigua sigue disponible con composición principal simple y ajustes de audio por defecto. Con nuevas capas, recortes, volúmenes, silencios o visibilidad se desactiva para no producir un resultado incompleto; la exportación del conjunto está en 0.7.3.

El guardado/reapertura de toda la estructura permanece para una cota posterior. Guardar en Galería conserva MGT principal, y un WMGT de Subtítulos conserva solo esa composición. No cierres esperando recuperar automáticamente el conjunto.

Instalación: cierra MGT y reemplaza los archivos del ZIP sobre 0.7.1. No contiene runtime, galeria ni subtitulos. Para continuar a 0.7.3 aplica después su parche sobre 0.7.2.
