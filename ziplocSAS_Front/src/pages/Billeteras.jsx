import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import { useBilleteras, useCrearBilletera, useActualizarBilletera } from '../hooks/useBilleteras';
import { useTransacciones } from '../hooks/useTransacciones';

const TIPOS = [
  { label: 'Ahorro', value: 'AHORRO' }, { label: 'Ahorros', value: 'AHORROS' },
  { label: 'Gastos diarios', value: 'GASTOS_DIARIOS' }, { label: 'Compras', value: 'COMPRAS' },
  { label: 'Transporte', value: 'TRANSPORTE' }, { label: 'Corriente', value: 'CORRIENTE' },
  { label: 'Inversión', value: 'INVERSION' }, { label: 'Crédito', value: 'CREDITO' },
];

const ESTADOS = [
  { label: 'Activa', value: 'ACTIVA' }, { label: 'Suspendida', value: 'SUSPENDIDA' },
  { label: 'Congelada', value: 'CONGELADA' }, { label: 'Cerrada', value: 'CERRADA' },
];

const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function estadoStyle(estado) {
  const v = String(estado || '').toUpperCase();
  if (v === 'ACTIVA') return { color: '#00ff88', border: 'rgba(0,255,136,0.25)', bg: 'rgba(0,255,136,0.08)' };
  if (v === 'SUSPENDIDA') return { color: '#ffb020', border: 'rgba(255,176,32,0.25)', bg: 'rgba(255,176,32,0.08)' };
  if (v === 'CONGELADA') return { color: '#00cfff', border: 'rgba(0,207,255,0.25)', bg: 'rgba(0,207,255,0.08)' };
  return { color: '#666', border: 'rgba(255,255,255,0.1)', bg: 'rgba(255,255,255,0.04)' };
}

function validateCreate(f) {
  const e = {};
  if (!f.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
  if (!f.tipo) e.tipo = 'Selecciona un tipo.';
  return e;
}

function validateEdit(f) {
  const e = {};
  if (!f.nombre.trim()) e.nombre = 'El nombre no puede estar vacío.';
  if (!f.estado) e.estado = 'Selecciona un estado.';
  return e;
}

export default function Billeteras({ userId }) {
  const billeterasQuery = useBilleteras(userId);
  const createMut = useCrearBilletera();
  const updateMut = useActualizarBilletera();

  const [selectedWallet, setSelectedWallet] = useState(null);
  const [editId, setEditId] = useState(null);
  const [createForm, setCreateForm] = useState({ nombre: '', tipo: TIPOS[0].value });
  const [createErrors, setCreateErrors] = useState({});
  const [editForm, setEditForm] = useState({ nombre: '', estado: ESTADOS[0].value });
  const [editErrors, setEditErrors] = useState({});

  const billeteras = billeterasQuery.data?.billeteras || billeterasQuery.data || [];
  const transQuery = useTransacciones(selectedWallet?.id);
  const history = transQuery.data?.transacciones || transQuery.data || [];

  useEffect(() => {
    if (billeteras.length && !selectedWallet) setSelectedWallet(billeteras[0]);
  }, [billeteras]);

  async function handleCreate(e) {
    e.preventDefault();
    const errs = validateCreate(createForm);
    setCreateErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await createMut.mutateAsync({ usuarioId: userId, nombre: createForm.nombre.trim(), tipo: createForm.tipo });
      setCreateForm({ nombre: '', tipo: TIPOS[0].value });
    } catch {}
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editId) return;
    const errs = validateEdit(editForm);
    setEditErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await updateMut.mutateAsync({ id: editId, data: { nombre: editForm.nombre.trim(), estado: editForm.estado } });
      setEditId(null);
      setEditForm({ nombre: '', estado: ESTADOS[0].value });
    } catch {}
  }

  function startEdit(w) {
    setEditId(w.id);
    setEditForm({ nombre: w.nombre || '', estado: w.estado || 'ACTIVA' });
    setEditErrors({});
  }

  const globalError = billeterasQuery.error || createMut.error || updateMut.error;
  const globalSuccess = createMut.isSuccess ? 'Billetera creada.' : updateMut.isSuccess ? 'Billetera actualizada.' : '';

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@600;700&family=Inter:wght@300;400;500&display=swap');

        :root {
          --fm: 'Space Mono', monospace;
          --fd: 'Orbitron', sans-serif;
          --fb: 'Inter', sans-serif;
          --g: #00ff88; --gd: rgba(0,255,136,0.55); --gm: rgba(0,255,136,0.09); --gb: rgba(0,255,136,0.2);
          --c: #00cfff; --r: #ff3355; --a: #ffb020;
          --bg: #060609; --sf: rgba(255,255,255,0.026); --sfh: rgba(0,255,136,0.03);
          --bd: rgba(255,255,255,0.055); --bda: rgba(0,255,136,0.2);
          --t: rgba(255,255,255,0.88); --td: rgba(255,255,255,0.38); --tf: rgba(255,255,255,0.14);
        }

        .bl-root { font-family: var(--fb); background: var(--bg); min-height: 100vh; position: relative; }

        .bl-atmo {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 50% 40% at 5% 5%, rgba(0,207,255,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 40% 35% at 95% 90%, rgba(0,255,136,0.05) 0%, transparent 55%);
        }

        .bl-scan {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.14) 2px, rgba(0,0,0,0.14) 4px);
          opacity: 0.28;
        }

        .bl-layout { position: relative; z-index: 1; display: flex; gap: 1.25rem; align-items: flex-start; }
        @media (max-width: 1024px) { .bl-layout { flex-direction: column; } }

        /* ── Shared panel ── */
        .bl-panel {
          background: var(--sf); border: 1px solid var(--bd);
          border-radius: 12px; overflow: hidden;
          display: flex; flex-direction: column;
        }

        .bl-panel.accent { border-color: var(--bda); }

        .bl-head {
          padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--bd);
          display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
        }

        .bl-title {
          font-family: var(--fm); font-size: 0.62rem; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--gd);
          display: flex; align-items: center; gap: 0.4rem;
        }

        .bl-title::before { content: '//'; color: var(--tf); }

        .bl-badge {
          font-family: var(--fm); font-size: 0.55rem; color: var(--tf);
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 0.18rem 0.55rem; border: 1px solid var(--bd); border-radius: 4px;
        }

        .bl-body { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; gap: 0.9rem; }

        /* ── Fields ── */
        .bl-field { display: flex; flex-direction: column; gap: 0.35rem; }

        .bl-label {
          font-family: var(--fm); font-size: 0.58rem; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--tf);
        }

        .bl-input {
          width: 100%; padding: 0.6rem 0.8rem;
          background: rgba(0,0,0,0.35); border: 1px solid var(--bd);
          border-radius: 6px; color: var(--t); font-family: var(--fm); font-size: 0.76rem;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s; appearance: none;
        }

        .bl-input:focus { border-color: var(--gb); box-shadow: 0 0 0 3px rgba(0,255,136,0.07); }
        .bl-input.err { border-color: var(--r); }
        .bl-input:disabled { opacity: 0.35; cursor: not-allowed; }

        .bl-error { font-family: var(--fm); font-size: 0.57rem; color: var(--r); }

        .bl-btn {
          width: 100%; padding: 0.75rem;
          background: transparent; border: 1px solid var(--gb);
          color: var(--g); font-family: var(--fm); font-size: 0.65rem;
          font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          border-radius: 6px; cursor: pointer; overflow: hidden; position: relative;
          transition: background 0.15s;
        }

        .bl-btn:hover { background: var(--gm); }
        .bl-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .bl-btn.secondary { border-color: var(--bda); color: var(--c); }
        .bl-btn.secondary:hover { background: rgba(0,207,255,0.07); }

        /* ── Wallet cards ── */
        .bl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.85rem; }

        .bl-wcard {
          background: rgba(0,0,0,0.2); border: 1px solid var(--bd);
          border-radius: 10px; padding: 1.1rem 1.25rem;
          cursor: pointer; position: relative; overflow: hidden;
          transition: border-color 0.15s, background 0.15s;
          display: flex; flex-direction: column; gap: 0.75rem;
        }

        .bl-wcard::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--g), transparent);
          opacity: 0; transition: opacity 0.3s;
        }

        .bl-wcard:hover { border-color: var(--bda); background: rgba(0,255,136,0.025); }
        .bl-wcard:hover::before { opacity: 1; }
        .bl-wcard.selected { border-color: var(--bda); background: rgba(0,255,136,0.04); }
        .bl-wcard.selected::before { opacity: 1; }

        .bl-wcard-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }

        .bl-wcard-name { font-size: 0.88rem; font-weight: 600; color: var(--t); }

        .bl-wcard-tipo { font-family: var(--fm); font-size: 0.6rem; color: var(--tf); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }

        .bl-estado-pill {
          font-family: var(--fm); font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.06em;
          padding: 0.18rem 0.55rem; border-radius: 4px; border: 1px solid; white-space: nowrap; flex-shrink: 0;
        }

        .bl-wcard-saldo {
          font-family: var(--fd); font-size: 1.3rem; font-weight: 700;
          color: var(--g); letter-spacing: -0.02em; line-height: 1;
        }

        .bl-wcard-footer {
          display: flex; align-items: center; justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.65rem;
          margin-top: 0.1rem;
        }

        .bl-btn-edit {
          background: none; border: 1px solid rgba(0,207,255,0.2);
          color: rgba(0,207,255,0.6); font-family: var(--fm); font-size: 0.55rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          padding: 0.2rem 0.6rem; border-radius: 4px; cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .bl-btn-edit:hover { background: rgba(0,207,255,0.08); color: var(--c); }

        /* ── History table ── */
        .bl-table-head {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1.4fr;
          gap: 0.75rem; padding: 0.6rem 1.25rem;
          background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--bd);
          font-family: var(--fm); font-size: 0.55rem; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--tf);
        }

        .bl-table-row {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1.4fr;
          gap: 0.75rem; align-items: center;
          padding: 0.8rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.12s;
        }

        .bl-table-row:last-child { border-bottom: none; }
        .bl-table-row:hover { background: var(--sfh); }

        .bl-empty {
          padding: 2.5rem 1.25rem; text-align: center;
          font-family: var(--fm); font-size: 0.68rem; color: var(--tf);
        }

        /* Sidebar width */
        .bl-left { width: 300px; min-width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 1.25rem; }
        .bl-right { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }

        @media (max-width: 1024px) { .bl-left, .bl-right { width: 100%; min-width: unset; } }
      `}</style>

        <div className="bl-root">
          <div className="bl-atmo" />
          <div className="bl-scan" />

          {globalError && (
              <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 20 }}>
                <AlertaPanel type="error" title="Error" message={globalError?.message || 'Error'} />
              </div>
          )}
          {globalSuccess && (
              <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 20 }}>
                <AlertaPanel type="success" title="Listo" message={globalSuccess} />
              </div>
          )}

          {billeterasQuery.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0', position: 'relative', zIndex: 1 }}>
                <LoadingSpinner />
              </div>
          ) : (
              <div className="bl-layout">

                {/* ── Left: forms ── */}
                <div className="bl-left">

                  {/* Crear */}
                  <div className="bl-panel accent">
                    <div className="bl-head">
                      <span className="bl-title">Nueva billetera</span>
                      <span className="bl-badge">Create</span>
                    </div>
                    <div className="bl-body">
                      <div className="bl-field">
                        <label className="bl-label">Nombre</label>
                        <input className={`bl-input ${createErrors.nombre ? 'err' : ''}`} placeholder="Ej. Ahorro principal" value={createForm.nombre} onChange={e => setCreateForm(c => ({...c, nombre: e.target.value}))} disabled={createMut.isPending} />
                        {createErrors.nombre && <span className="bl-error">{createErrors.nombre}</span>}
                      </div>
                      <div className="bl-field">
                        <label className="bl-label">Tipo</label>
                        <select className={`bl-input ${createErrors.tipo ? 'err' : ''}`} value={createForm.tipo} onChange={e => setCreateForm(c => ({...c, tipo: e.target.value}))} disabled={createMut.isPending}>
                          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {createErrors.tipo && <span className="bl-error">{createErrors.tipo}</span>}
                      </div>
                      <button className="bl-btn" onClick={handleCreate} disabled={createMut.isPending}>
                        {createMut.isPending ? 'Guardando…' : 'Crear billetera →'}
                      </button>
                    </div>
                  </div>

                  {/* Editar */}
                  <div className="bl-panel">
                    <div className="bl-head">
                      <span className="bl-title">Editar billetera</span>
                      <span className="bl-badge">Update</span>
                    </div>
                    <div className="bl-body">
                      {!editId && (
                          <p style={{ fontFamily: 'var(--fm)', fontSize: '0.65rem', color: 'var(--tf)', lineHeight: 1.6 }}>
                            Selecciona una billetera de la lista para editar.
                          </p>
                      )}
                      <div className="bl-field">
                        <label className="bl-label">Nombre</label>
                        <input className={`bl-input ${editErrors.nombre ? 'err' : ''}`} placeholder="Nuevo nombre" value={editForm.nombre} onChange={e => setEditForm(c => ({...c, nombre: e.target.value}))} disabled={updateMut.isPending || !editId} />
                        {editErrors.nombre && <span className="bl-error">{editErrors.nombre}</span>}
                      </div>
                      <div className="bl-field">
                        <label className="bl-label">Estado</label>
                        <select className={`bl-input ${editErrors.estado ? 'err' : ''}`} value={editForm.estado} onChange={e => setEditForm(c => ({...c, estado: e.target.value}))} disabled={updateMut.isPending || !editId}>
                          {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        {editErrors.estado && <span className="bl-error">{editErrors.estado}</span>}
                      </div>
                      <button className="bl-btn secondary" onClick={handleEdit} disabled={updateMut.isPending || !editId}>
                        {updateMut.isPending ? 'Guardando…' : 'Guardar cambios →'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Right ── */}
                <div className="bl-right">

                  {/* Wallet cards */}
                  <div className="bl-panel">
                    <div className="bl-head">
                      <span className="bl-title">Billeteras del usuario</span>
                      <span className="bl-badge">{billeteras.length} registros</span>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      {billeteras.length ? (
                          <div className="bl-grid">
                            {billeteras.map(w => {
                              const est = estadoStyle(w.estado);
                              const isSelected = selectedWallet?.id === w.id;
                              return (
                                  <div key={w.id} className={`bl-wcard ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedWallet(w)}>
                                    <div className="bl-wcard-top">
                                      <div>
                                        <div className="bl-wcard-name">{w.nombre}</div>
                                        <div className="bl-wcard-tipo">{TIPOS.find(t => t.value === w.tipo)?.label || w.tipo}</div>
                                      </div>
                                      <span className="bl-estado-pill" style={{ color: est.color, borderColor: est.border, background: est.bg }}>
                                {ESTADOS.find(s => s.value === w.estado)?.label || w.estado}
                              </span>
                                    </div>
                                    <div className="bl-wcard-saldo">$ {fmt.format(Number(w.saldo || 0))}</div>
                                    <div className="bl-wcard-footer">
                              <span style={{ fontFamily: 'var(--fm)', fontSize: '0.58rem', color: 'var(--tf)' }}>
                                ID {String(w.id).slice(0, 8)}…
                              </span>
                                      <button className="bl-btn-edit" onClick={e => { e.stopPropagation(); startEdit(w); }}>
                                        Editar
                                      </button>
                                    </div>
                                  </div>
                              );
                            })}
                          </div>
                      ) : (
                          <div className="bl-empty">Sin billeteras. Crea una desde el panel izquierdo.</div>
                      )}
                    </div>
                  </div>

                  {/* Historial */}
                  {selectedWallet && (
                      <div className="bl-panel">
                        <div className="bl-head">
                          <span className="bl-title">Historial — {selectedWallet.nombre}</span>
                          <span className="bl-badge">{transQuery.isLoading ? 'Cargando…' : 'Movimientos'}</span>
                        </div>
                        {transQuery.isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}><LoadingSpinner /></div>
                        ) : history.length ? (
                            <>
                              <div className="bl-table-head">
                                <span>Tipo</span><span>Monto</span><span>Estado</span><span>Fecha</span>
                              </div>
                              {history.map(tx => {
                                const est = estadoStyle(tx.estado);
                                return (
                                    <div key={tx.id} className="bl-table-row">
                                      <span style={{ fontSize: '0.8rem', color: 'var(--t)', fontWeight: 500 }}>{tx.tipo}</span>
                                      <span style={{ fontFamily: 'var(--fm)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--c)' }}>
                              ${fmt.format(Number(tx.valor || 0))}
                            </span>
                                      <span className="bl-estado-pill" style={{ color: est.color, borderColor: est.border, background: est.bg }}>
                              {tx.estado}
                            </span>
                                      <span style={{ fontFamily: 'var(--fm)', fontSize: '0.6rem', color: 'var(--tf)' }}>
                              {tx.fecha ? tx.fecha.replace('T', ' ').slice(0, 16) : '—'}
                            </span>
                                    </div>
                                );
                              })}
                            </>
                        ) : (
                            <div className="bl-empty">Esta billetera aún no registra transacciones.</div>
                        )}
                      </div>
                  )}
                </div>
              </div>
          )}
        </div>
      </>
  );
}