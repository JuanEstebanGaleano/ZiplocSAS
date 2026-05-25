import { useState, useEffect, useRef, useCallback } from 'react';
import UsuarioCard from './UsuarioCard.jsx';
import NotificacionesPanel from './NotificacionesPanel.jsx';
import { useOperacionesProgramadas } from '../hooks/useOperacionesProgramadas.js';
import { obtenerUsuarioPorId } from '../services/api.js';
import { useBilleteras } from '../hooks/useBilleteras.js';
import { useTransacciones } from '../hooks/useTransacciones.js';

/* ─── Utils ─────────────────────────────────────────────────── */
const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
const fmtDatetime = d => d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const TIPO_META = {
    RECARGA:         { icon: '↑', color: '#C8FF00' },
    RETIRO:          { icon: '↓', color: '#FF2D78' },
    TRANSFERENCIA:   { icon: '⇄', color: '#00C8FF' },
    PAGO_PROGRAMADO: { icon: '◎', color: '#FFE500' },
};
const PRIO_META = {
    1: { label: 'CRÍTICA', color: '#FF2D78' },
    2: { label: 'ALTA',    color: '#FF6B2B' },
    3: { label: 'MEDIA',   color: '#FFE500' },
    4: { label: 'BAJA',    color: '#00C8FF' },
    5: { label: 'MÍNIMA',  color: '#888'    },
};

/* ─── Radar sweep animation ─────────────────────────────────── */
function RadarOrb({ alerts = 0, scheduled = 0, onClick, isOpen }) {
    const canvasRef = useRef(null);
    const angleRef  = useRef(0);
    const rafRef    = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const SIZE = 56;
        canvas.width  = SIZE;
        canvas.height = SIZE;
        const cx = SIZE / 2, cy = SIZE / 2, R = SIZE / 2 - 3;

        function draw() {
            ctx.clearRect(0, 0, SIZE, SIZE);

            // Outer glow ring
            const grad = ctx.createRadialGradient(cx, cy, R - 4, cx, cy, R + 2);
            grad.addColorStop(0, isOpen ? 'rgba(200,255,0,0.35)' : 'rgba(200,255,0,0.15)');
            grad.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 6;
            ctx.stroke();

            // Grid circles
            [0.35, 0.65, 1].forEach(f => {
                ctx.beginPath();
                ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(200,255,0,0.08)';
                ctx.lineWidth = 0.75;
                ctx.stroke();
            });

            // Cross hairs
            ctx.strokeStyle = 'rgba(200,255,0,0.08)';
            ctx.lineWidth = 0.75;
            ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();

            // Sweep
            const a = angleRef.current;
            const sweep = ctx.createConicalGradient
                ? null
                : null; // fallback below
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, R - 1, a - 1.2, a, false);
            ctx.closePath();
            const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
            sg.addColorStop(0, 'rgba(200,255,0,0)');
            sg.addColorStop(0.6, 'rgba(200,255,0,0.08)');
            sg.addColorStop(1, 'rgba(200,255,0,0.22)');
            ctx.fillStyle = sg;
            ctx.fill();
            ctx.restore();

            // Sweep line
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1));
            ctx.strokeStyle = '#C8FF00';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#C8FF00';
            ctx.stroke();
            ctx.restore();

            // Center dot
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#C8FF00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#C8FF00';
            ctx.fill();
            ctx.shadowBlur = 0;

            // Blip dots for alerts/scheduled
            const blips = [
                ...Array.from({ length: Math.min(alerts, 3) }, (_, i) => ({
                    angle: (Math.PI * 0.3) + i * 0.8, dist: R * 0.55, color: '#FF2D78',
                })),
                ...Array.from({ length: Math.min(scheduled, 3) }, (_, i) => ({
                    angle: (Math.PI * 1.1) + i * 0.7, dist: R * 0.7, color: '#FFE500',
                })),
            ];
            blips.forEach(b => {
                const bx = cx + Math.cos(b.angle) * b.dist;
                const by = cy + Math.sin(b.angle) * b.dist;
                const diff = ((a - b.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                const fade = diff < 0.3 ? 1 : Math.max(0, 1 - (diff / (Math.PI * 2)) * 3);
                if (fade > 0.05) {
                    ctx.beginPath();
                    ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = b.color;
                    ctx.globalAlpha = fade;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = b.color;
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    ctx.shadowBlur = 0;
                }
            });

            angleRef.current = (a + 0.025) % (Math.PI * 2);
            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, [isOpen, alerts, scheduled]);

    return (
        <canvas
            ref={canvasRef}
            onClick={onClick}
            style={{ cursor: 'pointer', display: 'block', userSelect: 'none' }}
            title="Dashboard HUD"
        />
    );
}

/* ─── Pill tab ──────────────────────────────────────────────── */
function PillTab({ label, active, color, count, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '5px 12px',
                borderRadius: '20px',
                border: `1px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
                background: active ? `${color}18` : 'transparent',
                color: active ? color : 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
            }}
        >
            {label}
            {count > 0 && (
                <span style={{
                    fontSize: '8px',
                    background: `${color}30`,
                    color,
                    borderRadius: '10px',
                    padding: '1px 5px',
                    fontWeight: 700,
                }}>{count}</span>
            )}
        </button>
    );
}

/* ─── Scheduled mini card ───────────────────────────────────── */
function SchedMini({ op }) {
    const tm = TIPO_META[op.tipo] || { icon: '◌', color: '#888' };
    const pm = PRIO_META[op.prioridad ?? 3] || PRIO_META[3];
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.35)',
            border: `1px solid rgba(255,255,255,0.06)`,
            borderLeft: `2px solid ${tm.color}`,
            borderRadius: '8px',
            transition: 'border-color 0.15s',
        }}
             onMouseEnter={e => e.currentTarget.style.borderColor = `${tm.color}60`}
             onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
        >
            <div style={{
                width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                background: `${tm.color}15`, border: `1px solid ${tm.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', color: tm.color,
            }}>{tm.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: tm.color }}>{op.tipo}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', padding: '1px 5px', borderRadius: '3px', background: `${pm.color}18`, color: pm.color, border: `1px solid ${pm.color}35` }}>{pm.label}</span>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '0.04em', color: '#F0F0F0' }}>{fmt.format(Number(op.valor || 0))}</div>
                {op.descripcion && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{op.descripcion}</div>}
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
                    🕐 {fmtDatetime(op.fechaEjecucion)}
                </div>
            </div>
        </div>
    );
}

/* ─── Drag hook ─────────────────────────────────────────────── */
function useDrag(initialPos) {
    const [pos, setPos]     = useState(initialPos);
    const dragging          = useRef(false);
    const startMouse        = useRef({ x: 0, y: 0 });
    const startPos          = useRef(initialPos);

    const onMouseDown = useCallback(e => {
        if (e.button !== 0) return;
        dragging.current   = true;
        startMouse.current = { x: e.clientX, y: e.clientY };
        startPos.current   = pos;
        e.preventDefault();
    }, [pos]);

    useEffect(() => {
        function onMove(e) {
            if (!dragging.current) return;
            setPos({
                x: startPos.current.x + (e.clientX - startMouse.current.x),
                y: startPos.current.y + (e.clientY - startMouse.current.y),
            });
        }
        function onUp() { dragging.current = false; }
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, []);

    return { pos, onMouseDown };
}

/* ─── Main Gadget ───────────────────────────────────────────── */
export default function DashboardGadget({ userId }) {
    const [isOpen, setIsOpen]   = useState(false);
    const [tab, setTab]         = useState('programadas');
    const [usuario, setUsuario] = useState(null);
    const { pos, onMouseDown }  = useDrag({ x: window.innerWidth - 100, y: window.innerHeight - 100 });

    /* Data */
    const billeterasQuery  = useBilleteras(userId);
    const rawWallets       = billeterasQuery.data;
    const wallets          = Array.isArray(rawWallets) ? rawWallets : rawWallets?.billeteras ?? rawWallets?.data ?? [];

    const selectedWalletId = wallets[0]?.id ?? null;
    const transQuery       = useTransacciones(selectedWalletId);
    const rawTx            = transQuery.data;
    const history          = Array.isArray(rawTx) ? rawTx : rawTx?.transacciones ?? rawTx?.data ?? [];

    const progQuery   = useOperacionesProgramadas(userId);
    const rawProg     = progQuery.data;
    const programadas = Array.isArray(rawProg) ? rawProg : rawProg?.operaciones ?? rawProg?.data ?? [];

    const alerts = history
        .filter(t => { const s = String(t.estado||'').toLowerCase(); return s.includes('fall') || s.includes('rech') || s.includes('cancel'); })
        .slice(0, 10)
        .map(t => ({
            id: t.id,
            tipo: String(t.estado||'').toLowerCase().includes('cancel') ? 'WARNING' : 'ERROR',
            mensaje: `Transacción ${t.tipo || ''} por ${fmt.format(Number(t.valor||0))} — ${t.estado || ''}.`,
            fecha: t.fecha,
        }));

    useEffect(() => {
        let active = true;
        obtenerUsuarioPorId(userId)
            .then(r => { if (active) setUsuario(r || null); })
            .catch(() => {});
        return () => { active = false; };
    }, [userId]);

    /* Panel open position: always stay on screen */
    const panelW = 380, panelH = 560;
    const panelLeft = Math.min(pos.x - panelW - 16, window.innerWidth  - panelW - 16);
    const panelTop  = Math.min(Math.max(pos.y - panelH / 2, 16), window.innerHeight - panelH - 16);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Syne:wght@600;700&display=swap');

        @keyframes gadget-in {
          from { opacity:0; transform:scale(0.92) translateY(8px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes gadget-out {
          from { opacity:1; transform:scale(1); }
          to   { opacity:0; transform:scale(0.94) translateY(6px); }
        }
        @keyframes hud-ping {
          0%,100% { box-shadow: 0 0 0 0 rgba(200,255,0,0.4); }
          50%      { box-shadow: 0 0 0 10px rgba(200,255,0,0); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(400px); }
        }

        .gadget-orb-wrap {
          position: fixed;
          z-index: 9999;
          user-select: none;
        }
        .gadget-orb {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(8,8,15,0.92);
          border: 1px solid rgba(200,255,0,0.25);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(200,255,0,0.1), inset 0 1px 0 rgba(200,255,0,0.08);
          backdrop-filter: blur(12px);
          transition: border-color 0.2s, box-shadow 0.2s;
          animation: hud-ping 3s ease-in-out infinite;
        }
        .gadget-orb:hover {
          border-color: rgba(200,255,0,0.5);
          box-shadow: 0 0 30px rgba(200,255,0,0.2), inset 0 1px 0 rgba(200,255,0,0.12);
        }
        .gadget-orb.open {
          border-color: rgba(200,255,0,0.6);
          animation: none;
          box-shadow: 0 0 40px rgba(200,255,0,0.25), inset 0 1px 0 rgba(200,255,0,0.15);
        }

        /* Alert badge */
        .gadget-badge {
          position: absolute; top: -4px; right: -4px;
          min-width: 18px; height: 18px;
          background: #FF2D78;
          border: 2px solid #08080F;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 9px; font-weight: 700;
          color: #fff;
          padding: 0 4px;
          z-index: 2;
          box-shadow: 0 0 8px rgba(255,45,120,0.5);
        }

        /* Panel */
        .gadget-panel {
          position: fixed;
          z-index: 9998;
          width: 380px;
          background: rgba(8,8,15,0.96);
          border: 1px solid rgba(200,255,0,0.15);
          border-radius: 16px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 24px 60px rgba(0,0,0,0.6),
            0 0 40px rgba(200,255,0,0.06);
          animation: gadget-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* Scanline effect */
        .gadget-scanline {
          position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(200,255,0,0.12), transparent);
          pointer-events: none; z-index: 10;
          animation: scanline 4s linear infinite;
        }

        /* Panel header */
        .gadget-panel-head {
          padding: 14px 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(200,255,0,0.03);
          position: relative;
          cursor: move;
        }
        .gadget-panel-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.3rem;
          letter-spacing: 0.1em;
          color: #C8FF00;
          display: flex; align-items: center; gap: 8px;
        }
        .gadget-panel-sub {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.2);
          margin-top: 2px;
        }
        .gadget-close {
          position: absolute; top: 12px; right: 12px;
          width: 24px; height: 24px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: rgba(255,255,255,0.4);
          font-size: 12px; transition: all 0.15s;
        }
        .gadget-close:hover {
          background: rgba(255,45,120,0.1);
          border-color: rgba(255,45,120,0.3);
          color: #FF2D78;
        }

        /* Tabs */
        .gadget-tabs {
          display: flex; gap: 6px; padding: 10px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.2);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .gadget-tabs::-webkit-scrollbar { display: none; }

        /* Body */
        .gadget-body {
          max-height: 440px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(200,255,0,0.15) transparent;
        }
        .gadget-body::-webkit-scrollbar { width: 3px; }
        .gadget-body::-webkit-scrollbar-track { background: transparent; }
        .gadget-body::-webkit-scrollbar-thumb { background: rgba(200,255,0,0.15); border-radius: 2px; }

        /* Stats mini strip */
        .gadget-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .gadget-stat {
          padding: 10px 12px;
          background: rgba(8,8,15,0.8);
          display: flex; flex-direction: column; gap: 3px;
        }
        .gadget-stat-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 8px; text-transform: uppercase;
          letter-spacing: 0.14em; color: rgba(255,255,255,0.25);
        }
        .gadget-stat-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem; letter-spacing: 0.05em;
        }
        .gadget-empty {
          padding: 40px 20px; text-align: center;
          font-family: 'DM Mono', monospace;
          font-size: 11px; color: rgba(255,255,255,0.2);
          letter-spacing: 0.08em;
        }

        /* Drag handle dots */
        .gadget-drag-dots {
          display: flex; gap: 3px; align-items: center;
        }
        .gadget-drag-dot {
          width: 3px; height: 3px;
          border-radius: 50%;
          background: rgba(200,255,0,0.3);
        }

        /* Corner HUD decorations */
        .hud-corner {
          position: absolute;
          width: 10px; height: 10px;
          border-color: rgba(200,255,0,0.3);
          border-style: solid;
        }
        .hud-tl { top: 0; left: 0; border-width: 1px 0 0 1px; border-radius: 3px 0 0 0; }
        .hud-tr { top: 0; right: 0; border-width: 1px 1px 0 0; border-radius: 0 3px 0 0; }
        .hud-bl { bottom: 0; left: 0; border-width: 0 0 1px 1px; border-radius: 0 0 0 3px; }
        .hud-br { bottom: 0; right: 0; border-width: 0 1px 1px 0; border-radius: 0 0 3px 0; }
      `}</style>

            {/* ── Floating Orb ── */}
            <div
                className="gadget-orb-wrap"
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)' }}
            >
                {/* Drag handle (invisible layer) */}
                <div
                    onMouseDown={onMouseDown}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', zIndex: 2, cursor: 'grab' }}
                />
                <div className={`gadget-orb ${isOpen ? 'open' : ''}`}>
                    <RadarOrb
                        alerts={alerts.length}
                        scheduled={programadas.length}
                        onClick={() => setIsOpen(v => !v)}
                        isOpen={isOpen}
                    />
                </div>

                {/* Badge */}
                {(alerts.length + programadas.length) > 0 && !isOpen && (
                    <div className="gadget-badge">
                        {alerts.length + programadas.length}
                    </div>
                )}
            </div>

            {/* ── Panel ── */}
            {isOpen && (
                <div
                    className="gadget-panel"
                    style={{ left: Math.max(8, panelLeft), top: panelTop }}
                >
                    {/* Scanline */}
                    <div className="gadget-scanline" />

                    {/* HUD corners */}
                    <div className="hud-corner hud-tl" />
                    <div className="hud-corner hud-tr" />
                    <div className="hud-corner hud-bl" />
                    <div className="hud-corner hud-br" />

                    {/* Header */}
                    <div className="gadget-panel-head">
                        <div className="gadget-drag-dots">
                            {[...Array(6)].map((_, i) => <div key={i} className="gadget-drag-dot" />)}
                        </div>
                        <div className="gadget-panel-title" style={{ marginTop: '6px' }}>
                            <span style={{ fontSize: '10px', color: '#C8FF00' }}>◈</span>
                            HUD DASHBOARD
                        </div>
                        <div className="gadget-panel-sub">Sistema de monitoreo · Tiempo real</div>
                        <button className="gadget-close" onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    {/* Stats strip */}
                    <div className="gadget-stats">
                        <div className="gadget-stat">
                            <span className="gadget-stat-lbl">Billeteras</span>
                            <span className="gadget-stat-val" style={{ color: '#C8FF00' }}>{wallets.length}</span>
                        </div>
                        <div className="gadget-stat">
                            <span className="gadget-stat-lbl">Programadas</span>
                            <span className="gadget-stat-val" style={{ color: '#FFE500' }}>{programadas.length}</span>
                        </div>
                        <div className="gadget-stat">
                            <span className="gadget-stat-lbl">Alertas</span>
                            <span className="gadget-stat-val" style={{ color: alerts.length > 0 ? '#FF2D78' : '#888' }}>{alerts.length}</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="gadget-tabs">
                        <PillTab label="Programadas" active={tab === 'programadas'} color="#FFE500" count={programadas.length} onClick={() => setTab('programadas')} />
                        <PillTab label="Alertas"     active={tab === 'alertas'}     color="#FF2D78" count={alerts.length}      onClick={() => setTab('alertas')}     />
                        <PillTab label="Usuario"     active={tab === 'usuario'}     color="#C8FF00" count={0}                  onClick={() => setTab('usuario')}     />
                    </div>

                    {/* Body */}
                    <div className="gadget-body">

                        {/* Programadas */}
                        {tab === 'programadas' && (
                            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {progQuery.isLoading ? (
                                    <div className="gadget-empty">Cargando...</div>
                                ) : programadas.length ? (
                                    programadas.map(op => <SchedMini key={op.id} op={op} />)
                                ) : (
                                    <div className="gadget-empty">◌<br/>Sin operaciones programadas</div>
                                )}
                            </div>
                        )}

                        {/* Alertas */}
                        {tab === 'alertas' && (
                            <div style={{ padding: '10px' }}>
                                <NotificacionesPanel alertas={alerts} />
                            </div>
                        )}

                        {/* Usuario */}
                        {tab === 'usuario' && (
                            <div style={{ padding: '10px' }}>
                                {usuario
                                    ? <UsuarioCard usuario={usuario} />
                                    : <div className="gadget-empty">◌<br/>Sin datos de usuario</div>
                                }
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}