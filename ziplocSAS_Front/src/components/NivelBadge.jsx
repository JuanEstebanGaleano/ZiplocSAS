export default function NivelBadge({ nivel, puntos }) {
  const key = String(nivel || '').toLowerCase();

  const TIER = {
    bronce: {
      color: '#CD7F32',
      colorB: '#8B4513',
      glow: 'rgba(205,127,50,0.35)',
      bg: 'rgba(205,127,50,0.07)',
      border: 'rgba(205,127,50,0.25)',
      label: 'BRONCE',
      rank: 1,
      total: 4,
      symbol: '◆',
      bars: 1,
    },
    plata: {
      color: '#D0D0D0',
      colorB: '#888',
      glow: 'rgba(192,192,192,0.3)',
      bg: 'rgba(192,192,192,0.06)',
      border: 'rgba(192,192,192,0.22)',
      label: 'PLATA',
      rank: 2,
      total: 4,
      symbol: '◆◆',
      bars: 2,
    },
    oro: {
      color: '#FFD700',
      colorB: '#B8860B',
      glow: 'rgba(255,215,0,0.4)',
      bg: 'rgba(255,215,0,0.07)',
      border: 'rgba(255,215,0,0.28)',
      label: 'ORO',
      rank: 3,
      total: 4,
      symbol: '◆◆◆',
      bars: 3,
    },
    platino: {
      color: '#E8E8F0',
      colorB: '#9090C0',
      glow: 'rgba(229,228,226,0.45)',
      bg: 'rgba(229,228,226,0.07)',
      border: 'rgba(229,228,226,0.3)',
      label: 'PLATINO',
      rank: 4,
      total: 4,
      symbol: '◆◆◆◆',
      bars: 4,
    },
  };

  const t = TIER[key] || {
    color: '#666',
    colorB: '#444',
    glow: 'rgba(100,100,100,0.2)',
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.1)',
    label: String(nivel || 'SIN NIVEL').toUpperCase(),
    rank: 0, total: 4, symbol: '◇', bars: 0,
  };

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne+Mono&family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes nbShine {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(250%) skewX(-15deg); }
        }
        @keyframes nbPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes nbIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
        .nb-wrap { animation: nbIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .nb-wrap:hover .nb-shine { animation: nbShine 0.7s ease forwards; }
      `}</style>

        <article
            className="nb-wrap"
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '14px',
              background: t.bg,
              border: `1px solid ${t.border}`,
              boxShadow: `0 0 28px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
              padding: '18px 20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'default',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'box-shadow 0.25s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 44px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 28px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`}
        >
          {/* Shine sweep on hover */}
          <div className="nb-shine" style={{
            position: 'absolute', top: 0, left: 0,
            width: '40%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
            transform: 'translateX(-100%) skewX(-15deg)',
            pointerEvents: 'none',
          }} />

          {/* Top row: label + symbol */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: "'Syne Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
          }}>
            Nivel actual
          </span>
            <span style={{
              fontFamily: "'Syne Mono', monospace",
              fontSize: '10px',
              color: t.color,
              letterSpacing: '0.12em',
              opacity: 0.7,
              textShadow: `0 0 8px ${t.glow}`,
            }}>
            {t.symbol}
          </span>
          </div>

          {/* Level name */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '26px',
            lineHeight: 1,
            color: t.color,
            letterSpacing: '-0.01em',
            textShadow: `0 0 20px ${t.glow}`,
          }}>
            {t.label}
          </span>
            {/* Rank pill */}
            <span style={{
              fontFamily: "'Syne Mono', monospace",
              fontSize: '9px',
              color: 'rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '2px 7px',
              borderRadius: '20px',
              letterSpacing: '0.1em',
              alignSelf: 'center',
            }}>
            #{t.rank}/{t.total}
          </span>
          </div>

          {/* Points */}
          {typeof puntos !== 'undefined' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: t.color,
                  boxShadow: `0 0 5px ${t.color}`,
                  animation: 'nbPulse 2.5s ease-in-out infinite',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: "'Syne Mono', monospace",
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.05em',
                }}>
              <span style={{ color: t.color, fontWeight: 600 }}>{Number(puntos).toLocaleString('es-CO')}</span>
                  {' '}pts acumulados
            </span>
              </div>
          )}

          {/* Tier progress bars */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
            {Array.from({ length: t.total }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: '3px', borderRadius: '2px',
                  background: i < t.bars
                      ? `linear-gradient(90deg, ${t.colorB}, ${t.color})`
                      : 'rgba(255,255,255,0.07)',
                  boxShadow: i < t.bars ? `0 0 4px ${t.glow}` : 'none',
                  transition: 'background 0.3s',
                }} />
            ))}
          </div>
        </article>
      </>
  );
}