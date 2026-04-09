/**
 * Archivo: camera.js
 * Descripción: Módulo responsable de la interfaz con la API de hardware (MediaDevices).
 * Maneja la inicialización, configuración de constraints (Resolución/FPS)
 * y la conmutación de cámaras (Frontal/Trasera).
 * Elaborado por: José Antonio Huerta Aguilar y Giovanni Ariel Rodriguez Bautista
 * Versión: 5.0
 * Última actualización: 9 de abril de 2026
 */

let currentStream = null;
let currentFacingMode = 'user'; // Por defecto: cámara frontal

/**
 * Solicita acceso al dispositivo de video y establece los parámetros óptimos
 * para la recolección del dataset (HD a 30 FPS cuando sea posible).
 */
const initCamera = async (videoElement) => {
    // Si ya existe un stream activo, se detiene para liberar el recurso
    if (currentStream) {
        stopCamera();
    }
    
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: currentFacingMode,
                // Restricciones "ideal" evitan romper la app si el hardware es limitado
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            },
            audio: false // No se requiere audio para el dataset de señas
        });
        
        videoElement.srcObject = currentStream;

        // Registro técnico de las capacidades negociadas
        const settings = currentStream.getVideoTracks()[0].getSettings();
        console.log(`🎥 Cámara iniciada a: ${settings.width}x${settings.height} @ ${settings.frameRate} FPS`);

        return currentStream;
    } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        alert("No se pudo acceder a la cámara. Verifica los permisos.");
        return null;
    }
};

/**
 * Alterna entre la cámara frontal y la trasera, reiniciando el stream.
 */
const switchCamera = async (videoElement) => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    return await initCamera(videoElement);
};

/**
 * Detiene todos los tracks del stream activo para apagar el sensor de la cámara.
 */
const stopCamera = () => {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
};