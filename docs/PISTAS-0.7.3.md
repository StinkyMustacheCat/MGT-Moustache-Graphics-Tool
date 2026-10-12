# MGT 0.7.3 · exportación de todas las pistas

Exporta MGT principal, overlays y subtítulos conservando JSON y parámetros independientes. Se respeta el orden visual: Subtítulos encima de Overlay, encima de MGT. Cada capa utiliza su propio reloj y desaparece al completar su duración; el proyecto determina el final del MP4. Se conserva el fondo del proyecto. Los fondos explícitos de overlays siguen siendo responsabilidad de su JSON; el envoltorio de Subtítulos se mantiene transparente.

El audio principal y los efectos se mezclan en AAC estéreo a 48 kHz y 192 kbps. Los efectos respetan entrada/salida del archivo, ubicación en el proyecto, volumen y silencio. El audio corto deja silencio y el largo se corta al final. Volúmenes independientes sin normalización automática de la mezcla. Ocultar o silenciar afecta al resultado; bloquear protege la edición y no excluye una pista de exportación.

La exportación toma una copia de los ajustes al comenzar y retiene los archivos utilizados hasta terminar o cancelar. El servidor valida duración, referencias, estados de pista y recortes contra sus propios WAV. La cancelación cierra el render y el codificador, elimina el MP4 parcial y libera las referencias. La exportación principal anterior sigue siendo compatible.

Esta versión incorpora todo lo de 0.7.2, pero aún no guarda ni reabre el proyecto completo. El historial y los audios siguen siendo de sesión. Los mecanismos anteriores de Galería/WMGT guardan composiciones individuales. No se implementan vídeo como recurso/pista, GIF/SVG animado ni las cotas 3D pendientes.

Instalación: cierra MGT. Aplica primero 0.7.2 sobre 0.7.1 y después el ZIP de 0.7.3 sobre 0.7.2, aceptando reemplazar archivos en la misma carpeta. No se sustituyen runtime, galeria ni subtitulos.
