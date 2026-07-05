import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx-js-style';
import {
  Upload,
  FileSpreadsheet,
  Trash2,
  Calendar,
  Download,
  Search,
  Plus,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Info
} from 'lucide-react';
import { processIncidencias } from './utils/calculator';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Componente Personalizado Dropdown Moderno con Efecto de Desenfoque y Vidrio
function CustomDropdown({ label, value, options, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="config-group" style={{ marginBottom: 0, position: 'relative' }} ref={dropdownRef}>
      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>{label}</label>
      
      {/* Trigger Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: disabled ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-glass)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          color: '#ffffff',
          fontFamily: 'inherit',
          fontSize: '0.9rem',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
          transition: 'all 0.3s'
        }}
        className={!disabled ? 'custom-dropdown-trigger' : ''}
      >
        <span>{selectedOption ? selectedOption.label : ''}</span>
        <span style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
          transition: 'transform 0.2s ease', 
          display: 'flex', 
          alignItems: 'center', 
          color: '#94a3b8',
          fontSize: '0.65rem'
        }}>
          ▼
        </span>
      </div>

      {/* Dropdown Options Box */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            width: '100%',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '0.35rem 0'
          }}
          className="custom-dropdown-menu"
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '0.6rem 1rem',
                color: opt.value === value ? 'var(--secondary)' : '#ffffff',
                background: opt.value === value ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                fontWeight: opt.value === value ? '600' : '400'
              }}
              className="custom-dropdown-item"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer style={{
      marginTop: 'auto',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid var(--border-glass)',
      borderRadius: '20px',
      padding: '1.25rem 2rem',
      boxShadow: 'var(--glass-shadow)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
      width: '100%',
      animation: 'fadeIn 0.5s ease',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Desarrollado por DariDev &copy; 2026
        </span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Control de Incidencias • V.1
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Contacto:</span>
        <a
          href="https://wa.me/584161978651"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(37, 211, 102, 0.1)',
            border: '1px solid rgba(37, 211, 102, 0.2)',
            color: '#25D366',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
          className="whatsapp-contact-link"
          title="Contactar por WhatsApp"
        >
          <svg
            style={{ width: '18px', height: '18px', fill: 'currentColor' }}
            viewBox="0 0 24 24"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.63 1.97 14.152.946 11.517.946c-5.44 0-9.866 4.372-9.87 9.802 0 1.814.48 3.59 1.39 5.169l-.95 3.473 3.56-.934zM16.621 13.568c-.27-.135-1.597-.788-1.848-.88-.25-.091-.433-.135-.615.135-.183.27-.707.88-.867 1.062-.16.183-.32.203-.59.068-1.523-.762-2.482-1.282-3.44-2.933-.254-.438.254-.407.727-1.353.079-.162.04-.304-.02-.439-.06-.135-.513-1.233-.7-1.69-.183-.448-.37-.387-.514-.395-.133-.007-.285-.008-.438-.008-.153 0-.402.058-.613.286-.212.228-.809.79-.809 1.927 0 1.137.828 2.235.942 2.387.114.152 1.63 2.49 3.95 3.49.55.237 1.002.39 1.343.498.552.176 1.053.151 1.448.092.44-.066 1.353-.553 1.543-1.085.19-.53.19-.986.133-1.082-.057-.096-.212-.152-.482-.288z"/>
          </svg>
        </a>
      </div>
    </footer>
  );
}

function App() {
  const today = new Date();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [quincena, setQuincena] = useState(today.getDate() <= 15 ? 1 : 2);
  const [feriados, setFeriados] = useState([]);
  const [newFeriadoDate, setNewFeriadoDate] = useState('');
  const [incidencias, setIncidencias] = useState({
    'SM COSTAZUL': [],
    'BODEGÓN COSTAZUL': [],
    'HAPPY SHACK': [],
    'HAPPY SHACK II': []
  });
  
  const [activeSucursal, setActiveSucursal] = useState('SM COSTAZUL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  // Estados para base de datos e historial
  const [currentView, setCurrentView] = useState('live'); // 'live' o 'history'
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState(null);
  const [historyFilename, setHistoryFilename] = useState('');
  const [saving, setSaving] = useState(false);
  const [calculatedRawData, setCalculatedRawData] = useState([]);

  // Estados de autenticación
  const [authToken, setAuthToken] = useState(localStorage.getItem('auth_token') || '');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Toast notifier helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUser || !loginPass) {
      setLoginError('Complete todos los campos.');
      return;
    }
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('auth_token', data.token);
        setAuthToken(data.token);
        showToast('Sesión iniciada correctamente.', 'success');
      } else {
        setLoginError(data.error || 'Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Error de red al conectar con el servidor.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setAuthToken('');
    setIncidencias({
      'SM COSTAZUL': [],
      'BODEGÓN COSTAZUL': [],
      'HAPPY SHACK': [],
      'HAPPY SHACK II': []
    });
    setCalculatedRawData([]);
    setViewingHistoryId(null);
    setFile(null);
    showToast('Sesión cerrada.', 'info');
  };

  // El procesamiento se realiza de manera manual al presionar el botón "Procesar Incidencias".

  // Manejo de carga de archivos por click o arrastre
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (fileObj) => {
    if (!fileObj.name.endsWith('.xlsx') && !fileObj.name.endsWith('.xls')) {
      showToast('Por favor, selecciona un archivo Excel (.xlsx o .xls)', 'error');
      return;
    }
    
    setLoading(true);
    setFile({ name: fileObj.name, size: fileObj.size });
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a matriz 2D
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (jsonData.length < 2) {
          throw new Error('El archivo Excel no parece contener suficientes datos o filas.');
        }

        setRawData(jsonData);
        setCalculatedRawData([]); // Resetear datos calculados en vivo al cargar nuevo archivo
        setIncidencias({
          'SM COSTAZUL': [],
          'BODEGÓN COSTAZUL': [],
          'HAPPY SHACK': [],
          'HAPPY SHACK II': []
        });
        showToast('Archivo Excel cargado exitosamente. Presiona "Procesar Incidencias" para calcular.', 'success');
      } catch (err) {
        console.error(err);
        showToast('Error al leer el archivo Excel: ' + err.message, 'error');
        setFile(null);
        setRawData([]);
        setCalculatedRawData([]);
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      showToast('Error de lectura del archivo.', 'error');
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(fileObj);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  // Remover archivo cargado
  const handleRemoveFile = () => {
    setFile(null);
    setRawData([]);
    setCalculatedRawData([]);
    setIncidencias({
      'SM COSTAZUL': [],
      'BODEGÓN COSTAZUL': [],
      'HAPPY SHACK': [],
      'HAPPY SHACK II': []
    });
    showToast('Archivo removido.', 'success');
  };

  // Gestión de Feriados
  const handleAddFeriado = () => {
    if (!newFeriadoDate) return;
    
    // Validar que la fecha corresponda al corte seleccionado
    const parts = newFeriadoDate.split('-'); // YYYY-MM-DD
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-indexed (enero = 0)
      const d = parseInt(parts[2], 10);

      let startDay = 1;
      let endDay = 15;
      if (quincena === 2) {
        startDay = 16;
        endDay = new Date(year, month + 1, 0).getDate();
      }

      if (y !== year || m !== month || d < startDay || d > endDay) {
        const periodStr = `${quincena === 1 ? '1ra Quincena' : '2da Quincena'} de ${MONTH_NAMES[month]} de ${year}`;
        showToast(`La fecha del feriado no corresponde al corte seleccionado (${periodStr}).`, 'error');
        return;
      }
    }

    if (feriados.includes(newFeriadoDate)) {
      showToast('Esta fecha ya está en la lista de feriados.', 'error');
      return;
    }

    setFeriados(prev => [...prev, newFeriadoDate].sort());
    setNewFeriadoDate('');
    showToast('Fecha feriado agregada.', 'success');
  };

  const handleRemoveFeriado = (dateToRemove) => {
    setFeriados(prev => prev.filter(d => d !== dateToRemove));
    showToast('Feriado eliminado de la lista.', 'success');
  };

  // --- PROCESAMIENTO MANUAL ---
  const handleProcess = () => {
    if (rawData.length === 0) {
      showToast('Por favor, carga un archivo Excel primero.', 'error');
      return;
    }
    setLoading(true);
    // Pequeño retardo para que el spinner de carga se visualice
    setTimeout(() => {
      try {
        const calculated = processIncidencias(
          rawData,
          parseInt(year, 10),
          month,
          quincena,
          feriados
        );

        // Contar el total de incidencias calculadas
        let totalIncidencias = 0;
        Object.values(calculated).forEach(list => {
          totalIncidencias += list.length;
        });

        if (totalIncidencias === 0) {
          const periodStr = `${quincena === 1 ? '1ra Quincena' : '2da Quincena'} de ${MONTH_NAMES[month]} de ${year}`;
          throw new Error(`Las fechas en el archivo Excel no coinciden con el corte seleccionado (${periodStr}) o la información es errada. Por favor, ingresa el archivo correspondiente.`);
        }

        setIncidencias(calculated);
        setCalculatedRawData(rawData);
        showToast('Incidencias calculadas exitosamente.', 'success');
      } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  // --- MÉTODOS DE BASE DE DATOS Y GESTIÓN DEL HISTORIAL ---

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/cortes', {
        headers: { 'Authorization': authToken }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error('Error al obtener el historial de la base de datos');
      const data = await res.json();
      setHistoryList(data);
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (rawData.length === 0) {
      showToast('No hay datos calculados para guardar.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/cortes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          filename: file ? file.name : 'Carga Manual',
          year,
          month,
          quincena,
          feriados,
          incidencias
        })
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar en la base de datos');
      }
      showToast('Cálculo e incidencias guardadas exitosamente en la base de datos.', 'success');
      fetchHistory(); // Recargar historial de fondo
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadHistoryItem = async (id) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/cortes/${id}`, {
        headers: { 'Authorization': authToken }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error('Error al cargar el detalle del historial');
      const data = await res.json();
      
      // Agrupar incidencias por sucursal
      const grouped = {
        'SM COSTAZUL': [],
        'BODEGÓN COSTAZUL': [],
        'HAPPY SHACK': [],
        'HAPPY SHACK II': []
      };
      
      if (Array.isArray(data.incidencias)) {
        data.incidencias.forEach(item => {
          const key = item.mappedSucursal;
          if (grouped[key]) {
            grouped[key].push({
              employeeCode: item.employeeCode,
              employeeName: item.employeeName,
              cedula: item.cedula,
              cargo: item.cargo,
              originalSucursal: item.originalSucursal,
              incidenceType: item.incidenceType,
              value: item.value,
              dateString: item.dateString,
              originalStatus: item.originalStatus
            });
          }
        });
      }
      
      // Cargar estados correspondientes
      setIncidencias(grouped);
      setYear(data.year);
      setMonth(data.month);
      setQuincena(data.quincena);
      setFeriados(data.feriados || []);
      setViewingHistoryId(id);
      setHistoryFilename(data.filename);
      
      // Mostrar vista de cálculo con el modo lectura activo
      setFile({ name: data.filename, size: 0 });
      setRawData([['MOCK_HEADER']]); 
      setCalculatedRawData([['MOCK_HEADER']]); // Truco para activar previsualización sin recalcular
      
      setCurrentView('live');
      showToast(`Cargado corte del historial: ${MONTH_NAMES[data.month]} ${data.year} - Q${data.quincena}`, 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteHistoryItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar este registro del historial permanentemente?')) return;
    
    try {
      const res = await fetch(`/api/cortes/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': authToken }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error('Error al eliminar el registro');
      showToast('Registro de historial eliminado con éxito.', 'success');
      fetchHistory();
      
      if (viewingHistoryId === id) {
        handleExitHistoryMode();
      }
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  const handleExitHistoryMode = () => {
    setViewingHistoryId(null);
    setHistoryFilename('');
    setFile(null);
    setRawData([]);
    setCalculatedRawData([]);
    setIncidencias({
      'SM COSTAZUL': [],
      'BODEGÓN COSTAZUL': [],
      'HAPPY SHACK': [],
      'HAPPY SHACK II': []
    });
    showToast('Regresado al cálculo en vivo.', 'success');
  };

  // Cargar historial al iniciar (solo si está autenticado)
  useEffect(() => {
    if (authToken) {
      fetchHistory();
    }
  }, [authToken]);

  // Eliminar una incidencia de la lista previsualizada
  const handleDeleteIncidence = (sucursal, index) => {
    setIncidencias(prev => {
      const updatedList = [...prev[sucursal]];
      updatedList.splice(index, 1);
      return {
        ...prev,
        [sucursal]: updatedList
      };
    });
    showToast('Registro de incidencia eliminado.', 'success');
  };

  // Exportación del reporte procesado a Excel
  const handleDownloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Mapeo de colores pasteles para presentación profesional
      const colors = {
        'HAPPY SHACK': {
          headerBg: 'FFE699', // Amarillo oscuro/dorado
          cellBg: 'FFF2CC'    // Amarillo suave
        },
        'HAPPY SHACK II': {
          headerBg: 'FFE699',
          cellBg: 'FFF2CC'
        },
        'BODEGÓN COSTAZUL': {
          headerBg: 'C6E0B4', // Verde oscuro
          cellBg: 'E2EFDA'    // Verde suave
        },
        'SM COSTAZUL': {
          headerBg: 'B4C6E7', // Azul oscuro
          cellBg: 'DDEBF7'    // Azul suave
        }
      };

      Object.keys(incidencias).forEach(sucursal => {
        // Mapear cada elemento al formato exacto de salida
        const dataForSheet = incidencias[sucursal].map(item => ({
          'Codigo de Empleado': parseInt(item.employeeCode, 10) || item.employeeCode,
          'Incidencias': item.incidenceType,
          'Valor': item.value,
          'Fecha': item.dateString
        }));

        const ws = XLSX.utils.json_to_sheet(dataForSheet);
        
        // Ajustar anchos de columnas para presentación limpia
        ws['!cols'] = [
          { wch: 22 }, // Codigo de Empleado
          { wch: 28 }, // Incidencias
          { wch: 10 }, // Valor
          { wch: 18 }  // Fecha
        ];

        // Obtener la paleta de colores para la sucursal actual
        const colorSet = colors[sucursal] || colors['SM COSTAZUL'];

        // Recorrer las celdas y aplicar bordes, fuentes y rellenos
        Object.keys(ws).forEach(cellRef => {
          if (cellRef.startsWith('!')) return;
          const cell = ws[cellRef];
          if (!cell) return;

          const rowNum = parseInt(cellRef.replace(/^[A-Z]+/, ''), 10);
          const isHeader = rowNum === 1;

          cell.s = {
            fill: {
              patternType: 'solid',
              fgColor: { rgb: isHeader ? colorSet.headerBg : colorSet.cellBg }
            },
            font: {
              name: 'Calibri',
              sz: 11,
              bold: isHeader,
              color: { rgb: '000000' }
            },
            alignment: {
              horizontal: isHeader ? 'center' : (cellRef.startsWith('C') || cellRef.startsWith('D') ? 'center' : 'left'),
              vertical: 'center'
            },
            border: {
              top: { style: 'thin', color: { rgb: 'D9D9D9' } },
              bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
              left: { style: 'thin', color: { rgb: 'D9D9D9' } },
              right: { style: 'thin', color: { rgb: 'D9D9D9' } }
            }
          };
        });

        XLSX.utils.book_append_sheet(wb, ws, sucursal);
      });

      // Escribir y descargar el archivo
      const monthName = MONTH_NAMES[month].toUpperCase();
      XLSX.writeFile(wb, `INCIDENCIAS_CORTE_${year}_${monthName}_Q${quincena}.xlsx`);
      showToast('Reporte de incidencias descargado con éxito.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al descargar el archivo: ' + err.message, 'error');
    }
  };

  // Filtrado de incidencias según la búsqueda (Nombre, Código o Cargo)
  const currentIncidenciasList = incidencias[activeSucursal] || [];
  const filteredIncidencias = currentIncidenciasList.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.employeeCode.toLowerCase().includes(q) ||
      item.employeeName.toLowerCase().includes(q) ||
      item.cargo.toLowerCase().includes(q) ||
      item.incidenceType.toLowerCase().includes(q)
    );
  });

  // Métricas del dashboard correspondientes a la pestaña activa
  const stats = filteredIncidencias.reduce(
    (acc, curr) => {
      acc.totalRows += 1;
      if (curr.incidenceType === 'BONO NOCTURNO') acc.bonoNocturno += curr.value;
      if (curr.incidenceType === 'DOMINGO') acc.domingo += 1;
      if (curr.incidenceType === 'FERIADO') acc.feriado += 1;
      if (curr.incidenceType.includes('AUSENCIA')) acc.ausencias += 1;
      return acc;
    },
    { totalRows: 0, bonoNocturno: 0, domingo: 0, feriado: 0, ausencias: 0 }
  );

  // Filtrar los feriados que caen en el corte actual
  const activeFeriadosInCorte = feriados.filter(dateStr => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1; // 0-indexed
    const d = parseInt(parts[2], 10);

    let startDay = 1;
    let endDay = 15;
    if (quincena === 2) {
      startDay = 16;
      endDay = new Date(year, month + 1, 0).getDate();
    }

    return y === year && m === month && d >= startDay && d <= endDay;
  });

  // Interceptar renderizado si no está autenticado (Login Card)
  if (!authToken) {
    return (
      <div className="container" style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <div className="orb orb-1" style={{ top: '30%', left: '30%' }}></div>
        <div className="orb orb-2" style={{ bottom: '30%', right: '30%' }}></div>

        <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', borderRadius: '20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              borderRadius: '16px',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <ShieldAlert size={32} style={{ color: '#fff' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(90deg, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>Control de Incidencias</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Ingresa tus credenciales maestras para continuar</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            <div className="config-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Usuario</label>
              <input
                type="text"
                className="input-text"
                placeholder="Ej: Daridev"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="config-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Contraseña</label>
              <input
                type="password"
                className="input-text"
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {loginError && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loggingIn}
              style={{
                marginTop: '0.5rem',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
              }}
            >
              {loggingIn ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        <Footer />

        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      {/* Glass Header */}
      <header>
        <div className="header-title-container">
          <div className="header-logo">
            <FileSpreadsheet size={28} color="#ffffff" />
          </div>
          <div className="header-title">
            <h1>Cálculo Automático de Incidencias</h1>
            <p>Procesamiento automatizado de bonos nocturnos, feriados, domingos y ausencias</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="tabs-container" style={{ margin: 0, padding: '0.25rem' }}>
            <button
              className={`tab-btn ${currentView === 'live' ? 'active' : ''}`}
              onClick={() => setCurrentView('live')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              <Upload size={14} /> Cálculo
            </button>
            <button
              className={`tab-btn ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('history');
                fetchHistory();
              }}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              <FileSpreadsheet size={14} /> Historial
            </button>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Banner de Modo Lectura / Historial */}
      {viewingHistoryId && (
        <div className="glass-card" style={{
          padding: '1rem 1.5rem',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          background: 'rgba(245, 158, 11, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'fadeIn 0.3s ease',
          borderRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fbbf24' }}>
            <Info size={20} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Visualizando Historial Guardado</strong>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Archivo: <strong>{historyFilename}</strong> | Período: {MONTH_NAMES[month]} {year} - Quincena {quincena} (Modo Lectura)
              </span>
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={handleExitHistoryMode}
            style={{
              width: 'auto',
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: '#ffffff',
              boxShadow: 'none'
            }}
          >
            Volver a Cálculo en Vivo
          </button>
        </div>
      )}



      {/* Main Layout Grid o Historial */}
      {currentView === 'history' ? (
        /* VISTA DE HISTORIAL */
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '500px' }}>
          <h2 className="card-title">
            <FileSpreadsheet size={18} /> Historial de Salidas Guardadas
          </h2>
          
          {loadingHistory ? (
            <div className="empty-state">
              <Sparkles size={80} style={{ animation: 'spin 2s linear infinite' }} />
              <h3>Cargando historial...</h3>
            </div>
          ) : historyList.length === 0 ? (
            <div className="empty-state">
              <ShieldAlert size={80} />
              <h3>Historial vacío</h3>
              <p>No se han guardado cálculos en la base de datos todavía.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Fecha de Registro</th>
                    <th>Archivo de Origen</th>
                    <th>Período</th>
                    <th>Feriados</th>
                    <th style={{ textAlign: 'center' }}>Total Registros</th>
                    <th style={{ width: '150px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((item) => {
                    const savedDate = new Date(item.created_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const monthName = MONTH_NAMES[item.month];
                    return (
                      <tr
                        key={item.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleLoadHistoryItem(item.id)}
                      >
                        <td style={{ fontWeight: '500', color: 'var(--secondary)' }}>{savedDate}</td>
                        <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.filename}
                        </td>
                        <td>
                          <strong>{monthName} {item.year}</strong> - Q{item.quincena}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
                            {item.feriados && item.feriados.length > 0
                              ? item.feriados.map(d => d.split('-')[2]).join(', ')
                              : 'Ninguno'
                            }
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '700' }}>
                          {item.total_registros}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              className="btn-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadHistoryItem(item.id);
                              }}
                              style={{
                                width: 'auto',
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.75rem',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                boxShadow: 'none'
                              }}
                            >
                              Ver
                            </button>
                            <button
                              className="btn-remove-file"
                              onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                              style={{
                                padding: '0.4rem',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                background: 'rgba(239, 68, 68, 0.05)',
                                color: '#ef4444'
                              }}
                              title="Eliminar de la base de datos"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* VISTA DE CÁLCULO EN VIVO */
        <div className="dashboard-grid">
        
        {/* Left Control Sidebar */}
        <div className="sidebar-column" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto', paddingRight: '0.25rem' }}>
          
          {/* Corte Selection Glass Card */}
          <div className="glass-card">
            <h2 className="card-title">
              <Calendar size={18} /> Corte a Calcular
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="config-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Año</label>
                <input
                  type="number"
                  className="input-text"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10) || today.getFullYear())}
                  min="2000"
                  max="2100"
                  disabled={viewingHistoryId !== null}
                  style={{
                    background: viewingHistoryId !== null ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.8)',
                    cursor: viewingHistoryId !== null ? 'not-allowed' : 'text'
                  }}
                />
              </div>
              <CustomDropdown
                label="Mes"
                value={month}
                onChange={setMonth}
                disabled={viewingHistoryId !== null}
                options={MONTH_NAMES.map((name, idx) => ({ value: idx, label: name }))}
              />
              <CustomDropdown
                label="Quincena"
                value={quincena}
                onChange={setQuincena}
                disabled={viewingHistoryId !== null}
                options={[
                  { value: 1, label: '1ra Quincena (01 al 15)' },
                  { value: 2, label: '2da Quincena (16 al 30/31)' }
                ]}
              />
            </div>
          </div>

          {/* File Upload Glass Card */}
          <div className="glass-card">
            <h2 className="card-title">
              <Upload size={18} /> Carga de Archivo
            </h2>
            
            {!file ? (
              <div
                className="dropzone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <div className="dropzone-icon">
                  <Upload size={24} />
                </div>
                <div className="dropzone-text">
                  <h3>Cargar reporte quincenal</h3>
                  <p>Arrastra tu archivo aquí o haz clic para buscar</p>
                </div>
                <input
                  id="fileInput"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="file-loaded-panel">
                <div className="file-info">
                  <CheckCircle2 className="file-info-icon" size={24} />
                  <div className="file-details">
                    <h4>{file.name}</h4>
                    {file.size > 0 ? (
                      <p>{(file.size / 1024).toFixed(1)} KB</p>
                    ) : (
                      <p style={{ color: '#fbbf24', fontWeight: '500' }}>Registro Histórico</p>
                    )}
                  </div>
                </div>
                {viewingHistoryId ? (
                  <button className="btn-remove-file" onClick={handleExitHistoryMode} title="Cerrar Historial">
                    &times;
                  </button>
                ) : (
                  <button className="btn-remove-file" onClick={handleRemoveFile} title="Remover archivo">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Los botones del cargador de archivo van fuera de file-loaded-panel */}
            {file && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                {/* Botón de Procesado Manual - solo visible si no estamos viendo un historial */}
                {!viewingHistoryId && (
                  <button
                    className="btn-primary"
                    onClick={handleProcess}
                    disabled={loading || rawData.length === 0}
                    style={{
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <Sparkles size={18} style={{ marginRight: '0.25rem' }} />
                    {loading ? 'Procesando...' : calculatedRawData.length > 0 ? 'Reprocesar Incidencias' : 'Procesar Incidencias'}
                  </button>
                )}

                {/* Botón de Base de Datos - Habilitado si ya se procesó */}
                {(calculatedRawData.length > 0 || viewingHistoryId) && (
                  <>
                    {!viewingHistoryId && (
                      <button
                        className="btn-primary"
                        onClick={handleSaveToDatabase}
                        disabled={saving}
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Plus size={18} /> {saving ? 'Guardando...' : 'Guardar en Base de Datos'}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Feriados Glass Card */}
          <div className="glass-card">
            <h2 className="card-title">
              <Calendar size={18} /> Días Feriados
            </h2>
             <div className="feriados-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="feriados-input-row" style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="date"
                  className="input-text"
                  value={newFeriadoDate}
                  onChange={(e) => setNewFeriadoDate(e.target.value)}
                  style={{ flexGrow: 1 }}
                  disabled={viewingHistoryId !== null}
                />
                <button
                  className="btn-icon"
                  onClick={handleAddFeriado}
                  style={{ padding: '0.75rem' }}
                  disabled={viewingHistoryId !== null}
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="feriados-tags" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                maxHeight: '120px',
                overflowY: 'auto',
                padding: '0.5rem',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)'
              }}>
                {feriados.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', padding: '0.25rem 0.5rem', width: '100%', textAlign: 'center' }}>
                    No hay días feriados registrados.
                  </div>
                ) : (
                  feriados.map(date => {
                    const [y, m, d] = date.split('-');
                    const formattedLabel = `${d}/${m}/${y}`;
                    return (
                      <span key={date} className="feriado-tag" style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        {formattedLabel}
                        {!viewingHistoryId && (
                          <button
                            onClick={() => handleRemoveFeriado(date)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            &times;
                          </button>
                        )}
                      </span>
                    );
                  })
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Si un colaborador trabaja en estas fechas, computará "FERIADO".
              </p>
              {activeFeriadosInCorte.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <strong>Feriados en este corte:</strong> {activeFeriadosInCorte.map(d => d.split('-')[2]).join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Panel */}
        <div className="glass-card" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div className="preview-container">
            <h2 className="card-title">
              <FileSpreadsheet size={18} /> Tabla de Previsualización y Control
            </h2>

            {calculatedRawData.length === 0 ? (
              <div className="empty-state">
                <ShieldAlert size={80} />
                {rawData.length === 0 ? (
                  <>
                    <h3>No hay datos cargados</h3>
                    <p>Por favor, carga un archivo Excel en el panel lateral para iniciar.</p>
                  </>
                ) : (
                  <>
                    <h3 style={{ color: 'var(--secondary)' }}>Archivo cargado con éxito</h3>
                    <p>Haz clic en el botón <strong>"Procesar Incidencias"</strong> en el panel izquierdo para calcular los reportes.</p>
                  </>
                )}
              </div>
            ) : stats.total === 0 ? (
              <div className="empty-state" style={{ borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', padding: '2rem 1.5rem' }}>
                <ShieldAlert size={80} style={{ color: '#ef4444' }} />
                <h3 style={{ color: '#ef4444' }}>Advertencia: 0 incidencias calculadas</h3>
                <p style={{ maxWidth: '500px', margin: '0.5rem auto 1.5rem auto', fontSize: '0.95rem' }}>
                  No se encontraron columnas de fecha en el archivo Excel que coincidan con el periodo filtrado: 
                  <strong> {MONTH_NAMES[month]} {year} - {quincena === 1 ? '1ra Quincena' : '2da Quincena'}</strong>.
                </p>
                <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '8px', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
                  <strong>Pasos para solucionar este error:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#e2e8f0' }}>
                    <li>Verifica que el <strong>Mes</strong> y la <strong>Quincena</strong> seleccionados en el panel superior correspondan exactamente a los datos que cargaste en el archivo Excel.</li>
                    <li>Realiza una <strong>recarga forzada de la página (Ctrl + F5 o Cmd + Shift + R)</strong> en tu navegador para asegurarte de que estás usando la versión más reciente del sistema sin caché.</li>
                    <li>Abre la consola del navegador (presiona <strong>F12</strong> en tu teclado y ve a "Console") para inspeccionar los registros de fechas cargadas y detectar descalces.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Widgets */}
                <div className="stats-row">
                  <div className="stat-box">
                    <span className="stat-label">Bono Nocturno</span>
                    <span className="stat-val stat-val-bono">{stats.bonoNocturno}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Domingos</span>
                    <span className="stat-val stat-val-domingo">{stats.domingo}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Feriados</span>
                    <span className="stat-val stat-val-feriado">{stats.feriado}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Ausencias</span>
                    <span className="stat-val stat-val-ausencia">{stats.ausencias}</span>
                  </div>
                </div>

                {/* Filter / Search Actions */}
                <div className="preview-header-actions" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <div className="search-container" style={{ maxWidth: '400px', width: '100%' }}>
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Buscar por colaborador, código o cargo..."
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Botón Descargar Centrado y de Ancho Acorde */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <button
                    className="btn-primary"
                    onClick={handleDownloadExcel}
                    disabled={rawData.length === 0}
                    style={{
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)',
                      padding: '0.6rem 2rem',
                      fontSize: '0.9rem',
                      width: 'auto',
                      minWidth: '220px',
                      maxWidth: '300px',
                      height: '42px',
                      borderRadius: '10px',
                      marginTop: 0
                    }}
                  >
                    <Download size={18} /> Descargar Resultados (Excel)
                  </button>
                </div>

                {/* Sucursales Tabs */}
                <div className="sucursales-tabs">
                  {Object.keys(incidencias).map(suc => (
                    <button
                      key={suc}
                      className={`sucursal-tab ${activeSucursal === suc ? 'active' : ''}`}
                      onClick={() => {
                        setActiveSucursal(suc);
                        setSearchQuery('');
                      }}
                    >
                      {suc} ({incidencias[suc]?.length || 0})
                    </button>
                  ))}
                </div>

                {/* Incidences Table */}
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Cod. MELE</th>
                        <th>Cédula</th>
                        <th>Colaborador</th>
                        <th>Cargo</th>
                        <th>Incidencia</th>
                        <th>Valor</th>
                        <th>Fecha</th>
                        <th>Turno Original</th>
                        <th style={{ width: '60px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIncidencias.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            No se encontraron registros de incidencias para esta selección.
                          </td>
                        </tr>
                      ) : (
                        filteredIncidencias.map((item, index) => {
                          // Encontrar el índice original en el arreglo de la sucursal
                          const originalIdx = incidencias[activeSucursal].findIndex(
                            i => i.employeeCode === item.employeeCode && 
                                 i.dateString === item.dateString && 
                                 i.incidenceType === item.incidenceType
                          );

                          return (
                            <tr key={`${item.employeeCode}-${item.dateString}-${item.incidenceType}-${index}`}>
                              <td style={{ fontWeight: '600', color: 'var(--secondary)' }}>{item.employeeCode}</td>
                              <td>{item.cedula}</td>
                              <td style={{ fontWeight: '500' }}>{item.employeeName}</td>
                              <td style={{ color: '#94a3b8' }}>{item.cargo}</td>
                              <td>
                                <span className={`badge ${
                                  item.incidenceType === 'BONO NOCTURNO' ? 'badge-bono' :
                                  item.incidenceType === 'DOMINGO' ? 'badge-domingo' :
                                  item.incidenceType === 'FERIADO' ? 'badge-feriado' :
                                  item.incidenceType === 'AUSENCIA JUSTIFICADA' ? 'badge-ausencia-j' :
                                  'badge-ausencia-i'
                                }`}>
                                  {item.incidenceType}
                                </span>
                              </td>
                              <td style={{ fontWeight: '700' }}>{item.value}</td>
                              <td>{item.dateString}</td>
                              <td style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                {item.originalStatus}
                              </td>
                              <td>
                                {!viewingHistoryId && (
                                  <div className="row-actions">
                                    <button
                                      className="btn-action-delete"
                                      title="Eliminar Incidencia"
                                      onClick={() => handleDeleteIncidence(activeSucursal, originalIdx)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      <Footer />

      {/* Floating Toast Notification Area */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
