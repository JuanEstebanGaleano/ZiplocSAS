const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const amountFormatter = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function canShowRevertButton(estado) {
  if (!estado) return false;
  const normalized = String(estado).toLowerCase();
  return !normalized.includes('revert') && !normalized.includes('fall');
}

function getStatusMeta(estado) {
  const normalized = String(estado || '').toLowerCase();
  if (normalized.includes('pend')) return { label: 'Pendiente', styles: 'bg-fondo text-textoSecundario border border-borde' };
  if (normalized.includes('rech') || normalized.includes('fall')) return { label: 'Rechazada', styles: 'bg-fondo text-error border border-error/40' };
  if (normalized.includes('revert')) return { label: 'Revertida', styles: 'bg-fondo text-textoSecundario border border-borde' };
  return { label: 'Completada', styles: 'bg-fondo text-exito border border-exito/40' };
}

function getRiskMeta(nivelRiesgo) {
  const normalized = String(nivelRiesgo || '').toLowerCase();
  if (normalized.includes('alto')) return { label: 'Alto', styles: 'bg-fondo text-error border border-error/40' };
  if (normalized.includes('medio')) return { label: 'Medio', styles: 'bg-fondo text-[#CD7F32] border border-[#CD7F32]/40' };
  if (normalized.includes('bajo')) return { label: 'Bajo', styles: 'bg-fondo text-textoSecundario border border-borde' };
  return null;
}

export default function TransaccionItem({ transaccion, onRevert, loading = false }) {
  const fecha = transaccion.fecha ? dateFormatter.format(new Date(transaccion.fecha)) : 'Sin fecha';
  const canRevert = canShowRevertButton(transaccion.estado);
  const puntosGenerados = transaccion.puntosGenerados ?? transaccion.puntos ?? null;
  const nivelRiesgo = transaccion.nivelRiesgo ?? transaccion.riesgo ?? '';
  const statusMeta = getStatusMeta(transaccion.estado);
  const riskMeta = getRiskMeta(nivelRiesgo);
  const isReversed = statusMeta.label === 'Revertida';

  return (
    <article className={`grid grid-cols-5 gap-4 items-center py-4 border-b border-borde last:border-b-0 transition-colors duration-150 px-2 -mx-2 rounded ${isReversed ? 'bg-fondo/70 opacity-80' : 'hover:bg-fondo'}`}>
      <div className="font-medium text-textoPrincipal">{transaccion.tipoLabel || transaccion.tipo}</div>
      <div className="flex flex-col">
        <div className="text-base font-bold text-textoPrincipal">$ {amountFormatter.format(Number(transaccion.valor || 0))}</div>
        {puntosGenerados !== null ? <div className="text-xs text-textoSecundario">+{puntosGenerados} pts</div> : null}
      </div>
      <div className="flex flex-col text-sm text-textoSecundario">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusMeta.styles}`}>{statusMeta.label}</span>
          {riskMeta ? <span className={`text-xs font-semibold px-2 py-1 rounded-full ${riskMeta.styles}`}>Riesgo {riskMeta.label}</span> : null}
        </div>
        <span className="text-xs text-textoSecundario mt-1">{transaccion.estadoLabel || transaccion.estado}</span>
      </div>
      <div className="text-sm text-textoSecundario">{fecha}</div>
      <div className="text-right">
        {onRevert ? (
          <button
            type="button"
            className="text-sm px-4 py-2 border border-borde rounded text-textoSecundario hover:bg-textoSecundario hover:text-superficie transition-colors duration-150 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-textoSecundario"
            onClick={() => onRevert(transaccion)}
            disabled={!canRevert || loading}
          >
            {loading ? 'Revertiendo...' : 'Revertir'}
          </button>
        ) : (
          <span className="text-sm text-textoSecundario">-</span>
        )}
      </div>
    </article>
  );
}