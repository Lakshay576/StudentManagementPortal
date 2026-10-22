import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { STATUS_STYLE } from './StudentsPage'

const LOGIN_STYLE = { Active: 'bg-green-100 text-green-700', Inactive: 'bg-red-100 text-red-600', Suspended: 'bg-red-100 text-red-600' }

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'

const Item = ({ label, children, className = '' }) => (
  <div className={className}>
    <p className="mb-1 text-xs font-semibold text-stone-500">{label}</p>
    <div className="break-words rounded-xl bg-stone-200/60 px-4 py-2.5 text-sm text-stone-800">
      {children || <span className="text-stone-400">-</span>}
    </div>
  </div>
)

const Heading = ({ children }) => (
  <p className="mb-2 mt-6 text-xs font-semibold text-stone-600">{children}</p>
)

export default function StudentViewModal({ open, onClose }) {
  const { current: s, viewing } = useSelector((st) => st.students)

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

  const u = s?.userId

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl bg-[#f6f6f6] shadow-xl">
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Student Details</h2>
            <p className="text-xs text-stone-500">Complete information about this student.</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-stone-600 hover:bg-stone-200">
            ✕
          </button>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto px-6 pb-6">
          {viewing || !s ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-stone-200/60" />)}
            </div>
          ) : (
            <>
              {/* identity */}
              <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
                {u?.profileImage ? (
                  <img src={u.profileImage} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-violet-300 text-lg font-semibold text-white">
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-base font-semibold text-stone-900">{s.name}</p>
                  <p className="mt-0.5 truncate text-xs text-stone-500">{u?.email}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status] || 'bg-stone-100 text-stone-600'}`}>
                  {s.status}
                </span>
              </div>

              <Heading>Academic</Heading>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Item label="Admission Number">{s.admissionNumber}</Item>
                <Item label="Roll Number">{s.rollNumber}</Item>
                <Item label="Class">{s.className}</Item>
                <Item label="Section">{s.section}</Item>
                <Item label="Academic Year">{s.academicYear}</Item>
                <Item label="Admission Date">{fmtDate(s.admissionDate)}</Item>
              </div>

              <Heading>Personal</Heading>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Item label="Phone">{u?.phone}</Item>
                <Item label="Gender">{s.gender}</Item>
                <Item label="Date of Birth">{s.dob ? fmtDate(s.dob) : ''}</Item>
                <Item label="Login Status">
                  {u?.status && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${LOGIN_STYLE[u.status] || 'bg-stone-100 text-stone-600'}`}>
                      {u.status}
                    </span>
                  )}
                </Item>
                <Item label="Address" className="sm:col-span-2">{s.address}</Item>
              </div>

              <Heading>Guardian</Heading>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Item label="Name">{s.guardian?.name}</Item>
                <Item label="Relation">{s.guardian?.relation}</Item>
                <Item label="Phone">{s.guardian?.phone}</Item>
                <Item label="Email">{s.guardian?.email}</Item>
              </div>

              <Heading>School</Heading>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold text-stone-800">{s.schoolId?.name}</p>
                <p className="text-xs text-stone-500">{s.schoolId?.schoolCode} · {s.schoolId?.email}</p>
              </div>

              <p className="mt-5 text-center text-xs text-stone-400">Added on {fmtDate(s.createdAt)}</p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}