/**
 * Archivo: recorder.js
 * Descripción: Módulo de captura de video que implementa la MediaRecorder API.
 * Gestiona el empaquetado de datos en formato WebM y la corrección 
 * de latencia en la finalización del archivo.
 * Elaborado por: José Antonio Huerta Aguilar y Giovanni Ariel Rodriguez Bautista
 * Versión: 5.0
 * Última actualización: 9 de abril de 2026
 */

let mediaRecorder;
let recordedChunks = [];
let videoBlob = null;

/**
 * Instancia e inicia el grabador procesando el stream de la cámara.
 * @param {MediaStream} stream - Flujo de video provisto por getUserMedia
 * @param {Function} onStopCallback - Función ejecutada tras generar el Blob final
 */
const startRecording = (stream, onStopCallback) => {
    recordedChunks = [];
    
    // Preferencia por contenedor WebM (nativo y ligero para web)
    const options = { mimeType: 'video/webm' };
    
    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        // Fallback en caso de que el navegador no soporte las opciones exactas
        mediaRecorder = new MediaRecorder(stream); 
    }

    // Almacena fragmentos de video conforme se codifican
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    // Al detener la grabación, compila los fragmentos en un objeto binario (Blob)
    mediaRecorder.onstop = () => {
        videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        if (onStopCallback) onStopCallback(videoBlob);
    };

    // Se especifica timeslice (100ms) para obligar volcados frecuentes.
    // Esto previene descartes de frames al final del video (Bug de los 4 segundos).
    mediaRecorder.start(100);
};

/**
 * Ordena la finalización de la captura de video de forma segura.
 */
const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
};

/**
 * Genera una URL temporal en memoria para previsualizar el video grabado en el DOM.
 */
const getBlobURL = () => {
    return videoBlob ? URL.createObjectURL(videoBlob) : null;
};

/**
 * Retorna el archivo crudo para operaciones de subida o descarga física.
 */
const getVideoBlob = () => {
    return videoBlob;
};