export default function NivelBadge({ nivel, puntos }) {
  const key = String(nivel || '').toLowerCase();

  const borderColors = {
    bronce: 'border-l-[#C47A44]',
    plata: 'border-l-[#94A3B8]',
    oro: 'border-l-[#EAB308]',
    platino: 'border-l-[#67E8F9]'
  };

  const borderColor = borderColors[key] || 'border-l-[#334155]';

  return (
      <article
          className={`p-5 rounded-xl bg-[#111827] border border-[#1E293B] border-l-[3px] ${borderColor} flex flex-col gap-2 shadow-[0_0_25px_rgba(0,0,0,0.35)] transition-all duration-200 hover:border-[#334155]`}
      >
      <span className="text-xs uppercase tracking-wider text-[#94A3B8] font-medium">
        Nivel actual
      </span>

        <strong className="text-[22px] font-bold leading-[1.1] text-[#F8FAFC]">
          {nivel || 'Sin nivel'}
        </strong>

        {typeof puntos !== 'undefined' ? (
            <span className="text-sm text-[#CBD5E1]">
          {puntos} pts
        </span>
        ) : null}
      </article>
  );
}