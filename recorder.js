let mediaRecorder;
let recordedChunks = [];
let videoBlob = null;

const startRecording = (stream, onStopCallback) => {
    recordedChunks = [];
    
    // Configuramos para webm
    const options = { mimeType: 'video/webm' };
    
    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        // Fallback si webm estricto no está soportado
        mediaRecorder = new MediaRecorder(stream); 
    }

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        if (onStopCallback) onStopCallback(videoBlob);
    };

    mediaRecorder.start(100);
};

const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
};

const getBlobURL = () => {
    return videoBlob ? URL.createObjectURL(videoBlob) : null;
};