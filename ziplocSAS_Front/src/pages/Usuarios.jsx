import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import NivelBadge from '../components/NivelBadge';
import useUsuarios, { useUsuario, useCrearUsuario, useActualizarUsuario, useEliminarUsuario, useTopUsuariosPuntos, useUsuariosPorRangoPuntos } from '../hooks/useUsuarios';
import { useAuth } from '../auth/AuthContext';

const INITIAL_FORM = { nombre: '', email: '', telefono: '', contrasena: '', activo: true };

function normalizeUsers(payload) {
  return payload?.usuarios || payload?.topUsuarios || payload?.usuario ? (Array.isArray(payload?.usuarios) ? payload.usuarios : payload?.topUsuarios || [payload.usuario].filter(Boolean)) : payload || [];
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(String(email || '').trim());
}

function isValidPhone(phone) {
  return /^[0-9+\s-]{7,15}$/.test(String(phone || '').trim());
}

function levelLabel(nivel) {
  return String(nivel || '').toLowerCase().replace(/^./, (char) => char.toUpperCase());
}

function getPoints(usuario) {
  if (!usuario) return 0;
  return Number(usuario.puntosActuales ?? usuario.puntosAcumulados ?? usuario.puntos ?? usuario.recompensas?.puntosActuales ?? 0);
}

export default function Usuarios() {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@ZiplocSAS.local' || user?.demo;
  const usuariosQuery = useUsuarios();
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
  const [minPuntos, setMinPuntos] = useState('');
  const [maxPuntos, setMaxPuntos] = useState('');

  const createMutation = useCrearUsuario();
  const updateMutation = useActualizarUsuario();
  const deleteMutation = useEliminarUsuario();

  const detailQuery = useUsuario(selectedUserId);
  const minPointsValue = minPuntos === '' ? NaN : Number(minPuntos);
  const maxPointsValue = maxPuntos === '' ? NaN : Number(maxPuntos);
  const rangoUsuariosQuery = useUsuariosPorRangoPuntos(minPointsValue, maxPointsValue);

  const usuarios = useMemo(() => normalizeUsers(usuariosQuery.data), [usuariosQuery.data]);
  const usuariosTop = useMemo(() => normalizeUsers(topUsuariosQuery.data), [topUsuariosQuery.data]);
  const usuariosRango = useMemo(() => normalizeUsers(rangoUsuariosQuery.data), [rangoUsuariosQuery.data]);

  const filteredUsuarios = useMemo(() => {
    const term = search.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      const matchesSearch = !term || [usuario.nombre, usuario.email, usuario.telefono].some((value) => String(value || '').toLowerCase().includes(term));
      const matchesNivel = !nivelFilter || String(usuario.nivel || '').toUpperCase() === nivelFilter;
      const matchesEstado = !estadoFilter || (estadoFilter === 'ACTIVO' ? usuario.activo : !usuario.activo);
      return matchesSearch && matchesNivel && matchesEstado;
    });
  }, [usuarios, search, nivelFilter, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedUsuarios = filteredUsuarios.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, nivelFilter, estadoFilter, pageSize]);

  useEffect(() => {
    if (modalMode === 'edit' && selectedUserId) {
      const target = usuarios.find((item) => item.id === selectedUserId);
      if (target) {
        setForm({
          nombre: target.nombre || '',
          email: target.email || '',
          telefono: target.telefono || '',
          contrasena: '',
          activo: !!target.activo,
        });
      }
    }
  }, [modalMode, selectedUserId, usuarios]);

  const loading = usuariosQuery.loading || topUsuariosQuery.isLoading;
  const error = usuariosQuery.error || topUsuariosQuery.error || createMutation.error || updateMutation.error || deleteMutation.error || detailQuery.error || rangoUsuariosQuery.error;

  function openCreateModal() {
    setModalMode('create');
    setForm(INITIAL_FORM);
    setFormErrors({});
  }

  function openEditModal(usuario) {
    setSelectedUserId(usuario.id);
    setModalMode('edit');
    setForm({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      contrasena: '',
      activo: !!usuario.activo,
    });
    setFormErrors({});
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUserId(null);
    setForm(INITIAL_FORM);
    setFormErrors({});
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio.';
    if (!form.email.trim()) nextErrors.email = 'El email es obligatorio.';
    else if (!isValidEmail(form.email)) nextErrors.email = 'El email no tiene un formato válido.';
    if (!form.telefono.trim()) nextErrors.telefono = 'El teléfono es obligatorio.';
    else if (!isValidPhone(form.telefono)) nextErrors.telefono = 'El teléfono no tiene un formato válido.';
    if (modalMode === 'create' && (!form.contrasena || form.contrasena.length < 6)) {
      nextErrors.contrasena = 'La contraseña debe tener al menos 6 caracteres.';
    }
    return nextErrors;
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForm();
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      ...(modalMode === 'create' && form.contrasena ? { contrasena: form.contrasena } : {})
    };

    try {
      if (modalMode === 'edit' && selectedUserId) {
        await updateMutation.mutateAsync({ id: selectedUserId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (err) {
      // error handled by mutation state
    }
  }

  function handleDelete(usuario) {
    const confirmed = window.confirm(`¿Eliminar a ${usuario.nombre}?`);
    if (!confirmed) return;
    deleteMutation.mutate(usuario.id);
  }

  function openDetail(usuario) {
    setSelectedUserId(usuario.id);
    setModalMode('detail');
  }

  const topFive = usuariosTop.slice(0, 5);

  return (
    <section className="flex flex-col gap-6 relative">
      {error && (
        <AlertaPanel
          type="error"
          title="No se pudo completar la operación"
          message={error?.message || 'Error inesperado con el módulo de usuarios'}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-textoPrincipal">Usuarios</h1>
          <p className="text-sm text-textoSecundario">Gestión completa de usuarios, puntos y niveles.</p>
        </div>
        {isDemoUser && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-acento text-superficie rounded-md font-medium hover:bg-acentoHover transition-colors"
          >
            <Plus size={18} /> Nuevo usuario
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-superficie border border-borde rounded-md shadow-sutil p-6">
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textoSecundario" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, email o teléfono"
                className="w-full pl-10 pr-4 py-3 bg-transparent border border-borde rounded-md outline-none focus:border-acento"
              />
            </div>
            <select value={nivelFilter} onChange={(event) => setNivelFilter(event.target.value)} className="px-4 py-3 bg-transparent border border-borde rounded-md">
              <option value="">Todos los niveles</option>
              <option value="BRONCE">Bronce</option>
              <option value="PLATA">Plata</option>
              <option value="ORO">Oro</option>
              <option value="PLATINO">Platino</option>
            </select>
            <select value={estadoFilter} onChange={(event) => setEstadoFilter(event.target.value)} className="px-4 py-3 bg-transparent border border-borde rounded-md">
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="px-4 py-3 bg-transparent border border-borde rounded-md">
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
            </select>
          </div>

          {loading ? (
            <div className="py-10 flex justify-center"><LoadingSpinner /></div>
          ) : pagedUsuarios.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-textoSecundario border-b border-borde">
                    <th className="py-3 pr-3">Nombre</th>
                    <th className="py-3 pr-3">Email</th>
                    <th className="py-3 pr-3">Teléfono</th>
                    <th className="py-3 pr-3">Puntos</th>
                    <th className="py-3 pr-3">Nivel</th>
                    <th className="py-3 pr-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-borde hover:bg-fondo transition-colors">
                      <td className="py-4 pr-3 font-medium text-textoPrincipal">{usuario.nombre}</td>
                      <td className="py-4 pr-3 text-sm text-textoSecundario">{usuario.email}</td>
                      <td className="py-4 pr-3 text-sm text-textoSecundario">{usuario.telefono}</td>
                      <td className="py-4 pr-3 font-semibold">{getPoints(usuario)}</td>
                      <td className="py-4 pr-3"><NivelBadge nivel={usuario.nivel} puntos={getPoints(usuario)} /></td>
                      <td className="py-4 pr-3">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => openDetail(usuario)} className="p-2 rounded-md border border-borde hover:border-acento" title="Ver detalle"><Eye size={16} /></button>
                          <button type="button" onClick={() => openEditModal(usuario)} className="p-2 rounded-md border border-borde hover:border-acento" title="Editar"><Pencil size={16} /></button>
                          <button type="button" onClick={() => handleDelete(usuario)} disabled={deleteMutation.isPending} className="p-2 rounded-md border border-borde hover:border-error text-error disabled:opacity-50" title="Eliminar"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-dashed border-borde rounded-md p-8 bg-fondo text-center">
              <p className="text-sm text-textoSecundario">No hay usuarios que coincidan con los filtros.</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-5">
            <div className="text-sm text-textoSecundario">
              Página {safePage} de {totalPages} · {filteredUsuarios.length} resultados
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage <= 1} className="inline-flex items-center gap-1 px-3 py-2 border border-borde rounded-md disabled:opacity-50">
                <ChevronLeft size={16} /> Prev
              </button>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={safePage >= totalPages} className="inline-flex items-center gap-1 px-3 py-2 border border-borde rounded-md disabled:opacity-50">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="bg-superficie border border-borde rounded-md shadow-sutil p-6">
            <h2 className="text-lg font-semibold mb-4 text-textoPrincipal">Top usuarios</h2>
            {topUsuariosQuery.isLoading ? (
              <div className="py-6 flex justify-center"><LoadingSpinner /></div>
            ) : topFive.length ? (
              <div className="flex flex-col gap-3">
                {topFive.map((usuario) => (
                  <button key={usuario.id} type="button" onClick={() => openDetail(usuario)} className="text-left p-3 rounded-md border border-borde hover:border-acento transition-colors">
                    <div className="font-medium text-textoPrincipal">{usuario.nombre}</div>
                    <div className="text-xs text-textoSecundario">{usuario.email}</div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span>{levelLabel(usuario.nivel)}</span>
                      <strong>{getPoints(usuario)} pts</strong>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-textoSecundario">Sin datos de top usuarios.</p>
            )}
          </div>

          <div className="bg-superficie border border-borde rounded-md shadow-sutil p-6">
            <h2 className="text-lg font-semibold mb-4 text-textoPrincipal">Rango por puntos</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input type="number" value={minPuntos} onChange={(event) => setMinPuntos(event.target.value)} placeholder="Mínimo" className="px-4 py-3 bg-transparent border border-borde rounded-md" />
              <input type="number" value={maxPuntos} onChange={(event) => setMaxPuntos(event.target.value)} placeholder="Máximo" className="px-4 py-3 bg-transparent border border-borde rounded-md" />
            </div>
            {rangoUsuariosQuery.isLoading ? (
              <div className="py-4 flex justify-center"><LoadingSpinner /></div>
            ) : usuariosRango.length ? (
              <div className="flex flex-col gap-2 max-h-[280px] overflow-auto">
                {usuariosRango.map((usuario) => (
                  <div key={usuario.id} className="p-3 rounded-md border border-borde">
                    <div className="font-medium">{usuario.nombre}</div>
                    <div className="text-xs text-textoSecundario">{getPoints(usuario)} puntos · {levelLabel(usuario.nivel)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-textoSecundario">Ingresa un rango válido para consultar usuarios.</p>
            )}
          </div>
        </aside>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-superficie rounded-lg shadow-2xl border border-borde max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-borde">
              <h3 className="text-lg font-semibold text-textoPrincipal">
                {modalMode === 'create' && 'Nuevo usuario'}
                {modalMode === 'edit' && 'Editar usuario'}
                {modalMode === 'detail' && 'Detalle de usuario'}
              </h3>
              <button type="button" onClick={closeModal} className="text-textoSecundario hover:text-textoPrincipal">✕</button>
            </div>

            {modalMode === 'detail' ? (
              <div className="p-5">
                {detailQuery.isLoading ? (
                  <div className="py-8 flex justify-center"><LoadingSpinner /></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><span className="text-xs uppercase text-textoSecundario">Nombre</span><p className="font-medium">{detailQuery.data?.usuario?.nombre || detailQuery.data?.nombre}</p></div>
                    <div><span className="text-xs uppercase text-textoSecundario">Email</span><p className="font-medium">{detailQuery.data?.usuario?.email || detailQuery.data?.email}</p></div>
                    <div><span className="text-xs uppercase text-textoSecundario">Teléfono</span><p className="font-medium">{detailQuery.data?.usuario?.telefono || detailQuery.data?.telefono}</p></div>
                    <div><span className="text-xs uppercase text-textoSecundario">Puntos</span><p className="font-medium">{getPoints(detailQuery.data?.usuario || detailQuery.data)}</p></div>
                    <div><span className="text-xs uppercase text-textoSecundario">Nivel</span><p className="font-medium">{levelLabel(detailQuery.data?.usuario?.nivel || detailQuery.data?.nivel)}</p></div>
                    <div><span className="text-xs uppercase text-textoSecundario">Estado</span><p className="font-medium">{(detailQuery.data?.usuario?.activo ?? detailQuery.data?.activo) ? 'ACTIVO' : 'INACTIVO'}</p></div>
                    <div><span className="text-xs uppercase text-textoSecundario">Creado</span><p className="font-medium">{detailQuery.data?.usuario?.creadoAt || detailQuery.data?.creadoAt || '-'}</p></div>
                    <div><span className="text-xs uppercase text-textoSecundario">Actualizado</span><p className="font-medium">{detailQuery.data?.usuario?.actualizadoAt || detailQuery.data?.actualizadoAt || '-'}</p></div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-sm font-medium text-textoSecundario">Nombre</label>
                  <input name="nombre" value={form.nombre} onChange={handleFormChange} className="px-4 py-3 bg-transparent border border-borde rounded-md outline-none focus:border-acento" />
                  {formErrors.nombre && <span className="text-xs text-error">{formErrors.nombre}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-textoSecundario">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleFormChange} className="px-4 py-3 bg-transparent border border-borde rounded-md outline-none focus:border-acento" />
                  {formErrors.email && <span className="text-xs text-error">{formErrors.email}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-textoSecundario">Teléfono</label>
                  <input name="telefono" value={form.telefono} onChange={handleFormChange} className="px-4 py-3 bg-transparent border border-borde rounded-md outline-none focus:border-acento" />
                  {formErrors.telefono && <span className="text-xs text-error">{formErrors.telefono}</span>}
                </div>
                {modalMode === 'create' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-textoSecundario">Contraseña</label>
                    <input name="contrasena" type="password" value={form.contrasena} onChange={handleFormChange} className="px-4 py-3 bg-transparent border border-borde rounded-md outline-none focus:border-acento" />
                    {formErrors.contrasena && <span className="text-xs text-error">{formErrors.contrasena}</span>}
                  </div>
                )}
                <div className="md:col-span-2 flex items-center gap-2">
                  <input id="activo" name="activo" type="checkbox" checked={form.activo} onChange={handleFormChange} />
                  <label htmlFor="activo" className="text-sm text-textoSecundario">Usuario activo</label>
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 border border-borde rounded-md">Cancelar</button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 bg-acento text-superficie rounded-md font-medium disabled:opacity-50">
                    {modalMode === 'edit' ? (updateMutation.isPending ? 'Guardando...' : 'Guardar cambios') : (createMutation.isPending ? 'Creando...' : 'Crear usuario')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
