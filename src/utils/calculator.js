/**
 * Normaliza y mapea la sucursal del Excel de entrada a los nombres de las pestañas de salida.
 * @param {string} sucursalRaw
 * @returns {string}
 */
export function determineSucursal(sucursalRaw) {
  if (!sucursalRaw) return 'SM COSTAZUL'; // Default fallback
  const normalized = sucursalRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes('sigo') || normalized.includes('bodegon') || normalized.includes('bod')) {
    return 'BODEGÓN COSTAZUL';
  } else if (normalized.includes('happy shack') && (normalized.includes('ii') || normalized.includes('2'))) {
    return 'HAPPY SHACK II';
  } else if (normalized.includes('happy shack')) {
    return 'HAPPY SHACK';
  } else if (normalized.includes('supermarket') || normalized.includes('sm') || normalized.includes('costazul')) {
    return 'SM COSTAZUL';
  }

  return 'SM COSTAZUL'; // Default fallback
}

/**
 * Mapea las abreviaturas de meses en español/inglés a su índice (0-11).
 */
const MONTH_MAP = {
  ene: 0, jan: 0,
  feb: 1,
  mar: 2,
  abr: 3, apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7, aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11, dec: 11
};

/**
 * Normaliza texto (minúsculas, sin tildes, sin espacios repetidos, sin punto final)
 * para comparar de forma estable nombres de columna y conceptos de asistencia.
 * @param {any} v
 * @returns {string}
 */
function normalizeText(v) {
  if (v === undefined || v === null) return '';
  return String(v)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '');
}

/**
 * Parsea una celda de fecha del encabezado del Excel.
 * Soporta objetos Date nativos, números seriales de Excel y cadenas de texto como "1 Jun", "16-Jun".
 * @param {any} cell
 * @param {number} year
 * @returns {Date|null}
 */
export function parseHeaderDate(cell, year, defaultMonthIdx = null) {
  if (cell === undefined || cell === null || cell === '') return null;

  // 1. Si ya es un objeto Date
  if (cell instanceof Date) {
    // Ajustamos las horas para posicionar la fecha al mediodía local.
    // Esto evita que diferencias de zona horaria (UTC vs Local) desplacen el día al anterior o siguiente.
    const d = new Date(cell.getTime());
    if (d.getHours() < 6) {
      d.setHours(12);
    } else if (d.getHours() > 18) {
      d.setHours(12);
      d.setDate(d.getDate() + 1);
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // 2. Si es un número
  if (typeof cell === 'number') {
    // Si es un número simple <= 31, asumimos que es el día del mes seleccionado
    if (cell <= 31) {
      if (defaultMonthIdx !== null) {
        return new Date(year, defaultMonthIdx, cell);
      }
      return null;
    }

    // Si es un número serial de Excel (ej: 46174 para Jun 1, 2026)
    const date = new Date((cell - 25569) * 86400 * 1000);
    // Ajustar por zona horaria local para evitar descalces de día
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + tzOffset);
  }

  // 3. Si es un String
  if (typeof cell === 'string') {
    const trimmed = cell.trim();
    if (trimmed === '') return null;

    // Excluir nombres de días de la semana (LUN, MAR, MON, TUE, etc.) para evitar falsos positivos en Date.parse
    const cleanLower = normalizeText(trimmed);
    const weekDays = [
      'lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom',
      'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
      'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ];
    if (weekDays.includes(cleanLower)) {
      return null;
    }

    // A. Si es solo un número simple (ej: "16")
    const dayOnly = parseInt(trimmed, 10);
    if (!isNaN(dayOnly) && String(dayOnly) === trimmed && dayOnly <= 31) {
      if (defaultMonthIdx !== null) {
        return new Date(year, defaultMonthIdx, dayOnly);
      }
      return null;
    }

    // B. Soporte para formatos DD/MM/YYYY, DD-MM-YYYY, DD/MM, DD-MM y con meses en palabras (ej. DD/MMM/YYYY o DD/MMM)
    const parts = trimmed.split(/[\/\-]/);
    if (parts.length >= 2) {
      const day = parseInt(parts[0], 10);
      const mPart = parts[1].trim();
      const monthVal = parseInt(mPart, 10);
      let monthIdx = -1;

      if (!isNaN(monthVal)) {
        monthIdx = monthVal - 1;
      } else {
        // Si el mes está escrito como palabra (ej: "jun", "junio")
        const monthStr = mPart.toLowerCase().slice(0, 3);
        monthIdx = MONTH_MAP[monthStr];
      }

      if (!isNaN(day) && monthIdx !== undefined && monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
        let parsedYear = year;
        if (parts.length === 3) {
          let yr = parts[2].trim();
          if (yr.length === 2) {
            parsedYear = 2000 + parseInt(yr, 10);
          } else if (yr.length === 4) {
            parsedYear = parseInt(yr, 10);
          }
        }
        return new Date(parsedYear, monthIdx, day);
      }
    }

    // C. Si es formato texto: "16 de junio", "16 jun", "01-jun"
    const clean = trimmed.toLowerCase().replace(/-/g, ' ');
    const match = clean.match(/^(\d+)\s*(?:de\s+)?([a-zñ]{3,4})/);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthStr = match[2].slice(0, 3);
      const monthIdx = MONTH_MAP[monthStr];
      if (monthIdx !== undefined) {
        return new Date(year, monthIdx, day);
      }
    }

    // D. Probar parsear directo con Date.parse (como último recurso)
    const parsedTime = Date.parse(`${trimmed} ${year}`);
    if (!isNaN(parsedTime)) {
      return new Date(parsedTime);
    }
  }

  return null;
}

/**
 * Formatea una fecha como "DD MM YYYY" en texto.
 * @param {Date} date
 * @returns {string}
 */
export function formatDateString(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Determina si un estatus diario indica que el empleado trabajó (uso genérico externo).
 * La lógica interna de processIncidencias usa CONCEPT_RULES en su lugar.
 * @param {string} status
 * @returns {boolean}
 */
export function isWorkedStatus(status) {
  const norm = normalizeText(status);
  if (!norm) return false;
  for (const rules of Object.values(CONCEPT_RULES)) {
    if (rules[norm] && !rules[norm].ausencia) return true;
  }
  return false;
}

/**
 * Retorna la fecha local formateada como YYYY-MM-DD para evitar desfases de zona horaria.
 * @param {Date} date
 * @returns {string}
 */
export function getLocalISODate(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Posiciones de columna fijas del layout vigente (confirmado sobre consolidado_incidencias_1Qjulio.xlsx):
// CEDULA | COD MELÉ | NOMBRES Y APELLIDOS | CARGO | DEPARTAMENTO | SUCURSAL | TURNO | DIAS LIBRES | <fechas...>
const COL = {
  CEDULA: 0,
  CODIGO: 1,
  NOMBRE: 2,
  CARGO: 3,
  DEPARTAMENTO: 4,
  SUCURSAL: 5,
  TURNO: 6,
  DIAS_LIBRES: 7
};

// Conceptos que nunca generan incidencia (no cuentan para nada), iguales en todas las sucursales.
const SKIP_CONCEPTS = new Set(['permiso', 'reposo', 'formaciones', 'dia libre', 'vacaciones']);

// Reglas de bono nocturno / domingo-feriado / ausencia por sucursal y concepto (texto normalizado).
// bono: valor fijo de bono nocturno.
// bonoWeekday/bonoSunday: valor de bono nocturno distinto si el día cae domingo.
// domingoFeriado: true => genera además incidencia DOMINGO (si aplica) y FERIADO (si la fecha está en feriadosList).
// ausencia: nombre del tipo de incidencia de ausencia (valor fijo 1, no genera bono ni domingo/feriado).
const CONCEPT_RULES = {
  'SM COSTAZUL': {
    'presente apertura a tiempo': { bono: 0, domingoFeriado: true },
    'presente cierre a tiempo': { bono: 3, domingoFeriado: true },
    'presente cierre': { bono: 3, domingoFeriado: true },
    'presente a tiempo': { bono: 2, domingoFeriado: true },
    'asistio': { bono: 2, domingoFeriado: true },
    'redoble': { bono: 3, domingoFeriado: true },
    'redoble especial': { bono: 3, domingoFeriado: true },
    'ausencia injustificada': { ausencia: 'AUSENCIA INJUSTIFICADA' },
    'falta injustificada': { ausencia: 'AUSENCIA INJUSTIFICADA' },
    'ausencia justificada': { ausencia: 'AUSENCIA JUSTIFICADA' },
    'falta justificada': { ausencia: 'AUSENCIA JUSTIFICADA' }
  },
  'BODEGÓN COSTAZUL': {
    'presente a tiempo': { bonoWeekday: 2, bonoSunday: 1, domingoFeriado: true },
    'presente cierre a tiempo': { bonoWeekday: 2, bonoSunday: 1, domingoFeriado: true },
    'asistio': { bono: 2, domingoFeriado: true },
    'ausencia injustificada': { ausencia: 'AUSENCIA INJUSTIFICADA' },
    'falta injustificada': { ausencia: 'AUSENCIA INJUSTIFICADA' },
    'ausencia justificada': { ausencia: 'AUSENCIA JUSTIFICADA' },
    'falta justificada': { ausencia: 'AUSENCIA JUSTIFICADA' }
  },
  'HAPPY SHACK': {
    'presente apertura a tiempo': { bono: 0, domingoFeriado: true },
    'presente cierre a tiempo': { bono: 3, domingoFeriado: true },
    '1 hora extra': { bono: 2, domingoFeriado: true },
    '2 hora extra': { bono: 3, domingoFeriado: true },
    'redoble': { bono: 3, domingoFeriado: true },
    'ausencia injustificada': { ausencia: 'AUSENCIA INJUSTIFICADA' },
    'falta injustificada': { ausencia: 'AUSENCIA INJUSTIFICADA' },
    'ausencia justificada': { ausencia: 'AUSENCIA JUSTIFICADA' },
    'falta justificada': { ausencia: 'AUSENCIA JUSTIFICADA' }
  },
  'HAPPY SHACK II': {
    'presente apertura a tiempo': { bono: 0, domingoFeriado: true },
    'presente cierre a tiempo': { bono: 3, domingoFeriado: true },
    '1 hora extra': { bono: 2, domingoFeriado: true },
    '2 hora extra': { bono: 3, domingoFeriado: true },
    'redoble': { bono: 3, domingoFeriado: true },
    'ausencia injustificada': { ausencia: 'AUSENCIA INJUSTIFICADA' },
    'falta injustificada': { ausencia: 'AUSENCIA INJUSTIFICADA' },
    'ausencia justificada': { ausencia: 'AUSENCIA JUSTIFICADA' },
    'falta justificada': { ausencia: 'AUSENCIA JUSTIFICADA' }
  }
};

/**
 * Procesa la matriz de datos crudos de Excel y calcula las incidencias de cada colaborador.
 *
 * @param {Array<Array<any>>} rawRows - Filas del Excel leídas como arreglo de arreglos.
 * @param {number} year - Año de procesamiento seleccionado por el usuario.
 * @param {number|null|Array<string>} monthIdx - Índice del mes (0-11) o lista de feriados (firma anterior).
 * @param {number|null} quincena - 1 para la primera quincena (1-15), 2 para la segunda (16-fin).
 * @param {Array<string>} feriadosList - Lista de fechas feriados en formato 'YYYY-MM-DD'.
 * @returns {Object} Un objeto con llaves para cada sucursal de destino y un arreglo de incidencias.
 */
export function processIncidencias(rawRows, year, monthIdx = null, quincena = null, feriadosList = []) {
  // Manejo de compatibilidad con la firma anterior de la función
  if (Array.isArray(monthIdx)) {
    feriadosList = monthIdx;
    monthIdx = null;
    quincena = null;
  } else if (Array.isArray(quincena)) {
    feriadosList = quincena;
    quincena = null;
  }

  console.log('=== DEBUG PROCESAR INCIDENCIAS ===');
  console.log('Año UI:', year, 'Mes UI (0-11):', monthIdx, 'Quincena UI:', quincena);
  console.log('Feriados registrados:', feriadosList);

  const result = {
    'SM COSTAZUL': [],
    'BODEGÓN COSTAZUL': [],
    'HAPPY SHACK': [],
    'HAPPY SHACK II': []
  };

  if (!rawRows || rawRows.length === 0) {
    console.warn('El archivo de entrada está vacío.');
    return result;
  }

  // 1. Localizar la fila de cabecera buscando "COD MEL" (con o sin punto/tilde) en cualquiera
  //    de las primeras columnas, ya que su posición exacta puede variar entre archivos.
  let headerRowIdx = -1;
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row) continue;
    for (let c = 0; c < Math.min(row.length, 12); c++) {
      const norm = normalizeText(row[c]);
      if (norm.includes('cod mel') || norm === 'codigo') {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx !== -1) break;
  }

  if (headerRowIdx === -1) {
    console.error('Cabecera "COD MELÉ" no encontrada en ninguna fila.');
    throw new Error('No se encontró la cabecera "COD MELÉ" en el archivo.');
  }

  console.log('Fila cabecera encontrada en índice:', headerRowIdx);
  const headerRow = rawRows[headerRowIdx];

  // 2. Localizar el inicio de las columnas de fecha: primera columna después de "DIAS LIBRES".
  let dateStartCol = COL.DIAS_LIBRES + 1;
  for (let c = 0; c < headerRow.length; c++) {
    if (normalizeText(headerRow[c]).includes('dias libres')) {
      dateStartCol = c + 1;
      break;
    }
  }

  // 3. Determinar la fila que realmente contiene las fechas (normalmente la misma fila de cabecera).
  let dateRow = null;
  let dateRowIdx = -1;
  const candidateRowIndices = [headerRowIdx, headerRowIdx + 1, headerRowIdx - 1];
  for (const idx of candidateRowIndices) {
    if (idx >= 0 && idx < rawRows.length) {
      const row = rawRows[idx];
      const cellVal = row[dateStartCol];
      if (cellVal !== undefined && cellVal !== null && cellVal !== '') {
        const parsed = parseHeaderDate(cellVal, year, monthIdx);
        if (parsed) {
          dateRow = row;
          dateRowIdx = idx;
          break;
        }
      }
    }
  }
  if (!dateRow) {
    console.warn('No se detectó fila de fecha automáticamente. Usando la fila de cabecera.');
    dateRow = headerRow;
    dateRowIdx = headerRowIdx;
  }
  console.log('Fila de fechas detectada en índice:', dateRowIdx, '| Columna de inicio de fechas:', dateStartCol);

  // 4. Extraer las fechas válidas de las columnas de asistencia, filtradas por el corte quincenal.
  const columnDates = [];
  let startDay = null;
  let endDay = null;
  if (monthIdx !== null && quincena !== null) {
    if (quincena === 1) {
      startDay = 1;
      endDay = 15;
    } else if (quincena === 2) {
      startDay = 16;
      endDay = new Date(year, monthIdx + 1, 0).getDate();
    }
  }

  for (let col = dateStartCol; col < dateRow.length; col++) {
    const dateCell = dateRow[col];
    if (dateCell === undefined || dateCell === '') continue;
    const parsedDate = parseHeaderDate(dateCell, year, monthIdx);
    if (!parsedDate) continue;

    if (monthIdx !== null && quincena !== null) {
      const yearMatches = parsedDate.getFullYear() === year;
      const monthMatches = parsedDate.getMonth() === monthIdx;
      const dayMatches = parsedDate.getDate() >= startDay && parsedDate.getDate() <= endDay;
      if (!yearMatches || !monthMatches || !dayMatches) continue;
    }

    columnDates.push({ colIdx: col, date: parsedDate });
  }

  console.log('Total columnas de fecha válidas que pasaron filtros:', columnDates.length);

  const feriadosSet = new Set(feriadosList);
  const unrecognizedConcepts = new Set();

  // 5. Recorrer cada fila de empleado una sola vez y, dentro de ella, cada columna de fecha.
  for (let r = Math.max(headerRowIdx, dateRowIdx) + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row) continue;

    const employeeCode = String(row[COL.CODIGO] || '').trim();
    if (!employeeCode) continue; // Fila vacía o sin código

    const rawSucursal = String(row[COL.SUCURSAL] || '').trim();
    const mappedSucursal = determineSucursal(rawSucursal);
    if (!result[mappedSucursal]) continue; // Sucursal desconocida, seguridad extra

    const cedula = String(row[COL.CEDULA] || '').trim();
    const employeeName = String(row[COL.NOMBRE] || '').trim();
    const cargo = String(row[COL.CARGO] || '').trim();
    const rules = CONCEPT_RULES[mappedSucursal];

    for (const colDate of columnDates) {
      const cellValue = String(row[colDate.colIdx] || '').trim();
      if (!cellValue) continue;

      const norm = normalizeText(cellValue);
      if (!norm || SKIP_CONCEPTS.has(norm)) continue;

      const rule = rules[norm];
      if (!rule) {
        unrecognizedConcepts.add(`${mappedSucursal} :: "${cellValue}"`);
        continue;
      }

      const formattedDate = formatDateString(colDate.date);
      const isoDateString = getLocalISODate(colDate.date);
      const isSunday = colDate.date.getDay() === 0;
      const dailyIncidences = [];

      if (rule.ausencia) {
        dailyIncidences.push({ type: rule.ausencia, value: 1 });
      } else {
        let bonoValue = 0;
        if (rule.bonoWeekday !== undefined) {
          bonoValue = isSunday ? rule.bonoSunday : rule.bonoWeekday;
        } else if (rule.bono !== undefined) {
          bonoValue = rule.bono;
        }
        if (bonoValue > 0) {
          dailyIncidences.push({ type: 'BONO NOCTURNO', value: bonoValue });
        }
        if (rule.domingoFeriado) {
          if (isSunday) dailyIncidences.push({ type: 'DOMINGO', value: 1 });
          if (feriadosSet.has(isoDateString)) dailyIncidences.push({ type: 'FERIADO', value: 1 });
        }
      }

      for (const inc of dailyIncidences) {
        result[mappedSucursal].push({
          employeeCode,
          employeeName,
          cedula,
          cargo,
          originalSucursal: rawSucursal,
          incidenceType: inc.type,
          value: inc.value,
          dateString: formattedDate,
          originalStatus: cellValue
        });
      }
    }
  }

  if (unrecognizedConcepts.size > 0) {
    console.warn('Conceptos no reconocidos (no generaron incidencia):', Array.from(unrecognizedConcepts));
  }

  return result;
}