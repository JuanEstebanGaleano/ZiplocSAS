import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import { useBilleteras, useCrearBilletera, useActualizarBilletera } from '../hooks/useBilleteras';
import { useTransacciones } from '../hooks/useTransacciones';

const TIPOS_BILLETERA = [
  { label: "Ahorro", value: "AHORRO" },
  { label: "Ahorros", value: "AHORROS" },
  { label: "Gastos diarios", value: "GASTOS_DIARIOS" },
  { label: "Compras", value: "COMPRAS" },
  { label: "Transporte", value: "TRANSPORTE" },
  { label: "Corriente", value: "CORRIENTE" },
  { label: "Inversión", value: "INVERSION" },
  { label: "Crédito", value: "CREDITO" }
];

const ESTADOS_BILLETERA = [
  { label: "Activa", value: "ACTIVA" },
  { label: "Suspendida", value: "SUSPENDIDA" },
  { label: "Congelada", value: "CONGELADA" },
  { label: "Cerrada", value: "CERRADA" }
];

function initialCreateForm() {
  return { nombre: '', tipo: TIPOS_BILLETERA[0].value };
}

function initialEditForm() {
  return { nombre: '', estado: ESTADOS_BILLETERA[0].value };
}

function validateCreateForm(form) {
  const nextErrors = {};
  if (!form.nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio.';
  if (!form.tipo) nextErrors.tipo = 'Selecciona un tipo de billetera.';
  return nextErrors;
}

function validateEditForm(form) {
  const nextErrors = {};
  if (!form.nombre.trim()) nextErrors.nombre = 'El nombre no puede estar vacío.';
  if (!form.estado) nextErrors.estado = 'Selecciona un estado.';
  return nextErrors;
}

export default function Billeteras({ userId }) {
  // Hooks de React Query
  const billeterasQuery = useBilleteras(userId);
  const createMutation = useCrearBilletera();
  const updateMutation = useActualizarBilletera();
  
  // Estado local
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createForm, setCreateForm] = useState(initialCreateForm());
  const [createErrors, setCreateErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm());
  const [editErrors, setEditErrors] = useState({});

  // Get billeteras (normalize response)
  const billeteras = billeterasQuery.data?.billeteras || billeterasQuery.data || [];

  // Load transacciones para billetera seleccionada
  const transaccionesQuery = useTransacciones(selectedWallet?.id);
  const history = transaccionesQuery.data?.transacciones || transaccionesQuery.data || [];

  // Set first wallet as selected when billeteras load
  useEffect(() => {
    if (billeteras.length && !selectedWallet) {
      setSelectedWallet(billeteras[0]);
    }
  }, [billeteras]);

  function handleCreateChange(event) {
    const { name, value } = event.target;
    setCreateForm(current => ({ ...current, [name]: value }));
    setCreateErrors(current => ({ ...current, [name]: '' }));
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm(current => ({ ...current, [name]: value }));
    setEditErrors(current => ({ ...current, [name]: '' }));
  }

  function handleSelect(wallet) {
    setSelectedWallet(wallet);
    setSuccess('');
    setError('');
  }

  function handleEdit(wallet) {
    setEditId(wallet.id);
    setEditForm({ nombre: wallet.nombre || '', estado: wallet.estado || 'ACTIVA' });
    setEditErrors({});
    setSuccess('');
    setError('');
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();
    const nextErrors = validateCreateForm(createForm);
    setCreateErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await createMutation.mutateAsync({
        usuarioId: userId,
        nombre: createForm.nombre.trim(),
        tipo: createForm.tipo,
      });
      setCreateForm(initialCreateForm());
    } catch (err) {
      // Error handled by mutation
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    if (!editId) return;

    const nextErrors = validateEditForm(editForm);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await updateMutation.mutateAsync({
        id: editId,
        data: {
          nombre: editForm.nombre.trim(),
          estado: editForm.estado,
        },
      });
      setEditId(null);
      setEditForm(initialEditForm());
      // Refresh selected wallet
      const updatedWallet = billeteras.find(w => w.id === editId);
      if (updatedWallet) setSelectedWallet(updatedWallet);
    } catch (err) {
      // Error handled by mutation
    }
  }

  const inputStyles =
      "w-full p-3 bg-[#0F172A] border border-[#1E293B] rounded-md text-white outline-none transition-all duration-150 focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#7C3AED]/20 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
      <section className="flex flex-col lg:flex-row gap-6 items-start relative bg-[#020617] min-h-screen p-4">
        {(billeterasQuery.error || createMutation.error || updateMutation.error) && (
            <div className="absolute top-0 right-0 w-full lg:w-auto z-10">
              <AlertaPanel
                  type="error"
                  title="Atención"
                  message={
                      (billeterasQuery.error ||
                          createMutation.error ||
                          updateMutation.error)?.message ||
                      "Error al procesar operación"
                  }
              />
            </div>
        )}

        {(createMutation.isSuccess || updateMutation.isSuccess) && (
            <div className="absolute top-0 right-0 w-full lg:w-auto z-10">
              <AlertaPanel
                  type="success"
                  title="Operación exitosa"
                  message={
                    createMutation.isSuccess
                        ? "Billetera creada correctamente"
                        : "Billetera actualizada correctamente"
                  }
              />
            </div>
        )}

        {billeterasQuery.isLoading ? (
            <div className="w-full flex justify-center py-10">
              <LoadingSpinner />
            </div>
        ) : (
            <>
              {/* Panel Izquierdo */}
              <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-5">
                <div className="bg-[#0F172A] p-6 rounded-xl shadow-2xl border border-[#1E293B]">
                  <div className="flex justify-between items-baseline mb-4">
                    <h2 className="text-lg font-semibold text-white">
                      Nueva billetera
                    </h2>
                  </div>

                  <form
                      className="flex flex-col gap-4"
                      onSubmit={handleCreateSubmit}
                      noValidate
                  >
                    <div className="flex flex-col gap-2">
                      <label
                          htmlFor="nombre"
                          className="text-sm font-medium text-[#94A3B8]"
                      >
                        Nombre
                      </label>

                      <input
                          id="nombre"
                          name="nombre"
                          className={`${inputStyles} ${
                              createErrors.nombre
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                  : ""
                          }`}
                          value={createForm.nombre}
                          onChange={handleCreateChange}
                          placeholder="Ej. Ahorro principal"
                          disabled={createMutation.isPending}
                      />

                      {createErrors.nombre && (
                          <span className="text-xs text-red-400">
                    {createErrors.nombre}
                  </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 relative">
                      <label
                          htmlFor="tipo"
                          className="text-sm font-medium text-[#94A3B8]"
                      >
                        Tipo
                      </label>

                      <div className="relative">
                        <select
                            id="tipo"
                            name="tipo"
                            className={`${inputStyles} appearance-none pr-10 ${
                                createErrors.tipo
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : ""
                            }`}
                            value={createForm.tipo}
                            onChange={handleCreateChange}
                            disabled={createMutation.isPending}
                        >
                          {TIPOS_BILLETERA.map((tipo) => (
                              <option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </option>
                          ))}
                        </select>

                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#94A3B8]">
                          <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                          >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </div>
                      </div>

                      {createErrors.tipo && (
                          <span className="text-xs text-red-400">
                    {createErrors.tipo}
                  </span>
                      )}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={createMutation.isPending}
                    >
                      {createMutation.isPending
                          ? "Guardando..."
                          : "Crear billetera"}
                    </button>
                  </form>
                </div>

                {selectedWallet && (
                    <div className="bg-[#0F172A] p-6 rounded-xl shadow-2xl border border-[#1E293B]">
                      <div className="flex justify-between items-baseline mb-4">
                        <h2 className="text-lg font-semibold text-white">
                          Editar billetera
                        </h2>
                      </div>

                      {!editId && (
                          <p className="text-sm text-[#94A3B8] mb-4">
                            Selecciona una billetera de la lista para habilitar la
                            edición.
                          </p>
                      )}

                      <form
                          className="flex flex-col gap-4"
                          onSubmit={handleEditSubmit}
                          noValidate
                      >
                        <div className="flex flex-col gap-2">
                          <label
                              htmlFor="editNombre"
                              className="text-sm font-medium text-[#94A3B8]"
                          >
                            Nombre
                          </label>

                          <input
                              id="editNombre"
                              name="nombre"
                              className={`${inputStyles} ${
                                  editErrors.nombre
                                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                      : ""
                              }`}
                              value={editForm.nombre}
                              onChange={handleEditChange}
                              placeholder="Nuevo nombre"
                              disabled={updateMutation.isPending || !editId}
                          />

                          {editErrors.nombre && (
                              <span className="text-xs text-red-400">
                      {editErrors.nombre}
                    </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 relative">
                          <label
                              htmlFor="estado"
                              className="text-sm font-medium text-[#94A3B8]"
                          >
                            Estado
                          </label>

                          <div className="relative">
                            <select
                                id="estado"
                                name="estado"
                                className={`${inputStyles} appearance-none pr-10 ${
                                    editErrors.estado
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                        : ""
                                }`}
                                value={editForm.estado}
                                onChange={handleEditChange}
                                disabled={updateMutation.isPending || !editId}
                            >
                              {ESTADOS_BILLETERA.map((est) => (
                                  <option key={est.value} value={est.value}>
                                    {est.label}
                                  </option>
                              ))}
                            </select>

                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#94A3B8]">
                              <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                              >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                ></path>
                              </svg>
                            </div>
                          </div>

                          {editErrors.estado && (
                              <span className="text-xs text-red-400">
                      {editErrors.estado}
                    </span>
                          )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-gradient-to-r from-[#059669] to-[#2563EB] text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={updateMutation.isPending || !editId}
                        >
                          {updateMutation.isPending
                              ? "Guardando..."
                              : "Guardar cambios"}
                        </button>
                      </form>
                    </div>
                )}
              </div>

              {/* Panel Derecho */}
              <div className="flex-1 flex flex-col gap-5 min-w-0">
                {selectedWallet && (
                    <div className="bg-[#0F172A] p-6 rounded-xl shadow-2xl border border-[#1E293B]">
                      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                        <h2 className="text-lg font-semibold text-white">
                          Historial ({selectedWallet.nombre})
                        </h2>

                        <span className="text-xs uppercase tracking-wider text-[#94A3B8]">
        {transaccionesQuery.isLoading
            ? "Actualizando..."
            : "Últimos movimientos"}
      </span>
                      </div>

                      {transaccionesQuery.isLoading ? (
                          <div className="py-8 flex justify-center">
                            <LoadingSpinner />
                          </div>
                      ) : history.length ? (
                          <div className="flex flex-col">
                            <div className="grid grid-cols-4 gap-4 pb-3 mb-2 border-b border-[#1E293B] text-xs uppercase tracking-wider text-[#94A3B8] font-semibold">
                              <div className="col-span-1">Tipo</div>
                              <div className="col-span-1">Monto</div>
                              <div className="col-span-1">Estado</div>
                              <div className="col-span-1">Fecha</div>
                            </div>

                            {history.map((transaccion) => (
                                <div
                                    key={transaccion.id}
                                    className="grid grid-cols-4 gap-4 items-center py-4 border-b border-[#1E293B] last:border-b-0 hover:bg-[#111827] transition-colors duration-150 px-2 -mx-2 rounded-lg"
                                >
                                  <div className="font-medium text-white">
                                    {transaccion.tipo}
                                  </div>

                                  <div className="text-base font-bold text-[#38BDF8]">
                                    $ {Number(transaccion.valor || 0).toLocaleString("es-CO")}
                                  </div>

                                  <div className="text-sm text-[#A855F7]">
                                    {transaccion.estado}
                                  </div>

                                  <div className="text-sm text-[#94A3B8]">
                                    {transaccion.fecha || "Sin fecha"}
                                  </div>
                                </div>
                            ))}
                          </div>
                      ) : (
                          <div className="border border-dashed border-[#1E293B] rounded-md p-5 bg-[#020617] flex flex-col gap-2">
                            <p className="text-sm text-[#94A3B8]">
                              Esta billetera aún no registra transacciones.
                            </p>

                            <p className="text-xs text-[#64748B]">
                              Puedes ejecutar una operación desde la vista de transacciones.
                            </p>
                          </div>
                      )}
                    </div>
                )}
                <div className="bg-[#0F172A] p-6 rounded-xl shadow-2xl border border-[#1E293B]">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-white">
                      Billeteras del usuario
                    </h2>

                    <span className="text-xs uppercase tracking-wider text-[#94A3B8]">
                {billeteras.length} registros
              </span>
                  </div>

                  {billeteras.length ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {billeteras.map((wallet) => {
                          const isSelected = selectedWallet?.id === wallet.id;

                          return (
                              <article
                                  key={wallet.id}
                                  className={`p-4 border transition-all duration-150 cursor-pointer rounded-xl hover:bg-[#111827]
                      ${
                                      isSelected
                                          ? "border-[#7C3AED] bg-[#111827]"
                                          : "border-[#1E293B]"
                                  }`}
                                  onClick={() => handleSelect(wallet)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-semibold text-white">
                                      {wallet.nombre}
                                    </h3>

                                    <p className="text-sm text-[#94A3B8]">
                                      {TIPOS_BILLETERA.find(
                                          (t) => t.value === wallet.tipo
                                      )?.label || wallet.tipo}
                                    </p>
                                  </div>

                                  <span
                                      className={`text-xs px-2 py-1 rounded ${
                                          wallet.estado === "ACTIVA"
                                              ? "bg-green-500/20 text-green-400"
                                              : "bg-slate-500/20 text-slate-300"
                                      }`}
                                  >
                          {ESTADOS_BILLETERA.find(
                              (e) => e.value === wallet.estado
                          )?.label || wallet.estado}
                        </span>
                                </div>

                                <div className="flex justify-between items-end mt-4">
                                  <strong className="text-xl font-bold text-[#38BDF8]">
                                    ${" "}
                                    {Number(wallet.saldo || 0).toLocaleString("es-CO")}
                                  </strong>

                                  <button
                                      type="button"
                                      className="text-xs font-medium text-[#A855F7] hover:text-[#C084FC] transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(wallet);
                                      }}
                                  >
                                    Editar
                                  </button>
                                </div>
                              </article>
                          );
                        })}
                      </div>
                  ) : (
                      <div className="border border-dashed border-[#1E293B] rounded-md p-5 bg-[#020617] flex flex-col gap-2">
                        <p className="text-sm text-[#94A3B8]">
                          Aún no tienes billeteras creadas.
                        </p>

                        <p className="text-xs text-[#64748B]">
                          Crea una billetera en el panel izquierdo para comenzar.
                        </p>
                      </div>
                  )}
                </div>
              </div>
            </>
        )}
      </section>
  );
}