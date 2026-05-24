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
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : '0.75rem',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '0.75rem' : '0.7rem 1rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: isActive ? 600 : 400,
              letterSpacing: '-0.01em',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
              background: isActive
                  ? 'linear-gradient(135deg, rgba(99,88,255,0.22) 0%, rgba(34,211,165,0.12) 100%)'
                  : 'transparent',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
              boxShadow: isActive ? 'inset 0 0 0 1px rgba(99,88,255,0.35)' : 'none',
              outline: 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            onClick={() => onNavigate(item.key)}
            aria-pressed={isActive}
        >
          {/* Punto activo */}
          {isActive && (
              <span style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                width: 3, height: '60%', borderRadius: '0 3px 3px 0',
                background: 'linear-gradient(180deg, #6358ff, #22d3a5)',
              }} />
          )}
          <Icon size={18} style={{ color: isActive ? '#a89eff' : 'inherit', flexShrink: 0 }} />
          {!collapsed && <span>{item.label}</span>}
        </button>
    );
  };

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
      `}</style>
        <aside style={{
          minHeight: '100vh',
          width: collapsed ? 72 : 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          background: 'rgba(10,10,15,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10,
        }}>

          {/* Glow decorativo superior */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 180,
            background: 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(99,88,255,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Header */}
          <div style={{
            padding: collapsed ? '1.5rem 0' : '1.5rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: '0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '0.5rem',
            position: 'relative',
          }}>
            {!collapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <img
                      src="https://images.genius.com/2ac9006741241a4565391f4b145cc4dd.1000x1000x1.jpg"
                      alt="ZiplocSAS"
                      style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'cover', boxShadow: '0 2px 10px rgba(99,88,255,0.35)' }}
                  />
                  <span style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: '#fff',
                    letterSpacing: '-0.03em',
                    whiteSpace: 'nowrap',
                  }}>ZiplocSAS</span>
                </div>
            )}
            {collapsed && (
                <img
                    src="https://images.genius.com/2ac9006741241a4565391f4b145cc4dd.1000x1000x1.jpg"
                    alt="ZiplocSAS"
                    style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'cover', boxShadow: '0 2px 10px rgba(99,88,255,0.35)', marginBottom: '0.25rem' }}
                />
            )}
            <button
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', padding: '0.25rem',
                  borderRadius: 6, transition: 'color 0.18s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#a89eff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Nav principal */}
          <div style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {!collapsed && (
                <span style={{
                  fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.2)', fontWeight: 600, padding: '0.4rem 0.5rem 0.2rem',
                }}>Principal</span>
            )}
            {coreItems.map(renderItem)}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0.5rem 1.25rem' }} />

          {/* Nav actividad */}
          <div style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {!collapsed && (
                <span style={{
                  fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.2)', fontWeight: 600, padding: '0.4rem 0.5rem 0.2rem',
                }}>Actividad</span>
            )}
            {activityItems.map(renderItem)}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 'auto',
            padding: collapsed ? '1.25rem 0' : '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: collapsed ? 'center' : 'flex-start',
            gap: '0.2rem',
          }}>
            {!collapsed && (
                <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.22)' }}>
              Sesión activa
            </span>
            )}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6358ff, #22d3a5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>ID</div>
          </div>
        </aside>
      </>
  );
}