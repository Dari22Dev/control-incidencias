import { processIncidencias } from './src/utils/calculator.js';

// Datos de prueba simulando el Excel (Anonimizados para producción)
const mockRawRows = [
  // Fila 0: Nombres de los días
  ['COD. MELE', 'CÉDULA', 'APELLIDOS Y NOMBRES', 'SUCURSAL', 'CARGO', 'LUN', 'MAR', 'MIÉ', 'DOM', 'LUN'],
  // Fila 1: Fechas
  ['', '', '', '', '', '1 Jun', '2 Jun', '3 Jun', '7 Jun', '8 Jun'],
  // Fila 2: Empleado SM Costazul
  ['1001', '11111111', 'COLABORADOR UNO', 'Supermarket Costazul', 'ASESOR', 'Presente apertura a tiempo', 'Presente cierre a tiempo', 'Día libre', 'Presente apertura a tiempo', 'Reposo'],
  // Fila 3: Empleado Bodegón Costazul
  ['1002', '22222222', 'COLABORADOR DOS', 'Bodegón Costazul', 'ASESOR', 'Presente a tiempo', 'Presente cierre a tiempo', 'Día libre', 'Día libre', 'Día libre'],
  // Fila 4: Empleado Happy Shack
  ['1003', '33333333', 'COLABORADOR TRES', 'Happy Shack', 'ASESOR', 'Presente cierre a tiempo', '1 Hora Extra', '2 Hora Extra', 'Presente apertura a tiempo', 'Ausencia Injustificada'],
  // Fila 5: Empleado Happy Shack II con Redoble
  ['1004', '44444444', 'COLABORADOR CUATRO', 'Happy Shack II', 'SUPERVISOR', 'Redoble', 'Redoble Especial', 'Ausencia Justificada', 'Día libre', 'Día libre'],
  // Fila 6: Empleado Sigo + 2 Costazul (Debe mapear a Bodegón Costazul)
  ['1005', '55555555', 'COLABORADOR CINCO', 'Sigo + 2 Costazul', 'ASESOR', 'Asistió Especial', 'Presente a tiempo', 'Día libre', 'Reposo', 'Permiso']
];

const feriados = ['2026-06-03']; // 3 Jun es Feriado
const year = 2026;

console.log('--- INICIANDO PRUEBAS DE CÁLCULO DE INCIDENCIAS ---');

try {
  // Pruebas de compatibilidad con firma anterior
  const resultCompat = processIncidencias(mockRawRows, year, feriados);
  let compatCount = 0;
  Object.keys(resultCompat).forEach(s => compatCount += resultCompat[s].length);
  if (compatCount > 0) {
    console.log(`✅ OK: Firma compatible retornó ${compatCount} registros en total.`);
  } else {
    console.error('❌ FAIL: Firma compatible no retornó registros.');
  }

  // Pruebas específicas de quincenas (Q1 de Junio)
  const result = processIncidencias(mockRawRows, year, 5, 1, feriados);
  
  // Pruebas específicas de quincenas (Q2 de Junio - no debería retornar nada)
  const resultQ2 = processIncidencias(mockRawRows, year, 5, 2, feriados);
  let q2Count = 0;
  Object.keys(resultQ2).forEach(s => q2Count += resultQ2[s].length);
  if (q2Count === 0) {
    console.log('✅ OK: Segunda Quincena (Q2) de Junio no retornó registros (las fechas mock son de Q1).');
  } else {
    console.error('❌ FAIL: Segunda Quincena de Junio retornó registros erróneos:', q2Count);
  }
  
  // Imprimir resumen para verificar
  console.log('\n--- RESULTADOS POR SUCURSAL (Q1) ---');
  Object.keys(result).forEach(sucursal => {
    console.log(`\nSucursal: ${sucursal} (Total registros: ${result[sucursal].length})`);
    result[sucursal].forEach(item => {
      console.log(` - Empleado: ${item.employeeCode} (${item.employeeName}) | Incidencia: ${item.incidenceType} | Valor: ${item.value} | Fecha: ${item.dateString} | Estatus: [${item.originalStatus}]`);
    });
  });

  // Validaciones
  console.log('\n--- VERIFICANDO ASERTOS DE Q1 ---');

  // 1. SM Costazul - 1001
  const smList = result['SM COSTAZUL'];
  // Cierre a tiempo el 2 Jun -> bono nocturno = 3
  const smBono = smList.find(i => i.employeeCode === '1001' && i.dateString === '02 06 2026' && i.incidenceType === 'BONO NOCTURNO');
  if (smBono && smBono.value === 3) {
    console.log('✅ OK: SM Costazul - Presente cierre a tiempo calculó Bono Nocturno 3');
  } else {
    console.error('❌ FAIL: SM Costazul - Bono Nocturno para 1001 el 02 06 2026 no es 3', smBono);
  }

  // Domingo 7 Jun trabajado -> domingo = 1
  const smDomingo = smList.find(i => i.employeeCode === '1001' && i.dateString === '07 06 2026' && i.incidenceType === 'DOMINGO');
  if (smDomingo && smDomingo.value === 1) {
    console.log('✅ OK: SM Costazul - Domingo trabajado el 07 06 2026 calculó Domingo 1');
  } else {
    console.error('❌ FAIL: SM Costazul - Domingo para 1001 no se calculó', smDomingo);
  }

  // 2. Bodegón Costazul - 1002
  const bodList = result['BODEGÓN COSTAZUL'];
  // Presente a tiempo 1 Jun -> bono nocturno = 2
  const bodBono1 = bodList.find(i => i.employeeCode === '1002' && i.dateString === '01 06 2026' && i.incidenceType === 'BONO NOCTURNO');
  // Presente cierre a tiempo 2 Jun -> bono nocturno = 2
  const bodBono2 = bodList.find(i => i.employeeCode === '1002' && i.dateString === '02 06 2026' && i.incidenceType === 'BONO NOCTURNO');
  if (bodBono1 && bodBono1.value === 2 && bodBono2 && bodBono2.value === 2) {
    console.log('✅ OK: Bodegón Costazul - Ambos turnos calcularon Bono Nocturno 2');
  } else {
    console.error('❌ FAIL: Bodegón Costazul - Bono Nocturno incorrecto', { bodBono1, bodBono2 });
  }

  // 3. Happy Shack - 1003
  const hsList = result['HAPPY SHACK'];
  // Cierre a tiempo 1 Jun -> 3
  const hsBono1 = hsList.find(i => i.employeeCode === '1003' && i.dateString === '01 06 2026' && i.incidenceType === 'BONO NOCTURNO');
  // 1 Hora Extra 2 Jun -> 2
  const hsBono2 = hsList.find(i => i.employeeCode === '1003' && i.dateString === '02 06 2026' && i.incidenceType === 'BONO NOCTURNO');
  // 2 Hora Extra 3 Jun -> 3
  const hsBono3 = hsList.find(i => i.employeeCode === '1003' && i.dateString === '03 06 2026' && i.incidenceType === 'BONO NOCTURNO');
  if (hsBono1?.value === 3 && hsBono2?.value === 2 && hsBono3?.value === 3) {
    console.log('✅ OK: Happy Shack - Bono Nocturno de 1/2 Hora Extra y cierre calculó correctamente (3, 2, 3)');
  } else {
    console.error('❌ FAIL: Happy Shack - Bono Nocturno incorrecto', { hsBono1, hsBono2, hsBono3 });
  }

  // Feriado trabajado 3 Jun -> feriado = 1 (trabajó 2 Hora Extra, que es activo)
  const hsFeriado = hsList.find(i => i.employeeCode === '1003' && i.dateString === '03 06 2026' && i.incidenceType === 'FERIADO');
  if (hsFeriado && hsFeriado.value === 1) {
    console.log('✅ OK: Happy Shack - Feriado trabajado el 03 06 2026 calculó Feriado 1');
  } else {
    console.error('❌ FAIL: Happy Shack - Feriado para 1003 no se calculó', hsFeriado);
  }

  // Ausencia Injustificada 8 Jun -> 1
  const hsAusencia = hsList.find(i => i.employeeCode === '1003' && i.dateString === '08 06 2026' && i.incidenceType === 'AUSENCIA INJUSTIFICADA');
  if (hsAusencia && hsAusencia.value === 1) {
    console.log('✅ OK: Happy Shack - Ausencia Injustificada el 08 06 2026 calculó correctamente');
  } else {
    console.error('❌ FAIL: Happy Shack - Ausencia Injustificada no se calculó', hsAusencia);
  }

  // 4. Happy Shack II - 1004
  const hs2List = result['HAPPY SHACK II'];
  // Redoble 1 Jun -> 3
  const hs2Bono1 = hs2List.find(i => i.employeeCode === '1004' && i.dateString === '01 06 2026' && i.incidenceType === 'BONO NOCTURNO');
  // Redoble Especial 2 Jun -> 3
  const hs2Bono2 = hs2List.find(i => i.employeeCode === '1004' && i.dateString === '02 06 2026' && i.incidenceType === 'BONO NOCTURNO');
  if (hs2Bono1?.value === 3 && hs2Bono2?.value === 3) {
    console.log('✅ OK: Happy Shack II - Redobles calcularon Bono Nocturno 3');
  } else {
    console.error('❌ FAIL: Happy Shack II - Redobles incorrectos', { hs2Bono1, hs2Bono2 });
  }

  // Ausencia Justificada 3 Jun -> 1
  const hs2Ausencia = hs2List.find(i => i.employeeCode === '1004' && i.dateString === '03 06 2026' && i.incidenceType === 'AUSENCIA JUSTIFICADA');
  if (hs2Ausencia && hs2Ausencia.value === 1) {
    console.log('✅ OK: Happy Shack II - Ausencia Justificada el 03 06 2026 calculó correctamente');
  } else {
    console.error('❌ FAIL: Happy Shack II - Ausencia Justificada no se calculó', hs2Ausencia);
  }

  // 5. Sigo + 2 Costazul / Bodegón Costazul - 1005
  const bodListExtended = result['BODEGÓN COSTAZUL'];
  
  // Asistió Especial el 1 Jun -> Bono Nocturno = 3 (Regla General)
  const sigoBono1 = bodListExtended.find(i => i.employeeCode === '1005' && i.dateString === '01 06 2026' && i.incidenceType === 'BONO NOCTURNO');
  if (sigoBono1 && sigoBono1.value === 3) {
    console.log('✅ OK: Sigo+2 (Bodegón) - Asistió Especial calculó Bono Nocturno 3');
  } else {
    console.error('❌ FAIL: Sigo+2 - Asistió Especial no calculó Bono Nocturno 3', sigoBono1);
  }

  // Presente a tiempo el 2 Jun -> Bono Nocturno = 2 (Regla de Bodegón)
  const sigoBono2 = bodListExtended.find(i => i.employeeCode === '1005' && i.dateString === '02 06 2026' && i.incidenceType === 'BONO NOCTURNO');
  if (sigoBono2 && sigoBono2.value === 2) {
    console.log('✅ OK: Sigo+2 (Bodegón) - Presente a tiempo calculó Bono Nocturno 2');
  } else {
    console.error('❌ FAIL: Sigo+2 - Presente a tiempo no calculó Bono Nocturno 2', sigoBono2);
  }

  // Reposo el 7 Jun (DOMINGO) -> NO calcula domingo (es reposo)
  const sigoDomingo = bodListExtended.find(i => i.employeeCode === '1005' && i.dateString === '07 06 2026' && i.incidenceType === 'DOMINGO');
  if (!sigoDomingo) {
    console.log('✅ OK: Sigo+2 (Bodegón) - Reposo en domingo no computó incidencia');
  } else {
    console.error('❌ FAIL: Sigo+2 - Reposo en domingo computó incidencia incorrecta:', sigoDomingo);
  }

  // Permiso el 8 Jun -> NO calcula nada
  const sigoPermiso = bodListExtended.filter(i => i.employeeCode === '1005' && i.dateString === '08 06 2026');
  if (sigoPermiso.length === 0) {
    console.log('✅ OK: Sigo+2 (Bodegón) - Permiso no computó ninguna incidencia');
  } else {
    console.error('❌ FAIL: Sigo+2 - Permiso computó incidencias incorrectas:', sigoPermiso);
  }

  console.log('\n--- PRUEBAS FINALIZADAS CON ÉXITO ---');

} catch (err) {
  console.error('❌ FALLÓ EL PROCESAMIENTO GENERAL DE PRUEBA:', err);
}
