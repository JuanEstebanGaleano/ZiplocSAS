import { LayoutDashboard, Wallet, ArrowRightLeft, LineChart, Gift, Bell, Clock, Users, Menu, ChevronRight } from 'lucide-react';

export default function Sidebar({ activeView, onNavigate, collapsed, setCollapsed }) {
  const coreItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'usuarios', label: 'Usuarios', icon: Users },
    { key: 'billeteras', label: 'Billeteras', icon: Wallet },
  ];

  const activityItems = [
    { key: 'transacciones', label: 'Transacciones', icon: ArrowRightLeft },
    { key: 'analitica', label: 'Analítica', icon: LineChart },
    { key: 'recompensas', label: 'Recompensas', icon: Gift },
    { key: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { key: 'programadas', label: 'Programadas', icon: Clock },
  ];

  const renderItem = (item) => {
    const isActive = activeView === item.key;
    const Icon = item.icon;
    return (
        <button
            key={item.key}
            type="button"
            className={`group w-full flex items-center gap-3 text-left py-2.5 px-3 text-sm font-medium transition-all duration-150 rounded-lg outline-none
          focus-visible:ring-2 focus-visible:ring-[#D38343]/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#141414]
          ${isActive
                ? 'bg-[#D38343]/12 text-[#E8C99A] border border-[#D38343]/25'
                : 'text-[#8A8A8A] border border-transparent hover:bg-[#1E1E1E] hover:text-[#C8C8C8]'
            }`}
            onClick={() => onNavigate(item.key)}
            aria-pressed={isActive}
            title={collapsed ? item.label : undefined}
        >
          <Icon
              size={17}
              className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-[#D38343]' : 'text-[#5A5A5A] group-hover:text-[#9A9A9A]'}`}
          />
          {!collapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && <ChevronRight size={13} className="text-[#D38343]/60 shrink-0" />}
              </>
          )}
        </button>
    );
  };

  return (
      <aside
          className={`
        relative min-h-screen flex flex-col
        bg-[#111111] border-r border-[#222222]
        transition-all duration-200 ease-in-out shrink-0 overflow-hidden
        ${collapsed ? 'w-[60px]' : 'w-[240px]'}
      `}
      >
        {/* Header */}
        <div className={`flex items-center h-16 border-b border-[#1E1E1E] ${collapsed ? 'justify-center px-3' : 'px-4 gap-3'}`}>
          {/* Logo mark */}
          <div className="w-7 h-7 rounded-md bg-[#D38343]/15 border border-[#D38343]/30 flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#D38343]" />
          </div>
          {!collapsed && (
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#5A5A5A] flex-1 truncate">
            ZiplocSAS
          </span>
          )}
          <button
              onClick={() => setCollapsed(!collapsed)}
              className={`
            text-[#3A3A3A] hover:text-[#D38343] transition-colors duration-150
            outline-none focus-visible:ring-1 focus-visible:ring-[#D38343]/60 rounded-md p-1
            ${collapsed ? 'hidden' : ''}
          `}
              aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Collapsed toggle */}
        {collapsed && (
            <button
                onClick={() => setCollapsed(false)}
                className="absolute top-4 right-0 translate-x-1/2 w-5 h-5 rounded-full bg-[#1E1E1E] border border-[#2E2E2E] flex items-center justify-center text-[#5A5A5A] hover:text-[#D38343] transition-colors z-10"
                aria-label="Expandir menú"
            >
              <ChevronRight size={11} />
            </button>
        )}

        {/* Nav sections */}
        <nav className="flex-1 flex flex-col gap-6 py-5 px-2 overflow-y-auto overflow-x-hidden">
          {/* Section label */}
          {!collapsed && (
              <span className="px-3 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#363636]">
            Principal
          </span>
          )}
          <div className="flex flex-col gap-0.5 -mt-4">
            {coreItems.map(renderItem)}
          </div>

          <div className="h-px bg-[#1C1C1C] mx-1" />

          {!collapsed && (
              <span className="px-3 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#363636] -mb-4">
            Actividad
          </span>
          )}
          <div className="flex flex-col gap-0.5">
            {activityItems.map(renderItem)}
          </div>
        </nav>

        {/* Footer */}
        <div className={`border-t border-[#1C1C1C] p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? '' : 'px-1'}`}>
            <div className="w-7 h-7 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#D38343]">U</span>
            </div>
            {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[#9A9A9A] truncate">Usuario activo</span>
                  <span className="text-[10px] text-[#4A4A4A] truncate">Sesión actual</span>
                </div>
            )}
          </div>
        </div>
      </aside>
  );
}
