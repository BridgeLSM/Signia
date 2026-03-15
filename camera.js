let currentStream = null;
let currentFacingMode = 'user'; // 'user' (frontal) o 'environment' (trasera)

const initCamera = async (videoElement) => {
    if (currentStream) {
        stopCamera();
    }
    
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: currentFacingMode,
                // Pedimos una resolución ideal (Ej: HD 720p)
                width: { ideal: 1280 },
                height: { ideal: 720 },
                // Pedimos FPS estables
                frameRate: { ideal: 30 }
            },
            audio: false 
        });
        
        videoElement.srcObject = currentStream;

        // ESTO IMPRIME EN CONSOLA LA CALIDAD REAL QUE LOGRÓ CONSEGUIR
        const settings = currentStream.getVideoTracks()[0].getSettings();
        console.log(`🎥 Cámara iniciada a: ${settings.width}x${settings.height} @ ${settings.frameRate} FPS`);

        return currentStream;
    } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        alert("No se pudo acceder a la cámara. Verifica los permisos.");
        return null;
    }
};

const switchCamera = async (videoElement) => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    return await initCamera(videoElement);
};

const stopCamera = () => {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
};