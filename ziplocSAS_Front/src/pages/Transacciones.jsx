import { useState, useEffect } from 'react';
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

const INITIAL_FORM = { tipo: '', billeteraOrigenId: '', billeteraDestinoId: '', destinoExternoId: '', valor: '' };

const TIPO_LABEL = {
  'RECARGA': 'Recarga',
  'RETIRO': 'Retiro',
  'TRANSFERENCIA': 'Transferencia',
  'PAGO_PROGRAMADO': 'Pago programado'
};

const ESTADO_LABEL = {
  'PENDIENTE': 'Pendiente',
  'COMPLETADA': 'Completada',
  'FALLIDA': 'Fallida',
  'CANCELADA': 'Cancelada',
  'REVERTIDA': 'Revertida'
};

function buildErrors(form, billeteras) {
  const errors = {};
  const valueText = form.valor.trim();
  const parsedValue = Number(valueText);
  const originWallet = billeteras.find((wallet) => String(wallet.id) === String(form.billeteraOrigenId));

  if (!form.tipo) errors.tipo = 'Selecciona una operación.';
  if (!valueText) errors.valor = 'El valor es obligatorio.';
  else if (!/^\d+(\.\d{1,2})?$/.test(valueText)) errors.valor = 'El valor debe tener máximo 2 decimales.';
  else if (parsedValue <= 0) errors.valor = 'El valor debe ser mayor a 0.';

  if ((form.tipo === 'RETIRO' || form.tipo === 'TRANSFERENCIA') && !form.billeteraOrigenId) {
    errors.billeteraOrigenId = 'Selecciona una billetera origen.';
  }

  if ((form.tipo === 'RECARGA' || form.tipo === 'TRANSFERENCIA') && !form.billeteraDestinoId) {
    errors.billeteraDestinoId = 'Selecciona una billetera destino.';
  }

  if (form.tipo === 'TRANSFERENCIA' && form.billeteraOrigenId && form.billeteraDestinoId) {
    if (String(form.billeteraOrigenId) === String(form.billeteraDestinoId)) {
      errors.billeteraDestinoId = 'La billetera destino debe ser distinta a la de origen.';
    }
  }

  if (originWallet && (form.tipo === 'RETIRO' || form.tipo === 'TRANSFERENCIA') && !errors.valor && parsedValue > Number(originWallet.saldo || 0)) {
    errors.valor = 'Saldo insuficiente para la operación.';
  }
  return errors;
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

  // Hooks
  const billeterasQuery = useBilleteras(userId);
  const crearTransaccionMutation = useCrearTransaccion();
  const revertirTransaccionMutation = useRevertirTransaccion();

  // Get wallets
  const wallets = billeterasQuery.data?.billeteras || billeterasQuery.data || [];

  // Set first wallet as selected on load
  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(String(wallets[0].id));
    }
  }, [wallets]);

  // Get transacciones for selected wallet
  const transaccionesQuery = useTransacciones(selectedWalletId || null);
  const history = transaccionesQuery.data?.transacciones || transaccionesQuery.data || [];

  // Load usuario
  useEffect(() => {
    let active = true;
    async function loadUsuario() {
      try {
        const response = await obtenerUsuarioPorId(userId);
        if (active) setUsuario(response || null);
      } catch {
        if (active) setUsuario(null);
      }
    }
    loadUsuario();
    return () => { active = false; };
  }, [userId]);

  // Update errors when form/wallets change
  useEffect(() => {
    setErrors(buildErrors(form, wallets));
  }, [form, wallets]);

  const transactionTypeOptions = Array.from(new Set(history.map((item) => item.tipo).filter(Boolean)))
    .map((tipo) => ({ value: tipo, label: TIPO_LABEL[tipo] || tipo }));

  const filteredHistory = history.filter((transaccion) => {
    if (filterType && transaccion.tipo !== filterType) return false;
    if ((filterStart || filterEnd) && transaccion.fecha) {
      const transactionDate = new Date(transaccion.fecha);
      if (filterStart) {
        const startDate = new Date(`${filterStart}T00:00:00`);
        if (transactionDate < startDate) return false;
      }
      if (filterEnd) {
        const endDate = new Date(`${filterEnd}T23:59:59`);
        if (transactionDate > endDate) return false;
      }
    }
    return true;
  });

  const notificationAlerts = [];
  const rejected = history.filter((item) => String(item.estado || '').toLowerCase().includes('rech') || String(item.estado || '').toLowerCase().includes('fall'));
  rejected.slice(0, 3).forEach((item) => {
    notificationAlerts.push({
      id: `rech-${item.id}`,
      tipo: 'Transaccion rechazada',
      mensaje: `La transaccion ${item.tipo} por $ ${Number(item.valor || 0).toLocaleString('es-CO')} fue rechazada.`,
      fecha: item.fecha,
    });
  });

  const reversed = history.filter((item) => String(item.estado || '').toLowerCase().includes('revert'));
  reversed.slice(0, 2).forEach((item) => {
    notificationAlerts.push({
      id: `rev-${item.id}`,
      tipo: 'Transaccion revertida',
      mensaje: `Se revirtio la transaccion ${item.tipo} por $ ${Number(item.valor || 0).toLocaleString('es-CO')}.`,
      fecha: item.fecha,
    });
  });

  const risky = history.find((item) => String(item.nivelRiesgo || item.riesgo || '').toLowerCase().includes('alto'));
  if (risky) {
    notificationAlerts.push({
      id: `risk-${risky.id}`,
      tipo: 'Actividad sospechosa',
      mensaje: `Se detecto riesgo alto en una transaccion ${risky.tipo}.`,
      fecha: risky.fecha,
    });
  }

  const selectedWallet = wallets.find((wallet) => String(wallet.id) === String(selectedWalletId));
  if (selectedWallet && Number(selectedWallet.saldo || 0) <= 50) {
    notificationAlerts.push({
      id: `saldo-${selectedWallet.id}`,
      tipo: 'Saldo bajo',
      mensaje: `La billetera ${selectedWallet.nombre} tiene saldo bajo.`,
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSuccess('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = buildErrors(form, wallets);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    let payload = {};
    const numericValue = Number(form.valor);

    if (form.tipo === 'RECARGA') {
      payload = {
        tipo: 'RECARGA',
        valor: numericValue,
        billeteraDestinoId: form.billeteraDestinoId,
      };
    } else if (form.tipo === 'RETIRO') {
      payload = {
        tipo: 'RETIRO',
        valor: numericValue,
        billeteraOrigenId: form.billeteraOrigenId,
      };
    } else if (form.tipo === 'TRANSFERENCIA') {
      payload = {
        tipo: 'TRANSFERENCIA',
        valor: numericValue,
        billeteraOrigenId: form.billeteraOrigenId,
        billeteraDestinoId: form.billeteraDestinoId,
      };
    }

    try {
      setSuccess('');
      setError('');
      await crearTransaccionMutation.mutateAsync(payload);
      setSuccess('Operación realizada exitosamente.');
      setForm(INITIAL_FORM);
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible ejecutar la transacción.');
    }
  }

  async function handleRevert(transaccionId) {
    try {
      setRevertingId(transaccionId);
      setError('');
      setSuccess('');
      await revertirTransaccionMutation.mutateAsync(transaccionId);
      setSuccess('Transacción revertida exitosamente.');
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible revertir la transacción.');
    } finally {
      setRevertingId(null);
    }
  }

  const isLoading = billeterasQuery.isLoading || crearTransaccionMutation.isPending;
  const loadingHistory = transaccionesQuery.isLoading;
  const scheduledOps = [];

  return (
      <section className="flex flex-col lg:flex-row gap-6 items-start relative text-[#F5F5F7]">
        {error && (
            <div className="absolute top-0 right-0 w-full lg:w-auto z-10">
              <AlertaPanel
                  type="error"
                  title="Operación no completada"
                  message={error}
              />
            </div>
        )}

        {success && (
            <div className="absolute top-0 right-0 w-full lg:w-auto z-10">
              <AlertaPanel
                  type="success"
                  title="Operación exitosa"
                  message={success}
              />
            </div>
        )}

        {isLoading ? (
            <div className="w-full flex justify-center py-10">
              <LoadingSpinner />
            </div>
        ) : (
            <>
              <div className="w-full lg:w-[380px] shrink-0">
                <div className="bg-[#0F1118] border border-[#232633] rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.45)] overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#6D5DF6] via-[#8B7BFF] to-[#33E1C9]" />
                  <div className="p-5">
                    <TransaccionForm
                        form={form}
                        errors={errors}
                        billeteras={wallets}
                        loading={crearTransaccionMutation.isPending}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                        resultado={success}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-5 min-w-0">

                {/* HISTORIAL */}
                <div className="bg-[#0F1118] p-6 rounded-3xl border border-[#232633] shadow-[0_0_40px_rgba(0,0,0,0.45)] flex flex-col gap-6">

                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Historial de transacciones
                      </h2>
                      <p className="text-sm text-[#8D91A3] mt-1">
                        Consulta y reversión
                      </p>
                    </div>

                    <span className="text-xs uppercase tracking-[0.2em] text-[#6D5DF6] font-semibold">
                Wallet Activity
              </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div className="bg-[#151823] border border-[#262B3B] rounded-2xl p-1">
                      <SelectCustom
                          label="Billetera"
                          name="walletHistory"
                          value={selectedWalletId}
                          options={wallets.map((wallet) => ({
                            value: String(wallet.id),
                            label: wallet.nombre
                          }))}
                          placeholder="Selecciona una billetera"
                          onChange={(event) =>
                              setSelectedWalletId(event.target.value)
                          }
                          disabled={loadingHistory || !wallets.length}
                      />
                    </div>

                    <div className="bg-[#151823] border border-[#262B3B] rounded-2xl p-1">
                      <SelectCustom
                          label="Tipo"
                          name="filterType"
                          value={filterType}
                          options={transactionTypeOptions}
                          placeholder="Todos"
                          onChange={(event) =>
                              setFilterType(event.target.value)
                          }
                          disabled={loadingHistory || !history.length}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#B3B7C8]">
                          Desde
                        </label>

                        <input
                            type="date"
                            className="w-full p-3 bg-[#151823] border border-[#262B3B] rounded-2xl text-white outline-none transition-all duration-200 focus:border-[#6D5DF6] focus:ring-4 focus:ring-[#6D5DF6]/10"
                            value={filterStart}
                            onChange={(event) =>
                                setFilterStart(event.target.value)
                            }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#B3B7C8]">
                          Hasta
                        </label>

                        <input
                            type="date"
                            className="w-full p-3 bg-[#151823] border border-[#262B3B] rounded-2xl text-white outline-none transition-all duration-200 focus:border-[#33E1C9] focus:ring-4 focus:ring-[#33E1C9]/10"
                            value={filterEnd}
                            onChange={(event) =>
                                setFilterEnd(event.target.value)
                            }
                        />
                      </div>
                    </div>
                  </div>

                  {loadingHistory ? (
                      <div className="py-8 flex justify-center">
                        <LoadingSpinner />
                      </div>
                  ) : filteredHistory.length ? (
                      <div className="flex flex-col mt-2">

                        <div className="grid grid-cols-5 gap-4 pb-4 mb-3 border-b border-[#232633] text-xs uppercase tracking-[0.2em] text-[#7F859B] font-semibold">
                          <div className="col-span-1">Tipo</div>
                          <div className="col-span-1">Monto</div>
                          <div className="col-span-1">Estado</div>
                          <div className="col-span-1">Fecha</div>
                          <div className="col-span-1 text-right">Acción</div>
                        </div>

                        <div className="flex flex-col gap-3">
                          {filteredHistory.map((transaccion) => (
                              <div
                                  key={transaccion.id}
                                  className="bg-[#151823] border border-[#232633] rounded-2xl px-3 hover:border-[#6D5DF6] transition-all duration-200"
                              >
                                <TransaccionItem
                                    transaccion={{
                                      ...transaccion,
                                      tipoLabel:
                                          TIPO_LABEL[transaccion.tipo] ||
                                          transaccion.tipo,
                                      estadoLabel:
                                          ESTADO_LABEL[transaccion.estado] ||
                                          transaccion.estado
                                    }}
                                    onRevert={handleRevert}
                                    loading={revertingId === transaccion.id}
                                />
                              </div>
                          ))}
                        </div>
                      </div>
                  ) : (
                      <div className="border border-dashed border-[#2B3145] rounded-3xl p-6 bg-[#131620] flex flex-col gap-2">
                        <p className="text-sm text-[#B3B7C8]">
                          No hay transacciones para los filtros seleccionados.
                        </p>

                        <p className="text-xs text-[#7F859B]">
                          Ajusta el rango o el tipo para ver resultados.
                        </p>
                      </div>
                  )}
                </div>

                {/* PROGRAMADAS */}
                <section className="bg-[#0F1118] p-6 rounded-3xl border border-[#232633] shadow-[0_0_40px_rgba(0,0,0,0.45)] flex flex-col gap-5">

                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Operaciones programadas
                      </h2>

                      <p className="text-sm text-[#8D91A3] mt-1">
                        Calendario
                      </p>
                    </div>

                    <span className="text-xs uppercase tracking-[0.2em] text-[#33E1C9] font-semibold">
                Schedule
              </span>
                  </div>

                  {scheduledOps.length ? (
                      <div className="flex flex-col">

                        <div className="grid grid-cols-5 gap-4 pb-4 mb-3 border-b border-[#232633] text-xs uppercase tracking-[0.2em] text-[#7F859B] font-semibold">
                          <div className="col-span-2">
                            Fecha de ejecución
                          </div>

                          <div className="col-span-1">Tipo</div>
                          <div className="col-span-1">Monto</div>
                          <div className="col-span-1 text-right">
                            Estado
                          </div>
                        </div>

                        {scheduledOps.map((op) => (
                            <article
                                key={op.id}
                                className="grid grid-cols-5 gap-4 items-center py-4 border-b border-[#232633] last:border-b-0 hover:bg-[#151823] transition-all duration-200 px-3 -mx-3 rounded-2xl"
                            >
                              <div className="col-span-2 text-sm text-[#B3B7C8]">
                                {op.executionDate}
                              </div>

                              <div className="col-span-1 text-sm font-medium text-white">
                                {TIPO_LABEL[op.type] || op.type}
                              </div>

                              <div className="col-span-1 text-base font-bold text-[#33E1C9]">
                                $ {Number(op.amount || 0).toLocaleString('es-CO')}
                              </div>

                              <div className="col-span-1 text-right text-xs font-semibold text-[#8D91A3]">
                                {ESTADO_LABEL[op.status] || op.status}
                              </div>
                            </article>
                        ))}
                      </div>
                  ) : (
                      <div className="border border-dashed border-[#2B3145] rounded-3xl p-6 bg-[#131620]">
                        <p className="text-sm text-[#B3B7C8]">
                          No hay operaciones programadas.
                        </p>
                      </div>
                  )}
                </section>

                {/* CARDS */}
                {/* CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* NOTIFICACIONES IZQUIERDA */}
                  <div className="bg-[#0F1118] border border-[#232633] rounded-3xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
                    <NotificacionesPanel alertas={notificationAlerts} />
                  </div>

                  {/* PERFIL DERECHA */}
                  <div className="bg-[#0F1118] border border-[#232633] rounded-3xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
                    <UsuarioCard usuario={usuario} />
                  </div>

                </div>
              </div>
            </>
        )}
      </section>
  );
}