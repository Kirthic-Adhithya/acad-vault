import { useEffect, useState } from 'react'
import { getSubmission, getDownloadUrl } from '../api'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
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
  const emoji = { assignment: '📝', report: '📊', certificate: '🏆' }[category] ?? '📄'
  return <span className={`badge ${cls}`}>{emoji} {category}</span>
}

/**
 * SubmissionDetail — full record view with presigned-URL download.
 *
 * Download flow:
 *  1. GET /submissions/{id}/download  →  { download_url, expires_in }
 *  2. Open download_url in a new tab — browser streams the file directly from S3.
 *  The backend never proxies file bytes.
 */
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
      const { download_url, expires_in } = await getDownloadUrl(id)
      window.open(download_url, '_blank', 'noopener,noreferrer')
      onToast(
        `Presigned URL generated — valid for ${Math.round(expires_in / 60)} minutes.`,
        'success',
      )
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Could not generate download link'
      onToast(msg, 'error')
    } finally {
      setDownloading(false)
    }
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="detail-panel" style={{ paddingTop: 40 }}>
        <div className="skeleton" style={{ height: 28, width: '50%', marginBottom: 20 }} />
        <div className="card card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 18, width: '70%' }} />
          <div className="skeleton" style={{ height: 14, width: '40%' }} />
          <div className="skeleton" style={{ height: 80 }} />
          <div className="skeleton" style={{ height: 60 }} />
        </div>
      </div>
    )
  }

  /* ── Error state ── */
  if (error || !sub) {
    return (
      <div className="detail-panel" style={{ paddingTop: 40 }}>
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>Could not load submission</h3>
          <p className="text-muted">{error}</p>
          <button className="btn btn-ghost mt-4" onClick={onBack}>← Go back</button>
        </div>
      </div>
    )
  }

  /* ── Full detail view ── */
  return (
    <div className="detail-panel">
      <div style={{ padding: '32px 0 24px' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} id="detail-back-btn" style={{ marginBottom: 20 }}>
          ← All Submissions
        </button>

        <div className="detail-header">
          <h2>{sub.title}</h2>
          {categoryBadge(sub.category)}
        </div>
      </div>

      <div className="detail-body">

        {/* Metadata grid */}
        <div className="card card-elevated">
          <h3 style={{ marginBottom: 20, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Document Info
          </h3>
          <div className="detail-meta-grid">
            <div className="meta-item">
              <span className="meta-label">ID</span>
              <span className="meta-value">#{sub.id}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Category</span>
              <span className="meta-value" style={{ textTransform: 'capitalize' }}>{sub.category}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Uploaded At</span>
              <span className="meta-value">{formatDate(sub.uploaded_at)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Storage</span>
              <span className="meta-value" style={{ color: 'var(--accent-light)' }}>AWS S3</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {sub.description && (
          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
              Description
            </h3>
            <div className="description-block">{sub.description}</div>
          </div>
        )}

        {/* S3 key (reference, not a link) */}
        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
            Storage Reference
          </h3>
          <code style={{
            display: 'block',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            wordBreak: 'break-all',
          }}>
            s3://{sub.s3_key}
          </code>
          <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            The bucket name is not exposed — access is granted via IAM and presigned URLs only.
          </p>
        </div>

        {/* Download block */}
        <div className="download-block">
          <div className="download-info">
            <strong>Download this document</strong>
            <small>
              Clicking generates a short-lived presigned URL (&amp;1 hr). Your browser fetches
              the file directly from S3 — the backend never proxies the bytes.
            </small>
          </div>
          <button
            id="download-presigned-btn"
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading
              ? <><span className="spinner" /> Generating…</>
              : '↓ Download from S3'
            }
          </button>
        </div>

      </div>

      <div style={{ height: 60 }} />
    </div>
  )
}
