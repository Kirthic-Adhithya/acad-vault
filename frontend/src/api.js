/**
 * api.js — Axios instance + typed wrappers for every backend endpoint.
 *
 * baseURL is /api — in dev the Vite proxy forwards this to http://localhost:8000/api.
 * In production (EC2) FastAPI serves /api directly, same origin, no proxy needed.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
})

/* ── Health ─────────────────────────────────────────────── */
export const getHealth = () => api.get('/health').then(r => r.data)

/* ── Submissions ─────────────────────────────────────────── */

/** Fetch lightweight list (id, title, category, uploaded_at) */
export const listSubmissions = () =>
  api.get('/submissions').then(r => r.data)

/**
 * Upload a new submission.
 * @param {{ title, category, description, file }} payload
 * @param {function} onProgress - called with percent 0-100
 */
export const createSubmission = (payload, onProgress) => {
  const form = new FormData()
  form.append('title', payload.title)
  form.append('category', payload.category)
  if (payload.description) form.append('description', payload.description)
  form.append('file', payload.file)

  return api.post('/submissions', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  }).then(r => r.data)
}

/** Fetch full record for a single submission */
export const getSubmission = id =>
  api.get(`/submissions/${id}`).then(r => r.data)

/**
 * Get a short-lived presigned S3 download URL.
 * Returns { download_url, expires_in }
 */
export const getDownloadUrl = id =>
  api.get(`/submissions/${id}/download`).then(r => r.data)
