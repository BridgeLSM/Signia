document.addEventListener('DOMContentLoaded', async () => {
    const cameraPreview = document.getElementById('cameraPreview');
    const recordedPreview = document.getElementById('recordedPreview');
    const countdownOverlay = document.getElementById('countdownOverlay');
    
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
        // NUEVA VALIDACIÓN: Evita grabar si hay un video en el preview
        if (!recordedPreview.classList.contains('d-none')) {
            return alert("⚠️ Tienes un video en pantalla. Por favor, descárgalo o elimínalo antes de grabar uno nuevo.");
        }

        const error = validateInputs(inputPersona.value, inputSena.value, inputNumero.value);
        if (error) return alert(error);
        if (!stream) return alert("Cámara no disponible.");

        const duracionSecs = parseInt(inputDuracion.value);
        let timeLeft = 3;
        
        btnRecord.disabled = true;
        countdownOverlay.classList.remove('d-none');
        countdownOverlay.innerText = timeLeft;

        // Cuenta regresiva ANTES de grabar
        const preRecordInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                countdownOverlay.innerText = timeLeft;
            } else {
                clearInterval(preRecordInterval);
                
                countdownOverlay.innerText = "¡GRABANDO!";
                countdownOverlay.classList.add('text-danger');
                
                startRecording(stream, (blob) => {
                    cameraPreview.classList.add('d-none');
                    recordedPreview.classList.remove('d-none');
                    recordedPreview.src = getBlobURL();
                    
                    // Ya NO ocultamos el botón de grabar aquí, para que puedan intentar pulsarlo y ver la alerta
                    previewControls.classList.remove('d-none');
                    btnSwitchCamera.classList.add('d-none');
                });

                let recordTimeLeft = duracionSecs;

                setTimeout(() => {
                    countdownOverlay.innerText = recordTimeLeft;
                }, 800);

                // Cuenta regresiva DURANTE la grabación
                const recordInterval = setInterval(() => {
                    recordTimeLeft--;
                    if (recordTimeLeft > 0) {
                        countdownOverlay.innerText = recordTimeLeft;
                    } else {
                        clearInterval(recordInterval);
                        countdownOverlay.classList.add('d-none');
                        countdownOverlay.classList.remove('text-danger');
                        btnRecord.disabled = false;
                        
                        setTimeout(() => {
                            stopRecording();
                        }, 300);
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

        btnDelete.click(); 
    });

    btnNewSign.addEventListener('click', () => {
        // Validar que no se pierda un video al cambiar de seña
        if (!recordedPreview.classList.contains('d-none')) {
            return alert("⚠️ Descarga o elimina el video actual antes de cambiar de seña.");
        }
        inputSena.value = "";
        inputNumero.value = 1;
        updateState();
        btnDelete.click();
        inputSena.focus();
    });

    btnNewPerson.addEventListener('click', () => {
        // Validar que no se pierda un video al cambiar de persona
        if (!recordedPreview.classList.contains('d-none')) {
            return alert("⚠️ Descarga o elimina el video actual antes de cambiar de persona.");
        }
        inputPersona.value = "";
        inputSena.value = "";
        inputNumero.value = 1;
        updateState();
        btnDelete.click();
        inputPersona.focus();
    });
});