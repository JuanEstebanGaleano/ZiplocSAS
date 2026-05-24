import NivelBadge from '../components/NivelBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import TransaccionItem from '../components/TransaccionItem';
import { useBilleteras } from '../hooks/useBilleteras';
import { useTransacciones } from '../hooks/useTransacciones';
import { usePuntosRecompensas, useNivelRecompensas } from '../hooks/useRecompensas';
import { useEffect, useState } from 'react';
import { obtenerUsuarioPorId } from '../services/api';

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

function sortByRecentDate(items) {
  return [...items].sort((left, right) => {
    const leftDate = left.fecha ? new Date(left.fecha).getTime() : 0;
    const rightDate = right.fecha ? new Date(right.fecha).getTime() : 0;
    return rightDate - leftDate;
  });
}

export default function Dashboard({ userId, onNavigate }) {
  const [usuario, setUsuario] = useState(null);
  const [usuarioError, setUsuarioError] = useState(null);

  const billeterasQuery = useBilleteras(userId);
  const puntosQuery = usePuntosRecompensas(userId);
  const nivelQuery = useNivelRecompensas(userId);

  useEffect(() => {
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
    return () => { active = false; };
  }, [userId]);

  const billeteras = billeterasQuery.data?.billeteras || billeterasQuery.data || [];
  const firstWalletId = billeteras.length > 0 ? billeteras[0].id : null;
  const transaccionesQuery = useTransacciones(firstWalletId);
  const transaccionesData = transaccionesQuery.data?.transacciones || transaccionesQuery.data || [];
  const transacciones = sortByRecentDate(transaccionesData).slice(0, 5);

  const puntosData = puntosQuery.data || {};
  const nivelData = nivelQuery.data || {};
  const puntosActuales = Number(nivelData.puntosActuales ?? puntosData.puntos ?? puntosData.puntosAcumulados ?? 0);
  const nivelActual = nivelData.nivel || puntosData.nivel || usuario?.nivel || 'Bronce';
  const umbralSiguiente = Number(nivelData.umbralSiguiente ?? 0);
  const progreso = umbralSiguiente > 0 ? Math.min(100, Math.round((puntosActuales / umbralSiguiente) * 100)) : 100;

  const isLoading = billeterasQuery.isLoading || puntosQuery.isLoading || nivelQuery.isLoading;
  const error = billeterasQuery.error || puntosQuery.error || nivelQuery.error || usuarioError;
  const totalSaldo = billeteras.reduce((sum, wallet) => sum + Number(wallet.saldo || 0), 0);

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        .db-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #0a0a0f;
          position: relative;
          padding: 2rem 1.5rem 4rem;
        }

        /* Fondo atmosférico */
        .db-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 70% 50% at 10% 0%, rgba(99,88,255,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 90% 100%, rgba(34,211,165,0.10) 0%, transparent 55%),
            #0a0a0f;
        }

        .db-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 20%, transparent 100%);
        }

        .db-content {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* ── Topbar ── */
        .db-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .db-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .db-logo {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          object-fit: cover;
          box-shadow: 0 2px 12px rgba(99,88,255,0.35);
        }

        .db-brand-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.15rem;
          color: #fff;
          letter-spacing: -0.03em;
        }

        .db-greeting {
          text-align: right;
        }

        .db-greeting-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .db-greeting-sub {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        /* ── Grid principal ── */
        .db-grid-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 1024px) {
          .db-grid-layout {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }

        .span-2 { grid-column: span 1; }
        .span-1 { grid-column: span 1; }
        .span-full { grid-column: span 1; }

        @media (min-width: 1024px) {
          .span-2 { grid-column: span 2; }
          .span-full { grid-column: span 3; }
        }

        /* ── Card base ── */
        .db-card {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.75rem;
          backdrop-filter: blur(12px);
          animation: cardIn 0.4s ease both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .db-card-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .db-card-label {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        .db-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        /* ── Stat cards hero ── */
        .db-stats-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }

        @media (min-width: 600px) {
          .db-stats-row { grid-template-columns: repeat(3, 1fr); }
        }

        .db-stat {
          border-radius: 12px;
          padding: 1.25rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          animation: cardIn 0.4s ease both;
        }

        .db-stat-hero {
          background: linear-gradient(135deg, rgba(99,88,255,0.25) 0%, rgba(34,211,165,0.15) 100%);
          border: 1px solid rgba(99,88,255,0.3);
          box-shadow: 0 4px 24px rgba(99,88,255,0.2);
        }

        .db-stat-plain {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
        }

        .db-stat-value-hero {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.9rem;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .db-stat-value {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .db-stat-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ── Tabla encabezados ── */
        .db-table-head {
          display: grid;
          padding-bottom: 0.75rem;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: rgba(255,255,255,0.3);
          font-weight: 600;
        }

        .db-table-head-billeteras {
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 1rem;
        }

        .db-table-head-tx {
          grid-template-columns: 1fr 1fr 1fr 1fr auto;
          gap: 1rem;
        }

        /* ── Fila billetera ── */
        .db-wallet-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 1rem;
          align-items: center;
          padding: 1rem 0.75rem;
          margin: 0 -0.75rem;
          border-radius: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.18s;
        }

        .db-wallet-row:last-child { border-bottom: none; }

        .db-wallet-row:hover {
          background: rgba(99,88,255,0.07);
        }

        .db-wallet-name {
          font-weight: 500;
          color: #fff;
          font-size: 0.9rem;
        }

        .db-wallet-tipo {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
        }

        .db-wallet-saldo {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: #fff;
          letter-spacing: -0.02em;
        }

        /* ── Botones ── */
        .btn-link {
          background: none;
          border: none;
          color: #a89eff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }

        .btn-link:hover { color: #fff; }

        .btn-outline {
          background: none;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.55);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.35rem 0.9rem;
          border-radius: 7px;
          cursor: pointer;
          transition: background 0.18s, color 0.18s, border-color 0.18s;
          white-space: nowrap;
        }

        .btn-outline:hover {
          background: rgba(99,88,255,0.15);
          border-color: rgba(99,88,255,0.4);
          color: #a89eff;
        }

        /* ── Nivel / progreso ── */
        .db-nivel-section { display: flex; flex-direction: column; gap: 1rem; }

        .db-progreso-text {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.35);
        }

        .db-progreso-bar-bg {
          width: 100%;
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          overflow: hidden;
        }

        .db-progreso-bar {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #6358ff, #22d3a5);
          transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
        }

        /* ── Perfil ── */
        .db-perfil-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 600px) {
          .db-perfil-grid { grid-template-columns: 1fr 1fr; }
        }

        .db-perfil-field { display: flex; flex-direction: column; gap: 0.25rem; }

        .db-perfil-field-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: rgba(255,255,255,0.3);
        }

        .db-perfil-field-value {
          font-size: 0.9rem;
          color: #fff;
          font-weight: 400;
        }

        .db-nivel-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          background: rgba(99,88,255,0.12);
          border: 1px solid rgba(99,88,255,0.25);
          color: #a89eff;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          margin-top: 0.2rem;
        }

        /* ── Estado vacío ── */
        .db-empty {
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 1.25rem;
          background: rgba(255,255,255,0.02);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .db-empty p {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.3);
        }

        /* ── Divider ── */
        .db-divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin: 1.25rem 0;
        }

        /* Delays escalonados para cards */
        .delay-1 { animation-delay: 0.05s; }
        .delay-2 { animation-delay: 0.10s; }
        .delay-3 { animation-delay: 0.15s; }
        .delay-4 { animation-delay: 0.20s; }
        .delay-5 { animation-delay: 0.25s; }
      `}</style>

        {/* Fondo */}
        <div className="db-bg" />
        <div className="db-grid" />

        <div className="db-root">
          <div className="db-content">

            {/* ── Topbar ── */}
            <div className="db-topbar">
              <div className="db-brand">
                <img
                    src="https://images.genius.com/2ac9006741241a4565391f4b145cc4dd.1000x1000x1.jpg"
                    alt="ZiplocSAS"
                    className="db-logo"
                />
                <span className="db-brand-name">ZiplocSAS</span>
              </div>
              <div className="db-greeting">
                <div className="db-greeting-name">{usuario?.nombre || 'Cargando...'}</div>
                <div className="db-greeting-sub">Resumen general</div>
              </div>
            </div>

            {/* ── Error global ── */}
            {error && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <AlertaPanel type="error" title="No se pudo cargar el panel" message={error?.message || String(error)} />
                </div>
            )}

            {/* ── Loading ── */}
            {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                  <LoadingSpinner />
                </div>
            )}

            {!isLoading && (
                <div className="db-grid-layout">

                  {/* ══ Columna principal (span 2) ══ */}
                  <div className="span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Card: Stats + Billeteras */}
                    <div className="db-card delay-1">
                      {/* Stats */}
                      <div className="db-stats-row">
                        <div className="db-stat db-stat-hero" style={{ animationDelay: '0.1s' }}>
                          <div className="db-stat-value-hero">$ {moneyFormatter.format(totalSaldo)}</div>
                          <div className="db-stat-label">Saldo total</div>
                        </div>
                        <div className="db-stat db-stat-plain" style={{ animationDelay: '0.15s' }}>
                          <div className="db-stat-value">{billeteras.length}</div>
                          <div className="db-stat-label">Billeteras activas</div>
                        </div>
                        <div className="db-stat db-stat-plain" style={{ animationDelay: '0.2s' }}>
                          <div className="db-stat-value">{puntosActuales}</div>
                          <div className="db-stat-label">Puntos acumulados</div>
                        </div>
                      </div>

                      <hr className="db-divider" />

                      {/* Billeteras */}
                      <div className="db-card-header">
                        <span className="db-card-title">Billeteras activas</span>
                        <button className="btn-link" onClick={() => onNavigate('billeteras')}>Ver todas →</button>
                      </div>

                      {billeteras.length ? (
                          <>
                            <div className="db-table-head db-table-head-billeteras">
                              <span>Nombre</span>
                              <span>Tipo</span>
                              <span>Saldo</span>
                              <span style={{ textAlign: 'right' }}>Acción</span>
                            </div>
                            {billeteras.map((wallet) => (
                                <div key={wallet.id} className="db-wallet-row">
                                  <span className="db-wallet-name">{wallet.nombre}</span>
                                  <span className="db-wallet-tipo">{wallet.tipo}</span>
                                  <span className="db-wallet-saldo">$ {moneyFormatter.format(Number(wallet.saldo || 0))}</span>
                                  <div style={{ textAlign: 'right' }}>
                                    <button className="btn-outline" onClick={() => onNavigate('billeteras')}>Ver</button>
                                  </div>
                                </div>
                            ))}
                          </>
                      ) : (
                          <div className="db-empty">
                            <p>Aún no hay billeteras registradas para este usuario.</p>
                            <button className="btn-link" onClick={() => onNavigate('billeteras')}>Crear la primera billetera</button>
                          </div>
                      )}
                    </div>

                    {/* Card: Actividad reciente */}
                    <div className="db-card delay-2">
                      <div className="db-card-header">
                        <span className="db-card-title">Actividad reciente</span>
                        <span className="db-card-label">Últimas 5</span>
                      </div>

                      {transaccionesQuery.isLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                            <LoadingSpinner />
                          </div>
                      ) : transacciones.length ? (
                          <>
                            <div className="db-table-head db-table-head-tx">
                              <span>Tipo</span>
                              <span>Monto</span>
                              <span>Estado</span>
                              <span>Fecha</span>
                              <span style={{ textAlign: 'right' }}>Acción</span>
                            </div>
                            {transacciones.map((transaccion) => (
                                <TransaccionItem key={transaccion.id} transaccion={transaccion} />
                            ))}
                          </>
                      ) : (
                          <div className="db-empty">
                            <p>Sin movimientos recientes. Registra una operación para ver actividad aquí.</p>
                            <button className="btn-link" onClick={() => onNavigate('transacciones')}>Crear una transacción</button>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* ══ Sidebar (span 1) ══ */}
                  <div className="span-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Card: Nivel */}
                    <div className="db-card delay-3">
                      <div className="db-card-header">
                        <span className="db-card-title">Nivel del usuario</span>
                        <span className="db-card-label">Fidelización</span>
                      </div>
                      <div className="db-nivel-section">
                        <NivelBadge nivel={nivelActual} puntos={puntosActuales} />
                        <div className="db-progreso-text">
                          {umbralSiguiente > 0
                              ? `${puntosActuales} de ${umbralSiguiente} pts hacia el siguiente nivel`
                              : 'Nivel máximo alcanzado'}
                        </div>
                        <div className="db-progreso-bar-bg">
                          <div className="db-progreso-bar" style={{ width: `${progreso}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Card: Perfil */}
                    <div className="db-card delay-4">
                      <div className="db-card-header">
                        <span className="db-card-title">Perfil</span>
                        <span className="db-card-label">Detalle de cuenta</span>
                      </div>

                      {usuario ? (
                          <div className="db-perfil-grid">
                            <div className="db-perfil-field">
                              <span className="db-perfil-field-label">Nombre</span>
                              <span className="db-perfil-field-value">{usuario.nombre}</span>
                            </div>
                            <div className="db-perfil-field">
                              <span className="db-perfil-field-label">Nivel</span>
                              <span className="db-nivel-pill">{nivelActual}</span>
                            </div>
                            <div className="db-perfil-field">
                              <span className="db-perfil-field-label">Email</span>
                              <span className="db-perfil-field-value" style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>
                          {usuario.email || 'Sin email registrado'}
                        </span>
                            </div>
                            <div className="db-perfil-field">
                              <span className="db-perfil-field-label">Puntos acumulados</span>
                              <span className="db-perfil-field-value" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem' }}>
                          {puntosActuales}
                        </span>
                            </div>
                            <div className="db-perfil-field">
                              <span className="db-perfil-field-label">Teléfono</span>
                              <span className="db-perfil-field-value">{usuario.telefono || 'Sin teléfono'}</span>
                            </div>
                            <div className="db-perfil-field">
                              <span className="db-perfil-field-label">Registro</span>
                              <span className="db-perfil-field-value" style={{ fontSize: '0.78rem' }}>
                          {usuario.fechaRegistro ? dateFormatter.format(new Date(usuario.fechaRegistro)) : 'Sin fecha'}
                        </span>
                            </div>
                          </div>
                      ) : (
                          <div className="db-empty">
                            <p>No hay información del usuario disponible.</p>
                          </div>
                      )}
                    </div>

                  </div>
                  {/* fin sidebar */}

                </div>
            )}

          </div>
        </div>
      </>
  );
}
