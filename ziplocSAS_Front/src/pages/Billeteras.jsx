import { useEffect, useState, useMemo } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import { useBilleteras, useCrearBilletera, useActualizarBilletera } from '../hooks/useBilleteras';
import { useTransacciones } from '../hooks/useTransacciones';
import { Wallet, Plus, Pencil, Activity, Zap, TrendingUp, CreditCard, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock } from 'lucide-react';

const TIPOS = [
  { label: 'Ahorro',        value: 'AHORRO',        icon: '💰', color: '#C8FF00' },
  { label: 'Ahorros',       value: 'AHORROS',       icon: '🏦', color: '#C8FF00' },
  { label: 'Gastos diarios',value: 'GASTOS_DIARIOS', icon: '🛒', color: '#FF2D78' },
  { label: 'Compras',       value: 'COMPRAS',       icon: '🛍️', color: '#FFE500' },
  { label: 'Transporte',    value: 'TRANSPORTE',    icon: '🚌', color: '#00C8FF' },
  { label: 'Corriente',     value: 'CORRIENTE',     icon: '💳', color: '#00FFA3' },
  { label: 'Inversión',     value: 'INVERSION',     icon: '📈', color: '#C8FF00' },
  { label: 'Crédito',       value: 'CREDITO',       icon: '💸', color: '#FF2D78' },
];

const ESTADOS = [
  { label: 'Activa',      value: 'ACTIVA',      color: '#C8FF00', dot: '#C8FF00' },
  { label: 'Suspendida',  value: 'SUSPENDIDA',  color: '#FFE500', dot: '#FFE500' },
  { label: 'Congelada',   value: 'CONGELADA',   color: '#00C8FF', dot: '#00C8FF' },
  { label: 'Cerrada',     value: 'CERRADA',     color: '#555',    dot: '#444'    },
];

const TIPO_TX = {
  RECARGA:         { label: 'Recarga',       color: '#C8FF00', Icon: ArrowDownLeft  },
  RETIRO:          { label: 'Retiro',        color: '#FF2D78', Icon: ArrowUpRight   },
  TRANSFERENCIA:   { label: 'Transf.',       color: '#00C8FF', Icon: ArrowLeftRight },
  PAGO_PROGRAMADO: { label: 'Programado',    color: '#FFE500', Icon: Clock          },
};

const fmtCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
const fmtNum = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 });
const fmtDate = d => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function tipoMeta(t)   { return TIPO_TX[String(t||'').toUpperCase()]   || { label: t||'—', color: '#888', Icon: Zap }; }
function estadoMeta(e) { return ESTADOS.find(s => s.value === String(e||'').toUpperCase()) || { label: e||'—', color: '#555', dot: '#444' }; }
function tipoInfo(v)   { return TIPOS.find(t => t.value === v) || { label: v||'—', icon: '🪙', color: '#888' }; }

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

/* ── Glitch title ── */
function GlitchText({ children }) {
  return <span className="bl-glitch" data-text={children}>{children}</span>;
}

/* ── Balance bar ── */
function BalanceBar({ saldo, max, color }) {
  const pct = max > 0 ? Math.max(2, (saldo / max) * 100) : 2;
  return (
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}80` }} />
      </div>
  );
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
  const [editMode, setEditMode] = useState(false); // toggle left panel

  const billeteras = billeterasQuery.data?.billeteras || billeterasQuery.data || [];
  const transQuery = useTransacciones(selectedWallet?.id || null);
  const history = transQuery.data?.transacciones || transQuery.data || [];

  useEffect(() => {
    if (billeteras.length && !selectedWallet) setSelectedWallet(billeteras[0]);
  }, [billeteras]);

  const maxSaldo = useMemo(() => Math.max(...billeteras.map(w => Number(w.saldo || 0)), 1), [billeteras]);
  const totalSaldo = useMemo(() => billeteras.reduce((a, w) => a + Number(w.saldo || 0), 0), [billeteras]);
  const activasCount = useMemo(() => billeteras.filter(w => String(w.estado||'').toUpperCase() === 'ACTIVA').length, [billeteras]);
  const volumenTx = useMemo(() => history.reduce((a, t) => a + Number(t.valor || 0), 0), [history]);

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
      setEditMode(false);
    } catch {}
  }

  function startEdit(w) {
    setEditId(w.id);
    setEditForm({ nombre: w.nombre || '', estado: w.estado || 'ACTIVA' });
    setEditErrors({});
    setEditMode(true);
  }

  const globalError = billeterasQuery.error || createMut.error || updateMut.error;
  const globalSuccess = createMut.isSuccess ? 'Billetera creada.' : updateMut.isSuccess ? 'Billetera actualizada.' : '';

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');

        :root {
          --acid: #C8FF00; --acid2: #00FFA3; --plasma: #FF2D78; --volt: #FFE500; --sky: #00C8FF;
          --void: #08080F; --surface: rgba(255,255,255,0.022); --surface-hover: rgba(200,255,0,0.04);
          --line: rgba(255,255,255,0.06); --line-acid: rgba(200,255,0,0.2);
          --text: #F0F0F0; --muted: rgba(255,255,255,0.32); --faint: rgba(255,255,255,0.07);
          --mono: 'DM Mono', monospace; --head: 'Bebas Neue', sans-serif; --body: 'Syne', sans-serif;
        }

        .bl-root { font-family: var(--body); background: var(--void); min-height: 100vh; position: relative; overflow-x: hidden; color: var(--text); }

        /* Backgrounds */
        .bl-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 45% at 0% 100%, rgba(0,200,255,0.055) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 100% 0%, rgba(200,255,0,0.05) 0%, transparent 55%),
            radial-gradient(ellipse 35% 30% at 55% 55%, rgba(255,45,120,0.025) 0%, transparent 65%);
        }
        .bl-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: linear-gradient(rgba(200,255,0,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(200,255,0,0.028) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .bl-noise {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* Glitch */
        .bl-glitch { position: relative; display: inline-block; }
        .bl-glitch::before, .bl-glitch::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; overflow: hidden; }
        .bl-glitch::before { color: var(--plasma); animation: g-top 5s infinite linear; }
        .bl-glitch::after  { color: var(--sky);    animation: g-bot 5s 0.6s infinite linear; }
        @keyframes g-top { 0%,82%,100%{clip:rect(0,900px,0,0);transform:none} 12%{clip:rect(0,900px,2px,0);transform:translateX(-2px)} 38%{clip:rect(0,900px,1px,0);transform:translateX(1px)} }
        @keyframes g-bot { 0%,82%,100%{clip:rect(0,900px,0,0);transform:none} 22%{clip:rect(26px,900px,34px,0);transform:translateX(2px)} 52%{clip:rect(12px,900px,18px,0);transform:translateX(-2px)} }

        /* Wrap */
        .bl-wrap { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.5rem; }

        /* Top bar */
        .bl-topbar {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          padding: 1.2rem 1.6rem; border-bottom: 1px solid var(--line-acid);
          background: rgba(0,0,0,0.4); backdrop-filter: blur(12px);
        }
        .bl-brand { display: flex; align-items: baseline; gap: 0.5rem; }
        .bl-brand-title { font-family: var(--head); font-size: 2.2rem; letter-spacing: 0.06em; color: var(--acid); line-height: 1; }
        .bl-brand-sub { font-family: var(--mono); font-size: 0.55rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.14em; border-left: 1px solid var(--line-acid); padding-left: 0.5rem; margin-left: 0.25rem; }

        /* KPI strip */
        .bl-kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        @media (max-width: 900px) { .bl-kpi { grid-template-columns: repeat(2,1fr); } }

        .kpi-card { padding: 1.1rem 1.25rem; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; position: relative; overflow: hidden; transition: border-color 0.2s; }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .kpi-card.acid::before   { background: linear-gradient(90deg, var(--acid), transparent); }
        .kpi-card.plasma::before { background: linear-gradient(90deg, var(--plasma), transparent); }
        .kpi-card.volt::before   { background: linear-gradient(90deg, var(--volt), transparent); }
        .kpi-card.sky::before    { background: linear-gradient(90deg, var(--sky), transparent); }
        .kpi-card:hover { border-color: var(--line-acid); }
        .kpi-lbl { font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem; }
        .kpi-val { font-family: var(--head); font-size: 1.8rem; letter-spacing: 0.04em; line-height: 1; }
        .kpi-sub { font-family: var(--mono); font-size: 0.56rem; color: var(--muted); margin-top: 0.3rem; }
        .kpi-card.acid .kpi-val  { color: var(--acid); }
        .kpi-card.plasma .kpi-val{ color: var(--plasma); }
        .kpi-card.volt .kpi-val  { color: var(--volt); }
        .kpi-card.sky .kpi-val   { color: var(--sky); }

        /* Layout */
        .bl-layout { display: grid; grid-template-columns: 320px 1fr; gap: 1.5rem; align-items: start; }
        @media (max-width: 1080px) { .bl-layout { grid-template-columns: 1fr; } }

        /* Panel base */
        .bl-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
        .bl-panel-head { padding: 1rem 1.25rem; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; }
        .bl-panel-title { font-family: var(--head); font-size: 1.05rem; letter-spacing: 0.06em; color: var(--text); display: flex; align-items: center; gap: 0.4rem; }
        .bl-panel-badge { font-family: var(--mono); font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); padding: 0.15rem 0.5rem; border: 1px solid var(--line); border-radius: 4px; }

        /* Left column */
        .bl-left { display: flex; flex-direction: column; gap: 1.25rem; }

        /* Form fields */
        .bl-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.9rem; }
        .bl-field { display: flex; flex-direction: column; gap: 0.3rem; }
        .bl-label { font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
        .bl-input {
          width: 100%; padding: 0.65rem 0.85rem;
          background: rgba(0,0,0,0.5); border: 1px solid var(--line);
          border-radius: 6px; color: var(--text); font-family: var(--mono); font-size: 0.76rem;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s; appearance: none;
        }
        .bl-input:focus { border-color: var(--line-acid); box-shadow: 0 0 0 3px rgba(200,255,0,0.05); }
        .bl-input.err { border-color: var(--plasma); }
        .bl-input:disabled { opacity: 0.35; cursor: not-allowed; }
        .bl-err { font-family: var(--mono); font-size: 0.57rem; color: var(--plasma); }

        /* Tipo buttons grid */
        .bl-tipo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
        .bl-tipo-btn {
          padding: 0.55rem 0.4rem; background: rgba(0,0,0,0.4); border: 1px solid var(--line);
          border-radius: 7px; cursor: pointer; transition: all 0.15s;
          display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
          font-family: var(--mono); font-size: 0.5rem; text-transform: uppercase;
          letter-spacing: 0.05em; color: var(--muted); line-height: 1.2;
        }
        .bl-tipo-btn:hover { border-color: rgba(255,255,255,0.15); color: var(--text); }
        .bl-tipo-btn.active { border-color: var(--line-acid); background: rgba(200,255,0,0.06); color: var(--acid); }
        .bl-tipo-icon { font-size: 1rem; }

        /* Submit */
        .bl-submit {
          width: 100%; padding: 0.82rem;
          background: var(--acid); border: none; border-radius: 7px;
          color: #000; font-family: var(--body); font-size: 0.76rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 0 20px rgba(200,255,0,0.2);
        }
        .bl-submit:hover { background: #d4ff00; box-shadow: 0 0 30px rgba(200,255,0,0.35); }
        .bl-submit:disabled { opacity: 0.35; cursor: not-allowed; }

        .bl-submit.sky {
          background: rgba(0,200,255,0.12); border: 1px solid rgba(0,200,255,0.3);
          color: var(--sky); box-shadow: 0 0 16px rgba(0,200,255,0.12);
        }
        .bl-submit.sky:hover { background: rgba(0,200,255,0.2); box-shadow: 0 0 24px rgba(0,200,255,0.2); }
        .bl-submit.sky:disabled { opacity: 0.3; }

        /* Estado toggle */
        .bl-estado-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
        .bl-estado-btn {
          padding: 0.5rem 0.4rem; background: rgba(0,0,0,0.4); border: 1px solid var(--line);
          border-radius: 7px; cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 0.35rem;
          font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase;
          letter-spacing: 0.05em; color: var(--muted);
        }
        .bl-estado-btn.active { border-color: currentColor; }
        .bl-estado-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .bl-estado-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Wallet cards grid */
        .wcard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; padding: 1.25rem; }

        .wcard {
          background: rgba(0,0,0,0.35); border: 1px solid var(--line);
          border-radius: 10px; padding: 1.1rem; position: relative; overflow: hidden;
          cursor: pointer; transition: all 0.2s;
        }
        .wcard::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; opacity: 0; transition: opacity 0.2s; }
        .wcard:hover { border-color: rgba(255,255,255,0.12); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
        .wcard:hover::before { opacity: 1; }
        .wcard.selected { border-color: var(--line-acid); background: rgba(200,255,0,0.04); box-shadow: 0 0 20px rgba(200,255,0,0.05); }
        .wcard.selected::before { opacity: 1; background: linear-gradient(90deg, var(--acid), transparent) !important; }

        .wcard-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.6rem; }
        .wcard-name { font-size: 0.9rem; font-weight: 700; color: var(--text); }
        .wcard-tipo { font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); margin-top: 2px; display: flex; align-items: center; gap: 0.3rem; }

        .wcard-estado { display: inline-flex; align-items: center; gap: 0.3rem; font-family: var(--mono); font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.18rem 0.55rem; border-radius: 4px; border: 1px solid; }
        .wcard-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

        .wcard-saldo { font-family: var(--head); font-size: 1.6rem; letter-spacing: 0.04em; color: var(--acid); margin-top: 0.4rem; }
        .wcard-saldo.frozen { color: var(--sky); }
        .wcard-saldo.suspended { color: var(--volt); }
        .wcard-saldo.closed { color: var(--muted); }

        .wcard-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px solid var(--line); }
        .wcard-id { font-family: var(--mono); font-size: 0.52rem; color: var(--faint, rgba(255,255,255,0.2)); }
        .wcard-edit-btn {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.28rem 0.6rem; background: none; border: 1px solid var(--line);
          border-radius: 5px; cursor: pointer; color: var(--muted);
          font-family: var(--mono); font-size: 0.52rem; text-transform: uppercase;
          letter-spacing: 0.06em; transition: all 0.15s;
        }
        .wcard-edit-btn:hover { border-color: rgba(0,200,255,0.4); color: var(--sky); background: rgba(0,200,255,0.06); }

        /* History table */
        .hx-table { width: 100%; border-collapse: collapse; }
        .hx-table thead tr { border-bottom: 1px solid var(--line); background: rgba(0,0,0,0.3); }
        .hx-table th { padding: 0.7rem 1rem; text-align: left; font-family: var(--mono); font-size: 0.52rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; }
        .hx-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.025); transition: background 0.12s; }
        .hx-table tbody tr:last-child { border-bottom: none; }
        .hx-table tbody tr:hover { background: var(--surface-hover); }
        .hx-table td { padding: 0.78rem 1rem; }

        .hx-tipo { display: inline-flex; align-items: center; gap: 0.3rem; font-family: var(--mono); font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.2rem 0.55rem; border-radius: 4px; border: 1px solid; }
        .hx-monto { font-family: var(--head); font-size: 1.05rem; letter-spacing: 0.04em; }
        .hx-estado { display: inline-flex; align-items: center; gap: 0.35rem; font-family: var(--mono); font-size: 0.57rem; }
        .hx-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .hx-date { font-family: var(--mono); font-size: 0.6rem; color: var(--muted); }

        .bl-empty { padding: 2.5rem; text-align: center; font-family: var(--mono); font-size: 0.63rem; color: var(--muted); }

        /* Panel toggle (create vs edit) */
        .bl-panel-toggle { display: flex; border-bottom: 1px solid var(--line); }
        .bl-tab { flex: 1; padding: 0.75rem 1rem; background: none; border: none; cursor: pointer; font-family: var(--mono); font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); transition: all 0.15s; border-bottom: 2px solid transparent; margin-bottom: -1px; }
        .bl-tab.active { color: var(--acid); border-bottom-color: var(--acid); background: rgba(200,255,0,0.03); }
        .bl-tab:hover:not(.active) { color: var(--text); }

        /* Success/error inline */
        .bl-success { background: rgba(200,255,0,0.08); border: 1px solid rgba(200,255,0,0.25); border-radius: 7px; padding: 0.6rem 0.9rem; font-family: var(--mono); font-size: 0.62rem; color: var(--acid); display: flex; align-items: center; gap: 0.5rem; }
        .bl-error-bar { background: rgba(255,45,120,0.08); border: 1px solid rgba(255,45,120,0.25); border-radius: 7px; padding: 0.6rem 0.9rem; font-family: var(--mono); font-size: 0.62rem; color: var(--plasma); display: flex; align-items: center; gap: 0.5rem; }
      `}</style>

        <div className="bl-root">
          <div className="bl-bg" />
          <div className="bl-grid" />
          <div className="bl-noise" />

          {globalError && (
              <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99 }}>
                <AlertaPanel type="error" title="Error" message={globalError?.message || 'Error'} />
              </div>
          )}
          {globalSuccess && (
              <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99 }}>
                <AlertaPanel type="success" title="¡Listo!" message={globalSuccess} />
              </div>
          )}

          <div className="bl-wrap">

            {/* Top bar */}
            <div className="bl-topbar">
              <div className="bl-brand">
                <span className="bl-brand-title"><GlitchText>BILLETERAS</GlitchText></span>
                <span className="bl-brand-sub">Gestión · Saldos · Movimientos</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--acid2)', boxShadow: '0 0 8px var(--acid2)', display: 'inline-block' }} />
                {billeteras.length} billeteras registradas
              </div>
            </div>

            {/* KPI strip */}
            <div className="bl-kpi">
              <div className="kpi-card acid">
                <div className="kpi-lbl"><Wallet size={11} /> Saldo total</div>
                <div className="kpi-val">{totalSaldo > 999999 ? (totalSaldo/1000000).toFixed(1)+'M' : fmtNum.format(Math.round(totalSaldo))}</div>
                <div className="kpi-sub">COP en {billeteras.length} billeteras</div>
              </div>
              <div className="kpi-card plasma">
                <div className="kpi-lbl"><Activity size={11} /> Activas</div>
                <div className="kpi-val">{activasCount}</div>
                <div className="kpi-sub">{billeteras.length ? Math.round((activasCount/billeteras.length)*100) : 0}% del total</div>
              </div>
              <div className="kpi-card volt">
                <div className="kpi-lbl"><TrendingUp size={11} /> Promedio</div>
                <div className="kpi-val">{billeteras.length ? fmtNum.format(Math.round(totalSaldo/billeteras.length)) : '0'}</div>
                <div className="kpi-sub">COP por billetera</div>
              </div>
              <div className="kpi-card sky">
                <div className="kpi-lbl"><Zap size={11} /> Volumen TX</div>
                <div className="kpi-val">{volumenTx > 999999 ? (volumenTx/1000000).toFixed(1)+'M' : volumenTx > 999 ? (volumenTx/1000).toFixed(0)+'K' : volumenTx}</div>
                <div className="kpi-sub">en {history.length} movimientos</div>
              </div>
            </div>

            {billeterasQuery.isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><LoadingSpinner /></div>
            ) : (
                <div className="bl-layout">

                  {/* LEFT: Form panel */}
                  <div className="bl-left">
                    <div className="bl-panel">
                      <div className="bl-panel-toggle">
                        <button className={`bl-tab ${!editMode ? 'active' : ''}`} onClick={() => setEditMode(false)}>
                          <Plus size={11} style={{ display: 'inline', marginRight: 4 }} /> Nueva
                        </button>
                        <button className={`bl-tab ${editMode ? 'active' : ''}`} onClick={() => setEditMode(true)} style={editId ? {} : { opacity: 0.4 }}>
                          <Pencil size={11} style={{ display: 'inline', marginRight: 4 }} /> Editar {editId ? '' : '(selecciona)'}
                        </button>
                      </div>

                      {!editMode ? (
                          /* CREATE */
                          <div className="bl-body">
                            {createMut.isSuccess && <div className="bl-success"><Zap size={12} /> Billetera creada.</div>}
                            {createMut.error && <div className="bl-error-bar">{createMut.error?.message}</div>}

                            <div className="bl-field">
                              <label className="bl-label">Nombre de la billetera</label>
                              <input className={`bl-input ${createErrors.nombre ? 'err' : ''}`} placeholder="Ej. Ahorro principal" value={createForm.nombre} onChange={e => setCreateForm(c => ({...c, nombre: e.target.value}))} disabled={createMut.isPending} />
                              {createErrors.nombre && <span className="bl-err">{createErrors.nombre}</span>}
                            </div>

                            <div className="bl-field">
                              <label className="bl-label">Tipo</label>
                              <div className="bl-tipo-grid">
                                {TIPOS.map(t => (
                                    <button key={t.value} type="button"
                                            className={`bl-tipo-btn ${createForm.tipo === t.value ? 'active' : ''}`}
                                            style={createForm.tipo === t.value ? { borderColor: `${t.color}55`, background: `${t.color}0a`, color: t.color } : {}}
                                            onClick={() => setCreateForm(c => ({...c, tipo: t.value}))}
                                    >
                                      <span className="bl-tipo-icon">{t.icon}</span>
                                      {t.label}
                                    </button>
                                ))}
                              </div>
                              {createErrors.tipo && <span className="bl-err">{createErrors.tipo}</span>}
                            </div>

                            <button className="bl-submit" onClick={handleCreate} disabled={createMut.isPending}>
                              {createMut.isPending ? 'Creando…' : 'Crear billetera →'}
                            </button>
                          </div>
                      ) : (
                          /* EDIT */
                          <div className="bl-body">
                            {!editId && <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--muted)', padding: '0.5rem 0' }}>Haz clic en "Editar" en una billetera para comenzar.</div>}
                            {updateMut.isSuccess && <div className="bl-success"><Zap size={12} /> Billetera actualizada.</div>}
                            {updateMut.error && <div className="bl-error-bar">{updateMut.error?.message}</div>}

                            <div className="bl-field">
                              <label className="bl-label">Nombre</label>
                              <input className={`bl-input ${editErrors.nombre ? 'err' : ''}`} placeholder="Nuevo nombre" value={editForm.nombre} onChange={e => setEditForm(c => ({...c, nombre: e.target.value}))} disabled={!editId || updateMut.isPending} />
                              {editErrors.nombre && <span className="bl-err">{editErrors.nombre}</span>}
                            </div>

                            <div className="bl-field">
                              <label className="bl-label">Estado</label>
                              <div className="bl-estado-grid">
                                {ESTADOS.map(s => (
                                    <button key={s.value} type="button"
                                            className={`bl-estado-btn ${editForm.estado === s.value ? 'active' : ''}`}
                                            style={{ color: editForm.estado === s.value ? s.color : 'var(--muted)', borderColor: editForm.estado === s.value ? `${s.color}55` : 'var(--line)', background: editForm.estado === s.value ? `${s.color}0d` : 'rgba(0,0,0,0.3)' }}
                                            onClick={() => setEditForm(c => ({...c, estado: s.value}))}
                                            disabled={!editId}
                                    >
                                      <span className="bl-estado-dot" style={{ background: s.dot, boxShadow: editForm.estado === s.value ? `0 0 6px ${s.dot}` : 'none' }} />
                                      {s.label}
                                    </button>
                                ))}
                              </div>
                              {editErrors.estado && <span className="bl-err">{editErrors.estado}</span>}
                            </div>

                            <button className="bl-submit sky" onClick={handleEdit} disabled={!editId || updateMut.isPending}>
                              {updateMut.isPending ? 'Guardando…' : 'Guardar cambios →'}
                            </button>

                            {editId && (
                                <button onClick={() => { setEditId(null); setEditForm({ nombre: '', estado: ESTADOS[0].value }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '0.56rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: 0 }}>
                                  Cancelar
                                </button>
                            )}
                          </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: wallet grid + history */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Wallet grid */}
                    <div className="bl-panel">
                      <div className="bl-panel-head">
                        <span className="bl-panel-title"><CreditCard size={14} color="var(--acid)" /> Billeteras</span>
                        <span className="bl-panel-badge">{billeteras.length} registros</span>
                      </div>
                      {billeteras.length ? (
                          <div className="wcard-grid">
                            {billeteras.map(w => {
                              const ti = tipoInfo(w.tipo);
                              const em = estadoMeta(w.estado);
                              const isSelected = selectedWallet?.id === w.id;
                              const saldoClass = { CONGELADA: 'frozen', SUSPENDIDA: 'suspended', CERRADA: 'closed' }[String(w.estado||'').toUpperCase()] || '';
                              return (
                                  <div key={w.id} className={`wcard ${isSelected ? 'selected' : ''}`}
                                       style={{ '--tip': `${ti.color}` }}
                                       onClick={() => setSelectedWallet(w)}
                                  >
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${ti.color}, transparent)` }} />
                                    <div className="wcard-top">
                                      <div>
                                        <div className="wcard-name">{w.nombre}</div>
                                        <div className="wcard-tipo">{ti.icon} {ti.label}</div>
                                      </div>
                                      <span className="wcard-estado" style={{ color: em.color, borderColor: `${em.color}40`, background: `${em.color}0d` }}>
                                <span className="wcard-dot" style={{ background: em.dot, boxShadow: `0 0 5px ${em.dot}` }} />
                                        {em.label}
                              </span>
                                    </div>
                                    <div className={`wcard-saldo ${saldoClass}`}>{fmtCOP.format(Number(w.saldo || 0))}</div>
                                    <BalanceBar saldo={Number(w.saldo || 0)} max={maxSaldo} color={ti.color} />
                                    <div className="wcard-footer">
                                      <span className="wcard-id">ID {String(w.id).slice(0,8)}…</span>
                                      <button className="wcard-edit-btn" onClick={e => { e.stopPropagation(); startEdit(w); }}>
                                        <Pencil size={10} /> Editar
                                      </button>
                                    </div>
                                  </div>
                              );
                            })}
                          </div>
                      ) : (
                          <div className="bl-empty">No existen billeteras para este usuario.</div>
                      )}
                    </div>

                    {/* History panel */}
                    {selectedWallet && (
                        <div className="bl-panel">
                          <div className="bl-panel-head">
                            <span className="bl-panel-title"><Activity size={14} color="var(--sky)" /> Historial — {selectedWallet.nombre}</span>
                            <span className="bl-panel-badge">{history.length} movimientos</span>
                          </div>
                          {transQuery.isLoading ? (
                              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}><LoadingSpinner /></div>
                          ) : history.length ? (
                              <div style={{ overflowX: 'auto' }}>
                                <table className="hx-table">
                                  <thead>
                                  <tr>
                                    <th>Tipo</th>
                                    <th>Monto</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                  </tr>
                                  </thead>
                                  <tbody>
                                  {history.map(tx => {
                                    const tm = tipoMeta(tx.tipo);
                                    const em = estadoMeta(tx.estado);
                                    const TxIcon = tm.Icon;
                                    return (
                                        <tr key={tx.id}>
                                          <td>
                                    <span className="hx-tipo" style={{ color: tm.color, borderColor: `${tm.color}40`, background: `${tm.color}0d` }}>
                                      <TxIcon size={11} /> {tm.label}
                                    </span>
                                          </td>
                                          <td>
                                    <span className="hx-monto" style={{ color: String(tx.tipo||'').toUpperCase() === 'RETIRO' ? 'var(--plasma)' : String(tx.tipo||'').toUpperCase() === 'RECARGA' ? 'var(--acid)' : 'var(--sky)' }}>
                                      {String(tx.tipo||'').toUpperCase() === 'RETIRO' ? '-' : '+'}{fmtCOP.format(Number(tx.valor || 0))}
                                    </span>
                                          </td>
                                          <td>
                                            <div className="hx-estado">
                                              <span className="hx-dot" style={{ background: em.dot, boxShadow: `0 0 5px ${em.dot}` }} />
                                              <span style={{ color: em.color, fontFamily: 'var(--mono)', fontSize: '0.6rem' }}>{em.label}</span>
                                            </div>
                                          </td>
                                          <td><span className="hx-date">{fmtDate(tx.fecha)}</span></td>
                                        </tr>
                                    );
                                  })}
                                  </tbody>
                                </table>
                              </div>
                          ) : (
                              <div className="bl-empty">Esta billetera aún no tiene transacciones.</div>
                          )}
                        </div>
                    )}
                  </div>
                </div>
            )}
          </div>
        </div>
      </>
  );
}