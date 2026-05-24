import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import { useNotificaciones, useMarcarLectura, useDespacharNotificacion } from '../hooks/useNotificaciones';
import { Bell, BellOff, Check, CheckCheck, Zap, Filter, Inbox, Radio, Eye, Trash2, Clock } from 'lucide-react';

const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/* ── tipo → icono + color ── */
function getTipoMeta(tipo = '', titulo = '') {
  const t = (tipo + titulo).toLowerCase();
  if (t.includes('pago') || t.includes('transacc') || t.includes('transfer')) return { icon: '💸', color: '#4ade80', label: 'Transacción' };
  if (t.includes('segur') || t.includes('alerta') || t.includes('riesgo'))    return { icon: '🛡️', color: '#f87171', label: 'Seguridad' };
  if (t.includes('recompensa') || t.includes('punto') || t.includes('nivel')) return { icon: '⭐', color: '#facc15', label: 'Recompensa' };
  if (t.includes('sistem') || t.includes('actualiz') || t.includes('mante'))  return { icon: '⚙️', color: '#818cf8', label: 'Sistema' };
  if (t.includes('bienven') || t.includes('cuenta') || t.includes('perfil'))  return { icon: '👤', color: '#38bdf8', label: 'Cuenta' };
  return { icon: '📢', color: '#a78bfa', label: 'General' };
}

/* ── Animated counter ── */
function Counter({ value }) {
  const [n, setN] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = Date.now();
    const dur = 800;
    function tick() {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * e));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{n}</>;
}

/* ── Pulse dot ── */
function PulseDot({ color = '#f87171' }) {
  return (
      <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10, flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%', background: color,
        animation: 'pingDot 1.4s ease-in-out infinite', opacity: 0.5,
      }} />
      <span style={{ borderRadius: '50%', background: color, width: '100%', height: '100%', display: 'block' }} />
    </span>
  );
}

/* ── Notif card ── */
function NotifCard({ notif, onMark, isMarking }) {
  const meta = getTipoMeta(notif.tipo, notif.titulo);
  const [hovered, setHovered] = useState(false);
  const isNew = !notif.leida;

  return (
      <article
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            background: isNew ? 'rgba(255,255,255,0.04)' : '#0a0a0a',
            border: `1px solid ${isNew ? meta.color + '30' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 14,
            padding: '1.1rem 1.25rem',
            display: 'flex', gap: '1rem', alignItems: 'flex-start',
            transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
            transform: hovered ? 'translateX(4px)' : 'none',
            boxShadow: hovered ? `4px 0 24px ${meta.color}18` : 'none',
            overflow: 'hidden',
            animation: 'slideInNotif 0.35s ease both',
          }}
      >
        {/* Left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: '10%', bottom: '10%',
          width: 3, borderRadius: '0 4px 4px 0',
          background: isNew ? meta.color : 'rgba(255,255,255,0.08)',
          transition: 'background 0.3s',
        }} />

        {/* Icon bubble */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `${meta.color}15`,
          border: `1px solid ${meta.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.15rem',
        }}>{meta.icon}</div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {isNew && <PulseDot color={meta.color} />}
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: '0.88rem',
              color: isNew ? '#fff' : 'rgba(255,255,255,0.5)',
              letterSpacing: '-0.01em',
            }}>{notif.titulo}</span>
            <span style={{
              fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.09em',
              color: meta.color, background: `${meta.color}15`,
              border: `1px solid ${meta.color}25`, borderRadius: 999,
              padding: '0.1rem 0.5rem', fontWeight: 600,
            }}>{meta.label}</span>
          </div>
          <p style={{
            fontSize: '0.8rem', color: isNew ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
            lineHeight: 1.5, margin: 0,
          }}>{notif.mensaje}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
            <Clock size={10} style={{ color: 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.2)' }}>
            {notif.fecha ? dateFormatter.format(new Date(notif.fecha)) : '—'}
          </span>
          </div>
        </div>

        {/* Action */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {isNew ? (
              <button
                  onClick={() => onMark(notif.id)}
                  disabled={isMarking}
                  style={{
                    background: `${meta.color}18`,
                    border: `1px solid ${meta.color}30`,
                    borderRadius: 8, padding: '0.4rem 0.75rem',
                    color: meta.color, fontSize: '0.72rem', fontWeight: 600,
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: isMarking ? 'not-allowed' : 'pointer',
                    opacity: isMarking ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    transition: 'background 0.18s',
                    whiteSpace: 'nowrap',
                  }}
              >
                <Eye size={11} /> Marcar
              </button>
          ) : (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={12} style={{ color: '#4ade80' }} />
              </div>
          )}
        </div>
      </article>
  );
}

/* ── MAIN ── */
export default function Notificaciones({ userId }) {
  const [filter, setFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [view, setView] = useState('feed'); // feed | grid

  const notificacionesQuery  = useNotificaciones(userId);
  const marcarMutation       = useMarcarLectura();
  const despacharMutation    = useDespacharNotificacion();

  const raw = notificacionesQuery.data?.notificaciones || notificacionesQuery.data || [];

  /* Filtros */
  const filtered = raw.filter(n => {
    const passRead = filter === 'todos' ? true : filter === 'leidas' ? n.leida : !n.leida;
    if (!passRead) return false;
    if (tipoFilter === 'todos') return true;
    const meta = getTipoMeta(n.tipo, n.titulo);
    return meta.label.toLowerCase() === tipoFilter;
  });

  const noLeidas   = raw.filter(n => !n.leida).length;
  const leidas     = raw.filter(n => n.leida).length;
  const tiposUniq  = [...new Set(raw.map(n => getTipoMeta(n.tipo, n.titulo).label.toLowerCase()))];

  /* Stats por tipo */
  const statsByTipo = {};
  raw.forEach(n => {
    const lbl = getTipoMeta(n.tipo, n.titulo).label;
    statsByTipo[lbl] = (statsByTipo[lbl] || 0) + 1;
  });

  async function handleMark(id) {
    try { await marcarMutation.mutateAsync({ usuarioId: userId, notificacionId: id }); }
    catch (e) { console.error(e); }
  }

  async function handleDespachar() {
    try { await despacharMutation.mutateAsync(userId); }
    catch (e) { console.error(e); }
  }

  const anyError = notificacionesQuery.error || marcarMutation.error || despacharMutation.error;

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

        .nf-root { font-family: 'Space Grotesk', sans-serif; color: #fff; }

        @keyframes pingDot {
          0%,100% { transform:scale(1); opacity:0.5; }
          50%      { transform:scale(2.2); opacity:0; }
        }
        @keyframes slideInNotif {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes scanLine {
          0%   { transform:translateY(-100%); }
          100% { transform:translateY(500%); }
        }
        @keyframes float {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-5px); }
        }
        @keyframes breathe {
          0%,100% { opacity:0.4; }
          50%      { opacity:1; }
        }
        @keyframes countIn {
          from { transform:translateY(16px); opacity:0; }
          to   { transform:translateY(0); opacity:1; }
        }
        @keyframes gradShift {
          0%   { background-position:0% 50%; }
          50%  { background-position:100% 50%; }
          100% { background-position:0% 50%; }
        }

        .nf-filter-btn {
          padding: 0.4rem 0.9rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: rgba(255,255,255,0.35);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .nf-filter-btn.active {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
          color: #fff;
        }
        .nf-filter-btn:hover:not(.active) {
          color: rgba(255,255,255,0.65);
          border-color: rgba(255,255,255,0.12);
        }

        .nf-despachar {
          padding: 0.6rem 1.25rem;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #6358ff, #22d3a5);
          background-size: 200% 200%;
          animation: gradShift 3s ease infinite;
          color: #fff;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          display: flex; align-items: center; gap: 0.4rem;
          transition: opacity 0.2s, transform 0.15s;
          box-shadow: 0 4px 20px rgba(99,88,255,0.3);
        }
        .nf-despachar:hover { opacity:0.85; transform:translateY(-1px); }
        .nf-despachar:disabled { opacity:0.4; cursor:not-allowed; transform:none; }

        .nf-stat {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 1.1rem 1.25rem;
          display: flex; flex-direction: column; gap: 0.3rem;
          position: relative; overflow: hidden;
        }

        .nf-empty-icon {
          animation: float 4s ease-in-out infinite;
        }

        .nf-scan {
          position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,88,255,0.5), transparent);
          animation: scanLine 4s linear infinite;
          pointer-events: none;
        }
      `}</style>

        <div className="nf-root" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {anyError && <AlertaPanel type="error" title="Error" message={anyError?.message || 'Error al procesar notificaciones'} />}

          {/* ══ HERO ══ */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #0d0d14 0%, #0a0a0f 60%, rgba(99,88,255,0.06) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18, padding: '2rem',
          }}>
            <div className="nf-scan" />

            {/* BG decoration */}
            <div style={{
              position: 'absolute', top: -60, right: -60, width: 200, height: 200,
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,88,255,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -40, left: '30%', width: 150, height: 150,
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,165,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  </div>
                  <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 300,
                    fontSize: 'clamp(1.6rem, 5.5vw, 4.2rem)',
                    lineHeight: 1.0,
                    letterSpacing: '-0.05em',
                    background: 'linear-gradient(150deg, #ffffff 0%, rgba(255,255,255,0.45) 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', margin: 0,
                  }}>
                    Centro de mensajes
                  </h1>
                </div>

                <button
                    onClick={handleDespachar}
                    disabled={despacharMutation.isPending || !raw.length}
                    className="nf-despachar"
                >
                  {despacharMutation.isPending
                      ? <><Radio size={14} style={{ animation: 'breathe 1s infinite' }} /> Despachando…</>
                      : <><Zap size={14} /> Despachar todas</>}
                </button>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
                {[
                  { val: raw.length,   label: 'Total',    color: '#fff',    icon: <Bell size={13}/> },
                  { val: noLeidas,     label: 'Sin leer', color: '#f87171', icon: <PulseDot color="#f87171"/> },
                  { val: leidas,       label: 'Leídas',   color: '#4ade80', icon: <Check size={13}/> },
                  { val: Object.keys(statsByTipo).length, label: 'Categorías', color: '#a78bfa', icon: <Filter size={13}/> },
                ].map((s, i) => (
                    <div key={i} className="nf-stat">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: s.color }}>
                        {s.icon}
                        <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
                      </div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem', lineHeight: 1, letterSpacing: '-0.04em', color: s.color, animation: 'countIn 0.5s ease both' }}>
                        <Counter value={s.val} />
                      </div>
                    </div>
                ))}

                {/* Distribution mini bars */}
                {Object.entries(statsByTipo).length > 0 && (
                    <div className="nf-stat" style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: '0.4rem' }}>Distribución</span>
                      {Object.entries(statsByTipo).map(([tipo, count]) => {
                        const pct = Math.round((count / raw.length) * 100);
                        const color = getTipoMeta('', tipo).color;
                        return (
                            <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', width: 72, flexShrink: 0 }}>{tipo}</span>
                              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.8s ease' }} />
                              </div>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', width: 28, textAlign: 'right' }}>{pct}%</span>
                            </div>
                        );
                      })}
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* ══ FILTERS ══ */}
          <div style={{
            display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
            padding: '0.85rem 1.1rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
          }}>
            {/* Read filter */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { id: 'todos',     label: 'Todas',    icon: <Inbox size={11}/> },
                { id: 'no-leidas', label: 'Sin leer', icon: <Bell size={11}/>, count: noLeidas },
                { id: 'leidas',    label: 'Leídas',   icon: <CheckCheck size={11}/> },
              ].map(f => (
                  <button key={f.id} className={`nf-filter-btn ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
                    {f.icon} {f.label}
                    {f.count > 0 && (
                        <span style={{ background: '#f87171', color: '#fff', borderRadius: 999, padding: '0 0.35rem', fontSize: '0.62rem', fontWeight: 700, marginLeft: '0.2rem' }}>
                    {f.count}
                  </span>
                    )}
                  </button>
              ))}
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />

            {/* Type filter */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button className={`nf-filter-btn ${tipoFilter === 'todos' ? 'active' : ''}`} onClick={() => setTipoFilter('todos')}>
                Todos
              </button>
              {tiposUniq.map(t => (
                  <button key={t} className={`nf-filter-btn ${tipoFilter === t ? 'active' : ''}`} onClick={() => setTipoFilter(t)}>
                    {getTipoMeta('', t).icon} {t}
                  </button>
              ))}
            </div>
          </div>

          {/* ══ FEED ══ */}
          {notificacionesQuery.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><LoadingSpinner /></div>
          ) : filtered.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* Unread section */}
                {filtered.some(n => !n.leida) && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0' }}>
                        <PulseDot color="#f87171" />
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>
                    Sin leer · {filtered.filter(n => !n.leida).length}
                  </span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                      </div>
                      {filtered.filter(n => !n.leida).map((notif, i) => (
                          <div key={notif.id} style={{ animationDelay: `${i * 50}ms` }}>
                            <NotifCard notif={notif} onMark={handleMark} isMarking={marcarMutation.isPending} />
                          </div>
                      ))}
                    </>
                )}

                {/* Read section */}
                {filtered.some(n => n.leida) && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0 0.25rem' }}>
                        <CheckCheck size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)' }}>
                    Leídas · {filtered.filter(n => n.leida).length}
                  </span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
                      </div>
                      {filtered.filter(n => n.leida).map((notif, i) => (
                          <div key={notif.id} style={{ animationDelay: `${i * 40}ms` }}>
                            <NotifCard notif={notif} onMark={handleMark} isMarking={marcarMutation.isPending} />
                          </div>
                      ))}
                    </>
                )}
              </div>
          ) : (
              /* ── Empty state ── */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '1rem', padding: '4rem 2rem', textAlign: 'center',
                background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)',
                borderRadius: 16,
              }}>
                <div className="nf-empty-icon" style={{ fontSize: '3.5rem' }}>
                  {filter === 'leidas' ? '✅' : filter === 'no-leidas' ? '🔔' : '📭'}
                </div>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.18)' }}>
                    {filter === 'leidas' ? 'Sin leídas aún' : filter === 'no-leidas' ? 'Todo al día' : 'Bandeja vacía'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.4rem' }}>
                    {filter === 'no-leidas' ? 'No tienes notificaciones pendientes.' : 'No hay notificaciones en esta categoría.'}
                  </div>
                </div>
              </div>
          )}
        </div>
      </>
  );
}