import { useState, useEffect, useRef } from 'react';

const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/* ── Tipo metadata ── */
const TIPO_META = {
    INFO:       { color: '#00C2FF', bg: 'rgba(0,194,255,0.08)',   icon: 'ℹ', label: 'Info' },
    WARNING:    { color: '#FFB800', bg: 'rgba(255,184,0,0.08)',   icon: '⚠', label: 'Aviso' },
    ERROR:      { color: '#FF3B5C', bg: 'rgba(255,59,92,0.08)',   icon: '✕', label: 'Error' },
    SUCCESS:    { color: '#00FFB2', bg: 'rgba(0,255,178,0.08)',   icon: '✓', label: 'OK' },
    SYSTEM:     { color: '#B44FFF', bg: 'rgba(180,79,255,0.08)',  icon: '◈', label: 'Sistema' },
    SEGURIDAD:  { color: '#FF6B2B', bg: 'rgba(255,107,43,0.08)', icon: '⬡', label: 'Seguridad' },
};

function getTipoMeta(tipo = '') {
    const upper = tipo.toUpperCase();
    return TIPO_META[upper] || { color: '#888', bg: 'rgba(255,255,255,0.05)', icon: '◌', label: tipo || '—' };
}

/* ── Relative time ── */
function relativeTime(fecha) {
    if (!fecha) return null;
    const diff = Date.now() - new Date(fecha).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `hace ${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h}h`;
    return null;
}

/* ── Single notification row ── */
function NotifRow({ alerta, index }) {
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const meta = getTipoMeta(alerta.tipo);
    const rel = relativeTime(alerta.fecha);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), index * 55);
        return () => clearTimeout(t);
    }, [index]);

    return (
        <article
            onClick={() => setExpanded(v => !v)}
            style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '3px 36px 1fr auto',
                gap: '0 12px',
                alignItems: 'start',
                padding: '14px 16px 14px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer',
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateX(-8px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease, background 0.15s',
                borderRadius: '6px',
                overflow: 'hidden',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            {/* Left accent bar */}
            <div style={{
                width: '3px',
                alignSelf: 'stretch',
                borderRadius: '0 2px 2px 0',
                background: meta.color,
                boxShadow: `0 0 8px ${meta.color}60`,
                marginLeft: '-1px',
                minHeight: '36px',
            }} />

            {/* Icon bubble */}
            <div style={{
                width: 36, height: 36,
                borderRadius: '10px',
                background: meta.bg,
                border: `1px solid ${meta.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px',
                color: meta.color,
                flexShrink: 0,
                marginTop: '1px',
            }}>
                {meta.icon}
            </div>

            {/* Content */}
            <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{
              fontFamily: "'Syne Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: meta.color,
              fontWeight: 600,
          }}>
            {meta.label}
          </span>
                    {rel && (
                        <span style={{
                            fontFamily: "'Syne Mono', monospace",
                            fontSize: '8px',
                            color: 'rgba(255,255,255,0.2)',
                            letterSpacing: '0.08em',
                            background: 'rgba(255,255,255,0.04)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                        }}>
              {rel}
            </span>
                    )}
                </div>
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    color: expanded ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
                    lineHeight: '1.5',
                    margin: 0,
                    overflow: expanded ? 'visible' : 'hidden',
                    display: expanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: expanded ? 'unset' : 2,
                    WebkitBoxOrient: 'vertical',
                    transition: 'color 0.2s',
                }}>
                    {alerta.mensaje}
                </p>
                {!expanded && alerta.fecha && (
                    <span style={{
                        fontFamily: "'Syne Mono', monospace",
                        fontSize: '9px',
                        color: 'rgba(255,255,255,0.18)',
                        letterSpacing: '0.06em',
                        marginTop: '5px',
                        display: 'block',
                    }}>
            {dateFormatter.format(new Date(alerta.fecha))}
          </span>
                )}
                {expanded && alerta.fecha && (
                    <div style={{
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap',
                    }}>
                        <div>
                            <span style={{ fontFamily: "'Syne Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Fecha</span>
                            <span style={{ fontFamily: "'Syne Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                {dateFormatter.format(new Date(alerta.fecha))}
              </span>
                        </div>
                        <div>
                            <span style={{ fontFamily: "'Syne Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>ID</span>
                            <span style={{ fontFamily: "'Syne Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                #{String(alerta.id).padStart(6, '0')}
              </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Chevron */}
            <div style={{
                color: 'rgba(255,255,255,0.15)',
                fontSize: '11px',
                transform: expanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s ease',
                paddingTop: '2px',
                flexShrink: 0,
            }}>›</div>
        </article>
    );
}

/* ── Main component ── */
export default function NotificacionesPanel({ alertas = [] }) {
    const [filter, setFilter] = useState('TODOS');
    const tipos = ['TODOS', ...Array.from(new Set(alertas.map(a => (a.tipo || '').toUpperCase()).filter(Boolean)))];

    const filtered = filter === 'TODOS'
        ? alertas
        : alertas.filter(a => (a.tipo || '').toUpperCase() === filter);

    const unread = alertas.length;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne+Mono&family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes npFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes npPing {
          0%   { transform: scale(1); opacity: 0.8; }
          80%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .np-root { animation: npFadeUp 0.4s ease both; }
        .np-filter-btn { transition: all 0.15s ease; }
        .np-filter-btn:hover { transform: translateY(-1px); }
      `}</style>

            <section
                className="np-root"
                style={{
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.015) 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    fontFamily: "'DM Sans', sans-serif",
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 20px 0',
                    background: 'rgba(255,255,255,0.01)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                {/* Ping badge */}
                                <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
                                    <div style={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        background: '#00FFB2',
                                        boxShadow: '0 0 6px #00FFB2',
                                        position: 'relative', zIndex: 1,
                                    }} />
                                    {unread > 0 && (
                                        <div style={{
                                            position: 'absolute', inset: 0, borderRadius: '50%',
                                            background: '#00FFB2', opacity: 0.5,
                                            animation: 'npPing 2s ease-in-out infinite',
                                        }} />
                                    )}
                                </div>
                                <h2 style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: 800,
                                    fontSize: '18px',
                                    color: '#fff',
                                    margin: 0,
                                    letterSpacing: '-0.01em',
                                }}>
                                    Notificaciones
                                </h2>
                                {unread > 0 && (
                                    <span style={{
                                        fontFamily: "'Syne Mono', monospace",
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: '#00FFB2',
                                        background: 'rgba(0,255,178,0.12)',
                                        border: '1px solid rgba(0,255,178,0.25)',
                                        padding: '2px 8px',
                                        borderRadius: '20px',
                                        letterSpacing: '0.04em',
                                    }}>
                    {unread}
                  </span>
                                )}
                            </div>
                            <p style={{
                                fontFamily: "'Syne Mono', monospace",
                                fontSize: '9px',
                                color: 'rgba(255,255,255,0.2)',
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                margin: 0,
                            }}>
                                Alertas del sistema · Tiempo real
                            </p>
                        </div>

                        {/* Summary chips */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {Object.entries(TIPO_META).slice(0, 3).map(([key, meta]) => {
                                const count = alertas.filter(a => (a.tipo || '').toUpperCase() === key).length;
                                if (!count) return null;
                                return (
                                    <div key={key} style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        background: meta.bg,
                                        border: `1px solid ${meta.color}25`,
                                    }}>
                                        <span style={{ fontSize: '10px', color: meta.color }}>{meta.icon}</span>
                                        <span style={{
                                            fontFamily: "'Syne Mono', monospace",
                                            fontSize: '9px',
                                            color: meta.color,
                                            letterSpacing: '0.06em',
                                        }}>{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filter tabs */}
                    {tipos.length > 1 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {tipos.map(t => {
                                const meta = t === 'TODOS' ? { color: '#888', bg: 'rgba(255,255,255,0.05)' } : getTipoMeta(t);
                                const active = filter === t;
                                return (
                                    <button
                                        key={t}
                                        className="np-filter-btn"
                                        onClick={() => setFilter(t)}
                                        style={{
                                            fontFamily: "'Syne Mono', monospace",
                                            fontSize: '9px',
                                            letterSpacing: '0.14em',
                                            textTransform: 'uppercase',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            border: `1px solid ${active ? meta.color : 'rgba(255,255,255,0.07)'}`,
                                            background: active ? meta.bg : 'transparent',
                                            color: active ? meta.color : 'rgba(255,255,255,0.3)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {t === 'TODOS' ? 'Todos' : getTipoMeta(t).label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Body */}
                <div style={{ padding: '4px 16px 8px' }}>
                    {filtered.length ? (
                        <div>
                            {filtered.map((alerta, i) => (
                                <NotifRow key={alerta.id ?? i} alerta={alerta} index={i} />
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            padding: '40px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                        }}>
                            <div style={{
                                width: 48, height: 48,
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px dashed rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '22px',
                                color: 'rgba(255,255,255,0.15)',
                            }}>◌</div>
                            <p style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '13px',
                                color: 'rgba(255,255,255,0.25)',
                                margin: 0,
                                textAlign: 'center',
                            }}>
                                {filter !== 'TODOS' ? `Sin alertas de tipo ${filter}` : 'Sin notificaciones disponibles'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer rule */}
                {filtered.length > 0 && (
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        padding: '10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
            <span style={{
                fontFamily: "'Syne Mono', monospace",
                fontSize: '9px',
                color: 'rgba(255,255,255,0.15)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
            }}>
              {filtered.length} notificación{filtered.length !== 1 ? 'es' : ''}
            </span>
                        <div style={{ display: 'flex', gap: '3px' }}>
                            {[...Array(Math.min(filtered.length, 5))].map((_, i) => (
                                <div key={i} style={{
                                    width: 4, height: 4, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.15)',
                                }} />
                            ))}
                            {filtered.length > 5 && (
                                <span style={{
                                    fontFamily: "'Syne Mono', monospace",
                                    fontSize: '8px',
                                    color: 'rgba(255,255,255,0.15)',
                                    marginLeft: '3px',
                                }}>+{filtered.length - 5}</span>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </>
    );
}