# MGT 0.8.2 · 3D animado

Abre examples/07-3d-animacion.mgt.json para probar cámara, giro, luces y texto extruido; examples/08-glb-animado.mgt.json reproduce la animación interna del cubo. Son JSON completos e independientes que puedes importar en la biblioteca o como Overlay. El fondo es transparente. El ZIP no reemplaza la biblioteca del usuario.

Los controles siguen declarados en parameters; no hay controles ocultos, editor de curvas ni mezclador de animaciones. Código modelo GLB incluye activar, índice, velocidad, inicio y repetición. El índice empieza en 0; las propiedades muestran los nombres disponibles. Un GLB sin animaciones conserva su pose estática.

## Cámara y objetos

scene3d.animation es una lista de hasta 64 canales. Cada canal contiene target (camera o id del objeto), property, from, to, start, duration, loop, smooth, enabled. start y duration usan segundos locales del clip, sin alterar el proyecto. Los valores numéricos y booleanos admiten literales o {param:"id"}. Un solo canal por destino/propiedad.

Cámara: x, y, distance, yaw, pitch, roll, fov. Objetos: position.x/y/z, rotation.x/y/z, scale.x/y/z. Se mantiene from antes de start, se interpola hasta to y después se conserva to; loop reinicia el ciclo. smooth aplica suavizado cúbico; false usa interpolación lineal. enabled:false restaura los valores estáticos declarados. Los ángulos se interpolan en grados, sin elegir automáticamente el camino más corto. El identificador camera se reserva como destino de cámara.

## Animaciones GLB

Un objeto model admite animation:{clip:0,speed:1,start:0,loop:true,enabled:true}; todos pueden referenciar parámetros. Se reproduce una animación por objeto, sin mezcla. speed:0 congela la primera pose. Sin loop se conserva la pose final. Al desactivar se restaura la pose original. Se usa el tiempo absoluto de cada fotograma, también al retroceder y exportar. Hasta 32 animaciones, 256 canales por animación y 60 000 claves totales por recurso; tiempos entre 0 y 3600 s. Admite LINEAR, STEP y CUBICSPLINE del GLB, sujeto a los límites del importador. Se conservan las restricciones GLB de 0.8.1.

## Iluminación y texto

scene3d.lighting admite ambient (0–10), key (0–10), environment (0–5), color opaco, x/y/z (-5000–5000). Los valores admiten referencias a parámetros. Se incluye una luz principal y ambiente de estudio; no hay sombras proyectadas ni editor de luces múltiples.

Un objeto text con extrusion (1–200) genera geometría con profundidad real. Usa Helvetiker incluida, sin descarga; font puede omitirse o ser "Helvetiker". Tamaño y color permanecen declarables. Máximo 120 caracteres por objeto y 240 por composición; caracteres ajenos a la fuente producen un mensaje. No convierte todas las fuentes de Windows a geometría. El texto plano anterior conserva sus fuentes y comportamiento.

Las escenas con luces, animación o extrusión usan el mismo motor WebGL que los GLB. Las escenas estáticas anteriores sin esas opciones mantienen su representación anterior. Requiere un contexto WebGL disponible. No se guarda todavía la estructura completa del proyecto y no se añaden recursos de vídeo.
