const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export default function NotificacionesPanel({ alertas = [] }) {
  return (
    <section className="bg-superficie border border-borde rounded-md shadow-sutil p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-lg font-semibold">Notificaciones</h2>
        <span className="text-xs uppercase tracking-wider text-textoSecundario">Alertas recientes</span>
      </div>

      {alertas.length ? (
        <div className="flex flex-col">
          <div className="grid grid-cols-5 gap-4 pb-3 mb-2 border-b border-borde text-xs uppercase tracking-wider text-textoSecundario font-semibold">
            <div className="col-span-1">Tipo</div>
            <div className="col-span-3">Mensaje</div>
            <div className="col-span-1 text-right">Fecha</div>
          </div>
          {alertas.map((alerta) => (
            <article key={alerta.id} className="grid grid-cols-5 gap-4 items-start py-4 border-b border-borde last:border-b-0 hover:bg-fondo transition-colors duration-150 px-2 -mx-2 rounded">
              <div className="text-sm font-medium text-textoPrincipal">{alerta.tipo}</div>
              <div className="col-span-3 text-sm text-textoSecundario">{alerta.mensaje}</div>
              <div className="text-xs text-textoSecundario text-right">
                {alerta.fecha ? dateFormatter.format(new Date(alerta.fecha)) : 'Sin fecha'}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-borde rounded-md p-5 bg-fondo">
          <p className="text-sm text-textoSecundario">No hay notificaciones disponibles.</p>
        </div>
      )}
    </section>
  );
}
