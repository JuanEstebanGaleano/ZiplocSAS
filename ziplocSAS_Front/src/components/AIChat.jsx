import { useState, useRef, useEffect } from 'react';

// ── Constantes ──────────────────────────────────────────
const SYSTEM_PROMPT = `Eres el asistente financiero de ZiplocSAS, una plataforma de billeteras digitales y transacciones.
Tu nombre es ZARA (ZiplocSAS AI Research Assistant).
Responde siempre en español, de forma concisa y útil.
Puedes ayudar con: consultas sobre billeteras, transacciones, recompensas, análisis financiero, y uso de la plataforma.
Mantén un tono profesional pero accesible. Usa términos financieros cuando sea apropiado.`;

// ── Typing indicator ────────────────────────────────────
function TypingDots() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
            {[0, 1, 2].map(i => (
                <span key={i} style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'var(--zc-green)',
                    display: 'inline-block',
                    animation: `zcDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
            ))}
        </div>
    );
}

// ── Message bubble ──────────────────────────────────────
function Message({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isUser ? 'flex-end' : 'flex-start',
            gap: 3,
            animation: 'zcFadeUp 0.25s ease both',
        }}>
      <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: isUser ? 'rgba(0,207,255,0.45)' : 'rgba(0,255,136,0.45)',
      }}>
        {isUser ? 'Usuario' : 'ZARA'}
      </span>
            <div style={{
                maxWidth: '85%',
                padding: '0.6rem 0.85rem',
                borderRadius: isUser ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                background: isUser
                    ? 'rgba(0,207,255,0.08)'
                    : 'rgba(0,255,136,0.06)',
                border: `1px solid ${isUser ? 'rgba(0,207,255,0.2)' : 'rgba(0,255,136,0.15)'}`,
                fontSize: '0.8rem',
                lineHeight: 1.55,
                color: isUser ? 'rgba(0,207,255,0.9)' : 'rgba(255,255,255,0.85)',
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
            }}>
                {msg.content}
            </div>
        </div>
    );
}

// ── Main component ──────────────────────────────────────
export default function AIChat() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hola, soy ZARA, tu asistente financiero de ZiplocSAS. ¿En qué puedo ayudarte hoy?',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setUnread(0);
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading, open]);

    async function sendMessage() {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg = { role: 'user', content: text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch('/api/anthropic/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    system: SYSTEM_PROMPT,
                    messages: apiMessages,
                }),
            });

            const data = await response.json();
            const replyText = data.content?.map(b => b.text || '').join('') || 'Sin respuesta.';

            const assistantMsg = { role: 'assistant', content: replyText };
            setMessages(prev => [...prev, assistantMsg]);
            if (!open) setUnread(u => u + 1);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Error al conectar con el servicio. Por favor intenta de nuevo.' },
            ]);
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <>
            <style>{`
        @keyframes zcDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1; }
        }
        @keyframes zcFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes zcSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes zcPulseRing {
          0%   { transform: scale(1);    opacity: 0.6; }
          70%  { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes zcSpin {
          to { transform: rotate(360deg); }
        }
        .zc-bubble-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 9999;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #00ff88 0%, #00cfff 100%);
          box-shadow: 0 4px 24px rgba(0,255,136,0.35), 0 0 0 0 rgba(0,255,136,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .zc-bubble-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 32px rgba(0,255,136,0.5), 0 0 0 0 rgba(0,255,136,0.4);
        }
        .zc-bubble-btn:active { transform: scale(0.95); }
        .zc-pulse-ring {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 9998;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid rgba(0,255,136,0.5);
          animation: zcPulseRing 2.5s ease-out infinite;
          pointer-events: none;
        }
        .zc-unread {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ff3355;
          border: 2px solid #060609;
          font-family: 'Space Mono', monospace;
          font-size: 0.55rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .zc-panel {
          position: fixed;
          bottom: 5.5rem;
          right: 2rem;
          z-index: 9998;
          width: 360px;
          height: 520px;
          display: flex;
          flex-direction: column;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(0,255,136,0.2);
          box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,136,0.05), inset 0 1px 0 rgba(255,255,255,0.04);
          background: #080b0a;
          animation: zcSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .zc-panel-head {
          padding: 0.9rem 1.1rem;
          border-bottom: 1px solid rgba(0,255,136,0.12);
          background: rgba(0,255,136,0.04);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }
        .zc-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,207,255,0.15));
          border: 1.5px solid rgba(0,255,136,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .zc-avatar::after {
          content: '';
          position: absolute;
          inset: -50%;
          background: conic-gradient(from 0deg, transparent 75%, rgba(0,255,136,0.4) 100%);
          animation: zcSpin 3s linear infinite;
        }
        .zc-avatar-inner {
          width: 12px;
          height: 12px;
          background: #00ff88;
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          z-index: 1;
          flex-shrink: 0;
        }
        .zc-head-info { display: flex; flex-direction: column; gap: 1px; flex: 1; }
        .zc-head-name {
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem;
          font-weight: 700;
          color: #00ff88;
          letter-spacing: 0.06em;
        }
        .zc-head-status {
          font-family: 'Space Mono', monospace;
          font-size: 0.55rem;
          color: rgba(0,255,136,0.45);
          letter-spacing: 0.08em;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .zc-status-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #00ff88;
          animation: zcDot 2s ease-in-out infinite;
        }
        .zc-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          padding: 4px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-size: 1rem;
        }
        .zc-close-btn:hover { color: #fff; background: rgba(255,255,255,0.07); }
        .zc-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,255,136,0.15) transparent;
        }
        .zc-messages::-webkit-scrollbar { width: 3px; }
        .zc-messages::-webkit-scrollbar-track { background: transparent; }
        .zc-messages::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.2); border-radius: 99px; }
        .zc-scan-line {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px
          );
          opacity: 0.3;
          border-radius: 16px;
        }
        .zc-input-area {
          padding: 0.75rem 1rem;
          border-top: 1px solid rgba(0,255,136,0.1);
          background: rgba(0,0,0,0.3);
          display: flex;
          gap: 0.6rem;
          align-items: flex-end;
          flex-shrink: 0;
        }
        .zc-textarea {
          flex: 1;
          background: rgba(0,255,136,0.04);
          border: 1px solid rgba(0,255,136,0.15);
          border-radius: 10px;
          padding: 0.55rem 0.85rem;
          color: rgba(255,255,255,0.85);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          line-height: 1.4;
          resize: none;
          outline: none;
          max-height: 100px;
          transition: border-color 0.15s;
          caret-color: #00ff88;
        }
        .zc-textarea::placeholder { color: rgba(255,255,255,0.2); }
        .zc-textarea:focus { border-color: rgba(0,255,136,0.35); }
        .zc-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, rgba(0,255,136,0.9), rgba(0,207,255,0.8));
          color: #060609;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.15s;
          font-size: 1rem;
        }
        .zc-send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
        .zc-send-btn:not(:disabled):hover { transform: scale(1.08); }
        .zc-send-btn:not(:disabled):active { transform: scale(0.93); }
        .zc-footer-label {
          padding: 0.4rem 1rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.5rem;
          color: rgba(255,255,255,0.12);
          text-align: center;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        @media (max-width: 480px) {
          .zc-panel { width: calc(100vw - 2rem); right: 1rem; bottom: 5rem; }
          .zc-bubble-btn { right: 1rem; bottom: 1rem; }
          .zc-pulse-ring { right: 1rem; bottom: 1rem; }
        }
      `}</style>

            {/* Pulse ring (solo cuando cerrado) */}
            {!open && <div className="zc-pulse-ring" />}

            {/* Chat panel */}
            {open && (
                <div className="zc-panel">
                    <div className="zc-scan-line" />

                    {/* Header */}
                    <div className="zc-panel-head">
                        <div className="zc-avatar">
                            <div className="zc-avatar-inner" />
                        </div>
                        <div className="zc-head-info">
                            <span className="zc-head-name">ZARA</span>
                            <span className="zc-head-status">
                <span className="zc-status-dot" />
                Asistente IA · ZiplocSAS
              </span>
                        </div>
                        <button className="zc-close-btn" onClick={() => setOpen(false)} aria-label="Cerrar chat">
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="zc-messages">
                        {messages.map((msg, i) => (
                            <Message key={i} msg={msg} />
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(0,255,136,0.45)',
                }}>ZARA</span>
                                <div style={{
                                    padding: '0.6rem 0.9rem',
                                    borderRadius: '2px 12px 12px 12px',
                                    background: 'rgba(0,255,136,0.06)',
                                    border: '1px solid rgba(0,255,136,0.15)',
                                }}>
                                    <TypingDots />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="zc-input-area">
            <textarea
                ref={inputRef}
                className="zc-textarea"
                rows={1}
                placeholder="Escribe un mensaje…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
            />
                        <button
                            className="zc-send-btn"
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            aria-label="Enviar mensaje"
                        >
                            ↑
                        </button>
                    </div>

                    <div className="zc-footer-label">Powered by Claude · ZiplocSAS AI</div>
                </div>
            )}

            {/* Bubble toggle button */}
            <button
                className="zc-bubble-btn"
                onClick={() => setOpen(o => !o)}
                aria-label={open ? 'Cerrar asistente IA' : 'Abrir asistente IA'}
            >
                {unread > 0 && !open && (
                    <span className="zc-unread">{unread}</span>
                )}
                {open ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#060609" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#060609" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
            </button>
        </>
    );
}