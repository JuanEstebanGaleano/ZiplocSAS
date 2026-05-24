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
    <section className="flex flex-col lg:flex-row gap-6 items-start relative">
      {error && <div className="absolute top-0 right-0 w-full lg:w-auto z-10"><AlertaPanel type="error" title="Operación no completada" message={error} /></div>}
      {success && <div className="absolute top-0 right-0 w-full lg:w-auto z-10"><AlertaPanel type="success" title="Operación exitosa" message={success} /></div>}
      {isLoading ? <div className="w-full flex justify-center py-10"><LoadingSpinner /></div> : (
        <>
          <div className="w-full lg:w-[380px] shrink-0">
            <TransaccionForm form={form} errors={errors} billeteras={wallets} loading={crearTransaccionMutation.isPending} onChange={handleChange} onSubmit={handleSubmit} resultado={success} />
          </div>

          <div className="flex-1 flex flex-col gap-5 min-w-0">
            <div className="bg-superficie p-6 rounded-md shadow-sutil border border-borde flex flex-col gap-6">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-lg font-semibold text-textoPrincipal">Historial de transacciones</h2>
                <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Consulta y reversión</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectCustom label="Billetera" name="walletHistory" value={selectedWalletId} options={wallets.map((wallet) => ({ value: String(wallet.id), label: wallet.nombre }))} placeholder="Selecciona una billetera" onChange={(event) => setSelectedWalletId(event.target.value)} disabled={loadingHistory || !wallets.length} />
                <SelectCustom label="Tipo" name="filterType" value={filterType} options={transactionTypeOptions} placeholder="Todos" onChange={(event) => setFilterType(event.target.value)} disabled={loadingHistory || !history.length} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-textoSecundario">Desde</label>
                    <input type="date" className="w-full p-3 bg-transparent border border-borde rounded-md text-textoPrincipal outline-none transition-all duration-150 focus:border-acento focus:ring-[3px] focus:ring-[#C47A44]/10 disabled:opacity-50" value={filterStart} onChange={(event) => setFilterStart(event.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-textoSecundario">Hasta</label>
                    <input type="date" className="w-full p-3 bg-transparent border border-borde rounded-md text-textoPrincipal outline-none transition-all duration-150 focus:border-acento focus:ring-[3px] focus:ring-[#C47A44]/10 disabled:opacity-50" value={filterEnd} onChange={(event) => setFilterEnd(event.target.value)} />
                  </div>
                </div>
              </div>

              {loadingHistory ? (
                <div className="py-8 flex justify-center"><LoadingSpinner /></div>
              ) : filteredHistory.length ? (
                <div className="flex flex-col mt-4">
                  <div className="grid grid-cols-5 gap-4 pb-3 mb-2 border-b border-borde text-xs uppercase tracking-wider text-textoSecundario font-semibold">
                    <div className="col-span-1">Tipo</div>
                    <div className="col-span-1">Monto</div>
                    <div className="col-span-1">Estado</div>
                    <div className="col-span-1">Fecha</div>
                    <div className="col-span-1 text-right">Acción</div>
                  </div>
                    <div className="flex flex-col">
                      {filteredHistory.map((transaccion) => (
                        <TransaccionItem key={transaccion.id} transaccion={{...transaccion, tipoLabel: TIPO_LABEL[transaccion.tipo] || transaccion.tipo, estadoLabel: ESTADO_LABEL[transaccion.estado] || transaccion.estado }} onRevert={handleRevert} loading={revertingId === transaccion.id} />
                      ))}
                    </div>
                </div>
              ) : (
                <div className="border border-dashed border-borde rounded-md p-5 bg-fondo flex flex-col gap-2 mt-2">
                  <p className="text-sm text-textoSecundario">No hay transacciones para los filtros seleccionados.</p>
                  <p className="text-xs text-textoSecundario">Ajusta el rango o el tipo para ver resultados.</p>
                </div>
              )}
            </div>

            <section className="bg-superficie p-6 rounded-md shadow-sutil border border-borde flex flex-col gap-5">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-lg font-semibold text-textoPrincipal">Operaciones programadas</h2>
                <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Calendario</span>
              </div>

              {scheduledOps.length ? (
                <div className="flex flex-col">
                  <div className="grid grid-cols-5 gap-4 pb-3 mb-2 border-b border-borde text-xs uppercase tracking-wider text-textoSecundario font-semibold">
                    <div className="col-span-2">Fecha de ejecucion</div>
                    <div className="col-span-1">Tipo</div>
                    <div className="col-span-1">Monto</div>
                    <div className="col-span-1 text-right">Estado</div>
                  </div>
                  {scheduledOps.map((op) => (
                    <article key={op.id} className="grid grid-cols-5 gap-4 items-center py-4 border-b border-borde last:border-b-0 hover:bg-fondo transition-colors duration-150 px-2 -mx-2 rounded">
                      <div className="col-span-2 text-sm text-textoSecundario">{op.executionDate}</div>
                      <div className="col-span-1 text-sm font-medium text-textoPrincipal">{TIPO_LABEL[op.type] || op.type}</div>
                      <div className="col-span-1 text-base font-bold text-textoPrincipal">$ {Number(op.amount || 0).toLocaleString('es-CO')}</div>
                      <div className="col-span-1 text-right text-xs font-semibold text-textoSecundario">{ESTADO_LABEL[op.status] || op.status}</div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-borde rounded-md p-5 bg-fondo">
                  <p className="text-sm text-textoSecundario">No hay operaciones programadas.</p>
                </div>
              )}
            </section>

            <UsuarioCard usuario={usuario} />

            <NotificacionesPanel alertas={notificationAlerts} />
          </div>
        </>
      )}
    </section>
  );
}