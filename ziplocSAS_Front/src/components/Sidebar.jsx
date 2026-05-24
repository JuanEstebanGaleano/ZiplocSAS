import { LayoutDashboard, Wallet, ArrowRightLeft, LineChart, Gift, Bell, Clock, Users, Menu } from 'lucide-react';

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
        className={`w-full flex items-center gap-3 text-left py-3 px-5 text-sm font-medium transition-all duration-150 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2 focus-visible:ring-offset-fondo
          ${isActive 
            ? 'bg-[#F0EDE5] border-l-[3px] border-l-acento text-textoPrincipal' 
            : 'text-textoSecundario border-l-[3px] border-l-transparent hover:bg-superficie hover:rounded-md active:scale-98'}`}
        onClick={() => onNavigate(item.key)}
        aria-pressed={isActive}
      >
        <Icon size={20} className={isActive ? 'text-acento' : 'text-textoSecundario'} />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  return (
    <aside 
      className={`min-h-screen bg-superficie border-r border-borde py-7 flex flex-col gap-7 transition-all duration-200 ease-smooth ${collapsed ? 'w-[72px]' : 'w-[280px]'} shrink-0 overflow-hidden`}
    >
      <div className="px-5 flex items-center justify-between">
        {!collapsed && <span className="text-sm font-semibold tracking-widest uppercase text-textoSecundario truncate">ZiplocSAS Wallet</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className={`text-textoSecundario hover:text-acento transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-acento rounded-md ${collapsed ? 'mx-auto' : ''}`}
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="px-3 flex flex-col gap-2">{coreItems.map(renderItem)}</div>

      <div className="h-px bg-borde mx-5" />

      <div className="px-3 flex flex-col gap-2">{activityItems.map(renderItem)}</div>

      <div className={`mt-auto flex flex-col gap-2 ${collapsed ? 'items-center px-2' : 'px-5'}`}>
        {!collapsed && <span className="text-xs tracking-wider uppercase text-textoSecundario truncate">Usuario activo</span>}
        <strong className="text-sm font-semibold text-textoPrincipal truncate">{collapsed ? 'ID' : 'ID fijo en sesión'}</strong>
      </div>
    </aside>
  );
}