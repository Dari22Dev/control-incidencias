const fs = require('fs');
const XLSX = require('xlsx');
const { processIncidencias } = require('../../../scratch/control-incidencias/src/utils/calculator.js');

try {
  const filePath = 'C:\\Users\\dariv\\Downloads\\CONSOLIDADO MENSUAL.xlsx';
  console.log('Cargando archivo:', filePath);
  
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  console.log('Hoja del Excel:', firstSheetName);
  
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  console.log('Total filas en la hoja:', jsonData.length);
  
  // Procesar para Junio (mesIdx = 5), 2da Quincena (2) de 2026
  const result = processIncidencias(jsonData, 2026, 5, 2, []);
  
  console.log('\n--- RESULTADOS DEL CÁLCULO ---');
  let totalIncidencias = 0;
  for (const [sucursal, list] of Object.entries(result)) {
    console.log(`Sucursal: ${sucursal} | Registros: ${list.length}`);
    totalIncidencias += list.length;
    if (list.length > 0) {
      console.log(' Muestra del primer registro:', list[0]);
    }
  }
  console.log('Total general de incidencias:', totalIncidencias);
  
} catch (err) {
  console.error('ERROR EN SIMULACIÓN:', err);
}
