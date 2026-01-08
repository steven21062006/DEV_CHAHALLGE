import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
// Aquí importamos solo lo que vamos a usar
import { Leaf, User, Recycle, LogOut, QrCode, MapPin, AlertTriangle, Camera, Barcode } from 'lucide-react';
import './style.css';

// --- CONFIGURACIÓN DE RED ---
const API_URL = 'http://10.104.117.77:4000'; // Nueva IP de tu Hotspot

// --- INTERFACES ---
interface Usuario {
  id_usuario: number;
  nombre: string;
  puntos_actuales: number;
}

interface Material {
  id_material: number;
  nombre: string;
  puntos_por_kg: number;
}

interface MensajeEstado {
  texto: string;
  tipo: 'error' | 'success' | 'info' | '';
}

// --- FÓRMULA DE HAVERSINE ---
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d * 1000; 
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function App() {
  // --- ESTADOS ---
  const [user, setUser] = useState<Usuario | null>(null);
  const [emailInput, setEmailInput] = useState<string>('');
  const [materiales, setMateriales] = useState<Material[]>([]);
  
  // Estados de control de flujo
  const [modoEscaneoBasurero, setModoEscaneoBasurero] = useState(false);
  const [modoEscaneoProducto, setModoEscaneoProducto] = useState(false);
  const [basureroValidado, setBasureroValidado] = useState(false);
  const [distanciaActual, setDistanciaActual] = useState<number | null>(null);

  // Historial local para evitar fraudes
  const [codigosUsados, setCodigosUsados] = useState<string[]>([]);
  const [fotosUsadas, setFotosUsadas] = useState<string[]>([]);

  // Formulario
  const [form, setForm] = useState({ 
    materialId: '', 
    peso: '', 
    marca: '', 
    codigoBarras: '', 
    fotoNombre: '' 
  });
  
  const [mensaje, setMensaje] = useState<MensajeEstado>({ texto: '', tipo: '' });

  useEffect(() => {
    axios.get(`${API_URL}/api/materiales`)
      .then(res => setMateriales(res.data))
      .catch(err => console.error("Error backend:", err));
  }, []);

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/login`, { email: emailInput });
      setUser(res.data);
      setMensaje({ texto: '', tipo: '' });
    } catch (err) {
      setMensaje({ texto: 'Usuario no encontrado', tipo: 'error' });
    }
  };

  // --- 1. ESCANEO DE BASURERO ---
  const handleScanBasurero = (result: any) => {
    if (result) {
      try {
        const rawValue = result[0]?.rawValue;
        if (!rawValue) return;
        const dataBasurero = JSON.parse(rawValue);
        
        if (!dataBasurero.lat || !dataBasurero.lng) {
          setMensaje({ texto: 'QR inválido.', tipo: 'error' });
          setModoEscaneoBasurero(false);
          return;
        }

        if (!navigator.geolocation) {
          setMensaje({ texto: 'GPS no soportado.', tipo: 'error' });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const metros = getDistanceFromLatLonInMeters(
              position.coords.latitude, position.coords.longitude, 
              dataBasurero.lat, dataBasurero.lng
            );
            setDistanciaActual(Math.round(metros));

            if (metros <= 20) { 
              setBasureroValidado(true);
              setModoEscaneoBasurero(false);
              setMensaje({ texto: `Basurero verificado (${Math.round(metros)}m).`, tipo: 'success' });
            } else {
              setModoEscaneoBasurero(false);
              setMensaje({ texto: `Estás lejos (${Math.round(metros)}m). Acércate.`, tipo: 'error' });
            }
          },
          (error) => {
            // CORRECCIÓN: Aquí usamos la variable 'error' para que TS no se queje
            console.error("Error GPS:", error);
            setMensaje({ texto: 'Error de GPS. Verifica permisos.', tipo: 'error' });
            setModoEscaneoBasurero(false);
          }
        );
      } catch (error) {
        console.error(error); // Usamos error aquí también
        setMensaje({ texto: 'Error leyendo QR Basurero.', tipo: 'error' });
        setModoEscaneoBasurero(false);
      }
    }
  };

  // --- 2. ESCANEO DE PRODUCTO ---
  const handleScanProducto = (result: any) => {
    if (result) {
      const codigo = result[0]?.rawValue;
      if (codigo) {
        if (codigosUsados.includes(codigo)) {
          setMensaje({ texto: '¡ALERTA! Este producto ya fue escaneado.', tipo: 'error' });
          setModoEscaneoProducto(false);
          return;
        }
        setForm({ ...form, codigoBarras: codigo });
        setModoEscaneoProducto(false);
        setMensaje({ texto: 'Código capturado.', tipo: 'success' });
      }
    }
  };

  // --- 3. FOTO ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileHash = `${file.name}-${file.size}`;
      
      if (fotosUsadas.includes(fileHash)) {
        setMensaje({ texto: 'Imagen duplicada. Toma una nueva.', tipo: 'error' });
        e.target.value = ''; 
        return;
      }
      setForm({ ...form, fotoNombre: fileHash });
      setMensaje({ texto: 'Foto cargada correctamente.', tipo: 'success' });
    }
  };

  // --- ENVIAR ---
  const handleReciclar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.materialId || !form.peso || !form.marca) {
      setMensaje({ texto: 'Falta peso, material o marca.', tipo: 'error' });
      return;
    }
    if (!form.codigoBarras) {
      setMensaje({ texto: 'Escanea el código de barras.', tipo: 'error' });
      return;
    }
    if (!form.fotoNombre) {
      setMensaje({ texto: 'Toma la foto de evidencia.', tipo: 'error' });
      return;
    }

    try {
      await axios.post(`${API_URL}/api/reciclar`, {
        id_usuario: user!.id_usuario,
        id_material: form.materialId,
        peso: form.peso,
        detalles_extra: { 
          marca: form.marca,
          barcode: form.codigoBarras,
          foto_hash: form.fotoNombre
        }
      });
      
      const userRes = await axios.get(`${API_URL}/api/usuario/${user!.id_usuario}`);
      setUser(userRes.data);
      
      setCodigosUsados([...codigosUsados, form.codigoBarras]);
      setFotosUsadas([...fotosUsadas, form.fotoNombre]);

      setMensaje({ texto: '¡Reciclaje verificado!', tipo: 'success' });
      
      setForm({ materialId: '', peso: '', marca: '', codigoBarras: '', fotoNombre: '' });
      setBasureroValidado(false);
      setDistanciaActual(null);

    } catch (err: any) {
      setMensaje({ texto: 'Error guardando datos.', tipo: 'error' });
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="card login-card">
          <Leaf size={60} color="#059669" style={{marginBottom: 20}} />
          <h1 style={{color: '#1e293b'}}>EcoTrace PUCE</h1>
          <form onSubmit={handleLogin}>
            <input className="input-field" placeholder="Correo institucional" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
            <button className="btn-primary">Ingresar</button>
          </form>
          {mensaje.texto && <p style={{color: 'red', marginTop: 10}}>{mensaje.texto}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h2>Hola, {user.nombre}</h2>
          {/* CORRECCIÓN: Usamos el icono User aquí */}
          <span className="user-badge"><User size={14}/> Estudiante</span>
        </div>
        <div className="points-display">{user.puntos_actuales} <small>pts</small></div>
      </div>

      {mensaje.texto && (
        <div className={`msg-box msg-${mensaje.tipo}`}>
          {mensaje.tipo === 'error' ? <AlertTriangle size={20}/> : <MapPin size={20}/>}
          {mensaje.texto}
        </div>
      )}

      {!basureroValidado ? (
        <div className="card" style={{textAlign: 'center'}}>
          {/* CORRECCIÓN: Usamos el icono QrCode aquí */}
          <h3><QrCode size={24} style={{verticalAlign: 'middle'}}/> 1. Validar Ubicación</h3>
          <p style={{color: '#64748b'}}>Escanea el QR del basurero para empezar.</p>
          
          {modoEscaneoBasurero ? (
            <div className="scanner-wrapper">
              <Scanner onScan={handleScanBasurero} />
              <button onClick={() => setModoEscaneoBasurero(false)} className="btn-logout">Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setModoEscaneoBasurero(true)} className="btn-primary">Escanear Basurero</button>
          )}
        </div>
      ) : (
        <div className="card">
          <h3 className="card-title"><Recycle color="#10b981"/> 2. Registrar Botella</h3>
          <div style={{fontSize: 12, color: '#059669', marginBottom: 15}}><MapPin size={12}/> Ubicación OK ({distanciaActual}m)</div>
          <hr className="divider" />
          
          <form onSubmit={handleReciclar}>
            <label className="label">Material:</label>
            <select className="input-field" value={form.materialId} onChange={e => setForm({...form, materialId: e.target.value})}>
              <option value="">Seleccione...</option>
              {materiales.map(m => <option key={m.id_material} value={m.id_material}>{m.nombre}</option>)}
            </select>

            <div style={{display: 'flex', gap: 10}}>
              <div style={{flex: 1}}>
                <label className="label">Peso (Kg):</label>
                <input type="number" step="0.01" className="input-field" placeholder="0.05" value={form.peso} onChange={e => setForm({...form, peso: e.target.value})} />
              </div>
              <div style={{flex: 1}}>
                <label className="label">Marca:</label>
                <input type="text" className="input-field" placeholder="Ej. Coca-Cola" value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} />
              </div>
            </div>

            <label className="label">Código de Barras:</label>
            {modoEscaneoProducto ? (
               <div className="scanner-wrapper" style={{marginBottom: 15}}>
                 <p style={{fontSize: 12}}>Escanea el código de la botella</p>
                 <Scanner onScan={handleScanProducto} formats={['qr_code', 'ean_13', 'code_128', 'upc_a']} />
                 <button type="button" onClick={() => setModoEscaneoProducto(false)} className="btn-logout">Cerrar</button>
               </div>
            ) : (
               <div style={{display: 'flex', gap: 10, marginBottom: 15}}>
                 <input className="input-field" disabled value={form.codigoBarras || "Pendiente de escaneo..."} style={{backgroundColor: '#f1f5f9'}} />
                 <button type="button" onClick={() => setModoEscaneoProducto(true)} className="btn-primary" style={{width: 'auto'}}><Barcode/></button>
               </div>
            )}

            {/* CORRECCIÓN: Agregamos icono de Camera al label */}
            <label className="label" style={{display: 'flex', alignItems: 'center', gap: 5}}>
              <Camera size={16}/> Foto de Evidencia:
            </label>
            <div style={{marginBottom: 20}}>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleFileChange} 
                className="input-field" 
                style={{padding: 10}}
              />
              {form.fotoNombre && <small style={{color: 'green'}}>Foto lista: {form.fotoNombre.substring(0, 15)}...</small>}
            </div>

            <button className="btn-primary" type="submit">Confirmar y Ganar Puntos</button>
          </form>
        </div>
      )}

      <button onClick={() => setUser(null)} className="btn-logout"><LogOut size={16}/> Salir</button>
    </div>
  );
}

export default App;