import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';
import { 
  LogOut, BarChart2, CheckCircle, Info, Sprout, ShieldCheck, 
  ArrowRight, Leaf, Trophy, Medal, Award, Target, Zap, 
  Droplets, Clock, FileText 
} from 'lucide-react';
import './style.css';


const API_URL = 'http://localhost:4000'; 

interface Usuario { id_usuario: number; nombre: string; puntos_actuales: number; }
interface RankingItem { nombre: string; puntos_actuales: number; }

interface HistorialItem { 
    id: number; 
    usuario: string; 
    material: string; 
    peso: number; 
    fecha: string; 
}

function App() {
  const [view, setView] = useState<'home' | 'dashboard' | 'ranking'>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [user, setUser] = useState<Usuario | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [formReciclaje, setFormReciclaje] = useState({ materialId: '', peso: '' });

  const [showTerms, setShowTerms] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);

    
    axios.get(`${API_URL}/api/materiales`)
        .then((res: any) => setMateriales(res.data))
        .catch((err: any) => console.error(err));

    
    const intervalo = setInterval(() => {
        if (view === 'dashboard' || view === 'ranking') {
            cargarDatosEnTiempoReal();
        }
    }, 2000);

    if (view === 'home') setTimeout(() => setShowTerms(true), 1000);

    return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(intervalo); 
    };
  }, [view]);

  
  const cargarDatosEnTiempoReal = async () => {
      try {
          
          const resRanking = await axios.get(`${API_URL}/api/ranking`);
          setRanking(resRanking.data);

        
          const resHistorial = await axios.get(`${API_URL}/api/historial`);
          setHistorial(resHistorial.data);
          
          
          if (user) {
              const resUser = await axios.get(`${API_URL}/api/usuario/${user.id_usuario}`);
              
              if (resUser.data.puntos_actuales !== user.puntos_actuales) {
                  setUser(resUser.data);
              }
          }
      } catch (err) {
          console.error("Esperando conexión...", err);
      }
  };

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); try { const res = await axios.post(`${API_URL}/api/login`, { email, password }); setUser(res.data); setView('dashboard'); setMensaje({ texto: '', tipo: '' }); cargarDatosEnTiempoReal(); } catch (err) { setMensaje({ texto: 'Credenciales incorrectas.', tipo: 'error' }); } };
  const handleRegister = async (e: React.FormEvent) => { e.preventDefault(); if (!nombre || !email || !password) { setMensaje({ texto: 'Complete todos los campos', tipo: 'error' }); return; } try { const res = await axios.post(`${API_URL}/api/register`, { nombre, email, password }); setUser(res.data); setView('dashboard'); setMensaje({ texto: '', tipo: '' }); } catch (err: any) { setMensaje({ texto: err.response?.data?.error || 'Error al registrar', tipo: 'error' }); } };
  
  
  const cargarRanking = async () => { setView('ranking'); cargarDatosEnTiempoReal(); };

  const handleReciclar = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!formReciclaje.materialId || !formReciclaje.peso) { setMensaje({ texto: 'Seleccione material y peso', tipo: 'error' }); return; } 
      try { 
          await axios.post(`${API_URL}/api/reciclar`, { id_usuario: user?.id_usuario, id_material: formReciclaje.materialId, peso: formReciclaje.peso }); 
          
          setShowConfetti(true); 
          setMensaje({ texto: '¡Depósito exitoso! Actualizando datos...', tipo: 'success' }); 
          setFormReciclaje({ materialId: '', peso: '' }); 
          
          
          cargarDatosEnTiempoReal();
          
          setTimeout(() => setShowConfetti(false), 4000); 
      } catch (err) { setMensaje({ texto: 'Error al procesar depósito', tipo: 'error' }); } 
  };

  

  if (view === 'home') {
    return (
        <div className="container">
            {showTerms && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <Sprout size={45} color="#ca8a04" style={{marginBottom: 10}}/>
                        <h2 style={{color: '#14532d', margin: '0 0 10px 0'}}>Términos Corporativos</h2>
                        <div className="terms-text">
                            <p>Bienvenido a EcoTrace Enterprise.</p>
                            <p>1. <strong>Integridad:</strong> Todo peso ingresado debe corresponder a una medición real.</p>
                            <p>2. <strong>Compromiso:</strong> Su participación contribuye a las metas ESG.</p>
                        </div>
                        <button className="btn-primary" onClick={() => setShowTerms(false)}>Aceptar y Continuar</button>
                    </div>
                </div>
            )}

            <div className="split-screen">
                <div className="left-panel">
                    <div className="brand-logo">
                        <Sprout size={50} color="#ca8a04" />
                        <span style={{fontSize: '1.5rem', fontWeight: 800, color: '#14532d'}}>EcoTrace Enterprise</span>
                    </div>
                    <h1 className="hero-title">Gestión Inteligente de Residuos.</h1>
                    <div className="hero-description">
                        <p>Transformamos la sostenibilidad en un activo medible. <strong>EcoTrace</strong> audita, traza y certifica cada kilogramo reciclado.</p>
                    </div>
                    <div className="features-grid">
                        <div className="feat-badge"><BarChart2 size={16}/> Trazabilidad Real</div>
                        <div className="feat-badge"><ShieldCheck size={16}/> Auditoría Antifraude</div>
                        <div className="feat-badge"><CheckCircle size={16}/> Certificación ISO</div>
                    </div>
                </div>
                <div className="right-panel">
                    <div className="login-card">
                        <h2 style={{color:'#ca8a04', marginBottom:20}}>Acceso Corporativo</h2>
                        <div className="auth-tabs">
                            <button className={authMode === 'login' ? 'active' : ''} onClick={() => {setAuthMode('login'); setMensaje({texto:'', tipo:''})}}>Iniciar Sesión</button>
                            <button className={authMode === 'register' ? 'active' : ''} onClick={() => {setAuthMode('register'); setMensaje({texto:'', tipo:''})}}>Crear Cuenta</button>
                        </div>
                        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                            {authMode === 'register' && (
                                <><label className="label">Empresa</label><input className="input-field" type="text" placeholder="Ej. Industrias Eco" value={nombre} onChange={e => setNombre(e.target.value)} /></>
                            )}
                            <label className="label">Correo</label>
                            <input className="input-field" type="email" placeholder="admin@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
                            <label className="label">Contraseña</label>
                            <input className="input-field" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} />
                            <button className="btn-primary">{authMode === 'login' ? 'Acceder al Dashboard' : 'Registrar Empresa'} <ArrowRight size={18} style={{marginLeft: 5}}/></button>
                        </form>
                        {mensaje.texto && <div style={{marginTop:15, padding:10, borderRadius:8, background:mensaje.tipo==='error'?'#fee2e2':'#dcfce7', color:mensaje.tipo==='error'?'red':'green', textAlign:'center'}}>{mensaje.texto}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (view === 'ranking') {
    return (
        <div className="container" style={{maxWidth: '1000px', marginTop: 30}}>
            <div className="header">
                <div><h2 style={{margin:0, fontSize:'2rem'}}>🏆 Liderazgo Sostenible</h2><p style={{margin:'5px 0 0 0', opacity:0.8}}>Top empresas comprometidas</p></div>
                <button className="btn-logout" onClick={() => setView('dashboard')}><ArrowRight size={18} style={{transform:'rotate(180deg)'}}/> Volver</button>
            </div>
            <div className="goal-banner">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}><Target size={28} color="#facc15"/><h3 style={{margin:0, fontSize:'1.3rem'}}>Meta Global: 50 Toneladas</h3></div>
                    <span style={{fontWeight:800, fontSize:'1.2rem'}}>75% Completado</span>
                </div>
                <div className="goal-progress-bar"><div className="goal-progress-fill" style={{width: '75%'}}></div></div>
            </div>
            <div className="ranking-list">
                {ranking.map((r: any, index: number) => {
                    let rankClass = ''; let MedalIcon = null;
                    if (index === 0) { rankClass = 'rank-1'; MedalIcon = <Trophy size={28} color="#ca8a04" fill="#facc15" />; }
                    else if (index === 1) { rankClass = 'rank-2'; MedalIcon = <Medal size={24} color="#64748b" />; }
                    else if (index === 2) { rankClass = 'rank-3'; MedalIcon = <Award size={24} color="#92400e" />; }
                    const isCurrentUser = r.nombre === user?.nombre;
                    return (
                        <div key={index} className={`ranking-item ${rankClass} ${isCurrentUser ? 'current-user-highlight' : ''}`}>
                            <div className="rank-number">{MedalIcon ? MedalIcon : `#${index + 1}`}</div>
                            <div className="rank-name">{r.nombre} {isCurrentUser && <span style={{marginLeft:10, fontSize:'0.8rem', background:'#14532d', color:'white', padding:'2px 8px', borderRadius:10}}>Tú</span>}</div>
                            <div className="rank-points">{r.puntos_actuales.toLocaleString()} <small style={{fontSize:'0.9rem', fontWeight:600}}>pts</small></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  }

  
  return (
    <div className="container" style={{marginTop: 20}}>
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={200} recycle={false} />}

      <div className="header" style={{background:'white', color:'#14532d', padding:'15px 20px', borderBottom:'1px solid #e2e8f0', marginBottom:0, borderRadius: 20, boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)'}}>
         <div style={{display:'flex', alignItems:'center', gap:10}}>
             <Sprout size={32} color="#14532d"/>
             <span style={{fontWeight:800, fontSize:'1.5rem'}}>EcoTrace Dashboard</span>
             
             <span style={{background:'#dcfce7', color:'#166534', padding:'2px 8px', borderRadius:'10px', fontSize:'0.7rem', border:'1px solid #86efac', display:'flex', alignItems:'center', gap:4}}>
                 <span style={{width:6, height:6, background:'#22c55e', borderRadius:'50%', display:'block'}}></span> LIVE
             </span>
         </div>
         <button onClick={() => {setUser(null); setView('home');}} className="btn-logout" style={{background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca'}}>
            <LogOut size={18}/> Cerrar Sesión
         </button>
      </div>

      <div className="dashboard-layout">
          
          <div style={{display:'flex', flexDirection:'column', gap: 20}}>
              <div className="profile-panel">
                  <div className="profile-avatar">🏢</div>
                  <h2 style={{margin:0}}>{user?.nombre}</h2>
                  <p style={{opacity:0.8, fontSize:'0.9rem'}}>Miembro Platinum</p>
                  
                  <div style={{borderTop:'1px solid rgba(255,255,255,0.2)', paddingTop:20, marginTop:20}}>
                      <small style={{textTransform:'uppercase', letterSpacing:'1px'}}>Eco-Puntos Acumulados</small>
                      <div className="points-hero">{user?.puntos_actuales.toLocaleString()}</div>
                  </div>

                  <button className="btn-secondary" onClick={cargarRanking}> 
                   <BarChart2 size={20}/> Ver Ranking Global
                  </button>
              </div>

              <div className="card" style={{background:'#f0f9ff', border:'1px solid #bae6fd'}}>
                  <h4 style={{margin:'0 0 10px 0', color:'#0369a1', display:'flex', alignItems:'center', gap:8}}><Info size={18}/> Estado del Sistema</h4>
                  <p style={{fontSize:'0.9rem', color:'#0c4a6e', margin:0}}>Conexión en tiempo real activa. Los datos se actualizan automáticamente.</p>
              </div>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap: 25}}>
              
              <div>
                  <h3 style={{color:'#14532d', margin:'0 0 15px 0'}}>Impacto Ambiental Certificado</h3>
                  <div className="stats-grid">
                      <div className="stat-card">
                          <div className="stat-icon"><Leaf size={24}/></div>
                          <span className="stat-value">{Math.round((user?.puntos_actuales || 0) * 0.15)} kg</span>
                          <span className="stat-label">CO2 Evitado</span>
                      </div>
                      <div className="stat-card">
                          <div className="stat-icon"><Droplets size={24}/></div>
                          <span className="stat-value">{Math.round((user?.puntos_actuales || 0) * 2.5)} L</span>
                          <span className="stat-label">Agua Ahorrada</span>
                      </div>
                      <div className="stat-card">
                          <div className="stat-icon"><Zap size={24}/></div>
                          <span className="stat-value">{Math.round((user?.puntos_actuales || 0) * 0.8)} kW</span>
                          <span className="stat-label">Energía</span>
                      </div>
                      <div className="stat-card">
                          <div className="stat-icon"><Sprout size={24}/></div>
                          <span className="stat-value">{((user?.puntos_actuales || 0) / 1000).toFixed(1)}</span>
                          <span className="stat-label">Árboles Eq.</span>
                      </div>
                  </div>
              </div>

              <div className="action-card">
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20}}>
                      <div style={{display:'flex', alignItems:'center', gap:15}}>
                          <div style={{background:'#ca8a04', padding:10, borderRadius:'10px', color:'white'}}><ShieldCheck size={28}/></div>
                          <div>
                              <h2 style={{margin:0, color:'#ca8a04'}}>Nueva Certificación</h2>
                              <span style={{color:'#64748b'}}>Registre el material pesado en báscula.</span>
                          </div>
                      </div>
                  </div>

                  <form onSubmit={handleReciclar} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:20, alignItems:'end'}}>
                      <div>
                          <label className="label">Material Industrial</label>
                          <select className="input-field" style={{marginBottom:0}} value={formReciclaje.materialId} onChange={e => setFormReciclaje({...formReciclaje, materialId: e.target.value})}>
                              <option value="">Seleccione categoría...</option>
                              {materiales.map((m: any) => <option key={m.id_material} value={m.id_material}>{m.nombre}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="label">Peso Neto (Kg)</label>
                          <input type="number" step="0.01" className="input-field" style={{marginBottom:0}} placeholder="0.00" value={formReciclaje.peso} onChange={e => setFormReciclaje({...formReciclaje, peso: e.target.value})} />
                      </div>
                      <button className="btn-primary" type="submit" style={{height:'52px'}}>
                          <CheckCircle size={20}/> Registrar
                      </button>
                  </form>
                  {mensaje.texto && <div style={{marginTop:15, padding:10, borderRadius:8, background:mensaje.tipo==='error'?'#fee2e2':'#dcfce7', color:mensaje.tipo==='error'?'red':'green', textAlign:'center'}}>{mensaje.texto}</div>}
              </div>

              
              <div className="history-section">
                  <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:15}}>
                      <FileText size={20} color="#64748b"/>
                      <h3 style={{margin:0, color:'#334155'}}>Últimas Auditorías en Tiempo Real</h3>
                      <span className="status-badge status-verified" style={{fontSize:'0.7rem'}}>Live Feed</span>
                  </div>
                  <table className="history-table">
                      <thead>
                          <tr><th>Fecha/Hora</th><th>Usuario</th><th>Material</th><th>Peso</th><th>Estado</th></tr>
                      </thead>
                      <tbody>
                          
                          {historial.length === 0 ? (
                              <tr><td colSpan={5} style={{textAlign:'center', color:'#94a3b8'}}>Esperando transacciones...</td></tr>
                          ) : (
                              historial.map((item, index) => (
                                  <tr key={index}>
                                      <td>
                                          <div style={{display:'flex', alignItems:'center', gap:5}}>
                                              <Clock size={14}/> {new Date(item.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </div>
                                      </td>
                                      <td>{item.usuario}</td>
                                      <td><strong>{item.material}</strong></td>
                                      <td>{item.peso} Kg</td>
                                      <td><span className="status-badge status-verified">Verificado</span></td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
                  <div style={{textAlign:'center', marginTop:15}}>
                      <small style={{color:'#94a3b8'}}>Mostrando últimas transacciones de la red</small>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}

export default App;