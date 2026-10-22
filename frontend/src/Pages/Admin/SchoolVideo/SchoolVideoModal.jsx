import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { uploadSchoolVideo, updateSchoolVideo, clearVideoError } from '../../../features/videoSlice'
import { useToast } from '../../../context/ToastContext'
import { fmtBytes } from '../../../utils/format'
import useAllSchools from '../../../hooks/useAllSchools'
import UploadProgress from '../../../components/UploadProgress'

const EMPTY = { title: '', description: '', category: '', status: 'Active' }
const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_SIZE = 500 * 1024 * 1024

const INPUT =
  'w-full rounded-xl bg-stone-200/60 px-4 py-2.5 text-sm text-stone-800 outline-none ring-1 ring-transparent placeholder:text-stone-500 focus:bg-white focus:ring-blue-600'
const LABEL = 'mb-1.5 block text-xs font-semibold text-stone-600'

const Field = ({ label, required, className = '', children }) => (
  <div className={className}>
    <label className={LABEL}>
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    {children}
  </div>
)

const readDuration = (file) =>
  new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(Math.round(v.duration) || 0) }
    v.onerror = () => resolve(0)
    v.src = URL.createObjectURL(file)
  })

export default function SchoolVideoModal({ open, video, onClose }) {
  const dispatch = useDispatch()
  const toast = useToast()
  const { uploading, saving } = useSelector((s) => s.videos)
//   const { schools, loading: schoolsLoading } = useAllSchools(open)
  const isEdit = Boolean(video)
  const busy = uploading || saving

  const uploadRef = useRef(null)
  const [form, setForm] = useState(EMPTY)
  const [file, setFile] = useState(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')

  // prefill / reset on open
  useEffect(() => {
    if (!open) return
    dispatch(clearVideoError())
    setError(''); setFile(null); setDuration(0)
setForm(
  video
    ? {
        title: video.title || '',
        description: video.description || '',
        category: video.category || '',
        status: video.status || 'Active',
      }
    : EMPTY
)
  }, [open, video, dispatch])

  const requestClose = () => { if (!busy) onClose() }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, busy, onClose])


  if (!open) return null

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }


  const pickFile = async (f) => {
    if (!f) return
    if (!ALLOWED.includes(f.type)) return setError('Only MP4, WebM or MOV videos are allowed')
    if (f.size > MAX_SIZE) return setError('Video exceeds the 500 MB limit')
    setError('')
    setFile(f)
    if (!form.title.trim()) setForm((p) => ({ ...p, title: f.name.replace(/\.[^.]+$/, '') }))
    setDuration(await readDuration(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (!form.title.trim()) return setError('Title is required')
    if (!isEdit && !file) return setError('Please choose a video file')

    if (isEdit) {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        status: form.status,
      }
      try {
        await toast.promise(dispatch(updateSchoolVideo({ id: video._id, payload })).unwrap(), {
          loading: 'Updating video...',
          success: 'Video updated',
          error: (m) => m,
        })
        onClose(true)
      } catch (m) { setError(typeof m === 'string' ? m : 'Failed to update video') }
      return
    }

    // add: text fields first, file last
    const fd = new FormData()
    fd.append('title', form.title.trim())
    if (form.description.trim()) fd.append('description', form.description.trim())
    if (form.category.trim()) fd.append('category', form.category.trim())
    fd.append('status', form.status)
    if (duration) fd.append('duration', String(duration))
    fd.append('video', file)

    uploadRef.current = dispatch(uploadSchoolVideo(fd))
    const res = await uploadRef.current
    if (uploadSchoolVideo.fulfilled.match(res)) {
      toast.success('Video uploaded')
      onClose(true)
    } else if (res.payload !== 'Upload cancelled') {
      setError(res.payload || 'Upload failed')
    }
  }

  const cancelUpload = () => uploadRef.current?.abort()

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={requestClose} className="absolute inset-0 bg-black/40" />

      <form onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl bg-[#f6f6f6] shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">{isEdit ? 'Edit Video' : 'Add Video'}</h2>
            <p className="text-xs text-stone-500">
             {isEdit ? 'Update the video details' : 'Upload a video.'}
            </p>
          </div>
          <button type="button" onClick={requestClose} disabled={busy} aria-label="Close"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-stone-600 hover:bg-stone-200 disabled:opacity-50">
            ✕
          </button>
        </div>

        {/* body */}
        <div className="mt-5 grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 pb-2 sm:grid-cols-2">
          {/* file */}
          <div className="sm:col-span-2">
            <label className={LABEL}>Video File {!isEdit && <span className="text-red-600">*</span>}</label>
            {isEdit ? (
              <div className="rounded-xl bg-stone-200/60 px-4 py-2.5 text-xs text-stone-500">
                {fmtBytes(video.size)} · {video.mimeType}. The file can't be changed. Delete and re-upload to replace it.
              </div>
            ) : (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (!busy) pickFile(e.dataTransfer.files?.[0]) }}
                className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-stone-300 bg-white px-4 py-6 text-center hover:border-blue-400 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
                <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])} />
                {file ? (
                  <>
                    <p className="max-w-full truncate text-sm font-semibold text-stone-800">{file.name}</p>
                    <p className="mt-1 text-xs text-stone-500">{fmtBytes(file.size)} · click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-stone-800">Drag a video here or click to browse</p>
                    <p className="mt-1 text-xs text-stone-500">MP4, WebM or MOV · up to 500 MB</p>
                  </>
                )}
              </label>
            )}
          </div>

          <Field label="Title" required className="sm:col-span-2">
            <input name="title" value={form.title} onChange={handleChange} placeholder="Algebra Basics" className={INPUT} />
          </Field>

          <Field label="Category">
            <input name="category" value={form.category} onChange={handleChange} placeholder="Maths" className={INPUT} />
          </Field>

          <Field label="Status">
            <select name="status" value={form.status} onChange={handleChange} className={`${INPUT} cursor-pointer`}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>

          <Field label="Description" className="sm:col-span-2">
            <textarea name="description" rows={3} value={form.description} onChange={handleChange}
              placeholder="What is this video about?" className={`${INPUT} resize-none`} />
          </Field>

        </div>

        {/* footer */}
        <div className="px-6 pb-5 pt-3">
          {uploading && <div className="mb-3"><UploadProgress onCancel={cancelUpload} /></div>}
          {error && <p className="mb-3 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={requestClose} disabled={busy}
              className="cursor-pointer rounded-full bg-stone-200/70 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-200 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="cursor-pointer rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
              {uploading ? 'Uploading...' : saving ? 'Saving...' : isEdit ? 'Update Video' : 'Upload Video'}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  )
}