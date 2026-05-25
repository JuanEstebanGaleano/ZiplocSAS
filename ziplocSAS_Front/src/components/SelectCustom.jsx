import { useMemo, useState, useRef, useEffect } from 'react';

export default function SelectCustom({
                                       label, id, name, value, options = [],
                                       placeholder = 'Selecciona una opción',
                                       onChange, disabled = false, className = '', error = ''
                                     }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const rootRef = useRef(null);

  const selectedOption = useMemo(
      () => options.find(o => String(o.value) === String(value)),
      [options, value]
  );

  function handleSelect(nextValue) {
    if (disabled || !onChange) return;
    onChange({ target: { name, value: nextValue } });
    setOpen(false);
  }

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const accentColor = error ? '#FF3B5C' : '#00FFB2';

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne+Mono&family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap');
        @keyframes scDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes scChevron {
          from { transform: rotate(0deg); }
          to   { transform: rotate(180deg); }
        }
        .sc-dropdown { animation: scDropIn 0.18s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

        <div ref={rootRef} className={`relative flex flex-col gap-2 ${className}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>

          {/* Label */}
          {label && (
              <label
                  htmlFor={id || name}
                  style={{
                    fontFamily: "'Syne Mono', monospace",
                    fontSize: '9px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: open ? accentColor : 'rgba(255,255,255,0.3)',
                    transition: 'color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
              >
            <span style={{
              display: 'inline-block',
              width: 4, height: 4,
              borderRadius: '50%',
              background: open ? accentColor : 'rgba(255,255,255,0.2)',
              boxShadow: open ? `0 0 6px ${accentColor}` : 'none',
              transition: 'all 0.2s',
              flexShrink: 0,
            }} />
                {label}
              </label>
          )}

          {/* Trigger button */}
          <button
              type="button"
              id={id || name}
              disabled={disabled}
              aria-expanded={open}
              aria-haspopup="listbox"
              onClick={() => setOpen(v => !v)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '11px 14px',
                background: open
                    ? `rgba(255,255,255,0.05)`
                    : 'rgba(255,255,255,0.03)',
                border: `1px solid ${
                    error ? '#FF3B5C'
                        : open ? '#00FFB2'
                            : 'rgba(255,255,255,0.1)'
                }`,
                borderRadius: open ? '10px 10px 0 0' : '10px',
                color: selectedOption ? '#fff' : 'rgba(255,255,255,0.3)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.45 : 1,
                outline: 'none',
                transition: 'all 0.18s ease',
                boxShadow: open
                    ? `0 0 0 3px ${error ? 'rgba(255,59,92,0.12)' : 'rgba(0,255,178,0.1)'},
                 inset 0 1px 0 rgba(255,255,255,0.05)`
                    : error
                        ? '0 0 0 2px rgba(255,59,92,0.15)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                textAlign: 'left',
              }}
          >
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            fontWeight: selectedOption ? 500 : 400,
            letterSpacing: '0.01em',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {selectedOption?.label || placeholder}
          </span>

            {/* Chevron */}
            <span
                aria-hidden
                style={{
                  marginLeft: '10px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: open ? accentColor : 'rgba(255,255,255,0.25)',
                  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.22s ease, color 0.18s',
                }}
            >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          </button>

          {/* Dropdown */}
          {open && (
              <div
                  className="sc-dropdown"
                  role="listbox"
                  aria-label={label}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    zIndex: 50,
                    background: '#0c0c14',
                    border: `1px solid ${error ? '#FF3B5C50' : 'rgba(0,255,178,0.2)'}`,
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    overflow: 'hidden',
                    boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
                  }}
              >
                {/* Top accent line */}
                <div style={{
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
                  margin: '0 12px',
                }} />

                <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {options.map((option, i) => {
                    const isSelected = String(option.value) === String(value);
                    const isHov = hovered === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelect(option.value)}
                            onMouseEnter={() => setHovered(option.value)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '9px 12px',
                              borderRadius: '7px',
                              border: 'none',
                              background: isSelected
                                  ? 'rgba(0,255,178,0.08)'
                                  : isHov
                                      ? 'rgba(255,255,255,0.04)'
                                      : 'transparent',
                              cursor: 'pointer',
                              transition: 'background 0.12s',
                            }}
                        >
                          {/* Selection indicator */}
                          <span style={{
                            width: 6, height: 6,
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: isSelected ? '#00FFB2' : 'transparent',
                            border: `1px solid ${isSelected ? '#00FFB2' : 'rgba(255,255,255,0.15)'}`,
                            boxShadow: isSelected ? '0 0 6px #00FFB2' : 'none',
                            transition: 'all 0.15s',
                          }} />

                          <span style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '13px',
                            fontWeight: isSelected ? 500 : 400,
                            color: isSelected
                                ? '#fff'
                                : isHov
                                    ? 'rgba(255,255,255,0.7)'
                                    : 'rgba(255,255,255,0.45)',
                            flex: 1,
                            transition: 'color 0.12s',
                          }}>
                      {option.label}
                    </span>

                          {isSelected && (
                              <span style={{
                                fontFamily: "'Syne Mono', monospace",
                                fontSize: '8px',
                                color: '#00FFB2',
                                letterSpacing: '0.1em',
                                opacity: 0.7,
                              }}>✓</span>
                          )}
                        </button>
                    );
                  })}

                  {options.length === 0 && (
                      <div style={{
                        padding: '16px 12px',
                        fontFamily: "'Syne Mono', monospace",
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.2)',
                        letterSpacing: '0.12em',
                        textAlign: 'center',
                      }}>
                        SIN OPCIONES
                      </div>
                  )}
                </div>
              </div>
          )}

          {/* Error */}
          {error && (
              <span style={{
                fontFamily: "'Syne Mono', monospace",
                fontSize: '9px',
                color: '#FF3B5C',
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
            <span>⚠</span> {error}
          </span>
          )}
        </div>
      </>
  );
}