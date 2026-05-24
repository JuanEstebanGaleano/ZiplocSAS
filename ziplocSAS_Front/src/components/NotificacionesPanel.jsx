const dateFormatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
});

export default function NotificacionesPanel({ alertas = [] }) {
    return (
        <section className="bg-[#0B1120]/95 border border-[#1E293B] rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.08)] p-6 backdrop-blur-xl">

            <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                <h2 className="text-lg font-semibold text-[#F8FAFC]">
                    Notificaciones
                </h2>

                <span className="text-xs uppercase tracking-[0.2em] text-[#818CF8] font-medium">
          Alertas recientes
        </span>
            </div>

            {alertas.length ? (
                <div className="flex flex-col">

                    <div className="grid grid-cols-5 gap-4 pb-3 mb-2 border-b border-[#1E293B] text-xs uppercase tracking-[0.18em] text-[#64748B] font-semibold">
                        <div className="col-span-1">Tipo</div>
                        <div className="col-span-3">Mensaje</div>
                        <div className="col-span-1 text-right">Fecha</div>
                    </div>

                    {alertas.map((alerta) => (
                        <article
                            key={alerta.id}
                            className="
                grid grid-cols-5 gap-4 items-start
                py-4 border-b border-[#1E293B]
                last:border-b-0
                hover:bg-[#111827]
                transition-all duration-200
                px-3 -mx-3 rounded-xl
              "
                        >
                            <div className="text-sm font-semibold text-[#E2E8F0]">
                                {alerta.tipo}
                            </div>

                            <div className="col-span-3 text-sm text-[#94A3B8] leading-relaxed">
                                {alerta.mensaje}
                            </div>

                            <div className="text-xs text-[#6366F1] text-right font-medium">
                                {alerta.fecha
                                    ? dateFormatter.format(new Date(alerta.fecha))
                                    : 'Sin fecha'}
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="
          border border-dashed border-[#312E81]
          rounded-2xl
          p-5
          bg-[#111827]/80
        ">
                    <p className="text-sm text-[#94A3B8]">
                        No hay notificaciones disponibles.
                    </p>
                </div>
            )}
        </section>
    );
}