export default function BilleteraCard({ billetera, selected, onSelect, onEdit }) {
  return (
    <article className={selected ? 'walletRow selected' : 'walletRow'}>
      <button type="button" className="rowSelect" onClick={() => onSelect(billetera)}>
        <span className="tableMainText">{billetera.nombre}</span>
        <span className="tableCell">{billetera.tipo}</span>
        <span className="tableValue">$ {Number(billetera.saldo || 0).toLocaleString('es-CO')}</span>
        <span className="statusText">{billetera.estado}</span>
      </button>
      <div className="rowActions">
        <button type="button" className="actionButton small" onClick={() => onEdit(billetera)}>
          Editar
        </button>
      </div>
    </article>
  );
}