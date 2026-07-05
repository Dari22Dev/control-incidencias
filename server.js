import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));

// Configurar SQLite
const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conectado exitosamente a la base de datos SQLite.');
  }
});

// Activar soporte para claves foráneas y cascada en SQLite
db.run('PRAGMA foreign_keys = ON');

// Inicializar tablas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS cortes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      year INTEGER,
      month INTEGER,
      quincena INTEGER,
      feriados TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS incidencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      corte_id INTEGER,
      employeeCode TEXT,
      employeeName TEXT,
      cedula TEXT,
      cargo TEXT,
      originalSucursal TEXT,
      mappedSucursal TEXT,
      incidenceType TEXT,
      value REAL,
      dateString TEXT,
      originalStatus TEXT,
      FOREIGN KEY(corte_id) REFERENCES cortes(id) ON DELETE CASCADE
    )
  `);
});

// Helpers para base de datos con Promesas
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

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
    await dbRun('BEGIN TRANSACTION');

    const result = await dbRun(
      'INSERT INTO cortes (filename, year, month, quincena, feriados) VALUES (?, ?, ?, ?, ?)',
      [filename || 'Cálculo Manual', year, month, quincena, JSON.stringify(feriados || [])]
    );
    const corteId = result.lastID;

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
      await dbRun(
        `INSERT INTO incidencias (
          corte_id, employeeCode, employeeName, cedula, cargo,
          originalSucursal, mappedSucursal, incidenceType, value, dateString, originalStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          corteId,
          item.employeeCode,
          item.employeeName,
          item.cedula,
          item.cargo,
          item.originalSucursal,
          item.sucursal,
          item.incidenceType,
          item.value,
          item.dateString,
          item.originalStatus
        ]
      );
    }

    await dbRun('COMMIT');
    res.status(201).json({ success: true, id: corteId });
  } catch (err) {
    await dbRun('ROLLBACK').catch(() => {});
    console.error('Error al guardar corte:', err);
    res.status(500).json({ error: 'Error interno al guardar los registros: ' + err.message });
  }
});

// Obtener todos los cortes históricos (resumen)
app.get('/api/cortes', requireAuth, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT c.id, c.filename, c.year, c.month, c.quincena, c.feriados, c.created_at,
             (SELECT COUNT(*) FROM incidencias WHERE corte_id = c.id) as total_registros
      FROM cortes c
      ORDER BY c.created_at DESC
    `);
    
    // Parsear feriados en cada fila
    const formattedRows = rows.map(row => ({
      ...row,
      feriados: JSON.parse(row.feriados || '[]')
    }));

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
    const corte = await dbGet('SELECT * FROM cortes WHERE id = ?', [id]);
    if (!corte) {
      return res.status(404).json({ error: 'Registro de corte no encontrado.' });
    }

    corte.feriados = JSON.parse(corte.feriados || '[]');

    const incidencias = await dbAll('SELECT * FROM incidencias WHERE corte_id = ?', [id]);
    res.json({ ...corte, incidencias });
  } catch (err) {
    console.error('Error al obtener detalles del corte:', err);
    res.status(500).json({ error: 'Error al obtener los detalles del corte: ' + err.message });
  }
});

// Eliminar un corte histórico
app.delete('/api/cortes/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM cortes WHERE id = ?', [id]);
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

// Obtener IPs locales de red
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`SERVIDOR INICIADO CORRECTAMENTE EN EL PUERTO ${PORT}`);
  console.log('========================================================');
  console.log(`Local:           http://localhost:${PORT}`);
  
  const localIPs = getLocalIPs();
  if (localIPs.length > 0) {
    console.log('En la red local:');
    localIPs.forEach((ip) => {
      console.log(`                 http://${ip}:${PORT}`);
    });
  } else {
    console.log('No se detectaron otras interfaces de red activa.');
  }
  console.log('========================================================');
});
