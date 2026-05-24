import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import { usePuntosRecompensas, useNivelRecompensas, useBeneficios, useCanjeaBeneficio } from '../hooks/useRecompensas';
import { Check, Lock, Zap, Trophy, Star, TrendingUp, Gift, ChevronRight, Clock, Award, Flame } from 'lucide-react';

/* ─── DATA ──────────────────────────────────────── */
const BENEFICIOS = [
  { id: '1', descripcion: 'Reduce el costo de operaciones frecuentes durante el mes.', nivelRequerido: 'Bronce', puntosNecesarios: 120, tipo: 'descuento_transferencias', activo: true, icono: '⚡', ahorro: '15%' },
  { id: '2', descripcion: 'Recibe una bonificación directa sobre tu billetera principal.', nivelRequerido: 'Plata', puntosNecesarios: 180, tipo: 'bonificacion_saldo', activo: true, icono: '💎', ahorro: '$5.000' },
  { id: '3', descripcion: 'Obtén devolución por operaciones de compra seleccionadas.', nivelRequerido: 'Plata', puntosNecesarios: 220, tipo: 'cashback_compras', activo: true, icono: '🔄', ahorro: '8%' },
  { id: '4', descripcion: 'Acceso a atención prioritaria para incidencias de alto impacto.', nivelRequerido: 'Oro', puntosNecesarios: 300, tipo: 'soporte_prioritario', activo: true, icono: '🛡️', ahorro: 'VIP' },
  { id: '5', descripcion: 'Aumenta tus límites de transacción temporalmente.', nivelRequerido: 'Oro', puntosNecesarios: 450, tipo: 'incremento_limites', activo: true, icono: '📈', ahorro: '+200%' },
  { id: '6', descripcion: 'Solicita una nueva tarjeta física sin costos de emisión.', nivelRequerido: 'Platino', puntosNecesarios: 600, tipo: 'tarjeta_fisica', activo: true, icono: '💳', ahorro: '$45.000' },
];

const BENEFICIO_LABELS = {
  descuento_transferencias: 'Descuento Transferencias',
  bonificacion_saldo: 'Bonificación Saldo',
  cashback_compras: 'Cashback Compras',
  soporte_prioritario: 'Soporte Prioritario',
  incremento_limites: 'Límites Ampliados',
  tarjeta_fisica: 'Tarjeta Física',
};

const LEVELS = ['Bronce', 'Plata', 'Oro', 'Platino'];

const LEVEL_CONFIG = {
  Bronce:  { color: '#C97B2B', glow: 'rgba(201,123,43,0.4)',  num: '#E8963A', bg: 'rgba(201,123,43,0.08)', threshold: 1000,  next: 'Plata'   },
  Plata:   { color: '#9CA3AF', glow: 'rgba(156,163,175,0.4)', num: '#D1D5DB', bg: 'rgba(156,163,175,0.08)', threshold: 5000,  next: 'Oro'     },
  Oro:     { color: '#D4A017', glow: 'rgba(212,160,23,0.4)',  num: '#F5CC3A', bg: 'rgba(212,160,23,0.08)', threshold: 15000, next: 'Platino' },
  Platino: { color: '#818CF8', glow: 'rgba(129,140,248,0.4)', num: '#A5B4FC', bg: 'rgba(129,140,248,0.08)', threshold: 0,     next: null      },
};

function getBeneficioLabel(b) { return BENEFICIO_LABELS[b.tipo] || b.tipo || 'Beneficio'; }
function extractLevel(d) { if (typeof d === 'string') return d; if (d?.nivel || d?.level) return d.nivel || d.level; return 'Bronce'; }
function extractPoints(d) { if (typeof d === 'number') return d; if (typeof d === 'string' && !isNaN(+d)) return +d; if (d) return +(d.puntosActuales ?? d.puntos ?? d.puntosAcumulados ?? 0); return 0; }

/* ─── ANIMATED COUNTER ─────────────────────────── */
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = Date.now();
    const from = 0;
    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <>{display.toLocaleString('es-CO')}</>;
}

/* ─── PARTICLE BURST on redeem ─────────────────── */
function ParticleBurst({ active, color }) {
  if (!active) return null;
  return (
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', borderRadius:'inherit' }}>
        {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              position:'absolute', top:'50%', left:'50%',
              width: 6, height: 6, borderRadius:'50%',
              background: color,
              animation: `particle${i % 4} 0.7s ease-out forwards`,
              animationDelay: `${i * 30}ms`,
            }} />
        ))}
      </div>
  );
}

/* ─── HISTORY PANEL ────────────────────────────── */
function HistoryPanel({ redeemed, beneficiosData }) {
  const items = redeemed.map(id => beneficiosData.find(b => b.id === id)).filter(Boolean);
  if (!items.length) return (
      <div style={{ textAlign:'center', padding:'2rem 0', color:'rgba(255,255,255,0.2)', fontSize:'0.82rem' }}>
        Aún no has canjeado ningún beneficio.
      </div>
  );
  return (
      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
        {items.map((b, i) => (
            <div key={b.id} style={{
              display:'flex', alignItems:'center', gap:'0.75rem',
              padding:'0.75rem 1rem', background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.06)', borderRadius:10,
              animation:`slideIn 0.3s ease both`, animationDelay:`${i*60}ms`
            }}>
              <span style={{ fontSize:'1.2rem' }}>{b.icono}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.82rem', fontWeight:600, color:'#fff' }}>{getBeneficioLabel(b)}</div>
                <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>{b.puntosNecesarios} pts canjeados</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', color:'#4ade80', fontSize:'0.72rem', fontWeight:600 }}>
                <Check size={12} /> Activo
              </div>
            </div>
        ))}
      </div>
  );
}

/* ─── RADAR / BENEFIT MAP ──────────────────────── */
function BenefitRadar({ points, beneficiosData }) {
  const max = Math.max(...beneficiosData.map(b => b.puntosNecesarios));
  const size = 200;
  const cx = size / 2, cy = size / 2, r = 80;
  const n = beneficiosData.length;
  const pts = beneficiosData.map((b, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const val = Math.min(1, points / b.puntosNecesarios);
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle), full: { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }, b };
  });
  const polygon = pts.map(p => `${p.x},${p.y}`).join(' ');
  const outerPolygon = pts.map(p => `${p.full.x},${p.full.y}`).join(' ');
  return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow:'visible' }}>
        <polygon points={outerPolygon} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        {[0.25, 0.5, 0.75].map(f => {
          const p2 = pts.map((p, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            return `${cx + r * f * Math.cos(angle)},${cy + r * f * Math.sin(angle)}`;
          }).join(' ');
          return <polygon key={f} points={p2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
        })}
        {pts.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.full.x} y2={p.full.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
        <polygon points={polygon} fill="rgba(99,88,255,0.2)" stroke="#6358ff" strokeWidth="1.5" />
        {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={3} fill="#6358ff" />
              <text x={p.full.x} y={p.full.y} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
                    dx={p.full.x > cx ? 14 : p.full.x < cx ? -14 : 0}
                    dy={p.full.y > cy ? 12 : p.full.y < cy ? -12 : 0}
              >{p.b.icono}</text>
            </g>
        ))}
      </svg>
  );
}

/* ─── MAIN ─────────────────────────────────────── */
export default function Recompensas({ userId }) {
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [activeTab, setActiveTab] = useState('beneficios');
  const [burstId, setBurstId]   = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [redeemed, setRedeemed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`redeemed_${userId}`)) || []; }
    catch { return []; }
  });

  const puntosQuery    = usePuntosRecompensas(userId);
  const nivelQuery     = useNivelRecompensas(userId);
  const beneficiosQuery = useBeneficios();
  const canjeaMutation  = useCanjeaBeneficio();

  async function handleRedeem(beneficio) {
    try {
      setError(''); setSuccess('');
      setBurstId(beneficio.id);
      setTimeout(() => setBurstId(null), 800);
      await canjeaMutation.mutateAsync({ usuarioId: userId, beneficioId: beneficio.id });
      setSuccess(`✓ ${getBeneficioLabel(beneficio)} canjeado`);
      const next = [...redeemed, beneficio.id];
      setRedeemed(next);
      localStorage.setItem(`redeemed_${userId}`, JSON.stringify(next));
    } catch (e) {
      setError(e?.message || 'No fue posible canjear.');
    }
  }

  const rawLevel     = extractLevel(nivelQuery.data);
  const currentLevel = rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase();
  const cfg          = LEVEL_CONFIG[currentLevel] || LEVEL_CONFIG.Bronce;
  const points       = extractPoints(puntosQuery.data);
  const threshold    = cfg.threshold;
  const progress     = threshold > 0 ? Math.min(100, Math.round((points / threshold) * 100)) : 100;
  const levelIdx     = LEVELS.indexOf(currentLevel);
  const beneficiosData = Array.isArray(beneficiosQuery.data) ? beneficiosQuery.data
      : (beneficiosQuery.data?.beneficios || BENEFICIOS);

  const isLoading   = puntosQuery.isLoading || nivelQuery.isLoading || beneficiosQuery.isLoading;
  const isRedeeming = canjeaMutation.isPending;
  const totalAhorrado = redeemed.length * 120;
  const disponibles   = beneficiosData.filter(b => !redeemed.includes(b.id) && points >= b.puntosNecesarios).length;

  const TABS = [
    { id: 'beneficios', label: 'Beneficios', icon: Gift },
    { id: 'mapa',       label: 'Mapa de logros', icon: Star },
    { id: 'historial',  label: 'Historial', icon: Clock },
    { id: 'ranking',    label: 'Mi progreso', icon: TrendingUp },
  ];

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Bebas+Neue&family=JetBrains+Mono:wght@400;600&display=swap');

        .rw-root { font-family: 'Space Grotesk', sans-serif; color: #fff; }

        /* Particle animations */
        @keyframes particle0 { to { transform: translate(-60px,-60px) scale(0); opacity:0; } }
        @keyframes particle1 { to { transform: translate(60px,-60px) scale(0); opacity:0; } }
        @keyframes particle2 { to { transform: translate(60px,60px) scale(0); opacity:0; } }
        @keyframes particle3 { to { transform: translate(-60px,60px) scale(0); opacity:0; } }

        @keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 20px rgba(99,88,255,0.3); } 50% { box-shadow: 0 0 40px rgba(99,88,255,0.6), 0 0 80px rgba(99,88,255,0.2); } }
        @keyframes scanLine { 0% { transform: translateY(-100%); } 100% { transform: translateY(400%); } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes countUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes borderRun {
          0%   { clip-path: inset(0 100% 98% 0); }
          25%  { clip-path: inset(0 0 98% 0); }
          50%  { clip-path: inset(0 0 0 98%); }
          75%  { clip-path: inset(98% 0 0 0); }
          100% { clip-path: inset(0 100% 98% 0); }
        }

        .rw-hero-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(5rem, 12vw, 9rem);
          line-height: 0.9;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.4) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: countUp 0.6s ease both;
        }

        .rw-level-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.5rem;
          letter-spacing: 0.15em;
        }

        .rw-tab {
          padding: 0.5rem 1.1rem;
          border-radius: 8px;
          border: 1px solid transparent;
          background: none;
          color: rgba(255,255,255,0.35);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          white-space: nowrap;
        }
        .rw-tab.active {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.12);
          color: #fff;
        }
        .rw-tab:hover:not(.active) { color: rgba(255,255,255,0.65); }

        .rw-card {
          position: relative;
          background: #0e0e0e;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.2s, border-color 0.2s;
        }
        .rw-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.14); }

        .rw-card-available {
          border-color: rgba(99,88,255,0.3);
          animation: pulseGlow 3s ease-in-out infinite;
        }

        .rw-btn-redeem {
          width: 100%;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          border: none;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }

        .rw-stat-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .rw-stat-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          line-height: 1;
          color: #fff;
        }

        .rw-stat-lbl {
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.25);
        }

        .rw-mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.3);
        }

        .rw-scan {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(99,88,255,0.6), transparent);
          animation: scanLine 3s linear infinite;
          pointer-events: none;
        }

        .rw-shimmer-text {
          background: linear-gradient(90deg, rgba(255,255,255,0.4) 0%, #fff 40%, rgba(255,255,255,0.4) 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 2.5s linear infinite;
        }

        .rw-progress-bar {
          position: relative;
          height: 6px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          overflow: hidden;
        }
        .rw-progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 1s cubic-bezier(0.4,0,0.2,1);
          position: relative;
        }
        .rw-progress-fill::after {
          content:'';
          position: absolute;
          right: 0; top: 50%;
          transform: translateY(-50%);
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px currentColor;
        }

        .rw-level-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          position: relative;
          flex: 1;
        }
        .rw-level-step-line {
          position: absolute;
          top: 14px;
          left: 50%;
          width: 100%;
          height: 2px;
          z-index: 0;
        }

        .rw-achievement {
          padding: 0.9rem 1rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          transition: border-color 0.2s;
        }
        .rw-achievement.unlocked { border-color: rgba(99,88,255,0.25); background: rgba(99,88,255,0.05); }

        /* Noise overlay */
        .rw-noise {
          position: absolute;
          inset: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
          border-radius: inherit;
        }

        .rw-float { animation: float 4s ease-in-out infinite; }
      `}</style>

        <div className="rw-root" style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

          {/* ── Alerts ── */}
          {error   && <AlertaPanel type="error"   title="Error"           message={error}   />}
          {success && <AlertaPanel type="success" title="¡Canje exitoso!" message={success} />}

          {isLoading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'5rem 0' }}><LoadingSpinner /></div>
          ) : (<>

            {/* ══════════════════════════════════════
              HERO — bento brutalist
          ══════════════════════════════════════ */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gridTemplateRows:'auto auto', gap:'1rem' }}>

              {/* Big points card */}
              <div className="rw-card" style={{
                gridColumn:'1 / 3', gridRow:'1 / 2',
                padding:'2rem',
                background:`linear-gradient(135deg, #0e0e0e 60%, ${cfg.bg} 100%)`,
                borderColor: cfg.color + '33',
              }}>
                <div className="rw-scan" />
                <div className="rw-noise" />
                <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div className="rw-mono">ZiplocSAS · FIDELIZACIÓN</div>
                      <div className="rw-level-label rw-shimmer-text" style={{ color: cfg.color, WebkitTextFillColor: cfg.color, background:'none', animation:'none', marginTop:'0.25rem' }}>
                        {currentLevel}
                      </div>
                    </div>
                    {/* Level steps horizontal */}
                    <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                      {LEVELS.map((lv, i) => {
                        const c = LEVEL_CONFIG[lv];
                        const done = i <= levelIdx;
                        return (
                            <div key={lv} style={{ display:'flex', alignItems:'center' }}>
                              <div style={{
                                width: 28, height: 28, borderRadius:'50%',
                                border: `2px solid ${done ? c.color : 'rgba(255,255,255,0.1)'}`,
                                background: done ? c.bg : 'transparent',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize: '0.6rem', fontWeight: 700, color: done ? c.color : 'rgba(255,255,255,0.2)',
                                transition:'all 0.3s',
                              }}>
                                {i < levelIdx ? <Check size={11} /> : lv[0]}
                              </div>
                              {i < LEVELS.length - 1 && (
                                  <div style={{ width: 20, height: 2, background: i < levelIdx ? cfg.color : 'rgba(255,255,255,0.08)' }} />
                              )}
                            </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rw-hero-num">
                    <AnimatedNumber value={points} />
                    <span style={{ fontSize:'2rem', fontFamily:"'Bebas Neue',sans-serif", marginLeft:'0.25rem', color:'rgba(255,255,255,0.3)' }}>PTS</span>
                  </div>

                  {/* Progress to next level */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'rgba(255,255,255,0.35)' }}>
                      <span>{cfg.next ? `Hacia ${cfg.next}` : 'Nivel máximo alcanzado'}</span>
                      <span className="rw-mono">{progress}%</span>
                    </div>
                    <div className="rw-progress-bar">
                      <div className="rw-progress-fill" style={{
                        width:`${progress}%`,
                        background:`linear-gradient(90deg, ${cfg.color}, #fff)`,
                      }} />
                    </div>
                    {threshold > 0 && (
                        <div className="rw-mono">Faltan {(threshold - points).toLocaleString('es-CO')} pts para {cfg.next}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right stat stack */}
              <div style={{ gridColumn:'3 / 4', gridRow:'1 / 2', display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div className="rw-stat-box">
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <Flame size={14} style={{ color:'#f97316' }} />
                    <span className="rw-stat-lbl">Canjeados</span>
                  </div>
                  <div className="rw-stat-val">{redeemed.length}</div>
                  <div className="rw-mono">de {beneficiosData.length} totales</div>
                </div>
                <div className="rw-stat-box">
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <Zap size={14} style={{ color:'#facc15' }} />
                    <span className="rw-stat-lbl">Disponibles</span>
                  </div>
                  <div className="rw-stat-val" style={{ color: disponibles > 0 ? '#4ade80' : undefined }}>{disponibles}</div>
                  <div className="rw-mono">para canjear ahora</div>
                </div>
                <div className="rw-stat-box">
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <Trophy size={14} style={{ color: cfg.color }} />
                    <span className="rw-stat-lbl">Nivel</span>
                  </div>
                  <div className="rw-stat-val" style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'1.3rem', color: cfg.color }}>{currentLevel}</div>
                  <div className="rw-mono">#{levelIdx + 1} de {LEVELS.length}</div>
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                    <button key={t.id} className={`rw-tab ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}>
                      <Icon size={13} />{t.label}
                      {t.id === 'beneficios' && disponibles > 0 && (
                          <span style={{ background:'#6358ff', color:'#fff', borderRadius:999, padding:'0.05rem 0.4rem', fontSize:'0.65rem', fontWeight:700 }}>{disponibles}</span>
                      )}
                    </button>
                );
              })}
            </div>

            {/* ══ PANEL: Beneficios ══ */}
            {activeTab === 'beneficios' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
                  {beneficiosData.map(b => {
                    const canRedeem   = points >= b.puntosNecesarios && b.activo && !redeemed.includes(b.id);
                    const isDone      = redeemed.includes(b.id);
                    const isLocked    = points < b.puntosNecesarios;
                    const isBursting  = burstId === b.id;
                    return (
                        <div key={b.id}
                             className={`rw-card ${canRedeem ? 'rw-card-available' : ''}`}
                             onMouseEnter={() => setHoveredCard(b.id)}
                             onMouseLeave={() => setHoveredCard(null)}
                        >
                          <ParticleBurst active={isBursting} color={cfg.color} />
                          {isDone && <div className="rw-scan" style={{ background:'linear-gradient(90deg,transparent,rgba(74,222,128,0.5),transparent)' }} />}

                          <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                            {/* Header */}
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.75rem' }}>
                              <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                                <div style={{ fontSize:'1.8rem', lineHeight:1 }}>{b.icono}</div>
                                <div style={{ fontSize:'0.1rem', color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                                  Nv. {b.nivelRequerido}
                                </div>
                              </div>
                              <div style={{ textAlign:'right' }}>
                                <div style={{
                                  fontFamily:"'Bebas Neue',sans-serif",
                                  fontSize:'2rem', lineHeight:1,
                                  color: isDone ? '#4ade80' : canRedeem ? cfg.color : 'rgba(255,255,255,0.15)',
                                }}>{b.puntosNecesarios}</div>
                                <div className="rw-mono">pts</div>
                              </div>
                            </div>

                            {/* Name + desc */}
                            <div>
                              <div style={{ fontWeight:700, fontSize:'0.9rem', color: isDone ? '#4ade80' : '#fff', marginBottom:'0.35rem' }}>
                                {getBeneficioLabel(b)}
                              </div>
                              <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{b.descripcion}</div>
                            </div>

                            {/* Saving badge */}
                            {b.ahorro && (
                                <div style={{
                                  display:'inline-flex', alignItems:'center', gap:'0.4rem',
                                  padding:'0.3rem 0.75rem', borderRadius:999,
                                  background: isDone ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                                  border: `1px solid ${isDone ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'}`,
                                  fontSize:'0.72rem', fontWeight:700,
                                  color: isDone ? '#4ade80' : 'rgba(255,255,255,0.4)',
                                  width:'fit-content',
                                }}>
                                  <TrendingUp size={11} /> Ahorro: {b.ahorro}
                                </div>
                            )}

                            {/* Progress to this benefit */}
                            {!isDone && (
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                                  <div className="rw-progress-bar">
                                    <div className="rw-progress-fill" style={{
                                      width:`${Math.min(100, Math.round((points / b.puntosNecesarios) * 100))}%`,
                                      background: canRedeem
                                          ? `linear-gradient(90deg, ${cfg.color}, #fff)`
                                          : 'rgba(255,255,255,0.2)',
                                    }} />
                                  </div>
                                  <div className="rw-mono" style={{ textAlign:'right' }}>
                                    {Math.min(100, Math.round((points / b.puntosNecesarios) * 100))}%
                                  </div>
                                </div>
                            )}

                            {/* CTA */}
                            <button
                                className="rw-btn-redeem"
                                onClick={() => handleRedeem(b)}
                                disabled={isRedeeming || !canRedeem}
                                style={{
                                  background: isDone
                                      ? 'rgba(74,222,128,0.1)'
                                      : canRedeem
                                          ? `linear-gradient(135deg, ${cfg.color}, #fff)`
                                          : 'rgba(255,255,255,0.04)',
                                  color: isDone ? '#4ade80' : canRedeem ? '#000' : 'rgba(255,255,255,0.2)',
                                  border: isDone ? '1px solid rgba(74,222,128,0.2)' : canRedeem ? 'none' : '1px solid rgba(255,255,255,0.07)',
                                  cursor: canRedeem ? 'pointer' : 'not-allowed',
                                }}
                            >
                              {isRedeeming ? 'Procesando…'
                                  : isDone ? '✓ Ya canjeado'
                                      : canRedeem ? `Canjear · ${b.puntosNecesarios} pts`
                                          : isLocked ? `🔒 Faltan ${b.puntosNecesarios - points} pts`
                                              : 'No disponible'}
                            </button>
                          </div>
                        </div>
                    );
                  })}
                </div>
            )}

            {/* ══ PANEL: Mapa de logros ══ */}
            {activeTab === 'mapa' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  {/* Radar visual */}
                  <div className="rw-card" style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem', alignItems:'center' }}>
                    <div style={{ fontWeight:700, fontSize:'0.9rem', alignSelf:'flex-start' }}>Cobertura de beneficios</div>
                    <div className="rw-float">
                      <BenefitRadar points={points} beneficiosData={beneficiosData} />
                    </div>
                    <div className="rw-mono" style={{ textAlign:'center' }}>
                      {redeemed.length} de {beneficiosData.length} beneficios activados
                    </div>
                  </div>

                  {/* Achievements list */}
                  <div className="rw-card" style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                    <div style={{ fontWeight:700, fontSize:'0.9rem' }}>Logros</div>
                    {[
                      { label:'Primer canje', desc:'Canjea tu primer beneficio', done: redeemed.length >= 1, icon:'🎯' },
                      { label:'Coleccionista', desc:'Canjea 3 beneficios', done: redeemed.length >= 3, icon:'🏆' },
                      { label:'Maestro del canje', desc:'Canjea todos los beneficios', done: redeemed.length >= beneficiosData.length, icon:'👑' },
                      { label:'100 puntos', desc:'Acumula 100 puntos', done: points >= 100, icon:'💯' },
                      { label:'Power user', desc:'Alcanza nivel Oro o superior', done: levelIdx >= 2, icon:'⚡' },
                      { label:'Elite', desc:'Alcanza nivel Platino', done: levelIdx >= 3, icon:'💎' },
                    ].map((a, i) => (
                        <div key={i} className={`rw-achievement ${a.done ? 'unlocked' : ''}`}>
                          <div style={{ fontSize:'1.5rem', opacity: a.done ? 1 : 0.2 }}>{a.icon}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:'0.82rem', fontWeight:600, color: a.done ? '#fff' : 'rgba(255,255,255,0.25)' }}>{a.label}</div>
                            <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.25)' }}>{a.desc}</div>
                          </div>
                          {a.done && <Check size={14} style={{ color:'#4ade80', flexShrink:0 }} />}
                          {!a.done && <Lock size={12} style={{ color:'rgba(255,255,255,0.15)', flexShrink:0 }} />}
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {/* ══ PANEL: Historial ══ */}
            {activeTab === 'historial' && (
                <div className="rw-card" style={{ padding:'1.5rem' }}>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <Clock size={14} style={{ color:'rgba(255,255,255,0.4)' }} />
                    Historial de canjes
                    <span style={{ background:'rgba(255,255,255,0.08)', borderRadius:999, padding:'0.1rem 0.5rem', fontSize:'0.72rem' }}>{redeemed.length}</span>
                  </div>
                  <HistoryPanel redeemed={redeemed} beneficiosData={beneficiosData} />
                </div>
            )}

            {/* ══ PANEL: Mi progreso ══ */}
            {activeTab === 'ranking' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'1rem' }}>
                  {LEVELS.map((lv, i) => {
                    const c = LEVEL_CONFIG[lv];
                    const isCurrentOrPast = i <= levelIdx;
                    const isCurrent = i === levelIdx;
                    return (
                        <div key={lv} className="rw-card" style={{
                          padding:'1.5rem',
                          borderColor: isCurrent ? c.color + '50' : 'rgba(255,255,255,0.07)',
                          background: isCurrent ? c.bg : '#0e0e0e',
                        }}>
                          {isCurrent && <div className="rw-scan" />}
                          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', color: isCurrentOrPast ? c.color : 'rgba(255,255,255,0.15)', letterSpacing:'0.05em' }}>{lv}</div>
                              {isCurrent && <Award size={18} style={{ color: c.color }} />}
                              {i < levelIdx && <Check size={16} style={{ color:'#4ade80' }} />}
                              {i > levelIdx && <Lock size={14} style={{ color:'rgba(255,255,255,0.15)' }} />}
                            </div>
                            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'3rem', lineHeight:1, color: isCurrentOrPast ? '#fff' : 'rgba(255,255,255,0.1)' }}>
                              {c.threshold > 0 ? c.threshold.toLocaleString('es-CO') : '∞'}
                            </div>
                            <div className="rw-mono">puntos requeridos</div>
                            {isCurrent && threshold > 0 && (
                                <div style={{ marginTop:'0.5rem' }}>
                                  <div className="rw-progress-bar">
                                    <div className="rw-progress-fill" style={{ width:`${progress}%`, background:`linear-gradient(90deg,${c.color},#fff)` }} />
                                  </div>
                                  <div className="rw-mono" style={{ marginTop:'0.3rem' }}>{progress}% completado</div>
                                </div>
                            )}
                          </div>
                        </div>
                    );
                  })}
                </div>
            )}

          </>)}
        </div>
      </>
  );
}