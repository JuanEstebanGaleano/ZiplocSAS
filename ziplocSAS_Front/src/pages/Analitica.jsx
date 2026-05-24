import { useState, useRef, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertaPanel from '../components/AlertaPanel';
import {
  useReporteAnalitica,
  useFrecuenciaTiposAnalitica,
  useCategoriasActivasAnalitica,
  useMontoTotalAnalitica,
  useGrafoAnalitica,
  useTransaccionesMayorValorAnalitica,
  useRendimientoAnalitica,
  useTopBilleteras,
  useUsuariosActivos,
  useAuditoriaUsuario,
} from '../hooks/useAnalitica';

/* ─── Helpers ─────────────────────────────────────────── */
function riskStyle(value) {
  const v = String(value || '').toLowerCase();
  if (v.includes('alto')) return 'text-[#E05252]';
  if (v.includes('medio')) return 'text-[#5B8DEF]';
  return 'text-[#6A9B6A]';
}

function riskLabel(value) {
  const v = String(value || '').toLowerCase();
  if (v.includes('alto')) return 'Alto';
  if (v.includes('medio')) return 'Medio';
  return 'Bajo';
}

function ensureArray(data, keys = []) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key];
    }
    if (!data.id && !data.success && !data.message && !data.data) {
      const entries = Object.entries(data);
      if (entries.length > 0 && typeof entries[0][1] === 'number') {
        return entries.map(([k, v]) => ({ nombre: k, cantidad: v, total: v, tipo: k, categoria: k }));
      }
    }
  }
  return [];
}

function ensureNumber(data, keys = []) {
  if (typeof data === 'number') return data;
  if (data && typeof data === 'object') {
    for (const key of keys) {
      if (typeof data[key] === 'number') return data[key];
      if (typeof data[key] === 'string' && !isNaN(Number(data[key]))) return Number(data[key]);
    }
  }
  return 0;
}

function extractMonto(obj) {
  if (!obj) return 0;
  if (typeof obj === 'number') return obj;
  return Number(obj.montoTotalMovilizado || obj.montoTotal || obj.totalMovilizado || obj.monto || obj.saldo || obj.total || obj.valor || 0);
}

/* ─── Sub-components ──────────────────────────────────── */
function SectionHeader({ title, badge }) {
  return (
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[#D4D4D4] tracking-wide">{title}</h2>
        {badge && <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-[#4A4A4A] bg-[#1A1A1A] border border-[#252525] px-2 py-1 rounded-md">{badge}</span>}
      </div>
  );
}

function Card({ children, className = '' }) {
  return (
      <div className={`bg-[#111111] border border-[#1E1E1E] rounded-xl p-5 ${className}`}>
        {children}
      </div>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
      <div className="flex items-center justify-between gap-2 py-2.5 px-3 bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg hover:border-[#5B8DEF]/20 transition-colors duration-150">
        <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#4A4A4A] shrink-0">{label}</span>
        <span className={`text-sm font-bold truncate ${accent ? 'text-[#5B8DEF]' : 'text-[#E8E8E8]'}`}>{value}</span>
      </div>
  );
}

function TableRow({ children, header = false }) {
  return (
      <div className={`grid grid-cols-4 gap-3 items-center px-2 ${
          header
              ? 'pb-3 mb-1 border-b border-[#1C1C1C] text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3E3E3E]'
              : 'py-3.5 border-b border-[#161616] last:border-b-0 hover:bg-[#161616]/50 rounded-lg transition-colors duration-100'
      }`}>
        {children}
      </div>
  );
}

function RiskBadge({ value }) {
  const v = String(value || '').toLowerCase();
  const isHigh = v.includes('alto');
  const isMid = v.includes('medio');
  return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border ${
          isHigh ? 'text-[#E05252] bg-[#E05252]/8 border-[#E05252]/20' :
              isMid  ? 'text-[#5B8DEF] bg-[#5B8DEF]/8 border-[#5B8DEF]/20' :
                  'text-[#6A9B6A] bg-[#6A9B6A]/8 border-[#6A9B6A]/20'
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-[#E05252]' : isMid ? 'bg-[#5B8DEF]' : 'bg-[#6A9B6A]'}`} />
        {riskLabel(value)}
    </span>
  );
}

function EmptyState({ message }) {
  return (
      <div className="border border-dashed border-[#1E1E1E] rounded-lg p-5 bg-[#0D0D0D]">
        <p className="text-xs text-[#3E3E3E]">{message}</p>
      </div>
  );
}

function BarRow({ label, value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
      <div className="flex items-center gap-3 py-2">
        <span className="text-xs font-medium text-[#8A8A8A] w-28 shrink-0 truncate">{label}</span>
        <div className="flex-1 h-1.5 rounded-full bg-[#1C1C1C] overflow-hidden">
          <div className="h-full bg-[#5B8DEF] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold text-[#6A6A6A] w-8 text-right">{value}</span>
      </div>
  );
}

/* ─── Main ────────────────────────────────────────────── */
export default function Analitica({ userId }) {
  const containerRef = useRef(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 600, height: 340 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setGraphDimensions({ width: entries[0].contentRect.width, height: 340 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const getLocalISODate = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const endOfDay    = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const reporteQuery              = useReporteAnalitica(userId);
  const frecuenciaTiposQuery      = useFrecuenciaTiposAnalitica();
  const categoriasActivasQuery    = useCategoriasActivasAnalitica();
  const montoTotalQuery           = useMontoTotalAnalitica(getLocalISODate(startOfMonth), getLocalISODate(endOfDay));
  const grafoQuery                = useGrafoAnalitica(userId);
  const transaccionesMayorValorQuery = useTransaccionesMayorValorAnalitica();
  const rendimientoQuery          = useRendimientoAnalitica(userId);
  const topBilleterasQuery        = useTopBilleteras();
  const usuariosActivosQuery      = useUsuariosActivos();
  const auditoriaQuery            = useAuditoriaUsuario(userId);

  const reporte             = reporteQuery.data || {};
  const frecuenciaTipos     = ensureArray(frecuenciaTiposQuery.data, ['frecuenciaTipos', 'tipos']);
  const categoriasActivas   = ensureArray(categoriasActivasQuery.data, ['categorias']);
  const montoTotalGlobal    = ensureNumber(montoTotalQuery.data, ['montoTotal', 'total', 'valor']);
  const grafoData           = grafoQuery.data || {};
  const grafo = {
    nodos: Array.isArray(grafoData) ? grafoData : ensureArray(grafoData, ['nodos', 'nodes', 'vertices']),
    enlaces: ensureArray(grafoData, ['enlaces', 'links', 'edges', 'aristas', 'relaciones', 'conexiones']),
  };

  const graphDataMemo = useMemo(() => {
    if (!grafo.nodos?.length) return { nodes: [], links: [] };
    const nodes = grafo.nodos.map((n, i) => {
      const id = String(n.id ?? n.nombre ?? n.label ?? i);
      return { ...n, id, name: String(n.label || n.nombre || n.id || `Nodo ${i}`) };
    });
    const adjacencyLinks = [];
    grafo.nodos.forEach((n, i) => {
      const sourceId = String(n.id ?? n.nombre ?? n.label ?? i);
      const neighbors = ensureArray(n, ['vecinos','adyacentes','enlaces','links','edges','aristas','conexiones','relaciones']);
      neighbors.forEach(neighbor => {
        const targetId = typeof neighbor === 'object'
            ? String(neighbor.id ?? neighbor.nombre ?? neighbor.label ?? neighbor.destino ?? neighbor.target ?? neighbor.to ?? '')
            : String(neighbor);
        if (targetId) adjacencyLinks.push({ source: sourceId, target: targetId, ...(typeof neighbor === 'object' ? neighbor : {}) });
      });
    });
    const directLinks = (grafo.enlaces || []).map(l => {
      const s = l.source?.id ?? l.source?.nombre ?? l.source ?? l.origen?.id ?? l.origen?.nombre ?? l.origen ?? l.fuente ?? l.from;
      const t = l.target?.id ?? l.target?.nombre ?? l.target ?? l.destino?.id ?? l.destino?.nombre ?? l.destino ?? l.to;
      return { ...l, source: String(s), target: String(t) };
    });
    const links = [...directLinks, ...adjacencyLinks].filter(l => l.source && l.target && l.source !== 'undefined' && l.target !== 'undefined');
    return { nodes, links };
  }, [grafo.nodos, grafo.enlaces]);

  const transaccionesMayorValor = ensureArray(transaccionesMayorValorQuery.data, ['transacciones']);
  const rendimientoData = rendimientoQuery.data || {};
  const eficienciaCalc  = rendimientoData.busquedaListaLinealNs && rendimientoData.busquedaTablaHashNs
      ? Math.max(0, Math.round(((rendimientoData.busquedaListaLinealNs - rendimientoData.busquedaTablaHashNs) / rendimientoData.busquedaListaLinealNs) * 100))
      : 0;
  const rendimiento = {
    totalTransacciones: reporte.totalTransacciones || 0,
    montoTotalMovilizado: reporte.montoTotalMovilizado || 0,
    promedioTransaccion: reporte.promedioTransaccion || 0,
    eficiencia: eficienciaCalc || 99,
  };

  const topBilleteras      = ensureArray(topBilleterasQuery.data, ['billeteras']);
  const usuariosActivos    = ensureArray(usuariosActivosQuery.data, ['usuarios', 'content']);
  const auditoria          = auditoriaQuery.data || {};
  const eventos            = ensureArray(auditoria.eventos, ['eventos']);
  const frecuenciaPorTipo  = frecuenciaTipos;
  const montosPorPeriodo   = transaccionesMayorValor.slice(0, 5).map(t => ({
    periodo: t.fecha ? new Date(t.fecha).toLocaleDateString('es-CO') : 'Reciente',
    monto: t.valor,
  }));
  const billeterasMasUsadas   = topBilleteras.slice(0, 5);
  const eventosSospechosos    = eventos.filter(e => {
    const r = String(e.riesgo || '').toLowerCase();
    const d = String(e.descripcion || '').toLowerCase();
    return r.includes('alto') || d.includes('inusual') || d.includes('sospe');
  });

  const isLoading = [reporteQuery, frecuenciaTiposQuery, categoriasActivasQuery, montoTotalQuery, grafoQuery, transaccionesMayorValorQuery, rendimientoQuery, topBilleterasQuery, usuariosActivosQuery, auditoriaQuery].some(q => q.isLoading);
  const error     = [reporteQuery, frecuenciaTiposQuery, categoriasActivasQuery, montoTotalQuery, grafoQuery, transaccionesMayorValorQuery, rendimientoQuery, topBilleterasQuery, usuariosActivosQuery, auditoriaQuery].find(q => q.error)?.error;

  const freqMax = frecuenciaTipos.reduce((m, i) => Math.max(m, i.cantidad || i.total || 0), 0);

  return (
      <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start relative">
        {error && (
            <div className="absolute top-0 right-0 w-full xl:w-auto z-10">
              <AlertaPanel type="error" title="Sin datos" message={error?.message || String(error)} />
            </div>
        )}

        {isLoading ? (
            <div className="col-span-1 xl:col-span-2 flex justify-center py-16">
              <LoadingSpinner />
            </div>
        ) : (
            <>
              {/* ── Main Column ── */}
              <div className="col-span-1 xl:col-span-2 flex flex-col gap-5">

                {/* Personal report stats */}
                <Card>
                  <SectionHeader title="Reporte personal" badge={`Usuario #${userId}`} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <StatCard label="Total transacciones" value={reporte.totalTransacciones || 0} />
                    <StatCard label="Monto movilizado" value={`$\u00a0${extractMonto(reporte).toLocaleString('es-CO')}`} accent />
                    <StatCard label="Monto total global" value={`$\u00a0${Number(montoTotalGlobal||0).toLocaleString('es-CO')}`} />
                  </div>
                </Card>

                {/* Top billeteras */}
                <Card>
                  <SectionHeader title="Billeteras más activas" badge="Sistema" />
                  {topBilleteras.length ? (
                      <>
                        <TableRow header>
                          <div className="col-span-2">Nombre</div>
                          <div className="col-span-1">Txs</div>
                          <div className="col-span-1 text-right">Monto</div>
                        </TableRow>
                        {topBilleteras.map((w) => (
                            <TableRow key={w.id}>
                              <div className="col-span-2 flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-[#D4D4D4]">{w.nombre}</span>
                                <span className="text-[10px] text-[#3E3E3E]">ID {w.id}</span>
                              </div>
                              <div className="col-span-1 text-sm text-[#6A6A6A]">{w.transacciones}</div>
                              <div className="col-span-1 text-right text-sm font-bold text-[#5B8DEF]">
                                ${extractMonto(w).toLocaleString('es-CO')}
                              </div>
                            </TableRow>
                        ))}
                      </>
                  ) : <EmptyState message="Aún no hay billeteras destacadas." />}
                </Card>

                {/* Usuarios activos */}
                <Card>
                  <SectionHeader title="Usuarios con mayor actividad" badge="Sistema" />
                  {usuariosActivos.length ? (
                      <>
                        <TableRow header>
                          <div className="col-span-2">Usuario</div>
                          <div className="col-span-1">Txs</div>
                          <div className="col-span-1 text-right">Puntos</div>
                        </TableRow>
                        {usuariosActivos.map((u) => (
                            <TableRow key={u.id}>
                              <div className="col-span-2 flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-[#D4D4D4]">{u.nombre || `Usuario ${u.id}`}</span>
                                <span className="text-[10px] text-[#3E3E3E]">ID {u.id}</span>
                              </div>
                              <div className="col-span-1 text-sm text-[#6A6A6A]">{u.totalTransacciones || 0}</div>
                              <div className="col-span-1 text-right text-sm font-bold text-[#5B8DEF]">
                                {u.puntosActuales ?? u.puntosAcumulados ?? u.puntos ?? u.recompensas?.puntosActuales ?? 0} pts
                              </div>
                            </TableRow>
                        ))}
                      </>
                  ) : <EmptyState message="No se encontraron usuarios activos." />}
                </Card>

                {/* Billeteras más usadas */}
                <Card>
                  <SectionHeader title="Billeteras más usadas" badge="Ranking" />
                  {billeterasMasUsadas.length ? (
                      <>
                        <TableRow header>
                          <div className="col-span-2">Billetera</div>
                          <div className="col-span-1">Txs</div>
                          <div className="col-span-1 text-right">Monto</div>
                        </TableRow>
                        {billeterasMasUsadas.map((w) => (
                            <TableRow key={`used-${w.id}`}>
                              <div className="col-span-2 text-sm font-medium text-[#D4D4D4]">{w.nombre}</div>
                              <div className="col-span-1 text-sm text-[#6A6A6A]">{w.transacciones}</div>
                              <div className="col-span-1 text-right text-sm font-bold text-[#D4D4D4]">
                                ${extractMonto(w).toLocaleString('es-CO')}
                              </div>
                            </TableRow>
                        ))}
                      </>
                  ) : <EmptyState message="Sin información de uso disponible." />}
                </Card>

                {/* Frecuencia + Categorías */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card>
                    <SectionHeader title="Frecuencia de tipos" badge="Endpoint" />
                    {frecuenciaTipos.length
                        ? frecuenciaTipos.map((item, i) => (
                            <BarRow
                                key={i}
                                label={item.tipo || item.nombre || 'Tipo'}
                                value={item.cantidad || item.total || 0}
                                max={freqMax}
                            />
                        ))
                        : <EmptyState message="Sin datos de frecuencia por tipo." />}
                  </Card>

                  <Card>
                    <SectionHeader title="Categorías activas" badge="Endpoint" />
                    {categoriasActivas.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {categoriasActivas.map((item, i) => (
                              <div key={i} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg p-3">
                                <div className="text-xs font-semibold text-[#C8C8C8] truncate">{item.categoria || item.nombre || 'Categoría'}</div>
                                <div className="text-[10px] text-[#4A4A4A] mt-1">Cantidad: {item.cantidad || item.total || 0}</div>
                                <div className="text-[10px] text-[#4A4A4A]">Monto: ${extractMonto(item).toLocaleString('es-CO')}</div>
                              </div>
                          ))}
                        </div>
                    ) : <EmptyState message="Sin categorías activas." />}
                  </Card>
                </div>

                {/* Grafo */}
                <Card>
                  <SectionHeader
                      title="Grafo del usuario"
                      badge={`${grafo.nodos?.length || 0} nodos · ${graphDataMemo.links.length} aristas`}
                  />
                  {grafo.nodos?.length ? (
                      <div ref={containerRef} className="border border-[#1E1E1E] rounded-lg overflow-hidden" style={{ background: '#0D1117' }}>
                        <ForceGraph2D
                            width={graphDimensions.width}
                            height={graphDimensions.height}
                            graphData={graphDataMemo}
                            nodeLabel="name"
                            nodeAutoColorBy="id"
                            nodeRelSize={6}
                            linkColor={() => 'rgba(180,180,180,0.55)'}
                            linkWidth={1.5}
                            linkDirectionalArrowLength={4}
                            linkDirectionalArrowRelPos={1}
                            linkDirectionalParticles={1}
                            linkDirectionalParticleSpeed={0.004}
                            linkDirectionalParticleWidth={1.5}
                            backgroundColor="#0D1117"
                            nodeCanvasObject={(node, ctx, globalScale) => {
                              const label = node.name || node.id;
                              const fontSize = Math.max(10, 12 / globalScale);
                              const r = 6;
                              // Node circle
                              ctx.beginPath();
                              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                              ctx.fillStyle = node.color || '#5B8DEF';
                              ctx.fill();
                              // Subtle glow ring
                              ctx.beginPath();
                              ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
                              ctx.strokeStyle = (node.color || '#5B8DEF') + '44';
                              ctx.lineWidth = 2;
                              ctx.stroke();
                              // Label
                              if (globalScale > 0.6) {
                                ctx.font = `${fontSize}px Inter, sans-serif`;
                                ctx.fillStyle = '#C8C8C8';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillText(label, node.x, node.y + r + fontSize);
                              }
                            }}
                            nodePointerAreaPaint={(node, color, ctx) => {
                              ctx.fillStyle = color;
                              ctx.beginPath();
                              ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
                              ctx.fill();
                            }}
                        />
                      </div>
                  ) : (
                      <div ref={containerRef}>
                        <EmptyState message="Sin datos de grafo disponibles." />
                      </div>
                  )}
                </Card>

                {/* Frecuencia por tipo + Montos en el tiempo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card>
                    <SectionHeader title="Frecuencia por tipo" badge="Operaciones" />
                    {frecuenciaPorTipo.length ? (
                        <div className="flex flex-col">
                          {frecuenciaPorTipo.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm py-2.5 border-b border-[#161616] last:border-b-0">
                                <span className="font-medium text-[#C8C8C8]">{item.tipo || item.nombre || 'Tipo'}</span>
                                <span className="text-[#6A6A6A]">{item.total || item.cantidad || 0}</span>
                              </div>
                          ))}
                        </div>
                    ) : <EmptyState message="Sin datos de frecuencia por tipo." />}
                  </Card>

                  <Card>
                    <SectionHeader title="Monto procesado en el tiempo" badge="Tendencia" />
                    {montosPorPeriodo.length ? (
                        <div className="flex flex-col">
                          {montosPorPeriodo.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm py-2.5 border-b border-[#161616] last:border-b-0">
                                <span className="font-medium text-[#C8C8C8]">{item.periodo || 'Periodo'}</span>
                                <span className="text-[#5B8DEF] font-semibold">${extractMonto(item).toLocaleString('es-CO')}</span>
                              </div>
                          ))}
                        </div>
                    ) : <EmptyState message="Sin historial de montos por periodo." />}
                  </Card>
                </div>
              </div>

              {/* ── Sidebar Column ── */}
              <aside className="col-span-1 flex flex-col gap-5">

                {/* Rendimiento */}
                <Card>
                  <SectionHeader title="Rendimiento" badge={String(userId).slice(0, 8) + '…'} />
                  <div className="flex flex-col gap-1.5">
                    <StatCard label="Transacciones" value={rendimiento.totalTransacciones ?? 0} />
                    <StatCard label="Monto movilizado" value={`$\u00a0${extractMonto(rendimiento).toLocaleString('es-CO')}`} accent />
                    <StatCard label="Promedio" value={`$\u00a0${Number(rendimiento.promedioTransaccion||0).toLocaleString('es-CO')}`} />
                    <StatCard label="Eficiencia" value={`${Number(rendimiento.eficiencia ?? 0)}%`} accent />
                  </div>
                </Card>

                {/* Txs mayor valor */}
                <Card>
                  <SectionHeader title="Transacciones de mayor valor" badge="Top 5" />
                  {transaccionesMayorValor.length ? (
                      <div className="flex flex-col">
                        {transaccionesMayorValor.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-[#161616] last:border-b-0">
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium text-[#C8C8C8] truncate">{item.tipo}</span>
                                <span className="text-[10px] text-[#4A4A4A] truncate">{item.fecha ? item.fecha.replace('T', ' ').slice(0, 16) : 'Sin fecha'}</span>
                              </div>
                              <span className="text-sm font-bold text-[#5B8DEF] shrink-0">${extractMonto(item).toLocaleString('es-CO')}</span>
                            </div>
                        ))}
                      </div>
                  ) : <EmptyState message="Sin ranking disponible." />}
                </Card>

                {/* Auditoría */}
                <Card>
                  <SectionHeader title="Auditoría" badge="Riesgo operativo" />
                  {eventos.length ? (
                      <div className="flex flex-col">
                        {/* header */}
                        <div className="flex items-center gap-2 pb-2 mb-1 border-b border-[#1C1C1C] text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3E3E3E] px-1">
                          <span className="flex-1">Tipo</span>
                          <span className="w-14 text-center">Riesgo</span>
                          <span className="w-24 text-right">Fecha</span>
                        </div>
                        {eventos.map((evento) => (
                            <div key={evento.id} className="flex items-start gap-2 py-2.5 border-b border-[#161616] last:border-b-0 hover:bg-[#161616]/50 rounded-lg px-1 transition-colors duration-100">
                              <span className="flex-1 text-xs font-medium text-[#C8C8C8] truncate">{evento.tipo}</span>
                              <div className="w-14 flex justify-center shrink-0"><RiskBadge value={evento.riesgo} /></div>
                              <span className="w-24 text-right text-[10px] text-[#3E3E3E] shrink-0 tabular-nums">
                        {evento.fecha ? evento.fecha.replace('T', ' ').slice(0, 16) : '—'}
                      </span>
                            </div>
                        ))}
                      </div>
                  ) : <EmptyState message="No hay eventos de auditoría para este usuario." />}
                </Card>

                {/* Actividad sospechosa */}
                {eventosSospechosos.length > 0 && (
                    <Card>
                      <SectionHeader title="Actividad sospechosa" badge="Detección" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 pb-2 mb-1 border-b border-[#1C1C1C] text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3E3E3E] px-1">
                          <span className="flex-1">Evento</span>
                          <span className="w-14 text-center">Riesgo</span>
                          <span className="w-24 text-right">Fecha</span>
                        </div>
                        {eventosSospechosos.map((evento) => (
                            <div key={`sus-${evento.id}`} className="flex items-start gap-2 py-2.5 border-b border-[#161616] last:border-b-0 hover:bg-[#161616]/50 rounded-lg px-1 transition-colors duration-100">
                              <span className="flex-1 text-xs font-medium text-[#C8C8C8] truncate">{evento.tipo}</span>
                              <div className="w-14 flex justify-center shrink-0"><RiskBadge value={evento.riesgo} /></div>
                              <span className="w-24 text-right text-[10px] text-[#3E3E3E] shrink-0 tabular-nums">
                        {evento.fecha ? evento.fecha.replace('T', ' ').slice(0, 16) : '—'}
                      </span>
                            </div>
                        ))}
                      </div>
                    </Card>
                )}
              </aside>
            </>
        )}
      </section>
  );
}
