import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Billeteras from './pages/Billeteras';
import Transacciones from './pages/Transacciones';
import Analitica from './pages/Analitica';
import Recompensas from './pages/Recompensas';
import Notificaciones from './pages/Notificaciones';
import OperacionesProgramadas from './pages/OperacionesProgramadas';
import Usuarios from './pages/Usuarios';
import { useAuth } from './auth/AuthContext';

const VIEW_TITLES = {
  dashboard: 'Dashboard',
  billeteras: 'Billeteras',
  transacciones: 'Transacciones',
  analitica: 'Analítica',
  recompensas: 'Recompensas',
  usuarios: 'Usuarios',
  notificaciones: 'Notificaciones',
  programadas: 'Operaciones Programadas',
};

export default function App() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeUserId = user?.id || 1;

  const sharedProps = { userId: activeUserId, onNavigate: setActiveView };

  function renderView() {
    switch (activeView) {
      case 'billeteras':   return <Billeteras {...sharedProps} />;
      case 'transacciones':return <Transacciones {...sharedProps} />;
      case 'analitica':    return <Analitica {...sharedProps} />;
      case 'recompensas':  return <Recompensas {...sharedProps} />;
      case 'usuarios':     return <Usuarios {...sharedProps} />;
      case 'notificaciones': return <Notificaciones {...sharedProps} />;
      case 'programadas':  return <OperacionesProgramadas {...sharedProps} />;
      case 'dashboard': default: return <Dashboard {...sharedProps} />;
    }
  }

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        html, body, #root {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background: #0a0a0f;
          color: #f0f0f5;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Fondo atmosférico global ── */
        .app-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 70% 50% at 5% 0%,  rgba(99,88,255,0.13) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 95% 100%, rgba(34,211,165,0.09) 0%, transparent 55%),
            #0a0a0f;
        }

        .app-grid-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 90% 80% at 50% 0%, black 10%, transparent 100%);
        }

        /* ── Shell ── */
        .app-shell {
          position: relative;
          z-index: 1;
          display: flex;
          min-height: 100vh;
        }

        /* ── Main ── */
        .app-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .app-inner {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 1.75rem 1.5rem 4rem;
        }

        @media (min-width: 1024px) {
          .app-inner { padding: 2rem 2.5rem 4rem; }
        }

        /* ── Header ── */
        .app-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
          animation: headerIn 0.4s ease both;
        }

        @keyframes headerIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (min-width: 1024px) {
          .app-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
          }
        }

        .app-header-left {}

        .app-header-eyebrow {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.3);
          font-weight: 500;
          margin-bottom: 0.35rem;
        }

        .app-header-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2rem, 4vw, 2.75rem);
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.05;
          margin: 0 0 0.4rem;
        }

        .app-header-sub {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.35);
          font-weight: 300;
        }

        /* ── User card ── */
        .app-user-card {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          backdrop-filter: blur(12px);
          transition: transform 0.15s, box-shadow 0.15s;
          flex-shrink: 0;
          min-width: 180px;
        }

        .app-user-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }

        .app-user-label {
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.28);
        }

        .app-user-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .app-user-logout {
          background: none;
          border: none;
          padding: 0;
          margin-top: 0.25rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          color: #a89eff;
          cursor: pointer;
          text-align: left;
          transition: color 0.2s;
          width: fit-content;
        }

        .app-user-logout:hover { color: #22d3a5; }

        /* ── Separador decorativo bajo header ── */
        .app-header-line {
          height: 1px;
          background: linear-gradient(90deg, rgba(99,88,255,0.4), rgba(34,211,165,0.3), transparent);
          margin-bottom: 1.75rem;
          border: none;
        }

        /* ── View transition ── */
        .app-view {
          animation: viewIn 0.3s ease both;
        }

        @keyframes viewIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

        {/* Fondos globales */}
        <div className="app-bg" />
        <div className="app-grid-bg" />

        <div className="app-shell">
          <Sidebar
              activeView={activeView}
              onNavigate={setActiveView}
              collapsed={sidebarCollapsed}
              setCollapsed={setSidebarCollapsed}
          />

          <main className="app-main">
            <div className="app-inner">

              {/* Header */}
              <header className="app-header">
                <div className="app-header-left">
                  <p className="app-header-eyebrow">Plataforma ZiplocSAS</p>
                  <h1 className="app-header-title">{VIEW_TITLES[activeView] || 'Dashboard'}</h1>
                  <p className="app-header-sub">{user?.nombre || user?.email || 'Usuario autenticado'}</p>
                </div>

                <div className="app-user-card">
                  <span className="app-user-label">Usuario activo</span>
                  <strong className="app-user-name">{user?.nombre || user?.email || 'Usuario'}</strong>
                  <button type="button" onClick={() => logout('logout')} className="app-user-logout">
                    Cerrar sesión →
                  </button>
                </div>
              </header>

              {/* Línea decorativa */}
              <hr className="app-header-line" />

              {/* Vista activa */}
              <div className="app-view" key={activeView}>
                {renderView()}
              </div>

            </div>
          </main>
        </div>
      </>
  );
}
