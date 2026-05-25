import { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, X,
  Zap, Users, TrendingUp, Shield, Award, Activity, Power, PowerOff,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import useUsuarios, {
  useUsuario, useCrearUsuario, useActualizarUsuario,
  useEliminarUsuario, useTopUsuariosPuntos, useToggleActivoUsuario,
} from '../hooks/useUsuarios';
import { useAuth } from '../auth/AuthContext';

const INITIAL_FORM = { nombre: '', email: '', telefono: '', contrasena: '', activo: true };

function normalizeUsers(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.usuarios)) return payload.usuarios;
  if (Array.isArray(payload.topUsuarios)) return payload.topUsuarios;
  if (payload.usuario) return [payload.usuario];
  return [];
}

function isValidEmail(email) { return /^\S+@\S+\.\S+$/.test(String(email || '').trim()); }
function isValidPhone(phone) { return /^[0-9+\s-]{7,15}$/.test(String(phone || '').trim()); }
function getPoints(u) {
  if (!u) return 0;
  return Number(u.puntosActuales ?? u.puntosAcumulados ?? u.puntos ?? u.recompensas?.puntosActuales ?? 0);
}
function levelLabel(nivel) { return String(nivel || '').toLowerCase().replace(/^./, c => c.toUpperCase()); }

const fmt = new Intl.NumberFormat('es-CO');

const NIVEL_META = {
  BRONCE:  { color: '#CD7F32', glow: 'rgba(205,127,50,0.5)',  bg: 'rgba(205,127,50,0.08)',  border: 'rgba(205,127,50,0.3)',  icon: '🥉', rank: 1 },
  PLATA:   { color: '#C0C0C0', glow: 'rgba(192,192,192,0.5)', bg: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.3)', icon: '🥈', rank: 2 },
  ORO:     { color: '#FFD700', glow: 'rgba(255,215,0,0.6)',   bg: 'rgba(255,215,0,0.08)',   border: 'rgba(255,215,0,0.3)',   icon: '🥇', rank: 3 },
  PLATINO: { color: '#A8D8EA', glow: 'rgba(168,216,234,0.6)', bg: 'rgba(168,216,234,0.08)', border: 'rgba(168,216,234,0.3)', icon: '💎', rank: 4 },
};
function nivelMeta(nivel) {
  return NIVEL_META[String(nivel || '').toUpperCase()] || {
    color: '#555', glow: 'transparent', bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)', icon: '·', rank: 0,
  };
}

function GlitchText({ children, className }) {
  return <span className={`glitch-text ${className || ''}`} data-text={children}>{children}</span>;
}

function HexAvatar({ name, nivel, size = 40 }) {
  const m = nivelMeta(nivel);
  const letter = (name || '?').charAt(0).toUpperCase();
  const gradId = `hg-${String(name || '').replace(/\s/g, '')}`;
  return (
      <svg width={size} height={size} viewBox="0 0 40 40">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={m.color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={m.color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill={`url(#${gradId})`} stroke={m.color} strokeWidth="1" />
        <text x="20" y="25" textAnchor="middle" fontFamily="'Bebas Neue', sans-serif" fontSize="16" fill={m.color}>{letter}</text>
      </svg>
  );
}

function Sparkline({ value, color }) {
  const pts = useMemo(() => {
    const arr = [];
    let v = 20;
    for (let i = 0; i < 12; i++) { v = Math.max(5, Math.min(35, v + (Math.random() - 0.4) * 8)); arr.push(v); }
    arr[arr.length - 1] = 10 + (value / 5000) * 25;
    return arr;
  }, [value]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / 11) * 80},${40 - p}`).join(' ');
  return (
      <svg width="80" height="40" viewBox="0 0 80 40" style={{ opacity: 0.7 }}>
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={(11 / 11) * 80} cy={40 - pts[pts.length - 1]} r="2.5" fill={color} />
      </svg>
  );
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
      <div className="stat-pill">
        <Icon size={14} color={color} />
        <div className="stat-pill-inner">
          <span className="stat-pill-val" style={{ color }}>{value}</span>
          <span className="stat-pill-lbl">{label}</span>
        </div>
      </div>
  );
}

export default function Usuarios() {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@ZiplocSAS.local' || user?.demo;
  const { usuarios: usuariosRaw, loading: usuariosLoading, error: usuariosError } = useUsuarios();
  const topUsuariosQuery = useTopUsuariosPuntos();

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [search, setSearch] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [sortField, setSortField] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');

  const createMut = useCrearUsuario();
  const updateMut = useActualizarUsuario();
  const deleteMut = useEliminarUsuario();
  const toggleActivoMut = useToggleActivoUsuario();
  const detailQuery = useUsuario(selectedUserId);

  const usuarios = useMemo(() => Array.isArray(usuariosRaw) ? usuariosRaw : [], [usuariosRaw]);
  const usuariosTop = useMemo(() => normalizeUsers(topUsuariosQuery.data), [topUsuariosQuery.data]);

  const totalPts = useMemo(() => usuarios.reduce((a, u) => a + getPoints(u), 0), [usuarios]);
  const activeCount = useMemo(() => usuarios.filter(u => u.activo).length, [usuarios]);
  const platCount = useMemo(() => usuarios.filter(u => String(u.nivel || '').toUpperCase() === 'PLATINO').length, [usuarios]);

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let arr = usuarios.filter(u => {
      if (term && ![u.nombre, u.email, u.telefono].some(v => String(v || '').toLowerCase().includes(term))) return false;
      if (nivelFilter && String(u.nivel || '').toUpperCase() !== nivelFilter) return false;
      if (estadoFilter && (estadoFilter === 'ACTIVO' ? !u.activo : u.activo)) return false;
      return true;
    });
    arr = [...arr].sort((a, b) => {
      let va, vb;
      if (sortField === 'puntos') { va = getPoints(a); vb = getPoints(b); }
      else { va = String(a[sortField] || '').toLowerCase(); vb = String(b[sortField] || '').toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [usuarios, search, nivelFilter, estadoFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [search, nivelFilter, estadoFilter, pageSize]);
  useEffect(() => {
    if (modalMode === 'edit' && selectedUserId) {
      const t = usuarios.find(u => u.id === selectedUserId);
      if (t) setForm({ nombre: t.nombre || '', email: t.email || '', telefono: t.telefono || '', contrasena: '', activo: !!t.activo });
    }
  }, [modalMode, selectedUserId, usuarios]);

  const loading = usuariosLoading || topUsuariosQuery.isLoading;
  const error = usuariosError || topUsuariosQuery.error || createMut.error || updateMut.error || deleteMut.error || detailQuery.error || toggleActivoMut.error;

  function validate() {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'Nombre obligatorio.';
    if (!form.email.trim()) e.email = 'Email obligatorio.';
    else if (!isValidEmail(form.email)) e.email = 'Formato inválido.';
    if (!form.telefono.trim()) e.telefono = 'Teléfono obligatorio.';
    else if (!isValidPhone(form.telefono)) e.telefono = 'Formato inválido.';
    if (modalMode === 'create' && (!form.contrasena || form.contrasena.length < 6)) e.contrasena = 'Mínimo 6 caracteres.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    const payload = {
      nombre: form.nombre.trim(), email: form.email.trim(), telefono: form.telefono.trim(),
      ...(modalMode === 'create' && form.contrasena ? { contrasena: form.contrasena } : {}),
    };
    try {
      if (modalMode === 'edit') await updateMut.mutateAsync({ id: selectedUserId, payload });
      else await createMut.mutateAsync(payload);
      closeModal();
    } catch {}
  }

  function handleToggleActivo(u, e) {
    e.stopPropagation();
    toggleActivoMut.mutate({ id: u.id, activo: !u.activo });
  }

  function openCreate() { setModalMode('create'); setForm(INITIAL_FORM); setFormErrors({}); }
  function openEdit(u) { setSelectedUserId(u.id); setModalMode('edit'); setFormErrors({}); }
  function openDetail(u) { setSelectedUserId(u.id); setModalMode('detail'); }
  function closeModal() { setModalMode(null); setSelectedUserId(null); setForm(INITIAL_FORM); setFormErrors({}); }
  function handleDelete(u) { if (!window.confirm(`¿Eliminar a ${u.nombre}?`)) return; deleteMut.mutate(u.id); }

  const topFive = usuariosTop.slice(0, 5);
  const detailUser = modalMode === 'detail' && selectedUserId
      ? (detailQuery.data?.usuario || detailQuery.data || usuarios.find(u => u.id === selectedUserId))
      : null;

  const SortIcon = ({ field }) => (
      <span style={{ opacity: sortField === field ? 1 : 0.3, fontSize: '0.6rem', marginLeft: 2 }}>
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');

        :root {
          --acid: #C8FF00; --acid2: #00FFA3; --plasma: #FF2D78;
          --volt: #FFE500; --sky: #00C8FF; --void: #08080F;
          --surface: rgba(255,255,255,0.022); --surface-hover: rgba(200,255,0,0.04);
          --line: rgba(255,255,255,0.06); --line-acid: rgba(200,255,0,0.2);
          --text: #F0F0F0; --muted: rgba(255,255,255,0.32); --faint: rgba(255,255,255,0.08);
          --mono: 'DM Mono', monospace; --head: 'Bebas Neue', sans-serif; --body: 'Syne', sans-serif;
        }

        .ux { font-family: var(--body); background: var(--void); min-height: 100vh; position: relative; overflow-x: hidden; }

        .ux-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 40% at 10% 0%, rgba(200,255,0,0.055) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 95% 100%, rgba(0,200,255,0.04) 0%, transparent 50%),
            radial-gradient(ellipse 30% 30% at 50% 50%, rgba(255,45,120,0.02) 0%, transparent 70%);
        }
        .ux-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: linear-gradient(rgba(200,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(200,255,0,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .ux-noise {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }
        .ux-wrap { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.5rem; }

        .glitch-text { position: relative; display: inline-block; }
        .glitch-text::before, .glitch-text::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; overflow: hidden; }
        .glitch-text::before { color: var(--plasma); clip: rect(0,900px,0,0); animation: glitch-top 4s infinite linear alternate-reverse; }
        .glitch-text::after  { color: var(--sky);    clip: rect(0,900px,0,0); animation: glitch-bot 4s 0.5s infinite linear alternate-reverse; }
        @keyframes glitch-top {
          0%,80%,100% { clip: rect(0,900px,0,0); transform: none; }
          10% { clip: rect(0,900px,3px,0); transform: translateX(-2px); }
          30% { clip: rect(0,900px,1px,0); transform: translateX(1px); }
          60% { clip: rect(0,900px,4px,0); transform: translateX(-1px); }
        }
        @keyframes glitch-bot {
          0%,80%,100% { clip: rect(0,900px,0,0); transform: none; }
          20% { clip: rect(30px,900px,40px,0); transform: translateX(2px); }
          50% { clip: rect(20px,900px,28px,0); transform: translateX(-2px); }
          70% { clip: rect(10px,900px,16px,0); transform: translateX(1px); }
        }

        .ux-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.2rem 1.6rem; gap: 1rem;
          border-bottom: 1px solid var(--line-acid);
          background: rgba(0,0,0,0.4); backdrop-filter: blur(12px);
        }
        .ux-brand { display: flex; align-items: baseline; gap: 0.5rem; }
        .ux-brand-title { font-family: var(--head); font-size: 2.2rem; letter-spacing: 0.06em; color: var(--acid); line-height: 1; }
        .ux-brand-sub {
          font-family: var(--mono); font-size: 0.55rem; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.14em;
          border-left: 1px solid var(--line-acid); padding-left: 0.5rem; margin-left: 0.25rem;
        }
        .ux-topbar-right { display: flex; align-items: center; gap: 0.75rem; }
        .ux-view-toggle { display: flex; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
        .ux-view-btn {
          padding: 0.45rem 0.75rem; background: none; border: none; cursor: pointer;
          font-family: var(--mono); font-size: 0.6rem; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.08em; transition: all 0.15s;
        }
        .ux-view-btn.active { background: rgba(200,255,0,0.1); color: var(--acid); }
        .ux-view-btn:hover:not(.active) { color: var(--text); }
        .ux-btn-create {
          display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem;
          background: var(--acid); border: none; border-radius: 6px;
          color: #000; font-family: var(--body); font-size: 0.75rem; font-weight: 700;
          letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 0 20px rgba(200,255,0,0.25);
        }
        .ux-btn-create:hover { background: #d4ff00; box-shadow: 0 0 30px rgba(200,255,0,0.4); transform: translateY(-1px); }

        .ux-kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        @media (max-width: 900px) { .ux-kpi { grid-template-columns: repeat(2,1fr); } }
        .kpi-card {
          padding: 1.1rem 1.25rem; background: var(--surface); border: 1px solid var(--line);
          border-radius: 10px; position: relative; overflow: hidden; transition: border-color 0.2s;
        }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .kpi-card.acid::before   { background: linear-gradient(90deg, var(--acid), transparent); }
        .kpi-card.plasma::before { background: linear-gradient(90deg, var(--plasma), transparent); }
        .kpi-card.volt::before   { background: linear-gradient(90deg, var(--volt), transparent); }
        .kpi-card.sky::before    { background: linear-gradient(90deg, var(--sky), transparent); }
        .kpi-card:hover { border-color: var(--line-acid); }
        .kpi-label { font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem; }
        .kpi-value { font-family: var(--head); font-size: 2rem; letter-spacing: 0.04em; line-height: 1; }
        .kpi-card.acid   .kpi-value { color: var(--acid); }
        .kpi-card.plasma .kpi-value { color: var(--plasma); }
        .kpi-card.volt   .kpi-value { color: var(--volt); }
        .kpi-card.sky    .kpi-value { color: var(--sky); }
        .kpi-sub { font-family: var(--mono); font-size: 0.58rem; color: var(--muted); margin-top: 0.3rem; }

        .ux-layout { display: grid; grid-template-columns: 1fr 300px; gap: 1.25rem; }
        @media (max-width: 1050px) { .ux-layout { grid-template-columns: 1fr; } }

        .ux-main { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
        .ux-toolbar {
          padding: 1rem 1.25rem; display: flex; gap: 0.75rem; flex-wrap: wrap;
          border-bottom: 1px solid var(--line); background: rgba(0,0,0,0.2); align-items: center;
        }
        .ux-search-wrap { position: relative; flex: 1; min-width: 200px; }
        .ux-search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--muted); }
        .ux-input {
          width: 100%; padding: 0.6rem 0.85rem 0.6rem 2.2rem;
          background: rgba(0,0,0,0.4); border: 1px solid var(--line);
          border-radius: 6px; color: var(--text); font-family: var(--mono); font-size: 0.72rem;
          outline: none; transition: border-color 0.15s;
        }
        .ux-input:focus { border-color: var(--line-acid); }
        .ux-input::placeholder { color: var(--muted); }
        .ux-select {
          padding: 0.6rem 0.85rem; background: rgba(0,0,0,0.4); border: 1px solid var(--line);
          border-radius: 6px; color: var(--text); font-family: var(--mono); font-size: 0.68rem;
          outline: none; appearance: none; cursor: pointer; transition: border-color 0.15s;
        }
        .ux-select:focus { border-color: var(--line-acid); }

        .ux-table { width: 100%; border-collapse: collapse; }
        .ux-table thead tr { border-bottom: 1px solid var(--line); background: rgba(0,0,0,0.3); }
        .ux-table th {
          padding: 0.75rem 1rem; text-align: left; font-family: var(--mono); font-size: 0.55rem;
          text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap;
          cursor: pointer; user-select: none; transition: color 0.15s;
        }
        .ux-table th:hover { color: var(--acid); }
        .ux-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.025); transition: background 0.12s; cursor: pointer;
        }
        .ux-table tbody tr:last-child { border-bottom: none; }
        .ux-table tbody tr:hover { background: var(--surface-hover); }
        .ux-table tbody tr.row-hovered td:first-child { border-left: 2px solid var(--acid); }
        .ux-table td { padding: 0.8rem 1rem; }

        .td-name-main { font-size: 0.88rem; font-weight: 600; color: var(--text); letter-spacing: 0.01em; }
        .td-name-id   { font-family: var(--mono); font-size: 0.55rem; color: var(--faint); margin-top: 2px; }
        .td-mono      { font-family: var(--mono); font-size: 0.7rem; color: var(--muted); }
        .td-pts       { font-family: var(--head); font-size: 1.25rem; color: var(--acid); letter-spacing: 0.04em; }

        .nivel-chip {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-family: var(--mono); font-size: 0.55rem; text-transform: uppercase;
          letter-spacing: 0.07em; padding: 0.18rem 0.55rem;
          border-radius: 4px; border: 1px solid; white-space: nowrap; font-weight: 500;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .status-row { display: flex; align-items: center; gap: 0.4rem; }
        .status-label { font-family: var(--mono); font-size: 0.6rem; }

        .ux-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; padding: 1.25rem; }
        .user-card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 10px; padding: 1.1rem; position: relative; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; cursor: pointer;
        }
        .user-card:hover { border-color: var(--line-acid); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(200,255,0,0.06); }
        .uc-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.85rem; }
        .uc-info { flex: 1; min-width: 0; }
        .uc-name  { font-size: 0.88rem; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .uc-email { font-family: var(--mono); font-size: 0.58rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .uc-pts       { font-family: var(--head); font-size: 1.6rem; color: var(--acid); letter-spacing: 0.04em; }
        .uc-pts-label { font-family: var(--mono); font-size: 0.52rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .uc-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--line); }
        .uc-actions { display: flex; gap: 0.35rem; }
        .uc-btn {
          padding: 0.3rem; background: none; border: 1px solid var(--line);
          border-radius: 5px; cursor: pointer; color: var(--muted);
          transition: all 0.15s; display: flex; align-items: center;
        }
        .uc-btn.v:hover    { border-color: rgba(200,255,0,0.4);   color: var(--acid);   background: rgba(200,255,0,0.06); }
        .uc-btn.e:hover    { border-color: rgba(0,200,255,0.4);   color: var(--sky);    background: rgba(0,200,255,0.06); }
        .uc-btn.d:hover    { border-color: rgba(255,45,120,0.4);  color: var(--plasma); background: rgba(255,45,120,0.06); }
        .uc-btn.act:hover  { border-color: rgba(0,255,163,0.4);   color: var(--acid2);  background: rgba(0,255,163,0.06); }
        .uc-btn.deact:hover{ border-color: rgba(255,200,0,0.4);   color: var(--volt);   background: rgba(255,200,0,0.06); }

        .row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.35rem; }
        .row-btn {
          padding: 0.32rem; background: none; border: 1px solid var(--line);
          border-radius: 5px; cursor: pointer; color: var(--muted);
          transition: all 0.12s; display: flex; align-items: center; justify-content: center;
        }
        .row-btn.v:hover    { border-color: rgba(200,255,0,0.4);  color: var(--acid); }
        .row-btn.e:hover    { border-color: rgba(0,200,255,0.4);  color: var(--sky); }
        .row-btn.d:hover    { border-color: rgba(255,45,120,0.4); color: var(--plasma); }
        .row-btn.act:hover  { border-color: rgba(0,255,163,0.4);  color: var(--acid2); }
        .row-btn.deact:hover{ border-color: rgba(255,200,0,0.4);  color: var(--volt); }
        .row-btn:disabled { opacity: 0.25; cursor: not-allowed; }

        .ux-pager {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.9rem 1.25rem; border-top: 1px solid var(--line); flex-wrap: wrap; gap: 0.75rem;
        }
        .pager-info { font-family: var(--mono); font-size: 0.58rem; color: var(--muted); }
        .pager-btns { display: flex; gap: 0.4rem; }
        .pager-btn {
          display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem;
          background: none; border: 1px solid var(--line); border-radius: 5px;
          color: var(--muted); font-family: var(--mono); font-size: 0.6rem; cursor: pointer; transition: all 0.15s;
        }
        .pager-btn:hover:not(:disabled) { border-color: var(--line-acid); color: var(--acid); }
        .pager-btn:disabled { opacity: 0.25; cursor: not-allowed; }

        .ux-aside { display: flex; flex-direction: column; gap: 1rem; }
        .aside-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
        .aside-head {
          padding: 0.85rem 1.1rem; border-bottom: 1px solid var(--line);
          display: flex; align-items: center; justify-content: space-between;
        }
        .aside-title { font-family: var(--head); font-size: 1rem; letter-spacing: 0.06em; color: var(--text); display: flex; align-items: center; gap: 0.4rem; }
        .aside-badge {
          font-family: var(--mono); font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--muted); padding: 0.15rem 0.5rem; border: 1px solid var(--line); border-radius: 4px;
        }
        .top-entry {
          padding: 0.8rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.03);
          display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: background 0.12s;
        }
        .top-entry:last-child { border-bottom: none; }
        .top-entry:hover { background: var(--surface-hover); }
        .top-rank { font-family: var(--head); font-size: 1.4rem; color: var(--muted); width: 26px; text-align: center; }
        .top-rank.one   { color: var(--volt); }
        .top-rank.two   { color: #C0C0C0; }
        .top-rank.three { color: #CD7F32; }
        .top-info { flex: 1; min-width: 0; }
        .top-name  { font-size: 0.82rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .top-email { font-family: var(--mono); font-size: 0.56rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .top-pts   { font-family: var(--head); font-size: 1rem; color: var(--acid); white-space: nowrap; }

        .stat-pill { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1.1rem; border-bottom: 1px solid var(--line); }
        .stat-pill:last-child { border-bottom: none; }
        .stat-pill-inner { display: flex; flex-direction: column; }
        .stat-pill-val { font-family: var(--head); font-size: 1.1rem; letter-spacing: 0.04em; line-height: 1; }
        .stat-pill-lbl { font-family: var(--mono); font-size: 0.52rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-top: 2px; }

        .dist-bar { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .dist-row { display: flex; align-items: center; gap: 0.5rem; }
        .dist-label { font-family: var(--mono); font-size: 0.57rem; text-transform: uppercase; letter-spacing: 0.07em; width: 52px; }
        .dist-track { flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
        .dist-fill  { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
        .dist-count { font-family: var(--mono); font-size: 0.57rem; color: var(--muted); width: 20px; text-align: right; }

        .ux-overlay {
          position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .ux-modal {
          background: #0C0C14; border: 1px solid var(--line-acid); border-radius: 14px;
          width: 100%; max-width: 500px; overflow: hidden;
          box-shadow: 0 0 80px rgba(200,255,0,0.08), 0 0 0 1px rgba(200,255,0,0.04);
          animation: modal-in 0.18s ease;
        }
        @keyframes modal-in { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: none; } }
        .modal-head {
          padding: 1.1rem 1.3rem; border-bottom: 1px solid var(--line);
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(200,255,0,0.03);
        }
        .modal-title { font-family: var(--head); font-size: 1.2rem; letter-spacing: 0.06em; color: var(--acid); }
        .modal-close {
          background: none; border: 1px solid var(--line); border-radius: 6px;
          color: var(--muted); padding: 0.28rem; cursor: pointer; transition: all 0.15s; display: flex;
        }
        .modal-close:hover { border-color: var(--plasma); color: var(--plasma); }
        .modal-body { padding: 1.3rem; display: flex; flex-direction: column; gap: 1rem; }
        .mfield { display: flex; flex-direction: column; gap: 0.3rem; }
        .mlabel { font-family: var(--mono); font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
        .minput {
          width: 100%; padding: 0.68rem 0.85rem; background: rgba(0,0,0,0.5); border: 1px solid var(--line);
          border-radius: 6px; color: var(--text); font-family: var(--mono); font-size: 0.76rem;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .minput:focus { border-color: var(--line-acid); box-shadow: 0 0 0 3px rgba(200,255,0,0.05); }
        .minput.err { border-color: var(--plasma); }
        .merr { font-family: var(--mono); font-size: 0.57rem; color: var(--plasma); }
        .msubmit {
          width: 100%; padding: 0.85rem; background: var(--acid); border: none; border-radius: 7px;
          color: #000; font-family: var(--body); font-size: 0.78rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em; cursor: pointer; transition: all 0.2s;
          margin-top: 0.2rem; box-shadow: 0 0 20px rgba(200,255,0,0.2);
        }
        .msubmit:hover { background: #d4ff00; }
        .msubmit:disabled { opacity: 0.4; cursor: not-allowed; }

        .detail-hero { padding: 1.3rem; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid var(--line); }
        .detail-hero-info { flex: 1; }
        .detail-hero-name { font-family: var(--head); font-size: 1.5rem; color: var(--text); letter-spacing: 0.04em; }
        .detail-hero-id   { font-family: var(--mono); font-size: 0.56rem; color: var(--muted); margin-top: 2px; }
        .detail-pts-big   { font-family: var(--head); font-size: 2.5rem; color: var(--acid); line-height: 1; }
        .detail-pts-label { font-family: var(--mono); font-size: 0.52rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1.3rem; }
        .detail-field { display: flex; flex-direction: column; gap: 0.25rem; }
        .detail-flabel { font-family: var(--mono); font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
        .detail-fvalue { font-size: 0.85rem; color: var(--text); word-break: break-all; }

        .ux-empty { padding: 2.5rem; text-align: center; font-family: var(--mono); font-size: 0.65rem; color: var(--muted); }
      `}</style>

        <div className="ux">
          <div className="ux-bg" />
          <div className="ux-grid" />
          <div className="ux-noise" />

          {error && (
              <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99 }}>
                <AlertaPanel type="error" title="Error" message={error?.message || 'Error inesperado'} />
              </div>
          )}

          <div className="ux-wrap">

            {/* Top bar */}
            <div className="ux-topbar">
              <div className="ux-brand">
                <span className="ux-brand-title"><GlitchText>USUARIOS</GlitchText></span>
                <span className="ux-brand-sub">Sistema de gestión · Puntos &amp; Niveles</span>
              </div>
              <div className="ux-topbar-right">
                <div className="ux-view-toggle">
                  <button className={`ux-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>TABLE</button>
                  <button className={`ux-view-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')}>CARDS</button>
                </div>
                {isDemoUser && (
                    <button className="ux-btn-create" onClick={openCreate}>
                      <Plus size={14} /> Nuevo usuario
                    </button>
                )}
              </div>
            </div>

            {/* KPI Strip */}
            <div className="ux-kpi">
              <div className="kpi-card acid">
                <div className="kpi-label"><Users size={11} /> Total usuarios</div>
                <div className="kpi-value">{loading ? '—' : usuarios.length}</div>
                <div className="kpi-sub">en el sistema</div>
              </div>
              <div className="kpi-card plasma">
                <div className="kpi-label"><Activity size={11} /> Activos</div>
                <div className="kpi-value">{loading ? '—' : activeCount}</div>
                <div className="kpi-sub">{loading ? '' : `${Math.round((activeCount / Math.max(1, usuarios.length)) * 100)}% del total`}</div>
              </div>
              <div className="kpi-card volt">
                <div className="kpi-label"><Zap size={11} /> Puntos totales</div>
                <div className="kpi-value">{loading ? '—' : totalPts > 999 ? (totalPts / 1000).toFixed(1) + 'K' : totalPts}</div>
                <div className="kpi-sub">acumulados</div>
              </div>
              <div className="kpi-card sky">
                <div className="kpi-label"><Shield size={11} /> Nivel Platino</div>
                <div className="kpi-value">{loading ? '—' : platCount}</div>
                <div className="kpi-sub">usuarios élite</div>
              </div>
            </div>

            {/* Main layout */}
            <div className="ux-layout">

              {/* Main panel */}
              <div className="ux-main">
                <div className="ux-toolbar">
                  <div className="ux-search-wrap">
                    <Search size={13} className="ux-search-icon" />
                    <input className="ux-input" placeholder="Buscar nombre, email, teléfono…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <select className="ux-select" value={nivelFilter} onChange={e => setNivelFilter(e.target.value)}>
                    <option value="">Todos los niveles</option>
                    <option value="BRONCE">Bronce</option>
                    <option value="PLATA">Plata</option>
                    <option value="ORO">Oro</option>
                    <option value="PLATINO">Platino</option>
                  </select>
                  <select className="ux-select" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                  <select className="ux-select" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                    <option value={5}>5 / pág</option>
                    <option value={10}>10 / pág</option>
                    <option value={20}>20 / pág</option>
                  </select>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                  {filtered.length} resultados
                </span>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><LoadingSpinner /></div>
                ) : viewMode === 'table' ? (
                    paged.length ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="ux-table">
                            <thead>
                            <tr>
                              <th onClick={() => toggleSort('nombre')}>Nombre <SortIcon field="nombre" /></th>
                              <th onClick={() => toggleSort('email')}>Email <SortIcon field="email" /></th>
                              <th>Teléfono</th>
                              <th onClick={() => toggleSort('puntos')}>Puntos <SortIcon field="puntos" /></th>
                              <th onClick={() => toggleSort('nivel')}>Nivel <SortIcon field="nivel" /></th>
                              <th>Estado</th>
                              <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paged.map(u => {
                              const m = nivelMeta(u.nivel);
                              return (
                                  <tr
                                      key={u.id}
                                      className={hoveredRow === u.id ? 'row-hovered' : ''}
                                      onMouseEnter={() => setHoveredRow(u.id)}
                                      onMouseLeave={() => setHoveredRow(null)}
                                  >
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <HexAvatar name={u.nombre} nivel={u.nivel} size={34} />
                                        <div>
                                          <div className="td-name-main">{u.nombre}</div>
                                          <div className="td-name-id">{String(u.id).slice(0, 10)}…</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td><span className="td-mono">{u.email}</span></td>
                                    <td><span className="td-mono">{u.telefono}</span></td>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className="td-pts">{fmt.format(getPoints(u))}</span>
                                        <Sparkline value={getPoints(u)} color={m.color} />
                                      </div>
                                    </td>
                                    <td>
                                <span className="nivel-chip" style={{ color: m.color, borderColor: m.border, background: m.bg }}>
                                  {m.icon} {levelLabel(u.nivel) || '—'}
                                </span>
                                    </td>
                                    <td>
                                      <div className="status-row">
                                  <span className="status-dot" style={{
                                    background: u.activo ? 'var(--acid2)' : '#444',
                                    boxShadow: u.activo ? '0 0 6px rgba(0,255,163,0.5)' : 'none',
                                  }} />
                                        <span className="status-label" style={{ color: u.activo ? 'rgba(0,255,163,0.7)' : 'var(--muted)' }}>
                                    {u.activo ? 'Activo' : 'Inactivo'}
                                  </span>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="row-actions">
                                        <button className="row-btn v" onClick={() => openDetail(u)} title="Ver"><Eye size={13} /></button>
                                        <button className="row-btn e" onClick={() => openEdit(u)} title="Editar"><Pencil size={13} /></button>
                                        {/* ← BOTÓN TOGGLE ACTIVO */}
                                        <button
                                            className={`row-btn ${u.activo ? 'deact' : 'act'}`}
                                            onClick={e => handleToggleActivo(u, e)}
                                            disabled={toggleActivoMut.isPending}
                                            title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                                        >
                                          {u.activo ? <PowerOff size={13} /> : <Power size={13} />}
                                        </button>
                                        <button className="row-btn d" onClick={() => handleDelete(u)} disabled={deleteMut.isPending} title="Eliminar"><Trash2 size={13} /></button>
                                      </div>
                                    </td>
                                  </tr>
                              );
                            })}
                            </tbody>
                          </table>
                        </div>
                    ) : <div className="ux-empty">Sin usuarios para los filtros seleccionados.</div>
                ) : (
                    paged.length ? (
                        <div className="ux-cards">
                          {paged.map(u => {
                            const m = nivelMeta(u.nivel);
                            return (
                                <div key={u.id} className="user-card" onClick={() => openDetail(u)}>
                                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${m.color}, transparent)` }} />
                                  <div className="uc-header">
                                    <HexAvatar name={u.nombre} nivel={u.nivel} size={42} />
                                    <div className="uc-info">
                                      <div className="uc-name">{u.nombre}</div>
                                      <div className="uc-email">{u.email}</div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                    <div>
                                      <div className="uc-pts">{fmt.format(getPoints(u))}</div>
                                      <div className="uc-pts-label">puntos</div>
                                    </div>
                                    <Sparkline value={getPoints(u)} color={m.color} />
                                  </div>
                                  <div className="uc-footer">
                            <span className="nivel-chip" style={{ color: m.color, borderColor: m.border, background: m.bg, fontSize: '0.52rem' }}>
                              {m.icon} {levelLabel(u.nivel) || '—'}
                            </span>
                                    <div className="uc-actions" onClick={e => e.stopPropagation()}>
                                      <button className="uc-btn v" onClick={() => openDetail(u)}><Eye size={12} /></button>
                                      <button className="uc-btn e" onClick={() => openEdit(u)}><Pencil size={12} /></button>
                                      {/* ← BOTÓN TOGGLE ACTIVO EN CARDS */}
                                      <button
                                          className={`uc-btn ${u.activo ? 'deact' : 'act'}`}
                                          onClick={e => handleToggleActivo(u, e)}
                                          disabled={toggleActivoMut.isPending}
                                          title={u.activo ? 'Desactivar' : 'Activar'}
                                      >
                                        {u.activo ? <PowerOff size={12} /> : <Power size={12} />}
                                      </button>
                                      <button className="uc-btn d" onClick={() => handleDelete(u)} disabled={deleteMut.isPending}><Trash2 size={12} /></button>
                                    </div>
                                  </div>
                                </div>
                            );
                          })}
                        </div>
                    ) : <div className="ux-empty">Sin usuarios para los filtros seleccionados.</div>
                )}

                <div className="ux-pager">
                  <span className="pager-info">Pág {safePage} de {totalPages} · {filtered.length} usuarios</span>
                  <div className="pager-btns">
                    <button className="pager-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}><ChevronLeft size={12} /> Prev</button>
                    <button className="pager-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>Next <ChevronRight size={12} /></button>
                  </div>
                </div>
              </div>

              {/* Aside */}
              <aside className="ux-aside">
                <div className="aside-panel">
                  <div className="aside-head">
                    <span className="aside-title"><Award size={14} color="var(--volt)" /> TOP 5</span>
                    <span className="aside-badge">Puntos</span>
                  </div>
                  {topFive.length ? topFive.map((u, i) => {
                    const m = nivelMeta(u.nivel);
                    return (
                        <div key={u.id} className="top-entry" onClick={() => openDetail(u)}>
                          <span className={`top-rank ${i === 0 ? 'one' : i === 1 ? 'two' : i === 2 ? 'three' : ''}`}>{i + 1}</span>
                          <div className="top-info">
                            <div className="top-name">{u.nombre}</div>
                            <div className="top-email">{u.email}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <span className="top-pts">{fmt.format(getPoints(u))}</span>
                            <span className="nivel-chip" style={{ color: m.color, borderColor: m.border, background: m.bg, fontSize: '0.48rem' }}>{m.icon} {levelLabel(u.nivel)}</span>
                          </div>
                        </div>
                    );
                  }) : <div className="ux-empty">Sin datos.</div>}
                </div>

                <div className="aside-panel">
                  <div className="aside-head">
                    <span className="aside-title"><TrendingUp size={14} color="var(--sky)" /> Distribución</span>
                  </div>
                  <div className="dist-bar">
                    {['PLATINO', 'ORO', 'PLATA', 'BRONCE'].map(nv => {
                      const m = nivelMeta(nv);
                      const count = usuarios.filter(u => String(u.nivel || '').toUpperCase() === nv).length;
                      const pct = usuarios.length ? (count / usuarios.length) * 100 : 0;
                      return (
                          <div key={nv} className="dist-row">
                            <span className="dist-label" style={{ color: m.color, fontSize: '0.54rem', fontFamily: 'var(--mono)' }}>{nv.slice(0, 3)}</span>
                            <div className="dist-track">
                              <div className="dist-fill" style={{ width: `${pct}%`, background: m.color, boxShadow: `0 0 6px ${m.glow}` }} />
                            </div>
                            <span className="dist-count">{count}</span>
                          </div>
                      );
                    })}
                  </div>
                </div>

                <div className="aside-panel">
                  <div className="aside-head">
                    <span className="aside-title"><Zap size={14} color="var(--acid)" /> Métricas</span>
                  </div>
                  <StatPill icon={Users}    label="Total usuarios" value={usuarios.length} color="var(--acid)" />
                  <StatPill icon={Activity} label="Activos"        value={activeCount}     color="var(--acid2)" />
                  <StatPill icon={Zap}      label="Promedio pts"   value={usuarios.length ? fmt.format(Math.round(totalPts / usuarios.length)) : '0'} color="var(--volt)" />
                  <StatPill icon={Shield}   label="Platino"        value={platCount}        color="var(--sky)" />
                </div>
              </aside>
            </div>
          </div>

          {/* Modal create/edit */}
          {(modalMode === 'create' || modalMode === 'edit') && (
              <div className="ux-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                <div className="ux-modal">
                  <div className="modal-head">
                    <span className="modal-title">{modalMode === 'create' ? 'NUEVO USUARIO' : 'EDITAR USUARIO'}</span>
                    <button className="modal-close" onClick={closeModal}><X size={14} /></button>
                  </div>
                  <div className="modal-body">
                    {[
                      { name: 'nombre',   label: 'Nombre completo', type: 'text',     ph: 'Ej: Ana García' },
                      { name: 'email',    label: 'Email',           type: 'email',    ph: 'correo@ejemplo.com' },
                      { name: 'telefono', label: 'Teléfono',        type: 'text',     ph: '+57 300 000 0000' },
                      ...(modalMode === 'create' ? [{ name: 'contrasena', label: 'Contraseña', type: 'password', ph: 'Mínimo 6 caracteres' }] : []),
                    ].map(f => (
                        <div key={f.name} className="mfield">
                          <label className="mlabel">{f.label}</label>
                          <input
                              type={f.type} placeholder={f.ph}
                              className={`minput ${formErrors[f.name] ? 'err' : ''}`}
                              value={form[f.name]}
                              onChange={e => { setForm(c => ({ ...c, [f.name]: e.target.value })); setFormErrors(c => ({ ...c, [f.name]: '' })); }}
                              disabled={createMut.isPending || updateMut.isPending}
                          />
                          {formErrors[f.name] && <span className="merr">{formErrors[f.name]}</span>}
                        </div>
                    ))}
                    <button className="msubmit" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
                      {(createMut.isPending || updateMut.isPending) ? 'Guardando…' : modalMode === 'create' ? 'Crear usuario →' : 'Guardar cambios →'}
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* Modal detail */}
          {modalMode === 'detail' && (
              <div className="ux-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                <div className="ux-modal">
                  <div className="modal-head">
                    <span className="modal-title">DETALLE</span>
                    <button className="modal-close" onClick={closeModal}><X size={14} /></button>
                  </div>
                  {detailQuery.isLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem 0' }}><LoadingSpinner /></div>
                  ) : detailUser ? (
                      <>
                        <div className="detail-hero">
                          <HexAvatar name={detailUser.nombre} nivel={detailUser.nivel} size={56} />
                          <div className="detail-hero-info">
                            <div className="detail-hero-name">{detailUser.nombre}</div>
                            <div className="detail-hero-id">{String(detailUser.id).slice(0, 20)}…</div>
                            {(() => {
                              const m = nivelMeta(detailUser.nivel);
                              return (
                                  <span className="nivel-chip" style={{ color: m.color, borderColor: m.border, background: m.bg, marginTop: '0.4rem', display: 'inline-flex' }}>
                            {m.icon} {levelLabel(detailUser.nivel) || '—'}
                          </span>
                              );
                            })()}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="detail-pts-big">{fmt.format(getPoints(detailUser))}</div>
                            <div className="detail-pts-label">puntos</div>
                          </div>
                        </div>
                        <div className="detail-grid">
                          {[
                            { label: 'Email',    value: detailUser.email },
                            { label: 'Teléfono', value: detailUser.telefono },
                            { label: 'Estado',   value: detailUser.activo ? 'Activo' : 'Inactivo', color: detailUser.activo ? 'var(--acid2)' : 'var(--muted)' },
                            { label: 'Registro', value: detailUser.fechaRegistro ? new Date(detailUser.fechaRegistro).toLocaleDateString('es-CO') : '—' },
                          ].map(f => (
                              <div key={f.label} className="detail-field">
                                <span className="detail-flabel">{f.label}</span>
                                <span className="detail-fvalue" style={f.color ? { color: f.color, fontFamily: 'var(--mono)' } : {}}>{f.value || '—'}</span>
                              </div>
                          ))}
                        </div>
                      </>
                  ) : (
                      <div className="ux-empty">No se pudo cargar el detalle.</div>
                  )}
                </div>
              </div>
          )}
        </div>
      </>
  );
}