import SelectCustom from './SelectCustom';

const TRANSACTION_SEGMENTS = [
  { value: 'RECARGA', label: 'Recarga' },
  { value: 'RETIRO', label: 'Retiro' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

export default function TransaccionForm({ form, errors, billeteras = [], loading = false, onChange, onSubmit, resultado }) {
  const showOrigin = form.tipo === 'RETIRO' || form.tipo === 'TRANSFERENCIA';
  const showDestinationWallet = form.tipo === 'RECARGA' || form.tipo === 'TRANSFERENCIA';
  const showExternalDestination = false;
  const walletOptions = billeteras.map((wallet) => ({
    value: String(wallet.id),
    label: `${wallet.nombre} - $ ${Number(wallet.saldo || 0).toLocaleString('es-CO')}`,
  }));

  function handleSegmentChange(value) {
    onChange({ target: { name: 'tipo', value } });
  }

  const inputStyles = "w-full p-3 bg-transparent border border-borde rounded-md text-textoPrincipal outline-none transition-all duration-150 focus:border-acento focus:ring-[3px] focus:ring-[#C47A44]/10 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <form className="glass-panel p-6 rounded-md shadow-flotante border border-borde flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div className="flex justify-between items-baseline mb-1">
        <div>
          <h2 className="text-lg font-semibold text-textoPrincipal">Nueva transacción</h2>
          <p className="text-sm text-textoSecundario mt-1">Selecciona el tipo y completa los campos requeridos.</p>
        </div>
        <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Formulario</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-textoSecundario">Tipo de transacción</span>
        <div className="flex border border-borde rounded-md overflow-hidden bg-fondo" role="tablist">
          {TRANSACTION_SEGMENTS.map((segment) => {
            const isActive = form.tipo === segment.value;
            return (
              <button
                key={segment.value}
                type="button"
                className={`flex-1 py-2 px-2 text-sm font-medium border-r border-borde last:border-r-0 transition-colors duration-150 ${isActive ? 'bg-textoSecundario text-superficie' : 'bg-transparent text-textoSecundario hover:bg-superficie hover:text-textoPrincipal'}`}
                onClick={() => handleSegmentChange(segment.value)}
                disabled={loading}
              >
                {segment.label}
              </button>
            );
          })}
        </div>
        {errors.tipo && <span className="text-xs text-error">{errors.tipo}</span>}
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4">
          {showOrigin && (
            <SelectCustom label="Billetera origen" name="billeteraOrigenId" value={form.billeteraOrigenId} options={walletOptions} placeholder="Billetera origen" onChange={onChange} disabled={loading} error={errors.billeteraOrigenId} />
          )}

          {showDestinationWallet && (
            <SelectCustom label="Billetera destino" name="billeteraDestinoId" value={form.billeteraDestinoId} options={walletOptions} placeholder="Billetera destino" onChange={onChange} disabled={loading} error={errors.billeteraDestinoId} />
          )}

          {showExternalDestination && (
            <div className="flex flex-col gap-2">
              <label htmlFor="destinoExternoId" className="text-sm font-medium text-textoSecundario">ID externo del destino</label>
              <input id="destinoExternoId" name="destinoExternoId" className={`${inputStyles} ${errors.destinoExternoId ? 'border-error focus:border-error focus:ring-[#B13E3E]/10' : ''}`} value={form.destinoExternoId} onChange={onChange} placeholder="ID de billetera externa" disabled={loading} />
              {errors.destinoExternoId && <span className="text-xs text-error">{errors.destinoExternoId}</span>}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="valor" className="text-sm font-medium text-textoSecundario">Valor</label>
            <input id="valor" name="valor" type="text" inputMode="decimal" className={`${inputStyles} ${errors.valor ? 'border-error focus:border-error focus:ring-[#B13E3E]/10' : ''}`} value={form.valor} onChange={onChange} placeholder="0.00" disabled={loading} />
            {errors.valor && <span className="text-xs text-error">{errors.valor}</span>}
          </div>
        </div>

        <div className="flex justify-start">
          <button type="submit" className="py-3 px-6 w-full bg-acento text-superficie font-medium rounded-md hover:bg-gradient-to-r hover:from-[#C47A44] hover:to-[#B86A38] transition-all duration-150 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || !form.tipo}>
            {loading ? 'Procesando...' : 'Ejecutar operación'}
          </button>
        </div>

        {resultado && <p className="text-sm font-medium text-exito">{resultado}</p>}
      </div>
    </form>
  );
}