const padNumber = (num) => {
    return Math.max(1, parseInt(num) || 1).toString().padStart(3, '0');
};

const formatText = (text) => {
    return text.trim().toLowerCase().replace(/\s+/g, '-');
};

const generateFilename = (persona, sena, numero, duracion) => {
    return `${formatText(persona)}_${formatText(sena)}_${padNumber(numero)}-${duracion}s.webm`;
};

const validateInputs = (persona, sena, numero) => {
    if (!persona.trim()) return "El campo 'Persona' es obligatorio.";
    if (!sena.trim()) return "El campo 'Seña' es obligatorio.";
    if (numero < 1) return "El número debe ser mayor o igual a 1.";
    return null;
};

const saveState = (persona, sena, numero, duracion) => {
    const state = { persona, sena, numero, duracion };
    localStorage.setItem('datasetRecorderState', JSON.stringify(state));
};

const restoreState = () => {
    const saved = localStorage.getItem('datasetRecorderState');
    return saved ? JSON.parse(saved) : { persona: '', sena: '', numero: 1, duracion: 5 };
};