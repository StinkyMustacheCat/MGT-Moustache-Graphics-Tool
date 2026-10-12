# MGT 0.8.0 · pulido de controles 3D

Código 3D ahora genera 48 parámetros declarables: cámara, suelo, caja y texto plano. Los controles se agrupan por cámara/objeto y se pueden plegar. Restablecer un grupo recupera sus valores declarados sin cambiar los otros grupos y participa en deshacer/rehacer. Pistas bloqueadas protegen también el restablecimiento.

El suelo tiene posición, rotación, escala, dimensiones, color y visibilidad declarables; caja y texto también permiten activar/desactivar su visibilidad. Los colores permanecen opacos, como exige el motor actual. Texto 3D sigue siendo plano.

Los grupos se deducen de las referencias de scene3d a parameters, sin nombres de parámetros obligatorios. Un parámetro compartido entre objetos/cámara aparece una sola vez en Controles compartidos; los parámetros del resto del efecto conservan Otros controles. Funciona en MGT y en overlays, cada uno con sus valores propios.

Ejemplo nuevo: examples/05-escena-3d-controles.mgt.json. El ejemplo anterior de 33 parámetros se conserva sin cambios. Los JSON anteriores y el contrato scene3d.version:1 siguen compatibles; no se agregan dependencias al runtime.

X crece a la derecha, Y abajo y Z hacia la cámara; unidades normalizadas según la altura. La cámara se orienta desde su posición, sin órbita automática. Se conservan el sombreado fijo, las cajas, planos y texto plano. No incluye importación de modelos (0.8.1), extrusión, luces configurables ni edición de animación 3D (0.8.2).

Cerrar MGT y aplicar el ZIP incremental sobre 0.7.4 en la misma carpeta. Se conservan runtime y bibliotecas. Sin guardado de proyectos completos.

## Contrato y documentación original

# 3D declarable · primera cota · MGT 0.6.4

Abre **Código → Capturar código y ayuda → Código 3D**, y pulsa **Aplicar código**. La composición inicial declara 33 controles para cámara, caja y texto. El panel los genera a partir de `parameters`, igual que en los efectos actuales. Guardar efecto conserva la escena y los valores seleccionados. También puedes importar `examples/04-escena-3d.mgt.json`.

Esta primera cota incorpora cámara en perspectiva, profundidad compartida, cajas sólidas, planos y texto plano situado en 3D. Posición, rotación, escala, dimensiones, color y visibilidad admiten parámetros declarados. El texto conserva contenido, fuente y tamaño declarables. No incluye todavía modelos importados, texto extruido, iluminación configurable ni un editor de animación 3D.

## Contrato

Usa `version:4` en la composición. Los documentos 1, 2 y 3 siguen admitidos. `html`, `css` y `render` continúan siendo obligatorios; pueden ser cadenas vacías para una escena declarada. Las imágenes y los subtítulos mantienen sus contratos anteriores. La propiedad opcional `scene3d` se valida antes de ejecutar el render:

```json
{
  "version": 4,
  "name": "Caja declarable",
  "parameters": [
    {"id":"rotationY","label":"Rotación Y (°)","type":"number","default":30,"min":-180,"max":180,"step":1,"control":"slider"}
  ],
  "html": "",
  "css": "",
  "render": "",
  "scene3d": {
    "version": 1,
    "camera": {"distance":1600,"fov":45},
    "objects": [
      {"id":"box","type":"box","width":350,"height":350,"depth":350,"rotation":{"y":{"param":"rotationY"}},"color":"#e0a65c"}
    ]
  }
}
```

Cada campo admite un valor literal o `{ "param": "identificador" }`. La referencia debe apuntar a un parámetro declarado del tipo correcto. Los límites completos min/max del parámetro deben caber en los del campo; así un deslizador válido no lleva la escena fuera del contrato. No se admiten expresiones ni campos desconocidos dentro de `scene3d`.

## Cámara y coordenadas

Las unidades de escena se normalizan a 1000 por la altura de salida: la misma composición conserva su encuadre relativo al exportar a otra resolución. X crece hacia la derecha, Y hacia abajo y Z hacia la cámara. Los ángulos se expresan en grados. El origen está en el centro del escenario. Las rotaciones del objeto se aplican en orden X, Y, Z, antes de su posición.

La cámara admite `x`, `y` (−5000…5000), `distance` (100…10000), `yaw` y `roll` (−180…180), `pitch` (−89…89) y `fov` (15…100). Parte de X/Y cero, distancia 1600 y FOV 45. Los ángulos orientan la cámara desde su posición; no hacen órbita automática alrededor del objeto. Acercar demasiado la cámara o orientar objetos fuera del encuadre puede ocultarlos.

## Objetos

Declara entre 1 y 32 objetos con `id` único y `type` igual a `box`, `plane` o `text`.

| Campo | Valores / valor inicial |
|---|---|
| `position` | x/y/z −5000…5000; 0 |
| `rotation` | x/y/z −3600…3600; 0 |
| `scale` | x/y/z 0,05…10; 1 |
| `width`, `height` | 1…3000; 300 |
| `depth` | Solo box, 1…3000; 300 |
| `color` | Color opaco #RRGGBB; #f4f4f5 |
| `visible` | Booleano; true |
| `text` | Solo text, hasta 1000 caracteres |
| `font` | Solo text, fuente instalada; Arial |
| `fontSize` | Solo text, 12…400; 100 |

Las superficies muestran su cara frontal; al girar un plano o texto hacia atrás dejan de verse. Una caja tiene seis caras. El sombreado fijo de sus caras ayuda a distinguir el volumen; no representa luces editables. El texto ocupa un plano, sin volumen extruido. Los colores 3D se mantienen opacos; los controles de opacidad siguen disponibles para los demás efectos.

## Vista previa, exportación y composición

El motor aplica la misma escena declarada al dibujar cada fotograma de vista previa y exportación. La escena 3D se monta antes de `render(ctx)`; el HTML 2D puede superponer títulos y subtítulos. El creador debe evitar reemplazar todo `ctx.root` o modificar los elementos internos `data-mgt-*`, porque quitaría la escena montada. No uses transiciones CSS, tiempos del reloj ni solicitudes externas para animar una exportación.

Se utiliza el modelo 3D nativo de transformaciones CSS de Chromium, sin añadir dependencias al portátil. El contexto conserva profundidad mediante `preserve-3d`; se evita aplanar los grupos internos con recortes/opacidad. Referencia técnica: [CSS Transforms Level 2, W3C](https://www.w3.org/TR/css-transforms-2/). Esto resuelve las primitivas de esta cota; la futura importación de mallas necesitará su propio contrato y motor.

El audio WAV, el MP4 de entrada y la exportación de audio conservan el funcionamiento de 0.6.3. La cota actual no modifica Wordline Pro.
