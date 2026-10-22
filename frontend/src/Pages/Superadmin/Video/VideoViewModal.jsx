import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { fmtBytes, fmtDuration } from '../../../utils/format'

const STATUS_STYLE = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-600',
  Suspended: 'bg-red-100 text-red-600',
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-'

const Item = ({ label, children, className = '' }) => (
  <div className={className}>
    <p className="mb-1 text-xs font-semibold text-stone-500">{label}</p>
    <div className="break-words rounded-xl bg-stone-200/60 px-4 py-2.5 text-sm text-stone-800">
      {children || <span className="text-stone-400">-</span>}
    </div>
  </div>
)

const Avatar = ({ src, name, className = 'h-10 w-10' }) =>
  src ? (
    <img src={src} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
  ) : (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-violet-300 text-sm font-semibold text-white`}>
      {name?.[0]?.toUpperCase()}
    </div>
  )

export default function VideoViewModal({ open, onClose }) {
  const { current: v, viewing } = useSelector((s) => s.videos)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-[#f6f6f6] shadow-xl">
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Video Details</h2>
            <p className="text-xs text-stone-500">Complete information about this video.</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-stone-600 hover:bg-stone-200">
            ✕
          </button>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto px-6 pb-6">
          {viewing || !v ? (
            <div className="space-y-3">
              <div className="aspect-video animate-pulse rounded-2xl bg-stone-200/60" />
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-stone-200/60" />)}
            </div>
          ) : (
            <>
              {/* player */}
              <video key={v.url} src={v.url} controls preload="metadata"
                className="aspect-video w-full rounded-2xl bg-black" />

              {/* identity */}
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4">
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="break-words text-base font-semibold text-stone-900">{v.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{v.category || 'Uncategorized'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[v.status] || 'bg-stone-100 text-stone-600'}`}>
                  {v.status}
                </span>
              </div>

              {/* details */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Item label="Description" className="sm:col-span-2">{v.description}</Item>
                <Item label="Duration">{fmtDuration(v.duration)}</Item>
                <Item label="File Size">{fmtBytes(v.size)}</Item>
                <Item label="Format">{v.mimeType}</Item>
                <Item label="Uploaded As">{v.uploaderRole === 'SchoolAdmin' ? 'School Admin upload' : 'Super Admin upload'}</Item>
                <Item label="Uploaded" className="sm:col-span-2">{fmtDate(v.createdAt)}</Item>
              </div>

              {/* uploader */}
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold text-stone-600">Uploaded By</p>
                {v.uploadedBy ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
                    <Avatar src={v.uploadedBy.profileImage} name={v.uploadedBy.name} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-sm font-semibold text-stone-800">{v.uploadedBy.name}</p>
                      <p className="truncate text-xs text-stone-500">{v.uploadedBy.email}</p>
                    </div>
                    <span className="rounded-full bg-stone-200/70 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                      {v.uploadedBy.role}
                    </span>
                  </div>
                ) : (
                  <p className="rounded-2xl bg-white px-4 py-4 text-center text-sm text-stone-400">Uploader no longer exists</p>
                )}
              </div>

              {/* schools */}
<div className="mt-6">
  <p className="mb-2 text-xs font-semibold text-stone-600">School</p>
  {v.schoolId ? (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
      <Avatar src={v.schoolId.logo} name={v.schoolId.name} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold text-stone-800">{v.schoolId.name}</p>
        <p className="truncate text-xs text-stone-500">{v.schoolId.email}</p>
        <p className="text-xs text-stone-500">{v.schoolId.schoolCode}</p>
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[v.schoolId.status] || 'bg-stone-100 text-stone-600'}`}>
        {v.schoolId.status}
      </span>
    </div>
  ) : (
    <p className="rounded-2xl bg-white px-4 py-4 text-center text-sm text-stone-400">School no longer exists</p>
  )}
</div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}