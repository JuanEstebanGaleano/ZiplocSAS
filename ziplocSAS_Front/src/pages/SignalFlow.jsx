import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    obtenerBilleterasPorUsuario,
    obtenerTransaccionesPorBilletera,
    obtenerGrafoAnalitica,
} from "../services/api";

/* ═══════════════════════════════════════════════════════════
   PALETA
═══════════════════════════════════════════════════════════ */
const C = {
    bg:     "#04040A",
    acid:   "#C8FF00",
    cyan:   "#00F5FF",
    pink:   "#FF2D78",
    gold:   "#FFE500",
    purple: "#A855F7",
    dim:    "rgba(255,255,255,0.06)",
    text:   "#E8E8F0",
    muted:  "rgba(255,255,255,0.28)",
};

const TIPO_COLOR = {
    RECARGA:         C.acid,
    RETIRO:          C.pink,
    TRANSFERENCIA:   C.cyan,
    PAGO_PROGRAMADO: C.gold,
};

const TIPO_GLYPH = {
    RECARGA:         "↑",
    RETIRO:          "↓",
    TRANSFERENCIA:   "⇄",
    PAGO_PROGRAMADO: "◎",
};

const ESTADO_COLOR = {
    COMPLETADA:  C.acid,
    PENDIENTE:   C.gold,
    FALLIDA:     C.pink,
    PROCESANDO:  C.cyan,
};

const fmt      = new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0 });
const fmtShort = v => {
    if (!v && v !== 0) return "$0";
    if (v >= 1_000_000) return `$${(v/1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v/1_000).toFixed(0)}K`;
    return fmt.format(v);
};
const fmtDate = d => d ? new Date(d).toLocaleString("es-CO", { dateStyle:"short", timeStyle:"short" }) : "—";

/* ═══════════════════════════════════════════════════════════
   NORMALIZAR TRANSACCIÓN — adapta cualquier shape del backend
═══════════════════════════════════════════════════════════ */
function normalizeTx(tx, billeteraMap) {
    const tipo = (tx.tipo || tx.tipoTransaccion || tx.type || "TRANSFERENCIA").toUpperCase();
    const estado = (tx.estado || tx.status || tx.estadoTransaccion || "PENDIENTE").toUpperCase();
    const valor = Number(tx.valor ?? tx.monto ?? tx.amount ?? 0);
    const fecha = tx.fecha || tx.fechaCreacion || tx.createdAt || tx.date || new Date().toISOString();
    const origenId  = tx.billeteraOrigenId  || tx.billeteraId || tx.origen  || tx.fromId  || null;
    const destinoId = tx.billeteraDestinoId || tx.destino     || tx.toId    || null;
    const labelOrigen  = origenId  ? (billeteraMap[origenId]  || `Billetera ${String(origenId).slice(-4)}`)  : "—";
    const labelDestino = destinoId ? (billeteraMap[destinoId] || `Billetera ${String(destinoId).slice(-4)}`) : "—";

    return {
        id:         String(tx.id || tx._id || Math.random()),
        tipo,
        estado,
        valor,
        fecha,
        origenId,
        destinoId,
        origen:  labelOrigen,
        destino: labelDestino,
        raw:     tx,
    };
}

/* ═══════════════════════════════════════════════════════════
   LAYOUT DEL GRAFO
═══════════════════════════════════════════════════════════ */
function buildGraph(transactions, W, H) {
    if (!W || !H || W < 10 || H < 10 || transactions.length === 0) return { nodes:[], edges:[] };

    const cx = W / 2, cy = H / 2;
    const orbitR = Math.min(W, H) * 0.31;

    const walletMap = new Map();
    transactions.forEach(tx => {
        [
            { id: tx.origenId,  label: tx.origen  },
            { id: tx.destinoId, label: tx.destino },
        ].forEach(({ id, label }) => {
            if (!id) return;
            if (!walletMap.has(id)) walletMap.set(id, { label, vol:0, count:0, tipos:{} });
            const w = walletMap.get(id);
            w.vol   += tx.valor;
            w.count += 1;
            w.tipos[tx.tipo] = (w.tipos[tx.tipo] || 0) + 1;
        });
    });

    const walletList = Array.from(walletMap.entries())
        .sort((a,b) => b[1].vol - a[1].vol)
        .slice(0, 9);

    const nodes = [
        {
            id: "__hub__", label:"HUB", sublabel:`${transactions.length} TX`,
            x:cx, y:cy, radius:36, color:C.acid, phase:0,
            vol: transactions.reduce((s,t)=>s+t.valor,0),
            count: transactions.length, isHub:true,
        },
        ...walletList.map(([wid, data], i) => {
            const angle = (i / walletList.length) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? orbitR : orbitR * 0.6;
            const dominantTipo = Object.entries(data.tipos).sort((a,b)=>b[1]-a[1])[0]?.[0];
            return {
                id: wid,
                label: data.label,
                sublabel: fmtShort(data.vol),
                x: cx + Math.cos(angle)*r,
                y: cy + Math.sin(angle)*r,
                radius: 16 + Math.min(data.count*3, 16),
                color: TIPO_COLOR[dominantTipo] || C.cyan,
                phase: i * 0.9,
                vol: data.vol, count: data.count, isHub:false,
            };
        }),
    ];

    const edgeMap = new Map();
    walletList.forEach(([wid]) => {
        edgeMap.set(`hub→${wid}`, { id:`hub→${wid}`, from:"__hub__", to:wid, tipo:"TRANSFERENCIA", count:1, vol:0, hub:true });
    });
    transactions.forEach(tx => {
        if (!tx.origenId || !tx.destinoId) return;
        const fromN = nodes.find(n=>n.id===tx.origenId);
        const toN   = nodes.find(n=>n.id===tx.destinoId);
        if (!fromN || !toN) return;
        const key = `${tx.origenId}→${tx.destinoId}:${tx.tipo}`;
        if (!edgeMap.has(key)) edgeMap.set(key, { id:key, from:tx.origenId, to:tx.destinoId, tipo:tx.tipo, count:0, vol:0, hub:false });
        const e = edgeMap.get(key);
        e.count++; e.vol += tx.valor;
    });

    const edges = Array.from(edgeMap.values()).filter(e =>
        nodes.find(n=>n.id===e.from) && nodes.find(n=>n.id===e.to)
    );

    return { nodes, edges };
}

/* ═══════════════════════════════════════════════════════════
   CANVAS RENDERER
═══════════════════════════════════════════════════════════ */
function useCanvasRenderer(canvasRef, nodes, edges, activeFilter, hoveredNode) {
    const rafRef  = useRef(null);
    const timeRef = useRef(0);
    const partsRef= useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;

        const resize = () => {
            canvas.width  = canvas.offsetWidth  * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.setTransform(dpr,0,0,dpr,0,0);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        function bezierPt(t, src, dst) {
            const mx = (src.x+dst.x)/2 + (dst.y-src.y)*0.18;
            const my = (src.y+dst.y)/2 - (dst.x-src.x)*0.18;
            return {
                x: (1-t)*(1-t)*src.x + 2*(1-t)*t*mx + t*t*dst.x,
                y: (1-t)*(1-t)*src.y + 2*(1-t)*t*my + t*t*dst.y,
            };
        }

        function spawnParticle(edge) {
            const src = nodes.find(n=>n.id===edge.from);
            const dst = nodes.find(n=>n.id===edge.to);
            if (!src||!dst) return null;
            return {
                t: Math.random(), speed: 0.003 + Math.random()*0.005,
                color: TIPO_COLOR[edge.tipo]||C.cyan,
                size: 1.8 + Math.random()*2.2,
                edge, trail:[],
            };
        }

        partsRef.current = [];
        edges.forEach(e => {
            const n = e.hub ? 1 : Math.min(e.count, 3);
            for (let i=0;i<n;i++) { const p=spawnParticle(e); if(p) partsRef.current.push(p); }
        });

        function draw() {
            const W = canvas.offsetWidth, H = canvas.offsetHeight;
            timeRef.current += 0.016;
            const T = timeRef.current;
            ctx.clearRect(0,0,W,H);

            // Grid
            ctx.strokeStyle="rgba(255,255,255,0.022)"; ctx.lineWidth=0.5;
            for(let x=0;x<W;x+=44){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
            for(let y=0;y<H;y+=44){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }

            // Scanline
            const sy = (T*55)%(H+20)-10;
            const sg = ctx.createLinearGradient(0,sy-8,0,sy+8);
            sg.addColorStop(0,"transparent"); sg.addColorStop(0.5,"rgba(200,255,0,0.022)"); sg.addColorStop(1,"transparent");
            ctx.fillStyle=sg; ctx.fillRect(0,sy-8,W,16);

            // Edges
            edges.forEach(edge=>{
                const src=nodes.find(n=>n.id===edge.from);
                const dst=nodes.find(n=>n.id===edge.to);
                if(!src||!dst) return;
                const col=TIPO_COLOR[edge.tipo]||C.cyan;
                const active=!activeFilter||activeFilter===edge.tipo;
                const mx=(src.x+dst.x)/2+(dst.y-src.y)*0.18;
                const my=(src.y+dst.y)/2-(dst.x-src.x)*0.18;

                ctx.save();
                ctx.beginPath(); ctx.moveTo(src.x,src.y); ctx.quadraticCurveTo(mx,my,dst.x,dst.y);
                ctx.strokeStyle=`${col}${Math.round((active?0.18:0.04)*255).toString(16).padStart(2,"0")}`;
                ctx.lineWidth=active?2:1;
                if(active){ctx.shadowBlur=10;ctx.shadowColor=col;}
                ctx.stroke(); ctx.restore();

                if(active){
                    ctx.save();
                    ctx.beginPath();ctx.moveTo(src.x,src.y);ctx.quadraticCurveTo(mx,my,dst.x,dst.y);
                    ctx.strokeStyle=`${col}44`; ctx.lineWidth=0.8;
                    ctx.setLineDash([5,9]); ctx.lineDashOffset=-T*28;
                    ctx.stroke(); ctx.restore();
                }
            });

            // Particles
            partsRef.current.forEach(p=>{
                if(!activeFilter||activeFilter===p.edge.tipo){
                    p.t+=p.speed; if(p.t>=1){p.t=0;p.trail=[];}
                    const src=nodes.find(n=>n.id===p.edge.from);
                    const dst=nodes.find(n=>n.id===p.edge.to);
                    if(!src||!dst) return;
                    const pos=bezierPt(p.t,src,dst);
                    p.trail.push({x:pos.x,y:pos.y});
                    if(p.trail.length>14) p.trail.shift();
                    p.trail.forEach((pt,ti)=>{
                        const a=ti/p.trail.length;
                        ctx.beginPath();ctx.arc(pt.x,pt.y,p.size*a*0.8,0,Math.PI*2);
                        ctx.fillStyle=p.color+Math.floor(a*150).toString(16).padStart(2,"0");ctx.fill();
                    });
                    ctx.save();ctx.beginPath();ctx.arc(pos.x,pos.y,p.size,0,Math.PI*2);
                    ctx.fillStyle=p.color;ctx.shadowBlur=18;ctx.shadowColor=p.color;ctx.fill();ctx.restore();
                }
            });

            // Nodes
            nodes.forEach(node=>{
                const col=node.color, r=node.radius;
                const pulse=Math.sin(T*2.2+node.phase)*0.5+0.5;
                const isHov=hoveredNode===node.id;

                const hg=ctx.createRadialGradient(node.x,node.y,r*0.5,node.x,node.y,r*(isHov?3.5:2.5));
                hg.addColorStop(0,`${col}${isHov?"35":"1A"}`); hg.addColorStop(1,"transparent");
                ctx.beginPath();ctx.arc(node.x,node.y,r*(isHov?3.5:2.5),0,Math.PI*2);ctx.fillStyle=hg;ctx.fill();

                ctx.beginPath();ctx.arc(node.x,node.y,r+10+pulse*10,0,Math.PI*2);
                ctx.strokeStyle=`${col}${Math.floor(pulse*45+5).toString(16).padStart(2,"0")}`;ctx.lineWidth=1;ctx.stroke();

                ctx.save();ctx.beginPath();ctx.arc(node.x,node.y,r,0,Math.PI*2);
                const bg=ctx.createRadialGradient(node.x-r*0.2,node.y-r*0.2,0,node.x,node.y,r);
                bg.addColorStop(0,`${col}30`);bg.addColorStop(1,`${col}10`);
                ctx.fillStyle=bg;ctx.strokeStyle=isHov?col:`${col}AA`;ctx.lineWidth=isHov?2:1.5;
                ctx.shadowBlur=isHov?30:16;ctx.shadowColor=col;ctx.fill();ctx.stroke();ctx.restore();

                ctx.beginPath();ctx.arc(node.x,node.y,r*0.25,0,Math.PI*2);
                ctx.fillStyle=col;ctx.shadowBlur=8;ctx.shadowColor=col;ctx.fill();ctx.shadowBlur=0;

                ctx.textAlign="center";
                ctx.fillStyle=C.text;ctx.font=`600 ${node.isHub?10:9}px 'DM Mono',monospace`;
                ctx.fillText(node.label,node.x,node.y+r+17);
                ctx.fillStyle=C.muted;ctx.font=`400 8px 'DM Mono',monospace`;
                ctx.fillText(node.sublabel||"",node.x,node.y+r+28);
            });

            rafRef.current=requestAnimationFrame(draw);
        }

        rafRef.current=requestAnimationFrame(draw);
        return ()=>{ cancelAnimationFrame(rafRef.current); ro.disconnect(); };
    }, [nodes, edges, activeFilter, hoveredNode]);
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTES UI
═══════════════════════════════════════════════════════════ */
function StatCard({ label, value, sub, color, icon }) {
    return (
        <div style={{
            flex:1, minWidth:110, padding:"14px 16px",
            background:`${color}08`, border:`1px solid ${color}1E`,
            borderRadius:12, position:"relative", overflow:"hidden",
            display:"flex", flexDirection:"column", gap:3,
        }}>
            <div style={{ position:"absolute",top:0,left:0,right:0,height:2, background:`linear-gradient(90deg,transparent,${color}70,transparent)` }}/>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <span style={{ fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted }}>{label}</span>
                <span style={{ fontSize:13,opacity:0.45 }}>{icon}</span>
            </div>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.8rem",letterSpacing:"0.04em",color,lineHeight:1 }}>{value}</span>
            {sub && <span style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:`${color}70` }}>{sub}</span>}
        </div>
    );
}

function FilterChip({ tipo, active, count, onClick }) {
    const col = TIPO_COLOR[tipo];
    return (
        <button onClick={onClick} style={{
            display:"flex",alignItems:"center",gap:6,padding:"6px 13px",borderRadius:20,
            border:`1px solid ${active?col:"rgba(255,255,255,0.1)"}`,
            background:active?`${col}14`:"transparent",
            color:active?col:C.muted,cursor:"pointer",
            fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",
            transition:"all 0.18s",
        }}>
            <span style={{ fontSize:12 }}>{TIPO_GLYPH[tipo]}</span>
            <span>{tipo.replace(/_/g," ")}</span>
            <span style={{ fontSize:8,background:`${col}25`,color:col,borderRadius:10,padding:"1px 5px",fontWeight:700 }}>{count}</span>
        </button>
    );
}

function TxRow({ tx, onClick, isSelected }) {
    const col  = TIPO_COLOR[tx.tipo]    || C.cyan;
    const scol = ESTADO_COLOR[tx.estado] || C.muted;
    return (
        <div onClick={()=>onClick(tx)} style={{
            display:"grid",gridTemplateColumns:"26px 88px 1fr 95px 76px",
            alignItems:"center",gap:9,padding:"9px 14px",
            borderBottom:`1px solid ${C.dim}`,
            background:isSelected?`${col}08`:"transparent",
            cursor:"pointer",transition:"background 0.15s",
        }}
             onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="rgba(255,255,255,0.025)"; }}
             onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background="transparent"; }}
        >
            <div style={{ width:24,height:24,borderRadius:6,background:`${col}15`,border:`1px solid ${col}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:col }}>
                {TIPO_GLYPH[tx.tipo]}
            </div>
            <div>
                <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:col,letterSpacing:"0.07em" }}>{tx.id}</div>
                <div style={{ fontSize:8,color:C.muted,marginTop:2 }}>{tx.tipo.replace(/_/g," ")}</div>
            </div>
            <div style={{ fontSize:9,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.muted }}>
                <span style={{ color:C.text }}>{tx.origen}</span>
                <span> → </span>
                <span style={{ color:C.text }}>{tx.destino}</span>
            </div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.95rem",color:C.text,letterSpacing:"0.04em",textAlign:"right" }}>
                {fmtShort(tx.valor)}
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:7,padding:"2px 6px",borderRadius:4,textAlign:"center",background:`${scol}15`,color:scol,border:`1px solid ${scol}25`,letterSpacing:"0.06em" }}>
                {tx.estado}
            </div>
        </div>
    );
}

function DetailPanel({ tx, onClose }) {
    const col  = TIPO_COLOR[tx.tipo]    || C.cyan;
    const scol = ESTADO_COLOR[tx.estado] || C.muted;
    const wave = useMemo(()=>
            Array.from({length:32},(_,i)=>({
                h: 6+Math.abs(Math.sin(i*0.71+(tx.valor%997)*0.013))*30,
                o: 0.25+Math.abs(Math.sin(i*0.71))*0.75,
            }))
        ,[tx]);

    return (
        <div style={{
            position:"absolute",inset:0,background:"rgba(4,4,10,0.97)",
            backdropFilter:"blur(24px)",zIndex:20,
            display:"flex",flexDirection:"column",
            animation:"detailIn 0.22s cubic-bezier(0.16,1,0.3,1) both",
            borderLeft:`1px solid ${col}20`,
        }}>
            {[[{top:8,left:8},"1px 0 0 1px","3px 0 0 0"],[{top:8,right:8},"1px 1px 0 0","0 3px 0 0"],
                [{bottom:8,left:8},"0 0 1px 1px","0 0 0 3px"],[{bottom:8,right:8},"0 1px 1px 0","0 0 3px 0"]
            ].map(([pos,bw,br],i)=>(
                <div key={i} style={{ position:"absolute",...pos,width:12,height:12,borderColor:`${col}40`,borderStyle:"solid",borderWidth:bw,borderRadius:br }}/>
            ))}

            <div style={{ padding:"18px 18px 12px",borderBottom:`1px solid ${C.dim}`,flexShrink:0 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                    <div>
                        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.2em",color:col,marginBottom:3 }}>◈ DETALLE DE SEÑAL</div>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.5rem",letterSpacing:"0.06em",color:"#fff",lineHeight:1 }}>
                            {String(tx.id).length > 12 ? String(tx.id).slice(0,12)+"…" : tx.id}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,width:28,height:28,cursor:"pointer",color:C.muted,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                </div>
            </div>

            <div style={{ flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:12 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:10,background:`${col}0A`,border:`1px solid ${col}22` }}>
                    <div style={{ width:40,height:40,borderRadius:10,background:`${col}18`,border:`1px solid ${col}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:col,flexShrink:0 }}>
                        {TIPO_GLYPH[tx.tipo]}
                    </div>
                    <div>
                        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:col,letterSpacing:"0.1em",marginBottom:2 }}>{tx.tipo.replace(/_/g," ")}</div>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.6rem",color:"#fff",lineHeight:1 }}>{fmt.format(tx.valor)}</div>
                    </div>
                </div>

                <div style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,background:`${scol}0A`,border:`1px solid ${scol}20` }}>
                    <div style={{ width:7,height:7,borderRadius:"50%",background:scol,boxShadow:`0 0 8px ${scol}` }}/>
                    <span style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:scol,letterSpacing:"0.12em" }}>{tx.estado}</span>
                </div>

                {[
                    { label:"Origen",          value: tx.origen   },
                    { label:"Destino",         value: tx.destino  },
                    { label:"ID Billetera Ori",value: tx.origenId  ? String(tx.origenId)  : "—" },
                    { label:"ID Billetera Dst",value: tx.destinoId ? String(tx.destinoId) : "—" },
                    { label:"Fecha",           value: fmtDate(tx.fecha) },
                ].map(f=>(
                    <div key={f.label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.dim}` }}>
                        <span style={{ fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.14em",color:C.muted,textTransform:"uppercase" }}>{f.label}</span>
                        <span style={{ fontSize:10,color:C.text,textAlign:"right",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{f.value}</span>
                    </div>
                ))}

                <div>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.18em",color:C.muted,textTransform:"uppercase",marginBottom:8 }}>Firma de Señal</div>
                    <svg width="100%" height="44" viewBox="0 0 320 44" preserveAspectRatio="none">
                        {wave.map((w,i)=>(
                            <rect key={i} x={i*10+1} y={(44-w.h)/2} width={7.5} height={w.h} rx={2} fill={col} opacity={w.o}/>
                        ))}
                    </svg>
                </div>

                <div style={{ padding:"12px 14px",borderRadius:10,background:"rgba(0,0,0,0.3)",border:`1px solid ${C.dim}` }}>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.18em",color:C.muted,textTransform:"uppercase",marginBottom:8 }}>Ruta de Transferencia</div>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <div style={{ padding:"5px 10px",borderRadius:7,background:`${col}15`,border:`1px solid ${col}28`,fontSize:9,color:col,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{tx.origen}</div>
                        <div style={{ flex:1,height:1,background:`linear-gradient(90deg,${col}60,${col}20)`,position:"relative" }}>
                            <span style={{ position:"absolute",top:-5,left:"50%",transform:"translateX(-50%)",fontSize:9,color:col }}>{TIPO_GLYPH[tx.tipo]}</span>
                        </div>
                        <div style={{ padding:"5px 10px",borderRadius:7,background:`${col}15`,border:`1px solid ${col}28`,fontSize:9,color:col,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{tx.destino}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   SKELETON / ESTADOS DE CARGA
═══════════════════════════════════════════════════════════ */
function Skeleton({ w="100%", h=14, r=6 }) {
    return (
        <div style={{ width:w, height:h, borderRadius:r, background:"rgba(255,255,255,0.06)", animation:"skPulse 1.6s ease-in-out infinite" }}/>
    );
}

function EmptyState({ icon, title, sub }) {
    return (
        <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:40 }}>
            <div style={{ fontSize:36,opacity:0.2 }}>{icon}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",letterSpacing:"0.12em",color:C.muted }}>{title}</div>
            {sub && <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.15)",textAlign:"center",letterSpacing:"0.1em" }}>{sub}</div>}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN — SignalFlow
═══════════════════════════════════════════════════════════ */
export default function SignalFlow({ userId }) {
    const [activeFilter, setActiveFilter] = useState(null);
    const [selectedTx, setSelectedTx]     = useState(null);
    const [hoveredNode, setHoveredNode]   = useState(null);
    const [canvasSize, setCanvasSize]     = useState({ w:100, h:100 });
    const [view, setView]                 = useState("graph");

    const canvasRef    = useRef(null);
    const containerRef = useRef(null);

    /* ── Billeteras del usuario ── */
    const billeterasQuery = useQuery({
        queryKey: ["billeteras", userId],
        queryFn:  ({ signal }) => obtenerBilleterasPorUsuario(userId, { signal }),
        enabled:  !!userId,
        staleTime: 1000*60*5,
    });

    const wallets = useMemo(()=>{
        const d = billeterasQuery.data;
        return Array.isArray(d) ? d : d?.billeteras ?? d?.data ?? [];
    }, [billeterasQuery.data]);

    /* ── Mapa billeteraId → label legible ── */
    const billeteraMap = useMemo(()=>{
        const m = {};
        wallets.forEach(w => {
            const label = w.nombre || w.name || `Billetera ${String(w.id).slice(-4)}`;
            m[w.id] = label;
        });
        return m;
    }, [wallets]);

    /* ── Transacciones de hasta 5 billeteras ── */
    const firstWalletId  = wallets[0]?.id ?? null;
    const secondWalletId = wallets[1]?.id ?? null;
    const thirdWalletId  = wallets[2]?.id ?? null;
    const fourthWalletId = wallets[3]?.id ?? null;
    const fifthWalletId  = wallets[4]?.id ?? null;

    const tx0 = useQuery({ queryKey:["transacciones",firstWalletId],  queryFn:({signal})=>obtenerTransaccionesPorBilletera(firstWalletId,  {signal}), enabled:!!firstWalletId,  staleTime:1000*60*2 });
    const tx1 = useQuery({ queryKey:["transacciones",secondWalletId], queryFn:({signal})=>obtenerTransaccionesPorBilletera(secondWalletId, {signal}), enabled:!!secondWalletId, staleTime:1000*60*2 });
    const tx2 = useQuery({ queryKey:["transacciones",thirdWalletId],  queryFn:({signal})=>obtenerTransaccionesPorBilletera(thirdWalletId,  {signal}), enabled:!!thirdWalletId,  staleTime:1000*60*2 });
    const tx3 = useQuery({ queryKey:["transacciones",fourthWalletId], queryFn:({signal})=>obtenerTransaccionesPorBilletera(fourthWalletId, {signal}), enabled:!!fourthWalletId, staleTime:1000*60*2 });
    const tx4 = useQuery({ queryKey:["transacciones",fifthWalletId],  queryFn:({signal})=>obtenerTransaccionesPorBilletera(fifthWalletId,  {signal}), enabled:!!fifthWalletId,  staleTime:1000*60*2 });

    const isLoadingTx      = [tx0,tx1,tx2,tx3,tx4].some(q=>q.isLoading);
    const isLoadingWallets = billeterasQuery.isLoading;
    const isLoading        = isLoadingWallets || isLoadingTx;

    const transactions = useMemo(()=>{
        const raw = [tx0,tx1,tx2,tx3,tx4]
            .flatMap(q => {
                const d = q.data;
                return Array.isArray(d) ? d : d?.transacciones ?? d?.data ?? [];
            });
        const seen = new Set();
        return raw
            .filter(tx => { if(seen.has(tx.id)) return false; seen.add(tx.id); return true; })
            .map(tx => normalizeTx(tx, billeteraMap));
    }, [tx0.data, tx1.data, tx2.data, tx3.data, tx4.data, billeteraMap]);

    const filtered = useMemo(()=>
            activeFilter ? transactions.filter(t=>t.tipo===activeFilter) : transactions
        , [transactions, activeFilter]);

    const totalVol   = useMemo(()=>transactions.reduce((s,t)=>s+t.valor,0), [transactions]);
    const completed  = useMemo(()=>transactions.filter(t=>t.estado==="COMPLETADA").length, [transactions]);
    const failed     = useMemo(()=>transactions.filter(t=>t.estado==="FALLIDA").length, [transactions]);
    const processing = useMemo(()=>transactions.filter(t=>t.estado==="PROCESANDO").length, [transactions]);
    const successRate= transactions.length ? Math.round(completed/transactions.length*100) : 0;

    const typeCounts = useMemo(()=>{
        const m={}; transactions.forEach(t=>{ m[t.tipo]=(m[t.tipo]||0)+1; }); return m;
    }, [transactions]);

    useEffect(()=>{
        const el=containerRef.current; if(!el) return;
        const ro=new ResizeObserver(([e])=>setCanvasSize({ w:e.contentRect.width, h:e.contentRect.height }));
        ro.observe(el);
        setCanvasSize({ w:el.offsetWidth, h:el.offsetHeight });
        return ()=>ro.disconnect();
    },[]);

    const { nodes, edges } = useMemo(()=>buildGraph(filtered, canvasSize.w, canvasSize.h), [filtered, canvasSize]);
    useCanvasRenderer(canvasRef, nodes, edges, activeFilter, hoveredNode);

    const handleMouseMove = useCallback(e=>{
        const canvas=canvasRef.current; if(!canvas) return;
        const rect=canvas.getBoundingClientRect();
        const mx=e.clientX-rect.left, my=e.clientY-rect.top;
        const hit=nodes.find(n=>Math.hypot(n.x-mx,n.y-my)<n.radius+8);
        setHoveredNode(hit?.id||null);
        canvas.style.cursor=hit?"pointer":"default";
    },[nodes]);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        .sf-root { display:flex;flex-direction:column;height:calc(100vh - 80px);background:${C.bg};color:${C.text};font-family:'DM Mono',monospace;position:relative;overflow:hidden;border-radius:16px;border:1px solid rgba(255,255,255,0.06); }
        .sf-atmo { position:absolute;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse 55% 35% at 15% 5%,rgba(200,255,0,0.05) 0%,transparent 60%),radial-gradient(ellipse 45% 30% at 85% 95%,rgba(0,245,255,0.06) 0%,transparent 55%); }
        .sf-header { padding:16px 26px 12px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(4,4,10,0.7);backdrop-filter:blur(16px);position:relative;z-index:2;flex-shrink:0;display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap; }
        .sf-eyebrow { font-size:8px;letter-spacing:0.28em;text-transform:uppercase;color:${C.acid};margin-bottom:3px;display:flex;align-items:center;gap:8px; }
        .sf-eyebrow::before { content:'';display:inline-block;width:16px;height:1px;background:${C.acid}; }
        .sf-title { font-family:'Bebas Neue',sans-serif;font-size:clamp(1.7rem,2.8vw,2.6rem);letter-spacing:0.08em;color:#fff;line-height:1;margin:0; }
        .sf-sub { font-size:9px;color:${C.muted};letter-spacing:0.1em;margin-top:2px; }
        .sf-stats { display:flex;gap:9px;flex-wrap:wrap;padding:12px 26px;border-bottom:1px solid rgba(255,255,255,0.05);position:relative;z-index:2;background:rgba(4,4,10,0.5);flex-shrink:0; }
        .sf-filters { padding:9px 26px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;gap:7px;align-items:center;flex-wrap:wrap;position:relative;z-index:2;background:rgba(4,4,10,0.4);flex-shrink:0; }
        .sf-body { flex:1;display:flex;min-height:0;position:relative;z-index:1; }
        .sf-canvas-area { flex:1;position:relative;overflow:hidden;background:rgba(4,4,10,0.55);border-right:1px solid rgba(255,255,255,0.05); }
        .sf-canvas { width:100%;height:100%;display:block; }
        .sf-canvas-tag { position:absolute;top:13px;left:16px;font-size:7px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.12);display:flex;align-items:center;gap:7px;pointer-events:none; }
        .sf-live { width:6px;height:6px;border-radius:50%;background:${C.acid};animation:liveFlash 1.4s ease-in-out infinite; }
        @keyframes liveFlash { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(200,255,0,0.5);}50%{opacity:.5;box-shadow:0 0 0 5px rgba(200,255,0,0);} }
        .sf-legend { position:absolute;bottom:13px;left:16px;display:flex;gap:9px;flex-wrap:wrap;pointer-events:none; }
        .sf-legend-item { display:flex;align-items:center;gap:5px;font-size:8px;letter-spacing:0.1em;color:rgba(255,255,255,0.28); }
        .sf-legend-dot { width:7px;height:7px;border-radius:50%; }
        .sf-side { width:360px;flex-shrink:0;display:flex;flex-direction:column;background:rgba(5,5,12,0.85);position:relative; }
        .sf-side-head { padding:12px 16px 9px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between;flex-shrink:0; }
        .sf-side-title { font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:0.12em;color:${C.text}; }
        .sf-count { font-family:'DM Mono',monospace;font-size:9px;padding:2px 8px;border-radius:10px;background:rgba(200,255,0,0.1);color:${C.acid};border:1px solid rgba(200,255,0,0.2); }
        .sf-tx-list { flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(200,255,0,0.12) transparent; }
        .sf-tx-list::-webkit-scrollbar{width:2px;} .sf-tx-list::-webkit-scrollbar-thumb{background:rgba(200,255,0,0.15);border-radius:2px;}
        .sf-list-hdr { display:grid;grid-template-columns:26px 88px 1fr 95px 76px;gap:9px;padding:7px 14px;border-bottom:1px solid rgba(255,255,255,0.04);background:rgba(0,0,0,0.4);flex-shrink:0; }
        .sf-matrix { display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:9px;padding:14px;overflow-y:auto;flex:1;scrollbar-width:thin;scrollbar-color:rgba(200,255,0,0.12) transparent; }
        .sf-matrix-card { padding:12px;border-radius:10px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all 0.18s;display:flex;flex-direction:column;gap:5px; }
        .sf-matrix-card:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.4); }
        .sf-view-toggle { display:flex;gap:3px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:3px; }
        .sf-vbtn { padding:5px 11px;border-radius:7px;border:none;cursor:pointer;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:0.12em;text-transform:uppercase;transition:all 0.15s; }
        @keyframes detailIn { from{opacity:0;transform:translateX(16px);}to{opacity:1;transform:translateX(0);} }
        @keyframes skPulse { 0%,100%{opacity:0.5;}50%{opacity:1;} }
        @keyframes spin { to{transform:rotate(360deg);} }
        .sf-loading { display:flex;flex-direction:column;gap:10px;padding:20px; }
        @media(max-width:900px){ .sf-body{flex-direction:column;} .sf-side{width:100%;height:260px;} .sf-canvas-area{min-height:280px;} }
      `}</style>

            <div className="sf-root">
                <div className="sf-atmo"/>

                {/* HEADER */}
                <header className="sf-header">
                    <div>
                        <div className="sf-eyebrow">Signal Flow · Datos Reales · Usuario {userId}</div>
                        <h1 className="sf-title">TRANSACTION SIGNAL MAP</h1>
                        <p className="sf-sub">
                            {isLoading
                                ? "Conectando con el servidor…"
                                : `${wallets.length} billetera${wallets.length!==1?"s":""} · ${transactions.length} transacciones reales`
                            }
                        </p>
                    </div>
                    <div className="sf-view-toggle">
                        {[["graph","◉ Grafo"],["matrix","▦ Matriz"]].map(([v,lbl])=>(
                            <button key={v} className="sf-vbtn" onClick={()=>setView(v)} style={{
                                background:view===v?"rgba(200,255,0,0.12)":"transparent",
                                color:view===v?C.acid:C.muted,
                                border:view===v?"1px solid rgba(200,255,0,0.3)":"1px solid transparent",
                            }}>{lbl}</button>
                        ))}
                    </div>
                </header>

                {/* STATS */}
                <div className="sf-stats">
                    {isLoading ? (
                        [1,2,3,4,5].map(i=><div key={i} style={{ flex:1,minWidth:100 }}><Skeleton h={64} r={12}/></div>)
                    ) : (
                        <>
                            <StatCard label="Volumen"    value={fmtShort(totalVol)} sub="COP total"                     color={C.acid} icon="◈"/>
                            <StatCard label="TX"         value={transactions.length} sub={`en ${wallets.length} billeteras`} color={C.cyan} icon="⇄"/>
                            <StatCard label="Éxito"      value={`${successRate}%`}   sub={`${completed} completas`}         color={C.acid} icon="✓"/>
                            <StatCard label="Fallidas"   value={failed}              sub="requieren revisión"               color={C.pink} icon="✕"/>
                            <StatCard label="Procesando" value={processing}          sub="en curso"                         color={C.gold} icon="◎"/>
                        </>
                    )}
                </div>

                {/* FILTERS */}
                <div className="sf-filters">
                    <button onClick={()=>setActiveFilter(null)} style={{
                        padding:"6px 13px",borderRadius:20,
                        border:`1px solid ${!activeFilter?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.1)"}`,
                        background:!activeFilter?"rgba(255,255,255,0.07)":"transparent",
                        color:!activeFilter?C.text:C.muted,
                        cursor:"pointer",fontFamily:"'DM Mono',monospace",
                        fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",transition:"all 0.15s",
                    }}>◈ Todo ({transactions.length})</button>
                    {Object.keys(TIPO_COLOR).map(tipo=>(
                        <FilterChip key={tipo} tipo={tipo} active={activeFilter===tipo}
                                    count={typeCounts[tipo]||0}
                                    onClick={()=>setActiveFilter(f=>f===tipo?null:tipo)}
                        />
                    ))}
                </div>

                {/* BODY */}
                <div className="sf-body">

                    {/* Canvas / Matrix */}
                    <div className="sf-canvas-area" ref={containerRef}>
                        {view==="graph" ? (
                            <>
                                {isLoading ? (
                                    <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16 }}>
                                        <div style={{ width:60,height:60,borderRadius:"50%",border:"2px solid rgba(200,255,0,0.2)",borderTop:`2px solid ${C.acid}`,animation:"spin 1s linear infinite" }}/>
                                        <span style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:"0.18em",color:C.muted,textTransform:"uppercase" }}>Cargando red…</span>
                                    </div>
                                ) : transactions.length===0 ? (
                                    <EmptyState icon="◌" title="SIN TRANSACCIONES" sub="No hay transacciones para las billeteras de este usuario"/>
                                ) : (
                                    <canvas className="sf-canvas" ref={canvasRef}
                                            onMouseMove={handleMouseMove}
                                            onMouseLeave={()=>setHoveredNode(null)}
                                    />
                                )}
                                <div className="sf-canvas-tag">
                                    <div className="sf-live"/>
                                    RED REAL · {wallets.length} BILLETERAS ACTIVAS
                                </div>
                                <div className="sf-legend">
                                    {Object.entries(TIPO_COLOR).map(([tipo,col])=>(
                                        <div key={tipo} className="sf-legend-item">
                                            <div className="sf-legend-dot" style={{ background:col }}/>
                                            {tipo.replace(/_/g," ")}
                                        </div>
                                    ))}
                                </div>
                                {[{t:10,l:10},{t:10,r:10},{b:10,l:10},{b:10,r:10}].map((pos,i)=>(
                                    <div key={i} style={{
                                        position:"absolute",width:13,height:13,...pos,
                                        borderColor:"rgba(200,255,0,0.18)",borderStyle:"solid",
                                        borderWidth:i===0?"1px 0 0 1px":i===1?"1px 1px 0 0":i===2?"0 0 1px 1px":"0 1px 1px 0",
                                        borderRadius:i===0?"3px 0 0 0":i===1?"0 3px 0 0":i===2?"0 0 0 3px":"0 0 3px 0",
                                    }}/>
                                ))}
                            </>
                        ) : (
                            isLoading ? (
                                <div className="sf-loading">{[...Array(8)].map((_,i)=><Skeleton key={i} h={90} r={10}/>)}</div>
                            ) : filtered.length===0 ? (
                                <EmptyState icon="▦" title="SIN DATOS" sub="Sin transacciones para mostrar"/>
                            ) : (
                                <div className="sf-matrix">
                                    {filtered.map(tx=>{
                                        const col=TIPO_COLOR[tx.tipo]||C.cyan;
                                        const scol=ESTADO_COLOR[tx.estado]||C.muted;
                                        return (
                                            <div key={tx.id} className="sf-matrix-card"
                                                 style={{ borderColor:selectedTx?.id===tx.id?`${col}50`:"rgba(255,255,255,0.06)" }}
                                                 onClick={()=>setSelectedTx(s=>s?.id===tx.id?null:tx)}
                                            >
                                                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                                                    <span style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:col,letterSpacing:"0.07em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90 }}>{tx.id}</span>
                                                    <span style={{ fontSize:15,color:col }}>{TIPO_GLYPH[tx.tipo]}</span>
                                                </div>
                                                <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.2rem",color:"#fff",letterSpacing:"0.04em" }}>{fmtShort(tx.valor)}</div>
                                                <div style={{ fontSize:8,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{tx.origen} → {tx.destino}</div>
                                                <div style={{ fontSize:7,padding:"2px 6px",borderRadius:4,alignSelf:"flex-start",background:`${scol}15`,color:scol,border:`1px solid ${scol}22`,fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em" }}>{tx.estado}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        )}
                    </div>

                    {/* SIDE LIST */}
                    <div className="sf-side">
                        <div className="sf-side-head">
                            <span className="sf-side-title">LOG DE SEÑALES</span>
                            <span className="sf-count">{filtered.length}</span>
                        </div>

                        <div className="sf-list-hdr">
                            {["","ID","Flujo","Valor","Estado"].map(h=>(
                                <span key={h} style={{ fontFamily:"'DM Mono',monospace",fontSize:7,letterSpacing:"0.15em",color:C.muted,textTransform:"uppercase" }}>{h}</span>
                            ))}
                        </div>

                        <div className="sf-tx-list">
                            {isLoading ? (
                                <div className="sf-loading">{[...Array(6)].map((_,i)=><Skeleton key={i} h={52} r={6}/>)}</div>
                            ) : filtered.length===0 ? (
                                <EmptyState icon="◌" title="SIN TRANSACCIONES" sub="No hay datos para mostrar"/>
                            ) : (
                                filtered.map(tx=>(
                                    <TxRow key={tx.id} tx={tx}
                                           isSelected={selectedTx?.id===tx.id}
                                           onClick={t=>setSelectedTx(s=>s?.id===t.id?null:t)}
                                    />
                                ))
                            )}
                        </div>

                        {selectedTx && (
                            <DetailPanel tx={selectedTx} onClose={()=>setSelectedTx(null)}/>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}