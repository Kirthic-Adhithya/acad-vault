import { useEffect, useState } from 'react'
import { listSubmissions, getDownloadUrl } from '../api'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })
}

function categoryBadge(category) {
  const cls = {
    assignment: 'badge-assignment',
    report: 'badge-report',
    certificate: 'badge-certificate',
  }[category] ?? 'badge-default'
  return <span className={`badge ${cls}`}>{category}</span>
}

export default function SubmissionList({ onSelect, onUpload, onToast }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    listSubmissions()
      .then(setSubmissions)
      .catch(err => {
        const msg = err.response?.data?.detail ?? err.message ?? 'Failed to load submissions'
        setError(msg)
        onToast(msg, 'error')
      })
      .finally(() => setLoading(false))
  }, [onToast])

  const handleDownload = async (e, id, title) => {
    e.stopPropagation()
    setDownloadingId(id)
    try {
      const { download_url } = await getDownloadUrl(id)
      window.open(download_url, '_blank', 'noopener,noreferrer')
      onToast(`Download link opened for "${title}"`, 'success')
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Failed to generate download link'
      onToast(msg, 'error')
    } finally {
      setDownloadingId(null)
    }
  }

  if (error && !loading) {
    return (
      <div className="panel table-empty">
        <h3 style={{ color: 'var(--danger)', marginBottom: 8 }}>Error Loading Data</h3>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="flex justify-between items-center" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Documents</h2>
        <button className="btn btn-primary" onClick={onUpload}>Upload Document</button>
      </div>
      
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Document Title</th>
              <th>Category</th>
              <th>Upload Date</th>
              <th>Storage</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  Loading...
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-empty">
                  No submissions yet. Upload a document to get started.
                </td>
              </tr>
            ) : (
              submissions.map(sub => (
                <tr key={sub.id} onClick={() => onSelect(sub.id)} style={{ cursor: 'pointer' }}>
                  <td style={{ color: 'var(--text-muted)' }}>#{sub.id}</td>
                  <td style={{ fontWeight: 500 }}>{sub.title}</td>
                  <td>{categoryBadge(sub.category)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDate(sub.uploaded_at)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>AWS S3</td>
                  <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-4" style={{ justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => onSelect(sub.id)}
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={e => handleDownload(e, sub.id, sub.title)}
                        disabled={downloadingId === sub.id}
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        {downloadingId === sub.id ? '...' : 'Download'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
