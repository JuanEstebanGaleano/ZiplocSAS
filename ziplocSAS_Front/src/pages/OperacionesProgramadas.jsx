import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import SelectCustom from '../components/SelectCustom';
import { useBilleteras } from '../hooks/useBilleteras';
import { useOperacionesProgramadas, useOperacionesProcesadas, useCrearOperacionProgramada, useProcesarOperacion } from '../hooks/useOperacionesProgramadas';

const TIPOS_OPERACION = ['RECARGA', 'RETIRO', 'TRANSFERENCIA', 'PAGO_PROGRAMADO'];
const PRIORIDADES = [1, 2, 3, 4, 5];

const initialForm = () => ({
  tipo: 'RECARGA',
  valor: '',
  billeteraOrigenId: '',
  billeteraDestinoId: '',
  descripcion: '',
  prioridad: 3,
  fechaEjecucion: '',
});

const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export default function OperacionesProgramadas({ userId }) {
  const [form, setForm] = useState(initialForm());
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const billeterasQuery = useBilleteras(userId);
  const operacionesQuery = useOperacionesProgramadas(userId);
  const operacionesProcessadasQuery = useOperacionesProcesadas(userId);
  const crearMutation = useCrearOperacionProgramada();
  const procesarMutation = useProcesarOperacion();

  const billeteras = billeterasQuery.data?.billeteras || billeterasQuery.data || [];
  const operaciones = operacionesQuery.data?.operaciones || operacionesQuery.data || [];
  const procesadas = operacionesProcessadasQuery.data?.operaciones || operacionesProcessadasQuery.data || [];

  function validateForm() {
    const nextErrors = {};
    if (!form.tipo) nextErrors.tipo = 'Selecciona un tipo de operación';
    if (!form.valor || Number(form.valor) <= 0) nextErrors.valor = 'Ingresa un valor válido';
    if (!form.fechaEjecucion) nextErrors.fechaEjecucion = 'Selecciona una fecha de ejecución';
    if (!form.billeteraDestinoId) nextErrors.billeteraDestinoId = 'Selecciona una billetera destino';
    if ((form.tipo === 'TRANSFERENCIA' || form.tipo === 'RETIRO') && !form.billeteraOrigenId) {
      nextErrors.billeteraOrigenId = 'Selecciona una billetera origen';
    }
    return nextErrors;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await crearMutation.mutateAsync({
        tipo: form.tipo,
        valor: Number(form.valor),
        billeteraOrigenId: form.billeteraOrigenId || undefined,
        billeteraDestinoId: form.billeteraDestinoId,
        descripcion: form.descripcion.trim(),
        prioridad: Number(form.prioridad),
        fechaEjecucion: form.fechaEjecucion,
      });
      setSuccess('Operación programada exitosamente');
      setForm(initialForm());
      setErrors({});
    } catch (err) {
      setError(err?.message || 'Error al crear operación');
    }
  }

  async function handleProcesarLote() {
    try {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const hasta = now.toISOString().split('.')[0];
      
      await procesarMutation.mutateAsync(hasta);
      setSuccess('Operaciones procesadas exitosamente');
    } catch (err) {
      setError(err?.message || 'Error al procesar operaciones');
    }
  }

  const inputStyles = 'w-full p-3 bg-transparent border border-borde rounded-md text-textoPrincipal outline-none transition-all duration-150 focus:border-acento focus:ring-[3px] focus:ring-[#C47A44]/10 disabled:opacity-50';

  return (
    <section className="flex flex-col lg:flex-row gap-6 items-start">
      {error && <div className="absolute top-0 right-0 w-full lg:w-auto z-10"><AlertaPanel type="error" title="Error" message={error} /></div>}
      {success && <div className="absolute top-0 right-0 w-full lg:w-auto z-10"><AlertaPanel type="success" title="Éxito" message={success} /></div>}

      <div className="w-full lg:w-[380px] shrink-0">
        <div className="bg-superficie border border-borde rounded-md shadow-sutil p-6">
          <h2 className="text-lg font-semibold mb-6 text-textoPrincipal">Programar operación</h2>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-textoSecundario">Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className={`${inputStyles} ${errors.tipo ? 'border-error' : ''}`}
              >
                {TIPOS_OPERACION.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.tipo && <span className="text-xs text-error">{errors.tipo}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-textoSecundario">Valor</label>
              <input
                type="number"
                name="valor"
                value={form.valor}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                disabled={crearMutation.isPending}
                className={`${inputStyles} ${errors.valor ? 'border-error' : ''}`}
              />
              {errors.valor && <span className="text-xs text-error">{errors.valor}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-textoSecundario">Billetera destino</label>
              <select
                name="billeteraDestinoId"
                value={form.billeteraDestinoId}
                onChange={handleChange}
                disabled={crearMutation.isPending}
                className={`${inputStyles} ${errors.billeteraDestinoId ? 'border-error' : ''}`}
              >
                <option value="">Selecciona...</option>
                {billeteras.map((w) => (
                  <option key={w.id} value={w.id}>{w.nombre}</option>
                ))}
              </select>
              {errors.billeteraDestinoId && <span className="text-xs text-error">{errors.billeteraDestinoId}</span>}
            </div>

            {(form.tipo === 'TRANSFERENCIA' || form.tipo === 'RETIRO') && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-textoSecundario">Billetera origen</label>
                <select
                  name="billeteraOrigenId"
                  value={form.billeteraOrigenId}
                  onChange={handleChange}
                  disabled={crearMutation.isPending}
                  className={`${inputStyles} ${errors.billeteraOrigenId ? 'border-error' : ''}`}
                >
                  <option value="">Selecciona...</option>
                  {billeteras.map((w) => (
                    <option key={w.id} value={w.id}>{w.nombre}</option>
                  ))}
                </select>
                {errors.billeteraOrigenId && <span className="text-xs text-error">{errors.billeteraOrigenId}</span>}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-textoSecundario">Fecha de ejecución</label>
              <input
                type="datetime-local"
                name="fechaEjecucion"
                value={form.fechaEjecucion}
                onChange={handleChange}
                disabled={crearMutation.isPending}
                className={`${inputStyles} ${errors.fechaEjecucion ? 'border-error' : ''}`}
              />
              {errors.fechaEjecucion && <span className="text-xs text-error">{errors.fechaEjecucion}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-textoSecundario">Prioridad</label>
              <select
                name="prioridad"
                value={form.prioridad}
                onChange={handleChange}
                disabled={crearMutation.isPending}
                className={inputStyles}
              >
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-textoSecundario">Descripción (opcional)</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Notas..."
                disabled={crearMutation.isPending}
                rows="3"
                className={`${inputStyles} resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={crearMutation.isPending}
              className="w-full py-3 px-4 bg-acento text-superficie font-medium rounded-md hover:bg-acentoHover transition-colors disabled:opacity-50"
            >
              {crearMutation.isPending ? 'Creando...' : 'Programar'}
            </button>
          </form>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5 min-w-0">
        <div className="bg-superficie border border-borde rounded-md shadow-sutil p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-textoPrincipal">Pendientes</h2>
            {operaciones.length > 0 && (
              <button
                type="button"
                onClick={handleProcesarLote}
                disabled={procesarMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-acento text-superficie rounded-md hover:bg-acentoHover transition-colors disabled:opacity-50"
              >
                {procesarMutation.isPending ? 'Procesando...' : 'Procesar hasta ahora'}
              </button>
            )}
          </div>
          {operacionesQuery.isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : operaciones.length ? (
            <div className="flex flex-col gap-3">
              {operaciones.map((op) => (
                <div key={op.id} className="p-4 border border-borde rounded-md bg-fondo hover:border-acento transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-textoPrincipal">{op.tipo}</h3>
                      <p className="text-sm text-textoSecundario mt-1">$ {Number(op.valor).toLocaleString('es-CO')}</p>
                      {op.descripcion && <p className="text-xs text-textoSecundario mt-1">{op.descripcion}</p>}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-acento/10 text-acento rounded">Prioridad: {op.prioridad}</span>
                        <span className="text-xs px-2 py-1 bg-textoSecundario/10 text-textoSecundario rounded">
                          {dateFormatter.format(new Date(op.fechaEjecucion))}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textoSecundario text-center py-8">No hay operaciones pendientes</p>
          )}
        </div>

        <div className="bg-superficie border border-borde rounded-md shadow-sutil p-6">
          <h2 className="text-lg font-semibold mb-4 text-textoPrincipal">Procesadas</h2>
          {operacionesProcessadasQuery.isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : procesadas.length ? (
            <div className="flex flex-col gap-3">
              {procesadas.map((op) => (
                <div key={op.id} className="p-4 border border-borde rounded-md bg-fondo/50 opacity-75">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-textoSecundario">{op.tipo}</h3>
                      <p className="text-sm text-textoSecundario mt-1">$ {Number(op.valor).toLocaleString('es-CO')}</p>
                      <span className="text-xs px-2 py-1 bg-exito/10 text-exito rounded inline-block mt-2">
                        {op.estado || 'EJECUTADA'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textoSecundario text-center py-8">No hay operaciones procesadas</p>
          )}
        </div>
      </div>
    </section>
  );
}
