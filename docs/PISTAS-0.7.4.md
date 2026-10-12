# MGT 0.7.4 · selección y acciones de pistas

El efecto muestra inmediatamente su duración recortada en la línea principal. Hacer clic en cualquier fila coloca el lector en ese tiempo; arrastrar un clip cambia su ubicación sin mover el lector. Un borde tenue indica la fila seleccionada.

El ojo cambia a ojo cerrado morado al ocultar. El candado indica abierto/cerrado; los controles incluyen descripciones y nombres accesibles. Audio y Efectos usan iconos de sonido para silenciar.

Ctrl+C, Ctrl+X y Ctrl+V copian, cortan y pegan el clip seleccionado, con deshacer/rehacer. En campos de texto/números mantienen su función nativa. El portapapeles de clips es interno a la sesión de MGT y conserva recursos, parámetros, semilla y ajustes de audio. Pegar requiere la pista compatible.

Overlay se pega en el lector o al final de la animación que ocupa ese punto. Si falta espacio hasta la siguiente animación o el final del proyecto, pregunta si recortar la copia. Aceptar reduce solo su duración; no acelera ni cambia el original. Rechazar cancela. Si no queda espacio, informa y conserva todo. Los efectos se pegan en el lector y pueden solaparse.

Las pistas principales Audio, MGT y Subtítulos siguen ancladas al comienzo: pegar reemplaza su contenido; no crea clips adicionales. Audio pide confirmación si ya hay uno cargado. MGT/Subtítulos también confirman reemplazo de contenido existente. Cortar MGT deja una composición vacía. Los bloqueos protegen las operaciones que modifican pistas.

Clic derecho en fila vacía o etiqueta: importar animación en Overlay, importar efecto de sonido en Efectos, cargar audio en Audio, y pegar si es compatible. Sobre un clip añade copiar/cortar. Importación directa de Subtítulos y MGT desde este menú queda pendiente. Escape cierra el menú; las flechas recorren sus opciones.

Cerrar MGT y aplicar este ZIP sobre 0.7.3 en la misma carpeta, reemplazando archivos. Bibliotecas y runtime se conservan. No hay guardado/reapertura del proyecto completo.
