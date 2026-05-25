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
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@500;700;800&display=swap');

      :root{
        --bg:#050816;
        --panel:#0A0F1F;
        --panel2:#0E1628;
        --border:#1A233A;
        --cyan:#00D9FF;
        --green:#B7FF00;
        --orange:#FFB020;
        --red:#ff3355;
        --text:#ffffff;
        --muted:rgba(255,255,255,0.45);
      }

      *{
        box-sizing:border-box;
      }

      .bl-root{
        min-height:100vh;
        background:var(--bg);
        position:relative;
        overflow:hidden;
        font-family:'Rajdhani',sans-serif;
        color:white;
        padding:1.5rem;
      }

      /* GRID BACKGROUND */

      .bl-root::before{
        content:'';
        position:absolute;
        inset:0;
        background-image:
          linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
        background-size:40px 40px;
        opacity:0.18;
        pointer-events:none;
      }

      .bl-root::after{
        content:'';
        position:absolute;
        inset:0;
        background:
          radial-gradient(circle at top left, rgba(0,217,255,0.08), transparent 35%),
          radial-gradient(circle at bottom right, rgba(183,255,0,0.08), transparent 35%);
        pointer-events:none;
      }

      .bl-layout{
        position:relative;
        z-index:2;
        display:flex;
        gap:1.5rem;
        align-items:flex-start;
      }

      @media(max-width:1024px){
        .bl-layout{
          flex-direction:column;
        }
      }

      .bl-left{
        width:340px;
        min-width:340px;
        display:flex;
        flex-direction:column;
        gap:1.5rem;
      }

      .bl-right{
        flex:1;
        display:flex;
        flex-direction:column;
        gap:1.5rem;
        min-width:0;
      }

      @media(max-width:1024px){
        .bl-left,
        .bl-right{
          width:100%;
          min-width:unset;
        }
      }

      /* PANELS */

      .bl-panel{
        background:rgba(10,15,31,0.92);
        backdrop-filter:blur(12px);
        border:1px solid var(--border);
        border-radius:24px;
        overflow:hidden;
        box-shadow:0 0 25px rgba(0,255,170,0.08);
        position:relative;
      }

      .bl-panel::before{
        content:'';
        position:absolute;
        top:0;
        left:0;
        right:0;
        height:2px;
        background:linear-gradient(
          90deg,
          transparent,
          var(--green),
          transparent
        );
        opacity:0.7;
      }

      .bl-head{
        padding:1.25rem 1.5rem;
        border-bottom:1px solid rgba(255,255,255,0.05);
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:1rem;
      }

      .bl-title{
        font-size:1rem;
        font-weight:800;
        letter-spacing:0.2em;
        text-transform:uppercase;
        color:white;
        font-family:'Orbitron',sans-serif;
        position:relative;
      }

      .bl-title::after{
        content:'';
        width:60px;
        height:3px;
        border-radius:999px;
        background:var(--green);
        display:block;
        margin-top:0.5rem;
        box-shadow:0 0 15px var(--green);
      }

      .bl-badge{
        font-size:0.7rem;
        text-transform:uppercase;
        letter-spacing:0.2em;
        color:var(--cyan);
        font-weight:700;
      }

      .bl-body{
        padding:1.5rem;
        display:flex;
        flex-direction:column;
        gap:1rem;
      }

      /* INPUTS */

      .bl-field{
        display:flex;
        flex-direction:column;
        gap:0.45rem;
      }

      .bl-label{
        font-size:0.7rem;
        text-transform:uppercase;
        letter-spacing:0.18em;
        color:rgba(255,255,255,0.5);
        font-weight:700;
      }

      .bl-input{
        width:100%;
        padding:0.9rem 1rem;
        background:#050816;
        border:1px solid #1D2A44;
        border-radius:14px;
        color:white;
        outline:none;
        transition:all .25s ease;
        font-size:0.9rem;
      }

      .bl-input:focus{
        border-color:var(--cyan);
        box-shadow:0 0 0 3px rgba(0,217,255,0.15);
      }

      .bl-input.err{
        border-color:var(--red);
      }

      .bl-error{
        font-size:0.75rem;
        color:var(--red);
      }

      /* BUTTONS */

      .bl-btn{
        width:100%;
        padding:0.95rem;
        border-radius:16px;
        border:1px solid rgba(183,255,0,0.3);
        background:rgba(183,255,0,0.06);
        color:var(--green);
        font-weight:800;
        text-transform:uppercase;
        letter-spacing:0.15em;
        cursor:pointer;
        transition:all .25s ease;
      }

      .bl-btn:hover{
        background:rgba(183,255,0,0.12);
        box-shadow:0 0 20px rgba(183,255,0,0.15);
      }

      .bl-btn.secondary{
        border-color:rgba(0,217,255,0.3);
        color:var(--cyan);
        background:rgba(0,217,255,0.06);
      }

      .bl-btn.secondary:hover{
        background:rgba(0,217,255,0.12);
        box-shadow:0 0 20px rgba(0,217,255,0.12);
      }

      /* WALLET GRID */

      .bl-grid{
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
        gap:1rem;
      }

      .bl-wcard{
        background:rgba(5,8,22,0.9);
        border:1px solid #182338;
        border-radius:22px;
        padding:1.25rem;
        cursor:pointer;
        transition:all .25s ease;
        position:relative;
        overflow:hidden;
      }

      .bl-wcard::before{
        content:'';
        position:absolute;
        top:0;
        left:0;
        right:0;
        height:2px;
        background:linear-gradient(
          90deg,
          transparent,
          var(--cyan),
          transparent
        );
        opacity:0;
        transition:0.3s;
      }

      .bl-wcard:hover{
        background:#0E1628;
        border-color:#23314D;
        box-shadow:0 0 20px rgba(0,255,255,0.08);
        transform:translateY(-2px);
      }

      .bl-wcard:hover::before{
        opacity:1;
      }

      .bl-wcard.selected{
        border-color:rgba(183,255,0,0.35);
        box-shadow:0 0 25px rgba(183,255,0,0.08);
      }

      .bl-wcard-top{
        display:flex;
        justify-content:space-between;
        gap:1rem;
      }

      .bl-wcard-name{
        font-size:1rem;
        font-weight:700;
        color:white;
      }

      .bl-wcard-tipo{
        font-size:0.7rem;
        color:rgba(255,255,255,0.4);
        text-transform:uppercase;
        letter-spacing:0.15em;
        margin-top:4px;
      }

      .bl-wcard-saldo{
        font-size:2rem;
        font-weight:800;
        color:var(--green);
        margin-top:1rem;
        font-family:'Orbitron',sans-serif;
        text-shadow:0 0 10px rgba(183,255,0,0.25);
      }

      .bl-wcard-footer{
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-top:1rem;
        padding-top:1rem;
        border-top:1px solid rgba(255,255,255,0.05);
      }

      .bl-btn-edit{
        border:1px solid rgba(0,217,255,0.25);
        background:rgba(0,217,255,0.05);
        color:var(--cyan);
        padding:0.45rem 0.8rem;
        border-radius:12px;
        font-size:0.7rem;
        text-transform:uppercase;
        letter-spacing:0.12em;
        cursor:pointer;
        transition:all .25s ease;
      }

      .bl-btn-edit:hover{
        background:rgba(0,217,255,0.12);
        box-shadow:0 0 15px rgba(0,217,255,0.12);
      }

      /* STATUS */

      .bl-estado-pill{
        font-size:0.6rem;
        text-transform:uppercase;
        letter-spacing:0.12em;
        padding:0.35rem 0.65rem;
        border-radius:999px;
        border:1px solid;
        font-weight:700;
        white-space:nowrap;
      }

      /* TABLE */

      .bl-table-head{
        display:grid;
        grid-template-columns:1fr 1fr 1fr 1.4fr;
        gap:1rem;
        padding:1rem 1.5rem;
        border-bottom:1px solid #182338;
        font-size:0.72rem;
        text-transform:uppercase;
        letter-spacing:0.18em;
        color:var(--cyan);
        font-weight:800;
      }

      .bl-table-row{
        display:grid;
        grid-template-columns:1fr 1fr 1fr 1.4fr;
        gap:1rem;
        align-items:center;
        padding:1rem 1.5rem;
        border-bottom:1px solid rgba(255,255,255,0.03);
        transition:all .25s ease;
      }

      .bl-table-row:hover{
        background:#0E1628;
      }

      .bl-empty{
        padding:3rem 1rem;
        text-align:center;
        color:rgba(255,255,255,0.45);
        font-size:0.9rem;
      }

      ::-webkit-scrollbar{
        width:8px;
      }

      ::-webkit-scrollbar-thumb{
        background:var(--cyan);
        border-radius:999px;
      }

      ::-webkit-scrollbar-track{
        background:#050816;
      }
    `}</style>

        <div className="bl-root">

          {globalError && (
              <div style={{ position:'absolute', top:0, right:0, zIndex:20 }}>
                <AlertaPanel
                    type="error"
                    title="Error"
                    message={globalError?.message || 'Error'}
                />
              </div>
          )}

          {globalSuccess && (
              <div style={{ position:'absolute', top:0, right:0, zIndex:20 }}>
                <AlertaPanel
                    type="success"
                    title="Operación exitosa"
                    message={globalSuccess}
                />
              </div>
          )}

          {billeterasQuery.isLoading ? (
              <div
                  style={{
                    display:'flex',
                    justifyContent:'center',
                    padding:'4rem 0',
                    position:'relative',
                    zIndex:2
                  }}
              >
                <LoadingSpinner />
              </div>
          ) : (

              <div className="bl-layout">

                {/* LEFT */}

                <div className="bl-left">

                  {/* CREAR */}

                  <div className="bl-panel">

                    <div className="bl-head">
                <span className="bl-title">
                  Nueva Billetera
                </span>

                      <span className="bl-badge">
                  CREATE
                </span>
                    </div>

                    <div className="bl-body">

                      <div className="bl-field">
                        <label className="bl-label">
                          Nombre
                        </label>

                        <input
                            className={`bl-input ${createErrors.nombre ? 'err' : ''}`}
                            placeholder="Ej. Ahorro principal"
                            value={createForm.nombre}
                            onChange={(e) =>
                                setCreateForm(c => ({
                                  ...c,
                                  nombre:e.target.value
                                }))
                            }
                            disabled={createMut.isPending}
                        />

                        {createErrors.nombre && (
                            <span className="bl-error">
                      {createErrors.nombre}
                    </span>
                        )}
                      </div>

                      <div className="bl-field">
                        <label className="bl-label">
                          Tipo
                        </label>

                        <select
                            className={`bl-input ${createErrors.tipo ? 'err' : ''}`}
                            value={createForm.tipo}
                            onChange={(e) =>
                                setCreateForm(c => ({
                                  ...c,
                                  tipo:e.target.value
                                }))
                            }
                        >
                          {TIPOS.map(t => (
                              <option
                                  key={t.value}
                                  value={t.value}
                              >
                                {t.label}
                              </option>
                          ))}
                        </select>

                        {createErrors.tipo && (
                            <span className="bl-error">
                      {createErrors.tipo}
                    </span>
                        )}
                      </div>

                      <button
                          className="bl-btn"
                          onClick={handleCreate}
                          disabled={createMut.isPending}
                      >
                        {createMut.isPending
                            ? 'Guardando...'
                            : 'Crear billetera'}
                      </button>
                    </div>
                  </div>

                  {/* EDITAR */}

                  <div className="bl-panel">

                    <div className="bl-head">
                <span className="bl-title">
                  Editar Billetera
                </span>

                      <span className="bl-badge">
                  UPDATE
                </span>
                    </div>

                    <div className="bl-body">

                      {!editId && (
                          <p style={{ color:'rgba(255,255,255,0.45)' }}>
                            Selecciona una billetera para editar.
                          </p>
                      )}

                      <div className="bl-field">
                        <label className="bl-label">
                          Nombre
                        </label>

                        <input
                            className={`bl-input ${editErrors.nombre ? 'err' : ''}`}
                            placeholder="Nuevo nombre"
                            value={editForm.nombre}
                            onChange={(e) =>
                                setEditForm(c => ({
                                  ...c,
                                  nombre:e.target.value
                                }))
                            }
                            disabled={!editId}
                        />
                      </div>

                      <div className="bl-field">
                        <label className="bl-label">
                          Estado
                        </label>

                        <select
                            className={`bl-input ${editErrors.estado ? 'err' : ''}`}
                            value={editForm.estado}
                            onChange={(e) =>
                                setEditForm(c => ({
                                  ...c,
                                  estado:e.target.value
                                }))
                            }
                            disabled={!editId}
                        >
                          {ESTADOS.map(s => (
                              <option
                                  key={s.value}
                                  value={s.value}
                              >
                                {s.label}
                              </option>
                          ))}
                        </select>
                      </div>

                      <button
                          className="bl-btn secondary"
                          onClick={handleEdit}
                          disabled={!editId}
                      >
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}

                <div className="bl-right">

                  {/* BILLETERAS */}

                  <div className="bl-panel">

                    <div className="bl-head">
                <span className="bl-title">
                  Billeteras del Usuario
                </span>

                      <span className="bl-badge">
                  {billeteras.length} REGISTROS
                </span>
                    </div>

                    <div style={{ padding:'1.5rem' }}>

                      {billeteras.length ? (

                          <div className="bl-grid">

                            {billeteras.map(w => {

                              const est = estadoStyle(w.estado);

                              const isSelected =
                                  selectedWallet?.id === w.id;

                              return (

                                  <div
                                      key={w.id}
                                      className={`bl-wcard ${isSelected ? 'selected' : ''}`}
                                      onClick={() => setSelectedWallet(w)}
                                  >

                                    <div className="bl-wcard-top">

                                      <div>
                                        <div className="bl-wcard-name">
                                          {w.nombre}
                                        </div>

                                        <div className="bl-wcard-tipo">
                                          {TIPOS.find(
                                              t => t.value === w.tipo
                                          )?.label || w.tipo}
                                        </div>
                                      </div>

                                      <span
                                          className="bl-estado-pill"
                                          style={{
                                            color:est.color,
                                            borderColor:est.border,
                                            background:est.bg
                                          }}
                                      >
                              {ESTADOS.find(
                                  s => s.value === w.estado
                              )?.label || w.estado}
                            </span>
                                    </div>

                                    <div className="bl-wcard-saldo">
                                      $ {fmt.format(Number(w.saldo || 0))}
                                    </div>

                                    <div className="bl-wcard-footer">

                            <span style={{
                              color:'rgba(255,255,255,0.35)',
                              fontSize:'0.75rem'
                            }}>
                              UID {String(w.id).slice(0,8)}
                            </span>

                                      <button
                                          className="bl-btn-edit"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEdit(w);
                                          }}
                                      >
                                        Editar
                                      </button>
                                    </div>
                                  </div>
                              );
                            })}
                          </div>

                      ) : (
                          <div className="bl-empty">
                            No existen billeteras.
                          </div>
                      )}
                    </div>
                  </div>

                  {/* HISTORIAL */}

                  {selectedWallet && (

                      <div className="bl-panel">

                        <div className="bl-head">

                  <span className="bl-title">
                    Historial — {selectedWallet.nombre}
                  </span>

                          <span className="bl-badge">
                    MOVIMIENTOS
                  </span>
                        </div>

                        {transQuery.isLoading ? (

                            <div
                                style={{
                                  display:'flex',
                                  justifyContent:'center',
                                  padding:'2rem'
                                }}
                            >
                              <LoadingSpinner />
                            </div>

                        ) : history.length ? (

                            <>
                              <div className="bl-table-head">
                                <span>Tipo</span>
                                <span>Monto</span>
                                <span>Estado</span>
                                <span>Fecha</span>
                              </div>

                              {history.map(tx => {

                                const est =
                                    estadoStyle(tx.estado);

                                return (

                                    <div
                                        key={tx.id}
                                        className="bl-table-row"
                                    >

                          <span style={{
                            color:'white',
                            fontWeight:600
                          }}>
                            {tx.tipo}
                          </span>

                                      <span style={{
                                        color:'var(--cyan)',
                                        fontWeight:800
                                      }}>
                            $
                                        {fmt.format(
                                            Number(tx.valor || 0)
                                        )}
                          </span>

                                      <span
                                          className="bl-estado-pill"
                                          style={{
                                            color:est.color,
                                            borderColor:est.border,
                                            background:est.bg
                                          }}
                                      >
                            {tx.estado}
                          </span>

                                      <span style={{
                                        color:'rgba(255,255,255,0.4)'
                                      }}>
                            {tx.fecha
                                ? tx.fecha
                                    .replace('T',' ')
                                    .slice(0,16)
                                : '—'}
                          </span>
                                    </div>
                                );
                              })}
                            </>

                        ) : (
                            <div className="bl-empty">
                              Esta billetera aún no tiene transacciones.
                            </div>
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