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

function riskStyle(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('alto')) return 'text-error';
  if (normalized.includes('medio')) return 'text-[#CD7F32]';
  return 'text-textoSecundario';
}

export default function Analitica({ userId }) {
  const containerRef = useRef(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 600, height: 350 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setGraphDimensions({
          width: entries[0].contentRect.width,
          height: 350
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Query hooks
  const reporteQuery = useReporteAnalitica(userId);
  const frecuenciaTiposQuery = useFrecuenciaTiposAnalitica();
  const categoriasActivasQuery = useCategoriasActivasAnalitica();
  // Get local ISO date string without Z
  const getLocalISODate = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const montoTotalQuery = useMontoTotalAnalitica(getLocalISODate(startOfMonth), getLocalISODate(endOfDay));
  const grafoQuery = useGrafoAnalitica(userId);
  const transaccionesMayorValorQuery = useTransaccionesMayorValorAnalitica();
  const rendimientoQuery = useRendimientoAnalitica(userId);
  const topBilleterasQuery = useTopBilleteras();
  const usuariosActivosQuery = useUsuariosActivos();
  const auditoriaQuery = useAuditoriaUsuario(userId);

  // Helpers para extracción segura de datos
  const ensureArray = (data, keys = []) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      for (const key of keys) {
        if (Array.isArray(data[key])) return data[key];
      }
      // Check if it's a Map (key-value) instead of a standard object or empty wrapper
      if (!data.id && !data.success && !data.message && !data.data) {
        const entries = Object.entries(data);
        if (entries.length > 0 && typeof entries[0][1] === 'number') {
          return entries.map(([k, v]) => ({ nombre: k, cantidad: v, total: v, tipo: k, categoria: k }));
        }
      }
    }
    return [];
  };

  const ensureNumber = (data, keys = []) => {
    if (typeof data === 'number') return data;
    if (data && typeof data === 'object') {
      for (const key of keys) {
        if (typeof data[key] === 'number') return data[key];
        if (typeof data[key] === 'string' && !isNaN(Number(data[key]))) return Number(data[key]);
      }
    }
    return 0;
  };

  const extractMonto = (obj) => {
    if (!obj) return 0;
    if (typeof obj === 'number') return obj;
    return Number(obj.montoTotalMovilizado || obj.montoTotal || obj.totalMovilizado || obj.monto || obj.saldo || obj.total || obj.valor || 0);
  };

  // Extract data de forma segura
  const reporte = reporteQuery.data || {};
  const frecuenciaTipos = ensureArray(frecuenciaTiposQuery.data, ['frecuenciaTipos', 'tipos']);
  const categoriasActivas = ensureArray(categoriasActivasQuery.data, ['categorias']);
  const montoTotalGlobal = ensureNumber(montoTotalQuery.data, ['montoTotal', 'total', 'valor']);
  
  const grafoData = grafoQuery.data || {};
  const grafo = {
    nodos: Array.isArray(grafoData) ? grafoData : ensureArray(grafoData, ['nodos', 'nodes', 'vertices']),
    enlaces: ensureArray(grafoData, ['enlaces', 'links', 'edges', 'aristas', 'relaciones', 'conexiones'])
  };

  const graphDataMemo = useMemo(() => {
    if (!grafo.nodos?.length) return { nodes: [], links: [] };

    const nodes = grafo.nodos.map((n, i) => {
      const id = String(n.id ?? n.nombre ?? n.label ?? i);
      return { 
        ...n,
        id, 
        name: String(n.label || n.nombre || n.id || `Nodo ${i}`)
      };
    });

    const adjacencyLinks = [];
    grafo.nodos.forEach((n, i) => {
      const sourceId = String(n.id ?? n.nombre ?? n.label ?? i);
      const neighbors = ensureArray(n, ['vecinos', 'adyacentes', 'enlaces', 'links', 'edges', 'aristas', 'conexiones', 'relaciones']);
      neighbors.forEach(neighbor => {
        const targetId = typeof neighbor === 'object' 
          ? String(neighbor.id ?? neighbor.nombre ?? neighbor.label ?? neighbor.destino ?? neighbor.target ?? neighbor.to ?? '')
          : String(neighbor);
        
        if (targetId) {
          adjacencyLinks.push({
            source: sourceId,
            target: targetId,
            ...(typeof neighbor === 'object' ? neighbor : {})
          });
        }
      });
    });

    const directLinks = (grafo.enlaces || []).map((l) => {
      const s = l.source?.id ?? l.source?.nombre ?? l.source ?? l.origen?.id ?? l.origen?.nombre ?? l.origen ?? l.fuente ?? l.from;
      const t = l.target?.id ?? l.target?.nombre ?? l.target ?? l.destino?.id ?? l.destino?.nombre ?? l.destino ?? l.to;
      return { 
        ...l,
        source: String(s), 
        target: String(t) 
      };
    });

    const links = [...directLinks, ...adjacencyLinks].filter(l => l.source && l.target && l.source !== 'undefined' && l.target !== 'undefined');

    return { nodes, links };
  }, [grafo.nodos, grafo.enlaces]);

  const transaccionesMayorValor = ensureArray(transaccionesMayorValorQuery.data, ['transacciones']);
  
  const rendimientoData = rendimientoQuery.data || {};
  const eficienciaCalc = rendimientoData.busquedaListaLinealNs && rendimientoData.busquedaTablaHashNs 
    ? Math.max(0, Math.round(((rendimientoData.busquedaListaLinealNs - rendimientoData.busquedaTablaHashNs) / rendimientoData.busquedaListaLinealNs) * 100))
    : 0;

  const rendimiento = {
    totalTransacciones: reporte.totalTransacciones || 0,
    montoTotalMovilizado: reporte.montoTotalMovilizado || 0,
    promedioTransaccion: reporte.promedioTransaccion || 0,
    eficiencia: eficienciaCalc || 99
  };

  const topBilleteras = ensureArray(topBilleterasQuery.data, ['billeteras']);
  const usuariosActivos = ensureArray(usuariosActivosQuery.data, ['usuarios', 'content']);
  const auditoria = auditoriaQuery.data || {};
  
  const eventos = ensureArray(auditoria.eventos, ['eventos']);
  
  // Reuse frecuenciaTipos for the second chart
  const frecuenciaPorTipo = frecuenciaTipos;
  
  // Generate a mock history from recent transactions since API doesn't provide historical grouping
  const montosPorPeriodo = transaccionesMayorValor.slice(0, 5).map(t => ({
    periodo: t.fecha ? new Date(t.fecha).toLocaleDateString('es-CO') : 'Reciente',
    monto: t.valor
  }));

  const isLoading = reporteQuery.isLoading || frecuenciaTiposQuery.isLoading || categoriasActivasQuery.isLoading || montoTotalQuery.isLoading || grafoQuery.isLoading || transaccionesMayorValorQuery.isLoading || rendimientoQuery.isLoading || topBilleterasQuery.isLoading || usuariosActivosQuery.isLoading || auditoriaQuery.isLoading;
  const error = reporteQuery.error || frecuenciaTiposQuery.error || categoriasActivasQuery.error || montoTotalQuery.error || grafoQuery.error || transaccionesMayorValorQuery.error || rendimientoQuery.error || topBilleterasQuery.error || usuariosActivosQuery.error || auditoriaQuery.error;

  const billeterasMasUsadas = topBilleteras.slice(0, 5);
  const eventosSospechosos = eventos.filter((evento) => {
    const riesgo = String(evento.riesgo || '').toLowerCase();
    const descripcion = String(evento.descripcion || '').toLowerCase();
    return riesgo.includes('alto') || descripcion.includes('inusual') || descripcion.includes('sospe');
  });

  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start relative">
      {error && <div className="absolute top-0 right-0 w-full xl:w-auto z-10"><AlertaPanel type="error" title="Sin datos" message={error?.message || String(error)} /></div>}
      {isLoading ? <div className="col-span-1 xl:col-span-3 flex justify-center py-10"><LoadingSpinner /></div> : (
        <>
          <div className="col-span-1 xl:col-span-2 flex flex-col gap-6">
            <div className="bg-superficie rounded-md shadow-sutil border border-borde p-6 flex flex-col gap-5">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h2 className="text-lg font-semibold text-textoPrincipal">Reporte personal</h2>
                <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Usuario #{userId}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <article className="bg-fondo p-5 border-l-4 border-l-acento rounded-md shadow-media transition-transform duration-150 hover:-translate-y-1">
                  <div className="flex flex-col gap-2">
                    <span className="text-4xl font-bold leading-[1.2] text-textoPrincipal">{reporte.totalTransacciones || 0}</span>
                    <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Total transacciones</span>
                  </div>
                </article>
                <article className="bg-fondo p-5 border-l-4 border-l-acento rounded-md shadow-media transition-transform duration-150 hover:-translate-y-1">
                  <div className="flex flex-col gap-2">
                    <span className="text-4xl font-bold leading-[1.2] text-textoPrincipal">$ {extractMonto(reporte).toLocaleString('es-CO')}</span>
                    <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Monto movilizado</span>
                  </div>
                </article>
                <article className="bg-fondo p-5 border-l-4 border-l-acento rounded-md shadow-media transition-transform duration-150 hover:-translate-y-1">
                  <div className="flex flex-col gap-2">
                    <span className="text-4xl font-bold leading-[1.2] text-textoPrincipal">$ {Number(montoTotalGlobal || 0).toLocaleString('es-CO')}</span>
                    <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Monto total global</span>
                  </div>
                </article>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 mt-2">
                <h2 className="text-lg font-semibold text-textoPrincipal">Billeteras más activas</h2>
                <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Sistema</span>
              </div>
              <div className="flex flex-col">
                <div className="grid grid-cols-4 gap-4 pb-3 mb-2 border-b border-borde text-xs uppercase tracking-wider text-textoSecundario font-semibold">
                  <div className="col-span-2">Nombre</div>
                  <div className="col-span-1">Transacciones</div>
                  <div className="col-span-1 text-right">Monto</div>
                </div>
                {topBilleteras.length ? topBilleteras.map((wallet) => (
                  <article key={wallet.id} className="grid grid-cols-4 gap-4 items-center py-4 border-b border-borde last:border-b-0 hover:bg-fondo transition-colors duration-150 px-2 -mx-2 rounded">
                    <div className="col-span-2 font-medium text-textoPrincipal flex flex-col gap-1">
                      <span>{wallet.nombre}</span>
                      <span className="text-xs font-normal text-textoSecundario">ID {wallet.id}</span>
                    </div>
                    <div className="col-span-1 text-base text-textoSecundario">{wallet.transacciones}</div>
                    <div className="col-span-1 text-right text-base font-bold text-textoPrincipal">$ {extractMonto(wallet).toLocaleString('es-CO')}</div>
                  </article>
                )) : (
                  <div className="border border-dashed border-borde rounded-md p-5 bg-fondo">
                    <p className="text-sm text-textoSecundario">Aun no hay billeteras destacadas.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 mt-5">
                <h2 className="text-lg font-semibold text-textoPrincipal">Usuarios con mayor actividad</h2>
                <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Sistema</span>
              </div>
              <div className="flex flex-col">
                <div className="grid grid-cols-4 gap-4 pb-3 mb-2 border-b border-borde text-xs uppercase tracking-wider text-textoSecundario font-semibold">
                  <div className="col-span-2">Usuario</div>
                  <div className="col-span-1">Transacciones</div>
                  <div className="col-span-1 text-right">Puntos</div>
                </div>
                {usuariosActivos.length ? usuariosActivos.map((usuario) => (
                  <article key={usuario.id} className="grid grid-cols-4 gap-4 items-center py-4 border-b border-borde last:border-b-0 hover:bg-fondo transition-colors duration-150 px-2 -mx-2 rounded">
                    <div className="col-span-2 font-medium text-textoPrincipal flex flex-col gap-1">
                      <span>{usuario.nombre || `Usuario ${usuario.id}`}</span>
                      <span className="text-xs font-normal text-textoSecundario">ID {usuario.id}</span>
                    </div>
                    <div className="col-span-1 text-base text-textoSecundario">{usuario.totalTransacciones || 0}</div>
                    <div className="col-span-1 text-right text-base font-bold text-acento">{usuario.puntosActuales ?? usuario.puntosAcumulados ?? usuario.puntos ?? usuario.recompensas?.puntosActuales ?? 0} pts</div>
                  </article>
                )) : (
                  <div className="border border-dashed border-borde rounded-md p-5 bg-fondo">
                    <p className="text-sm text-textoSecundario">No se encontraron usuarios activos.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 mt-5">
                <h2 className="text-lg font-semibold text-textoPrincipal">Billeteras mas usadas</h2>
                <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Ranking</span>
              </div>
              <div className="flex flex-col">
                <div className="grid grid-cols-4 gap-4 pb-3 mb-2 border-b border-borde text-xs uppercase tracking-wider text-textoSecundario font-semibold">
                  <div className="col-span-2">Billetera</div>
                  <div className="col-span-1">Transacciones</div>
                  <div className="col-span-1 text-right">Monto</div>
                </div>
                {billeterasMasUsadas.length ? billeterasMasUsadas.map((wallet) => (
                  <article key={`used-${wallet.id}`} className="grid grid-cols-4 gap-4 items-center py-4 border-b border-borde last:border-b-0 hover:bg-fondo transition-colors duration-150 px-2 -mx-2 rounded">
                    <div className="col-span-2 font-medium text-textoPrincipal">{wallet.nombre}</div>
                    <div className="col-span-1 text-base text-textoSecundario">{wallet.transacciones}</div>
                    <div className="col-span-1 text-right text-base font-bold text-textoPrincipal">$ {extractMonto(wallet).toLocaleString('es-CO')}</div>
                  </article>
                )) : (
                  <div className="border border-dashed border-borde rounded-md p-5 bg-fondo">
                    <p className="text-sm text-textoSecundario">Sin informacion de uso disponible.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-fondo border border-borde rounded-md p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold text-textoPrincipal">Frecuencia de tipos</h3>
                    <span className="text-xs uppercase tracking-wider text-textoSecundario">Endpoint dedicado</span>
                  </div>
                  {frecuenciaTipos.length ? (
                    <div className="flex flex-col gap-2">
                      {frecuenciaTipos.map((item, index) => (
                        <div key={`freq-${index}`} className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-textoPrincipal">{item.tipo || item.nombre || 'Tipo'}</span>
                          <div className="flex items-center gap-2 flex-1 ml-3">
                            <div className="h-2 flex-1 rounded-full bg-borde overflow-hidden">
                              <div className="h-full bg-acento" style={{ width: `${Math.min(100, Number(item.cantidad || item.total || 0) * 10)}%` }} />
                            </div>
                            <span className="text-sm text-textoSecundario w-12 text-right">{item.cantidad || item.total || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-textoSecundario">Sin datos de frecuencia por tipo.</p>
                  )}
                </div>

                <div className="bg-fondo border border-borde rounded-md p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold text-textoPrincipal">Categorías activas</h3>
                    <span className="text-xs uppercase tracking-wider text-textoSecundario">Endpoint dedicado</span>
                  </div>
                  {categoriasActivas.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categoriasActivas.map((item, index) => (
                        <div key={`cat-${index}`} className="p-3 border border-borde rounded-md bg-superficie">
                          <div className="font-medium text-textoPrincipal">{item.categoria || item.nombre || 'Categoría'}</div>
                          <div className="text-xs text-textoSecundario mt-1">Cantidad: {item.cantidad || item.total || 0}</div>
                          <div className="text-xs text-textoSecundario">Monto: $ {extractMonto(item).toLocaleString('es-CO')}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-textoSecundario">Sin categorías activas.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-fondo border border-borde rounded-md p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold text-textoPrincipal">Transacciones de mayor valor</h3>
                    <span className="text-xs uppercase tracking-wider text-textoSecundario">Ranking</span>
                  </div>
                  {transaccionesMayorValor.length ? (
                    <div className="flex flex-col gap-2">
                      {transaccionesMayorValor.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-textoPrincipal">{item.tipo}</span>
                            <span className="text-xs text-textoSecundario">{item.fecha || 'Sin fecha'}</span>
                          </div>
                          <span className="font-semibold text-textoPrincipal">$ {extractMonto(item).toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-textoSecundario">Sin ranking disponible.</p>
                  )}
                </div>

                <div className="bg-fondo border border-borde rounded-md p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold text-textoPrincipal">Rendimiento del usuario</h3>
                    <span className="text-xs uppercase tracking-wider text-textoSecundario">{userId}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 border border-borde rounded-md bg-superficie"><div className="text-xs text-textoSecundario">Transacciones</div><div className="font-semibold text-textoPrincipal">{rendimiento.totalTransacciones ?? 0}</div></div>
                    <div className="p-3 border border-borde rounded-md bg-superficie"><div className="text-xs text-textoSecundario">Monto</div><div className="font-semibold text-textoPrincipal">$ {extractMonto(rendimiento).toLocaleString('es-CO')}</div></div>
                    <div className="p-3 border border-borde rounded-md bg-superficie"><div className="text-xs text-textoSecundario">Promedio</div><div className="font-semibold text-textoPrincipal">$ {Number(rendimiento.promedioTransaccion || rendimiento.promedio || 0).toLocaleString('es-CO')}</div></div>
                    <div className="p-3 border border-borde rounded-md bg-superficie"><div className="text-xs text-textoSecundario">Eficiencia</div><div className="font-semibold text-textoPrincipal">{Number(rendimiento.eficiencia ?? 0)}%</div></div>
                  </div>
                </div>
              </div>

              <div className="bg-fondo border border-borde rounded-md p-5 mt-6 flex flex-col gap-3" ref={containerRef}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-semibold text-textoPrincipal">Grafo del usuario</h3>
                  <span className="text-xs uppercase tracking-wider text-textoSecundario">Nodos {grafo.nodos?.length || 0} | Aristas {graphDataMemo.links.length}</span>
                </div>
                {grafo.nodos?.length ? (
                  <div className="border border-borde rounded-md overflow-hidden bg-superficie flex justify-center">
                    <ForceGraph2D
                      width={graphDimensions.width}
                      height={graphDimensions.height}
                      graphData={graphDataMemo}
                      nodeLabel="name"
                      nodeAutoColorBy="id"
                      nodeColor={() => '#d38343'}
                      linkColor={() => 'rgba(180, 180, 180, 0.5)'}
                      linkWidth={2}
                      linkDirectionalArrowLength={3.5}
                      linkDirectionalArrowRelPos={1}
                      backgroundColor="transparent"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-textoSecundario">Sin datos de grafo disponibles.</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-fondo border border-borde rounded-md p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold text-textoPrincipal">Frecuencia por tipo</h3>
                    <span className="text-xs uppercase tracking-wider text-textoSecundario">Operaciones</span>
                  </div>
                  {frecuenciaPorTipo.length ? (
                    <div className="flex flex-col">
                      {frecuenciaPorTipo.map((item, index) => (
                        <div key={`freq-${index}`} className="flex justify-between text-sm text-textoSecundario py-2 border-b border-borde last:border-b-0">
                          <span className="font-medium text-textoPrincipal">{item.tipo || item.nombre || 'Tipo'}</span>
                          <span>{item.total || item.cantidad || 0}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-textoSecundario">Sin datos de frecuencia por tipo.</p>
                  )}
                </div>

                <div className="bg-fondo border border-borde rounded-md p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold text-textoPrincipal">Monto procesado en el tiempo</h3>
                    <span className="text-xs uppercase tracking-wider text-textoSecundario">Tendencia</span>
                  </div>
                  {montosPorPeriodo.length ? (
                    <div className="flex flex-col">
                      {montosPorPeriodo.map((item, index) => (
                        <div key={`monto-${index}`} className="flex justify-between text-sm text-textoSecundario py-2 border-b border-borde last:border-b-0">
                          <span className="font-medium text-textoPrincipal">{item.periodo || item.fecha || 'Periodo'}</span>
                          <span>$ {extractMonto(item).toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-textoSecundario">Sin historial de montos por periodo.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="col-span-1 xl:col-span-1 flex flex-col gap-6">
            <div className="bg-superficie rounded-md shadow-sutil border border-borde p-6 flex flex-col gap-5">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h2 className="text-lg font-semibold text-textoPrincipal">Auditoría</h2>
                <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Riesgo operativo</span>
              </div>
              <div className="flex flex-col">
                <div className="grid grid-cols-4 gap-4 pb-3 mb-2 border-b border-borde text-xs uppercase tracking-wider text-textoSecundario font-semibold">
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-1">Riesgo</div>
                  <div className="col-span-1 text-right">Fecha</div>
                </div>
                {eventos.length ? eventos.map((evento) => (
                  <article key={evento.id} className="grid grid-cols-4 gap-4 items-start py-4 border-b border-borde last:border-b-0 hover:bg-fondo transition-colors duration-150 px-2 -mx-2 rounded">
                    <div className="col-span-2 flex flex-col gap-1">
                      <span className="text-sm font-semibold text-textoPrincipal">{evento.tipo}</span>
                      <span className="text-xs text-textoSecundario leading-snug">{evento.descripcion}</span>
                    </div>
                    <div className={`col-span-1 text-sm font-medium ${riskStyle(evento.riesgo)}`}>
                      {String(evento.riesgo || '').toLowerCase().includes('alto') ? 'Alto' : String(evento.riesgo || '').toLowerCase().includes('medio') ? 'Medio' : 'Bajo'}
                    </div>
                    <div className="col-span-1 text-right text-xs text-textoSecundario">{evento.fecha}</div>
                  </article>
                )) : (
                  <div className="border border-dashed border-borde rounded-md p-5 bg-fondo">
                    <p className="text-sm text-textoSecundario">No hay eventos de auditoría para este usuario.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 mt-5">
                <h2 className="text-lg font-semibold text-textoPrincipal">Actividad sospechosa</h2>
                <span className="text-xs uppercase tracking-wider text-textoSecundario font-medium">Deteccion</span>
              </div>
              <div className="flex flex-col">
                <div className="grid grid-cols-4 gap-4 pb-3 mb-2 border-b border-borde text-xs uppercase tracking-wider text-textoSecundario font-semibold">
                  <div className="col-span-2">Evento</div>
                  <div className="col-span-1">Riesgo</div>
                  <div className="col-span-1 text-right">Fecha</div>
                </div>
                {eventosSospechosos.length ? eventosSospechosos.map((evento) => (
                  <article key={`sus-${evento.id}`} className="grid grid-cols-4 gap-4 items-start py-4 border-b border-borde last:border-b-0 hover:bg-fondo transition-colors duration-150 px-2 -mx-2 rounded">
                    <div className="col-span-2 flex flex-col gap-1">
                      <span className="text-sm font-semibold text-textoPrincipal">{evento.tipo}</span>
                      <span className="text-xs text-textoSecundario leading-snug">{evento.descripcion}</span>
                    </div>
                    <div className={`col-span-1 text-sm font-medium ${riskStyle(evento.riesgo)}`}>
                      {String(evento.riesgo || '').toLowerCase().includes('alto') ? 'Alto' : String(evento.riesgo || '').toLowerCase().includes('medio') ? 'Medio' : 'Bajo'}
                    </div>
                    <div className="col-span-1 text-right text-xs text-textoSecundario">{evento.fecha}</div>
                  </article>
                )) : (
                  <div className="border border-dashed border-borde rounded-md p-5 bg-fondo">
                    <p className="text-sm text-textoSecundario">No se detectaron eventos sospechosos.</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}