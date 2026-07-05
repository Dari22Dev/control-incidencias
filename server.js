import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));

// --- ALMACENAMIENTO TEMPORAL EN MEMORIA (RAM) ---
let ID_CORTE_COUNTER = 1;
let ID_INCIDENCIA_COUNTER = 1;

let tablaCortes = [];
let tablaIncidencias = [];

// --- AUTENTICACIÓN Y SEGURIDAD ---
const MASTER_USER = 'Daridev';
const MASTER_PASS = 'Draca29*';
const MASTER_TOKEN = 'session_token_master_2026';

// Middleware de Autenticación
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader === MASTER_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: 'Sesión inválida o expirada. Por favor inicie sesión.' });
  }
};

// Ruta de Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === MASTER_USER && password === MASTER_PASS) {
    res.json({ success: true, token: MASTER_TOKEN });
  } else {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }
});

// --- RUTAS DE LA API (MOCK CON ARRAYS) ---

// Guardar un nuevo corte y sus registros
app.post('/api/cortes', requireAuth, async (req, res) => {
  const { filename, year, month, quincena, feriados, incidencias } = req.body;

  if (!year || month === undefined || !quincena || !incidencias) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
  }

  try {
    const corteId = ID_CORTE_COUNTER++;

    // Crear el registro del corte simulando SQLite
    const nuevoCorte = {
      id: corteId,
      filename: filename || 'Cálculo Manual',
      year: parseInt(year),
      month: parseInt(month),
      quincena: parseInt(quincena),
      feriados: JSON.stringify(feriados || []),
      created_at: new Date().toISOString()
    };
    tablaCortes.push(nuevoCorte);

    // Aplanar e insertar las incidencias en el arreglo global
    Object.keys(incidencias).forEach((sucursal) => {
      if (Array.isArray(incidencias[sucursal])) {
        incidencias[sucursal].forEach((item) => {
          tablaIncidencias.push({
            id: ID_INCIDENCIA_COUNTER++,
            corte_id: corteId,
            employeeCode: item.employeeCode,
            employeeName: item.employeeName,
            cedula: item.cedula,
            cargo: item.cargo,
            originalSucursal: item.originalSucursal,
            mappedSucursal: sucursal,
            incidenceType: item.incidenceType,
            value: item.value,
            dateString: item.dateString,
            originalStatus: item.originalStatus
          });
        });
      }
    });

    res.status(201).json({ success: true, id: corteId });
  } catch (err) {
    console.error('Error al guardar corte:', err);
    res.status(500).json({ error: 'Error interno al guardar los registros: ' + err.message });
  }
});

// Obtener todos los cortes históricos (resumen)
app.get('/api/cortes', requireAuth, async (req, res) => {
  try {
    // Mapeamos los cortes y calculamos el total de registros en memoria
    const formattedRows = tablaCortes.map(corte => {
      const totalRegistros = tablaIncidencias.filter(inc => inc.corte_id === corte.id).length;
      return {
        ...corte,
        total_registros: totalRegistros,
        feriados: JSON.parse(corte.feriados || '[]')
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Orden descendente por fecha

    res.json(formattedRows);
  } catch (err) {
    console.error('Error al obtener historial:', err);
    res.status(500).json({ error: 'Error al obtener el historial: ' + err.message });
  }
});

// Obtener detalles de un corte por ID
app.get('/api/cortes/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const corte = tablaCortes.find(c => c.id === parseInt(id));
    if (!corte) {
      return res.status(404).json({ error: 'Registro de corte no encontrado.' });
    }

    const copiaCorte = { ...corte };
    copiaCorte.feriados = JSON.parse(copiaCorte.feriados || '[]');

    const incidenciasFiltradas = tablaIncidencias.filter(inc => inc.corte_id === parseInt(id));

    res.json({ ...copiaCorte, incidencias: incidenciasFiltradas });
  } catch (err) {
    console.error('Error al obtener detalles del corte:', err);
    res.status(500).json({ error: 'Error al obtener los detalles del corte: ' + err.message });
  }
});

// Eliminar un corte histórico (Simula ON DELETE CASCADE)
app.delete('/api/cortes/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const corteIdInt = parseInt(id);
    // Eliminar el corte
    tablaCortes = tablaCortes.filter(c => c.id !== corteIdInt);
    // Eliminar sus incidencias asociadas
    tablaIncidencias = tablaIncidencias.filter(inc => inc.corte_id !== corteIdInt);

    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar corte:', err);
    res.status(500).json({ error: 'Error al eliminar el registro: ' + err.message });
  }
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Redirigir cualquier otra petición no-API al index.html del frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor en memoria corriendo en puerto ${PORT}`);
});

