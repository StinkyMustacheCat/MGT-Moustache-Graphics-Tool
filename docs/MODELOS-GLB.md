# MGT 0.8.1 · recursos GLB estáticos

Para importar tu modelo: Código → Capturar código y ayuda → Código modelo GLB → Aplicar código. En Propiedades, abre Modelo GLB e importa el archivo. Conserva materiales y texturas originales; usa iluminación fija de estudio para visualizarlos. Se centra por sus límites y ajusta proporcionalmente al tamaño declarado. Posición, rotación, escala, tamaño y visibilidad usan parámetros del JSON. No edita mallas ni materiales; animaciones incluidas no se reproducen.

Para probar sin preparar un modelo: importa examples/06-modelo-glb.mgt.json desde Galería, o úsalo en Overlay. Incluye un cubo con textura creado para MGT. Su archivo independiente es examples/cubo-material.glb. El ejemplo anterior 3D permanece disponible.

El recurso se declara en models con nombre, mime model/gltf-binary y data base64. Un parámetro type:model tiene como default el identificador del recurso o una cadena vacía. En scene3d.objects, type:model declara resource como identificador literal o referencia {param:...}; width define el tamaño de ajuste de su dimensión mayor. Position/rotation/scale/visible conservan el contrato 3D. Usa version:4. El espacio sin archivo admite importar desde Propiedades.

MGT y Overlay tienen recursos independientes. La carga se valida y prepara antes de sustituir el modelo; un archivo rechazado conserva el anterior. Deshacer/rehacer y copiar/pegar incluyen recursos GLB. Capturar/guardar una composición conserva el GLB dentro del JSON; no es guardado del proyecto entero.

Límites iniciales: 10 MB por GLB, dos recursos y dos objetos GLB por composición, 20 MB de modelos y 25 MB de recursos combinados con imágenes. Hasta 100 000 triángulos y 200 000 vértices por archivo; 512 nodos, 128 mallas, 64 materiales. Ocho texturas PNG/JPEG internas de hasta 2048 px por lado, sumando 8 megapíxeles. El JSON sigue limitado a 36 MB. La velocidad depende del modelo y del equipo: estos límites no garantizan 60 FPS.

Solo GLB 2.0 autocontenido: sin archivos/URI externos, Draco, Meshopt, KTX/Basis ni accessors sparse. Mallas de triángulos. Extensiones admitidas: KHR_materials_unlit, KHR_texture_transform, KHR_materials_ior, KHR_materials_specular, KHR_materials_clearcoat, KHR_materials_sheen, KHR_materials_emissive_strength. Se muestra la pose inicial, sin reproducción de animaciones. Otros formatos/extensiones requieren exportar una copia compatible.

El motor Three.js 0.180.0 y GLTFLoader se incluyen localmente con licencia MIT; no se descargan recursos al usar MGT. Las escenas con GLB usan WebGL para todos sus objetos, con fondo transparente para superponerlas. Las escenas anteriores sin modelos conservan su motor CSS. Los materiales originales se conservan, aunque el aspecto depende de la iluminación fija y el motor de MGT.

Pruebas: recurso con textura y origen desplazado, transformaciones/visibilidad, importación y sustitución inválida, Overlay y exportación MP4 con píxeles visibles. Una malla sintética de 100 000 triángulos, 50 451 vértices y 2,82 MB cargó y dibujó a 640×360; es una prueba del límite, no de escenas complejas o todas las pistas simultáneas. No se ha probado 4K, una hora ni modelos complejos de terceros. Ver informe de entrega.

Instalación: cerrar MGT y aplicar el ZIP sobre 0.8.0 en la misma carpeta, reemplazando archivos. Bibliotecas y runtime se conservan. Reproducción de modelos animados, animación de cámara, iluminación configurable y extrusión quedan para 0.8.2. Sin guardado de proyectos completos.

MGT 0.8.2: animación declarable de cámara/objetos, reproducción de clips GLB, iluminación y texto extruido Helvetiker. Ver 3D-ANIMACION.md; ejemplos 07 y 08. Esta versión sustituye las limitaciones de animación/extrusión descritas para versiones anteriores.
