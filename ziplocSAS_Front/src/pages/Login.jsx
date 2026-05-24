import { useState } from 'react';
import { LoaderCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import AlertaPanel from '../components/AlertaPanel';
import { useAuth } from '../auth/AuthContext';

export default function Login({ sessionExpired = false, initialError = '' }) {
  const { login, register, isLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError || '');
  const [focusedField, setFocusedField] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('Completa email y contraseña para continuar.');
      return;
    }

    if (isRegistering && !nombre.trim()) {
      setError('El nombre es obligatorio para crear una cuenta.');
      return;
    }

    try {
      if (isRegistering) {
        await register({ nombre: nombre.trim(), email: identifier.trim(), password });
      } else {
        await login({ email: identifier.trim(), password });
      }
    } catch (requestError) {
      setError(requestError?.message || (isRegistering ? 'No fue posible crear la cuenta.' : 'No fue posible iniciar sesión.'));
    }
  }

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        .login-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          background: var(--fondo, #0a0a0f);
          position: relative;
          overflow: hidden;
        }

        /* Fondo con malla de gradiente */
        .login-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99, 88, 255, 0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 90%, rgba(34, 211, 165, 0.12) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 60% 40%, rgba(255, 88, 120, 0.07) 0%, transparent 50%),
            #0a0a0f;
        }

        /* Grid sutil */
        .login-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%);
        }

        /* Panel lateral izquierdo decorativo */
        .login-left {
          display: none;
          flex: 1;
          position: relative;
          z-index: 1;
          padding: 3rem;
          flex-direction: column;
          justify-content: space-between;
        }

        @media (min-width: 900px) {
          .login-left { display: flex; }
        }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(99,88,255,0.3);
        }

        .brand-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .brand-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.25rem;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .left-headline {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2.4rem, 4vw, 3.6rem);
          line-height: 1.05;
          color: #fff;
          letter-spacing: -0.04em;
        }

        .left-headline span {
          background: linear-gradient(90deg, #6358ff, #22d3a5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .left-stats {
          display: flex;
          gap: 2rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .stat-number {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.6rem;
          color: #fff;
          letter-spacing: -0.03em;
        }

        .stat-label {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* Panel derecho — formulario */
        .login-right {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          width: 100%;
          padding: 1.5rem;
          position: relative;
          z-index: 1;
        }

        @media (min-width: 900px) {
          .login-right {
            width: 480px;
            border-left: 1px solid rgba(255,255,255,0.06);
            background: rgba(10,10,15,0.7);
            backdrop-filter: blur(20px);
          }
        }

        .login-card {
          width: 100%;
          max-width: 400px;
        }

        /* Encabezado del formulario */
        .card-header {
          margin-bottom: 2.5rem;
        }

        .card-header-top {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
        }

        .shield-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          background: rgba(99,88,255,0.12);
          border: 1px solid rgba(99,88,255,0.25);
          color: #a89eff;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 2rem;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-bottom: 0.5rem;
        }

        .card-subtitle {
          font-size: 0.88rem;
          color: rgba(255,255,255,0.4);
          font-weight: 300;
        }

        /* Inputs */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1rem;
          animation: fadeUp 0.3s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .field-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .field-wrapper {
          position: relative;
        }

        .field-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.875rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          font-weight: 300;
        }

        .field-input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        .field-input:focus {
          border-color: rgba(99,88,255,0.6);
          background: rgba(99,88,255,0.06);
          box-shadow: 0 0 0 3px rgba(99,88,255,0.12);
        }

        /* Línea decorativa bajo input enfocado */
        .field-bar {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, #6358ff, #22d3a5);
          transition: width 0.3s ease;
        }

        .field-input:focus + .field-bar {
          width: calc(100% - 24px);
        }

        /* Botón principal */
        .btn-submit {
          width: 100%;
          margin-top: 1.5rem;
          padding: 0.95rem 1.5rem;
          background: linear-gradient(135deg, #6358ff 0%, #22d3a5 100%);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.01em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(99,88,255,0.3);
        }

        .btn-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(99,88,255,0.4);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Toggle registro/login */
        .toggle-section {
          margin-top: 1.75rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          text-align: center;
        }

        .toggle-text {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.35);
        }

        .toggle-btn {
          background: none;
          border: none;
          color: #a89eff;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 0.85rem;
          cursor: pointer;
          margin-left: 0.4rem;
          padding: 0;
          transition: color 0.2s;
        }

        .toggle-btn:hover {
          color: #fff;
        }

        /* Decorador de seguridad */
        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          margin-top: 1.5rem;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.03em;
        }

        .security-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #22d3a5;
          opacity: 0.6;
        }

        /* Orbe decorativo */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 {
          width: 400px; height: 400px;
          top: -100px; left: -100px;
          background: rgba(99,88,255,0.15);
        }
        .orb-2 {
          width: 300px; height: 300px;
          bottom: -80px; right: -60px;
          background: rgba(34,211,165,0.1);
        }
      `}</style>

        <div className="login-root">
          <div className="login-bg" />
          <div className="login-grid" />
          <div className="orb orb-1" />
          <div className="orb orb-2" />

          {/* Panel izquierdo — solo desktop */}
          <div className="login-left">
            <div className="brand-mark">
              <div className="brand-icon">
                <img src="https://images.genius.com/2ac9006741241a4565391f4b145cc4dd.1000x1000x1.jpg" alt="ZiplocSAS logo" />
              </div>
              <span className="brand-name">ZiplocSAS</span>
            </div>

            <div>
              <div className="left-headline">
                Tu dinero,<br />
                bajo <span>control total.</span>
              </div>
            </div>

            <div className="left-stats">
              <div className="stat-item">
                <span className="stat-number">256-bit</span>
                <span className="stat-label">Cifrado AES</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Disponibilidad</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0 fees</span>
                <span className="stat-label">Transferencias</span>
              </div>
            </div>
          </div>

          {/* Panel derecho — formulario */}
          <div className="login-right">
            <div className="login-card">

              {/* Encabezado */}
              <div className="card-header">
                <div className="card-header-top">
                  <img
                      src="https://images.genius.com/2ac9006741241a4565391f4b145cc4dd.1000x1000x1.jpg"
                      alt="ZiplocSAS"
                      style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', boxShadow: '0 2px 12px rgba(99,88,255,0.3)', display: 'block' }}
                  />
                  <div className="shield-pill">
                    <ShieldCheck size={11} />
                    Conexión segura
                  </div>
                </div>
                <h1 className="card-title">
                  {isRegistering ? 'Crear cuenta' : 'Bienvenido\nde vuelta'}
                </h1>
                <p className="card-subtitle">
                  {isRegistering
                      ? 'Completa los datos para empezar'
                      : 'Ingresa tus credenciales para continuar'}
                </p>
              </div>

              {/* Alertas */}
              {sessionExpired && (
                  <AlertaPanel type="error" title="Sesión expirada" message="Tu sesión caducó. Vuelve a iniciar sesión." />
              )}
              {error && (
                  <div style={{ marginBottom: '1rem' }}>
                    <AlertaPanel
                        type="error"
                        title={isRegistering ? 'Error de registro' : 'Error de autenticación'}
                        message={error}
                    />
                  </div>
              )}

              {/* Formulario — sin <form> para evitar submit nativo en algunos entornos */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>

                {isRegistering && (
                    <div className="field-group" style={{ animationDelay: '0ms' }}>
                      <label className="field-label">Nombre completo</label>
                      <div className="field-wrapper">
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej. Juan Pérez"
                            className="field-input"
                            autoComplete="name"
                        />
                        <div className="field-bar" />
                      </div>
                    </div>
                )}

                <div className="field-group" style={{ animationDelay: '60ms' }}>
                  <label className="field-label">Email</label>
                  <div className="field-wrapper">
                    <input
                        type="email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="correo@dominio.com"
                        className="field-input"
                        autoComplete="email"
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                    />
                    <div className="field-bar" />
                  </div>
                </div>

                <div className="field-group" style={{ animationDelay: '120ms' }}>
                  <label className="field-label">Contraseña</label>
                  <div className="field-wrapper">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="field-input"
                        autoComplete={isRegistering ? 'new-password' : 'current-password'}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                    />
                    <div className="field-bar" />
                  </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="btn-submit"
                >
                  {isLoading
                      ? <><LoaderCircle className="animate-spin" size={17} /> Procesando...</>
                      : <>{isRegistering ? 'Crear cuenta' : 'Iniciar sesión'} <ArrowRight size={16} /></>
                  }
                </button>
              </div>

              {/* Toggle registro / login */}
              <div className="toggle-section">
              <span className="toggle-text">
                {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                <button
                    type="button"
                    onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                    className="toggle-btn"
                >
                  {isRegistering ? 'Iniciar sesión' : 'Regístrate aquí'}
                </button>
              </span>
              </div>

              {/* Nota de seguridad */}
              <div className="security-note">
                <div className="security-dot" />
                Cifrado de extremo a extremo · ZiplocSAS Wallet
              </div>

            </div>
          </div>
        </div>
      </>
  );
}
