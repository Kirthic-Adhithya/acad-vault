import { useState, useRef } from 'react'
import { createSubmission } from '../api'

const CATEGORIES = ['assignment', 'report', 'certificate']

const INITIAL = { title: '', category: 'assignment', description: '', file: null }

/**
 * UploadForm — multipart form to create a new submission.
 *
 * Upload order matches the backend:
 *   validate → POST multipart → backend does S3 upload first, then DB insert.
 */
export default function UploadForm({ onSuccess, onCancel, onToast }) {
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragover, setDragover] = useState(false)
  const fileInputRef = useRef(null)

  /* ── Validation ─────────────────────────────────────── */
  const validate = () => {
    const e = {}
    if (!values.title.trim())    e.title    = 'Title is required'
    if (!values.category)        e.category = 'Category is required'
    if (!values.file)            e.file     = 'Please select a file'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Field handlers ─────────────────────────────────── */
  const set = field => e =>
    setValues(v => ({ ...v, [field]: e.target.value }))

  const setFile = file => {
    if (!file) return
    setValues(v => ({ ...v, file }))
    setErrors(e => ({ ...e, file: undefined }))
  }

  const handleFilePick = e => setFile(e.target.files[0])

  const handleDrop = e => {
    e.preventDefault()
    setDragover(false)
    setFile(e.dataTransfer.files[0])
  }

  /* ── Submit ─────────────────────────────────────────── */
  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return

    setUploading(true)
    setProgress(0)

    try {
      const result = await createSubmission(values, pct => setProgress(pct))
      onSuccess(result)
    } catch (err) {
      const msg = err.response?.data?.detail ?? err.message ?? 'Upload failed'
      onToast(msg, 'error')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="upload-panel">
      <div style={{ padding: '32px 0 20px' }}>
        <div className="hero-eyebrow" style={{ display: 'inline-flex', marginBottom: 16 }}>
          ☁️ S3 upload · RDS record
        </div>
        <h1>Upload a Document</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.95rem' }}>
          Your file will be stored privately in S3. Metadata is saved in RDS.
          Access is scoped by IAM — no public URLs are ever created.
        </p>
      </div>

      <div className="card card-elevated">
        <form className="upload-form" onSubmit={handleSubmit} noValidate id="upload-form">

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="field-title">Document Title</label>
            <input
              id="field-title"
              type="text"
              className="form-control"
              placeholder="e.g. Cloud Computing Assignment 3"
              value={values.title}
              onChange={set('title')}
              disabled={uploading}
              maxLength={255}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="field-category">Category</label>
            <select
              id="field-category"
              className="form-control"
              value={values.category}
              onChange={set('category')}
              disabled={uploading}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            {errors.category && <span className="form-error">{errors.category}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="field-desc">
              Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="field-desc"
              className="form-control"
              placeholder="Brief description of the document…"
              value={values.description}
              onChange={set('description')}
              disabled={uploading}
              rows={3}
            />
          </div>

          {/* File drop zone */}
          <div className="form-group">
            <label className="form-label">File</label>
            <div
              className={`file-drop${dragover ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragover(true) }}
              onDragLeave={() => setDragover(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="File upload area"
              id="file-drop-zone"
            >
              <span className="file-drop-icon">
                {values.file ? '✅' : '☁️'}
              </span>
              <span className="file-drop-text">
                {values.file
                  ? <strong>{values.file.name}</strong>
                  : <><strong>Click to choose</strong> or drag &amp; drop a file</>
                }
              </span>
              {values.file && (
                <span className="file-selected">
                  {(values.file.size / 1024).toFixed(1)} KB selected
                </span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                id="field-file"
                onChange={handleFilePick}
                disabled={uploading}
                style={{ display: 'none' }}
                accept="*/*"
              />
            </div>
            {errors.file && <span className="form-error">{errors.file}</span>}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Uploading… {progress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button
              type="submit"
              id="submit-upload-btn"
              className="btn btn-primary"
              disabled={uploading}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {uploading
                ? <><span className="spinner" /> Uploading…</>
                : '✦ Upload to S3'
              }
            </button>
            <button
              type="button"
              id="cancel-upload-btn"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
