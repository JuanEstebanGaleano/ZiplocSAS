export default function NivelBadge({ nivel, puntos }) {
  const key = String(nivel || '').toLowerCase();
  
  const borderColors = {
    bronce: 'border-l-[#CD7F32]',
    plata: 'border-l-[#C0C0C0]',
    oro: 'border-l-[#FFD700]',
    platino: 'border-l-[#E5E4E2]'
  };

  const borderColor = borderColors[key] || 'border-l-textoSecundario';

  return (
    <article className={`p-5 rounded-md bg-fondo border border-borde border-l-[3px] ${borderColor} flex flex-col gap-2 shadow-sutil`}>
      <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Nivel actual</span>
      <strong className="text-[22px] font-bold leading-[1.1] text-textoPrincipal">{nivel || 'Sin nivel'}</strong>
      {typeof puntos !== 'undefined' ? <span className="text-sm text-textoSecundario">{puntos} pts</span> : null}
    </article>
  );
}