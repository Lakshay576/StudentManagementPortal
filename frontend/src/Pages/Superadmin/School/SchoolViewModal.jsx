import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toggleAdminStatus } from '../../../features/schoolSlice'
import { useToast } from '../../../context/ToastContext'
import { fmtBytes, fmtDuration } from '../../../utils/format'

const THEME = {
  Active:    { ring: 'bg-green-100 text-green-600', btn: 'bg-green-600 hover:bg-green-700', badge: 'bg-green-100 text-green-700', backdrop: 'from-green-900/60 via-black/20' },
  Suspended: { ring: 'bg-red-100 text-red-600',     btn: 'bg-red-600 hover:bg-red-700',     badge: 'bg-red-100 text-red-600',     backdrop: 'from-red-900/60 via-black/20' },
  other:     { ring: 'bg-amber-100 text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600', badge: 'bg-amber-100 text-amber-700', backdrop: 'from-amber-900/60 via-black/20' },
}

function StatusConfirm({ admin, loading, onConfirm, onCancel }) {
  if (!admin) return null
  const target = admin.status === 'Active' ? 'Suspended' : 'Active'
  const t = THEME[target] || THEME.other

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* gradient backdrop: dark at bottom, transparent at top, blurred */}
      <div
        onClick={() => !loading && onCancel()}
      className={`absolute inset-0 bg-gradient-to-t ${t.backdrop} to-transparent backdrop-blur-md`}
      />

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <button onClick={onCancel} disabled={loading} aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-stone-600 hover:bg-stone-200">
          ✕
        </button>

        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${t.ring}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            {target === 'Active'
              ? <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>
              : <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>}
          </svg>
        </div>

        <h3 className="mt-3 text-center text-base font-semibold text-stone-900">
          {target === 'Active' ? 'Activate admin?' : 'Suspend admin?'}
        </h3>

        <p className="mt-2 text-center text-sm leading-relaxed text-stone-500">
          <span className="font-semibold text-stone-800">{admin.name}</span> will be changed from{' '}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(THEME[admin.status] || THEME.other).badge}`}>{admin.status}</span>
          {' '}to{' '}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.badge}`}>{target}</span>.
          {target === 'Suspended' && ' They will no longer be able to log in.'}
        </p>

        <div className="mt-6 space-y-2">
          <button onClick={onCancel} disabled={loading}
            className="w-full cursor-pointer rounded-full bg-stone-200/70 py-2.5 text-sm font-medium text-blue-700 hover:bg-stone-200 disabled:opacity-60">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`w-full cursor-pointer rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${t.btn}`}>
            {loading ? 'Updating...' : target === 'Active' ? 'Yes, activate' : 'Yes, suspend'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

const STATUS_STYLE = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-600',
  Suspended: 'bg-red-100 text-red-600',
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'

const Item = ({ label, children, className = '' }) => (
  <div className={className}>
    <p className="mb-1 text-xs font-semibold text-stone-500">{label}</p>
    <div className="rounded-xl bg-stone-200/60 px-4 py-2.5 text-sm text-stone-800 break-words">
      {children || <span className="text-stone-400">-</span>}
    </div>
  </div>
)

const Avatar = ({ src, name, className = 'h-12 w-12' }) =>
  src ? (
    <img src={src} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
  ) : (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-violet-300 text-sm font-semibold text-white`}>
      {name?.[0]?.toUpperCase()}
    </div>
  )


  const EXT_ICON = 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5'

export default function SchoolViewModal({ open, onClose, onAddAdmin  }) {
  const dispatch = useDispatch()
  const toast = useToast()
  const { current: s, viewing, togglingId } = useSelector((st) => st.schools)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !confirm && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

   const handleToggle = async () => {
        const a = confirm
        setConfirm(null)
        try {
            await toast.promise(dispatch(toggleAdminStatus(a._id)).unwrap(), {
            loading: 'Updating status...',
            success: 'Status updated',
            error: (msg) => msg,
            })
        } catch { /* toast shown */ }
        }


  const [confirm, setConfirm] = useState(null)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl bg-[#f6f6f6] shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">School Details</h2>
            <p className="text-xs text-stone-500">Complete information about this school.</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-stone-600 hover:bg-stone-200">
            ✕
          </button>
        </div>

        {/* body */}
        <div className="mt-5 flex-1 overflow-y-auto px-6 pb-6">
          {viewing || !s ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-stone-200/60" />
              ))}
            </div>
          ) : (
            <>
              {/* identity */}
              <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
                <Avatar src={s.logo} name={s.name} className="h-14 w-14" />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-base font-semibold text-stone-900">{s.name}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{s.schoolCode}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status] || 'bg-stone-100 text-stone-600'}`}>
                  {s.status}
                </span>
              </div>

              {/* details */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Item label="Email">{s.email}</Item>
                <Item label="Phone">{s.phone}</Item>
                <Item label="Website">
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {s.website}
                    </a>
                  )}
                </Item>
                <Item label="Created">{fmtDate(s.createdAt)}</Item>
                <Item label="Address" className="sm:col-span-2">{s.address}</Item>
              </div>

              {/* admins */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-stone-600">
                        School Admins <span className="ml-1 rounded-full bg-stone-200 px-2 py-0.5 text-[10px]">{s.admins?.length || 0}</span>
                    </p>
                    <button onClick={onAddAdmin}
                        className="cursor-pointer rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                        + Add Admin
                    </button>
                </div>

                {s.admins?.length ? (
                  <div className="space-y-2">
                    {s.admins.map((a) => (
                      <div key={a._id} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                        <Avatar src={a.profileImage} name={a.name} className="h-10 w-10" />
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className="truncate text-sm font-semibold text-stone-800">{a.name}</p>
                          <p className="truncate text-xs text-stone-500">{a.email}</p>
                          <p className="text-xs text-stone-500">{a.phone}</p>
                        </div>
                        <button
                        onClick={() => setConfirm(a)}
                        disabled={togglingId === a._id}
                        title="Click to toggle status"
                        className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium transition hover:opacity-80 disabled:opacity-50 ${STATUS_STYLE[a.status] || 'bg-stone-100 text-stone-600'}`}
                        >
                        {togglingId === a._id ? '...' : a.status}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className="flex flex-col items-center rounded-2xl bg-white px-4 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-200/70 text-stone-700">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M15 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9 11a3 3 0 100-6 3 3 0 000 6zM19 8v6M22 11h-6" />
                    </svg>
                    </div>
                    <h4 className="mt-3 text-sm font-semibold text-stone-900">No Admins Yet</h4>
                    <p className="mt-1 max-w-xs text-xs text-stone-500">
                    This school doesn't have an admin yet. Add one to get started.
                    </p>
                    <button
                    onClick={onAddAdmin}
                    className="mt-4 cursor-pointer rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                    + Add Admin
                    </button>
                </div>

                )}
              </div>

              {/* videos */}
{/* videos */}
<div className="mt-6">
  {/* stat cards */}
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-stone-500">Total Video Size on Server</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xl font-semibold text-stone-900">{fmtBytes(s.videoStats?.totalSize)}</p>
        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          {s.videoStats?.totalVideos || 0} videos
        </span>
      </div>
    </div>

    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-stone-500">Total Videos Duration</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xl font-semibold text-stone-900">{fmtDuration(s.videoStats?.totalDuration)}</p>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          avg {fmtDuration(Math.round((s.videoStats?.totalDuration || 0) / (s.videoStats?.totalVideos || 1)))}
        </span>
      </div>
    </div>
  </div>

  {/* list */}
  <p className="mb-2 mt-5 text-xs font-semibold text-stone-600">
    Videos <span className="ml-1 rounded-full bg-stone-200 px-2 py-0.5 text-[10px]">{s.videoStats?.totalVideos || 0}</span>
  </p>

  {s.videos?.length ? (
    <div className="divide-y divide-stone-200 overflow-hidden rounded-xl bg-white shadow-sm">
      {s.videos.map((v) => (
        <a
          key={v._id}
          href={v.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open video in new tab"
          className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-stone-50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-200/70 text-stone-600">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>
          </div>

          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-stone-900">{v.title}</p>
            <p className="mt-0.5 truncate text-xs text-stone-500">
              {v.category || 'Uncategorized'} · {v.visibility === 'All' ? 'All schools' : 'Assigned'}
            </p>
          </div>

          <div className="text-right leading-tight">
            <p className="text-sm font-semibold text-stone-900">{fmtDuration(v.duration)}</p>
            <p className="mt-0.5 text-xs text-stone-500">{fmtBytes(v.size)}</p>
          </div>

          <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline ${STATUS_STYLE[v.status] || 'bg-stone-100 text-stone-600'}`}>
            {v.status}
          </span>
        </a>
      ))}
    </div>
  ) : (
    <p className="rounded-3xl bg-white px-4 py-6 text-center text-sm text-stone-400">No videos available</p>
  )}
</div>
            </>
          )}
        </div>
      </div>
      <StatusConfirm
  admin={confirm}
  loading={Boolean(togglingId)}
  onConfirm={handleToggle}
  onCancel={() => setConfirm(null)}
/>
    </div>,
    document.body
  )
}