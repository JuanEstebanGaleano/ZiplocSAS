export default function BilleteraCard({ billetera, selected, onSelect, onEdit }) {
    return (
        <article
            className={`
        flex items-center justify-between gap-4
        p-5 rounded-2xl border transition-all duration-200
        shadow-[0_0_30px_rgba(0,0,0,0.35)]
        ${
                selected
                    ? 'bg-[#111827] border-[#6366F1]'
                    : 'bg-[#0F172A] border-[#1E293B] hover:border-[#4F46E5] hover:bg-[#111827]'
            }
      `}
        >
            <button
                type="button"
                onClick={() => onSelect(billetera)}
                className="flex-1 text-left flex flex-col gap-2"
            >
                <div className="flex items-center justify-between gap-3">
          <span className="text-lg font-semibold text-[#F8FAFC]">
            {billetera.nombre}
          </span>

                    <span
                        className={`
              text-xs font-medium px-3 py-1 rounded-full border
              ${
                            String(billetera.estado || '').toLowerCase().includes('act')
                                ? 'bg-[#132033] text-[#60A5FA] border-[#2563EB]/40'
                                : 'bg-[#2A1633] text-[#C084FC] border-[#7C3AED]/40'
                        }
            `}
                    >
            {billetera.estado}
          </span>
                </div>

                <span className="text-sm text-[#94A3B8]">
          {billetera.tipo}
        </span>

                <span className="text-3xl font-bold text-[#F8FAFC] mt-1">
          $ {Number(billetera.saldo || 0).toLocaleString('es-CO')}
        </span>
            </button>

            <div className="flex items-center">
                <button
                    type="button"
                    onClick={() => onEdit(billetera)}
                    className="
            px-4 py-2 rounded-xl
            bg-[#4F46E5]
            text-white font-medium
            hover:bg-[#6366F1]
            transition-all duration-150
            shadow-[0_0_20px_rgba(99,102,241,0.35)]
          "
                >
                    Editar
                </button>
            </div>
        </article>
    );
}