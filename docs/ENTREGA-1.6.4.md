# MGT 1.6.4 — duración propia de MGT

Esta entrega ofrece dos paquetes independientes para Windows x64: el **Editor portable**, recomendado para personas que quieren usar MGT, y el **Engine autónomo**, para desarrolladores que integran el motor mediante su API local. Extrae el ZIP completo del editor y abre `MGT.exe`.

Al seleccionar un clip MGT hay ahora dos controles distintos: **duración visible en la pista** y **duración propia de la animación**. La segunda reescala el reloj interno del MGT sin cambiar el tramo visible. Por ejemplo, un MGT de 10 s con duración propia de 20 s y clip visible de 10 s muestra únicamente la primera mitad de la animación, a mitad de velocidad. Si se alarga el borde derecho a 20 s, se ve completa. Los recortes siguen siendo no destructivos y no cambian la velocidad.

La duración propia se guarda dentro del proyecto `.mgtproj`; no modifica el `.mgt.json` original. No afecta a clips de vídeo, imágenes ni audio. La vista previa y la exportación aplican el mismo cálculo de fotogramas. La animación debe estar vinculada al reloj MGT (`ctx.time`, `ctx.progress` o medios gestionados por MGT); las animaciones autónomas del navegador que no utilicen ese reloj no se reescalan.

El motor ofrece los contratos de assets v1/v2; consulta `documentacion/MGT-ASSET-CONTRACT.md` y `documentacion/MGT-ASSET-CONTRACT-v2.md`. No se incluyen adaptadores para DaVinci Resolve, Adobe Premiere Pro, Vegas Pro ni otros NLE; cada aplicación anfitriona debe desarrollar y validar el suyo. Esta entrega no añade controles de duración propia a los contratos de assets.
