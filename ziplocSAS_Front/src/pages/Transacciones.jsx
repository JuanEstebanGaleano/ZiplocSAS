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

const INITIAL_FORM = {
  tipo: '',
  billeteraOrigenId: '',
  billeteraDestinoId: '',
  destinoExternoId: '',
  valor: ''
};

const TIPO_LABEL = {
  RECARGA: 'Recarga',
  RETIRO: 'Retiro',
  TRANSFERENCIA: 'Transferencia',
  PAGO_PROGRAMADO: 'Pago programado'
};

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  COMPLETADA: 'Completada',
  FALLIDA: 'Fallida',
  CANCELADA: 'Cancelada',
  REVERTIDA: 'Revertida'
};

function buildErrors(form, billeteras) {
  const errors = {};
  const valueText = form.valor.trim();
  const parsedValue = Number(valueText);

  const originWallet = billeteras.find(
      (wallet) => String(wallet.id) === String(form.billeteraOrigenId)
  );

  if (!form.tipo) errors.tipo = 'Selecciona una operación.';

  if (!valueText) {
    errors.valor = 'El valor es obligatorio.';
  } else if (!/^\d+(\.\d{1,2})?$/.test(valueText)) {
    errors.valor = 'Máximo 2 decimales.';
  } else if (parsedValue <= 0) {
    errors.valor = 'Debe ser mayor a 0.';
  }

  if (
      (form.tipo === 'RETIRO' || form.tipo === 'TRANSFERENCIA') &&
      !form.billeteraOrigenId
  ) {
    errors.billeteraOrigenId = 'Selecciona una billetera origen.';
  }

  if (
      (form.tipo === 'RECARGA' || form.tipo === 'TRANSFERENCIA') &&
      !form.billeteraDestinoId
  ) {
    errors.billeteraDestinoId = 'Selecciona una billetera destino.';
  }

  if (
      form.tipo === 'TRANSFERENCIA' &&
      form.billeteraOrigenId &&
      form.billeteraDestinoId
  ) {
    if (
        String(form.billeteraOrigenId) ===
        String(form.billeteraDestinoId)
    ) {
      errors.billeteraDestinoId =
          'La billetera destino debe ser distinta.';
    }
  }

  if (
      originWallet &&
      (form.tipo === 'RETIRO' || form.tipo === 'TRANSFERENCIA') &&
      !errors.valor &&
      parsedValue > Number(originWallet.saldo || 0)
  ) {
    errors.valor = 'Saldo insuficiente.';
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

  const cyberCard =
      'bg-[#0A0F1F]/90 backdrop-blur-md border border-[#1A233A] rounded-2xl shadow-[0_0_25px_rgba(0,255,170,0.08)] p-6 relative overflow-hidden';

  const neonInput =
      'w-full p-3 bg-[#050816] border border-[#1D2A44] rounded-xl text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300';

  const billeterasQuery = useBilleteras(userId);

  const crearTransaccionMutation =
      useCrearTransaccion();

  const revertirTransaccionMutation =
      useRevertirTransaccion();

  const wallets =
      billeterasQuery.data?.billeteras ||
      billeterasQuery.data ||
      [];

  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(String(wallets[0].id));
    }
  }, [wallets]);

  const transaccionesQuery =
      useTransacciones(selectedWalletId || null);

  const history =
      transaccionesQuery.data?.transacciones ||
      transaccionesQuery.data ||
      [];

  useEffect(() => {
    let active = true;

    async function loadUsuario() {
      try {
        const response =
            await obtenerUsuarioPorId(userId);

        if (active) setUsuario(response || null);
      } catch {
        if (active) setUsuario(null);
      }
    }

    loadUsuario();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    setErrors(buildErrors(form, wallets));
  }, [form, wallets]);

  const transactionTypeOptions = Array.from(
      new Set(
          history
              .map((item) => item.tipo)
              .filter(Boolean)
      )
  ).map((tipo) => ({
    value: tipo,
    label: TIPO_LABEL[tipo] || tipo
  }));

  const filteredHistory = history.filter(
      (transaccion) => {
        if (
            filterType &&
            transaccion.tipo !== filterType
        )
          return false;

        if ((filterStart || filterEnd) && transaccion.fecha) {
          const transactionDate = new Date(
              transaccion.fecha
          );

          if (filterStart) {
            const startDate = new Date(
                `${filterStart}T00:00:00`
            );

            if (transactionDate < startDate)
              return false;
          }

          if (filterEnd) {
            const endDate = new Date(
                `${filterEnd}T23:59:59`
            );

            if (transactionDate > endDate)
              return false;
          }
        }

        return true;
      }
  );

  const notificationAlerts = [];

  const rejected = history.filter(
      (item) =>
          String(item.estado || '')
              .toLowerCase()
              .includes('rech') ||
          String(item.estado || '')
              .toLowerCase()
              .includes('fall')
  );

  rejected.slice(0, 3).forEach((item) => {
    notificationAlerts.push({
      id: `rech-${item.id}`,
      tipo: 'Transacción rechazada',
      mensaje: `La transacción ${item.tipo} por $ ${Number(
          item.valor || 0
      ).toLocaleString('es-CO')} fue rechazada.`,
      fecha: item.fecha
    });
  });

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
        billeteraDestinoId:
        form.billeteraDestinoId
      };
    }

    if (form.tipo === 'RETIRO') {
      payload = {
        tipo: 'RETIRO',
        valor: numericValue,
        billeteraOrigenId:
        form.billeteraOrigenId
      };
    }

    if (form.tipo === 'TRANSFERENCIA') {
      payload = {
        tipo: 'TRANSFERENCIA',
        valor: numericValue,
        billeteraOrigenId:
        form.billeteraOrigenId,
        billeteraDestinoId:
        form.billeteraDestinoId
      };
    }

    try {
      setSuccess('');
      setError('');

      await crearTransaccionMutation.mutateAsync(
          payload
      );

      setSuccess(
          'Operación realizada exitosamente.'
      );

      setForm(INITIAL_FORM);
    } catch (requestError) {
      setError(
          requestError?.message ||
          'No fue posible ejecutar la transacción.'
      );
    }
  }

  async function handleRevert(transaccionId) {
    try {
      setRevertingId(transaccionId);

      setError('');
      setSuccess('');

      await revertirTransaccionMutation.mutateAsync(
          transaccionId
      );

      setSuccess(
          'Transacción revertida exitosamente.'
      );
    } catch (requestError) {
      setError(
          requestError?.message ||
          'No fue posible revertir.'
      );
    } finally {
      setRevertingId(null);
    }
  }

  const isLoading =
      billeterasQuery.isLoading ||
      crearTransaccionMutation.isPending;

  const loadingHistory =
      transaccionesQuery.isLoading;

  const scheduledOps = [];

  return (
      <section className="relative flex flex-col lg:flex-row gap-6 items-start min-h-screen bg-[#050816] text-white p-6 overflow-hidden">

        {/* GRID BACKGROUND */}

        <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
              backgroundSize: '40px 40px'
            }}
        />

        {error && (
            <div className="absolute top-0 right-0 z-20">
              <AlertaPanel
                  type="error"
                  title="Error"
                  message={error}
              />
            </div>
        )}

        {success && (
            <div className="absolute top-0 right-0 z-20">
              <AlertaPanel
                  type="success"
                  title="Operación exitosa"
                  message={success}
              />
            </div>
        )}

        {isLoading ? (
            <div className="w-full flex justify-center py-20">
              <LoadingSpinner />
            </div>
        ) : (
            <>
              <div className="w-full lg:w-[380px] shrink-0 relative z-10">
                <TransaccionForm
                    form={form}
                    errors={errors}
                    billeteras={wallets}
                    loading={
                      crearTransaccionMutation.isPending
                    }
                    onChange={(event) => {
                      const { name, value } =
                          event.target;

                      setForm((current) => ({
                        ...current,
                        [name]: value
                      }));

                      setSuccess('');
                      setError('');
                    }}
                    onSubmit={handleSubmit}
                    resultado={success}
                />
              </div>

              <div className="flex-1 flex flex-col gap-6 min-w-0 relative z-10">

                {/* HISTORIAL */}

                <div className={cyberCard}>

                  <div className="flex justify-between items-center mb-8 flex-wrap gap-4">

                    <div className="flex flex-col gap-2">
                      <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white">
                        Historial
                      </h2>

                      <div className="w-20 h-[3px] bg-lime-400 rounded-full shadow-[0_0_20px_#B7FF00]" />
                    </div>

                    <span className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
                  Hash VS Lineal
                </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                    <SelectCustom
                        label="Billetera"
                        name="walletHistory"
                        value={selectedWalletId}
                        options={wallets.map((wallet) => ({
                          value: String(wallet.id),
                          label: wallet.nombre
                        }))}
                        placeholder="Selecciona"
                        onChange={(event) =>
                            setSelectedWalletId(
                                event.target.value
                            )
                        }
                    />

                    <SelectCustom
                        label="Tipo"
                        name="filterType"
                        value={filterType}
                        options={transactionTypeOptions}
                        placeholder="Todos"
                        onChange={(event) =>
                            setFilterType(
                                event.target.value
                            )
                        }
                    />

                    <div className="grid grid-cols-2 gap-3">

                      <input
                          type="date"
                          className={neonInput}
                          value={filterStart}
                          onChange={(event) =>
                              setFilterStart(
                                  event.target.value
                              )
                          }
                      />

                      <input
                          type="date"
                          className={neonInput}
                          value={filterEnd}
                          onChange={(event) =>
                              setFilterEnd(
                                  event.target.value
                              )
                          }
                      />
                    </div>
                  </div>

                  {loadingHistory ? (
                      <div className="py-10 flex justify-center">
                        <LoadingSpinner />
                      </div>
                  ) : filteredHistory.length ? (
                      <div className="flex flex-col">

                        <div className="grid grid-cols-5 gap-4 pb-4 border-b border-[#182338] text-[11px] uppercase tracking-[0.25em] text-cyan-400 font-black">

                          <div>Tipo</div>
                          <div>Monto</div>
                          <div>Estado</div>
                          <div>Fecha</div>
                          <div className="text-right">
                            Acción
                          </div>
                        </div>

                        <div className="flex flex-col mt-2">

                          {filteredHistory.map(
                              (transaccion) => (
                                  <div
                                      key={transaccion.id}
                                      className="hover:bg-[#0E1628] hover:shadow-[0_0_20px_rgba(0,255,255,0.08)] rounded-xl transition-all duration-300"
                                  >
                                    <TransaccionItem
                                        transaccion={{
                                          ...transaccion,
                                          tipoLabel:
                                              TIPO_LABEL[
                                                  transaccion.tipo
                                                  ] ||
                                              transaccion.tipo,
                                          estadoLabel:
                                              ESTADO_LABEL[
                                                  transaccion.estado
                                                  ] ||
                                              transaccion.estado
                                        }}
                                        onRevert={handleRevert}
                                        loading={
                                            revertingId ===
                                            transaccion.id
                                        }
                                    />
                                  </div>
                              )
                          )}
                        </div>
                      </div>
                  ) : (
                      <div className="border border-dashed border-[#23314D] rounded-2xl p-6 bg-[#070B17]">
                        <p className="text-gray-400">
                          No hay transacciones.
                        </p>
                      </div>
                  )}
                </div>

                {/* OPERACIONES */}

                <section className={cyberCard}>

                  <div className="flex justify-between items-center mb-8 flex-wrap gap-4">

                    <div className="flex flex-col gap-2">
                      <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white">
                        Operaciones Programadas
                      </h2>

                      <div className="w-20 h-[3px] bg-cyan-400 rounded-full shadow-[0_0_20px_#00D9FF]" />
                    </div>

                    <span className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
                  Tiempo Real
                </span>
                  </div>

                  <div className="border border-dashed border-[#23314D] rounded-2xl p-6 bg-[#070B17]">
                    <p className="text-gray-400">
                      No hay operaciones programadas.
                    </p>
                  </div>
                </section>

                <div className={cyberCard}>
                  <UsuarioCard usuario={usuario} />
                </div>

                <div className={cyberCard}>
                  <NotificacionesPanel
                      alertas={notificationAlerts}
                  />
                </div>
              </div>
            </>
        )}
      </section>
  );
}