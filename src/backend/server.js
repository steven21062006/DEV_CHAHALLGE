

import express from 'express';
import cors from 'cors';
import pg from 'pg';
import mongoose from 'mongoose';


const { Pool } = pg;

const app = express();
const port = 4000;


app.use(cors());
app.use(express.json());


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ecotrace_db', 
    password: '2006', 
    port: 5432,
});


mongoose.connect('mongodb://localhost:27017/ecotrace_logs')
    .then(() => console.log('Mongo Connected (Auditoría Activa)'))
    .catch(err => console.error('Mongo Error:', err));


const LogSchema = new mongoose.Schema({
    evento: String, 
    fecha: { type: Date, default: Date.now },
    usuario_id: Number,
    ip: String,
    detalles: Object 
});
const Log = mongoose.model('Log', LogSchema);


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
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.post('/api/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        
        const check = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado.' });
        }
        
        
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING *',
            [nombre, email, password]
        );

        
        await Log.create({
            evento: 'NUEVO_USUARIO_REGISTRADO',
            usuario_id: result.rows[0].id_usuario,
            
            ip: req.ip || '127.0.0.1',
            detalles: { email: email }
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});


app.get('/api/ranking', async (req, res) => {
    try {
        const result = await pool.query('SELECT nombre, puntos_actuales FROM usuarios ORDER BY puntos_actuales DESC LIMIT 100');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener ranking' });
    }
});


app.get('/api/materiales', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM materiales ORDER BY id_material ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener materiales' });
    }
});


app.get('/api/usuario/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});


app.get('/api/historial', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          t.id, 
          u.nombre as usuario, 
          m.nombre as material, 
          t.peso, 
          t.fecha 
        FROM transacciones t
        JOIN usuarios u ON t.id_usuario = u.id_usuario
        JOIN materiales m ON t.id_material = m.id_material
        ORDER BY t.fecha DESC 
        LIMIT 5
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener historial' });
    }
});


app.post('/api/reciclar', async (req, res) => {
    const { id_usuario, id_material, peso } = req.body;
    const ip = req.ip || '127.0.0.1';

    try {
        
        await pool.query(
            'INSERT INTO transacciones (id_usuario, id_material, peso) VALUES ($1, $2, $3)',
            [id_usuario, id_material, peso]
        );

        
        const matRes = await pool.query('SELECT puntos_por_kg FROM materiales WHERE id_material = $1', [id_material]);
        
        
        if (matRes.rows.length === 0) {
            return res.status(400).json({ error: 'Material no encontrado' });
        }

        const puntosGanados = Math.round(matRes.rows[0].puntos_por_kg * peso);

        await pool.query('UPDATE usuarios SET puntos_actuales = puntos_actuales + $1 WHERE id_usuario = $2', [puntosGanados, id_usuario]);

        
        await Log.create({
            evento: 'DEPOSITO_MANUAL_EMPRESARIAL',
            usuario_id: id_usuario,
            ip: ip,
            detalles: { 
                material_id: id_material, 
                peso_kg: peso,
                puntos_calculados: puntosGanados
            }
        });

        res.json({ message: 'Depósito registrado exitosamente y auditado.', puntos: puntosGanados });

    } catch (error) {
        console.error(error);
        
        
        try {
            await Log.create({
                evento: 'ERROR_DEPOSITO',
                usuario_id: id_usuario,
                detalles: { error: error.message }
            });
        } catch(e) { console.log("Error guardando log de error en Mongo"); }

        res.status(500).json({ error: 'Error procesando la transacción' });
    }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor Empresarial Híbrido corriendo en http://localhost:${port}`);
});