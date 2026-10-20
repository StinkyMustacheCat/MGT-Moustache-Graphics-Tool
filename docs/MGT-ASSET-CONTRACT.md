# MGT 1.5.2 — contrato local de assets (v1)

Esta API prepara composiciones `.mgt.json` completas para que un editor externo las use como medios visuales. **No integra Prometheus por sí sola.** En esta primera etapa no hay parámetros editables desde el editor externo, transiciones MGT ni audio de asset. Los efectos externos se aplicarían al video resultante, no a los parámetros internos.

## Ciclo de vida

1. Iniciar `server.cjs` una vez durante la sesión del editor. El servidor escucha únicamente en `127.0.0.1`; consultar el archivo `running.json` de la instancia o `/api/info` para conocer URL y token. No abrir un proceso por clip. Conservar el mismo proceso durante la edición y detenerlo limpiamente al cerrar el editor.
2. Enviar el JSON completo en `{ "document": {…}, "profile": "preview", "fps": 30 }` a `POST /api/asset/preflight`. Puede añadirse `duration`, `aspect` y `resolution`. Los valores omitidos proceden de `recommended` del JSON; el perfil preview usa 480p por defecto, y el final usa la resolución recomendada o 1080p. El FPS por defecto es 60.
3. El preflight devuelve `frames`, `duration`, `encodedDuration`, `aspect`, `resolution`, `width`, `height`, `fingerprint`, datos de formato y advertencias. Es validación estructural y sintáctica: **no certifica** que el JavaScript funcione, que los assets se decodifiquen ni que el render final sea correcto.
4. Enviar la misma solicitud a `POST /api/asset/render`. Responde `202` con `id` y el contrato. Son admisibles **15, 24, 30 y 60 FPS**; otra frecuencia es error. Solo hay una exportación activa por servidor; un segundo render devuelve `409`.
5. Consultar `GET /api/jobs/{id}` hasta `done`, `error` o `cancelled`. Descargar en `GET /api/jobs/{id}/download`. Al terminar de copiar, llamar a `POST /api/jobs/{id}/release` para liberar el archivo temporal. Puede cancelarse un trabajo con `POST /api/jobs/{id}/cancel`. Los trabajos de asset terminados se limpian automáticamente después de una hora si no hay descargas activas.
6. Al cerrar, llamar a `POST /api/shutdown`. Si un render sigue activo, se solicita su cancelación y se espera a que cierre. Si no concluye dentro del plazo, la API devuelve `409`; el adaptador debe tratarlo como cierre pendiente.

Las llamadas POST deben incluir `Origin` igual a la URL local del servidor, `X-Motion-Token` obtenido de `/api/info` y `Content-Type: application/json`. El adaptador debe mantener ese token privado, no exponer el servidor a la red y usar una raíz de datos propia cuando conviva con el editor MGT (`MGT_DATA_ROOT`). El servidor depende de Node.js, Chromium y FFmpeg locales; no es un servicio remoto.

## Formato y tiempo

- Salida: MOV, ProRes 4444 (`prores_ks`), píxeles con alfa (`yuva444p12le` al decodificar), matriz de color `bt709` y rango `tv`. Antes de darlo por integrado, Prometheus debe comprobar que su propia ruta de decodificación y composición conserva el canal alfa y el aspecto; no basta con aceptar el archivo MOV.
- La duración visible está cuantizada: `frames = round(duration × fps)` y `encodedDuration = frames / fps`. La línea de tiempo debe usar `frames`/`encodedDuration`, no asumir que la duración decimal solicitada coincide exactamente con la codificada.
- El reloj interno de MGT sigue a 60 FPS. Cada cuadro de salida `n` evalúa el cuadro interno `round(n × 60 / fps)`. La velocidad de un clip en Prometheus se aplica **después** al asset completo; no altera el reloj de la composición MGT.
- El perfil preview reduce resolución pero conserva tiempo, cuadros y alfa. El perfil final puede tener otra resolución. `fingerprint` es SHA-256 del contrato normalizado (JSON, perfil, FPS, cuadros, aspecto, resolución, semilla y parámetros). Sirve como clave de caché, no como garantía de pureza del código JavaScript.
- El asset v1 utiliza exactamente semilla y parámetros contenidos en el JSON. Se rechazan overrides `params` o `seed`. El ajuste de encuadre es responsabilidad del clip en Prometheus. El JSON transporta el código y recursos incrustados como hoy, sin inventar otro contenedor.

## Límites y preflight del adaptador

Se rechazan llamadas obvias a reloj externo, red y aleatoriedad (`Date`, `performance`, `setTimeout`, `requestAnimationFrame`, `fetch`, `Math.random`, etc.), así como URLs externas evidentes en HTML/CSS. Esto **no prueba formalmente determinismo** de JavaScript arbitrario; la reproducibilidad se ha verificado con composiciones de prueba. El adaptador debe informar los fallos reales de render, recursos ausentes e incompatibilidades antes de exportar la secuencia final. La etapa «resolver medios» de Prometheus debe repetir el render en perfil final y no sustituir silenciosamente un asset de vista ligera si falla.

Se ensayaron 15/24/30/60 FPS, preview/final, alfa transparente/opaco/parcial, selección no secuencial de cuadros y limpieza de trabajos. Falta validar el adaptador real de Prometheus y una prueba en un equipo distinto antes de prometer interoperabilidad completa.
