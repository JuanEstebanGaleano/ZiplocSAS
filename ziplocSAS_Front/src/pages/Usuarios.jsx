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
  const {user} = useAuth();
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
    const {name, value, type, checked} = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormErrors((current) => ({...current, [name]: ''}));
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
      ...(modalMode === 'create' && form.contrasena ? {contrasena: form.contrasena} : {})
    };

    try {
      if (modalMode === 'edit' && selectedUserId) {
        await updateMutation.mutateAsync({id: selectedUserId, payload});
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
      <section className="flex flex-col gap-6 relative text-[#F5F7FA]">
        {error && (
            <AlertaPanel
                type="error"
                title="No se pudo completar la operación"
                message={error?.message || 'Error inesperado con el módulo de usuarios'}
            />
        )}

        <div
            className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1120] border border-[#23263A] rounded-2xl p-6 shadow-[0_0_30px_rgba(98,70,234,0.15)]">
          <div>
            <h1 className="text-3xl font-semibold text-white">Usuarios</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">
              Gestión completa de usuarios, puntos y niveles.
            </p>
          </div>

          {isDemoUser && (
              <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#5B5FEF] bg-gradient-to-r from-[#5B5FEF] to-[#2DD4BF] text-white font-medium hover:opacity-90 transition-all shadow-lg shadow-[#5B5FEF]/20"
              >
                <Plus size={18}/>
                Nuevo usuario
              </button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div
              className="xl:col-span-2 bg-[#0E1120] border border-[#23263A] rounded-2xl shadow-[0_0_35px_rgba(91,95,239,0.08)] p-6">

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[240px]">
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C82A1]"
                />

                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre, email o teléfono"
                    className="w-full pl-10 pr-4 py-3 bg-[#121526] border border-[#2B3050] rounded-xl outline-none focus:border-[#5B5FEF] text-white placeholder:text-[#6B7280]"
                />
              </div>

              <select
                  value={nivelFilter}
                  onChange={(event) => setNivelFilter(event.target.value)}
                  className="px-4 py-3 bg-[#121526] border border-[#2B3050] rounded-xl text-white"
              >
                <option value="">Todos los niveles</option>
                <option value="BRONCE">Bronce</option>
                <option value="PLATA">Plata</option>
                <option value="ORO">Oro</option>
                <option value="PLATINO">Platino</option>
              </select>

              <select
                  value={estadoFilter}
                  onChange={(event) => setEstadoFilter(event.target.value)}
                  className="px-4 py-3 bg-[#121526] border border-[#2B3050] rounded-xl text-white"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>

              <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="px-4 py-3 bg-[#121526] border border-[#2B3050] rounded-xl text-white"
              >
                <option value={5}>5 por página</option>
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
              </select>
            </div>

            {loading ? (
                <div className="py-10 flex justify-center">
                  <LoadingSpinner/>
                </div>
            ) : pagedUsuarios.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse">
                    <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-[#7C82A1] border-b border-[#23263A]">
                      <th className="py-4 pr-3">Nombre</th>
                      <th className="py-4 pr-3">Email</th>
                      <th className="py-4 pr-3">Teléfono</th>
                      <th className="py-4 pr-3">Puntos</th>
                      <th className="py-4 pr-3">Nivel</th>
                      <th className="py-4 pr-3 text-right">Acciones</th>
                    </tr>
                    </thead>

                    <tbody>
                    {pagedUsuarios.map((usuario) => (
                        <tr
                            key={usuario.id}
                            className="border-b border-[#1E2235] hover:bg-[#151A2E] transition-all"
                        >
                          <td className="py-5 pr-3 font-medium text-white">
                            {usuario.nombre}
                          </td>

                          <td className="py-5 pr-3 text-sm text-[#A1A1AA]">
                            {usuario.email}
                          </td>

                          <td className="py-5 pr-3 text-sm text-[#A1A1AA]">
                            {usuario.telefono}
                          </td>

                          <td className="py-5 pr-3 font-semibold text-[#D1D5DB]">
                            {getPoints(usuario)}
                          </td>

                          <td className="py-5 pr-3">
                            <NivelBadge
                                nivel={usuario.nivel}
                                puntos={getPoints(usuario)}
                            />
                          </td>

                          <td className="py-5 pr-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                  type="button"
                                  onClick={() => openDetail(usuario)}
                                  className="p-2 rounded-lg border border-[#2B3050] hover:border-[#5B5FEF] hover:bg-[#1B2140] transition-all"
                              >
                                <Eye size={16}/>
                              </button>

                              <button
                                  type="button"
                                  onClick={() => openEditModal(usuario)}
                                  className="p-2 rounded-lg border border-[#2B3050] hover:border-[#2DD4BF] hover:bg-[#132C2A] transition-all"
                              >
                                <Pencil size={16}/>
                              </button>

                              <button
                                  type="button"
                                  onClick={() => handleDelete(usuario)}
                                  disabled={deleteMutation.isPending}
                                  className="p-2 rounded-lg border border-[#2B3050] hover:border-[#EF4444] hover:bg-[#2A1515] text-[#F87171] disabled:opacity-50 transition-all"
                              >
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            ) : (
                <div className="border border-dashed border-[#2B3050] rounded-2xl p-10 bg-[#121526] text-center">
                  <p className="text-sm text-[#9CA3AF]">
                    No hay usuarios que coincidan con los filtros.
                  </p>
                </div>
            )}

            <div className="flex items-center justify-between gap-3 mt-6">
              <div className="text-sm text-[#7C82A1]">
                Página {safePage} de {totalPages} · {filteredUsuarios.length} resultados
              </div>

              <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={safePage <= 1}
                    className="inline-flex items-center gap-1 px-4 py-2 border border-[#2B3050] rounded-xl bg-[#121526] hover:border-[#5B5FEF] disabled:opacity-50"
                >
                  <ChevronLeft size={16}/>
                  Prev
                </button>

                <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={safePage >= totalPages}
                    className="inline-flex items-center gap-1 px-4 py-2 border border-[#2B3050] rounded-xl bg-[#121526] hover:border-[#5B5FEF] disabled:opacity-50"
                >
                  Next
                  <ChevronRight size={16}/>
                </button>
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div
                className="bg-[#0E1120] border border-[#23263A] rounded-2xl p-6 shadow-[0_0_35px_rgba(91,95,239,0.08)]">
              <h2 className="text-xl font-semibold text-white mb-5">
                Top usuarios
              </h2>

              <div className="flex flex-col gap-3">
                {topFive.map((usuario) => (
                    <button
                        key={usuario.id}
                        type="button"
                        onClick={() => openDetail(usuario)}
                        className="text-left p-4 rounded-xl border border-[#23263A] bg-[#121526] hover:border-[#5B5FEF] transition-all"
                    >
                      <div className="font-medium text-white">
                        {usuario.nombre}
                      </div>

                      <div className="text-xs text-[#9CA3AF]">
                        {usuario.email}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[#D1D5DB]">
                    {levelLabel(usuario.nivel)}
                  </span>

                        <strong className="text-[#A78BFA]">
                          {getPoints(usuario)} pts
                        </strong>
                      </div>
                    </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
  );
}