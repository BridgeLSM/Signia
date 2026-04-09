# Recolector de Dataset

Una herramienta web de arquitectura Frontend diseñada para la recolección estandarizada, rápida y segura de videos para la creación de un dataset de Lengua de Señas Mexicana (LSM). 


## Características Principales

* **Arquitectura Serverless:** Funciona directamente desde GitHub Pages.
* **Integración Cloud:** Subida directa y automatizada a Google Drive mediante un puente (API) en Google Apps Script, ocultando credenciales y facilitando el trabajo al voluntario.
* **Control de Hardware Estricto:** Fuerza la cámara a resoluciones y framerates ideales (ej. 1280x720 @ 30 FPS) para asegurar la uniformidad del dataset, mostrando telemetría en tiempo real.
* **Doble Vía de Guardado:** Permite guardar el clip localmente o enviarlo a la nube, con protecciones para evitar sobrescribir videos no guardados.
* **Nomenclatura Automatizada:** Genera nombres de archivo a prueba de errores humanos (`persona_seña_001-5s.webm`).
* **Temporizadores de Precisión:** Cuenta regresiva de preparación y compensación de latencia de la `MediaRecorder API` para evitar pérdida de frames.

## Tecnologías Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6+).
* **Framework CSS:** Bootstrap 5.
* **APIs Web:** `MediaRecorder API`, `MediaDevices API` (getUserMedia).
* **Almacenamiento:** `localStorage` (Persistencia de sesión), File API (Conversión Base64/Blob).
* **Backend Bridge:** Google Apps Script (Recepción POST y creación en Google Drive).
