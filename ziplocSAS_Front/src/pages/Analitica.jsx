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
function riskLabel(value) {
  const v = String(value || '').toLowerCase();
  if (v.includes('alto')) return 'ALTO';
  if (v.includes('medio')) return 'MEDIO';
  return 'BAJO';
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

const fmt = (n) => Number(n || 0).toLocaleString('es-CO');
const fmtMoney = (n) => `$\u00a0${fmt(n)}`;

/* ─── Design tokens ───────────────────────────────────── */
const T = {
  bg:       '#06060A',
  surface:  '#0C0C12',
  card:     '#0F0F17',
  border:   'rgba(255,255,255,0.06)',
  borderHi: 'rgba(255,255,255,0.12)',
  acid:     '#C8FF00',       // acid yellow-green — the hero accent
  acidDim:  'rgba(200,255,0,0.12)',
  acidGlow: 'rgba(200,255,0,0.25)',
  red:      '#FF2D55',
  redDim:   'rgba(255,45,85,0.12)',
  blue:     '#0AF',
  blueDim:  'rgba(0,170,255,0.12)',
  amber:    '#FFAA00',
  text:     'rgba(255,255,255,0.9)',
  textDim:  'rgba(255,255,255,0.4)',
  textFaint:'rgba(255,255,255,0.18)',
};

/* ─── Primitive blocks ────────────────────────────────── */

function Mono({ children, style = {} }) {
  return (
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", ...style }}>
      {children}
    </span>
  );
}

function Tag({ children, color = T.acid }) {
  return (
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        padding: '2px 8px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
      }}>
      {children}
    </span>
  );
}

function SectionTitle({ children, tag, accent = T.acid }) {
  return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 16, background: accent, borderRadius: 2, boxShadow: `0 0 8px ${accent}` }} />
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: T.text,
          }}>
          {children}
        </span>
        </div>
        {tag && <Tag color={accent}>{tag}</Tag>}
      </div>
  );
}

function Panel({ children, style = {}, accent, glow = false }) {
  return (
      <div style={{
        background: T.card,
        border: `1px solid ${accent ? `${accent}22` : T.border}`,
        borderRadius: 12,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: glow && accent ? `0 0 32px ${accent}10` : 'none',
        ...style,
      }}>
        {children}
      </div>
  );
}

/* Big KPI block */
function KPI({ label, value, sub, accent = T.acid, index = 0 }) {
  return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '18px 20px',
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderTop: `2px solid ${accent}`,
        borderRadius: 10,
        position: 'relative',
        overflow: 'hidden',
        animation: `anFadeUp 0.4s ease both`,
        animationDelay: `${index * 0.06}s`,
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, borderRadius: '50%', background: accent, opacity: 0.04, filter: 'blur(20px)' }} />
        <Mono style={{ fontSize: 9, color: T.textFaint, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{label}</Mono>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: 28,
          lineHeight: 1,
          color: accent,
          letterSpacing: '-0.01em',
        }}>{value}</div>
        {sub && <Mono style={{ fontSize: 10, color: T.textDim }}>{sub}</Mono>}
      </div>
  );
}

/* Row in a data table */
function DataRow({ cols, header = false, accent }) {
  return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: cols.map(c => c.width || '1fr').join(' '),
        gap: 12,
        alignItems: 'center',
        padding: header ? '0 8px 10px' : '11px 8px',
        borderBottom: `1px solid ${header ? T.borderHi : 'rgba(255,255,255,0.04)'}`,
        background: 'transparent',
        transition: 'background 0.12s',
      }}
           onMouseEnter={e => { if (!header) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
           onMouseLeave={e => { if (!header) e.currentTarget.style.background = 'transparent'; }}
      >
        {cols.map((col, i) => (
            <div key={i} style={{
              textAlign: col.align || 'left',
              fontFamily: header ? "'IBM Plex Mono', monospace" : col.mono ? "'IBM Plex Mono', monospace" : "'Barlow', sans-serif",
              fontSize: header ? 9 : col.mono ? 11 : 13,
              fontWeight: header ? 600 : col.bold ? 700 : 400,
              color: header ? T.textFaint : col.accent ? accent || T.acid : T.textDim,
              letterSpacing: header ? '0.14em' : '0',
              textTransform: header ? 'uppercase' : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {col.content}
            </div>
        ))}
      </div>
  );
}

/* Horizontal bar */
function HBar({ label, value, max, color = T.acid }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
        <div style={{
          fontFamily: "'Barlow', sans-serif",
          fontSize: 12,
          color: T.textDim,
          width: 110,
          flexShrink: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{label}</div>
        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 2,
            boxShadow: `0 0 6px ${color}80`,
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
        <Mono style={{ fontSize: 11, color: T.textFaint, width: 28, textAlign: 'right', flexShrink: 0 }}>{value}</Mono>
      </div>
  );
}

/* Risk badge */
function RiskBadge({ value }) {
  const label = riskLabel(value);
  const color = label === 'ALTO' ? T.red : label === 'MEDIO' ? T.blue : '#3DBA7A';
  return (
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 8,
        letterSpacing: '0.14em',
        color,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        padding: '2px 6px',
        borderRadius: 3,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
      }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 4px ${color}` }} />
        {label}
    </span>
  );
}

/* Empty slot */
function Empty({ text }) {
  return (
      <div style={{
        border: `1px dashed rgba(255,255,255,0.07)`,
        borderRadius: 8,
        padding: '20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <Mono style={{ fontSize: 10, color: T.textFaint }}>// {text}</Mono>
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
  const freqMax = frecuenciaTipos.reduce((m, i) => Math.max(m, i.cantidad || i.total || 0), 0);

  const isLoading = [reporteQuery, frecuenciaTiposQuery, categoriasActivasQuery, montoTotalQuery, grafoQuery, transaccionesMayorValorQuery, rendimientoQuery, topBilleterasQuery, usuariosActivosQuery, auditoriaQuery].some(q => q.isLoading);
  const error     = [reporteQuery, frecuenciaTiposQuery, categoriasActivasQuery, montoTotalQuery, grafoQuery, transaccionesMayorValorQuery, rendimientoQuery, topBilleterasQuery, usuariosActivosQuery, auditoriaQuery].find(q => q.error)?.error;

  return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .an-root {
          font-family: 'Barlow', sans-serif;
          color: ${T.text};
          background: ${T.bg};
          min-height: 100vh;
          position: relative;
        }

        /* grid noise bg */
        .an-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(200,255,0,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,255,0,0.015) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .an-content { position: relative; z-index: 1; }

        @keyframes anFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes anPulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes anScan {
          0%   { transform: translateY(-4px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(340px); opacity: 0; }
        }

        .an-panel-hover:hover {
          border-color: rgba(200,255,0,0.15) !important;
          box-shadow: 0 0 24px rgba(200,255,0,0.06) !important;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

        <div className="an-root">
          <div className="an-content" style={{ padding: '0 0 48px' }}>

            {/* ── Page header ── */}
            <div style={{
              borderBottom: `1px solid ${T.border}`,
              padding: '20px 0 16px',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.acid, boxShadow: `0 0 8px ${T.acid}`, animation: 'anPulse 2s ease-in-out infinite' }} />
                  <Mono style={{ fontSize: 9, color: T.textFaint, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Sistema activo · Tiempo real</Mono>
                </div>
                <h1 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: 36,
                  letterSpacing: '-0.01em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  margin: 0,
                  lineHeight: 1,
                }}>
                  Panel de Análisis<span style={{ color: T.acid }}>.</span>
                </h1>
              </div>
              <Mono style={{ fontSize: 10, color: T.textFaint }}>UID:{userId}</Mono>
            </div>

            {error && (
                <div style={{ marginBottom: 20 }}>
                  <AlertaPanel type="error" title="Sin datos" message={error?.message || String(error)} />
                </div>
            )}

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                  <LoadingSpinner />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                  {/* ══ KPI strip ══ */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <KPI index={0} label="Total transacciones"    value={fmt(reporte.totalTransacciones)}                     sub="operaciones registradas"    accent={T.acid} />
                    <KPI index={1} label="Monto movilizado"       value={fmtMoney(extractMonto(reporte))}                     sub="por usuario"                accent={T.blue} />
                    <KPI index={2} label="Monto total global"     value={fmtMoney(montoTotalGlobal)}                          sub="mes en curso"               accent={T.amber} />
                    <KPI index={3} label="Eficiencia hash"        value={`${rendimiento.eficiencia}%`}                        sub="vs búsqueda lineal"         accent={T.acid} />
                    <KPI index={4} label="Billeteras activas"     value={topBilleteras.length}                                sub="en el sistema"              accent={T.blue} />
                    <KPI index={5} label="Eventos auditoría"      value={eventos.length}                                      sub={`${eventosSospechosos.length} sospechosos`} accent={eventosSospechosos.length > 0 ? T.red : T.acid} />
                  </div>

                  {/* ══ Row: reporte personal + rendimiento ══ */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                    {/* Reporte personal */}
                    <Panel className="an-panel-hover" accent={T.acid} style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                      <SectionTitle tag={`UID ${String(userId).slice(0,8)}`} accent={T.acid}>Reporte personal</SectionTitle>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { label: 'Total transacciones', value: fmt(reporte.totalTransacciones || 0) },
                          { label: 'Monto movilizado',    value: fmtMoney(extractMonto(reporte)), accent: true },
                          { label: 'Monto global mes',    value: fmtMoney(montoTotalGlobal) },
                          { label: 'Promedio por tx',     value: fmtMoney(reporte.promedioTransaccion || 0) },
                        ].map((row, i) => (
                            <div key={i} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '9px 12px',
                              background: T.surface,
                              borderRadius: 7,
                              border: `1px solid ${T.border}`,
                            }}>
                              <Mono style={{ fontSize: 10, color: T.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{row.label}</Mono>
                              <span style={{
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontWeight: 700,
                                fontSize: 16,
                                color: row.accent ? T.acid : T.text,
                              }}>{row.value}</span>
                            </div>
                        ))}
                      </div>
                    </Panel>

                    {/* Rendimiento */}
                    <Panel className="an-panel-hover" accent={T.blue} style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                      <SectionTitle tag="HASH vs LINEAL" accent={T.blue}>Rendimiento</SectionTitle>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { label: 'Transacciones', value: fmt(rendimiento.totalTransacciones), accent: false },
                          { label: 'Monto movilizado', value: fmtMoney(extractMonto(rendimiento)), accent: true },
                          { label: 'Promedio', value: fmtMoney(rendimiento.promedioTransaccion) },
                          { label: 'Eficiencia', value: `${rendimiento.eficiencia}%`, accent: true },
                        ].map((row, i) => (
                            <div key={i} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '9px 12px',
                              background: T.surface,
                              borderRadius: 7,
                              border: `1px solid ${T.border}`,
                            }}>
                              <Mono style={{ fontSize: 10, color: T.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{row.label}</Mono>
                              <span style={{
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontWeight: 700,
                                fontSize: 16,
                                color: row.accent ? T.blue : T.text,
                              }}>{row.value}</span>
                            </div>
                        ))}
                      </div>
                    </Panel>
                  </div>

                  {/* ══ Top billeteras ══ */}
                  <Panel className="an-panel-hover" style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                    <SectionTitle tag="SISTEMA" accent={T.acid}>Billeteras más activas</SectionTitle>
                    {topBilleteras.length ? (
                        <>
                          <DataRow header accent={T.acid} cols={[
                            { content: 'Nombre',  width: '1fr' },
                            { content: 'ID',      width: '80px' },
                            { content: 'Txs',     width: '60px', align: 'center' },
                            { content: 'Monto',   width: '120px', align: 'right' },
                          ]} />
                          {topBilleteras.map((w) => (
                              <DataRow key={w.id} accent={T.acid} cols={[
                                { content: w.nombre,                          width: '1fr',   bold: true },
                                { content: <Mono style={{ fontSize: 10, color: T.textFaint }}>#{w.id}</Mono>, width: '80px' },
                                { content: w.transacciones,                   width: '60px',  align: 'center', mono: true },
                                { content: fmtMoney(extractMonto(w)),         width: '120px', align: 'right',  bold: true, accent: true },
                              ]} />
                          ))}
                        </>
                    ) : <Empty text="sin billeteras destacadas" />}
                  </Panel>

                  {/* ══ Usuarios activos ══ */}
                  <Panel className="an-panel-hover" style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                    <SectionTitle tag="SISTEMA" accent={T.blue}>Usuarios con mayor actividad</SectionTitle>
                    {usuariosActivos.length ? (
                        <>
                          <DataRow header accent={T.blue} cols={[
                            { content: 'Usuario', width: '1fr' },
                            { content: 'ID',      width: '80px' },
                            { content: 'Txs',     width: '60px', align: 'center' },
                            { content: 'Puntos',  width: '100px', align: 'right' },
                          ]} />
                          {usuariosActivos.map((u) => (
                              <DataRow key={u.id} accent={T.blue} cols={[
                                { content: u.nombre || `Usuario ${u.id}`,     width: '1fr',   bold: true },
                                { content: <Mono style={{ fontSize: 10, color: T.textFaint }}>#{u.id}</Mono>, width: '80px' },
                                { content: u.totalTransacciones || 0,          width: '60px',  align: 'center', mono: true },
                                { content: `${u.puntosActuales ?? u.puntosAcumulados ?? u.puntos ?? u.recompensas?.puntosActuales ?? 0} pts`,
                                  width: '100px', align: 'right', bold: true, accent: true },
                              ]} />
                          ))}
                        </>
                    ) : <Empty text="sin usuarios activos" />}
                  </Panel>

                  {/* ══ Frecuencia + Categorías ══ */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Panel className="an-panel-hover" style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                      <SectionTitle tag="ENDPOINT" accent={T.acid}>Frecuencia de tipos</SectionTitle>
                      {frecuenciaTipos.length
                          ? frecuenciaTipos.map((item, i) => (
                              <HBar
                                  key={i}
                                  label={item.tipo || item.nombre || 'Tipo'}
                                  value={item.cantidad || item.total || 0}
                                  max={freqMax}
                                  color={T.acid}
                              />
                          ))
                          : <Empty text="sin datos de frecuencia" />}
                    </Panel>

                    <Panel className="an-panel-hover" style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                      <SectionTitle tag="ENDPOINT" accent={T.amber}>Categorías activas</SectionTitle>
                      {categoriasActivas.length ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {categoriasActivas.map((item, i) => (
                                <div key={i} style={{
                                  background: T.surface,
                                  border: `1px solid ${T.border}`,
                                  borderRadius: 8,
                                  padding: '10px 12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4,
                                }}>
                                  <div style={{ fontWeight: 600, fontSize: 12, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.categoria || item.nombre || 'Categoría'}
                                  </div>
                                  <Mono style={{ fontSize: 9, color: T.textFaint }}>qty: {item.cantidad || item.total || 0}</Mono>
                                  <Mono style={{ fontSize: 9, color: T.amber }}>{fmtMoney(extractMonto(item))}</Mono>
                                </div>
                            ))}
                          </div>
                      ) : <Empty text="sin categorías activas" />}
                    </Panel>
                  </div>

                  {/* ══ Grafo — UNTOUCHED ══ */}
                  <Panel style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${T.border}` }}>
                      <SectionTitle
                          tag={`${grafo.nodos?.length || 0} nodos · ${graphDataMemo.links.length} aristas`}
                          accent={T.acid}
                      >
                        Grafo del usuario
                      </SectionTitle>
                    </div>
                    {grafo.nodos?.length ? (
                        <div ref={containerRef} style={{ background: '#0D1117' }}>
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
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                                ctx.fillStyle = node.color || '#5B8DEF';
                                ctx.fill();
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
                                ctx.strokeStyle = (node.color || '#5B8DEF') + '44';
                                ctx.lineWidth = 2;
                                ctx.stroke();
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
                        <div ref={containerRef} style={{ padding: '20px 22px' }}>
                          <Empty text="sin datos de grafo disponibles" />
                        </div>
                    )}
                  </Panel>

                  {/* ══ Frecuencia por tipo + Montos en el tiempo ══ */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Panel className="an-panel-hover" style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                      <SectionTitle tag="OPERACIONES" accent={T.blue}>Frecuencia por tipo</SectionTitle>
                      {frecuenciaPorTipo.length ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {frecuenciaPorTipo.map((item, i) => (
                                <div key={i} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px 0',
                                  borderBottom: i < frecuenciaPorTipo.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                                }}>
                          <span style={{ fontWeight: 500, fontSize: 13, color: T.textDim }}>
                            {item.tipo || item.nombre || 'Tipo'}
                          </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                      width: Math.max(24, Math.min(80, ((item.total || item.cantidad || 0) / Math.max(1, freqMax)) * 80)),
                                      height: 3,
                                      background: T.blue,
                                      borderRadius: 2,
                                      opacity: 0.5,
                                    }} />
                                    <Mono style={{ fontSize: 11, color: T.blue, fontWeight: 600 }}>
                                      {item.total || item.cantidad || 0}
                                    </Mono>
                                  </div>
                                </div>
                            ))}
                          </div>
                      ) : <Empty text="sin datos de frecuencia" />}
                    </Panel>

                    <Panel className="an-panel-hover" style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                      <SectionTitle tag="TENDENCIA" accent={T.amber}>Monto procesado en el tiempo</SectionTitle>
                      {montosPorPeriodo.length ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {montosPorPeriodo.map((item, i) => (
                                <div key={i} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px 0',
                                  borderBottom: i < montosPorPeriodo.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                                }}>
                                  <span style={{ fontWeight: 500, fontSize: 13, color: T.textDim }}>{item.periodo || 'Periodo'}</span>
                                  <span style={{
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    fontWeight: 700,
                                    fontSize: 15,
                                    color: T.amber,
                                  }}>
                            {fmtMoney(extractMonto(item))}
                          </span>
                                </div>
                            ))}
                          </div>
                      ) : <Empty text="sin historial de montos" />}
                    </Panel>
                  </div>

                  {/* ══ Billeteras más usadas ══ */}
                  <Panel className="an-panel-hover" style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                    <SectionTitle tag="RANKING" accent={T.acid}>Billeteras más usadas</SectionTitle>
                    {billeterasMasUsadas.length ? (
                        <>
                          <DataRow header accent={T.acid} cols={[
                            { content: 'Billetera', width: '1fr' },
                            { content: 'Txs',       width: '70px', align: 'center' },
                            { content: 'Monto',     width: '130px', align: 'right' },
                          ]} />
                          {billeterasMasUsadas.map((w) => (
                              <DataRow key={`used-${w.id}`} accent={T.acid} cols={[
                                { content: w.nombre,                  width: '1fr',    bold: true },
                                { content: w.transacciones,           width: '70px',   align: 'center', mono: true },
                                { content: fmtMoney(extractMonto(w)), width: '130px',  align: 'right',  bold: true, accent: true },
                              ]} />
                          ))}
                        </>
                    ) : <Empty text="sin información de uso" />}
                  </Panel>

                  {/* ══ Txs mayor valor + Auditoría ══ */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                    {/* Txs mayor valor */}
                    <Panel className="an-panel-hover" style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                      <SectionTitle tag="TOP 5" accent={T.acid}>Transacciones de mayor valor</SectionTitle>
                      {transaccionesMayorValor.length ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {transaccionesMayorValor.slice(0, 5).map((item, i) => (
                                <div key={item.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 12,
                                  padding: '10px 0',
                                  borderBottom: i < 4 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                    <div style={{
                                      width: 22, height: 22, borderRadius: 6,
                                      background: T.acidDim,
                                      border: `1px solid ${T.acid}20`,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      flexShrink: 0,
                                    }}>
                                      <Mono style={{ fontSize: 9, color: T.acid }}>{String(i+1).padStart(2,'0')}</Mono>
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.tipo}</div>
                                      <Mono style={{ fontSize: 9, color: T.textFaint }}>{item.fecha ? item.fecha.replace('T',' ').slice(0,16) : '—'}</Mono>
                                    </div>
                                  </div>
                                  <span style={{
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    fontWeight: 700, fontSize: 15,
                                    color: T.acid, flexShrink: 0,
                                  }}>
                            {fmtMoney(extractMonto(item))}
                          </span>
                                </div>
                            ))}
                          </div>
                      ) : <Empty text="sin ranking disponible" />}
                    </Panel>

                    {/* Auditoría */}
                    <Panel className="an-panel-hover" style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                      <SectionTitle tag="RIESGO OPERATIVO" accent={T.red}>Auditoría</SectionTitle>
                      {eventos.length ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                              display: 'grid', gridTemplateColumns: '1fr 56px 100px',
                              gap: 8, padding: '0 6px 8px',
                              borderBottom: `1px solid ${T.borderHi}`,
                              marginBottom: 2,
                            }}>
                              {['Tipo','Riesgo','Fecha'].map(h => (
                                  <Mono key={h} style={{ fontSize: 9, color: T.textFaint, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: h === 'Fecha' ? 'right' : h === 'Riesgo' ? 'center' : 'left' }}>{h}</Mono>
                              ))}
                            </div>
                            {eventos.map((ev) => (
                                <div key={ev.id} style={{
                                  display: 'grid', gridTemplateColumns: '1fr 56px 100px',
                                  gap: 8, padding: '9px 6px',
                                  borderBottom: `1px solid rgba(255,255,255,0.04)`,
                                  alignItems: 'center',
                                  transition: 'background 0.12s',
                                }}
                                     onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                     onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <span style={{ fontSize: 12, fontWeight: 500, color: T.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.tipo}</span>
                                  <div style={{ display: 'flex', justifyContent: 'center' }}><RiskBadge value={ev.riesgo} /></div>
                                  <Mono style={{ fontSize: 9, color: T.textFaint, textAlign: 'right' }}>
                                    {ev.fecha ? ev.fecha.replace('T',' ').slice(0,16) : '—'}
                                  </Mono>
                                </div>
                            ))}
                          </div>
                      ) : <Empty text="sin eventos de auditoría" />}
                    </Panel>
                  </div>

                  {/* ══ Actividad sospechosa ══ */}
                  {eventosSospechosos.length > 0 && (
                      <Panel accent={T.red} glow style={{
                        border: `1px solid ${T.red}25`,
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}>
                        <SectionTitle tag="DETECCIÓN AUTOMÁTICA" accent={T.red}>
                          ⚠ Actividad sospechosa
                        </SectionTitle>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 56px 100px',
                            gap: 8, padding: '0 6px 8px',
                            borderBottom: `1px solid rgba(255,45,85,0.15)`,
                            marginBottom: 2,
                          }}>
                            {['Evento','Riesgo','Fecha'].map(h => (
                                <Mono key={h} style={{ fontSize: 9, color: `rgba(255,45,85,0.5)`, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: h === 'Fecha' ? 'right' : h === 'Riesgo' ? 'center' : 'left' }}>{h}</Mono>
                            ))}
                          </div>
                          {eventosSospechosos.map((ev) => (
                              <div key={`sus-${ev.id}`} style={{
                                display: 'grid', gridTemplateColumns: '1fr 56px 100px',
                                gap: 8, padding: '9px 6px',
                                borderBottom: `1px solid rgba(255,45,85,0.07)`,
                                alignItems: 'center',
                                transition: 'background 0.12s',
                              }}
                                   onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,45,85,0.04)'}
                                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,150,150,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.tipo}</span>
                                <div style={{ display: 'flex', justifyContent: 'center' }}><RiskBadge value={ev.riesgo} /></div>
                                <Mono style={{ fontSize: 9, color: `rgba(255,45,85,0.4)`, textAlign: 'right' }}>
                                  {ev.fecha ? ev.fecha.replace('T',' ').slice(0,16) : '—'}
                                </Mono>
                              </div>
                          ))}
                        </div>
                      </Panel>
                  )}

                </div>
            )}
          </div>
        </div>
      </>
  );
}