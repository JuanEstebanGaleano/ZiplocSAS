import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import NivelBadge from '../components/NivelBadge';
import useUsuarios, { useUsuario, useCrearUsuario, useActualizarUsuario, useEliminarUsuario, useTopUsuariosPuntos, useUsuariosPorRangoPuntos } from '../hooks/useUsuarios';
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
function getPoints(u) { if (!u) return 0; return Number(u.puntosActuales ?? u.puntosAcumulados ?? u.puntos ?? u.recompensas?.puntosActuales ?? 0); }
function levelLabel(nivel) { return String(nivel || '').toLowerCase().replace(/^./, c => c.toUpperCase()); }

const fmt = new Intl.NumberFormat('es-CO');

const NIVEL_COLORS = {
  BRONCE: { color: '#CD7F32', bg: 'rgba(205,127,50,0.1)', border: 'rgba(205,127,50,0.25)' },
  PLATA:  { color: '#A0A0A0', bg: 'rgba(160,160,160,0.1)', border: 'rgba(160,160,160,0.25)' },
  ORO:    { color: '#E8C54A', bg: 'rgba(232,197,74,0.1)', border: 'rgba(232,197,74,0.25)' },
  PLATINO:{ color: '#8AB4D4', bg: 'rgba(138,180,212,0.1)', border: 'rgba(138,180,212,0.25)' },
};

function nivelStyle(nivel) {
  return NIVEL_COLORS[String(nivel || '').toUpperCase()] || { color: '#666', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
}

export default function Usuarios() {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@ZiplocSAS.local' || user?.demo;
  const usuariosQuery = useUsuarios();
  const topUsuariosQuery = useTopUsuariosPuntos();

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'detail'
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [search, setSearch] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [minPuntos, setMinPuntos] = useState('');
  const [maxPuntos, setMaxPuntos] = useState('');

  const createMut = useCrearUsuario();
  const updateMut = useActualizarUsuario();
  const deleteMut = useEliminarUsuario();
  const detailQuery = useUsuario(selectedUserId);

  const minPts = minPuntos === '' ? NaN : Number(minPuntos);
  const maxPts = maxPuntos === '' ? NaN : Number(maxPuntos);
  const rangoQuery = useUsuariosPorRangoPuntos(minPts, maxPts);

  const usuarios = useMemo(() => normalizeUsers(usuariosQuery.data), [usuariosQuery.data]);
  const usuariosTop = useMemo(() => normalizeUsers(topUsuariosQuery.data), [topUsuariosQuery.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return usuarios.filter(u => {
      if (term && ![u.nombre, u.email, u.telefono].some(v => String(v||'').toLowerCase().includes(term))) return false;
      if (nivelFilter && String(u.nivel||'').toUpperCase() !== nivelFilter) return false;
      if (estadoFilter && (estadoFilter === 'ACTIVO' ? !u.activo : u.activo)) return false;
      return true;
    });
  }, [usuarios, search, nivelFilter, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [search, nivelFilter, estadoFilter, pageSize]);

  useEffect(() => {
    if (modalMode === 'edit' && selectedUserId) {
      const target = usuarios.find(u => u.id === selectedUserId);
      if (target) setForm({ nombre: target.nombre||'', email: target.email||'', telefono: target.telefono||'', contrasena: '', activo: !!target.activo });
    }
  }, [modalMode, selectedUserId, usuarios]);

  const loading = usuariosQuery.isLoading || topUsuariosQuery.isLoading;
  const error = usuariosQuery.error || topUsuariosQuery.error || createMut.error || updateMut.error || deleteMut.error || detailQuery.error;

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
    const payload = { nombre: form.nombre.trim(), email: form.email.trim(), telefono: form.telefono.trim(), ...(modalMode === 'create' && form.contrasena ? { contrasena: form.contrasena } : {}) };
    try {
      if (modalMode === 'edit') await updateMut.mutateAsync({ id: selectedUserId, payload });
      else await createMut.mutateAsync(payload);
      closeModal();
    } catch {}
  }

  function openCreate() { setModalMode('create'); setForm(INITIAL_FORM); setFormErrors({}); }
  function openEdit(u) { setSelectedUserId(u.id); setModalMode('edit'); setFormErrors({}); }
  function openDetail(u) { setSelectedUserId(u.id); setModalMode('detail'); }
  function closeModal() { setModalMode(null); setSelectedUserId(null); setForm(INITIAL_FORM); setFormErrors({}); }

  function handleDelete(u) {
    if (!window.confirm(`¿Eliminar a ${u.nombre}?`)) return;
    deleteMut.mutate(u.id);
  }

  const topFive = usuariosTop.slice(0, 5);
  const detailUser = modalMode === 'detail' && selectedUserId ? (detailQuery.data || usuarios.find(u => u.id === selectedUserId)) : null;

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@600;700;900&family=Inter:wght@300;400;500&display=swap');

        :root {
          --fm: 'Space Mono', monospace; --fd: 'Orbitron', sans-serif; --fb: 'Inter', sans-serif;
          --g: #00ff88; --gd: rgba(0,255,136,0.55); --gm: rgba(0,255,136,0.09); --gb: rgba(0,255,136,0.2);
          --c: #00cfff; --r: #ff3355; --a: #ffb020;
          --bg: #060609; --sf: rgba(255,255,255,0.026); --sfh: rgba(0,255,136,0.03);
          --bd: rgba(255,255,255,0.055); --bda: rgba(0,255,136,0.18);
          --t: rgba(255,255,255,0.88); --td: rgba(255,255,255,0.38); --tf: rgba(255,255,255,0.14);
        }

        .us-root { font-family: var(--fb); background: var(--bg); min-height: 100vh; position: relative; }

        .us-atmo {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 50% 50% at -5% 0%, rgba(0,255,136,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 40% 35% at 105% 95%, rgba(0,207,255,0.06) 0%, transparent 55%);
        }

        .us-scan {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 4px);
          opacity: 0.28;
        }

        .us-content { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.25rem; }

        /* ── Page header ── */
        .us-header {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: rgba(255,255,255,0.018); border: 1px solid var(--bda);
          border-radius: 12px;
        }

        .us-header-left { display: flex; flex-direction: column; gap: 3px; }

        .us-page-title {
          font-family: var(--fd); font-size: 1.35rem; font-weight: 700;
          color: #fff; letter-spacing: 0.04em;
        }

        .us-page-sub {
          font-family: var(--fm); font-size: 0.6rem; color: var(--tf);
          text-transform: uppercase; letter-spacing: 0.1em;
        }

        .us-btn-new {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.65rem 1.1rem;
          background: var(--gm); border: 1px solid var(--gb);
          color: var(--g); font-family: var(--fm); font-size: 0.65rem;
          font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          border-radius: 6px; cursor: pointer; transition: background 0.15s;
        }

        .us-btn-new:hover { background: rgba(0,255,136,0.15); }

        /* ── Layout ── */
        .us-layout { display: grid; grid-template-columns: 1fr 280px; gap: 1.25rem; }
        @media (max-width: 1100px) { .us-layout { grid-template-columns: 1fr; } }

        /* ── Panel ── */
        .us-panel { background: var(--sf); border: 1px solid var(--bd); border-radius: 12px; overflow: hidden; }
        .us-panel.accent { border-color: var(--bda); }

        .us-panel-head {
          padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--bd);
          display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
        }

        .us-panel-title {
          font-family: var(--fm); font-size: 0.62rem; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--gd);
          display: flex; align-items: center; gap: 0.4rem;
        }

        .us-panel-title::before { content: '//'; color: var(--tf); }

        .us-badge {
          font-family: var(--fm); font-size: 0.55rem; color: var(--tf);
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 0.18rem 0.55rem; border: 1px solid var(--bd); border-radius: 4px;
        }

        /* ── Filters ── */
        .us-filters {
          display: flex; gap: 0.75rem; flex-wrap: wrap;
          padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--bd);
        }

        .us-filter-wrap { position: relative; display: flex; align-items: center; }
        .us-filter-icon { position: absolute; left: 0.65rem; color: var(--tf); pointer-events: none; }

        .us-filter-input {
          padding: 0.55rem 0.85rem; background: rgba(0,0,0,0.35);
          border: 1px solid var(--bd); border-radius: 6px;
          color: var(--t); font-family: var(--fm); font-size: 0.68rem;
          outline: none; transition: border-color 0.15s; appearance: none;
        }

        .us-filter-input.with-icon { padding-left: 2rem; }
        .us-filter-input:focus { border-color: var(--gb); }

        /* ── Table ── */
        .us-table { width: 100%; border-collapse: collapse; min-width: 720px; }

        .us-table thead tr {
          border-bottom: 1px solid var(--bd);
          background: rgba(0,0,0,0.2);
        }

        .us-table th {
          padding: 0.7rem 1rem; text-align: left;
          font-family: var(--fm); font-size: 0.55rem; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--tf); font-weight: 600;
          white-space: nowrap;
        }

        .us-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.12s;
        }

        .us-table tbody tr:last-child { border-bottom: none; }
        .us-table tbody tr:hover { background: var(--sfh); }

        .us-table td { padding: 0.85rem 1rem; }

        .us-td-name { font-size: 0.85rem; font-weight: 500; color: var(--t); }
        .us-td-sub { font-family: var(--fm); font-size: 0.6rem; color: var(--tf); margin-top: 2px; }
        .us-td-mono { font-family: var(--fm); font-size: 0.72rem; color: var(--td); }
        .us-td-pts { font-family: var(--fm); font-size: 0.8rem; font-weight: 700; color: var(--g); }

        .us-nivel-pill {
          display: inline-flex; align-items: center;
          font-family: var(--fm); font-size: 0.55rem; text-transform: uppercase;
          letter-spacing: 0.06em; padding: 0.2rem 0.6rem;
          border-radius: 4px; border: 1px solid; white-space: nowrap;
        }

        .us-activo-dot {
          width: 6px; height: 6px; border-radius: 50%; display: inline-block;
        }

        /* ── Action buttons ── */
        .us-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.4rem; }

        .us-action-btn {
          padding: 0.35rem; background: none; border: 1px solid var(--bd);
          border-radius: 6px; cursor: pointer; color: var(--td);
          transition: border-color 0.15s, color 0.15s, background 0.15s;
          display: flex; align-items: center; justify-content: center;
        }

        .us-action-btn.view:hover  { border-color: var(--gb); color: var(--g); background: var(--gm); }
        .us-action-btn.edit:hover  { border-color: rgba(0,207,255,0.35); color: var(--c); background: rgba(0,207,255,0.07); }
        .us-action-btn.del:hover   { border-color: rgba(255,51,85,0.35); color: var(--r); background: rgba(255,51,85,0.07); }
        .us-action-btn:disabled    { opacity: 0.3; cursor: not-allowed; }

        /* ── Pagination ── */
        .us-pagination {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.9rem 1.25rem; border-top: 1px solid var(--bd);
          gap: 1rem; flex-wrap: wrap;
        }

        .us-page-info { font-family: var(--fm); font-size: 0.6rem; color: var(--tf); }

        .us-page-btn {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.4rem 0.8rem;
          background: none; border: 1px solid var(--bd);
          border-radius: 6px; color: var(--td);
          font-family: var(--fm); font-size: 0.62rem; cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }

        .us-page-btn:hover:not(:disabled) { border-color: var(--gb); color: var(--g); }
        .us-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── Top aside ── */
        .us-top-card {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          display: flex; flex-direction: column; gap: 0.3rem;
          cursor: pointer; transition: background 0.12s;
        }

        .us-top-card:last-child { border-bottom: none; }
        .us-top-card:hover { background: var(--sfh); }

        .us-top-rank {
          font-family: var(--fm); font-size: 0.55rem; color: var(--tf);
          text-transform: uppercase; letter-spacing: 0.08em;
        }

        .us-top-name { font-size: 0.82rem; font-weight: 500; color: var(--t); }
        .us-top-email { font-family: var(--fm); font-size: 0.6rem; color: var(--tf); }

        .us-top-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 0.2rem; }

        /* ── Modal ── */
        .us-modal-overlay {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }

        .us-modal {
          background: #0a0a0f; border: 1px solid var(--bda);
          border-radius: 14px; width: 100%; max-width: 480px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 0 60px rgba(0,255,136,0.1);
        }

        .us-modal-head {
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--bd);
          display: flex; align-items: center; justify-content: space-between;
        }

        .us-modal-title {
          font-family: var(--fm); font-size: 0.65rem; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--gd);
          display: flex; align-items: center; gap: 0.4rem;
        }

        .us-modal-title::before { content: '//'; color: var(--tf); }

        .us-modal-close {
          background: none; border: 1px solid var(--bd); border-radius: 6px;
          color: var(--td); padding: 0.25rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.15s, color 0.15s;
        }

        .us-modal-close:hover { border-color: var(--r); color: var(--r); }

        .us-modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.9rem; }

        .us-modal-field { display: flex; flex-direction: column; gap: 0.35rem; }

        .us-modal-label {
          font-family: var(--fm); font-size: 0.58rem; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--tf);
        }

        .us-modal-input {
          width: 100%; padding: 0.65rem 0.85rem;
          background: rgba(0,0,0,0.4); border: 1px solid var(--bd);
          border-radius: 6px; color: var(--t); font-family: var(--fm); font-size: 0.76rem;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }

        .us-modal-input:focus { border-color: var(--gb); box-shadow: 0 0 0 3px rgba(0,255,136,0.07); }
        .us-modal-input.err { border-color: var(--r); }

        .us-modal-error { font-family: var(--fm); font-size: 0.57rem; color: var(--r); }

        .us-modal-btn {
          width: 100%; padding: 0.8rem;
          background: var(--gm); border: 1px solid var(--gb);
          color: var(--g); font-family: var(--fm); font-size: 0.68rem;
          font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          border-radius: 6px; cursor: pointer; transition: background 0.15s;
        }

        .us-modal-btn:hover { background: rgba(0,255,136,0.15); }
        .us-modal-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Detail modal fields */
        .us-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        .us-detail-field { display: flex; flex-direction: column; gap: 0.3rem; }

        .us-detail-label { font-family: var(--fm); font-size: 0.57rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--tf); }

        .us-detail-value { font-size: 0.84rem; color: var(--t); font-weight: 400; word-break: break-all; }

        .us-empty { padding: 2.5rem; text-align: center; font-family: var(--fm); font-size: 0.68rem; color: var(--tf); }
      `}</style>

        <div className="us-root">
          <div className="us-atmo" />
          <div className="us-scan" />

          {error && (
              <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 20 }}>
                <AlertaPanel type="error" title="Error" message={error?.message || 'Error inesperado'} />
              </div>
          )}

          <div className="us-content">

            {/* Header */}
            <div className="us-header">
              <div className="us-header-left">
                <h1 className="us-page-title">Panel de usuarios</h1>
                <span className="us-page-sub">Gestión · Puntos · Niveles</span>
              </div>
              {isDemoUser && (
                  <button className="us-btn-new" onClick={openCreate}>
                    <Plus size={14} /> Nuevo usuario
                  </button>
              )}
            </div>

            {/* Main layout */}
            <div className="us-layout">

              {/* Table panel */}
              <div className="us-panel accent">
                <div className="us-panel-head">
                  <span className="us-panel-title">Directorio de usuarios</span>
                  <span className="us-badge">{filtered.length} resultados</span>
                </div>

                <div className="us-filters">
                  <div className="us-filter-wrap" style={{ flex: 1, minWidth: 220 }}>
                    <Search size={13} className="us-filter-icon" style={{ left: '0.65rem' }} />
                    <input
                        className="us-filter-input with-icon" style={{ width: '100%' }}
                        placeholder="Buscar nombre, email, teléfono…"
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <select className="us-filter-input" value={nivelFilter} onChange={e => setNivelFilter(e.target.value)}>
                    <option value="">Todos los niveles</option>
                    <option value="BRONCE">Bronce</option>
                    <option value="PLATA">Plata</option>
                    <option value="ORO">Oro</option>
                    <option value="PLATINO">Platino</option>
                  </select>
                  <select className="us-filter-input" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                  <select className="us-filter-input" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                    <option value={5}>5 / pág</option>
                    <option value={10}>10 / pág</option>
                    <option value={20}>20 / pág</option>
                  </select>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><LoadingSpinner /></div>
                ) : paged.length ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="us-table">
                        <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Email</th>
                          <th>Teléfono</th>
                          <th>Puntos</th>
                          <th>Nivel</th>
                          <th>Estado</th>
                          <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paged.map(u => {
                          const nStyle = nivelStyle(u.nivel);
                          return (
                              <tr key={u.id}>
                                <td>
                                  <div className="us-td-name">{u.nombre}</div>
                                  <div className="us-td-sub">{String(u.id).slice(0, 10)}…</div>
                                </td>
                                <td><span className="us-td-mono">{u.email}</span></td>
                                <td><span className="us-td-mono">{u.telefono}</span></td>
                                <td><span className="us-td-pts">{fmt.format(getPoints(u))}</span></td>
                                <td>
                              <span className="us-nivel-pill" style={{ color: nStyle.color, borderColor: nStyle.border, background: nStyle.bg }}>
                                {levelLabel(u.nivel) || '—'}
                              </span>
                                </td>
                                <td>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="us-activo-dot" style={{ background: u.activo ? '#00ff88' : '#666' }} />
                                <span style={{ fontFamily: 'var(--fm)', fontSize: '0.6rem', color: u.activo ? 'rgba(0,255,136,0.7)' : 'var(--tf)' }}>
                                  {u.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </span>
                                </td>
                                <td>
                                  <div className="us-actions">
                                    <button className="us-action-btn view" onClick={() => openDetail(u)} title="Ver detalle"><Eye size={14} /></button>
                                    <button className="us-action-btn edit" onClick={() => openEdit(u)} title="Editar"><Pencil size={14} /></button>
                                    <button className="us-action-btn del" onClick={() => handleDelete(u)} disabled={deleteMut.isPending} title="Eliminar"><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>
                ) : (
                    <div className="us-empty">Sin usuarios para los filtros seleccionados.</div>
                )}

                <div className="us-pagination">
                  <span className="us-page-info">Pág {safePage} de {totalPages} · {filtered.length} usuarios</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="us-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>
                      <ChevronLeft size={13} /> Prev
                    </button>
                    <button className="us-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Aside: top usuarios */}
              <aside>
                <div className="us-panel">
                  <div className="us-panel-head">
                    <span className="us-panel-title">Top usuarios</span>
                    <span className="us-badge">Puntos</span>
                  </div>
                  {topFive.length ? topFive.map((u, i) => {
                    const nStyle = nivelStyle(u.nivel);
                    return (
                        <div key={u.id} className="us-top-card" onClick={() => openDetail(u)}>
                          <span className="us-top-rank">#{i + 1}</span>
                          <span className="us-top-name">{u.nombre}</span>
                          <span className="us-top-email">{u.email}</span>
                          <div className="us-top-footer">
                        <span className="us-nivel-pill" style={{ color: nStyle.color, borderColor: nStyle.border, background: nStyle.bg, fontSize: '0.5rem' }}>
                          {levelLabel(u.nivel)}
                        </span>
                            <span style={{ fontFamily: 'var(--fm)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--g)' }}>
                          {fmt.format(getPoints(u))} pts
                        </span>
                          </div>
                        </div>
                    );
                  }) : (
                      <div className="us-empty">Sin datos.</div>
                  )}
                </div>
              </aside>
            </div>
          </div>

          {/* ── Modal create/edit ── */}
          {(modalMode === 'create' || modalMode === 'edit') && (
              <div className="us-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                <div className="us-modal">
                  <div className="us-modal-head">
                    <span className="us-modal-title">{modalMode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</span>
                    <button className="us-modal-close" onClick={closeModal}><X size={14} /></button>
                  </div>
                  <div className="us-modal-body">
                    {[
                      { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Nombre completo' },
                      { name: 'email', label: 'Email', type: 'email', placeholder: 'correo@ejemplo.com' },
                      { name: 'telefono', label: 'Teléfono', type: 'text', placeholder: '+57 300 000 0000' },
                      ...(modalMode === 'create' ? [{ name: 'contrasena', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 6 caracteres' }] : []),
                    ].map(f => (
                        <div key={f.name} className="us-modal-field">
                          <label className="us-modal-label">{f.label}</label>
                          <input
                              type={f.type} placeholder={f.placeholder}
                              className={`us-modal-input ${formErrors[f.name] ? 'err' : ''}`}
                              value={form[f.name]}
                              onChange={e => { setForm(c => ({...c, [f.name]: e.target.value})); setFormErrors(c => ({...c, [f.name]: ''})); }}
                              disabled={createMut.isPending || updateMut.isPending}
                          />
                          {formErrors[f.name] && <span className="us-modal-error">{formErrors[f.name]}</span>}
                        </div>
                    ))}
                    <button className="us-modal-btn" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
                      {(createMut.isPending || updateMut.isPending) ? 'Guardando…' : modalMode === 'create' ? 'Crear usuario →' : 'Guardar cambios →'}
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* ── Modal detail ── */}
          {modalMode === 'detail' && (
              <div className="us-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                <div className="us-modal">
                  <div className="us-modal-head">
                    <span className="us-modal-title">Detalle del usuario</span>
                    <button className="us-modal-close" onClick={closeModal}><X size={14} /></button>
                  </div>
                  <div className="us-modal-body">
                    {detailQuery.isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}><LoadingSpinner /></div>
                    ) : detailUser ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--bd)' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gm)', border: '1px solid var(--gb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fd)', fontSize: '1rem', fontWeight: 700, color: 'var(--g)' }}>
                              {(detailUser.nombre || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--t)' }}>{detailUser.nombre}</div>
                              <div style={{ fontFamily: 'var(--fm)', fontSize: '0.6rem', color: 'var(--tf)' }}>{String(detailUser.id).slice(0, 16)}…</div>
                            </div>
                          </div>
                          <div className="us-detail-grid">
                            {[
                              { label: 'Email', value: detailUser.email },
                              { label: 'Teléfono', value: detailUser.telefono },
                              { label: 'Nivel', value: levelLabel(detailUser.nivel), accent: true },
                              { label: 'Puntos', value: fmt.format(getPoints(detailUser)) + ' pts', accent: true },
                              { label: 'Estado', value: detailUser.activo ? 'Activo' : 'Inactivo' },
                              { label: 'Registro', value: detailUser.fechaRegistro ? new Date(detailUser.fechaRegistro).toLocaleDateString('es-CO') : '—' },
                            ].map(f => (
                                <div key={f.label} className="us-detail-field">
                                  <span className="us-detail-label">{f.label}</span>
                                  <span className="us-detail-value" style={f.accent ? { color: 'var(--g)', fontFamily: 'var(--fm)', fontWeight: 700 } : {}}>{f.value || '—'}</span>
                                </div>
                            ))}
                          </div>
                        </>
                    ) : (
                        <div className="us-empty">No se pudo cargar el detalle.</div>
                    )}
                  </div>
                </div>
              </div>
          )}
        </div>
      </>
  );
}