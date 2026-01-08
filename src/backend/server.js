import express from 'express';
import pg from 'pg'; 
import mongoose from 'mongoose';
import cors from 'cors';

// Extraemos Pool de la librería pg
const { Pool } = pg;

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. CONFIGURACIÓN POSTGRESQL (Transaccional) ---
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ecotrace_db', 
    password: '21062006', 
    port: 5432,
});

// --- 2. CONFIGURACIÓN MONGODB (Auditoría) ---
try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ecotrace_logs');
    console.log('Mongo Connected');
} catch (err) {
    console.error('Mongo Error:', err);
}

// Esquema flexible para Logs
const LogSchema = new mongoose.Schema({
    evento: String,
    fecha: { type: Date, default: Date.now },
    usuario_id: Number,
    ip: String,
    detalles: Object 
});
const Log = mongoose.model('Log', LogSchema);

// --- RUTAS API ---

// A. LOGIN
app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// B. MATERIALES
app.get('/api/materiales', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM materiales');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// C. USUARIO
app.get('/api/usuario/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// D. REGISTRAR RECICLAJE (ACTUALIZADO)
app.post('/api/reciclar', async (req, res) => {
    // CAMBIO: Ahora recibimos 'detalles_extra' que envía el frontend (marca, barcode, foto)
    const { id_usuario, id_material, peso, detalles_extra } = req.body;
    const ip = req.ip;

    try {
        // 1. Postgres (Transacción de Puntos)
        await pool.query('CALL sp_registrar_reciclaje($1, $2, $3)', 
            [id_usuario, id_material, peso]);

        // 2. MongoDB (Auditoría COMPLETA)
        // Guardamos todo: material, peso, marca, código de barras y hash de la foto
        await Log.create({
            evento: 'DEPOSITO_EXITOSO',
            usuario_id: id_usuario,
            ip: ip,
            detalles: { 
                material: id_material, 
                peso_registrado: peso,
                info_adicional: detalles_extra || {} // Guardamos los datos nuevos aquí
            }
        });

        res.json({ message: 'Procesado correctamente' });

    } catch (error) {
        // Log de Error
        try {
            await Log.create({
                evento: 'ERROR_TRANSACCION',
                usuario_id: id_usuario,
                detalles: { error: error.message }
            });
        } catch (mongoErr) {
            console.error("Error log:", mongoErr);
        }
        res.status(500).json({ error: error.message });
    }
});

// E. REPORTE
app.get('/api/reporte', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vw_impacto_ambiental');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 4000;
// CAMBIO IMPORTANTE: Agregamos '0.0.0.0' para que el celular te pueda ver
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT} y aceptando conexiones externas`);
});