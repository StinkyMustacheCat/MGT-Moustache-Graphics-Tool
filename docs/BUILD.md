# Construcción y desarrollo

## Requisitos
Windows x64. Node.js 24 (la distribución de prueba usa 24.21.0), Playwright Core 1.62.1, navegador compatible con esa versión (la prueba usa Chrome for Testing 151.0.7922.34) y FFmpeg con libx264 (la prueba usa 9.0.1 essentials de Gyan).

No se compila el frontend: HTML/CSS/JS se sirven directamente. No es una aplicación Electron.

## Preparar dependencias
1. Instalar Node desde su distribución oficial.
2. Instalar la versión indicada de Playwright Core: npm install --no-save --package-lock=false playwright-core@1.62.1
3. Obtener el navegador compatible y FFmpeg de sus fuentes oficiales. COMPONENTES.json identifica las distribuciones usadas y el checksum del ZIP de Node. Verificar las condiciones de redistribución antes de incorporarlos a una release pública.
4. Editar config.json con rutas locales a playwright-core, chrome.exe y ffmpeg.exe. Pueden ser absolutas en desarrollo o relativas a la carpeta de la aplicación. La ruta de Playwright apunta a la carpeta del paquete, no a su ejecutable.
5. Ejecutar node launcher.cjs. Para detener: node launcher.cjs --stop. Para iniciar sin abrir ventana: node launcher.cjs --no-open.

La configuración del portable espera runtime/node/node.exe, runtime/playwright-core/, runtime/chromium/chrome.exe y runtime/ffmpeg/ffmpeg.exe y runtime/ffmpeg/ffprobe.exe. FFprobe se incluye para verificar videos. Copiar todos los recursos del navegador, no solo su EXE.

## Pruebas
node --test tests/*.test.cjs

Las pruebas de almacenamiento usan una carpeta temporal propia y no tocan la galería del programa. PRUEBAS.md documenta las pruebas de navegador realizadas durante el desarrollo y sus límites.

## Empaquetar
Para el portable completo de MGT 1.0.0, con lanzador y documentación en la raíz, ejecutar `node scripts/stage-098.cjs RUTA_DE_SALIDA_NUEVA RUTA_DEL_RUNTIME_EXISTENTE`. Después ejecutar `node scripts/smoke-portable.cjs RUTA_DE_SALIDA_NUEVA`, comprimir la carpeta y calcular SHA256. El empaquetador usa únicamente ejemplos iniciales para `galeria` y deja `subtitulos` vacío; no migra datos personales.

Con las dependencias locales preparadas, ejecutar:
node scripts/stage.cjs RUTA_DE_SALIDA_NUEVA

Crea una carpeta limpia con una lista explícita de archivos y dependencias. Busca `runtime` en la carpeta del proyecto; si se conserva en otra ubicación, establece `MGT_RUNTIME_SOURCE` con la ruta absoluta de ese directorio. La configuración de la entrega se escribe con rutas relativas, sin las rutas de desarrollo. No copia tu galería, registros, exportaciones ni perfil. Exige una ruta nueva y no sobrescribe otra entrega. Después comprimir esa carpeta y calcular SHA256 del ZIP. Las licencias de los componentes y sus fuentes correspondientes deben acompañar la distribución según sus condiciones: consultar PUBLICACION.md. El script de empaquetado no certifica el cumplimiento legal.

## Datos locales
El servidor escucha solo en loopback. El puerto base es 43871, con 20 alternativas. Perfil/logs/exports están en %LOCALAPPDATA%\MGT\<id de ubicación>; la galería está junto al programa. MGT_DATA_ROOT permite usar una carpeta de datos de prueba; no incluirla en una release. Las imágenes requieren version:3. Siguen admitidas las composiciones v1 y v2; la versión actual del programa es 1.0.0.

La biblioteca de subtítulos usa subtitulos/ junto al programa y se inicializa una vez desde examples/subtitulos/. El empaquetador no copia la biblioteca personal: solo las plantillas iniciales. Los datos del formato WMGT se validan tanto en el navegador como en el servidor.

## Lanzador Windows

El código propio scripts/MGT.cs se compila como MGT.exe x64 con el compilador de .NET Framework de Windows. scripts/build-launcher.ps1 usa el ICO de public/icon.ico. No se incluyen DLL del sistema en el ZIP. El lanzador abre Node sin consola; su modo de icono solo opera sobre las ventanas MGT del PID de Chrome de la sesión.

El proceso de escritorio utiliza el mismo modo de compatibilidad sin sandbox de sistema utilizado por Playwright al capturar en el entorno probado. El aislamiento del código de composiciones sigue usando el iframe sandbox y los límites del contrato. No se instala un servicio ni una tarea de inicio. ARRANQUE.md documenta la supervisión y los registros.

Motor GLB: instalar como dependencias de desarrollo three@0.180.0 y esbuild@0.25.10, después ejecutar node scripts/build-glb.cjs. El portable incluye el resultado y no necesita npm ni conexión. Entrada fuente en scripts/glb-engine-entry.js; licencia Three MIT en licenses/Three-LICENSE.txt.

MGT 0.8.2: animación declarable de cámara/objetos, reproducción de clips GLB, iluminación y texto extruido Helvetiker. Ver 3D-ANIMACION.md; ejemplos 07 y 08. Esta versión sustituye las limitaciones de animación/extrusión descritas para versiones anteriores.

MGT 0.9.0: MP4 H.264 como recurso visual en version:4, parámetro type:video y videos autocontenidos. Reloj local del clip, último fotograma conservado, sin audio del recurso ni ajuste de duración. ctx.video(id).element es el canvas del fotograma actual; canvas[data-mgt-video="idDelParametro"] es el enlace automático. Requiere controles declarados. Ver MP4-RECURSOS.md o /video-contract; ejemplo 09. Esta nota sustituye limitaciones anteriores sobre MP4 como recurso; no añade vídeo base ni guardado del proyecto.
