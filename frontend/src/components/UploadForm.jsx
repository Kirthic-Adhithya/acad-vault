import { useState, useRef } from 'react'
import { createSubmission } from '../api'

const CATEGORIES = ['assignment', 'report', 'certificate']
const INITIAL = { title: '', category: 'assignment', description: '', file: null }

export default function UploadForm({ onSuccess, onCancel, onToast }) {
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragover, setDragover] = useState(false)
  const fileInputRef = useRef(null)

  const validate = () => {
    const e = {}
    if (!values.title.trim()) e.title = 'Title is required'
    if (!values.category) e.category = 'Category is required'
    if (!values.file) e.file = 'Please select a file'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const set = field => e => setValues(v => ({ ...v, [field]: e.target.value }))

  const setFile = file => {
    if (!file) return
    setValues(v => ({ ...v, file }))
    setErrors(e => ({ ...e, file: undefined }))
  }

  const handleDrop = e => {
    e.preventDefault()
    setDragover(false)
    setFile(e.dataTransfer.files[0])
  }

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

  return (
    <div className="panel" style={{ maxWidth: 800, margin: '0 auto', padding: '32px' }}>
      
      {/* Upload Zone (from Mockup 2) */}
      <div 
        className={`upload-zone ${dragover ? 'dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragover(true) }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon">
          {values.file ? '📄' : '☁️'}
        </div>
        <div className="upload-text">
          {values.file ? (
            <span>Selected: <strong>{values.file.name}</strong> ({(values.file.size / 1024).toFixed(1)} KB)</span>
          ) : (
            <span>Drag and drop file here<br/>or <br/><strong>Browse files</strong></span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={e => setFile(e.target.files[0])}
          style={{ display: 'none' }}
          disabled={uploading}
        />
      </div>
      {errors.file && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '-16px', marginBottom: '16px', textAlign: 'center' }}>{errors.file}</div>}

      {/* Form Fields */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Document Title</label>
          <input 
            type="text" 
            className="form-control" 
            value={values.title} 
            onChange={set('title')}
            disabled={uploading}
            placeholder="e.g. Q3 Marketing Report"
          />
          {errors.title && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.title}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select 
            className="form-control" 
            value={values.category} 
            onChange={set('category')}
            disabled={uploading}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <textarea 
            className="form-control" 
            value={values.description} 
            onChange={set('description')}
            disabled={uploading}
            rows={3}
          />
        </div>

        {uploading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 4, background: 'var(--border-light)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent)', width: `${progress}%`, transition: 'width 0.2s' }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{progress}%</div>
          </div>
        )}

        <div className="flex gap-4" style={{ marginTop: 32 }}>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={uploading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
