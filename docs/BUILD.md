# Construcción y desarrollo

## Requisitos
Windows x64. Node.js 24 (la distribución de prueba usa 24.21.0), Playwright Core 1.62.1, Chromium 151.0.7922.173 (paquete comunitario ungoogled-chromium probado con Playwright) y FFmpeg 9.0.1 con libx264, dav1d y zlib. El portable MGT 1.0.0 incluye una compilación estática propia de FFmpeg; ya no usa el binario Essentials de Gyan. COMPONENTES.json fija versiones, commits, archivos fuente y hashes.

No se compila el frontend: HTML/CSS/JS se sirven directamente. No es una aplicación Electron.

## Preparar dependencias
1. Instalar Node desde su distribución oficial.
2. Instalar la versión indicada de Playwright Core: npm install --no-save --package-lock=false playwright-core@1.62.1
3. Obtener Chromium 151.0.7922.173 desde la URL fijada en COMPONENTES.json y verificar el SHA-256 publicado. Obtener Node según su entrada. Mantener licencias y créditos junto al paquete.
4. Editar config.json con rutas locales a playwright-core, chrome.exe y ffmpeg.exe. Pueden ser absolutas en desarrollo o relativas a la carpeta de la aplicación. La ruta de Playwright apunta a la carpeta del paquete, no a su ejecutable.
5. Ejecutar node launcher.cjs. Para detener: node launcher.cjs --stop. Para iniciar sin abrir ventana: node launcher.cjs --no-open.

La configuración del portable espera runtime/node/node.exe, runtime/playwright-core/, runtime/chromium/chrome.exe y runtime/ffmpeg/ffmpeg.exe y runtime/ffmpeg/ffprobe.exe. FFprobe se incluye para verificar videos. Copiar todos los recursos del navegador, no solo su EXE.

## Compilar el FFmpeg incluido

El repositorio contiene los snapshots exactos de FFmpeg 9.0.1, x264, zlib y dav1d, sus SHA-256, avisos y la receta `third-party/ffmpeg/build.sh`. Para reconstruir en Windows se requiere MSYS2 UCRT64 con MinGW-w64 x86_64, GCC, make, Meson, Ninja, pkg-config, NASM, tar, strings y strip. En la terminal UCRT64, desde la raíz del repositorio, ejecuta `bash third-party/ffmpeg/build.sh /ruta/nueva/de/build`. El destino debe no existir; los binarios quedan en `install/bin/ffmpeg.exe` y `install/bin/ffprobe.exe`. No usa ramas móviles ni descarga fuentes: primero verifica los archivos fuente que ya están en el repositorio. dav1d habilita decodificación AV1 por software en Windows. La configuración habilita GPL y versión 3; el resultado se distribuye bajo GPL-3.0-or-later, conservando avisos y términos de las bibliotecas externas. Ver `licenses/FFmpeg-README.txt` y `LICENSING.md`.

## Pruebas
node --test tests/*.test.cjs

Las pruebas de almacenamiento usan una carpeta temporal propia y no tocan la galería del programa. PRUEBAS.md documenta las pruebas de navegador realizadas durante el desarrollo y sus límites.

## Empaquetar
Para construir el portable de MGT 1.0.0, primero compila el lanzador con `./scripts/build-launcher.ps1`. Después ejecuta `node scripts/stage-098.cjs RUTA_DE_SALIDA_NUEVA RUTA_DEL_RUNTIME_EXISTENTE` y `node scripts/smoke-portable.cjs RUTA_DE_SALIDA_NUEVA`; finalmente comprime la carpeta y calcula SHA-256. El runtime debe incluir Node, Chromium, Playwright y FFmpeg con la estructura descrita arriba. El empaquetador usa únicamente ejemplos iniciales para `galeria` y deja `subtitulos` vacío; no migra datos personales.

## Datos locales
El servidor escucha solo en loopback. El puerto base es 43871, con 20 alternativas. Perfil/logs/exports están en %LOCALAPPDATA%\MGT\<id de ubicación>; la galería está junto al programa. MGT_DATA_ROOT permite usar una carpeta de datos de prueba; no incluirla en una release. Las imágenes requieren version:3. Siguen admitidas las composiciones v1 y v2; la versión actual del programa es 1.0.0.

La biblioteca de subtítulos usa subtitulos/ junto al programa y se inicializa una vez desde examples/subtitulos/. El empaquetador no copia la biblioteca personal: solo las plantillas iniciales. Los datos del formato WMGT se validan tanto en el navegador como en el servidor.

## Lanzador Windows

El código propio scripts/MGT.cs se compila como MGT.exe x64 con el compilador de .NET Framework de Windows. scripts/build-launcher.ps1 usa el ICO de public/icon.ico. No se incluyen DLL del sistema en el ZIP. El lanzador abre Node sin consola; su modo de icono solo opera sobre las ventanas MGT del PID de Chrome de la sesión.

El proceso de escritorio utiliza la opción `--no-sandbox`, necesaria para el modo de lanzamiento de Chromium usado por Playwright en esta integración. Chromium puede mostrar el aviso “You are using an unsupported command-line flag: --no-sandbox. Stability and security will suffer.” Es un aviso del navegador sobre aislamiento de seguridad reducido; por sí solo no significa que MGT haya fallado al iniciar. No se oculta ni se presenta como que el sandbox del navegador esté activo. El aislamiento de composiciones dentro de la aplicación usa además el iframe sandbox, pero no reemplaza el sandbox de procesos del navegador. No se instala un servicio ni una tarea de inicio. ARRANQUE.md documenta la supervisión y los registros.

Motor GLB: instalar como dependencias de desarrollo three@0.180.0 y esbuild@0.25.10, después ejecutar node scripts/build-glb.cjs. El portable incluye el resultado y no necesita npm ni conexión. Entrada fuente en scripts/glb-engine-entry.js; licencia Three MIT en licenses/Three-LICENSE.txt.

MGT 0.8.2: animación declarable de cámara/objetos, reproducción de clips GLB, iluminación y texto extruido Helvetiker. Ver 3D-ANIMACION.md; ejemplos 07 y 08. Esta versión sustituye las limitaciones de animación/extrusión descritas para versiones anteriores.

MGT 0.9.0: MP4 H.264 como recurso visual en version:4, parámetro type:video y videos autocontenidos. Reloj local del clip, último fotograma conservado, sin audio del recurso ni ajuste de duración. ctx.video(id).element es el canvas del fotograma actual; canvas[data-mgt-video="idDelParametro"] es el enlace automático. Requiere controles declarados. Ver MP4-RECURSOS.md o /video-contract; ejemplo 09. Esta nota sustituye limitaciones anteriores sobre MP4 como recurso; no añade vídeo base ni guardado del proyecto.
