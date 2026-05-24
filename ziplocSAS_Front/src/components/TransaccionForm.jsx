import SelectCustom from './SelectCustom';

const TRANSACTION_SEGMENTS = [
  { value: 'RECARGA', label: 'Recarga' },
  { value: 'RETIRO', label: 'Retiro' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

export default function TransaccionForm({
                                          form,
                                          errors,
                                          billeteras = [],
                                          loading = false,
                                          onChange,
                                          onSubmit,
                                          resultado
                                        }) {

  const showOrigin =
      form.tipo === 'RETIRO' ||
      form.tipo === 'TRANSFERENCIA';

  const showDestinationWallet =
      form.tipo === 'RECARGA' ||
      form.tipo === 'TRANSFERENCIA';

  const showExternalDestination = false;

  const walletOptions = billeteras.map((wallet) => ({
    value: String(wallet.id),
    label: `${wallet.nombre} - $ ${Number(wallet.saldo || 0).toLocaleString('es-CO')}`,
  }));

  function handleSegmentChange(value) {
    onChange({ target: { name: 'tipo', value } });
  }

  const inputStyles =
      "w-full p-3 bg-[#0F1118] border border-[#2A3042] rounded-2xl text-white placeholder:text-[#6B7280] outline-none transition-all duration-200 focus:border-[#6D5DF6] focus:ring-4 focus:ring-[#6D5DF6]/10 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
      <form
          className="flex flex-col gap-6"
          onSubmit={onSubmit}
          noValidate
      >

        {/* HEADER */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Nueva transacción
            </h2>

            <p className="text-sm text-[#9CA3AF] mt-2 leading-relaxed">
              Selecciona el tipo y completa
              <br />
              los campos requeridos.
            </p>
          </div>

          <span className="text-xs uppercase tracking-[0.2em] text-[#6D5DF6] font-semibold mt-1">
          Formulario
        </span>
        </div>

        {/* TIPO */}
        <div className="flex flex-col gap-3">

        <span className="text-sm font-medium text-[#C7CAD3]">
          Tipo de transacción
        </span>

          <div
              className="grid grid-cols-3 bg-[#0F1118] border border-[#2A3042] rounded-2xl overflow-hidden"
              role="tablist"
          >
            {TRANSACTION_SEGMENTS.map((segment) => {

              const isActive = form.tipo === segment.value;

              return (
                  <button
                      key={segment.value}
                      type="button"
                      onClick={() => handleSegmentChange(segment.value)}
                      disabled={loading}
                      className={`
                  py-3 px-3 text-sm font-semibold transition-all duration-200
                  border-r border-[#2A3042] last:border-r-0
                  ${
                          isActive
                              ? 'bg-gradient-to-r from-[#6D5DF6] to-[#8B7BFF] text-white shadow-lg'
                              : 'bg-transparent text-[#9CA3AF] hover:bg-[#171B27] hover:text-white'
                      }
                `}
                  >
                    {segment.label}
                  </button>
              );
            })}
          </div>

          {errors.tipo && (
              <span className="text-xs text-[#F87171]">
            {errors.tipo}
          </span>
          )}
        </div>

        {/* CAMPOS */}
        <div className="flex flex-col gap-5">

          {showOrigin && (
              <SelectCustom
                  label="Billetera origen"
                  name="billeteraOrigenId"
                  value={form.billeteraOrigenId}
                  options={walletOptions}
                  placeholder="Billetera origen"
                  onChange={onChange}
                  disabled={loading}
                  error={errors.billeteraOrigenId}
              />
          )}

          {showDestinationWallet && (
              <SelectCustom
                  label="Billetera destino"
                  name="billeteraDestinoId"
                  value={form.billeteraDestinoId}
                  options={walletOptions}
                  placeholder="Billetera destino"
                  onChange={onChange}
                  disabled={loading}
                  error={errors.billeteraDestinoId}
              />
          )}

          {showExternalDestination && (
              <div className="flex flex-col gap-2">

                <label
                    htmlFor="destinoExternoId"
                    className="text-sm font-medium text-[#C7CAD3]"
                >
                  ID externo del destino
                </label>

                <input
                    id="destinoExternoId"
                    name="destinoExternoId"
                    className={`
                ${inputStyles}
                ${
                        errors.destinoExternoId
                            ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/10'
                            : ''
                    }
              `}
                    value={form.destinoExternoId}
                    onChange={onChange}
                    placeholder="ID de billetera externa"
                    disabled={loading}
                />

                {errors.destinoExternoId && (
                    <span className="text-xs text-[#F87171]">
                {errors.destinoExternoId}
              </span>
                )}
              </div>
          )}

          {/* VALOR */}
          <div className="flex flex-col gap-2">

            <label
                htmlFor="valor"
                className="text-sm font-medium text-[#C7CAD3]"
            >
              Valor
            </label>

            <input
                id="valor"
                name="valor"
                type="text"
                inputMode="decimal"
                className={`
              ${inputStyles}
              text-lg font-semibold
              ${
                    errors.valor
                        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/10'
                        : ''
                }
            `}
                value={form.valor}
                onChange={onChange}
                placeholder="0.00"
                disabled={loading}
            />

            {errors.valor && (
                <span className="text-xs text-[#F87171]">
              {errors.valor}
            </span>
            )}
          </div>
        </div>

        {/* BOTON */}
        <button
            type="submit"
            disabled={loading || !form.tipo}
            className="
          w-full py-4 px-6 rounded-2xl
          bg-gradient-to-r from-[#6D5DF6] to-[#8B7BFF]
          hover:from-[#7C6BFF] hover:to-[#9C8DFF]
          text-white font-semibold text-base
          shadow-[0_10px_30px_rgba(109,93,246,0.35)]
          transition-all duration-200
          hover:scale-[1.01]
          active:scale-[0.99]
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        >
          {loading
              ? 'Procesando...'
              : 'Ejecutar operación'}
        </button>

        {resultado && (
            <div className="rounded-2xl border border-[#1F8F63] bg-[#10261D] px-4 py-3">
              <p className="text-sm font-medium text-[#4ADE80]">
                {resultado}
              </p>
            </div>
        )}
      </form>
  );
}