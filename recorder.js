let mediaRecorder;
let recordedChunks = [];
let videoBlob = null;

const startRecording = (stream, onStopCallback) => {
    recordedChunks = [];
    
    const options = { mimeType: 'video/webm' };
    
    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
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

    // El 100 obliga a guardar chunks cada 100ms para evitar el bug de pérdida de segundos
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

const getVideoBlob = () => {
    return videoBlob;
};