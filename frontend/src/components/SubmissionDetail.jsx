import { useEffect, useState } from 'react'
import { getSubmission, getDownloadUrl } from '../api'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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

export default function SubmissionDetail({ id, onBack, onToast }) {
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getSubmission(id)
      .then(setSub)
      .catch(err => {
        const msg = err.response?.data?.detail ?? 'Failed to load submission'
        setError(msg)
        onToast(msg, 'error')
      })
      .finally(() => setLoading(false))
  }, [id, onToast])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { download_url } = await getDownloadUrl(id)
      window.open(download_url, '_blank', 'noopener,noreferrer')
      onToast('Download started', 'success')
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Could not generate download link'
      onToast(msg, 'error')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <div className="panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
  }

  if (error || !sub) {
    return (
      <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: 16 }}>Error</h3>
        <p className="text-muted">{error}</p>
        <button className="btn btn-secondary mt-6" onClick={onBack}>Back to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="panel" style={{ padding: 32 }}>
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: 24, padding: '6px 12px', fontSize: '0.8rem' }}>
        ← Back
      </button>

      <div className="flex justify-between items-center" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.5rem' }}>{sub.title}</h2>
        {categoryBadge(sub.category)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32, padding: 24, background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Document ID</div>
          <div style={{ fontWeight: 500 }}>#{sub.id}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Uploaded</div>
          <div style={{ fontWeight: 500 }}>{formatDate(sub.uploaded_at)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Storage location</div>
          <div style={{ fontWeight: 500, color: 'var(--accent)' }}>AWS S3</div>
        </div>
      </div>

      {sub.description && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Description</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{sub.description}</p>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Preparing...' : 'Download Document'}
        </button>
      </div>
    </div>
  )
}
