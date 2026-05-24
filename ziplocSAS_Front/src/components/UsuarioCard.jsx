const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export default function UsuarioCard({ usuario }) {
  const nivel = usuario?.nivel || 'Sin nivel';
  const puntos = usuario?.puntosAcumulados ?? 0;
  const fechaRegistro = usuario?.fechaRegistro ? dateFormatter.format(new Date(usuario.fechaRegistro)) : 'Sin fecha registrada';

  return (
    <section className="bg-superficie border border-borde rounded-md shadow-sutil p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-lg font-semibold">Perfil del usuario</h2>
        <span className="text-xs uppercase tracking-wider text-textoSecundario">Detalle de cuenta</span>
      </div>

      {usuario ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-textoSecundario">Nombre</span>
              <div className="text-base font-semibold text-textoPrincipal">{usuario.nombre}</div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-textoSecundario">Email</span>
              <div className="text-sm text-textoPrincipal break-all">{usuario.email || 'Sin email registrado'}</div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-textoSecundario">Telefono</span>
              <div className="text-sm text-textoPrincipal">{usuario.telefono || 'Sin telefono registrado'}</div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-textoSecundario">Nivel</span>
              <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full border border-borde bg-fondo text-xs font-semibold text-textoPrincipal">
                {nivel}
              </div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-textoSecundario">Puntos acumulados</span>
              <div className="text-lg font-semibold text-textoPrincipal">{puntos}</div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-textoSecundario">Fecha de registro</span>
              <div className="text-sm text-textoPrincipal">{fechaRegistro}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-borde rounded-md p-5 bg-fondo">
          <p className="text-sm text-textoSecundario">No hay informacion del usuario disponible.</p>
        </div>
      )}
    </section>
  );
}
