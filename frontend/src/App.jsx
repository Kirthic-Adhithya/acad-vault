import { useState, useCallback } from 'react'
import SubmissionList from './components/SubmissionList'
import UploadForm from './components/UploadForm'
import SubmissionDetail from './components/SubmissionDetail'
import ToastContainer from './components/ToastContainer'

export default function App() {
  const [view, setView] = useState('list')       // 'list' | 'upload' | 'detail'
  const [selectedId, setSelectedId] = useState(null)
  const [toasts, setToasts] = useState([])
  const [listKey, setListKey] = useState(0)

  const pushToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, duration }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const goList = useCallback(() => { setView('list'); setSelectedId(null) }, [])
  const goUpload = useCallback(() => setView('upload'), [])
  const goDetail = useCallback((id) => { setSelectedId(id); setView('detail') }, [])

  const handleUploadSuccess = useCallback(submission => {
    setListKey(k => k + 1)
    pushToast(`File uploaded successfully!`, 'success')
    goList()
  }, [goList, pushToast])

  return (
    <div className="app-layout">
      {/* Sidebar (Mockup 2 style) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          Academic Vault
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`sidebar-item ${view === 'list' || view === 'detail' ? 'active' : ''}`} 
            onClick={goList}
          >
            Dashboard
          </div>
          <div 
            className={`sidebar-item ${view === 'upload' ? 'active' : ''}`} 
            onClick={goUpload}
          >
            Upload Document
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header">
          {view === 'list' && 'Dashboard'}
          {view === 'upload' && 'Upload Document'}
          {view === 'detail' && 'Document Details'}
        </header>
        
        <div className="content-area">
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
        </div>
      </main>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
