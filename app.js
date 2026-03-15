document.addEventListener('DOMContentLoaded', async () => {
    // Referencias al DOM
    const cameraPreview = document.getElementById('cameraPreview');
    const recordedPreview = document.getElementById('recordedPreview');
    const countdownOverlay = document.getElementById('countdownOverlay');
    
    const inputPersona = document.getElementById('inputPersona');
    const inputSena = document.getElementById('inputSena');
    const inputNumero = document.getElementById('inputNumero');
    
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

    // Iniciar cámara
    let stream = await initCamera(cameraPreview);

    // Actualizar LocalStorage al teclear
    const updateState = () => saveState(inputPersona.value, inputSena.value, inputNumero.value);
    inputPersona.addEventListener('input', updateState);
    inputSena.addEventListener('input', updateState);
    inputNumero.addEventListener('input', updateState);

    // Formatear automáticamente al perder el foco (blur)
    inputPersona.addEventListener('blur', () => inputPersona.value = formatText(inputPersona.value));
    inputSena.addEventListener('blur', () => inputSena.value = formatText(inputSena.value));

    // Botón: Cambiar cámara
    btnSwitchCamera.addEventListener('click', async () => {
        stream = await switchCamera(cameraPreview);
    });

    // Botón: Grabar
    btnRecord.addEventListener('click', () => {
        const error = validateInputs(inputPersona.value, inputSena.value, inputNumero.value);
        if (error) return alert(error);
        if (!stream) return alert("Cámara no disponible.");

        // Cuenta regresiva de 3 segundos
        let timeLeft = 3;
        btnRecord.disabled = true;
        countdownOverlay.classList.remove('d-none');
        countdownOverlay.innerText = timeLeft;

        const countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                countdownOverlay.innerText = timeLeft;
            } else {
                clearInterval(countdownInterval);
                countdownOverlay.innerText = "¡GRABANDO!";
                countdownOverlay.classList.add('text-danger');
                
                // Iniciar grabación de 5 segundos
                startRecording(stream, (blob) => {
                    // Al terminar, mostrar preview
                    cameraPreview.classList.add('d-none');
                    recordedPreview.classList.remove('d-none');
                    recordedPreview.src = getBlobURL();
                    
                    recordControls.classList.add('d-none');
                    previewControls.classList.remove('d-none');
                    btnSwitchCamera.classList.add('d-none');
                });

                setTimeout(() => {
                    stopRecording();
                    countdownOverlay.classList.add('d-none');
                    countdownOverlay.classList.remove('text-danger');
                    btnRecord.disabled = false;
                }, 5200); // 200ms extra para compensar la latencia de la cámara
            }
        }, 1000);
    });

    // Botón: Eliminar
    btnDelete.addEventListener('click', () => {
        recordedPreview.src = "";
        recordedPreview.classList.add('d-none');
        cameraPreview.classList.remove('d-none');
        
        previewControls.classList.add('d-none');
        recordControls.classList.remove('d-none');
        btnSwitchCamera.classList.remove('d-none');
    });

    // Botón: Descargar
    btnDownload.addEventListener('click', () => {
        const url = getBlobURL();
        if (!url) return;

        const filename = generateFilename(inputPersona.value, inputSena.value, inputNumero.value);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Incrementar número automáticamente solo tras descargar
        let nextNum = parseInt(inputNumero.value) + 1;
        inputNumero.value = nextNum;
        updateState();

        // Volver a la cámara para la siguiente toma
        btnDelete.click(); 
    });

    // Botón: Nueva Seña
    btnNewSign.addEventListener('click', () => {
        inputSena.value = "";
        inputNumero.value = 1;
        updateState();
        btnDelete.click(); // Resetea la vista
        inputSena.focus();
    });

    // Botón: Persona Nueva
    btnNewPerson.addEventListener('click', () => {
        inputPersona.value = "";
        inputSena.value = "";
        inputNumero.value = 1;
        updateState();
        btnDelete.click(); // Resetea la vista
        inputPersona.focus();
    });
});