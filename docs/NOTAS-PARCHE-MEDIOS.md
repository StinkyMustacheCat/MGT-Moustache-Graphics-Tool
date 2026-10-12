# Parche de prueba sobre MGT 0.9.8

- La pista MGT inicia con una composición editable precargada. Al eliminarla, queda vacía; el texto de ejemplo no reaparece. Deshacer recupera el clip.
- PNG, JPG, WebP y SVG pueden agregarse directamente como clips fijos en MGT, Overlay o la pista base. La duración se solicita al importar y luego se edita en Propiedades.
- La pista base admite varios clips de vídeo o imagen, cada uno con inicio y duración propios. Se pueden mover y no pueden solaparse.
- Las pistas visuales se muestran automáticamente cuando reciben clips.
- Una prueba de regresión comprueba que Overlay solo aparece dentro de su intervalo tras moverlo, en la previsualización y en el exportador.

El fallo intermitente de overlays duplicados no se reprodujo con el caso de prueba. Este parche no afirma haber identificado su causa. Si vuelve a ocurrir, conservar el JSON y anotar los tiempos de aparición permitirá aislarla.

Esta es una compilación de prueba, no la versión definitiva para guardar proyectos. La batería de 110 pruebas de lógica pasó; la última prueba visual de arrastre quedó pendiente por un fallo de arranque de Chromium en el entorno de pruebas.
