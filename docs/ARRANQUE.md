# Inicio y cierre · MGT 1.6.4

Abre **MGT.exe** o **Iniciar MGT.cmd**. No se abre una consola ni una ventana de lanzamiento adicional. El programa inicia su servidor, comprueba la conexión y verifica que la vista real termine de prepararse. El aviso de inicio y Reintentar siguen disponibles dentro de la interfaz.

Al cerrar la ventana se detienen el servidor y navegador de esa sesión, se cancela su exportación si corresponde y se retira su audio temporal. Las lecturas/importaciones pendientes también se cancelan antes de retirar sus archivos. Si hay una exportación activa o cambios sin guardar, la ventana muestra la confirmación nativa del navegador: rechazarla conserva la ventana y la exportación; aceptarla permite cerrar. Guarda tus composiciones manualmente en WMGT antes de salir. No hay autoguardado.

Abrir MGT otra vez mientras está abierto solicita traer la misma ventana al frente. Una copia ubicada en otra carpeta tiene una sesión independiente. El cierre utiliza las referencias de sus procesos propios; no detiene otros servidores, navegadores ni herramientas. El modo de desarrollo node launcher.cjs --no-open mantiene deliberadamente el servidor sin ventana; se detiene con --stop.

El icono proporcionado se conserva en public/icon.ico y se usa en la interfaz, favicon, MGT.exe y los iconos grande/pequeño de su ventana. La integración registra esos iconos en Windows; 

Se reutiliza browser-profile para conservar preferencias. Estas se asocian a la ubicación y al origen local; cambiar de carpeta o puerto puede dar lugar a otro perfil/origen, como en la versión anterior.

MGT.exe es un pequeño lanzador propio compilado para Windows x64 con .NET Framework de Windows. No contiene el servidor ni sustituye el runtime portable. Su código se incluye en scripts/MGT.cs; puede reconstruirse con scripts/build-launcher.ps1 en un entorno de desarrollo que permita scripts locales. Las dependencias Node, Chromium, Playwright y FFmpeg siguen incluidas en la base portable.

## Diagnóstico y alcance de las pruebas

Se probaron seis arranques del servidor y seis reaperturas en navegador sin ventana, incluidos fallos transitorios de conexión. Después, cuatro primeras ventanas reales y cuatro reaperturas, sin recargar la navegación inicial. Todas prepararon su vista.

La sesión nueva se probó abriendo dos veces, cerrando y reabriendo cuatro veces, conservando preferencias, retirando el WAV de sesión y rechazando/aceptando el cierre durante una exportación. Se comprobó el cierre de sus PID y la eliminación del MP4 incompleto. Los iconos de la ventana coinciden con el ICO proporcionado, escalado por Windows a 64 y 32 píxeles.

La necesidad de cerrar y abrir descrita por el usuario no se reprodujo de forma idéntica. En este entorno de pruebas, una apertura directa de Chrome sin el argumento de compatibilidad usado por el runtime de captura terminó durante el inicio de sus servicios GPU; esa apertura fallida se retiró. El lanzamiento gestionado usa la configuración comprobada con el runtime incluido y verifica la vista efectiva. Esto no identifica de manera concluyente la causa de todas las aperturas fallidas del equipo del usuario. Su revisión del primer arranque sigue siendo necesaria.

Con estos resultados se mantiene la apertura directa. No se añade una pantalla de lanzamiento aparte.

## Aviso de Chromium sobre `--no-sandbox`

Al iniciar, Chromium puede mostrar: “You are using an unsupported command-line flag: --no-sandbox. Stability and security will suffer.” Es una advertencia de Chromium: esa opción desactiva el sandbox de procesos del navegador y reduce su aislamiento de seguridad. No significa por sí sola que MGT haya fallado al iniciar; si la ventana de MGT abre y funciona, se puede continuar entendiendo esta limitación. No se debe asumir que el sandbox del navegador está activo ni abrir con MGT contenido o archivos de confianza dudosa. El sandbox del iframe de composiciones es una protección separada y no reemplaza el sandbox de procesos.


La cancelación de una lectura WAV se probó con un subproceso de ensayo ralentizado: el proceso y servidor terminaron y se retiraron sus medios temporales. La cancelación no permite borrar temporales antes de recibir el cierre del subproceso.
