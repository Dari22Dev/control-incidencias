import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));

// --- ALMACENAMIENTO TEMPORAL EN MEMORIA ---
let tablaCortes = [];
let tablaIncidencias = [];
let nextCorteId = 1;
let nextIncidenciaId = 1;

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

// --- RUTAS DE LA API (PROTEGIDAS) ---

// Guardar un nuevo corte y sus registros
app.post('/api/cortes', requireAuth, async (req, res) => {
  const { filename, year, month, quincena, feriados, incidencias } = req.body;

  if (!year || month === undefined || !quincena || !incidencias) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
  }

  try {
    const nuevoCorte = {
      id: nextCorteId++,
      filename: filename || 'Cálculo Manual',
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      quincena: parseInt(quincena, 10),
      feriados: JSON.stringify(feriados || []),
      created_at: new Date().toISOString()
    };

    tablaCortes.push(nuevoCorte);

    // Aplanar las incidencias de todas las sucursales
    const flatIncidencias = [];
    Object.keys(incidencias).forEach((sucursal) => {
      if (Array.isArray(incidencias[sucursal])) {
        incidencias[sucursal].forEach((item) => {
          flatIncidencias.push({ sucursal, ...item });
        });
      }
    });

    for (const item of flatIncidencias) {
      tablaIncidencias.push({
        id: nextIncidenciaId++,
        corte_id: nuevoCorte.id,
        employeeCode: item.employeeCode,
        employeeName: item.employeeName,
        cedula: item.cedula,
        cargo: item.cargo,
        originalSucursal: item.originalSucursal,
        mappedSucursal: item.sucursal,
        incidenceType: item.incidenceType,
        value: item.value,
        dateString: item.dateString,
        originalStatus: item.originalStatus
      });
    }

    res.status(201).json({ success: true, id: nuevoCorte.id });
  } catch (err) {
    console.error('Error al guardar corte:', err);
    res.status(500).json({ error: 'Error interno al guardar los registros: ' + err.message });
  }
});

// Obtener todos los cortes históricos (resumen)
app.get('/api/cortes', requireAuth, async (req, res) => {
  try {
    const result = tablaCortes.map(c => {
      const total_registros = tablaIncidencias.filter(inc => inc.corte_id === c.id).length;
      return {
        id: c.id,
        filename: c.filename,
        year: c.year,
        month: c.month,
        quincena: c.quincena,
        feriados: JSON.parse(c.feriados || '[]'),
        created_at: c.created_at,
        total_registros
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(result);
  } catch (err) {
    console.error('Error al obtener historial:', err);
    res.status(500).json({ error: 'Error al obtener el historial: ' + err.message });
  }
});

// Obtener detalles de un corte por ID
app.get('/api/cortes/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const idInt = parseInt(id, 10);
    const corte = tablaCortes.find(c => c.id === idInt);
    if (!corte) {
      return res.status(404).json({ error: 'Registro de corte no encontrado.' });
    }

    const responseCorte = {
      id: corte.id,
      filename: corte.filename,
      year: corte.year,
      month: corte.month,
      quincena: corte.quincena,
      feriados: JSON.parse(corte.feriados || '[]'),
      created_at: corte.created_at
    };

    const incidencias = tablaIncidencias.filter(inc => inc.corte_id === idInt);
    res.json({ ...responseCorte, incidencias });
  } catch (err) {
    console.error('Error al obtener detalles del corte:', err);
    res.status(500).json({ error: 'Error al obtener los detalles del corte: ' + err.message });
  }
});

// Eliminar un corte histórico
app.delete('/api/cortes/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const idInt = parseInt(id, 10);
    tablaCortes = tablaCortes.filter(c => c.id !== idInt);
    tablaIncidencias = tablaIncidencias.filter(inc => inc.corte_id !== idInt);
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

export default app;
