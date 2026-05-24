export default function NavBar({ activeView, onNavigate }) {
  const items = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'billeteras', label: 'Billeteras' },
    { key: 'transacciones', label: 'Transacciones' },
    { key: 'analitica', label: 'Analitica' },
    { key: 'recompensas', label: 'Recompensas' },
  ];

  return (
    <nav className="sidebar">
      <div>
        <div className="brandMark">ZiplocSAS Wallet</div>
        <p className="sidebarCopy">
          Control operativo de billeteras, transacciones y fidelización.
        </p>
      </div>
      <div className="navStack" role="tablist" aria-label="Navegación principal">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={activeView === item.key ? 'navItem active' : 'navItem'}
            onClick={() => onNavigate(item.key)}
            aria-pressed={activeView === item.key}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="sidebarFooter">
        <span className="sidebarLabel">Usuario activo</span>
        <strong>ID fijo en sesión</strong>
      </div>
    </nav>
  );
}
