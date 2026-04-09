/**
 * Archivo: utils.js
 * Descripción: Funciones auxiliares para formato de texto, validación de inputs, 
 * generación de nomenclatura estandarizada y persistencia local (caché).
 * Elaborado por: José Antonio Huerta Aguilar y Giovanni Ariel Rodriguez Bautista
 * Versión: 5.0
 * Última actualización: 9 de abril de 2026
 */

/**
 * Formatea el número de iteración agregando ceros a la izquierda (ej. 1 -> "001")
 */
const padNumber = (num) => {
    return Math.max(1, parseInt(num) || 1).toString().padStart(3, '0');
};

/**
 * Limpia y estandariza cadenas de texto para evitar problemas en sistemas de archivos.
 * Convierte a minúsculas y reemplaza espacios por guiones.
 */
const formatText = (text) => {
    return text.trim().toLowerCase().replace(/\s+/g, '-');
};

/**
 * Construye el nombre final del archivo webm siguiendo la convención requerida.
 */
const generateFilename = (persona, sena, numero, duracion) => {
    return `${formatText(persona)}_${formatText(sena)}_${padNumber(numero)}-${duracion}s.webm`;
};

/**
 * Valida la integridad de los metadatos antes de permitir la grabación.
 * Retorna un string con el error o null si pasa las pruebas.
 */
const validateInputs = (persona, sena, numero) => {
    if (!persona.trim()) return "El campo 'Persona' es obligatorio.";
    if (!sena.trim()) return "El campo 'Seña' es obligatorio.";
    if (numero < 1) return "El número debe ser mayor o igual a 1.";
    return null;
};

/**
 * Guarda el estado actual del formulario en localStorage para evitar 
 * pérdida de datos si el usuario recarga la página por accidente.
 */
const saveState = (persona, sena, numero, duracion) => {
    const state = { persona, sena, numero, duracion };
    localStorage.setItem('datasetRecorderState', JSON.stringify(state));
};

/**
 * Recupera el último estado guardado o inicializa valores por defecto.
 */
const restoreState = () => {
    const saved = localStorage.getItem('datasetRecorderState');
    return saved ? JSON.parse(saved) : { persona: '', sena: '', numero: 1, duracion: 5 };
};