document.addEventListener('DOMContentLoaded', async () => {
    // Referencias al DOM
    const cameraPreview = document.getElementById('cameraPreview');
    const recordedPreview = document.getElementById('recordedPreview');
    
    // Nuevas superposiciones y estado
    const recordingStatus = document.getElementById('recordingStatus');
    const preCountdownOverlay = document.getElementById('preCountdownOverlay');
    const recordCountdownOverlay = document.getElementById('recordCountdownOverlay');
    
    const inputPersona = document.getElementById('inputPersona');
    const inputSena = document.getElementById('inputSena');
    const inputNumero = document.getElementById('inputNumero');
    const inputDuracion = document.getElementById('inputDuracion');
    
    const btnRecord = document.getElementById('btnRecord');
    const btnDelete = document.getElementById('btnDelete');
    const btnDownload = document.getElementById('btnDownload');
    const btnNewSign = document.getElementById('btnNewSign');
    const btnNewPerson = document.getElementById('btnNewPerson');
    const btnSwitchCamera = document.getElementById('btnSwitchCamera');
    
    const recordControls = document.getElementById('recordControls');
    const previewControls = document.getElementById('previewControls');

    // Restaurar estado
    const state = restoreState();
    inputPersona.value = state.persona;
    inputSena.value = state.sena;
    inputNumero.value = state.numero;
    if (state.duracion) inputDuracion.value = state.duracion;
    btnRecord.innerText = `Grabar (${inputDuracion.value}s)`;

    let stream = await initCamera(cameraPreview);

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

    btnSwitchCamera.addEventListener('click', async () => {
        stream = await switchCamera(cameraPreview);
    });

    btnRecord.addEventListener('click', () => {
        // Validación de seguridad: Evita grabar si hay un video en el preview
        if (!recordedPreview.classList.contains('d-none')) {
            return alert("⚠️ Tienes un video en pantalla. Por favor, descárgalo o elimínalo antes de grabar uno nuevo.");
        }

        const error = validateInputs(inputPersona.value, inputSena.value, inputNumero.value);
        if (error) return alert(error);
        if (!stream) return alert("Cámara no disponible.");

        const duracionSecs = parseInt(inputDuracion.value);
        let preCounttimeLeft = 3;
        
        btnRecord.disabled = true;
        // Solo mostramos el pre countdown grande en el centro
        preCountdownOverlay.classList.remove('d-none');
        preCountdownOverlay.innerText = preCounttimeLeft;

        // Cuenta regresiva ANTES de grabar (3s)
        const preRecordInterval = setInterval(() => {
            preCounttimeLeft--;
            if (preCounttimeLeft > 0) {
                preCountdownOverlay.innerText = preCounttimeLeft;
            } else {
                // Termina pre countdown y oculta el overlay central
                clearInterval(preRecordInterval);
                preCountdownOverlay.classList.add('d-none');
                
                // Muestra "¡GRABANDO!" rojo ARRIBA y la grabación
                recordingStatus.classList.remove('d-none');
                
                startRecording(stream, (blob) => {
                    cameraPreview.classList.add('d-none');
                    recordedPreview.classList.remove('d-none');
                    recordedPreview.src = getBlobURL();
                    
                    previewControls.classList.remove('d-none');
                    btnSwitchCamera.classList.add('d-none');
                    
                    // Asegurar que el estado y overlay de grabación desaparezcan
                    recordingStatus.classList.add('d-none');
                    recordCountdownOverlay.classList.add('d-none');
                });

                let recordTimeLeft = duracionSecs;
                
                // Muestra la cuenta regresiva de grabación INMEDIATAMENTE abajo a la derecha
                recordCountdownOverlay.innerText = recordTimeLeft;
                recordCountdownOverlay.classList.remove('d-none');

                // Cuenta regresiva DURANTE la grabación
                const recordInterval = setInterval(() => {
                    recordTimeLeft--;
                    if (recordTimeLeft > 0) {
                        recordCountdownOverlay.innerText = recordTimeLeft;
                    } else {
                        // Termina visualmente para el usuario y oculta todo
                        clearInterval(recordInterval);
                        recordCountdownOverlay.classList.add('d-none');
                        recordingStatus.classList.add('d-none');
                        btnRecord.disabled = false;
                        
                        setTimeout(() => {
                            stopRecording();
                        }, 300); // Pequeño margen extra invisible
                    }
                }, 1000);
            }
        }, 1000);
    });

    btnDelete.addEventListener('click', () => {
        recordedPreview.src = "";
        recordedPreview.classList.add('d-none');
        cameraPreview.classList.remove('d-none');
        
        previewControls.classList.add('d-none');
        btnSwitchCamera.classList.remove('d-none');
        
        // Limpiar estados de cuenta regresiva por si acaso
        preCountdownOverlay.classList.add('d-none');
        recordCountdownOverlay.classList.add('d-none');
        recordingStatus.classList.add('d-none');
    });

    btnDownload.addEventListener('click', () => {
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

        let nextNum = parseInt(inputNumero.value) + 1;
        inputNumero.value = nextNum;
        updateState();

        btnDelete.click(); // Resetea la vista para la siguiente toma
    });

    btnNewSign.addEventListener('click', () => {
        // Validar seguridad: No se pierda un video al cambiar de seña
        if (!recordedPreview.classList.contains('d-none')) {
            return alert("⚠️ Descarga o elimina el video actual antes de cambiar de seña.");
        }
        inputSena.value = "";
        inputNumero.value = 1;
        updateState();
        btnDelete.click(); // Resetea la vista y oculta overlays
        inputSena.focus();
    });

    btnNewPerson.addEventListener('click', () => {
        // Validar seguridad: No se pierda un video al cambiar de persona
        if (!recordedPreview.classList.contains('d-none')) {
            return alert("⚠️ Descarga o elimina el video actual antes de cambiar de persona.");
        }
        inputPersona.value = "";
        inputSena.value = "";
        inputNumero.value = 1;
        updateState();
        btnDelete.click(); // Resetea la vista y oculta overlays
        inputPersona.focus();
    });
});