let currentStream = null;
let currentFacingMode = 'user'; // 'user' (frontal) o 'environment' (trasera)

const initCamera = async (videoElement) => {
    if (currentStream) {
        stopCamera();
    }
    
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode },
            audio: false 
        });
        videoElement.srcObject = currentStream;
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