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

  const sharedProps = {
    userId: activeUserId,
    onNavigate: setActiveView,
  };

  function renderView() {
    switch (activeView) {
      case 'billeteras': return <Billeteras {...sharedProps} />;
      case 'transacciones': return <Transacciones {...sharedProps} />;
      case 'analitica': return <Analitica {...sharedProps} />;
      case 'recompensas': return <Recompensas {...sharedProps} />;
      case 'usuarios': return <Usuarios {...sharedProps} />;
      case 'notificaciones': return <Notificaciones {...sharedProps} />;
      case 'programadas': return <OperacionesProgramadas {...sharedProps} />;
      case 'dashboard': default: return <Dashboard {...sharedProps} />;
    }
  }

  return (
    <div className="min-h-screen bg-fondo text-textoPrincipal font-sans flex animate-pageEnter">
      <Sidebar activeView={activeView} onNavigate={setActiveView} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className="flex-1 min-w-0 bg-fondo">
        <div className="max-w-[1200px] mx-auto w-full px-5 py-6 lg:px-8">
          <header className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Plataforma ZiplocSAS</p>
              <h1 className="text-4xl font-bold leading-[1.2] mt-1">{VIEW_TITLES[activeView] || 'Dashboard'}</h1>
              <p className="text-sm text-textoSecundario mt-2">{user?.nombre || user?.email || 'Usuario autenticado'}</p>
            </div>
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-3 p-4 border border-borde bg-superficie rounded-md shadow-sutil transition-transform duration-150 hover:scale-[1.02]">
              <span className="text-xs uppercase tracking-wider text-textoSecundario">Usuario activo</span>
              <strong className="text-xl font-bold truncate max-w-[200px]">{user?.nombre || user?.email || 'Usuario'}</strong>
              <button type="button" onClick={() => logout('logout')} className="text-xs font-medium text-acento hover:text-acentoHover transition-colors">Cerrar sesión</button>
            </div>
          </header>
          <div className="animate-pageEnter" key={activeView}>{renderView()}</div>
        </div>
      </main>
    </div>
  );
}