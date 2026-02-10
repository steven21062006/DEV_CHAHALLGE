import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LogOut, CheckCircle, Info, Sprout, ShieldCheck, 
  ArrowRight, Trophy, Medal, Award, Target, Camera, 
  FileCheck, XCircle, Download, Building, Users, Clock,
  BarChart2, Lock, Globe
} from 'lucide-react';

// Estilos CSS integrados para evitar errores de importación
const styles = `
:root {
  --primary: #15803d;
  --primary-dark: #14532d;
  --secondary: #ca8a04;
  --bg: #f8fafc;
  --text: #334155;
  --white: #ffffff;
}
body { margin: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.split-screen { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; min-height: 90vh; align-items: center; }
.left-panel { padding-right: 20px; animation: fadeIn 0.8s ease-out; }
.right-panel { display: flex; justify-content: center; animation: slideIn 0.8s ease-out; }
.brand-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 30px; }
.hero-title { font-size: 3.5rem; line-height: 1.1; color: var(--primary-dark); font-weight: 800; letter-spacing: -1px; }
.login-card { background: var(--white); padding: 40px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); width: 100%; max-width: 420px; border: 1px solid rgba(255,255,255,0.5); }
.auth-tabs { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; margin-bottom: 24px; }
.auth-tabs button { flex: 1; padding: 10px; border: none; background: transparent; color: #64748b; font-weight: 600; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
.auth-tabs button.active { background: var(--white); color: var(--secondary); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9rem; color: #475569; }
.input-field { width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 20px; font-size: 1rem; transition: all 0.2s; box-sizing: border-box; background: #f8fafc; }
.input-field:focus { outline: none; border-color: var(--secondary); background: white; box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.1); }
.btn-primary { width: 100%; background: var(--primary); color: white; padding: 16px; border: none; border-radius: 10px; font-weight: 600; font-size: 1rem; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(21, 128, 61, 0.3); }
.btn-primary:hover { background: #166534; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(21, 128, 61, 0.4); }
.dashboard-layout { display: grid; grid-template-columns: 320px 1fr; gap: 30px; animation: fadeIn 0.5s ease; }
.profile-panel { background: linear-gradient(135deg, #14532d 0%, #166534 100%); color: white; padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px -5px rgba(20, 83, 45, 0.4); }
.profile-avatar { width: 90px; height: 90px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; border: 2px solid rgba(255,255,255,0.2); backdrop-filter: blur(4px); }
.points-hero { font-size: 3rem; font-weight: 800; margin: 10px 0; text-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.btn-secondary { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; font-weight: 500; }
.btn-secondary:hover { background: rgba(255,255,255,0.2); transform: translateY(-1px); }
.card { background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
.action-card { background: white; padding: 35px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
.history-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.history-table th { text-align: left; padding: 16px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; background: #f8fafc; font-size: 0.9rem; }
.history-table th:first-child { border-top-left-radius: 12px; }
.history-table th:last-child { border-top-right-radius: 12px; }
.history-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
.status-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px); animation: fadeIn 0.3s; }
.modal-content { background: white; padding: 40px; border-radius: 24px; width: 90%; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid #e2e8f0; }
.feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
.feature-item { background: rgba(255,255,255,0.7); padding: 18px; border-radius: 16px; display: flex; align-items: center; gap: 15px; border: 1px solid rgba(255,255,255,0.8); transition: transform 0.2s; }
.feature-item:hover { transform: translateY(-2px); background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.stat-bar { border-top: 1px solid rgba(20, 83, 45, 0.15); padding-top: 25px; display: flex; gap: 50px; }
@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@media (max-width: 900px) { 
  .split-screen { grid-template-columns: 1fr; gap: 40px; padding-top: 40px; } 
  .dashboard-layout { grid-template-columns: 1fr; } 
  .hero-title { font-size: 2.5rem; }
  .stat-bar { gap: 20px; flex-wrap: wrap; }
}
`;

const API_URL = 'http://localhost:4000'; 

// Interfaces
interface Usuario { 
    id_usuario: number; 
    nombre: string; 
    puntos_actuales: number; 
    rol: 'admin' | 'estudiante'; 
}
interface RankingItem { nombre: string; puntos_actuales: number; }
interface PendienteItem { 
    id_deposito: number; 
    usuario: string; 
    material: string; 
    peso_kg: string; 
    evidencia_url: string; 
    fecha_registro: string; 
}
interface HistorialItem { 
    id_deposito: number; 
    usuario: string; 
    material: string; 
    peso_kg: number; 
    fecha_registro: string; 
    estado: string; 
}

function App() {
  const [view, setView] = useState<'home' | 'dashboard' | 'ranking'>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [user, setUser] = useState<Usuario | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [pendientes, setPendientes] = useState<PendienteItem[]>([]);
  const [historial, setHistorial] = useState<HistorialItem[]>([]); 

  // Inputs Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState(''); 
  
  // Formulario Reciclaje
  const [formReciclaje, setFormReciclaje] = useState({ materialId: '', peso: '' });
  const [file, setFile] = useState<File | null>(null);

  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [showTerms, setShowTerms] = useState(false); 

  // --- EFECTOS ---
  useEffect(() => {
    // Inyectar estilos
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    axios.get(`${API_URL}/api/materiales`)
        .then((res: any) => setMateriales(res.data))
        .catch(console.error);

    if (view === 'home') {
        setTimeout(() => setShowTerms(true), 1000);
    }

    const intervalo = setInterval(() => {
        if (view === 'dashboard' || view === 'ranking') {
            cargarHistorialEnVivo();
            if (user?.rol === 'admin') cargarPendientesAdmin();
            else refrescarUsuario();
        }
    }, 3000);

    return () => {
        document.head.removeChild(styleSheet);
        clearInterval(intervalo); 
    };
  }, [view, user]);

  // --- CARGA DE DATOS ---
  const cargarHistorialEnVivo = async () => {
      try { const res = await axios.get(`${API_URL}/api/historial`); setHistorial(res.data); } catch(e){}
  };

  const refrescarUsuario = async () => {
      if(user?.id_usuario) {
          try { 
              const res = await axios.get(`${API_URL}/api/usuario/${user.id_usuario}`); 
              setUser(prev => prev ? {...prev, puntos_actuales: res.data.puntos_actuales} : null); 
          } catch(e){}
      }
  };

  const cargarPendientesAdmin = async () => {
      try { const res = await axios.get(`${API_URL}/api/admin/pendientes`); setPendientes(res.data); } catch (err) {}
  };

  const cargarRanking = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/ranking`);
        setRanking(res.data);
        setView('ranking');
      } catch (err) { console.error(err); }
  };

  // --- AUTH ---
  const handleLogin = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      try { 
          const res = await axios.post(`${API_URL}/api/login`, { email, password }); 
          setUser(res.data); 
          setView('dashboard'); 
          setMensaje({ texto: '', tipo: '' }); 
          if(res.data.rol === 'admin') cargarPendientesAdmin();
      } catch (err) { setMensaje({ texto: 'Credenciales incorrectas.', tipo: 'error' }); } 
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await axios.post(`${API_URL}/api/register`, { nombre, email, password });
          setUser(res.data);
          setView('dashboard');
          alert("Empresa registrada exitosamente.");
      } catch (err: any) { setMensaje({ texto: 'Error: El correo ya existe.', tipo: 'error' }); }
  };

  // --- OPERACIONES ---
  const handleReciclar = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!formReciclaje.materialId || !formReciclaje.peso || !file) { 
          setMensaje({ texto: 'Falta seleccionar material, peso o foto.', tipo: 'error' }); return; 
      } 
      const formData = new FormData();
      formData.append('id_usuario', String(user?.id_usuario));
      formData.append('id_material', formReciclaje.materialId);
      formData.append('peso', formReciclaje.peso);
      formData.append('evidencia', file);

      try { 
          await axios.post(`${API_URL}/api/reciclar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); 
          setMensaje({ texto: 'Enviado a auditoría correctamente.', tipo: 'success' }); 
          setFormReciclaje({ materialId: '', peso: '' }); setFile(null);
          cargarHistorialEnVivo();
      } catch (err) { setMensaje({ texto: 'Error al procesar solicitud', tipo: 'error' }); } 
  };

  const handleAprobar = async (id: number) => { 
      try { await axios.post(`${API_URL}/api/admin/aprobar`, { id_deposito: id, id_admin: user?.id_usuario }); cargarPendientesAdmin(); } catch(e){ alert("Error"); } 
  };
  const handleRechazar = async (id: number) => { 
      if(confirm("¿Rechazar este depósito?")) { await axios.post(`${API_URL}/api/admin/rechazar`, { id_deposito: id }); cargarPendientesAdmin(); } 
  };

  // --- VISTA HOME (REDISEÑADA Y COMPLETA) ---
  if (view === 'home') {
    return (
        <div className="container">
            {showTerms && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{textAlign:'center', maxWidth: 400}}>
                        <ShieldCheck size={48} color="#ca8a04" style={{margin:'0 auto 15px auto'}}/>
                        <h2 style={{color: '#14532d', marginTop:0, marginBottom: 10}}>Política Corporativa</h2>
                        <p style={{color:'#4b5563', lineHeight:1.6, marginBottom: 25}}>Bienvenido a EcoTrace Enterprise. <br/>Al continuar, su empresa acepta la auditoría digital de residuos y el seguimiento de huella de carbono según la norma ISO 14001.</p>
                        <button className="btn-primary" onClick={() => setShowTerms(false)}>Aceptar y Continuar</button>
                    </div>
                </div>
            )}

            <div className="split-screen">
                {/* PANEL IZQUIERDO MEJORADO - LLENO DE INFORMACIÓN */}
                <div className="left-panel">
                    <div className="brand-logo">
                        <Sprout size={42} color="#ca8a04" strokeWidth={2.5}/>
                        <span style={{fontSize: '1.6rem', fontWeight: 800, color: '#14532d', letterSpacing:'-0.5px'}}>EcoTrace Enterprise</span>
                    </div>
                    
                    <h1 className="hero-title">
                        Certificación <br/> <span style={{color: '#ca8a04'}}>Inteligente</span> de Residuos.
                    </h1>
                    
                    <p style={{fontSize:'1.15rem', opacity:0.9, lineHeight: 1.6, marginBottom: 40, maxWidth: '600px', color: '#334155'}}>
                        La plataforma líder para empresas comprometidas con la sostenibilidad real. 
                        Digitalice sus procesos de reciclaje, obtenga reportes de impacto ambiental 
                        en tiempo real y cumpla con las normativas ISO 14001.
                    </p>
                    
                    {/* GRID DE CARACTERÍSTICAS */}
                    <div className="feature-grid">
                        <div className="feature-item">
                            <div style={{background:'#dcfce7', padding:10, borderRadius:10}}><CheckCircle size={24} color="#15803d"/></div>
                            <div>
                                <h4 style={{margin:0, color:'#14532d', fontSize:'1rem'}}>Auditoría Admin</h4>
                                <span style={{fontSize:'0.85rem', color:'#166534'}}>Validación 100% humana</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div style={{background:'#dcfce7', padding:10, borderRadius:10}}><Target size={24} color="#15803d"/></div>
                            <div>
                                <h4 style={{margin:0, color:'#14532d', fontSize:'1rem'}}>Metas ESG</h4>
                                <span style={{fontSize:'0.85rem', color:'#166534'}}>Cumplimiento corporativo</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div style={{background:'#dcfce7', padding:10, borderRadius:10}}><ShieldCheck size={24} color="#15803d"/></div>
                            <div>
                                <h4 style={{margin:0, color:'#14532d', fontSize:'1rem'}}>Data Segura</h4>
                                <span style={{fontSize:'0.85rem', color:'#166534'}}>Encriptación bancaria</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div style={{background:'#dcfce7', padding:10, borderRadius:10}}><Globe size={24} color="#15803d"/></div>
                            <div>
                                <h4 style={{margin:0, color:'#14532d', fontSize:'1rem'}}>Red Global</h4>
                                <span style={{fontSize:'0.85rem', color:'#166534'}}>Conexión multi-sede</span>
                            </div>
                        </div>
                    </div>

                    {/* BARRA DE ESTADÍSTICAS */}
                    <div className="stat-bar">
                        <div>
                            <span style={{display:'block', fontSize:'2rem', fontWeight:800, color:'#14532d'}}>+500</span>
                            <span style={{fontSize:'0.9rem', color:'#166534', fontWeight:600}}>Toneladas Gestionadas</span>
                        </div>
                        <div>
                            <span style={{display:'block', fontSize:'2rem', fontWeight:800, color:'#14532d'}}>24/7</span>
                            <span style={{fontSize:'0.9rem', color:'#166534', fontWeight:600}}>Soporte Activo</span>
                        </div>
                        <div>
                            <span style={{display:'block', fontSize:'2rem', fontWeight:800, color:'#14532d'}}>100%</span>
                            <span style={{fontSize:'0.9rem', color:'#166534', fontWeight:600}}>Trazabilidad</span>
                        </div>
                    </div>
                </div>

                {/* PANEL DERECHO (LOGIN) */}
                <div className="right-panel">
                    <div className="login-card">
                        <h2 style={{color:'#ca8a04', marginBottom:25, textAlign:'center', fontSize: '1.5rem'}}>
                            {authMode === 'login' ? 'Acceso Corporativo' : 'Registro de Empresa'}
                        </h2>
                        
                        <div className="auth-tabs">
                            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Iniciar Sesión</button>
                            <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Crear Cuenta</button>
                        </div>

                        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                            {authMode === 'register' && (
                                <>
                                    <label className="label">Razón Social / Nombre Empresa</label>
                                    <input className="input-field" type="text" placeholder="Ej. Industrias Verdes S.A." value={nombre} onChange={e => setNombre(e.target.value)} required />
                                </>
                            )}
                            <label className="label">Correo Corporativo</label>
                            <input className="input-field" type="email" placeholder="admin@empresa.com" value={email} onChange={e => setEmail(e.target.value)} required />
                            <label className="label">Contraseña</label>
                            <input className="input-field" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                            
                            <button className="btn-primary" style={{marginTop:10}}>
                                {authMode === 'login' ? 'Acceder al Panel' : 'Registrar Empresa'} <ArrowRight size={20} style={{marginLeft: 8}}/>
                            </button>
                        </form>
                        {mensaje.texto && <div style={{marginTop:20, color:mensaje.tipo==='error'?'#991b1b':'#166534', textAlign:'center', background:mensaje.tipo==='error'?'#fee2e2':'#dcfce7', padding:12, borderRadius:8, fontSize: '0.9rem', fontWeight: 500}}>{mensaje.texto}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // --- DASHBOARD (Admin & Empresa) ---
  return (
    <div className="container" style={{marginTop: 20}}>
      
      <div className="header" style={{background:'white', padding:'15px 25px', borderRadius: 16, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:25, boxShadow:'0 4px 20px rgba(0,0,0,0.03)', border:'1px solid #f1f5f9'}}>
         <div style={{display:'flex', alignItems:'center', gap:15}}>
             <div style={{background:'#f0fdf4', padding:10, borderRadius:12}}><Building size={28} color="#15803d"/></div>
             <div>
                 <h2 style={{margin:0, fontSize:'1.1rem', color:'#1e293b'}}>{user?.nombre}</h2>
                 <span style={{fontSize:'0.85rem', color:'#64748b'}}>{user?.rol === 'admin' ? 'Administrador del Sistema' : 'Cuenta Empresarial Verificada'}</span>
             </div>
         </div>
         <button onClick={() => {setUser(null); setView('home');}} className="btn-logout" style={{background:'#fff1f2', color:'#e11d48', border:'1px solid #fda4af', padding: '8px 16px', borderRadius: 8, cursor:'pointer', display:'flex', alignItems:'center', fontWeight:600}}>
            <LogOut size={18} style={{marginRight:8}}/> Salir
         </button>
      </div>

      {user?.rol === 'admin' ? (
          /* VISTA ADMIN */
          <div className="dashboard-layout" style={{gridTemplateColumns:'1fr'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h3 style={{margin:0, color:'#334155', fontSize:'1.5rem'}}>Panel de Auditoría</h3>
                <button onClick={() => window.open(`${API_URL}/api/admin/reporte-pdf`, '_blank')} style={{background:'#0ea5e9', color:'white', border:'none', padding:'12px 24px', borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontWeight:600, boxShadow:'0 4px 6px -1px rgba(14, 165, 233, 0.3)'}}>
                    <Download size={20}/> Descargar Reporte PDF
                </button>
              </div>
              
              <div className="card" style={{overflow:'hidden'}}>
                  <table className="history-table">
                      <thead><tr><th>Fecha</th><th>Empresa</th><th>Material</th><th>Peso</th><th>Evidencia</th><th>Dictamen</th></tr></thead>
                      <tbody>
                          {pendientes.length === 0 ? (
                              <tr><td colSpan={6} style={{textAlign:'center', padding:40, color:'#94a3b8'}}>No hay solicitudes pendientes de revisión.</td></tr>
                          ) : (
                              pendientes.map(p => (
                                  <tr key={p.id_deposito}>
                                      <td>{new Date(p.fecha_registro).toLocaleDateString()}</td>
                                      <td style={{fontWeight:600}}>{p.usuario}</td>
                                      <td><span className="status-badge" style={{background:'#f3f4f6', color:'#374151'}}>{p.material}</span></td>
                                      <td><strong>{p.peso_kg} Kg</strong></td>
                                      <td>
                                          {p.evidencia_url ? 
                                            <a href={`${API_URL}${p.evidencia_url}`} target="_blank" className="status-badge" style={{background:'#e0f2fe', color:'#0284c7', textDecoration:'none', display:'inline-flex', gap:6, padding: '6px 12px'}}>
                                                <FileCheck size={16}/> Ver Archivo
                                            </a> 
                                            : <span style={{color:'#ef4444'}}>Sin archivo</span>
                                          }
                                      </td>
                                      <td>
                                          <div style={{display:'flex', gap:10}}>
                                              <button onClick={() => handleAprobar(p.id_deposito)} style={{background:'#22c55e', color:'white', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontWeight:600}}><CheckCircle size={18}/> Aprobar</button>
                                              <button onClick={() => handleRechazar(p.id_deposito)} style={{background:'#ef4444', color:'white', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontWeight:600}}><XCircle size={18}/> Rechazar</button>
                                          </div>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      ) : (
          /* VISTA EMPRESA */
          <div className="dashboard-layout">
              {/* COLUMNA IZQUIERDA: Solo el perfil */}
              <div>
                  <div className="profile-panel">
                      <div className="profile-avatar">🏭</div>
                      <h2 style={{margin:'15px 0 5px 0', fontSize:'1.4rem'}}>{user?.nombre}</h2>
                      <p style={{margin:0, color:'#86efac', fontSize:'0.9rem', fontWeight:500}}>ID Corporativo: {user?.id_usuario}</p>
                      
                      <div style={{background:'rgba(0,0,0,0.2)', padding:20, borderRadius:16, marginTop:25, width:'100%', boxSizing:'border-box'}}>
                          <small style={{textTransform:'uppercase', letterSpacing:'1px', opacity:0.9, fontSize:'0.75rem', fontWeight:600}}>Eco-Puntos Certificados</small>
                          <div className="points-hero">{user?.puntos_actuales.toLocaleString()}</div>
                      </div>

                      <button className="btn-secondary" onClick={cargarRanking} style={{marginTop:20, width:'100%', justifyContent:'center', padding:14}}> 
                        <Trophy size={20}/> Ver Ranking Global
                      </button>
                  </div>
              </div>

              {/* COLUMNA DERECHA: Formulario + Actividad en la red debajo */}
              <div style={{display:'flex', flexDirection:'column', gap: 25}}>
                  <div className="action-card">
                      <h2 style={{margin:'0 0 8px 0', color:'#ca8a04', display:'flex', alignItems:'center', gap:12, fontSize:'1.6rem'}}>
                          <Camera size={32}/> Registrar Envío
                      </h2>
                      <p style={{margin:'0 0 30px 0', color:'#64748b', fontSize:'1rem'}}>Suba la evidencia fotográfica de la báscula para auditoría.</p>
                      
                      <form onSubmit={handleReciclar} style={{display:'grid', gap:25}}>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:25}}>
                              <div>
                                  <label className="label">Tipo de Material</label>
                                  <select className="input-field" value={formReciclaje.materialId} onChange={e => setFormReciclaje({...formReciclaje, materialId: e.target.value})} style={{height:52, background:'white'}}>
                                      <option value="">Seleccione...</option>
                                      {materiales.map((m: any) => <option key={m.id_material} value={m.id_material}>{m.nombre}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="label">Peso Neto (Kg)</label>
                                  <input type="number" step="0.01" className="input-field" placeholder="0.00" value={formReciclaje.peso} onChange={e => setFormReciclaje({...formReciclaje, peso: e.target.value})} />
                              </div>
                          </div>

                          <div>
                              <label className="label">Evidencia Digital</label>
                              <div style={{border:'2px dashed #cbd5e1', padding:40, borderRadius:16, textAlign:'center', cursor:'pointer', background: file ? '#f0fdf4' : '#f8fafc', borderColor: file ? '#86efac' : '#cbd5e1', transition:'all 0.2s', position:'relative'}}>
                                  <input 
                                      type="file" 
                                      accept="image/*"
                                      id="fileUpload"
                                      onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                      style={{display:'none'}}
                                  />
                                  <label htmlFor="fileUpload" style={{cursor:'pointer', position:'absolute', top:0, left:0, width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                                      {file ? (
                                          <div style={{color:'#15803d'}}>
                                              <FileCheck size={40} style={{marginBottom:10}}/>
                                              <div style={{fontWeight:600, fontSize:'1.1rem'}}>{file.name}</div>
                                              <div style={{fontSize:'0.9rem', opacity:0.8}}>Listo para subir</div>
                                          </div>
                                      ) : (
                                          <div style={{color:'#94a3b8'}}>
                                              <Camera size={40} style={{marginBottom:10}}/>
                                              <div style={{fontWeight:600, color:'#475569', fontSize:'1.1rem'}}>Haga clic para subir foto</div>
                                              <div style={{fontSize:'0.9rem'}}>JPG, PNG admitidos</div>
                                          </div>
                                      )}
                                  </label>
                              </div>
                          </div>

                          <button className="btn-primary" type="submit" style={{height:'60px', fontSize:'1.15rem', marginTop:15}}>
                              <ShieldCheck size={24} style={{marginRight:10}}/> Enviar a Auditoría
                          </button>
                      </form>
                      {mensaje.texto && <div style={{marginTop:25, padding:18, borderRadius:10, background:mensaje.tipo==='error'?'#fee2e2':'#dcfce7', color:mensaje.tipo==='error'?'#991b1b':'#166534', textAlign:'center', fontWeight:600}}>{mensaje.texto}</div>}
                  </div>

                  {/* AQUÍ SE MOVIÓ LA SECCIÓN DE ACTIVIDAD */}
                  <div className="card" style={{padding:0, overflow:'hidden'}}>
                      <div style={{padding:'15px 20px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:10}}>
                          <Clock size={18} color="#475569"/>
                          <h4 style={{margin:0, color:'#334155', fontSize:'0.95rem'}}>Actividad en la Red (Live)</h4>
                      </div>
                      <div style={{maxHeight:350, overflowY:'auto'}}>
                        {historial.map((h, i) => (
                            <div key={i} style={{padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                    <div style={{fontWeight:600, fontSize:'0.95rem', color:'#1e293b', marginBottom:4}}>{h.usuario}</div>
                                    <div style={{fontSize:'0.85rem', color:'#64748b', display:'flex', alignItems:'center', gap:6}}>
                                        <div style={{width:6, height:6, borderRadius:'50%', background:'#cbd5e1'}}></div>
                                        {new Date(h.fecha_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {h.material}
                                    </div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                    <div style={{fontWeight:700, color:'#15803d', fontSize:'1rem'}}>+{h.peso_kg} kg</div>
                                    <span style={{fontSize:'0.75rem', padding:'3px 8px', borderRadius:6, marginTop:4, display:'inline-block', background: h.estado==='Aprobado'?'#dcfce7':'#f3f4f6', color: h.estado==='Aprobado'?'#166534':'#64748b', fontWeight:600}}>
                                        {h.estado}
                                    </span>
                                </div>
                            </div>
                        ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {view === 'ranking' && (
           <div className="modal-overlay" onClick={() => setView('dashboard')}>
               <div className="modal-content" style={{maxWidth:600, padding: 0, overflow:'hidden'}} onClick={e => e.stopPropagation()}>
                   <div style={{textAlign:'center', padding: '30px 30px 20px 30px', background:'#fefce8'}}>
                       <Trophy size={60} color="#ca8a04" fill="#fef08a"/>
                       <h2 style={{color:'#854d0e', margin:'15px 0 5px 0'}}>Ranking de Sostenibilidad</h2>
                       <p style={{color:'#854d0e', opacity:0.8, margin:0}}>Empresas líderes en gestión de residuos</p>
                   </div>
                   
                   <div className="ranking-list" style={{maxHeight:450, overflowY:'auto', padding:'20px 30px'}}>
                        {ranking.map((r: any, index: number) => {
                            let medal = null;
                            if(index===0) medal = "🥇";
                            if(index===1) medal = "🥈";
                            if(index===2) medal = "🥉";

                            return (
                                <div key={index} className="ranking-item" style={{background: index < 3 ? '#fffbeb' : 'white', border: index < 3 ? '1px solid #fcd34d' : '1px solid #e2e8f0', padding:'15px 20px', borderRadius:12, marginBottom:12, display:'flex', alignItems:'center', boxShadow: index < 3 ? '0 4px 6px -1px rgba(251, 191, 36, 0.2)' : 'none'}}>
                                    <span style={{fontWeight:800, width:40, fontSize:'1.4rem'}}>{medal || <span style={{fontSize:'1rem', color:'#94a3b8'}}>#{index+1}</span>}</span>
                                    <span style={{flex:1, fontWeight:600, color:'#334155', fontSize:'1.05rem'}}>{r.nombre}</span>
                                    <span style={{background: index < 3 ? '#fef9c3' : '#f1f5f9', color: index < 3 ? '#854d0e' : '#475569', padding:'6px 14px', borderRadius:20, fontSize:'0.9rem', fontWeight:700}}>{r.puntos_actuales} pts</span>
                                </div>
                            );
                        })}
                   </div>
                   <div style={{padding:'20px 30px', borderTop:'1px solid #e2e8f0'}}>
                        <button className="btn-secondary" style={{width:'100%', padding:14, justifyContent:'center', background:'#f8fafc', color:'#475569', border:'1px solid #e2e8f0'}} onClick={() => setView('dashboard')}>Volver al Dashboard</button>
                   </div>
               </div>
           </div>
      )}
    </div>
  );
}

export default App;