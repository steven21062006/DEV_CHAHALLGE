import express from 'express';
import cors from 'cors';
import pg from 'pg';
import mongoose from 'mongoose';
import multer from 'multer';       
import PDFDocument from 'pdfkit';  
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){ fs.mkdirSync(uploadsDir); }

const app = express();
const port = 4000;


app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 2. CONFIGURACIÓN MULTER (FOTOS) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { 
        // Evitar nombres duplicados usando timestamp
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

// --- 3. BASE DE DATOS SQL (PostgreSQL) ---
const { Pool } = pg;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ecotrace_db', 
    password: '2006', 
    port: 5432,
});

// --- 4. BASE DE DATOS NOSQL (MongoDB - Auditoría) ---
mongoose.connect('mongodb://localhost:27017/ecotrace_logs')
    .then(() => console.log('✅ Mongo Connected (Auditoría)'))
    .catch(err => console.error('❌ Mongo Error:', err));

const Log = mongoose.model('Log', new mongoose.Schema({ 
    evento: String, 
    fecha: { type: Date, default: Date.now }, 
    usuario_id: Number, 
    detalles: Object 
}));



// --- AUTENTICACIÓN ---

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(401).json({ error: 'Credenciales incorrectas' });
        }
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Error de servidor' }); 
    }
});

// Registro de Empresas (NUEVO)
app.post('/api/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        // Verifica si ya existe
        const check = await pool.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
        if (check.rows.length > 0) return res.status(400).json({ error: 'El correo ya existe' });

        // Inserta como rol 
        const result = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, 'estudiante') RETURNING *",
            [nombre, email, password]
        );
        
        await Log.create({ evento: 'NUEVA_EMPRESA_REGISTRADA', usuario_id: result.rows[0].id_usuario, detalles: { email } });
        res.json(result.rows[0]);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Error al registrar empresa' }); 
    }
});

// --- OPERACIONES ---

// Enviar Reciclaje + Foto
app.post('/api/reciclar', upload.single('evidencia'), async (req, res) => {
    const { id_usuario, id_material, peso } = req.body;
    const evidenciaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        // Llama al Store Procedure que deja el estado en "Pendiente"
        await pool.query('CALL sp_registrar_reciclaje($1, $2, $3, $4)', 
            [id_usuario, id_material, peso, evidenciaUrl]);
        
        await Log.create({ 
            evento: 'SOLICITUD_ENVIADA', 
            usuario_id: id_usuario, 
            detalles: { material: id_material, peso, evidencia: evidenciaUrl } 
        });

        res.json({ message: 'Solicitud enviada a auditoría.' });
    } catch (error) { 
        console.error("Error SQL:", error);
        res.status(500).json({ error: 'Error procesando solicitud' }); 
    }
});

// Obtener Materiales
app.get('/api/materiales', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM materiales ORDER BY id_material ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Obtener Usuario 
app.get('/api/usuario/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Usuario no encontrado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- DATOS EN TIEMPO REAL ---

// Ranking (Top 10 Empresas)
app.get('/api/ranking', async (req, res) => {
    try {
        const result = await pool.query("SELECT nombre, puntos_actuales FROM usuarios WHERE rol='estudiante' ORDER BY puntos_actuales DESC LIMIT 10");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Error cargando ranking' }); }
});

// Historial Reciente 
app.get('/api/historial', async (req, res) => {
    try {
        const query = `
            SELECT d.id_deposito, u.nombre as usuario, m.nombre as material, d.peso_kg, d.fecha_registro, d.estado
            FROM depositos d
            JOIN usuarios u ON d.id_usuario = u.id_usuario
            JOIN materiales m ON d.id_material = m.id_material
            ORDER BY d.fecha_registro DESC LIMIT 5
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Error cargando historial' }); }
});

// --- PANEL DE ADMINISTRADOR ---

// Ver Pendientes
app.get('/api/admin/pendientes', async (req, res) => {
    try {
        const query = `
            SELECT d.id_deposito, u.nombre as usuario, m.nombre as material, d.peso_kg, d.evidencia_url, d.fecha_registro 
            FROM depositos d 
            JOIN usuarios u ON d.id_usuario = u.id_usuario 
            JOIN materiales m ON d.id_material = m.id_material 
            WHERE d.estado = 'Pendiente'
            ORDER BY d.fecha_registro ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Aprobar Depósito 
app.post('/api/admin/aprobar', async (req, res) => {
    const { id_deposito, id_admin } = req.body;
    try {
        await pool.query('CALL sp_aprobar_deposito($1, $2)', [id_deposito, id_admin]);
        
        await Log.create({ evento: 'ADMIN_APROBADO', usuario_id: id_admin, detalles: { deposito: id_deposito } });
        res.json({ message: 'Aprobado correctamente' });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// Rechazar Depósito
app.post('/api/admin/rechazar', async (req, res) => {
    const { id_deposito } = req.body;
    try {
        await pool.query("UPDATE depositos SET estado = 'Rechazado' WHERE id_deposito = $1", [id_deposito]);
        res.json({ message: 'Rechazado correctamente' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generar Reporte PDF
app.get('/api/admin/reporte-pdf', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.nombre, m.nombre as material, d.peso_kg, d.fecha_registro 
            FROM depositos d 
            JOIN usuarios u ON d.id_usuario = u.id_usuario 
            JOIN materiales m ON d.id_material = m.id_material 
            WHERE d.estado = 'Aprobado' 
            ORDER BY d.fecha_registro DESC
        `);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_auditoria.pdf');
        
        doc.pipe(res);

        // Encabezado PDF
        doc.fontSize(20).text('Reporte de Auditoría EcoTrace', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Fecha de Emisión: ${new Date().toLocaleString()}`);
        doc.moveDown();
        doc.text('---------------------------------------------------------', { align: 'center' });
        doc.moveDown();

        // Tabla de datos
        result.rows.forEach((row, i) => {
            doc.fontSize(12).text(`${i + 1}. [${new Date(row.fecha_registro).toLocaleDateString()}] ${row.nombre}`);
            doc.fontSize(10).text(`   Material: ${row.material} | Peso: ${row.peso_kg} Kg`);
            doc.moveDown(0.5);
        });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generando PDF');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor EcoTrace v2.0 corriendo en http://localhost:${port}`);
});