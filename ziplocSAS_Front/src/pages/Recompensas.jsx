import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import { usePuntosRecompensas, useNivelRecompensas, useBeneficios, useCanjeaBeneficio } from '../hooks/useRecompensas';

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
  bonificacion_saldo: 'Bonificacion de saldo',
  cashback_compras: 'Cashback de compras',
  soporte_prioritario: 'Soporte prioritario',
  incremento_limites: 'Incremento de limites',
  tarjeta_fisica: 'Tarjeta fisica sin costo',
};

function getBeneficioLabel(beneficio) {
  return BENEFICIO_LABELS[beneficio.tipo] || beneficio.tipo || 'Beneficio';
}

const LEVEL_TEXT = {
  Bronce: 'Acceso básico con beneficios esenciales y acumulación estándar de puntos.',
  Plata: 'Mejoras en costos de operación y beneficios frecuentes para uso diario.',
  Oro: 'Condiciones preferentes, soporte reforzado y mayor retorno por actividad.',
  Platino: 'Nivel máximo con ventajas exclusivas y prioridad operativa extendida.',
};

export default function Recompensas({ userId }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redeemed, setRedeemed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`redeemed_${userId}`)) || [];
    } catch {
      return [];
    }
  });
  
  // Hooks
  const puntosQuery = usePuntosRecompensas(userId);
  const nivelQuery = useNivelRecompensas(userId);
  const beneficiosQuery = useBeneficios();
  const canjeaMutation = useCanjeaBeneficio();

  // Handle redeem
  async function handleRedeem(beneficio) {
    try {
      setError('');
      setSuccess('');
      await canjeaMutation.mutateAsync({ usuarioId: userId, beneficioId: beneficio.id });
      setSuccess(`Canje realizado exitosamente.`);
      
      const newRedeemed = [...redeemed, beneficio.id];
      setRedeemed(newRedeemed);
      localStorage.setItem(`redeemed_${userId}`, JSON.stringify(newRedeemed));
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible canjear el beneficio.');
    }
  }

  // Helper functions
  const extractLevel = (data) => {
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') return data.nivel || data.level || 'Bronce';
    return 'Bronce';
  };

  const extractPoints = (data) => {
    if (typeof data === 'number') return data;
    if (typeof data === 'string' && !isNaN(Number(data))) return Number(data);
    if (data && typeof data === 'object') return Number(data.puntosActuales ?? data.puntos ?? data.puntosAcumulados ?? 0);
    return 0;
  };

  const getThreshold = (level) => {
    const lv = level.toUpperCase();
    if (lv === 'BRONCE') return 1000;
    if (lv === 'PLATA') return 5000;
    if (lv === 'ORO') return 15000;
    return 0; // Platino or max
  };

  // Extract data
  const rawLevel = extractLevel(nivelQuery.data);
  const currentLevel = rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase();
  
  const points = extractPoints(puntosQuery.data);
  const threshold = getThreshold(currentLevel);
  const progress = threshold > 0 ? Math.min(100, Math.round((points / threshold) * 100)) : 100;

  const beneficiosData = Array.isArray(beneficiosQuery.data) ? beneficiosQuery.data : (beneficiosQuery.data?.beneficios || BENEFICIOS);

  const isLoading = puntosQuery.isLoading || nivelQuery.isLoading || beneficiosQuery.isLoading;
  const isRedeeming = canjeaMutation.isPending;

  return (
    <section className="flex flex-col gap-6 relative">
      {error && <div className="absolute top-0 right-0 w-full lg:w-auto z-10"><AlertaPanel type="error" title="No fue posible completar la acción" message={error} /></div>}
      {success && <div className="absolute top-0 right-0 w-full lg:w-auto z-10"><AlertaPanel type="success" title="Canje confirmado" message={success} /></div>}
      {isLoading ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
        <>
          <div className="bg-superficie rounded-md shadow-sutil border border-borde p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6 items-center">
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Fidelización</span>
                <div className="text-2xl font-bold text-textoPrincipal">{currentLevel}</div>
                <div className="text-5xl font-bold text-acento leading-none">{points}</div>
                <div className="text-base text-textoSecundario max-w-2xl">{LEVEL_TEXT[currentLevel] || LEVEL_TEXT.Bronce}</div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-full h-2 bg-borde rounded-full overflow-hidden">
                  <div className="h-full bg-acento transition-all duration-500 ease-smooth" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-sm text-textoSecundario font-medium">
                  {threshold > 0 ? `${points} de ${threshold} puntos para el siguiente nivel` : 'Has alcanzado el nivel máximo disponible'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-superficie rounded-md shadow-sutil border border-borde p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
              <h2 className="text-xl font-semibold text-textoPrincipal">Beneficios disponibles</h2>
              <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Canje inmediato</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {beneficiosData.map((beneficio) => (
                <article 
                  key={beneficio.id} 
                  className="group relative overflow-hidden flex flex-col p-6 bg-superficie border border-borde rounded-md shadow-sutil transition-all duration-150 hover:-translate-y-1 hover:shadow-media before:absolute before:inset-0 before:bg-gradient-to-br before:from-transparent before:to-acento/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200"
                >
                  <div className="relative z-10 flex flex-col h-full gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-base font-semibold text-textoPrincipal leading-tight">{getBeneficioLabel(beneficio)}</h3>
                      <div className="w-[32px] h-[32px] rounded-full bg-fondo flex items-center justify-center shrink-0 border border-borde/50 text-xs font-semibold text-acento">
                        {beneficio.puntosNecesarios}
                      </div>
                    </div>
                    
                    <div className="text-xs uppercase tracking-wider text-textoSecundario font-medium">
                      Nivel requerido: {beneficio.nivelRequerido}
                    </div>

                    <p className="text-sm text-textoSecundario flex-1 leading-relaxed">
                      {beneficio.descripcion}
                    </p>
                    
                    <button
                      type="button"
                      className="w-full mt-2 py-[10px] px-4 rounded-md font-medium bg-acento text-superficie transition-all duration-150 hover:bg-gradient-to-r hover:from-[#C47A44] hover:to-[#B86A38] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-acento"
                      onClick={() => handleRedeem(beneficio)}
                      disabled={isRedeeming || points < beneficio.puntosNecesarios || !beneficio.activo || redeemed.includes(beneficio.id)}
                    >
                      {isRedeeming ? 'Procesando...' : redeemed.includes(beneficio.id) ? 'Canjeado' : beneficio.activo ? 'Canjear beneficio' : 'No disponible'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}