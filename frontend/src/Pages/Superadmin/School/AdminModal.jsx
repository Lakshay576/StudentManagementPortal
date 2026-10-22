import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { createAdmin } from '../../../features/schoolSlice'
import { useToast } from '../../../context/ToastContext'

const EMPTY = { name: '', email: '', password: '', phone: '' }

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

export default function AdminModal({ open, schoolId, schoolName, onClose }) {
  const dispatch = useDispatch()
  const toast = useToast()
  const { adminSaving } = useSelector((s) => s.schools)

  const [form, setForm] = useState(EMPTY)
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(EMPTY)
    setShowPw(false)
    setError('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { name, email, password, phone } = form
    if (!name.trim() || !email.trim() || !password || !phone.trim())
      return setError('All fields are required')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email')
    if (password.length < 6) return setError('Password must be at least 6 characters')

    const payload = { name: name.trim(), email: email.trim(), password, phone: phone.trim(), schoolId }

    try {
      await toast.promise(dispatch(createAdmin(payload)).unwrap(), {
        loading: 'Creating admin...',
        success: 'Admin created',
        error: (msg) => msg,
      })
      onClose()
    } catch (msg) {
      setError(typeof msg === 'string' ? msg : 'Failed to create admin')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl bg-[#f6f6f6] shadow-xl"
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Add School Admin</h2>
            <p className="text-xs text-stone-500">
              {schoolName ? `For ${schoolName}` : 'Create a new admin for this school.'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-stone-600 hover:bg-stone-200">
            ✕
          </button>
        </div>

        <div className="mt-5 grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 pb-2">
          <Field label="Full Name" required>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Seymour Skinner" className={INPUT} />
          </Field>

          <Field label="Email" required>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="admin@school.com" className={INPUT} />
          </Field>

          <Field label="Phone" required>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={INPUT} />
          </Field>

          <Field label="Password" required>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                className={`${INPUT} pr-16`}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs font-medium text-blue-600 hover:underline">
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>
        </div>

        <div className="px-6 pb-5 pt-3">
          {error && <p className="mb-3 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="cursor-pointer rounded-full bg-stone-200/70 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-200">
              Cancel
            </button>
            <button type="submit" disabled={adminSaving}
              className="cursor-pointer rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
              {adminSaving ? 'Saving...' : 'Add Admin'}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  )
}