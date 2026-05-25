import NivelBadge from '../components/NivelBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import { useBilleteras } from '../hooks/useBilleteras';
import { useTransacciones } from '../hooks/useTransacciones';
import { usePuntosRecompensas, useNivelRecompensas } from '../hooks/useRecompensas';
import { useEffect, useState, useRef } from 'react';
import { obtenerUsuarioPorId } from '../services/api';
import AIChat from '../components/AIChat';

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

function sortByRecentDate(items) {
  return [...items].sort((a, b) => {
    const aDate = a.fecha ? new Date(a.fecha).getTime() : 0;
    const bDate = b.fecha ? new Date(b.fecha).getTime() : 0;
    return bDate - aDate;
  });
}

/* ── Contador animado ─────────────────────────────────── */
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = Date.now();
    const from = 0;
    const to = Number(value) || 0;
    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{prefix}{moneyFormatter.format(display)}{suffix}</>;
}

/* ── Ticker de estado ────────────────────────────────── */
function StatusTicker({ label, value, up = true }) {
  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: '0.6rem', color: 'rgba(0,255,136,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: up ? '#00ff88' : '#ff4466', fontWeight: 600 }}>
        {up ? '▲' : '▼'} {value}
      </span>
      </div>
  );
}

/* ── Main ────────────────────────────────────────────── */
export default function Dashboard({ userId, onNavigate }) {
  const [usuario, setUsuario] = useState(null);
  const [usuarioError, setUsuarioError] = useState(null);
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  const billeterasQuery = useBilleteras(userId);
  const puntosQuery     = usePuntosRecompensas(userId);
  const nivelQuery      = useNivelRecompensas(userId);

  useEffect(() => {
    setMounted(true);
    let active = true;
    async function loadUsuario() {
      try {
        const data = await obtenerUsuarioPorId(userId);
        if (active) setUsuario(data);
      } catch (err) {
        if (active) setUsuarioError(err.message);
      }
    }
    loadUsuario();
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => { active = false; clearInterval(interval); };
  }, [userId]);

  const billeteras     = billeterasQuery.data?.billeteras || billeterasQuery.data || [];
  const firstWalletId  = billeteras.length > 0 ? billeteras[0].id : null;
  const transaccionesQuery = useTransacciones(firstWalletId);
  const transaccionesData  = transaccionesQuery.data?.transacciones || transaccionesQuery.data || [];
  const transacciones      = sortByRecentDate(transaccionesData).slice(0, 5);

  const puntosData = puntosQuery.data|| {};
  const nivelData  = nivelQuery.data || {};

  const puntosActuales = (() => {
    if (typeof puntosData === 'number') return puntosData;
    if (typeof puntosData === 'string' && !isNaN(+puntosData)) return +puntosData;
    if (puntosData) return Number(puntosData.puntosActuales ?? puntosData.puntos ?? puntosData.puntosAcumulados ?? 0);
    return Number(nivelData.puntosActuales ?? nivelData.puntos ?? 0);
  })();

  const nivelActual = nivelData.nivel || puntosData.nivel || usuario?.nivel || 'Bronce';

  const isLoading  = billeterasQuery.isLoading || puntosQuery.isLoading || nivelQuery.isLoading;
  const error      = billeterasQuery.error || puntosQuery.error || nivelQuery.error || usuarioError;
  const totalSaldo = billeteras.reduce((sum, w) => sum + Number(w.saldo || 0), 0);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Orbitron:wght@400;600;700;900&family=Inter:wght@300;400;500&display=swap');

        :root {
          --font-mono: 'Space Mono', monospace;
          --font-display: 'Orbitron', sans-serif;
          --font-body: 'Inter', sans-serif;
          --green: #00ff88;
          --green-dim: rgba(0,255,136,0.55);
          --green-muted: rgba(0,255,136,0.12);
          --green-border: rgba(0,255,136,0.18);
          --cyan: #00cfff;
          --cyan-dim: rgba(0,207,255,0.5);
          --red: #ff3355;
          --amber: #ffb020;
          --bg: #060609;
          --surface: rgba(255,255,255,0.028);
          --surface-hover: rgba(0,255,136,0.04);
          --border: rgba(255,255,255,0.055);
          --border-accent: rgba(0,255,136,0.22);
          --text: rgba(255,255,255,0.88);
          --text-dim: rgba(255,255,255,0.38);
          --text-faint: rgba(255,255,255,0.15);
        }

        .db-root {
          font-family: var(--font-body);
          min-height: 100vh;
          background: var(--bg);
          position: relative;
          overflow-x: hidden;
        }

        .db-atmo {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 55% at -5% 5%, rgba(0,255,136,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 45% 40% at 105% 95%, rgba(0,207,255,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 30% 30% at 50% 50%, rgba(0,255,136,0.025) 0%, transparent 70%);
        }

        .db-scan {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px
          );
          opacity: 0.35;
        }

        .db-noise {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px;
        }

        .db-content {
          position: relative; z-index: 1;
          max-width: 1400px; margin: 0 auto;
          padding: 0 1.5rem 4rem;
        }

        .db-header {
          display: flex; align-items: stretch; justify-content: space-between;
          border-bottom: 1px solid var(--border-accent);
          padding: 1rem 0; margin-bottom: 2rem;
          gap: 1rem; flex-wrap: wrap;
        }

        .db-header-left { display: flex; align-items: center; gap: 1.25rem; }

        .db-logo-mark {
          width: 36px; height: 36px;
          border: 1.5px solid var(--green-border); border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          background: var(--green-muted); position: relative; overflow: hidden;
        }
        .db-logo-mark::after {
          content: ''; position: absolute; inset: -50%;
          background: conic-gradient(from 0deg, transparent 70%, rgba(0,255,136,0.3) 100%);
          animation: spin 4s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .db-logo-inner {
          width: 14px; height: 14px; background: var(--green);
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); z-index: 1;
        }

        .db-brand-text { display: flex; flex-direction: column; gap: 1px; }
        .db-brand-main {
          font-family: var(--font-display); font-size: 0.75rem; font-weight: 700;
          color: var(--green); letter-spacing: 0.15em; text-transform: uppercase;
        }
        .db-brand-sub {
          font-family: var(--font-mono); font-size: 0.58rem;
          color: var(--text-faint); letter-spacing: 0.08em;
        }

        .db-header-tickers { display: flex; align-items: center; gap: 2rem; }
        .db-header-right   { display: flex; align-items: center; gap: 1.5rem; }

        .db-clock {
          font-family: var(--font-mono); font-size: 0.8rem;
          color: var(--green-dim); letter-spacing: 0.06em;
          display: flex; flex-direction: column; align-items: flex-end;
        }
        .db-clock-date { font-size: 0.58rem; color: var(--text-faint); margin-top: 2px; }

        .db-user-chip {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.4rem 0.9rem 0.4rem 0.5rem;
          border: 1px solid var(--border); border-radius: 999px;
          background: var(--surface); cursor: default;
        }
        .db-user-avatar {
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, var(--green-muted), rgba(0,207,255,0.1));
          border: 1px solid var(--green-border);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono); font-size: 0.65rem;
          color: var(--green); font-weight: 700;
        }
        .db-user-name { font-size: 0.78rem; color: var(--text-dim); font-weight: 500; }

        .db-layout { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media (min-width: 1100px) {
          .db-layout { grid-template-columns: 1fr 1fr 340px; }
        }

        .db-metrics {
          grid-column: 1 / -1;
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; border: 1px solid var(--border-accent);
          border-radius: 12px; overflow: hidden; background: var(--border-accent);
        }

        .db-metric {
          background: var(--bg); padding: 1.4rem 1.75rem;
          display: flex; flex-direction: column; gap: 0.5rem;
          position: relative; overflow: hidden; transition: background 0.2s;
        }
        .db-metric:hover { background: rgba(0,255,136,0.025); }
        .db-metric::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--green), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .db-metric:hover::before { opacity: 1; }

        .db-metric-label {
          font-family: var(--font-mono); font-size: 0.6rem;
          color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.12em;
        }
        .db-metric-value {
          font-family: var(--font-display); font-weight: 700;
          font-size: 1.75rem; color: #fff; letter-spacing: -0.02em; line-height: 1;
        }
        .db-metric-value.accent { color: var(--green); }
        .db-metric-sub {
          font-family: var(--font-mono); font-size: 0.62rem;
          color: var(--text-faint); display: flex; align-items: center; gap: 0.4rem;
        }
        .db-metric-dot {
          width: 5px; height: 5px; border-radius: 50%; background: var(--green);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .db-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden;
          display: flex; flex-direction: column;
          animation: fadeUp 0.5s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .db-panel.accent-border { border-color: var(--border-accent); }

        .db-panel-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); gap: 0.75rem;
        }
        .db-panel-title {
          font-family: var(--font-mono); font-size: 0.65rem;
          text-transform: uppercase; letter-spacing: 0.12em; color: var(--green-dim);
          display: flex; align-items: center; gap: 0.5rem;
        }
        .db-panel-title::before { content: '//'; color: var(--text-faint); font-weight: 400; }
        .db-panel-badge {
          font-family: var(--font-mono); font-size: 0.58rem; color: var(--text-faint);
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 0.2rem 0.6rem; border: 1px solid var(--border); border-radius: 4px;
        }
        .db-panel-body { padding: 1.25rem; flex: 1; }

        .db-wtable-head {
          display: grid; grid-template-columns: 1fr auto auto auto;
          gap: 1rem; padding: 0 0.5rem 0.6rem;
          font-family: var(--font-mono); font-size: 0.58rem;
          text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-faint);
          border-bottom: 1px solid var(--border); margin-bottom: 0.25rem;
        }
        .db-wrow {
          display: grid; grid-template-columns: 1fr auto auto auto;
          gap: 1rem; align-items: center; padding: 0.85rem 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.035);
          transition: background 0.15s; cursor: default;
        }
        .db-wrow:last-child { border-bottom: none; }
        .db-wrow:hover { background: var(--surface-hover); border-radius: 8px; }
        .db-wrow-name {
          font-size: 0.82rem; color: var(--text); font-weight: 500;
          display: flex; flex-direction: column; gap: 2px;
        }
        .db-wrow-tipo {
          font-family: var(--font-mono); font-size: 0.6rem;
          color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.08em;
        }
        .db-wrow-saldo {
          font-family: var(--font-mono); font-size: 0.82rem;
          color: var(--green); font-weight: 700; white-space: nowrap;
        }

        .db-tx-head {
          display: grid; grid-template-columns: 1fr auto auto;
          gap: 1rem; padding: 0 0.5rem 0.6rem;
          font-family: var(--font-mono); font-size: 0.58rem;
          text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-faint);
          border-bottom: 1px solid var(--border); margin-bottom: 0.25rem;
        }
        .db-tx-row {
          display: grid; grid-template-columns: 1fr auto auto;
          gap: 1rem; align-items: center; padding: 0.85rem 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.035); transition: background 0.15s;
        }
        .db-tx-row:last-child { border-bottom: none; }
        .db-tx-row:hover { background: var(--surface-hover); border-radius: 8px; }
        .db-tx-tipo {
          font-size: 0.8rem; color: var(--text); font-weight: 500;
          display: flex; flex-direction: column; gap: 2px;
        }
        .db-tx-fecha { font-family: var(--font-mono); font-size: 0.6rem; color: var(--text-faint); }
        .db-tx-monto {
          font-family: var(--font-mono); font-size: 0.82rem;
          font-weight: 700; color: var(--cyan); white-space: nowrap;
        }
        .db-tx-estado {
          font-family: var(--font-mono); font-size: 0.6rem;
          padding: 0.15rem 0.5rem; border-radius: 4px;
          text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
        }
        .estado-completada { background: rgba(0,255,136,0.1); color: var(--green); border: 1px solid rgba(0,255,136,0.2); }
        .estado-pendiente  { background: rgba(255,176,32,0.1); color: var(--amber); border: 1px solid rgba(255,176,32,0.2); }
        .estado-fallida    { background: rgba(255,51,85,0.1);  color: var(--red);   border: 1px solid rgba(255,51,85,0.2); }
        .estado-default    { background: rgba(255,255,255,0.05); color: var(--text-dim); border: 1px solid var(--border); }

        /* ── Nivel card ── */
        .db-nivel-arc { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.25rem; }
        .db-nivel-arc-text { display: flex; flex-direction: column; gap: 0.3rem; }
        .db-nivel-name {
          font-family: var(--font-display); font-size: 1.1rem; font-weight: 700;
          color: var(--green); letter-spacing: 0.04em;
        }
        .db-nivel-pts { font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-faint); }

        /* ✅ FIX: etiqueta de carga mientras umbral = 0 */
        .db-nivel-loading {
          font-family: var(--font-mono); font-size: 0.62rem;
          color: var(--text-faint); letter-spacing: 0.06em;
          animation: breathe 1.5s ease-in-out infinite;
        }
        @keyframes breathe {
          0%,100% { opacity: 0.3; }
          50%      { opacity: 1; }
        }

        .db-progress-bar-wrap { margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .db-progress-bar-track { height: 3px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; }
        .db-progress-bar-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, var(--green), var(--cyan));
          transition: width 1s cubic-bezier(0.4,0,0.2,1);
        }
        .db-progress-label {
          font-family: var(--font-mono); font-size: 0.6rem; color: var(--text-faint);
          display: flex; justify-content: space-between;
        }

        .db-perfil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.25rem; }
        .db-field { display: flex; flex-direction: column; gap: 0.25rem; }
        .db-field-label {
          font-family: var(--font-mono); font-size: 0.58rem;
          text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-faint);
        }
        .db-field-value { font-size: 0.82rem; color: var(--text); font-weight: 400; word-break: break-all; }

        .db-empty {
          border: 1px dashed rgba(0,255,136,0.12); border-radius: 8px;
          padding: 1.25rem; background: rgba(0,255,136,0.018);
        }
        .db-empty p {
          font-family: var(--font-mono); font-size: 0.72rem;
          color: var(--text-faint); margin-bottom: 0.75rem;
        }
        .db-btn-ghost {
          background: none; border: 1px solid var(--green-border); color: var(--green-dim);
          font-family: var(--font-mono); font-size: 0.68rem;
          padding: 0.35rem 0.85rem; border-radius: 5px; cursor: pointer;
          letter-spacing: 0.06em; transition: background 0.15s, color 0.15s;
          text-transform: uppercase;
        }
        .db-btn-ghost:hover { background: var(--green-muted); color: var(--green); }
        .db-btn-text {
          background: none; border: none; color: var(--green-dim);
          font-family: var(--font-mono); font-size: 0.65rem;
          cursor: pointer; letter-spacing: 0.06em; text-transform: uppercase;
          transition: color 0.15s; padding: 0;
        }
        .db-btn-text:hover { color: var(--green); }

        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.10s; }
        .d3 { animation-delay: 0.15s; }
        .d4 { animation-delay: 0.20s; }
        .d5 { animation-delay: 0.25s; }
      `}</style>
        <AIChat />

        <div className="db-atmo" />
        <div className="db-scan" />
        <div className="db-noise" />

        <div className="db-root">
          <div className="db-content">

            {/* ── Header ── */}
            <header className="db-header">
              <div className="db-header-left">
                <div className="db-logo-mark">
                  <div className="db-logo-inner" />
                </div>
                <div className="db-brand-text">
                  <span className="db-brand-main">ZiplocSAS</span>
                  <span className="db-brand-sub">Financial Terminal v2.4</span>
                </div>
              </div>

              <div className="db-header-tickers">
                <StatusTicker label="Sistema"    value="ONLINE"           up={true} />
                <StatusTicker label="Billeteras" value={billeteras.length} up={billeteras.length > 0} />
                <StatusTicker label="Puntos"     value={puntosActuales}    up={puntosActuales > 0} />
              </div>

              <div className="db-header-right">
                <div className="db-clock">
                  <span>{timeStr}</span>
                  <span className="db-clock-date">{now.toLocaleDateString('es-CO', { dateStyle: 'medium' })}</span>
                </div>
                <div className="db-user-chip">
                  <div className="db-user-avatar">
                    {(usuario?.nombre || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="db-user-name">{usuario?.nombre || 'Cargando…'}</span>
                </div>
              </div>
            </header>

            {(error || usuarioError) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <AlertaPanel
                      type="error"
                      title="Error de carga"
                      message={
                        error && usuarioError
                            ? `Datos: ${error?.message || String(error)} · Usuario: ${usuarioError}`
                            : error?.message || String(error || usuarioError)
                      }
                  />
                </div>
            )}

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
                  <LoadingSpinner />
                </div>
            ) : (
                <div className="db-layout">

                  {/* ── Metric strip ── */}
                  <div className="db-metrics" style={{ gridColumn: '1 / -1' }}>
                    <div className="db-metric">
                      <span className="db-metric-label">Saldo total consolidado</span>
                      <span className="db-metric-value accent">
                    $ <AnimatedNumber value={totalSaldo} />
                  </span>
                      <span className="db-metric-sub">
                    <span className="db-metric-dot" />
                        {billeteras.length} billeteras activas
                  </span>
                    </div>
                    <div className="db-metric">
                      <span className="db-metric-label">Puntos fidelización</span>
                      <span className="db-metric-value">
                    <AnimatedNumber value={puntosActuales} />
                  </span>
                      <span className="db-metric-sub">
                    <span className="db-metric-dot" style={{ background: 'var(--cyan)' }} />
                    Nivel {nivelActual}
                  </span>
                    </div>
                    <div className="db-metric">
                      <span className="db-metric-label">Transacciones recientes</span>
                      <span className="db-metric-value">
                    <AnimatedNumber value={transacciones.length} />
                  </span>
                      <span className="db-metric-sub">
                    <span className="db-metric-dot" style={{ background: 'var(--amber)', animationDelay: '0.5s' }} />
                    Últimas operaciones
                  </span>
                    </div>
                  </div>

                  {/* ── Billeteras ── */}
                  <div className="db-panel accent-border d1" style={{ gridColumn: 'span 1' }}>
                    <div className="db-panel-head">
                      <span className="db-panel-title">Billeteras activas</span>
                      <button className="db-btn-text" onClick={() => onNavigate('billeteras')}>Ver todas →</button>
                    </div>
                    <div className="db-panel-body">
                      {billeteras.length ? (
                          <>
                            <div className="db-wtable-head">
                              <span>Nombre</span><span>Tipo</span><span>Saldo</span><span>Acción</span>
                            </div>
                            {billeteras.map((wallet) => (
                                <div key={wallet.id} className="db-wrow">
                                  <div className="db-wrow-name">
                                    {wallet.nombre}
                                    <span className="db-wrow-tipo">{wallet.tipo}</span>
                                  </div>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{wallet.tipo}</span>
                                  <span className="db-wrow-saldo">$ {moneyFormatter.format(Number(wallet.saldo || 0))}</span>
                                  <button className="db-btn-ghost" onClick={() => onNavigate('billeteras')}>Ver</button>
                                </div>
                            ))}
                          </>
                      ) : (
                          <div className="db-empty">
                            <p>Sin billeteras registradas.</p>
                            <button className="db-btn-ghost" onClick={() => onNavigate('billeteras')}>Crear billetera</button>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* ── Actividad reciente ── */}
                  <div className="db-panel d2" style={{ gridColumn: 'span 1' }}>
                    <div className="db-panel-head">
                      <span className="db-panel-title">Actividad reciente</span>
                      <span className="db-panel-badge">Últimas 5</span>
                    </div>
                    <div className="db-panel-body">
                      {transaccionesQuery.isLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                            <LoadingSpinner />
                          </div>
                      ) : transacciones.length ? (
                          <>
                            <div className="db-tx-head">
                              <span>Tipo / Fecha</span><span>Monto</span><span>Estado</span>
                            </div>
                            {transacciones.map((tx) => {
                              const estado = String(tx.estado || tx.status || '').toLowerCase();
                              const estadoClass =
                                  estado.includes('complet') || estado.includes('exitosa') ? 'estado-completada' :
                                      estado.includes('pend') ? 'estado-pendiente' :
                                          estado.includes('fall') || estado.includes('error') ? 'estado-fallida' :
                                              'estado-default';
                              const monto = Number(tx.monto || tx.valor || tx.amount || 0);
                              return (
                                  <div key={tx.id} className="db-tx-row">
                                    <div className="db-tx-tipo">
                                      {tx.tipo || tx.type || 'Transacción'}
                                      <span className="db-tx-fecha">
                                {tx.fecha ? tx.fecha.replace('T', ' ').slice(0, 16) : '—'}
                              </span>
                                    </div>
                                    <span className="db-tx-monto">$ {moneyFormatter.format(monto)}</span>
                                    <span className={`db-tx-estado ${estadoClass}`}>{tx.estado || tx.status || '—'}</span>
                                  </div>
                              );
                            })}
                          </>
                      ) : (
                          <div className="db-empty">
                            <p>Sin movimientos recientes.</p>
                            <button className="db-btn-ghost" onClick={() => onNavigate('transacciones')}>Nueva transacción</button>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* ── Sidebar ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Nivel */}
                    <div className="d3">
                      <NivelBadge nivel={nivelActual} puntos={puntosActuales} />
                      <button
                          className="db-btn-ghost"
                          style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}
                          onClick={() => onNavigate('recompensas')}
                      >
                        Ver recompensas →
                      </button>
                    </div>

                    {/* Perfil */}
                    <div className="db-panel d4" style={{ flex: 1 }}>
                      <div className="db-panel-head">
                        <span className="db-panel-title">Perfil de cuenta</span>
                        <span className="db-panel-badge">Activo</span>
                      </div>
                      <div className="db-panel-body">
                        {usuario ? (
                            <div className="db-perfil-grid">
                              <div className="db-field">
                                <span className="db-field-label">Nombre</span>
                                <span className="db-field-value">{usuario.nombre}</span>
                              </div>
                              <div className="db-field">
                                <span className="db-field-label">Nivel</span>
                                <span className="db-field-value" style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700 }}>
                            {nivelActual.toUpperCase()}
                          </span>
                              </div>
                              <div className="db-field" style={{ gridColumn: '1 / -1' }}>
                                <span className="db-field-label">Email</span>
                                <span className="db-field-value" style={{ fontSize: '0.75rem' }}>{usuario.email || '—'}</span>
                              </div>
                              <div className="db-field">
                                <span className="db-field-label">Teléfono</span>
                                <span className="db-field-value">{usuario.telefono || '—'}</span>
                              </div>
                              <div className="db-field">
                                <span className="db-field-label">Registro</span>
                                <span className="db-field-value" style={{ fontSize: '0.72rem' }}>
                            {usuario.fechaRegistro ? dateFormatter.format(new Date(usuario.fechaRegistro)) : '—'}
                          </span>
                              </div>
                            </div>
                        ) : (
                            <div className="db-empty">
                              <p>No hay datos de perfil disponibles.</p>
                            </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
            )}

          </div>
        </div>
      </>
  );
}