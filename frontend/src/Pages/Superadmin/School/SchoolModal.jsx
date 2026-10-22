import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { createSchool, updateSchool, clearSchoolError, clearSingleError } from '../../../features/schoolSlice'
import { useToast } from '../../../context/ToastContext'

const EMPTY = {
  name: '', schoolCode: '', email: '', phone: '',
  address: '', website: '', logo: '', status: 'Active',
}

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

export default function SchoolModal({ open, school, onClose }) {
    const toast = useToast();
  const dispatch = useDispatch()
  const { saving, error2 } = useSelector((s) => s.schools)
  const isEdit = Boolean(school)

  const [form, setForm] = useState(EMPTY)
  const [localError, setLocalError] = useState('')

  // reset/prefill whenever modal opens
  useEffect(() => {
    if (!open) return
    dispatch(clearSchoolError())
    dispatch(clearSingleError())
    setLocalError('')
    setForm(
      school
        ? Object.fromEntries(Object.keys(EMPTY).map((k) => [k, school[k] ?? EMPTY[k]]))
        : EMPTY
    )
  }, [open, school, dispatch])

  // esc to close + lock scroll
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setLocalError('')
    if (error2) dispatch(clearSingleError())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { name, schoolCode, email, phone } = form
    if (!name.trim() || !schoolCode.trim() || !email.trim() || !phone.trim())
      return setLocalError('Name, code, email and phone are required')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setLocalError('Enter a valid email')
    if (!/^\d{10}$/.test(phone.trim())) return setLocalError('Phone number must be exactly 10 digits')

    // only editable fields; drop empty optionals
    const payload = Object.fromEntries(
      Object.entries(form)
        .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
        .filter(([k, v]) => v !== '' || ['name', 'schoolCode', 'email', 'phone'].includes(k))
    )

    try {
  await toast.promise(
    dispatch(isEdit ? updateSchool({ id: school._id, payload }) : createSchool(payload)).unwrap(),
    {
      loading: isEdit ? 'Updating school...' : 'Saving school...',
      success: isEdit ? 'School updated' : 'School created',
      error2: (e) => e, // message from rejectWithValue
    }
  )
  onClose(true)
} catch { /* toast and inline error already shown */ }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* overlay */}
      <div onClick={() => onClose()} className="absolute inset-0 bg-black/40" />

      {/* card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl bg-[#f6f6f6] shadow-xl"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">
              {isEdit ? 'Edit School' : 'Add School'}
            </h2>
            <p className="text-xs text-stone-500">
              {isEdit ? 'Update the school details.' : 'Fill in the details to register a school.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            aria-label="Close"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-stone-600 hover:bg-stone-200"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="mt-5 grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 pb-2 sm:grid-cols-2">
          <Field label="School Name" required className="sm:col-span-2">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Green Valley High School" className={INPUT} />
          </Field>

          <Field label="School Code" required>
            <input name="schoolCode" value={form.schoolCode} onChange={handleChange} placeholder="GVHS-001" className={INPUT} />
          </Field>

          <Field label="Status">
            <select name="status" value={form.status} onChange={handleChange} className={`${INPUT} cursor-pointer`}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>

          <Field label="Email" required>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="info@school.com" className={INPUT} />
          </Field>

          <Field label="Phone" required>
            <input name="phone" value={form.phone} onChange={(e) => handleChange({ target: { name: 'phone', value: e.target.value.replace(/\D/g, '').slice(0, 10) } })} inputMode="numeric" maxLength={10} placeholder="9876543210" className={INPUT} />
          </Field>

          <Field label="Website">
            <input name="website" value={form.website} onChange={handleChange} placeholder="https://school.com" className={INPUT} />
          </Field>

          <Field label="Logo URL">
            <input name="logo" value={form.logo} onChange={handleChange} placeholder="https://.../logo.png" className={INPUT} />
          </Field>

          <Field label="Address" className="sm:col-span-2">
            <textarea name="address" rows={3} value={form.address} onChange={handleChange} placeholder="Street, city, state, zip" className={`${INPUT} resize-none`} />
          </Field>
        </div>

        {/* footer */}
        <div className="px-6 pb-5 pt-3">
          {(localError || error2) && (
            <p className="mb-3 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-600">{localError || error2}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="rounded-full bg-stone-200/70 cursor-pointer px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-blue-600 cursor-pointer px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? 'Update School' : 'Add School'}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  )
}