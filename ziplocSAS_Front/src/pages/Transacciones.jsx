import { useState, useEffect, useMemo } from 'react';
import TransaccionForm from '../components/TransaccionForm';
import TransaccionItem from '../components/TransaccionItem';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import SelectCustom from '../components/SelectCustom';
import UsuarioCard from '../components/UsuarioCard';
import NotificacionesPanel from '../components/NotificacionesPanel';
import { useBilleteras } from '../hooks/useBilleteras';
import { useTransacciones, useCrearTransaccion, useRevertirTransaccion } from '../hooks/useTransacciones';
import { obtenerUsuarioPorId } from '../services/api';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock, Zap, Activity, TrendingUp, Bell, Wallet, RotateCcw, Filter, Calendar } from 'lucide-react';

const INITIAL_FORM = { tipo: '', billeteraOrigenId: '', billeteraDestinoId: '', destinoExternoId: '', valor: '' };

const TIPO_META = {
  RECARGA:         { label: 'Recarga',          icon: ArrowDownLeft,  color: '#C8FF00', bg: 'rgba(200,255,0,0.07)',   border: 'rgba(200,255,0,0.2)' },
  RETIRO:          { label: 'Retiro',           icon: ArrowUpRight,   color: '#FF2D78', bg: 'rgba(255,45,120,0.07)',  border: 'rgba(255,45,120,0.2)' },
  TRANSFERENCIA:   { label: 'Transferencia',    icon: ArrowLeftRight, color: '#00C8FF', bg: 'rgba(0,200,255,0.07)',   border: 'rgba(0,200,255,0.2)' },
  PAGO_PROGRAMADO: { label: 'Pago programado',  icon: Clock,          color: '#FFE500', bg: 'rgba(255,229,0,0.07)',   border: 'rgba(255,229,0,0.2)' },
};

const ESTADO_META = {
  PENDIENTE:   { label: 'Pendiente',   color: '#FFE500', dot: '#FFE500' },
  COMPLETADA:  { label: 'Completada',  color: '#C8FF00', dot: '#C8FF00' },
  FALLIDA:     { label: 'Fallida',     color: '#FF2D78', dot: '#FF2D78' },
  CANCELADA:   { label: 'Cancelada',   color: '#888',    dot: '#555'    },
  REVERTIDA:   { label: 'Revertida',   color: '#00C8FF', dot: '#00C8FF' },
};

function tipoMeta(t) { return TIPO_META[String(t||'').toUpperCase()] || { label: t||'—', icon: Zap, color: '#888', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' }; }
function estadoMeta(e) { return ESTADO_META[String(e||'').toUpperCase()] || { label: e||'—', color: '#888', dot: '#555' }; }

const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
const fmtDate = d => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function buildErrors(form, billeteras) {
  const errors = {};
  const vt = form.valor.trim();
  const vn = Number(vt);
  const origin = billeteras.find(w => String(w.id) === String(form.billeteraOrigenId));
  if (!form.tipo) errors.tipo = 'Selecciona una operación.';
  if (!vt) errors.valor = 'El valor es obligatorio.';
  else if (!/^\d+(\.\d{1,2})?$/.test(vt)) errors.valor = 'Máximo 2 decimales.';
  else if (vn <= 0) errors.valor = 'Debe ser mayor a 0.';
  if ((form.tipo === 'RETIRO' || form.tipo === 'TRANSFERENCIA') && !form.billeteraOrigenId) errors.billeteraOrigenId = 'Selecciona billetera origen.';
  if ((form.tipo === 'RECARGA' || form.tipo === 'TRANSFERENCIA') && !form.billeteraDestinoId) errors.billeteraDestinoId = 'Selecciona billetera destino.';
  if (form.tipo === 'TRANSFERENCIA' && form.billeteraOrigenId && form.billeteraDestinoId && String(form.billeteraOrigenId) === String(form.billeteraDestinoId)) errors.billeteraDestinoId = 'La billetera destino debe ser distinta.';
  if (origin && (form.tipo === 'RETIRO' || form.tipo === 'TRANSFERENCIA') && !errors.valor && vn > Number(origin.saldo || 0)) errors.valor = 'Saldo insuficiente.';
  return errors;
}

/* ── Glitch title ── */
function GlitchText({ children }) {
  return <span className="tx-glitch" data-text={children}>{children}</span>;
}

/* ── Mini bar chart for wallet balances ── */
function BalanceBar({ saldo, max, color }) {
  const pct = max > 0 ? Math.max(2, (saldo / max) * 100) : 2;
  return (
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}` }} />
      </div>
  );
}

/* ── Wallet selector card ── */
function WalletCard({ wallet, selected, onClick, maxSaldo }) {
  const isActive = selected === String(wallet.id);
  return (
      <div className={`wx-card ${isActive ? 'wx-card-active' : ''}`} onClick={() => onClick(String(wallet.id))}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span className="wx-label">{wallet.nombre}</span>
          <Wallet size={13} color={isActive ? 'var(--acid)' : 'var(--muted)'} />
        </div>
        <div className="wx-saldo">{fmt.format(Number(wallet.saldo || 0))}</div>
        <BalanceBar saldo={Number(wallet.saldo || 0)} max={maxSaldo} color={isActive ? 'var(--acid)' : 'var(--sky)'} />
      </div>
  );
}

export default function Transacciones({ userId }) {
  const [usuario, setUsuario] = useState(null);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [revertingId, setRevertingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const billeterasQuery = useBilleteras(userId);
  const crearMutation = useCrearTransaccion();
  const revertirMutation = useRevertirTransaccion();

  const wallets = billeterasQuery.data?.billeteras || billeterasQuery.data || [];

  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) setSelectedWalletId(String(wallets[0].id));
  }, [wallets]);

  const transaccionesQuery = useTransacciones(selectedWalletId || null);
  const history = transaccionesQuery.data?.transacciones || transaccionesQuery.data || [];

  useEffect(() => {
    let active = true;
    obtenerUsuarioPorId(userId).then(r => { if (active) setUsuario(r || null); }).catch(() => { if (active) setUsuario(null); });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => { setErrors(buildErrors(form, wallets)); }, [form, wallets]);

  const maxSaldo = useMemo(() => Math.max(...wallets.map(w => Number(w.saldo || 0)), 1), [wallets]);
  const totalSaldo = useMemo(() => wallets.reduce((a, w) => a + Number(w.saldo || 0), 0), [wallets]);
  const totalTx = history.length;
  const completadas = history.filter(t => String(t.estado||'').toUpperCase() === 'COMPLETADA').length;
  const volumen = history.filter(t => String(t.estado||'').toUpperCase() === 'COMPLETADA').reduce((a, t) => a + Number(t.valor || 0), 0);

  const txTypeOptions = Array.from(new Set(history.map(t => t.tipo).filter(Boolean))).map(tipo => ({
    value: tipo, label: tipoMeta(tipo).label
  }));

  const filtered = history.filter(t => {
    if (filterType && t.tipo !== filterType) return false;
    if ((filterStart || filterEnd) && t.fecha) {
      const d = new Date(t.fecha);
      if (filterStart && d < new Date(`${filterStart}T00:00:00`)) return false;
      if (filterEnd && d > new Date(`${filterEnd}T23:59:59`)) return false;
    }
    return true;
  });

  const notificationAlerts = history
      .filter(t => String(t.estado||'').toLowerCase().includes('fall') || String(t.estado||'').toLowerCase().includes('rech'))
      .slice(0, 3)
      .map(t => ({
        id: `rech-${t.id}`,
        tipo: 'Transacción rechazada',
        mensaje: `La transacción ${tipoMeta(t.tipo).label} por ${fmt.format(Number(t.valor||0))} fue rechazada.`,
        fecha: t.fecha
      }));

  async function handleSubmit(event) {
    event.preventDefault();
    const errs = buildErrors(form, wallets);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const vn = Number(form.valor);
    let payload = {};
    if (form.tipo === 'RECARGA')       payload = { tipo: 'RECARGA', valor: vn, billeteraDestinoId: form.billeteraDestinoId };
    if (form.tipo === 'RETIRO')        payload = { tipo: 'RETIRO', valor: vn, billeteraOrigenId: form.billeteraOrigenId };
    if (form.tipo === 'TRANSFERENCIA') payload = { tipo: 'TRANSFERENCIA', valor: vn, billeteraOrigenId: form.billeteraOrigenId, billeteraDestinoId: form.billeteraDestinoId };
    try {
      setSuccess(''); setError('');
      await crearMutation.mutateAsync(payload);
      setSuccess('Operación realizada exitosamente.');
      setForm(INITIAL_FORM);
    } catch (e) { setError(e?.message || 'No fue posible ejecutar la transacción.'); }
  }

  async function handleRevert(id) {
    try {
      setRevertingId(id); setError(''); setSuccess('');
      await revertirMutation.mutateAsync(id);
      setSuccess('Transacción revertida exitosamente.');
    } catch (e) { setError(e?.message || 'No fue posible revertir.'); }
    finally { setRevertingId(null); }
  }

  const isLoading = billeterasQuery.isLoading || crearMutation.isPending;

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

        /* Root */
        .tx-root { font-family: var(--body); background: var(--void); min-height: 100vh; position: relative; overflow-x: hidden; color: var(--text); }

        /* Backgrounds */
        .tx-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 55% 45% at 5% 100%, rgba(200,255,0,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 100% 0%, rgba(0,200,255,0.045) 0%, transparent 55%),
            radial-gradient(ellipse 30% 30% at 60% 60%, rgba(255,45,120,0.025) 0%, transparent 65%);
        }
        .tx-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: linear-gradient(rgba(200,255,0,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(200,255,0,0.028) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .tx-noise {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* Glitch */
        .tx-glitch { position: relative; display: inline-block; }
        .tx-glitch::before, .tx-glitch::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; overflow: hidden; }
        .tx-glitch::before { color: var(--plasma); animation: g-top 5s infinite linear; }
        .tx-glitch::after  { color: var(--sky);    animation: g-bot 5s 0.7s infinite linear; }
        @keyframes g-top { 0%,82%,100%{clip:rect(0,900px,0,0);transform:none} 15%{clip:rect(0,900px,2px,0);transform:translateX(-2px)} 40%{clip:rect(0,900px,1px,0);transform:translateX(1px)} }
        @keyframes g-bot { 0%,82%,100%{clip:rect(0,900px,0,0);transform:none} 25%{clip:rect(28px,900px,36px,0);transform:translateX(2px)} 55%{clip:rect(14px,900px,20px,0);transform:translateX(-2px)} }

        /* Wrap */
        .tx-wrap { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.5rem; }

        /* Top bar */
        .tx-topbar {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          padding: 1.2rem 1.6rem; border-bottom: 1px solid var(--line-acid);
          background: rgba(0,0,0,0.4); backdrop-filter: blur(12px);
        }
        .tx-brand { display: flex; align-items: baseline; gap: 0.5rem; }
        .tx-brand-title { font-family: var(--head); font-size: 2.2rem; letter-spacing: 0.06em; color: var(--acid); line-height: 1; }
        .tx-brand-sub { font-family: var(--mono); font-size: 0.55rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.14em; border-left: 1px solid var(--line-acid); padding-left: 0.5rem; margin-left: 0.25rem; }
        .tx-status-pill { display: flex; align-items: center; gap: 0.4rem; font-family: var(--mono); font-size: 0.58rem; color: var(--acid2); text-transform: uppercase; letter-spacing: 0.1em; }
        .tx-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--acid2); box-shadow: 0 0 8px var(--acid2); animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }

        /* KPI strip */
        .tx-kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        @media (max-width: 900px) { .tx-kpi { grid-template-columns: repeat(2,1fr); } }

        .kpi-card { padding: 1.1rem 1.25rem; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; position: relative; overflow: hidden; transition: border-color 0.2s; }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .kpi-card.acid::before  { background: linear-gradient(90deg, var(--acid), transparent); }
        .kpi-card.plasma::before{ background: linear-gradient(90deg, var(--plasma), transparent); }
        .kpi-card.volt::before  { background: linear-gradient(90deg, var(--volt), transparent); }
        .kpi-card.sky::before   { background: linear-gradient(90deg, var(--sky), transparent); }
        .kpi-card:hover { border-color: var(--line-acid); }
        .kpi-lbl { font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem; }
        .kpi-val { font-family: var(--head); font-size: 1.8rem; letter-spacing: 0.04em; line-height: 1; }
        .kpi-sub { font-family: var(--mono); font-size: 0.56rem; color: var(--muted); margin-top: 0.3rem; }
        .kpi-card.acid .kpi-val  { color: var(--acid); }
        .kpi-card.plasma .kpi-val{ color: var(--plasma); }
        .kpi-card.volt .kpi-val  { color: var(--volt); }
        .kpi-card.sky .kpi-val   { color: var(--sky); }

        /* Layout */
        .tx-layout { display: grid; grid-template-columns: 340px 1fr; gap: 1.5rem; align-items: start; }
        @media (max-width: 1080px) { .tx-layout { grid-template-columns: 1fr; } }

        /* Panel */
        .tx-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
        .tx-panel-head { padding: 1rem 1.25rem; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; }
        .tx-panel-title { font-family: var(--head); font-size: 1.1rem; letter-spacing: 0.06em; color: var(--text); display: flex; align-items: center; gap: 0.4rem; }
        .tx-panel-badge { font-family: var(--mono); font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); padding: 0.15rem 0.5rem; border: 1px solid var(--line); border-radius: 4px; }

        /* Wallet cards */
        .wx-list { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; }
        .wx-card { padding: 0.85rem 1rem; background: rgba(0,0,0,0.3); border: 1px solid var(--line); border-radius: 8px; cursor: pointer; transition: all 0.15s; }
        .wx-card:hover { border-color: var(--line-acid); background: var(--surface-hover); }
        .wx-card-active { border-color: var(--line-acid) !important; background: rgba(200,255,0,0.05) !important; box-shadow: 0 0 16px rgba(200,255,0,0.06); }
        .wx-label { font-family: var(--mono); font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
        .wx-saldo { font-family: var(--head); font-size: 1.2rem; color: var(--text); letter-spacing: 0.04em; margin-top: 2px; }

        /* Form panel */
        .tx-form-wrap { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.9rem; }
        .tx-field { display: flex; flex-direction: column; gap: 0.3rem; }
        .tx-label { font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
        .tx-input {
          width: 100%; padding: 0.65rem 0.85rem;
          background: rgba(0,0,0,0.5); border: 1px solid var(--line);
          border-radius: 6px; color: var(--text); font-family: var(--mono); font-size: 0.76rem;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s; appearance: none;
        }
        .tx-input:focus { border-color: var(--line-acid); box-shadow: 0 0 0 3px rgba(200,255,0,0.05); }
        .tx-input.err { border-color: var(--plasma); }
        .tx-err { font-family: var(--mono); font-size: 0.57rem; color: var(--plasma); }

        /* Tipo buttons */
        .tx-tipo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .tx-tipo-btn {
          padding: 0.65rem 0.5rem; background: rgba(0,0,0,0.4); border: 1px solid var(--line);
          border-radius: 7px; cursor: pointer; transition: all 0.15s;
          display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
          font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--muted);
        }
        .tx-tipo-btn:hover { border-color: rgba(255,255,255,0.15); color: var(--text); }
        .tx-tipo-btn.active { border-color: var(--line-acid); background: rgba(200,255,0,0.06); color: var(--acid); }

        /* Submit */
        .tx-submit {
          width: 100%; padding: 0.85rem;
          background: var(--acid); border: none; border-radius: 7px;
          color: #000; font-family: var(--body); font-size: 0.78rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 0 20px rgba(200,255,0,0.2);
        }
        .tx-submit:hover { background: #d4ff00; box-shadow: 0 0 30px rgba(200,255,0,0.35); }
        .tx-submit:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Main right column */
        .tx-right { display: flex; flex-direction: column; gap: 1.25rem; }

        /* History table */
        .hx-table { width: 100%; border-collapse: collapse; }
        .hx-table thead tr { border-bottom: 1px solid var(--line); background: rgba(0,0,0,0.3); }
        .hx-table th { padding: 0.7rem 1rem; text-align: left; font-family: var(--mono); font-size: 0.52rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; }
        .hx-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.025); transition: background 0.12s; }
        .hx-table tbody tr:last-child { border-bottom: none; }
        .hx-table tbody tr:hover { background: var(--surface-hover); }
        .hx-table td { padding: 0.8rem 1rem; }

        .hx-tipo { display: inline-flex; align-items: center; gap: 0.35rem; font-family: var(--mono); font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.2rem 0.6rem; border-radius: 4px; border: 1px solid; }
        .hx-monto { font-family: var(--head); font-size: 1.1rem; letter-spacing: 0.04em; }
        .hx-estado { display: inline-flex; align-items: center; gap: 0.35rem; font-family: var(--mono); font-size: 0.58rem; }
        .hx-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .hx-date { font-family: var(--mono); font-size: 0.62rem; color: var(--muted); }
        .hx-empty { padding: 2.5rem; text-align: center; font-family: var(--mono); font-size: 0.63rem; color: var(--muted); }

        .hx-revert-btn {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.3rem 0.65rem; background: none; border: 1px solid var(--line);
          border-radius: 5px; cursor: pointer; color: var(--muted);
          font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase;
          letter-spacing: 0.06em; transition: all 0.15s;
        }
        .hx-revert-btn:hover { border-color: rgba(0,200,255,0.4); color: var(--sky); background: rgba(0,200,255,0.06); }
        .hx-revert-btn:disabled { opacity: 0.25; cursor: not-allowed; }

        /* Filter bar */
        .fx-bar { padding: 0.85rem 1.25rem; display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; border-bottom: 1px solid var(--line); background: rgba(0,0,0,0.2); }
        .fx-input { padding: 0.52rem 0.75rem; background: rgba(0,0,0,0.45); border: 1px solid var(--line); border-radius: 6px; color: var(--text); font-family: var(--mono); font-size: 0.65rem; outline: none; transition: border-color 0.15s; appearance: none; }
        .fx-input:focus { border-color: var(--line-acid); }

        /* Notifications / user panels */
        .tx-notif-item { padding: 0.85rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; flex-direction: column; gap: 0.3rem; }
        .tx-notif-item:last-child { border-bottom: none; }
        .tx-notif-tipo { font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--plasma); }
        .tx-notif-msg  { font-size: 0.8rem; color: var(--text); }
        .tx-notif-date { font-family: var(--mono); font-size: 0.55rem; color: var(--muted); }

        .filter-toggle-btn {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.45rem 0.8rem; background: none; border: 1px solid var(--line);
          border-radius: 6px; color: var(--muted); cursor: pointer;
          font-family: var(--mono); font-size: 0.6rem; text-transform: uppercase;
          letter-spacing: 0.07em; transition: all 0.15s;
        }
        .filter-toggle-btn.on { border-color: var(--line-acid); color: var(--acid); background: rgba(200,255,0,0.05); }
        .filter-toggle-btn:hover { border-color: var(--line-acid); color: var(--acid); }

        /* User card */
        .ux-user-card { padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem; }
        .ux-user-avatar { width: 42px; height: 42px; border-radius: 50%; background: rgba(200,255,0,0.1); border: 1px solid var(--line-acid); display: flex; align-items: center; justify-content: center; font-family: var(--head); font-size: 1.2rem; color: var(--acid); flex-shrink: 0; }
        .ux-user-name { font-size: 0.92rem; font-weight: 600; color: var(--text); }
        .ux-user-email { font-family: var(--mono); font-size: 0.6rem; color: var(--muted); margin-top: 2px; }

        .success-bar { background: rgba(200,255,0,0.08); border: 1px solid rgba(200,255,0,0.25); border-radius: 8px; padding: 0.7rem 1rem; display: flex; align-items: center; gap: 0.6rem; font-family: var(--mono); font-size: 0.65rem; color: var(--acid); }
        .error-bar   { background: rgba(255,45,120,0.08); border: 1px solid rgba(255,45,120,0.25); border-radius: 8px; padding: 0.7rem 1rem; display: flex; align-items: center; gap: 0.6rem; font-family: var(--mono); font-size: 0.65rem; color: var(--plasma); }
      `}</style>

        <div className="tx-root">
          <div className="tx-bg" />
          <div className="tx-grid" />
          <div className="tx-noise" />

          <div className="tx-wrap">

            {/* Top bar */}
            <div className="tx-topbar">
              <div className="tx-brand">
                <span className="tx-brand-title"><GlitchText>TRANSACCIONES</GlitchText></span>
                <span className="tx-brand-sub">Billeteras · Historial · Operaciones</span>
              </div>
              <div className="tx-status-pill">
                <span className="tx-status-dot" />
                Sistema activo
              </div>
            </div>

            {/* KPI strip */}
            <div className="tx-kpi">
              <div className="kpi-card acid">
                <div className="kpi-lbl"><Wallet size={11} /> Saldo total</div>
                <div className="kpi-val">{totalSaldo > 999999 ? (totalSaldo/1000000).toFixed(1)+'M' : fmt.format(totalSaldo).replace('$','')}</div>
                <div className="kpi-sub">{wallets.length} billeteras</div>
              </div>
              <div className="kpi-card plasma">
                <div className="kpi-lbl"><Activity size={11} /> Transacciones</div>
                <div className="kpi-val">{totalTx}</div>
                <div className="kpi-sub">en este historial</div>
              </div>
              <div className="kpi-card volt">
                <div className="kpi-lbl"><TrendingUp size={11} /> Completadas</div>
                <div className="kpi-val">{completadas}</div>
                <div className="kpi-sub">{totalTx ? Math.round((completadas/totalTx)*100) : 0}% tasa de éxito</div>
              </div>
              <div className="kpi-card sky">
                <div className="kpi-lbl"><Zap size={11} /> Volumen</div>
                <div className="kpi-val">{volumen > 999999 ? (volumen/1000000).toFixed(1)+'M' : volumen > 999 ? (volumen/1000).toFixed(0)+'K' : volumen}</div>
                <div className="kpi-sub">COP procesados</div>
              </div>
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><LoadingSpinner /></div>
            ) : (
                <div className="tx-layout">

                  {/* ── LEFT: Form + Wallets ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Billeteras */}
                    <div className="tx-panel">
                      <div className="tx-panel-head">
                        <span className="tx-panel-title"><Wallet size={14} color="var(--acid)" /> Billeteras</span>
                        <span className="tx-panel-badge">{wallets.length} cuentas</span>
                      </div>
                      <div className="wx-list">
                        {wallets.length ? wallets.map(w => (
                            <WalletCard key={w.id} wallet={w} selected={selectedWalletId} onClick={setSelectedWalletId} maxSaldo={maxSaldo} />
                        )) : <div style={{ padding: '1rem', fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--muted)' }}>Sin billeteras.</div>}
                      </div>
                    </div>

                    {/* Nueva transacción */}
                    <div className="tx-panel">
                      <div className="tx-panel-head">
                        <span className="tx-panel-title"><Zap size={14} color="var(--volt)" /> Nueva operación</span>
                      </div>
                      <div className="tx-form-wrap">

                        {success && <div className="success-bar"><Zap size={13} /> {success}</div>}
                        {error   && <div className="error-bar"><Activity size={13} /> {error}</div>}

                        {/* Tipo selector */}
                        <div className="tx-field">
                          <span className="tx-label">Tipo de operación</span>
                          <div className="tx-tipo-grid">
                            {Object.entries(TIPO_META).filter(([k]) => k !== 'PAGO_PROGRAMADO').map(([k, m]) => {
                              const Icon = m.icon;
                              return (
                                  <button key={k} type="button"
                                          className={`tx-tipo-btn ${form.tipo === k ? 'active' : ''}`}
                                          style={form.tipo === k ? { borderColor: m.border, background: m.bg, color: m.color } : {}}
                                          onClick={() => { setForm(c => ({...c, tipo: k})); setSuccess(''); setError(''); }}
                                  >
                                    <Icon size={14} color={form.tipo === k ? m.color : 'var(--muted)'} />
                                    {m.label}
                                  </button>
                              );
                            })}
                          </div>
                          {errors.tipo && <span className="tx-err">{errors.tipo}</span>}
                        </div>

                        {/* Billetera origen */}
                        {(form.tipo === 'RETIRO' || form.tipo === 'TRANSFERENCIA') && (
                            <div className="tx-field">
                              <span className="tx-label">Billetera origen</span>
                              <select className={`tx-input ${errors.billeteraOrigenId ? 'err' : ''}`} name="billeteraOrigenId" value={form.billeteraOrigenId} onChange={e => { setForm(c => ({...c, billeteraOrigenId: e.target.value})); setSuccess(''); setError(''); }}>
                                <option value="">Selecciona…</option>
                                {wallets.map(w => <option key={w.id} value={w.id}>{w.nombre} — {fmt.format(Number(w.saldo||0))}</option>)}
                              </select>
                              {errors.billeteraOrigenId && <span className="tx-err">{errors.billeteraOrigenId}</span>}
                            </div>
                        )}

                        {/* Billetera destino */}
                        {(form.tipo === 'RECARGA' || form.tipo === 'TRANSFERENCIA') && (
                            <div className="tx-field">
                              <span className="tx-label">Billetera destino</span>
                              <select className={`tx-input ${errors.billeteraDestinoId ? 'err' : ''}`} name="billeteraDestinoId" value={form.billeteraDestinoId} onChange={e => { setForm(c => ({...c, billeteraDestinoId: e.target.value})); setSuccess(''); setError(''); }}>
                                <option value="">Selecciona…</option>
                                {wallets.map(w => <option key={w.id} value={w.id}>{w.nombre} — {fmt.format(Number(w.saldo||0))}</option>)}
                              </select>
                              {errors.billeteraDestinoId && <span className="tx-err">{errors.billeteraDestinoId}</span>}
                            </div>
                        )}

                        {/* Valor */}
                        <div className="tx-field">
                          <span className="tx-label">Valor (COP)</span>
                          <input type="text" inputMode="decimal" placeholder="0.00" className={`tx-input ${errors.valor ? 'err' : ''}`} name="valor" value={form.valor} onChange={e => { setForm(c => ({...c, valor: e.target.value})); setSuccess(''); setError(''); }} />
                          {errors.valor && <span className="tx-err">{errors.valor}</span>}
                        </div>

                        <button className="tx-submit" onClick={handleSubmit} disabled={crearMutation.isPending || !form.tipo}>
                          {crearMutation.isPending ? 'Procesando…' : `Ejecutar ${form.tipo ? TIPO_META[form.tipo]?.label || '' : 'operación'} →`}
                        </button>
                      </div>
                    </div>

                    {/* Usuario */}
                    {usuario && (
                        <div className="tx-panel">
                          <div className="tx-panel-head">
                            <span className="tx-panel-title">Usuario</span>
                          </div>
                          <div className="ux-user-card">
                            <div className="ux-user-avatar">{(usuario.nombre||'U').charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="ux-user-name">{usuario.nombre}</div>
                              <div className="ux-user-email">{usuario.email}</div>
                            </div>
                          </div>
                        </div>
                    )}
                  </div>

                  {/* ── RIGHT: History + Ops + Notifs ── */}
                  <div className="tx-right">

                    {/* History */}
                    <div className="tx-panel">
                      <div className="tx-panel-head">
                        <span className="tx-panel-title"><Activity size={14} color="var(--sky)" /> Historial</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="tx-panel-badge">{filtered.length} movimientos</span>
                          <button className={`filter-toggle-btn ${showFilters ? 'on' : ''}`} onClick={() => setShowFilters(v => !v)}>
                            <Filter size={11} /> Filtros
                          </button>
                        </div>
                      </div>

                      {/* Filters */}
                      {showFilters && (
                          <div className="fx-bar">
                            <select className="fx-input" value={selectedWalletId} onChange={e => setSelectedWalletId(e.target.value)}>
                              {wallets.map(w => <option key={w.id} value={String(w.id)}>{w.nombre}</option>)}
                            </select>
                            <select className="fx-input" value={filterType} onChange={e => setFilterType(e.target.value)}>
                              <option value="">Todos los tipos</option>
                              {txTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <input type="date" className="fx-input" value={filterStart} onChange={e => setFilterStart(e.target.value)} title="Desde" />
                            <input type="date" className="fx-input" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} title="Hasta" />
                            {(filterType || filterStart || filterEnd) && (
                                <button className="filter-toggle-btn" onClick={() => { setFilterType(''); setFilterStart(''); setFilterEnd(''); }}>
                                  <X size={11} /> Limpiar
                                </button>
                            )}
                          </div>
                      )}

                      {transaccionesQuery.isLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem 0' }}><LoadingSpinner /></div>
                      ) : filtered.length ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="hx-table">
                              <thead>
                              <tr>
                                <th>Tipo</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th style={{ textAlign: 'right' }}>Acción</th>
                              </tr>
                              </thead>
                              <tbody>
                              {filtered.map(t => {
                                const tm = tipoMeta(t.tipo);
                                const em = estadoMeta(t.estado);
                                const Icon = tm.icon;
                                const canRevert = String(t.estado||'').toUpperCase() === 'COMPLETADA';
                                return (
                                    <tr key={t.id}>
                                      <td>
                                  <span className="hx-tipo" style={{ color: tm.color, borderColor: tm.border, background: tm.bg }}>
                                    <Icon size={11} /> {tm.label}
                                  </span>
                                      </td>
                                      <td>
                                  <span className="hx-monto" style={{ color: t.tipo === 'RETIRO' ? 'var(--plasma)' : t.tipo === 'RECARGA' ? 'var(--acid)' : 'var(--sky)' }}>
                                    {t.tipo === 'RETIRO' ? '-' : '+'}{fmt.format(Number(t.valor||0))}
                                  </span>
                                      </td>
                                      <td>
                                        <div className="hx-estado">
                                          <span className="hx-dot" style={{ background: em.dot, boxShadow: `0 0 5px ${em.dot}` }} />
                                          <span style={{ color: em.color, fontFamily: 'var(--mono)', fontSize: '0.6rem' }}>{em.label}</span>
                                        </div>
                                      </td>
                                      <td><span className="hx-date">{fmtDate(t.fecha)}</span></td>
                                      <td style={{ textAlign: 'right' }}>
                                        {canRevert ? (
                                            <button className="hx-revert-btn" onClick={() => handleRevert(t.id)} disabled={revertingId === t.id}>
                                              <RotateCcw size={11} /> {revertingId === t.id ? '…' : 'Revertir'}
                                            </button>
                                        ) : <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)' }}>—</span>}
                                      </td>
                                    </tr>
                                );
                              })}
                              </tbody>
                            </table>
                          </div>
                      ) : (
                          <div className="hx-empty">Sin transacciones para los filtros seleccionados.</div>
                      )}
                    </div>

                    {/* Operaciones programadas */}
                    <div className="tx-panel">
                      <div className="tx-panel-head">
                        <span className="tx-panel-title"><Clock size={14} color="var(--volt)" /> Operaciones programadas</span>
                        <span className="tx-panel-badge">Tiempo real</span>
                      </div>
                      <div style={{ padding: '1.5rem 1.25rem', fontFamily: 'var(--mono)', fontSize: '0.63rem', color: 'var(--muted)', textAlign: 'center', borderTop: '1px dashed rgba(255,255,255,0.05)' }}>
                        No hay operaciones programadas.
                      </div>
                    </div>

                    {/* Notificaciones */}
                    {notificationAlerts.length > 0 && (
                        <div className="tx-panel">
                          <div className="tx-panel-head">
                            <span className="tx-panel-title"><Bell size={14} color="var(--plasma)" /> Alertas</span>
                            <span className="tx-panel-badge" style={{ borderColor: 'rgba(255,45,120,0.25)', color: 'var(--plasma)' }}>{notificationAlerts.length}</span>
                          </div>
                          {notificationAlerts.map(a => (
                              <div key={a.id} className="tx-notif-item">
                                <span className="tx-notif-tipo">{a.tipo}</span>
                                <span className="tx-notif-msg">{a.mensaje}</span>
                                <span className="tx-notif-date">{fmtDate(a.fecha)}</span>
                              </div>
                          ))}
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