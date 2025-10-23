const axios = require('axios');

// Configuración de SheetDB
const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/mv1wyv7au3gc0';
const SHEET_NAME = 'Equipos';

/**
 * Guarda un registro en SheetDB
 * @param {Object} data - Datos a guardar
 * @returns {Promise<Object>} - Respuesta de la API
 */
async function saveToSheet(data) {
  try {
    console.log('Guardando datos en SheetDB...');

    const response = await axios.post(
      `${SHEETDB_API_URL}?sheet=${SHEET_NAME}`,
      { data: [data] },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✓ Datos guardados correctamente');
    return response.data;

  } catch (error) {
    console.error('✗ Error guardando en SheetDB:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    throw error;
  }
}

/**
 * Guarda múltiples registros en SheetDB
 * @param {Object[]} dataArray - Array de datos a guardar
 * @returns {Promise<Object>} - Respuesta de la API
 */
async function saveMultipleToSheet(dataArray) {
  try {
    console.log(`Guardando ${dataArray.length} registros en SheetDB...`);

    const response = await axios.post(
      `${SHEETDB_API_URL}?sheet=${SHEET_NAME}`,
      { data: dataArray },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✓ ${dataArray.length} registros guardados correctamente`);
    return response.data;

  } catch (error) {
    console.error('✗ Error guardando múltiples registros en SheetDB:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    throw error;
  }
}

/**
 * Obtiene todos los datos de la hoja
 * @returns {Promise<Object[]>} - Datos de la hoja
 */
async function getAllData() {
  try {
    console.log('Obteniendo datos de SheetDB...');

    const response = await axios.get(
      `${SHEETDB_API_URL}?sheet=${SHEET_NAME}`
    );

    console.log(`✓ ${response.data.length} registros obtenidos`);
    return response.data;

  } catch (error) {
    console.error('✗ Error obteniendo datos de SheetDB:', error.message);
    throw error;
  }
}

/**
 * Elimina todos los datos de la hoja (usar con precaución)
 * @returns {Promise<Object>} - Respuesta de la API
 */
async function clearSheet() {
  try {
    console.log('Limpiando datos de SheetDB...');

    const response = await axios.delete(
      `${SHEETDB_API_URL}/all?sheet=${SHEET_NAME}`
    );

    console.log('✓ Datos eliminados correctamente');
    return response.data;

  } catch (error) {
    console.error('✗ Error eliminando datos de SheetDB:', error.message);
    throw error;
  }
}

module.exports = {
  saveToSheet,
  saveMultipleToSheet,
  getAllData,
  clearSheet
};
