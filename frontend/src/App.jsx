import { useState, useCallback } from 'react'
import SubmissionList from './components/SubmissionList'
import UploadForm from './components/UploadForm'
import SubmissionDetail from './components/SubmissionDetail'
import ToastContainer from './components/ToastContainer'

/**
 * App — root component.
 *
 * Manages three view states via local state (no router needed for this scope):
 *   'list'   — home, shows all submissions
 *   'upload' — upload form
 *   'detail' — single submission detail + download
 *
 * Toast state also lives here so any child can push notifications.
 */
export default function App() {
  const [view, setView] = useState('list')       // 'list' | 'upload' | 'detail'
  const [selectedId, setSelectedId] = useState(null)
  const [toasts, setToasts] = useState([])
  const [listKey, setListKey] = useState(0)      // bump to force list refresh

  /* ── Toast helpers ───────────────────────────────────── */
  const pushToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  /* ── Navigation ──────────────────────────────────────── */
  const goList   = useCallback(() => { setView('list');   setSelectedId(null) }, [])
  const goUpload = useCallback(() => setView('upload'), [])
  const goDetail = useCallback(id  => { setSelectedId(id); setView('detail') }, [])

  const handleUploadSuccess = useCallback(submission => {
    setListKey(k => k + 1)         // refresh list cache
    pushToast(`"${submission.title}" uploaded successfully!`, 'success')
    goList()
  }, [goList, pushToast])

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="app-shell">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <button
          className="navbar-brand"
          onClick={goList}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Academic Vault home"
        >
          <span className="brand-icon">📚</span>
          Academic Vault
        </button>

        <div className="navbar-actions">
          {view !== 'list' && (
            <button id="nav-back" className="btn btn-ghost btn-sm" onClick={goList}>
              ← Back
            </button>
          )}
          {view === 'list' && (
            <button id="nav-upload" className="btn btn-primary btn-sm" onClick={goUpload}>
              + Upload
            </button>
          )}
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="container" style={{ flex: 1 }}>
        {view === 'list' && (
          <SubmissionList
            key={listKey}
            onSelect={goDetail}
            onUpload={goUpload}
            onToast={pushToast}
          />
        )}
        {view === 'upload' && (
          <UploadForm
            onSuccess={handleUploadSuccess}
            onCancel={goList}
            onToast={pushToast}
          />
        )}
        {view === 'detail' && selectedId && (
          <SubmissionDetail
            id={selectedId}
            onBack={goList}
            onToast={pushToast}
          />
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  )
}
