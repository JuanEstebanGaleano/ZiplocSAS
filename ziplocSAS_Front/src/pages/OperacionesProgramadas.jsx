import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import { useBilleteras } from '../hooks/useBilleteras';
import {
  useOperacionesProgramadas,
  useOperacionesProcesadas,
  useCrearOperacionProgramada,
  useProcesarOperacion,
} from '../hooks/useOperacionesProgramadas';

/* ─── Constantes ─────────────────────────────────────────── */
const TIPOS_OPERACION = ['RECARGA', 'RETIRO', 'TRANSFERENCIA', 'PAGO_PROGRAMADO'];
const PRIORIDADES = [1, 2, 3, 4, 5];

const TIPO_META = {
  RECARGA:          { icon: '↑', color: '#00FF94', label: 'Recarga' },
  RETIRO:           { icon: '↓', color: '#FF3B5C', label: 'Retiro' },
  TRANSFERENCIA:    { icon: '⇄', color: '#00C2FF', label: 'Transferencia' },
  PAGO_PROGRAMADO:  { icon: '◎', color: '#FFB800', label: 'Pago Prog.' },
};

const PRIORIDAD_META = {
  1: { label: 'CRÍTICA',  color: '#FF3B5C' },
  2: { label: 'ALTA',     color: '#FF6B2B' },
  3: { label: 'MEDIA',    color: '#FFB800' },
  4: { label: 'BAJA',     color: '#00C2FF' },
  5: { label: 'MÍNIMA',   color: '#888' },
};

const initialForm = () => ({
  tipo: 'RECARGA',
  valor: '',
  billeteraOrigenId: '',
  billeteraDestinoId: '',
  descripcion: '',
  prioridad: 3,
  fechaEjecucion: '',
});

const fmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const fmtMoney = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

/* ─── Sub-componentes ─────────────────────────────────────── */

function PulseOrb({ color }) {
  return (
      <span
          className="inline-block w-2 h-2 rounded-full relative"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      >
      <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: color, opacity: 0.5 }}
      />
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
      <div
          className="relative flex flex-col gap-1 p-4 rounded-lg overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${accent}33`,
            boxShadow: `0 0 24px ${accent}11`,
          }}
      >
        <div
            className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-20"
            style={{ background: accent }}
        />
        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: accent }}>{label}</span>
        <span className="text-2xl font-black text-white font-mono">{value}</span>
        {sub && <span className="text-[11px] text-white/40">{sub}</span>}
      </div>
  );
}

function Badge({ children, color }) {
  return (
      <span
          className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
      >
      {children}
    </span>
  );
}

function FieldWrapper({ label, error, children }) {
  return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold">{label}</label>
        {children}
        {error && (
            <span className="text-[11px] font-mono" style={{ color: '#FF3B5C' }}>
          ⚠ {error}
        </span>
        )}
      </div>
  );
}

const inputCls = (err) =>
    `w-full px-4 py-3 rounded-lg font-mono text-sm text-white outline-none transition-all duration-200
   bg-white/5 border placeholder-white/20
   focus:bg-white/8 focus:ring-2
   disabled:opacity-40
   ${err
        ? 'border-[#FF3B5C] focus:border-[#FF3B5C] focus:ring-[#FF3B5C]/20'
        : 'border-white/10 focus:border-[#00FF94] focus:ring-[#00FF94]/10'}`;

function TipoSelector({ value, onChange, disabled }) {
  return (
      <div className="grid grid-cols-2 gap-2">
        {TIPOS_OPERACION.map((t) => {
          const m = TIPO_META[t];
          const active = value === t;
          return (
              <button
                  key={t}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(t)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200"
                  style={{
                    background: active ? `${m.color}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? m.color : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: active ? `0 0 16px ${m.color}22` : 'none',
                  }}
              >
                <span className="text-lg" style={{ color: m.color }}>{m.icon}</span>
                <span className="text-[11px] font-bold tracking-wide text-white/70 uppercase">{m.label}</span>
              </button>
          );
        })}
      </div>
  );
}

function PrioridadSlider({ value, onChange, disabled }) {
  const m = PRIORIDAD_META[value];
  return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-white/50">1</span>
          <Badge color={m.color}>{m.label}</Badge>
          <span className="text-xs font-mono text-white/50">5</span>
        </div>
        <div className="relative">
          <input
              type="range"
              min={1}
              max={5}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${m.color} 0%, ${m.color} ${((value - 1) / 4) * 100}%, rgba(255,255,255,0.1) ${((value - 1) / 4) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
          />
        </div>
      </div>
  );
}

/* Tarjeta de operación pendiente */
function OpCard({ op, index }) {
  const m = TIPO_META[op.tipo] || TIPO_META.RECARGA;
  const pm = PRIORIDAD_META[op.prioridad] || PRIORIDAD_META[3];
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 60);
    return () => clearTimeout(t);
  }, [index]);

  return (
      <div
          className="group relative p-4 rounded-xl overflow-hidden transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid rgba(255,255,255,0.07)`,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.35s ease, transform 0.35s ease, border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = `${m.color}60`}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
      >
        {/* Barra lateral de color */}
        <div
            className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
            style={{ background: m.color, boxShadow: `0 0 8px ${m.color}` }}
        />

        <div className="pl-4 flex gap-4 items-start">
          {/* Icono */}
          <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
              style={{ background: `${m.color}15`, border: `1px solid ${m.color}30` }}
          >
            <span style={{ color: m.color }}>{m.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black tracking-wide text-white">{op.tipo}</span>
              <Badge color={pm.color}>{pm.label}</Badge>
            </div>

            <p className="text-lg font-mono font-bold mt-0.5" style={{ color: m.color }}>
              {fmtMoney(op.valor)}
            </p>

            {op.descripcion && (
                <p className="text-xs text-white/40 mt-1 truncate">{op.descripcion}</p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <PulseOrb color={m.color} />
              <span className="text-[11px] font-mono text-white/40">
              {fmt.format(new Date(op.fechaEjecucion))}
            </span>
            </div>
          </div>
        </div>
      </div>
  );
}

/* Tarjeta procesada (timeline) */
function OpProcesadaCard({ op, index }) {
  const m = TIPO_META[op.tipo] || TIPO_META.RECARGA;
  return (
      <div className="relative flex gap-4 pb-4">
        {/* Línea de tiempo */}
        <div className="flex flex-col items-center">
          <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 z-10"
              style={{ background: `${m.color}20`, border: `1px solid ${m.color}50`, color: m.color }}
          >
            {m.icon}
          </div>
          {index >= 0 && (
              <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          )}
        </div>
        <div className="flex-1 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/60">{op.tipo}</span>
            <Badge color="#00FF94">{op.estado || 'EJECUTADA'}</Badge>
          </div>
          <p className="text-sm font-mono font-bold text-white/80">{fmtMoney(op.valor)}</p>
        </div>
      </div>
  );
}

/* Panel de filtros */
function FiltrosPanel({ filtro, setFiltro, ordenar, setOrdenar }) {
  return (
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] uppercase tracking-widest text-white/30">Filtrar:</span>
        {['TODOS', ...TIPOS_OPERACION].map((t) => {
          const active = filtro === t;
          const m = t === 'TODOS' ? { color: '#888' } : TIPO_META[t];
          return (
              <button
                  key={t}
                  onClick={() => setFiltro(t)}
                  className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded transition-all"
                  style={{
                    background: active ? `${m.color}20` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? m.color : 'rgba(255,255,255,0.08)'}`,
                    color: active ? m.color : 'rgba(255,255,255,0.4)',
                  }}
              >
                {t === 'TODOS' ? 'TODOS' : TIPO_META[t].label}
              </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/30">Orden:</span>
          {['fecha', 'prioridad', 'valor'].map((o) => (
              <button
                  key={o}
                  onClick={() => setOrdenar(o)}
                  className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded transition-all capitalize"
                  style={{
                    background: ordenar === o ? '#00FF9420' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${ordenar === o ? '#00FF94' : 'rgba(255,255,255,0.08)'}`,
                    color: ordenar === o ? '#00FF94' : 'rgba(255,255,255,0.4)',
                  }}
              >
                {o}
              </button>
          ))}
        </div>
      </div>
  );
}

/* ─── Componente principal ─────────────────────────────────── */
export default function OperacionesProgramadas({ userId }) {
  const [form, setForm] = useState(initialForm());
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtro, setFiltro] = useState('TODOS');
  const [ordenar, setOrdenar] = useState('fecha');
  const [vistaTimeline, setVistaTimeline] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const toastRef = useRef(null);

  const billeterasQuery = useBilleteras(userId);
  const operacionesQuery = useOperacionesProgramadas(userId);
  const operacionesProcessadasQuery = useOperacionesProcesadas(userId);
  const crearMutation = useCrearOperacionProgramada();
  const procesarMutation = useProcesarOperacion();

  const billeteras = billeterasQuery.data?.billeteras || billeterasQuery.data || [];
  const operacionesRaw = operacionesQuery.data?.operaciones || operacionesQuery.data || [];
  const procesadas = operacionesProcessadasQuery.data?.operaciones || operacionesProcessadasQuery.data || [];

  /* Filtrado y ordenación */
  const operaciones = [...operacionesRaw]
      .filter((op) => filtro === 'TODOS' || op.tipo === filtro)
      .sort((a, b) => {
        if (ordenar === 'fecha') return new Date(a.fechaEjecucion) - new Date(b.fechaEjecucion);
        if (ordenar === 'prioridad') return a.prioridad - b.prioridad;
        if (ordenar === 'valor') return b.valor - a.valor;
        return 0;
      });

  /* Stats */
  const totalPendiente = operacionesRaw.reduce((s, o) => s + Number(o.valor), 0);
  const totalProcesado = procesadas.reduce((s, o) => s + Number(o.valor), 0);
  const proxima = operacionesRaw
      .filter((o) => new Date(o.fechaEjecucion) > new Date())
      .sort((a, b) => new Date(a.fechaEjecucion) - new Date(b.fechaEjecucion))[0];

  /* Toast auto-hide */
  useEffect(() => {
    if (!error && !success) return;
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  }, [error, success]);

  function validateForm() {
    const e = {};
    if (!form.tipo) e.tipo = 'Selecciona un tipo';
    if (!form.valor || Number(form.valor) <= 0) e.valor = 'Valor inválido';
    if (!form.fechaEjecucion) e.fechaEjecucion = 'Fecha requerida';
    if (!form.billeteraDestinoId) e.billeteraDestinoId = 'Destino requerido';
    if ((form.tipo === 'TRANSFERENCIA' || form.tipo === 'RETIRO') && !form.billeteraOrigenId)
      e.billeteraOrigenId = 'Origen requerido';
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
    setErrors((c) => ({ ...c, [name]: undefined }));
    setError(''); setSuccess('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await crearMutation.mutateAsync({
        tipo: form.tipo,
        valor: Number(form.valor),
        billeteraOrigenId: form.billeteraOrigenId || undefined,
        billeteraDestinoId: form.billeteraDestinoId,
        descripcion: form.descripcion.trim(),
        prioridad: Number(form.prioridad),
        fechaEjecucion: form.fechaEjecucion,
      });
      setSuccess('Operación programada');
      setForm(initialForm());
      setErrors({});
    } catch (err) {
      setError(err?.message || 'Error al crear');
    }
  }

  async function handleProcesarLote() {
    try {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      await procesarMutation.mutateAsync(now.toISOString().split('.')[0]);
      setSuccess('Lote procesado exitosamente');
    } catch (err) {
      setError(err?.message || 'Error al procesar');
    }
  }

  /* ─── Render ─────────────────────────────────────────────── */
  return (
      <div
          className="min-h-screen p-4 lg:p-6"
          style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d18 50%, #0a0f0a 100%)',
            fontFamily: "'Space Grotesk', 'DM Mono', monospace",
          }}
      >
        {/* Google Fonts inline */}
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&family=DM+Mono:wght@400;500&display=swap');
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #00FF94;
          box-shadow: 0 0 10px #00FF9480;
          cursor: pointer;
        }
        select option { background: #111; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
      `}</style>

        {/* Toast */}
        {(error || success) && (
            <div
                className="fixed top-4 right-4 z-50 max-w-xs"
                style={{ animation: 'slideIn 0.3s ease' }}
            >
              <div
                  className="px-5 py-4 rounded-xl text-sm font-bold"
                  style={{
                    background: error ? 'rgba(255,59,92,0.15)' : 'rgba(0,255,148,0.12)',
                    border: `1px solid ${error ? '#FF3B5C' : '#00FF94'}60`,
                    color: error ? '#FF3B5C' : '#00FF94',
                    backdropFilter: 'blur(20px)',
                    boxShadow: `0 8px 32px ${error ? '#FF3B5C' : '#00FF94'}20`,
                  }}
              >
                {error ? `⚠ ${error}` : `✓ ${success}`}
              </div>
            </div>
        )}

        {/* Header */}
        <div className="mb-6 fade-up">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PulseOrb color="#00FF94" />
                <span className="text-[10px] tracking-[0.3em] uppercase text-white/30">Sistema activo</span>
              </div>
              <h1
                  className="text-4xl font-black tracking-tight text-white leading-none"
                  style={{ textShadow: '0 0 40px rgba(0,255,148,0.15)' }}
              >
                Operaciones
                <span style={{ color: '#00FF94' }}>.</span>
              </h1>
              <p className="text-sm text-white/30 mt-1">Programadas & procesadas en tiempo real</p>
            </div>
            <button
                onClick={() => setShowForm((v) => !v)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200"
                style={{
                  background: showForm ? 'rgba(0,255,148,0.12)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${showForm ? '#00FF94' : 'rgba(255,255,255,0.1)'}`,
                  color: showForm ? '#00FF94' : 'rgba(255,255,255,0.5)',
                }}
            >
              {showForm ? '✕ Cerrar formulario' : '+ Nueva operación'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 fade-up" style={{ animationDelay: '0.1s' }}>
          <StatCard label="Pendientes" value={operacionesRaw.length} sub="por ejecutar" accent="#00FF94" />
          <StatCard label="Total pendiente" value={fmtMoney(totalPendiente)} sub="en cola" accent="#00C2FF" />
          <StatCard label="Procesadas" value={procesadas.length} sub="ejecutadas" accent="#FFB800" />
          <StatCard
              label="Próxima ejecución"
              value={proxima ? fmt.format(new Date(proxima.fechaEjecucion)).split(',')[1]?.trim() ?? '—' : '—'}
              sub={proxima ? proxima.tipo : 'sin pendientes'}
              accent="#FF3B5C"
          />
        </div>

        {/* Layout principal */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* Panel formulario */}
          {showForm && (
              <div
                  className="w-full lg:w-[360px] shrink-0 fade-up"
                  style={{ animationDelay: '0.15s' }}
              >
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(20px)',
                    }}
                >
                  {/* Header del form */}
                  <div
                      className="px-6 py-5 border-b"
                      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,255,148,0.04)' }}
                  >
                    <h2 className="text-sm font-black tracking-widest uppercase text-white">
                      ◎ Nueva operación
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="p-6 flex flex-col gap-5">

                    {/* Tipo */}
                    <FieldWrapper label="Tipo de operación" error={errors.tipo}>
                      <TipoSelector
                          value={form.tipo}
                          onChange={(t) => { setForm((c) => ({ ...c, tipo: t })); setErrors((c) => ({ ...c, tipo: undefined })); }}
                          disabled={crearMutation.isPending}
                      />
                    </FieldWrapper>

                    {/* Valor */}
                    <FieldWrapper label="Valor (COP)" error={errors.valor}>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">$</span>
                        <input
                            type="number"
                            name="valor"
                            value={form.valor}
                            onChange={handleChange}
                            placeholder="0"
                            step="1"
                            disabled={crearMutation.isPending}
                            className={`${inputCls(errors.valor)} pl-8`}
                        />
                      </div>
                    </FieldWrapper>

                    {/* Destino */}
                    <FieldWrapper label="Billetera destino" error={errors.billeteraDestinoId}>
                      <select
                          name="billeteraDestinoId"
                          value={form.billeteraDestinoId}
                          onChange={handleChange}
                          disabled={crearMutation.isPending}
                          className={inputCls(errors.billeteraDestinoId)}
                      >
                        <option value="">— Selecciona —</option>
                        {billeteras.map((w) => (
                            <option key={w.id} value={w.id}>{w.nombre}</option>
                        ))}
                      </select>
                    </FieldWrapper>

                    {/* Origen (condicional) */}
                    {(form.tipo === 'TRANSFERENCIA' || form.tipo === 'RETIRO') && (
                        <FieldWrapper label="Billetera origen" error={errors.billeteraOrigenId}>
                          <select
                              name="billeteraOrigenId"
                              value={form.billeteraOrigenId}
                              onChange={handleChange}
                              disabled={crearMutation.isPending}
                              className={inputCls(errors.billeteraOrigenId)}
                          >
                            <option value="">— Selecciona —</option>
                            {billeteras.map((w) => (
                                <option key={w.id} value={w.id}>{w.nombre}</option>
                            ))}
                          </select>
                        </FieldWrapper>
                    )}

                    {/* Fecha */}
                    <FieldWrapper label="Fecha de ejecución" error={errors.fechaEjecucion}>
                      <input
                          type="datetime-local"
                          name="fechaEjecucion"
                          value={form.fechaEjecucion}
                          onChange={handleChange}
                          disabled={crearMutation.isPending}
                          className={inputCls(errors.fechaEjecucion)}
                      />
                    </FieldWrapper>

                    {/* Prioridad */}
                    <FieldWrapper label="Prioridad">
                      <PrioridadSlider
                          value={form.prioridad}
                          onChange={(v) => setForm((c) => ({ ...c, prioridad: v }))}
                          disabled={crearMutation.isPending}
                      />
                    </FieldWrapper>

                    {/* Descripción */}
                    <FieldWrapper label="Descripción (opcional)">
                  <textarea
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleChange}
                      placeholder="Notas internas..."
                      disabled={crearMutation.isPending}
                      rows={2}
                      className={`${inputCls(false)} resize-none`}
                  />
                    </FieldWrapper>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={crearMutation.isPending}
                        className="w-full py-3.5 rounded-xl font-black tracking-widest uppercase text-sm transition-all duration-200 relative overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, #00FF94, #00C2FF)',
                          color: '#050a05',
                          boxShadow: '0 0 30px rgba(0,255,148,0.3)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 50px rgba(0,255,148,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,148,0.3)'; e.currentTarget.style.transform = 'none'; }}
                    >
                      {crearMutation.isPending ? '⟳ Creando...' : '→ Programar operación'}
                    </button>
                  </form>
                </div>
              </div>
          )}

          {/* Panel derecho */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Pendientes */}
            <div
                className="rounded-2xl overflow-hidden fade-up"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  animationDelay: '0.2s',
                }}
            >
              <div
                  className="px-6 py-4 border-b flex flex-col gap-3"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-black tracking-widest uppercase text-white">Pendientes</h2>
                    {operacionesRaw.length > 0 && (
                        <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(0,255,148,0.15)', color: '#00FF94', border: '1px solid #00FF9430' }}
                        >
                      {operacionesRaw.length}
                    </span>
                    )}
                  </div>
                  {operacionesRaw.length > 0 && (
                      <button
                          onClick={handleProcesarLote}
                          disabled={procesarMutation.isPending}
                          className="px-4 py-2 rounded-lg text-xs font-black tracking-wide uppercase transition-all duration-200"
                          style={{
                            background: 'rgba(255,184,0,0.12)',
                            border: '1px solid rgba(255,184,0,0.3)',
                            color: '#FFB800',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,184,0,0.22)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,184,0,0.12)'}
                      >
                        {procesarMutation.isPending ? '⟳ Procesando...' : '⚡ Procesar hasta ahora'}
                      </button>
                  )}
                </div>
                {operacionesRaw.length > 0 && (
                    <FiltrosPanel filtro={filtro} setFiltro={setFiltro} ordenar={ordenar} setOrdenar={setOrdenar} />
                )}
              </div>

              <div className="p-4">
                {operacionesQuery.isLoading ? (
                    <div className="flex justify-center py-12"><LoadingSpinner /></div>
                ) : operaciones.length ? (
                    <div className="flex flex-col gap-2">
                      {operaciones.map((op, i) => (
                          <OpCard key={op.id} op={op} index={i} />
                      ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-3 opacity-20">◌</p>
                      <p className="text-sm text-white/30">
                        {filtro !== 'TODOS' ? 'Sin resultados para este filtro' : 'No hay operaciones pendientes'}
                      </p>
                    </div>
                )}
              </div>
            </div>

            {/* Procesadas */}
            <div
                className="rounded-2xl overflow-hidden fade-up"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  animationDelay: '0.3s',
                }}
            >
              <div
                  className="px-6 py-4 border-b flex items-center justify-between gap-3"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-black tracking-widest uppercase text-white">Historial</h2>
                  {procesadas.length > 0 && (
                      <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800', border: '1px solid #FFB80030' }}
                      >
                    {procesadas.length}
                  </span>
                  )}
                </div>
                {procesadas.length > 0 && (
                    <button
                        onClick={() => setVistaTimeline((v) => !v)}
                        className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          background: vistaTimeline ? 'rgba(0,194,255,0.12)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${vistaTimeline ? 'rgba(0,194,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: vistaTimeline ? '#00C2FF' : 'rgba(255,255,255,0.4)',
                        }}
                    >
                      {vistaTimeline ? '⊞ Grid' : '⊟ Timeline'}
                    </button>
                )}
              </div>

              <div className="p-4 lg:p-6">
                {operacionesProcessadasQuery.isLoading ? (
                    <div className="flex justify-center py-10"><LoadingSpinner /></div>
                ) : procesadas.length ? (
                    vistaTimeline ? (
                        <div className="pl-2">
                          {procesadas.map((op, i) => (
                              <OpProcesadaCard key={op.id} op={op} index={i} />
                          ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {procesadas.map((op) => {
                            const m = TIPO_META[op.tipo] || TIPO_META.RECARGA;
                            return (
                                <div
                                    key={op.id}
                                    className="p-3 rounded-xl flex items-center gap-3"
                                    style={{
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid rgba(255,255,255,0.05)',
                                    }}
                                >
                                  <span className="text-lg opacity-60" style={{ color: m.color }}>{m.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white/50 truncate">{op.tipo}</p>
                                    <p className="text-sm font-mono font-bold text-white/70">{fmtMoney(op.valor)}</p>
                                  </div>
                                  <Badge color="#00FF94">{op.estado || 'OK'}</Badge>
                                </div>
                            );
                          })}
                        </div>
                    )
                ) : (
                    <div className="text-center py-10">
                      <p className="text-4xl mb-3 opacity-10">◌</p>
                      <p className="text-sm text-white/30">Sin historial todavía</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}