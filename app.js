document.addEventListener('DOMContentLoaded', async () => {
    const cameraPreview = document.getElementById('cameraPreview');
    const recordedPreview = document.getElementById('recordedPreview');
    
    const recordingStatus = document.getElementById('recordingStatus');
    const preCountdownOverlay = document.getElementById('preCountdownOverlay');
    const recordCountdownOverlay = document.getElementById('recordCountdownOverlay');
    const cameraStats = document.getElementById('cameraStats'); // NUEVA REFERENCIA
    
    const inputPersona = document.getElementById('inputPersona');
    const inputSena = document.getElementById('inputSena');
    const inputNumero = document.getElementById('inputNumero');
    const inputDuracion = document.getElementById('inputDuracion');
    
    const btnRecord = document.getElementById('btnRecord');
    const btnDelete = document.getElementById('btnDelete');
    const btnDownload = document.getElementById('btnDownload');
    const btnDownloadLocal = document.getElementById('btnDownloadLocal');
    const btnNextRecord = document.getElementById('btnNextRecord'); 
    const btnNewSign = document.getElementById('btnNewSign');
    const btnNewPerson = document.getElementById('btnNewPerson');
    const btnSwitchCamera = document.getElementById('btnSwitchCamera');
    
    const recordControls = document.getElementById('recordControls');
    const previewControls = document.getElementById('previewControls');

    let isVideoSaved = false; 

    const state = restoreState();
    inputPersona.value = state.persona;
    inputSena.value = state.sena;
    inputNumero.value = state.numero;
    if (state.duracion) inputDuracion.value = state.duracion;
    btnRecord.innerText = `Grabar (${inputDuracion.value}s)`;

    // NUEVA FUNCIÓN: Extrae la resolución y FPS reales negociados con el hardware
    const updateCameraStats = (currentStream) => {
        if (!currentStream) return;
        const track = currentStream.getVideoTracks()[0];
        if (track) {
            const settings = track.getSettings();
            const width = settings.width || 0;
            const height = settings.height || 0;
            const fps = Math.round(settings.frameRate || 0);
            
            cameraStats.innerHTML = `📹 ${width}x${height} @ ${fps} FPS`;
            cameraStats.classList.remove('d-none');
        }
    };

    // Iniciamos la cámara y actualizamos los datos
    let stream = await initCamera(cameraPreview);
    updateCameraStats(stream);

    const updateState = () => saveState(inputPersona.value, inputSena.value, inputNumero.value, inputDuracion.value);
    
    inputPersona.addEventListener('input', updateState);
    inputSena.addEventListener('input', updateState);
    inputNumero.addEventListener('input', updateState);
    inputDuracion.addEventListener('change', () => {
        btnRecord.innerText = `Grabar (${inputDuracion.value}s)`;
        updateState();
    });

    inputPersona.addEventListener('blur', () => inputPersona.value = formatText(inputPersona.value));
    inputSena.addEventListener('blur', () => inputSena.value = formatText(inputSena.value));

    // Al cambiar de cámara, actualizamos las estadísticas nuevamente
    btnSwitchCamera.addEventListener('click', async () => {
        cameraStats.innerHTML = `📹 Cambiando...`;
        stream = await switchCamera(cameraPreview);
        updateCameraStats(stream);
    });

    btnRecord.addEventListener('click', () => {
        if (!recordedPreview.classList.contains('d-none')) {
            return alert("⚠️ Tienes un video en pantalla. Por favor, descárgalo o elimínalo antes de grabar uno nuevo.");
        }

        const error = validateInputs(inputPersona.value, inputSena.value, inputNumero.value);
        if (error) return alert(error);
        if (!stream) return alert("Cámara no disponible.");

        const duracionSecs = parseInt(inputDuracion.value);
        let preCounttimeLeft = 3;
        
        btnRecord.disabled = true;
        preCountdownOverlay.classList.remove('d-none');
        preCountdownOverlay.innerText = preCounttimeLeft;

        const preRecordInterval = setInterval(() => {
            preCounttimeLeft--;
            if (preCounttimeLeft > 0) {
                preCountdownOverlay.innerText = preCounttimeLeft;
            } else {
                clearInterval(preRecordInterval);
                preCountdownOverlay.classList.add('d-none');
                
                recordingStatus.classList.remove('d-none');
                
                startRecording(stream, (blob) => {
                    cameraPreview.classList.add('d-none');
                    recordedPreview.classList.remove('d-none');
                    recordedPreview.src = getBlobURL();
                    
                    previewControls.classList.remove('d-none');
                    btnSwitchCamera.classList.add('d-none');
                    
                    recordingStatus.classList.add('d-none');
                    recordCountdownOverlay.classList.add('d-none');
                    cameraStats.classList.add('d-none'); // Ocultamos stats en la vista previa
                    
                    isVideoSaved = false; 
                });

                let recordTimeLeft = duracionSecs;
                recordCountdownOverlay.innerText = recordTimeLeft;
                recordCountdownOverlay.classList.remove('d-none');

                const recordInterval = setInterval(() => {
                    recordTimeLeft--;
                    if (recordTimeLeft > 0) {
                        recordCountdownOverlay.innerText = recordTimeLeft;
                    } else {
                        clearInterval(recordInterval);
                        recordCountdownOverlay.classList.add('d-none');
                        recordingStatus.classList.add('d-none');
                        btnRecord.disabled = false;
                        
                        setTimeout(() => stopRecording(), 300); 
                    }
                }, 1000);
            }
        }, 1000);
    });

    const resetView = () => {
        recordedPreview.src = "";
        recordedPreview.classList.add('d-none');
        cameraPreview.classList.remove('d-none');
        previewControls.classList.add('d-none');
        btnSwitchCamera.classList.remove('d-none');
        preCountdownOverlay.classList.add('d-none');
        recordCountdownOverlay.classList.add('d-none');
        recordingStatus.classList.add('d-none');
        
        // Volvemos a mostrar las estadísticas porque estamos en vista de cámara viva
        updateCameraStats(stream);
    };

    btnDelete.addEventListener('click', () => {
        resetView();
    });

    btnNextRecord.addEventListener('click', () => {
        if (!isVideoSaved) {
            const confirmDiscard = confirm("⚠️ No has guardado este video. ¿Estás seguro de que quieres descartarlo y grabar el siguiente?");
            if (!confirmDiscard) return;
        }
        resetView();
    });

    btnDownloadLocal.addEventListener('click', () => {
        const url = getBlobURL(); 
        if (!url) return;

        const duracion = inputDuracion.value;
        const filename = generateFilename(inputPersona.value, inputSena.value, inputNumero.value, duracion);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (!isVideoSaved) {
            let nextNum = parseInt(inputNumero.value) + 1;
            inputNumero.value = nextNum;
            updateState();
            isVideoSaved = true;
        }
    });

    btnDownload.addEventListener('click', () => {
        const blob = getVideoBlob();
        if (!blob) return;

        const originalText = btnDownload.innerText;
        btnDownload.disabled = true;
        btnDownload.innerText = "Subiendo...";

        const duracion = inputDuracion.value;
        const filename = generateFilename(inputPersona.value, inputSena.value, inputNumero.value, duracion);
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1]; 
            
            const payload = {
                filename: filename,
                mimeType: 'video/webm',
                base64Data: base64data
            };

            try {
                // RECUERDA PEGAR AQUÍ LA URL GENERADA EN GOOGLE APPS SCRIPT
                const scriptURL = 'https://script.google.com/macros/s/AKfycbwmdEE_dPKMzmlYn2BDspS8bgfktZ45CDCgNxFJs7PDup28kGgo-N9-Eqx_WvB9A1jp/exec';
                
                const response = await fetch(scriptURL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();

                if (result.status === 'success') {
                    if (!isVideoSaved) {
                        let nextNum = parseInt(inputNumero.value) + 1;
                        inputNumero.value = nextNum;
                        updateState();
                        isVideoSaved = true;
                    }
                    alert("✅ Video subido a Drive");
                } else {
                    alert("⚠️ Error de Drive: " + result.message);
                }
            } catch (error) {
                console.error(error);
                alert("⚠️ Error de red al intentar subir.");
            } finally {
                btnDownload.disabled = false;
                btnDownload.innerText = originalText;
            }
        };
    });

    btnNewSign.addEventListener('click', () => {
        if (!recordedPreview.classList.contains('d-none') && !isVideoSaved) {
            return alert("⚠️ Tienes un video sin guardar. Descárgalo o elimínalo primero.");
        }
        inputSena.value = "";
        inputNumero.value = 1;
        updateState();
        resetView();
        inputSena.focus();
    });

    btnNewPerson.addEventListener('click', () => {
        if (!recordedPreview.classList.contains('d-none') && !isVideoSaved) {
            return alert("⚠️ Tienes un video sin guardar. Descárgalo o elimínalo primero.");
        }
        inputPersona.value = "";
        inputSena.value = "";
        inputNumero.value = 1;
        updateState();
        resetView();
        inputPersona.focus();
    });
});