/**
 * Normaliza y mapea la sucursal del Excel de entrada a los nombres de las pestañas de salida.
 * @param {string} sucursalRaw 
 * @returns {string}
 */
export function determineSucursal(sucursalRaw) {
  if (!sucursalRaw) return 'SM COSTAZUL'; // Default fallback
  const normalized = sucursalRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (normalized.includes('sigo+2') || normalized.includes('sigo + 2') || normalized.includes('bodegon') || normalized.includes('bod')) {
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
    // Si ya es un objeto Date, ajustamos las horas para posicionar la fecha al mediodía local.
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
    const cleanLower = trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
 * Determina si un estatus diario indica que el empleado trabajó.
 * @param {string} status 
 * @returns {boolean}
 */
export function isWorkedStatus(status) {
  if (!status) return false;
  const clean = status.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const workedStatuses = [
    'presente a tiempo',
    'presente cierre a tiempo',
    'presente apertura a tiempo',
    'redoble',
    'redoble especial',
    'asistio especial',
    '1 hora extra',
    '2 hora extra'
  ];
  
  return workedStatuses.some(ws => {
    const cleanWs = ws.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return clean.includes(cleanWs);
  });
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

  // LOG DEPURACIÓN INICIAL
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

  // 1. Encontrar la fila de cabecera principal (debe tener "COD. MELE" en la columna A)
  let headerRowIdx = -1;
  for (let i = 0; i < rawRows.length; i++) {
    const colA = String(rawRows[i][0] || '').trim().toUpperCase();
    if (colA.includes('COD. MELE') || colA.includes('CODIGO') || colA.includes('COD.')) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    console.error('Cabecera "COD. MELE" no encontrada en columna A en ninguna fila.');
    throw new Error('No se encontró la cabecera "COD. MELE" en la primera columna del archivo.');
  }

  console.log('Fila cabecera encontrada en índice:', headerRowIdx);
  const headerRow = rawRows[headerRowIdx];
  
  // 2. Determinar qué fila contiene las fechas (puede ser la cabecera misma, la fila superior o la inferior)
  let dateRow = null;
  let dateRowIdx = -1;

  const candidateRowIndices = [headerRowIdx, headerRowIdx + 1, headerRowIdx - 1];
  for (const idx of candidateRowIndices) {
    if (idx >= 0 && idx < rawRows.length) {
      const row = rawRows[idx];
      // Probar si el primer valor de fecha (columna F / índice 5) es parseable como fecha
      const cellVal = row[5];
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
    console.warn('No se detectó fila de fecha automáticamente. Usando fila inferior por defecto.');
    dateRowIdx = headerRowIdx + 1;
    if (dateRowIdx >= rawRows.length) {
      throw new Error('El archivo no contiene la fila de fechas debajo de la cabecera.');
    }
    dateRow = rawRows[dateRowIdx];
  }
  console.log('Fila de fechas detectada en índice:', dateRowIdx);

  // 2. Extraer las fechas de las columnas de asistencia (a partir de la columna F / índice 5) y filtrar por el corte quincenal
  const columnDates = [];
  
  // Límites del corte quincenal
  let startDay = null;
  let endDay = null;
  if (monthIdx !== null && quincena !== null) {
    if (quincena === 1) {
      startDay = 1;
      endDay = 15;
    } else if (quincena === 2) {
      startDay = 16;
      endDay = new Date(year, monthIdx + 1, 0).getDate(); // Último día del mes seleccionado
    }
  }
  console.log(`Límites de días calculados: ${startDay} al ${endDay}`);

  for (let col = 5; col < headerRow.length; col++) {
    const dateCell = dateRow[col];
    if (dateCell === undefined || dateCell === '') continue;
    const parsedDate = parseHeaderDate(dateCell, year, monthIdx);
    
    if (col < 25) {
      console.log(`Col ${col} | Celda original: ${JSON.stringify(dateCell)} | Tipo: ${typeof dateCell} | Parseado:`, parsedDate ? parsedDate.toDateString() : 'null');
    }

    if (!parsedDate) continue;

    // Si se especificó el corte (mes y quincena), verificar que la fecha caiga en dicho rango
    if (monthIdx !== null && quincena !== null) {
      const parsedYear = parsedDate.getFullYear();
      const parsedMonth = parsedDate.getMonth();
      const parsedDay = parsedDate.getDate();

      const yearMatches = parsedYear === year;
      const monthMatches = parsedMonth === monthIdx;
      const dayMatches = parsedDay >= startDay && parsedDay <= endDay;

      if (!yearMatches || !monthMatches || !dayMatches) {
        if (col < 25) {
          console.log(`  -> Col ${col} FILTRADA. Coincide Año: ${yearMatches} (${parsedYear} vs ${year}), Coincide Mes: ${monthMatches} (${parsedMonth} vs ${monthIdx}), Coincide Día: ${dayMatches} (${parsedDay})`);
        }
        continue; // Omitir columnas que no corresponden al corte
      }
    }

    columnDates.push({
      colIdx: col,
      date: parsedDate,
      originalText: dateCell
    });
  }

  console.log('Total columnas de fecha válidas que pasaron filtros:', columnDates.length);
  if (columnDates.length > 0) {
    console.log('Fechas seleccionadas:', columnDates.map(c => c.date.toDateString()));
  }

  // Set de feriados formateados como 'YYYY-MM-DD' para búsquedas rápidas
  const feriadosSet = new Set(feriadosList);
  const sucursalesOrder = ['SM COSTAZUL', 'BODEGÓN COSTAZUL', 'HAPPY SHACK', 'HAPPY SHACK II'];

  // 3. Procesar las filas agrupando por: Sucursal -> Día (Cronológico) -> Empleado
  sucursalesOrder.forEach(sucursalKey => {
    columnDates.forEach(colDate => {
      for (let r = Math.max(headerRowIdx, dateRowIdx) + 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row) continue;
        
        // Asegurar que la fila tiene al menos un código de empleado
        const employeeCode = String(row[0] || '').trim();
        if (!employeeCode || employeeCode === '') continue; // Fila vacía o sin código

        const rawSucursal = String(row[3] || '').trim();
        const mappedSucursal = determineSucursal(rawSucursal);
        
        // Filtrar por la sucursal actual del bucle
        if (mappedSucursal !== sucursalKey) continue;

        const cedula = String(row[1] || '').trim();
        const employeeName = String(row[2] || '').trim();
        const cargo = String(row[4] || '').trim();

        const cellValue = String(row[colDate.colIdx] || '').trim();
        const cleanValue = cellValue.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!cleanValue) continue; // Celda vacía

        const formattedDate = formatDateString(colDate.date);
        const isoDateString = getLocalISODate(colDate.date); // 'YYYY-MM-DD' en hora local

        // Array de incidencias encontradas para este empleado en esta fecha
        const dailyIncidences = [];

        // --- CÁLCULO DE BONO NOCTURNO ---
        let bonoValue = 0;
        
        // Regla General: Redobles y Asistió Especial siempre valen 3 de bono nocturno
        if (cleanValue.includes('redoble') || cleanValue.includes('asistio especial')) {
          bonoValue = 3;
        } else {
          switch (mappedSucursal) {
            case 'SM COSTAZUL':
              if (cleanValue.includes('presente cierre a tiempo')) {
                bonoValue = 3;
              }
              break;
            case 'BODEGÓN COSTAZUL':
              if (cleanValue.includes('presente cierre a tiempo') || cleanValue.includes('presente a tiempo')) {
                bonoValue = 2;
              }
              break;
            case 'HAPPY SHACK':
            case 'HAPPY SHACK II':
              if (cleanValue.includes('presente cierre a tiempo') || cleanValue.includes('2 hora extra')) {
                bonoValue = 3;
              } else if (cleanValue.includes('1 hora extra')) {
                bonoValue = 2;
              }
              break;
          }
        }

        if (bonoValue > 0) {
          dailyIncidences.push({
            type: 'BONO NOCTURNO',
            value: bonoValue
          });
        }

        // --- CÁLCULO DE DOMINGO ---
        const isSunday = colDate.date.getDay() === 0;
        if (isSunday && isWorkedStatus(cellValue)) {
          dailyIncidences.push({
            type: 'DOMINGO',
            value: 1
          });
        }

        // --- CÁLCULO DE FERIADO ---
        if (feriadosSet.has(isoDateString) && isWorkedStatus(cellValue)) {
          dailyIncidences.push({
            type: 'FERIADO',
            value: 1
          });
        }

        // --- CÁLCULO DE AUSENCIAS ---
        if (cleanValue.includes('ausencia injustificada') || cleanValue.includes('falta injustificada')) {
          dailyIncidences.push({
            type: 'AUSENCIA INJUSTIFICADA',
            value: 1
          });
        } else if (cleanValue.includes('ausencia justificada') || cleanValue.includes('falta justificada')) {
          dailyIncidences.push({
            type: 'AUSENCIA JUSTIFICADA',
            value: 1
          });
        }

        // Guardar las incidencias encontradas en la sucursal destino
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
    });
  });

  return result;
}
