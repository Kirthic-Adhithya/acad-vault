/**
 * ToastContainer — fixed bottom-right notification stack.
 * Rendered at the App level so any child can trigger toasts via the onToast prop.
 */
export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null

  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          role="alert"
        >
          <span style={{ fontSize: '1rem', fontWeight: 700 }}>{icons[t.type] ?? 'ℹ'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
