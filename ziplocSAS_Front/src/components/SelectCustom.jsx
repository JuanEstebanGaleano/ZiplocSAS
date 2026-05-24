import { useMemo, useState } from 'react';

export default function SelectCustom({
  label, id, name, value, options = [], placeholder = 'Selecciona una opción', onChange, disabled = false, className = '', error = ''
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = useMemo(() => options.find((option) => String(option.value) === String(value)), [options, value]);

  function handleSelect(nextValue) {
    if (disabled || !onChange) return;
    onChange({ target: { name, value: nextValue } });
    setOpen(false);
  }

  const baseButton = "w-full flex justify-between items-center p-3 bg-transparent border border-borde rounded-md text-textoPrincipal outline-none transition-all duration-150 focus:border-acento focus:ring-[3px] focus:ring-[#C47A44]/10 disabled:opacity-50 disabled:cursor-not-allowed text-left";
  const errorStyles = error ? 'border-error focus:border-error focus:ring-[#B13E3E]/10' : '';

  return (
    <div className={`relative flex flex-col gap-2 ${className}`}>
      {label && <label htmlFor={id || name} className="text-sm font-medium text-textoSecundario">{label}</label>}
      <button
        type="button"
        className={`${baseButton} ${errorStyles}`}
        onClick={() => setOpen(!open)}
        disabled={disabled}
        aria-expanded={open}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="text-textoSecundario ml-2" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full z-10 glass-panel border border-borde rounded-md shadow-flotante flex flex-col p-2 gap-1" role="listbox">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <button
                key={option.value}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors duration-150 ${isSelected ? 'bg-fondo text-textoPrincipal' : 'text-textoSecundario hover:bg-fondo hover:text-textoPrincipal'}`}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={isSelected}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}