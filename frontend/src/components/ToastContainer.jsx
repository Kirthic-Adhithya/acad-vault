export default function ToastContainer({ toasts, onClose }) {
  if (!toasts.length) return null

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(t => (
        <div key={t.id} className="toast" role="alert">
          <button className="toast-close" onClick={() => onClose(t.id)} aria-label="Close">
            &times;
          </button>
          
          <div className="toast-header">
            {t.type === 'success' && <span style={{ color: 'var(--success)', fontSize: '1.2rem' }}>🥳</span>}
            {t.type === 'error' && <span style={{ color: 'var(--danger)', fontSize: '1.2rem' }}>⚠️</span>}
            {t.type === 'info' && <span style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>ℹ️</span>}
            
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t.type === 'success' ? 'Success!' : t.type === 'error' ? 'Error!' : 'Notice'}
            </span>
          </div>
          
          <div className="toast-body">
            {t.message}
          </div>
          
          <div className="toast-progress" style={{ animation: `shrink ${t.duration}ms linear forwards`, backgroundColor: `var(--${t.type === 'info' ? 'accent' : t.type})` }} />
          <style>{`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>
      ))}
    </div>
  )
}
