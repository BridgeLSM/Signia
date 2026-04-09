/**
 * Archivo: app.js
 * Descripción: Controlador principal de la aplicación. Orquesta la interacción del DOM,
 * manejo de eventos, sincronización de temporizadores de grabación y 
 * la comunicación con la API externa (Google Apps Script).
 * Elaborado por: José Antonio Huerta Aguilar y Giovanni Ariel Rodriguez Bautista
 * Versión: 5.0
 * Última actualización: 9 de abril de 2026
 */

document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias al DOM (Visores y Capas) ---
    const cameraPreview = document.getElementById('cameraPreview');
    const recordedPreview = document.getElementById('recordedPreview');
    const recordingStatus = document.getElementById('recordingStatus');
    const preCountdownOverlay = document.getElementById('preCountdownOverlay');
    const recordCountdownOverlay = document.getElementById('recordCountdownOverlay');
    const cameraStats = document.getElementById('cameraStats'); 
    
    // --- Referencias al DOM (Inputs) ---
    const inputPersona = document.getElementById('inputPersona');
    const inputSena = document.getElementById('inputSena');
    const inputNumero = document.getElementById('inputNumero');
    const inputDuracion = document.getElementById('inputDuracion');
    
    // --- Referencias al DOM (Botonera) ---
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

    // Bandera de control de flujo para asegurar que el contador solo avance una vez por video
    let isVideoSaved = false; 

    // --- Restauración de Estado (Persistencia local) ---
    const state = restoreState();
    inputPersona.value = state.persona;
    inputSena.value = state.sena;
    inputNumero.value = state.numero;
    if (state.duracion) inputDuracion.value = state.duracion;
    btnRecord.innerText = `Grabar (${inputDuracion.value}s)`;

    /**
     * Consulta las especificaciones de hardware activas en el stream de video
     * y las imprime en la UI para monitorear la calidad del dataset.
     */
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

    // Inicialización del hardware al cargar la página
    let stream = await initCamera(cameraPreview);
    updateCameraStats(stream);

    // --- Manejo de Inputs ---
    const updateState = () => saveState(inputPersona.value, inputSena.value, inputNumero.value, inputDuracion.value);
    
    inputPersona.addEventListener('input', updateState);
    inputSena.addEventListener('input', updateState);
    inputNumero.addEventListener('input', updateState);
    inputDuracion.addEventListener('change', () => {
        btnRecord.innerText = `Grabar (${inputDuracion.value}s)`;
        updateState();
    });

    // Auto-formateo en evento blur (pérdida de foco)
    inputPersona.addEventListener('blur', () => inputPersona.value = formatText(inputPersona.value));
    inputSena.addEventListener('blur', () => inputSena.value = formatText(inputSena.value));

    // --- Eventos de UI ---
    btnSwitchCamera.addEventListener('click', async () => {
        cameraStats.innerHTML = `📹 Cambiando...`;
        stream = await switchCamera(cameraPreview);
        updateCameraStats(stream);
    });

    /**
     * Secuencia core de grabación:
     * 1. Validaciones de estado.
     * 2. Cuenta regresiva de preparación (3 seg).
     * 3. Disparo de API MediaRecorder.
     * 4. Cuenta regresiva de captura activa (Duración seleccionada).
     * 5. Parada y transición a vista previa.
     */
    btnRecord.addEventListener('click', () => {
        // Bloqueo de seguridad: Evita sobrescribir archivo sin confirmar
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
                    // Callback ejecutado tras procesar y empaquetar el Blob
                    cameraPreview.classList.add('d-none');
                    recordedPreview.classList.remove('d-none');
                    recordedPreview.src = getBlobURL();
                    
                    previewControls.classList.remove('d-none');
                    btnSwitchCamera.classList.add('d-none');
                    
                    recordingStatus.classList.add('d-none');
                    recordCountdownOverlay.classList.add('d-none');
                    cameraStats.classList.add('d-none'); 
                    
                    isVideoSaved = false; // Reset de la bandera transaccional
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
                        
                        // Buffer extra de 300ms para asegurar la escritura final de frames en el archivo
                        setTimeout(() => stopRecording(), 300); 
                    }
                }, 1000);
            }
        }, 1000);
    });

    /**
     * Limpia la UI posterior a una grabación, devolviendo el control al stream en vivo.
     */
    const resetView = () => {
        recordedPreview.src = "";
        recordedPreview.classList.add('d-none');
        cameraPreview.classList.remove('d-none');
        previewControls.classList.add('d-none');
        btnSwitchCamera.classList.remove('d-none');
        preCountdownOverlay.classList.add('d-none');
        recordCountdownOverlay.classList.add('d-none');
        recordingStatus.classList.add('d-none');
        updateCameraStats(stream);
    };

    btnDelete.addEventListener('click', () => {
        resetView();
    });

    // Acción para descartar de manera segura y avanzar
    btnNextRecord.addEventListener('click', () => {
        if (!isVideoSaved) {
            const confirmDiscard = confirm("⚠️ No has guardado este video. ¿Estás seguro de que quieres descartarlo y grabar el siguiente?");
            if (!confirmDiscard) return;
        }
        resetView();
    });

    // Descarga tradicional mediante creación y pulsación virtual de ancla (DOM)
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

        // Control transaccional del contador
        if (!isVideoSaved) {
            let nextNum = parseInt(inputNumero.value) + 1;
            inputNumero.value = nextNum;
            updateState();
            isVideoSaved = true;
        }
    });

    /**
     * Proceso de subida a Google Drive.
     * Codifica el Blob de WebM a Base64 y lo transfiere vía POST a la URL de Google Apps Script.
     */
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
            // Extracción del payload bruto omitiendo el encabezado MIME
            const base64data = reader.result.split(',')[1]; 
            
            const payload = {
                filename: filename,
                mimeType: 'video/webm',
                base64Data: base64data
            };

            try {
                // Endpoint remoto de la API generada en Apps Script
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

    // --- Controles de reseteo rápido de metadatos ---
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