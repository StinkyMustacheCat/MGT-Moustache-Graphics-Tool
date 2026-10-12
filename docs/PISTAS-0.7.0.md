# Cuatro pistas · MGT 0.7.0 · cota 1

Esta entrega añade la organización por pistas y overlays **en la vista previa**. No exporta ni guarda todavía el conjunto. La exportación y el documento de proyecto corresponden a 0.7.1; los sonidos de Efectos, a 0.7.2. El audio principal y las composiciones existentes conservan su funcionamiento.

## Pistas

| Pista | En 0.7.0 |
|---|---|
| Audio | Muestra el WAV completo cargado con los controles existentes de Escenario. |
| Efectos | Visible, inactiva y marcada «Disponible en 0.7.2». |
| MG | Composición principal y duración global del proyecto. Pulsar su clip vuelve a sus parámetros. |
| Overlay | JSON completos independientes, colocados en el tiempo sobre el principal, sin solapamientos. |

## Agregar y ubicar overlays

Pulsa **Agregar overlay JSON** o arrastra archivos desde el Explorador a la pista Overlay. Se admiten las composiciones MGT v1, v2, v3 y v4, incluidas imágenes y escenas 3D ya contenidas en el JSON. Una plantilla vacía de subtítulos no es un clip con contenido.

MGT propone `recommended.duration` del JSON, si existe. Si falta, propone 3 segundos o la duración del proyecto si es menor. Puedes aceptar o introducir otra duración. Cancelar la pregunta no agrega ningún archivo del lote. La duración del proyecto nunca cambia por esta operación; tampoco se aplican el aspecto o la resolución recomendados del overlay.

Al agregar con el botón, los clips se colocan en el primer espacio disponible. Al arrastrar un archivo a la pista, comienzan donde lo sueltas. Para varios archivos se conserva el orden recibido y se colocan uno después de otro. Un lote inválido o que no cabe no modifica los clips existentes.

Puedes arrastrar un clip por la pista o escribir **Comienzo** en su panel. El tiempo se ajusta a fotogramas de 60 FPS. Dos clips pueden tocarse en su límite, pero no solaparse; una ubicación o duración en conflicto se rechaza y se conserva la anterior. La primera versión no recorta el código interno ni ofrece transiciones, mezcla de capas o edición de curvas.

Cada overlay tiene duración y reloj locales propios. Si comienza en el segundo 10, ahí empieza su fotograma cero. Si su duración excede el final del proyecto, la vista previa termina con el proyecto: no acelera el overlay para encajarlo. Si es más corto, desaparece al completar su propia duración.

## Selección y parámetros

Pulsa un clip de Overlay o selecciónalo en la lista situada encima de las pistas. Aparecen sus parámetros declarados, independientes de los del principal y de otros overlays. Pulsa **MG** o **Volver al MG principal** para recuperar los controles principales. Pulsar un espacio vacío en la pista también deselecciona el overlay y desplaza el cursor temporal.

Texto, número/deslizador, color, booleano, opciones, fuente e imagen están admitidos. El selector de imagen elige recursos que el JSON ya contiene; esta cota no añade un importador de imágenes propio por clip. Las paradas del overlay se ajustan mediante sus parámetros numéricos; los tiradores de edición del principal no editan el overlay.

Puedes cambiar **Duración propia** y eliminar clips. Si acortas el proyecto dejando un clip fuera, MGT conserva su ubicación y permite seleccionarlo desde la lista. Al ampliar el proyecto vuelve a ser visible en su momento original.

## Transparencia y separación del código

**Preparar la transparencia es responsabilidad del usuario y de su JSON.** El contenedor de overlay no añade un fondo, pero no elimina colores, fondos o superficies que el código declare. Un JSON opaco puede tapar el principal; eso es su resultado declarado. No se modifica ni mezcla su HTML, CSS o render con el de MG.

Cada JSON se dibuja en una ventana interna aislada, con su propio canal, elementos, variables, parámetros, imágenes y reloj. Solamente un overlay puede estar visible en cada fotograma. Los clips se preparan al agregarlos; la reproducción espera su preparación y no recarga el código en cada fotograma.

Para evitar que el tema oscuro de la interfaz imponga un fondo blanco a una ventana transparente, el marco del overlay utiliza un esquema de color neutral. Se respeta el CSS declarado por el usuario. El comportamiento de fondos entre documentos está definido en [CSS Color Adjustment, W3C](https://www.w3.org/TR/css-color-adjust-1/).

## Límites y revisión

- Hasta **16 overlays** por sesión y **96 MiB de JSON** en total; cada archivo conserva los límites de composición existentes.
- Proyecto máximo de 60 minutos, con tiempos ajustados a 60 FPS.
- Esta cota solo usa el audio principal. Audio en código de overlays no forma parte del contrato; los sonidos breves se cargarán en Efectos en 0.7.2.
- Con overlays presentes, el botón de exportación se desactiva para evitar entregar un vídeo que omita parte de lo que ves. Al eliminarlos, la exportación normal del principal vuelve a estar disponible.
- Los overlays **no se guardan** al guardar el MG principal ni al cerrar. El cierre avisa de contenido sin guardar. No hay guardado automático. Guarda los originales y revisa esta cota sin usarla todavía para conservar un montaje.
- Las descargas de proyectos y clips se revisarán con el guardado de 0.7.1. No se ofrecen en esta cota.

La composición principal puede seguir guardándose como efecto individual. El editor Código y la Galería siguen referidos al principal. Para probar, utiliza los JSON de `examples/overlays` o tus propios archivos preparados.
