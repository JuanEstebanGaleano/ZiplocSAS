export default function AlertaPanel({ type = 'info', title, message, children }) {
  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <section 
      className={`glass-panel p-4 rounded-md shadow-media border-l-4 flex flex-col gap-1 w-full animate-toastEnter
      ${isSuccess ? 'border-l-exito' : isError ? 'border-l-error' : 'border-l-acento'}`} 
      role="alert"
    >
      {title ? (
        <h3 className={`font-semibold flex items-center gap-2 ${isError ? 'text-error' : 'text-textoPrincipal'}`}>
          {isSuccess && <span className="text-exito">✓</span>}
          {title}
        </h3>
      ) : null}
      {message ? <p className="text-sm text-textoSecundario">{message}</p> : null}
      {children}
    </section>
  );
}