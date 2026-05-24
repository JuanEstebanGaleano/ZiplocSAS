import { useState, useEffect, useRef } from 'react';

const NAV_ITEMS = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="7" height="7" rx="1.5" />
                <rect x="11" y="2" width="7" height="7" rx="1.5" />
                <rect x="2" y="11" width="7" height="7" rx="1.5" />
                <rect x="11" y="11" width="7" height="7" rx="1.5" />
            </svg>
        ),
        accent: '#00FFB2',
        glyph: '01',
    },
    {
        key: 'billeteras',
        label: 'Billeteras',
        icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="5" width="16" height="12" rx="2" />
                <path d="M14 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="currentColor" stroke="none" />
                <path d="M2 8h16" />
                <path d="M6 5V3.5A1.5 1.5 0 0 1 7.5 2h5A1.5 1.5 0 0 1 14 3.5V5" />
            </svg>
        ),
        accent: '#00C2FF',
        glyph: '02',
    },
    {
        key: 'transacciones',
        label: 'Transacciones',
        icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 10h12M13 6l4 4-4 4M7 6 3 10l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        accent: '#B44FFF',
        glyph: '03',
    },
    {
        key: 'analitica',
        label: 'Analítica',
        icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="2,15 7,9 11,12 16,5 18,7" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="2" y1="18" x2="18" y2="18" strokeLinecap="round" />
            </svg>
        ),
        accent: '#FFB800',
        glyph: '04',
    },
    {
        key: 'recompensas',
        label: 'Recompensas',
        icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.25l-4.76 2.38.91-5.3L2.3 7.6l5.3-.8z" strokeLinejoin="round" />
            </svg>
        ),
        accent: '#FF4D6D',
        glyph: '05',
    },
];

function GlitchText({ text }) {
    const [glitching, setGlitching] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setGlitching(true);
            setTimeout(() => setGlitching(false), 120);
        }, 4000 + Math.random() * 3000);
        return () => clearInterval(intervalRef.current);
    }, []);

    return (
        <span style={{ position: 'relative', display: 'inline-block' }}>
      {text}
            {glitching && (
                <>
          <span style={{
              position: 'absolute', left: 0, top: 0,
              color: '#00FFB2', clipPath: 'inset(30% 0 40% 0)',
              transform: 'translate(-2px, 0)', opacity: 0.8,
              mixBlendMode: 'screen',
          }}>{text}</span>
                    <span style={{
                        position: 'absolute', left: 0, top: 0,
                        color: '#FF4D6D', clipPath: 'inset(55% 0 10% 0)',
                        transform: 'translate(2px, 0)', opacity: 0.8,
                        mixBlendMode: 'screen',
                    }}>{text}</span>
                </>
            )}
    </span>
    );
}

export default function NavBar({ activeView, onNavigate }) {
    const [hovered, setHovered] = useState(null);
    const [tick, setTick] = useState(0);
    const activeItem = NAV_ITEMS.find(i => i.key === activeView);

    useEffect(() => {
        const t = setInterval(() => setTick(n => n + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const timeStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne+Mono&family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .nb-root {
          width: 240px;
          min-height: 100vh;
          background: #07070c;
          border-right: 1px solid rgba(255,255,255,0.055);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }

        /* Atmospheric glow blobs */
        .nb-root::before {
          content: '';
          position: absolute;
          top: -60px; left: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(0,255,178,0.07) 0%, transparent 70%);
          pointer-events: none;
          transition: opacity 0.6s;
        }
        .nb-root::after {
          content: '';
          position: absolute;
          bottom: -40px; right: -40px;
          width: 160px; height: 160px;
          background: radial-gradient(circle, rgba(180,79,255,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Scanlines overlay */
        .nb-scanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0,0,0,0.10) 3px,
            rgba(0,0,0,0.10) 4px
          );
          pointer-events: none;
          z-index: 0;
        }

        .nb-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0;
        }

        /* ── Brand ── */
        .nb-brand {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          position: relative;
        }
        .nb-brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .nb-logo {
          width: 32px; height: 32px;
          position: relative;
          flex-shrink: 0;
        }
        .nb-logo-hex {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #00FFB2, #00C2FF);
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          display: flex; align-items: center; justify-content: center;
          animation: nbLogoPulse 3s ease-in-out infinite;
        }
        @keyframes nbLogoPulse {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 4px #00FFB260); }
          50% { filter: brightness(1.2) drop-shadow(0 0 10px #00FFB2aa); }
        }
        .nb-logo-hex-inner {
          width: 12px; height: 12px;
          background: #07070c;
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        }
        .nb-wordmark {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 15px;
          color: #fff;
          letter-spacing: 0.01em;
          line-height: 1;
        }
        .nb-wordmark span {
          color: #00FFB2;
        }
        .nb-tagline {
          font-family: 'Syne Mono', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          line-height: 1.6;
        }

        /* Status bar */
        .nb-status {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 6px 10px;
          background: rgba(0,255,178,0.04);
          border: 1px solid rgba(0,255,178,0.1);
          border-radius: 6px;
        }
        .nb-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #00FFB2;
          animation: nbDotBlink 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes nbDotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .nb-status-text {
          font-family: 'Syne Mono', monospace;
          font-size: 9px;
          color: rgba(0,255,178,0.6);
          letter-spacing: 0.1em;
          flex: 1;
        }
        .nb-status-clock {
          font-family: 'Syne Mono', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.05em;
        }

        /* ── Section label ── */
        .nb-section-label {
          font-family: 'Syne Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.15);
          padding: 16px 20px 8px;
        }

        /* ── Nav items ── */
        .nb-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 10px;
          flex: 1;
        }

        .nb-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.15s ease;
          text-align: left;
          outline: none;
        }
        .nb-item:hover { transform: translateX(2px); }
        .nb-item:active { transform: translateX(1px) scale(0.99); }

        .nb-item-bg {
          position: absolute;
          inset: 0;
          border-radius: 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .nb-item:hover .nb-item-bg { opacity: 1; }
        .nb-item.active .nb-item-bg { opacity: 1; }

        .nb-item-border {
          position: absolute;
          left: 0; top: 4px; bottom: 4px;
          width: 2px;
          border-radius: 1px;
          opacity: 0;
          transition: opacity 0.2s, height 0.2s;
        }
        .nb-item.active .nb-item-border { opacity: 1; }
        .nb-item:hover:not(.active) .nb-item-border { opacity: 0.4; }

        .nb-item-glyph {
          font-family: 'Syne Mono', monospace;
          font-size: 8px;
          color: rgba(255,255,255,0.12);
          width: 28px;
          text-align: center;
          letter-spacing: 0.05em;
          flex-shrink: 0;
          transition: color 0.2s;
          padding: 12px 0;
        }
        .nb-item.active .nb-item-glyph,
        .nb-item:hover .nb-item-glyph { color: rgba(255,255,255,0.3); }

        .nb-item-icon {
          width: 18px; height: 18px;
          flex-shrink: 0;
          transition: color 0.2s, filter 0.2s;
          color: rgba(255,255,255,0.3);
        }
        .nb-item.active .nb-item-icon { color: var(--item-accent); filter: drop-shadow(0 0 4px var(--item-accent)); }
        .nb-item:hover:not(.active) .nb-item-icon { color: rgba(255,255,255,0.65); }

        .nb-item-label {
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          transition: color 0.2s;
          letter-spacing: 0.01em;
          padding: 12px 8px;
          flex: 1;
        }
        .nb-item.active .nb-item-label { color: #fff; font-weight: 500; }
        .nb-item:hover:not(.active) .nb-item-label { color: rgba(255,255,255,0.75); }

        .nb-item-arrow {
          font-size: 10px;
          color: rgba(255,255,255,0.0);
          padding-right: 12px;
          transition: color 0.2s, transform 0.2s;
          flex-shrink: 0;
        }
        .nb-item.active .nb-item-arrow {
          color: var(--item-accent);
          transform: none;
        }
        .nb-item:hover .nb-item-arrow {
          color: rgba(255,255,255,0.2);
          transform: translateX(2px);
        }

        /* Active shimmer */
        .nb-item-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%);
          transform: translateX(-100%);
          pointer-events: none;
        }
        .nb-item.active .nb-item-shimmer {
          animation: nbShimmer 3s ease-in-out infinite;
        }
        @keyframes nbShimmer {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(100%); }
        }

        /* ── Divider ── */
        .nb-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          margin: 8px 10px;
        }

        /* ── Active indicator strip ── */
        .nb-active-strip {
          margin: 0 10px 4px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nb-active-strip-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .nb-active-strip-text {
          font-family: 'Syne Mono', monospace;
          font-size: 8.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          flex: 1;
        }
        .nb-active-strip-val {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 9.5px;
          letter-spacing: 0.05em;
        }

        /* ── Footer ── */
        .nb-footer {
          padding: 14px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nb-avatar {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(0,255,178,0.15), rgba(0,194,255,0.15));
          border: 1px solid rgba(0,255,178,0.2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 12px;
          color: #00FFB2;
          flex-shrink: 0;
        }
        .nb-user-info {
          flex: 1;
          min-width: 0;
        }
        .nb-user-label {
          font-family: 'Syne Mono', monospace;
          font-size: 8px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          display: block;
        }
        .nb-user-name {
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nb-user-status {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #00FFB2;
          box-shadow: 0 0 6px #00FFB2;
          flex-shrink: 0;
          animation: nbDotBlink 2s ease-in-out infinite;
        }

        /* ── Corner decoration ── */
        .nb-corner {
          position: absolute;
          top: 0; right: 0;
          width: 40px; height: 40px;
          overflow: hidden;
          pointer-events: none;
        }
        .nb-corner::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 0; height: 0;
          border-top: 40px solid rgba(0,255,178,0.08);
          border-left: 40px solid transparent;
        }

        /* ── Version tag ── */
        .nb-version {
          font-family: 'Syne Mono', monospace;
          font-size: 7.5px;
          color: rgba(255,255,255,0.1);
          letter-spacing: 0.1em;
          padding: 0 16px 10px;
          text-align: right;
        }
      `}</style>

            <nav className="nb-root" role="navigation" aria-label="Navegación principal">
                <div className="nb-scanlines" />
                <div className="nb-corner" />

                <div className="nb-inner">

                    {/* Brand */}
                    <div className="nb-brand">
                        <div className="nb-brand-row">
                            <div className="nb-logo">
                                <div className="nb-logo-hex">
                                    <div className="nb-logo-hex-inner" />
                                </div>
                            </div>
                            <div>
                                <div className="nb-wordmark">
                                    Ziploc<span>SAS</span>
                                </div>
                            </div>
                        </div>
                        <div className="nb-tagline">
                            <GlitchText text="Control operativo · Wallet" />
                        </div>
                        <div className="nb-status">
                            <div className="nb-status-dot" />
                            <span className="nb-status-text">SISTEMA ACTIVO</span>
                            <span className="nb-status-clock">{timeStr}</span>
                        </div>
                    </div>

                    {/* Nav */}
                    <div className="nb-section-label">Módulos</div>
                    <div className="nb-nav" role="tablist" aria-label="Navegación principal">
                        {NAV_ITEMS.map((item) => {
                            const isActive = activeView === item.key;
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    className={`nb-item${isActive ? ' active' : ''}`}
                                    style={{ '--item-accent': item.accent }}
                                    onClick={() => onNavigate(item.key)}
                                    onMouseEnter={() => setHovered(item.key)}
                                    onMouseLeave={() => setHovered(null)}
                                >
                                    {/* Backgrounds */}
                                    <div
                                        className="nb-item-bg"
                                        style={{
                                            background: isActive
                                                ? `linear-gradient(90deg, ${item.accent}14, transparent)`
                                                : `rgba(255,255,255,0.03)`,
                                        }}
                                    />
                                    <div
                                        className="nb-item-border"
                                        style={{ background: item.accent, boxShadow: isActive ? `0 0 6px ${item.accent}` : 'none' }}
                                    />
                                    <div className="nb-item-shimmer" />

                                    <span className="nb-item-glyph">{item.glyph}</span>
                                    <span className="nb-item-icon">{item.icon}</span>
                                    <span className="nb-item-label">{item.label}</span>
                                    <span className="nb-item-arrow">›</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active module strip */}
                    {activeItem && (
                        <>
                            <div className="nb-divider" />
                            <div className="nb-active-strip">
                                <div
                                    className="nb-active-strip-dot"
                                    style={{ background: activeItem.accent, boxShadow: `0 0 5px ${activeItem.accent}` }}
                                />
                                <span className="nb-active-strip-text">Vista activa</span>
                                <span className="nb-active-strip-val" style={{ color: activeItem.accent }}>
                  {activeItem.label.toUpperCase()}
                </span>
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="nb-footer">
                        <div className="nb-avatar">U</div>
                        <div className="nb-user-info">
                            <span className="nb-user-label">Usuario activo</span>
                            <span className="nb-user-name">Sesión iniciada</span>
                        </div>
                        <div className="nb-user-status" />
                    </div>

                    <div className="nb-version">v2.4.0 · ZiplocSAS</div>
                </div>
            </nav>
        </>
    );
}