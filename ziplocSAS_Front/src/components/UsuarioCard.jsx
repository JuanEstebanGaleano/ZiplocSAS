const dateFormatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
});

export default function UsuarioCard({ usuario }) {
    const nivel = usuario?.nivel || 'Sin nivel';
    const puntos = usuario?.puntosAcumulados ?? 0;

    const fechaRegistro = usuario?.fechaRegistro
        ? dateFormatter.format(new Date(usuario.fechaRegistro))
        : 'Sin fecha registrada';

    return (
        <section className="
      bg-[#0B1120]/95
      border border-[#1E293B]
      rounded-2xl
      shadow-[0_0_30px_rgba(99,102,241,0.08)]
      p-6
      backdrop-blur-xl
    ">

            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <h2 className="text-lg font-semibold text-[#F8FAFC]">
                    Perfil del usuario
                </h2>

                <span className="
          text-xs uppercase tracking-[0.2em]
          text-[#818CF8]
          font-medium
        ">
          Detalle de cuenta
        </span>
            </div>

            {usuario ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <div className="flex flex-col gap-5">

                        <div className="
              bg-[#111827]
              border border-[#1E293B]
              rounded-xl
              p-4
            ">
              <span className="text-xs uppercase tracking-[0.18em] text-[#64748B]">
                Nombre
              </span>

                            <div className="text-base font-semibold text-[#F8FAFC] mt-2">
                                {usuario.nombre}
                            </div>
                        </div>

                        <div className="
              bg-[#111827]
              border border-[#1E293B]
              rounded-xl
              p-4
            ">
              <span className="text-xs uppercase tracking-[0.18em] text-[#64748B]">
                Email
              </span>

                            <div className="text-sm text-[#CBD5E1] break-all mt-2">
                                {usuario.email || 'Sin email registrado'}
                            </div>
                        </div>

                        <div className="
              bg-[#111827]
              border border-[#1E293B]
              rounded-xl
              p-4
            ">
              <span className="text-xs uppercase tracking-[0.18em] text-[#64748B]">
                Teléfono
              </span>

                            <div className="text-sm text-[#CBD5E1] mt-2">
                                {usuario.telefono || 'Sin telefono registrado'}
                            </div>
                        </div>

                    </div>

                    <div className="flex flex-col gap-5">

                        <div className="
              bg-[#111827]
              border border-[#1E293B]
              rounded-xl
              p-4
            ">
              <span className="text-xs uppercase tracking-[0.18em] text-[#64748B]">
                Nivel
              </span>

                            <div className="mt-3 inline-flex items-center px-4 py-2 rounded-full border border-[#4338CA] bg-[#1E1B4B] text-sm font-semibold text-[#C4B5FD]">
                                {nivel}
                            </div>
                        </div>

                        <div className="
              bg-[#111827]
              border border-[#1E293B]
              rounded-xl
              p-4
            ">
              <span className="text-xs uppercase tracking-[0.18em] text-[#64748B]">
                Puntos acumulados
              </span>

                            <div className="text-3xl font-bold text-[#818CF8] mt-2">
                                {puntos}
                            </div>
                        </div>

                        <div className="
              bg-[#111827]
              border border-[#1E293B]
              rounded-xl
              p-4
            ">
              <span className="text-xs uppercase tracking-[0.18em] text-[#64748B]">
                Fecha de registro
              </span>

                            <div className="text-sm text-[#CBD5E1] mt-2">
                                {fechaRegistro}
                            </div>
                        </div>

                    </div>

                </div>
            ) : (
                <div className="
          border border-dashed border-[#312E81]
          rounded-2xl
          p-5
          bg-[#111827]/80
        ">
                    <p className="text-sm text-[#94A3B8]">
                        No hay información del usuario disponible.
                    </p>
                </div>
            )}
        </section>
    );
}