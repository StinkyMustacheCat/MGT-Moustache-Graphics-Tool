# MGT 0.9.3 · Vídeo base MP4

Pulsa Cargar vídeo base MP4 en la línea de tiempo, arrastra un MP4 a la pista Vídeo base o usa su menú contextual. Puedes probar examples/video-prueba.mp4 o video-con-audio.mp4. Un solo clip comienza en cero. Reemplazar pregunta si ya hay uno; un archivo inválido conserva el anterior.

Orden de las pistas: Subtítulos, Overlay, Efectos, MGT, Vídeo base y Audio. El vídeo se dibuja sobre el fondo del escenario y debajo de MGT. Texto integrado de MGT se muestra transparente encima cuando existe vídeo base. Los JSON conservan fondos opacos explícitos definidos por sus autores: prepara la transparencia si deben dejar ver el vídeo. No se elimina el fondo de imágenes, modelos ni composiciones.

Vídeo base tiene duración propia, igual prioridad que MGT/Subtítulos. Una pista más larga pregunta si ampliar el proyecto; si aceptas, se amplía sin alargar las otras pistas. Si rechazas, su tramo posterior queda fuera de la exportación. Una pista más corta no reduce la duración del proyecto. Se oculta al terminar su clip; si el archivo termina antes que ese clip, usa Al terminar: Conservar último fotograma, Repetir u Ocultar, heredado de 0.9.2. Duración y propiedades se editan al seleccionar el clip; no hay recorte de la fuente, cambio de velocidad ni desplazamiento de su comienzo.

La plantilla interna declara archivo, posición, tamaño, giro, opacidad, ajuste, visibilidad y comportamiento final. Las propiedades de MGT y de los overlays permanecen independientes. Reemplazar desde el importador de Propiedades conserva esos ajustes y adopta la duración del nuevo archivo; también pregunta si requiere ampliar el proyecto. El botón general carga una nueva plantilla de vídeo base.

Ojo y candado propios. Ocultar excluye la imagen de la vista/exportación; bloquear protege las ediciones y permite exportarla. Copiar/cortar/pegar conserva archivo y ajustes, pide reemplazar si hay contenido y lo mantiene anclado a cero. Deshacer/rehacer recupera el clip y sus recursos. El menú contextual permite importar, copiar, cortar y pegar; pulsar la pista mueve el lector.

MP4 H.264 autocontenido de hasta 10 MB, 120 s, 1920 px por lado, 1920×1080 píxeles y promedio máximo 60 FPS, igual que el recurso MP4 de 0.9.0. No convierte otros formatos. Su audio no se reproduce ni se incorpora a la mezcla: carga WAV en Audio o Efectos. Importación de subtítulos/metadatos MP4 conserva su función separada y no añade automáticamente un vídeo base.

La exportación espera el fotograma de cada recurso y respeta las seis pistas. No guarda la estructura completa. Guardar efecto sigue guardando solo MGT principal: los recursos del vídeo base se perderían al cerrar si no los conservas fuera del programa. La próxima cota 0.10.0 incorporará guardar/reabrir el proyecto. Los archivos fuente originales no se modifican.
