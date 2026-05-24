import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import { useNotificaciones, useMarcarLectura, useDespacharNotificacion } from '../hooks/useNotificaciones';

const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export default function Notificaciones({ userId }) {
  const [filterRead, setFilterRead] = useState('todos');
  const notificacionesQuery = useNotificaciones(userId);
  const marcarLecturaMutation = useMarcarLectura();
  const despacharMutation = useDespacharNotificacion();

  const notificaciones = notificacionesQuery.data?.notificaciones || notificacionesQuery.data || [];

  const filteredNotificaciones = notificaciones.filter((notif) => {
    if (filterRead === 'leidas') return notif.leida;
    if (filterRead === 'no-leidas') return !notif.leida;
    return true;
  });

  async function handleMarcarLectura(notifId) {
    try {
      await marcarLecturaMutation.mutateAsync({ usuarioId: userId, notificacionId: notifId });
    } catch (err) {
      console.error('Error marcando notificación:', err);
    }
  }

  async function handleDespachar() {
    try {
      await despacharMutation.mutateAsync(userId);
    } catch (err) {
      console.error('Error despachando:', err);
    }
  }

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <section className="flex flex-col gap-6">
      {(notificacionesQuery.error || marcarLecturaMutation.error || despacharMutation.error) && (
        <AlertaPanel
          type="error"
          title="Error"
          message={(notificacionesQuery.error || marcarLecturaMutation.error || despacharMutation.error)?.message || 'Error al procesar notificaciones'}
        />
      )}

      <div className="bg-superficie border border-borde rounded-md shadow-sutil p-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-textoPrincipal">Notificaciones</h1>
            <p className="text-sm text-textoSecundario mt-1">{noLeidas} sin leer</p>
          </div>
          <button
            type="button"
            onClick={handleDespachar}
            disabled={despacharMutation.isPending || !notificaciones.length}
            className="px-4 py-2 bg-acento text-superficie font-medium rounded-md hover:bg-acentoHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {despacharMutation.isPending ? 'Despachando...' : 'Despachar'}
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setFilterRead('todos')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filterRead === 'todos'
                ? 'bg-acento text-superficie font-medium'
                : 'border border-borde text-textoSecundario hover:border-acento'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setFilterRead('no-leidas')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filterRead === 'no-leidas'
                ? 'bg-acento text-superficie font-medium'
                : 'border border-borde text-textoSecundario hover:border-acento'
            }`}
          >
            Sin leer
          </button>
          <button
            type="button"
            onClick={() => setFilterRead('leidas')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filterRead === 'leidas'
                ? 'bg-acento text-superficie font-medium'
                : 'border border-borde text-textoSecundario hover:border-acento'
            }`}
          >
            Leídas
          </button>
        </div>

        {notificacionesQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : filteredNotificaciones.length ? (
          <div className="flex flex-col gap-2">
            {filteredNotificaciones.map((notif) => (
              <article
                key={notif.id}
                className={`p-4 rounded-md border transition-colors ${
                  notif.leida
                    ? 'bg-fondo border-borde'
                    : 'bg-acento/5 border-acento/30 shadow-sutil'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className={`font-semibold ${notif.leida ? 'text-textoSecundario' : 'text-textoPrincipal'}`}>
                      {notif.titulo}
                    </h3>
                    <p className={`text-sm mt-1 ${notif.leida ? 'text-textoSecundario' : 'text-textoPrincipal'}`}>
                      {notif.mensaje}
                    </p>
                    <span className="text-xs text-textoSecundario mt-2 block">
                      {dateFormatter.format(new Date(notif.fecha))}
                    </span>
                  </div>
                  {!notif.leida && (
                    <button
                      type="button"
                      onClick={() => handleMarcarLectura(notif.id)}
                      disabled={marcarLecturaMutation.isPending}
                      className="px-3 py-1 text-xs font-medium border border-acento text-acento rounded hover:bg-acento/10 transition-colors disabled:opacity-50"
                    >
                      Marcar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-borde rounded-md p-8 bg-fondo text-center">
            <p className="text-textoSecundario">No hay notificaciones {filterRead !== 'todos' ? `${filterRead}` : ''}</p>
          </div>
        )}
      </div>
    </section>
  );
}
