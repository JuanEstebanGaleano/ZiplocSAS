import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import { usePuntosRecompensas, useNivelRecompensas, useBeneficios, useCanjeaBeneficio } from '../hooks/useRecompensas';
import { Check, Sparkles, Lock } from 'lucide-react';

/* ─── Static data ──────────────────────────────────────── */
const BENEFICIOS = [
  { id: '1', descripcion: 'Reduce el costo de operaciones frecuentes durante el mes.', nivelRequerido: 'Bronce', puntosNecesarios: 120, tipo: 'descuento_transferencias', activo: true },
  { id: '2', descripcion: 'Recibe una bonificación directa sobre tu billetera principal.', nivelRequerido: 'Plata', puntosNecesarios: 180, tipo: 'bonificacion_saldo', activo: true },
  { id: '3', descripcion: 'Obtén devolución por operaciones de compra seleccionadas.', nivelRequerido: 'Plata', puntosNecesarios: 220, tipo: 'cashback_compras', activo: true },
  { id: '4', descripcion: 'Acceso a atención prioritaria para incidencias de alto impacto.', nivelRequerido: 'Oro', puntosNecesarios: 300, tipo: 'soporte_prioritario', activo: true },
  { id: '5', descripcion: 'Aumenta tus límites de transacción temporalmente.', nivelRequerido: 'Oro', puntosNecesarios: 450, tipo: 'incremento_limites', activo: true },
  { id: '6', descripcion: 'Solicita una nueva tarjeta física sin costos de emisión.', nivelRequerido: 'Platino', puntosNecesarios: 600, tipo: 'tarjeta_fisica', activo: true },
];

const BENEFICIO_LABELS = {
  descuento_transferencias: 'Descuento en transferencias',
  bonificacion_saldo: 'Bonificación de saldo',
  cashback_compras: 'Cashback de compras',
  soporte_prioritario: 'Soporte prioritario',
  incremento_limites: 'Incremento de límites',
  tarjeta_fisica: 'Tarjeta física sin costo',
};

const LEVEL_ORDER = ['Bronce', 'Plata', 'Oro', 'Platino'];

const LEVEL_CONFIG = {
  Bronce:  { color: '#CD7F32', bg: 'rgba(205,127,50,0.10)', border: 'rgba(205,127,50,0.25)', label: 'Acceso básico con beneficios esenciales y acumulación estándar de puntos.' },
  Plata:   { color: '#A0A0A0', bg: 'rgba(160,160,160,0.10)', border: 'rgba(160,160,160,0.25)', label: 'Mejoras en costos de operación y beneficios frecuentes para uso diario.' },
  Oro:     { color: '#E8C54A', bg: 'rgba(232,197,74,0.10)', border: 'rgba(232,197,74,0.25)', label: 'Condiciones preferentes, soporte reforzado y mayor retorno por actividad.' },
  Platino: { color: '#8AB4D4', bg: 'rgba(138,180,212,0.10)', border: 'rgba(138,180,212,0.25)', label: 'Nivel máximo con ventajas exclusivas y prioridad operativa extendida.' },
};

function getBeneficioLabel(b) {
  return BENEFICIO_LABELS[b.tipo] || b.tipo || 'Beneficio';
}

function extractLevel(data) {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') return data.nivel || data.level || 'Bronce';
  return 'Bronce';
}

function extractPoints(data) {
  if (typeof data === 'number') return data;
  if (typeof data === 'string' && !isNaN(Number(data))) return Number(data);
  if (data && typeof data === 'object') return Number(data.puntosActuales ?? data.puntos ?? data.puntosAcumulados ?? 0);
  return 0;
}

function getThreshold(level) {
  const lv = level.toUpperCase();
  if (lv === 'BRONCE') return 1000;
  if (lv === 'PLATA') return 5000;
  if (lv === 'ORO') return 15000;
  return 0;
}

/* ─── Level step indicator ────────────────────────────── */
function LevelSteps({ currentLevel }) {
  const currentIdx = LEVEL_ORDER.findIndex(l => l.toLowerCase() === currentLevel.toLowerCase());
  return (
      <div className="flex items-center gap-0">
        {LEVEL_ORDER.map((level, i) => {
          const cfg = LEVEL_CONFIG[level];
          const isActive = i === currentIdx;
          const isDone = i < currentIdx;
          return (
              <div key={level} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                      className="w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all duration-300"
                      style={{
                        background: isActive || isDone ? cfg.bg : 'transparent',
                        borderColor: isActive || isDone ? cfg.color : '#2A2A2A',
                        color: isActive || isDone ? cfg.color : '#3A3A3A',
                      }}
                  >
                    {isDone ? <Check size={11} /> : i + 1}
                  </div>
                  <span
                      className="text-[10px] font-medium tracking-wide"
                      style={{ color: isActive ? cfg.color : isDone ? '#5A5A5A' : '#2E2E2E' }}
                  >
                {level}
              </span>
                </div>
                {i < LEVEL_ORDER.length - 1 && (
                    <div
                        className="w-10 h-px mb-5 transition-all duration-300"
                        style={{ background: i < currentIdx ? LEVEL_CONFIG[LEVEL_ORDER[i]].color : '#222222' }}
                    />
                )}
              </div>
          );
        })}
      </div>
  );
}

/* ─── Benefit card ────────────────────────────────────── */
function BeneficioCard({ beneficio, points, isRedeeming, redeemed, onRedeem }) {
  const hasPoints = points >= beneficio.puntosNecesarios;
  const isDone    = redeemed.includes(beneficio.id);
  const isLocked  = !beneficio.activo || (!hasPoints && !isDone);

  return (
      <article className="relative flex flex-col bg-[#111111] border border-[#1E1E1E] rounded-xl p-5 gap-4 overflow-hidden transition-all duration-150 hover:border-[#2A2A2A] group">
        {/* top accent line */}
        <div
            className="absolute inset-x-0 top-0 h-px opacity-60"
            style={{ background: isDone ? '#6A9B6A' : hasPoints ? '#D38343' : '#2A2A2A' }}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#D4D4D4] leading-tight">{getBeneficioLabel(beneficio)}</h3>
            <span className="text-[10px] font-medium tracking-wide text-[#4A4A4A] uppercase">
            Nivel: {beneficio.nivelRequerido}
          </span>
          </div>
          <div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold border"
              style={{
                background: isDone ? 'rgba(106,155,106,0.10)' : hasPoints ? 'rgba(211,131,67,0.10)' : '#0D0D0D',
                borderColor: isDone ? 'rgba(106,155,106,0.25)' : hasPoints ? 'rgba(211,131,67,0.25)' : '#1E1E1E',
                color: isDone ? '#6A9B6A' : hasPoints ? '#D38343' : '#3A3A3A',
              }}
          >
            {isDone ? <Check size={16} /> : isLocked && !hasPoints ? <Lock size={13} /> : <Sparkles size={13} />}
          </div>
        </div>

        <p className="text-xs text-[#5A5A5A] leading-relaxed flex-1">{beneficio.descripcion}</p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold" style={{ color: hasPoints || isDone ? '#D38343' : '#3A3A3A' }}>
            {beneficio.puntosNecesarios}
          </span>
            <span className="text-[10px] text-[#3A3A3A] font-medium">pts</span>
          </div>

          <button
              type="button"
              onClick={() => onRedeem(beneficio)}
              disabled={isRedeeming || !hasPoints || !beneficio.activo || isDone}
              className={`
            px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border
            disabled:cursor-not-allowed
            ${isDone
                  ? 'bg-[#6A9B6A]/10 border-[#6A9B6A]/20 text-[#6A9B6A] cursor-default'
                  : hasPoints && beneficio.activo
                      ? 'bg-[#D38343]/10 border-[#D38343]/25 text-[#D38343] hover:bg-[#D38343]/18 active:scale-95'
                      : 'bg-transparent border-[#1E1E1E] text-[#2E2E2E]'
              }
          `}
          >
            {isRedeeming
                ? 'Procesando…'
                : isDone
                    ? 'Canjeado'
                    : beneficio.activo
                        ? hasPoints ? 'Canjear' : `Faltan ${beneficio.puntosNecesarios - points} pts`
                        : 'No disponible'}
          </button>
        </div>
      </article>
  );
}

/* ─── Main ────────────────────────────────────────────── */
export default function Recompensas({ userId }) {
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [redeemed, setRedeemed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`redeemed_${userId}`)) || []; }
    catch { return []; }
  });

  const puntosQuery    = usePuntosRecompensas(userId);
  const nivelQuery     = useNivelRecompensas(userId);
  const beneficiosQuery = useBeneficios();
  const canjeaMutation  = useCanjeaBeneficio();

  async function handleRedeem(beneficio) {
    try {
      setError('');
      setSuccess('');
      await canjeaMutation.mutateAsync({ usuarioId: userId, beneficioId: beneficio.id });
      setSuccess('Canje realizado exitosamente.');
      const next = [...redeemed, beneficio.id];
      setRedeemed(next);
      localStorage.setItem(`redeemed_${userId}`, JSON.stringify(next));
    } catch (e) {
      setError(e?.message || 'No fue posible canjear el beneficio.');
    }
  }

  const rawLevel     = extractLevel(nivelQuery.data);
  const currentLevel = rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase();
  const cfg          = LEVEL_CONFIG[currentLevel] || LEVEL_CONFIG.Bronce;
  const points       = extractPoints(puntosQuery.data);
  const threshold    = getThreshold(currentLevel);
  const progress     = threshold > 0 ? Math.min(100, Math.round((points / threshold) * 100)) : 100;
  const beneficiosData = Array.isArray(beneficiosQuery.data)
      ? beneficiosQuery.data
      : (beneficiosQuery.data?.beneficios || BENEFICIOS);

  const isLoading   = puntosQuery.isLoading || nivelQuery.isLoading || beneficiosQuery.isLoading;
  const isRedeeming = canjeaMutation.isPending;

  return (
      <section className="flex flex-col gap-5 relative">
        {error   && <div className="absolute top-0 right-0 w-full lg:w-auto z-10"><AlertaPanel type="error"   title="Error"             message={error}   /></div>}
        {success && <div className="absolute top-0 right-0 w-full lg:w-auto z-10"><AlertaPanel type="success" title="Canje confirmado"   message={success} /></div>}

        {isLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
            <>
              {/* Level card */}
              <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-6 relative overflow-hidden">
                {/* Ambient glow */}
                <div
                    className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-5 pointer-events-none"
                    style={{ background: cfg.color }}
                />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <div
                          className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide border"
                          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                      >
                        {currentLevel}
                      </div>
                      <span className="text-[10px] text-[#3A3A3A] uppercase tracking-wider font-medium">Fidelización</span>
                    </div>

                    <div className="flex items-end gap-2">
                  <span className="text-5xl font-black leading-none" style={{ color: cfg.color }}>
                    {points.toLocaleString('es-CO')}
                  </span>
                      <span className="text-sm font-medium text-[#4A4A4A] mb-1.5">puntos</span>
                    </div>

                    <p className="text-sm text-[#5A5A5A] max-w-md leading-relaxed">{cfg.label}</p>

                    {/* Progress */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-[10px] font-medium text-[#3A3A3A]">
                        <span>{threshold > 0 ? `${points.toLocaleString()} / ${threshold.toLocaleString()} pts al siguiente nivel` : 'Nivel máximo alcanzado'}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progress}%`, background: cfg.color }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Level steps */}
                  <div className="flex flex-col items-end gap-2 pt-1">
                    <LevelSteps currentLevel={currentLevel} />
                  </div>
                </div>
              </div>

              {/* Benefits grid */}
              <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#D4D4D4] tracking-wide">Beneficios disponibles</h2>
                  <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-[#4A4A4A] bg-[#1A1A1A] border border-[#252525] px-2 py-1 rounded-md">
                Canje inmediato
              </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {beneficiosData.map((b) => (
                      <BeneficioCard
                          key={b.id}
                          beneficio={b}
                          points={points}
                          isRedeeming={isRedeeming}
                          redeemed={redeemed}
                          onRedeem={handleRedeem}
                      />
                  ))}
                </div>
              </div>
            </>
        )}
      </section>
  );
}
