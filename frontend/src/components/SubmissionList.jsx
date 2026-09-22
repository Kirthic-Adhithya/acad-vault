import { useEffect, useState } from 'react'
import { listSubmissions, getDownloadUrl } from '../api'

/* Formats ISO timestamp → readable date */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function categoryBadge(category) {
  const cls = {
    assignment: 'badge-assignment',
    report: 'badge-report',
    certificate: 'badge-certificate',
  }[category] ?? 'badge-default'

  const emoji = { assignment: '📝', report: '📊', certificate: '🏆' }[category] ?? '📄'
  return <span className={`badge ${cls}`}>{emoji} {category}</span>
}

/* Skeleton card shown while loading */
function SkeletonCard() {
  return (
    <div className="submission-card" style={{ gap: 12, cursor: 'default' }}>
      <div className="skeleton" style={{ height: 14, width: '60%' }} />
      <div className="skeleton" style={{ height: 10, width: '35%' }} />
      <div className="skeleton" style={{ height: 10, width: '80%', marginTop: 4 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <div className="skeleton" style={{ height: 32, width: 80, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 32, width: 96, borderRadius: 8 }} />
      </div>
    </div>
  )
}

/**
 * SubmissionList — home view.
 * Fetches all submissions and renders them as interactive cards.
 */
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

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span>☁️</span> AWS S3 · RDS MySQL · FastAPI
        </div>
        <h1>Your <span>Academic Documents</span>,<br />Secured in the Cloud</h1>
        <p className="hero-sub">
          Upload assignments, reports, and certificates. Files are stored privately in S3;
          metadata lives in RDS — access controlled by IAM, not hard-coded keys.
        </p>
        <button id="hero-upload-btn" className="btn btn-primary btn-lg" onClick={onUpload}>
          ✦ Upload Document
        </button>

        <div className="hero-stats">
          <div className="stat">
            <div className="stat-value">
              {loading ? '—' : <><span>{submissions.length}</span></>}
            </div>
            <div className="stat-label">Documents</div>
          </div>
          <div className="stat">
            <div className="stat-value"><span>S3</span></div>
            <div className="stat-label">Object Storage</div>
          </div>
          <div className="stat">
            <div className="stat-value"><span>IAM</span></div>
            <div className="stat-label">Access Control</div>
          </div>
        </div>
      </section>

      {/* ── List section ── */}
      <section className="section">
        <div className="section-header">
          <div className="section-title">
            <h2>All Submissions</h2>
            {!loading && (
              <span className="section-count">{submissions.length}</span>
            )}
          </div>
          <button id="list-upload-btn" className="btn btn-primary btn-sm" onClick={onUpload}>
            + New Upload
          </button>
        </div>

        {loading && (
          <div className="submissions-grid">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>Could not load submissions</h3>
            <p className="text-muted">{error}</p>
          </div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No submissions yet</h3>
            <p>Upload your first document to get started.</p>
            <button
              className="btn btn-primary mt-4"
              onClick={onUpload}
              id="empty-upload-btn"
            >
              + Upload Document
            </button>
          </div>
        )}

        {!loading && !error && submissions.length > 0 && (
          <div className="submissions-grid">
            {submissions.map(sub => (
              <div
                key={sub.id}
                className="submission-card"
                onClick={() => onSelect(sub.id)}
                role="button"
                tabIndex={0}
                aria-label={`View ${sub.title}`}
                onKeyDown={e => e.key === 'Enter' && onSelect(sub.id)}
                id={`card-${sub.id}`}
              >
                <div className="submission-card-header">
                  <div className="submission-card-title">{sub.title}</div>
                  {categoryBadge(sub.category)}
                </div>

                <div className="submission-card-meta">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(sub.uploaded_at)}
                </div>

                <div className="submission-card-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onSelect(sub.id)}
                    id={`view-btn-${sub.id}`}
                  >
                    View Details
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={e => handleDownload(e, sub.id, sub.title)}
                    disabled={downloadingId === sub.id}
                    id={`download-btn-${sub.id}`}
                  >
                    {downloadingId === sub.id
                      ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Fetching…</>
                      : '↓ Download'
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
