import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { createStudent, updateStudent, clearStudentError } from '../../../features/studentSlice'
import { useToast } from '../../../context/ToastContext'

const EMPTY = {
  name: '', email: '', password: '', phone: '',
  admissionNumber: '', rollNumber: '', className: '', section: '', academicYear: '',
  admissionDate: '', status: 'Active',
  dob: '', gender: '', address: '',
  guardianName: '', guardianRelation: '', guardianPhone: '', guardianEmail: '',
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

const Section = ({ title }) => (
  <p className="border-t border-stone-200 pt-4 text-xs font-bold uppercase tracking-wider text-stone-400 sm:col-span-2">{title}</p>
)

const day = (d) => (d ? String(d).slice(0, 10) : '')

const toForm = (s) => ({
  name: s.name || '',
  email: s.userId?.email || '',
  password: '',
  phone: s.userId?.phone || '',
  admissionNumber: s.admissionNumber || '',
  rollNumber: s.rollNumber || '',
  className: s.className || '',
  section: s.section || '',
  academicYear: s.academicYear || '',
  admissionDate: day(s.admissionDate),
  status: s.status || 'Active',
  dob: day(s.dob),
  gender: s.gender || '',
  address: s.address || '',
  guardianName: s.guardian?.name || '',
  guardianRelation: s.guardian?.relation || '',
  guardianPhone: s.guardian?.phone || '',
  guardianEmail: s.guardian?.email || '',
})

export default function StudentModal({ open, student, onClose }) {
  const dispatch = useDispatch()
  const toast = useToast()
  const { saving } = useSelector((s) => s.students)
  const isEdit = Boolean(student)

  const [form, setForm] = useState(EMPTY)
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    dispatch(clearStudentError())
    setError(''); setShowPw(false)
    setForm(student ? toForm(student) : EMPTY)
  }, [open, student, dispatch])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !saving && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, saving, onClose])

  if (!open) return null

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }
  const requestClose = () => { if (!saving) onClose() }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const f = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim ? v.trim() : v]))
    if (!f.name) return setError('Student name is required')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Enter a valid email')
    if (!isEdit && form.password.length < 6) return setError('Password must be at least 6 characters')
    if (!f.admissionNumber) return setError('Admission number is required')
    if (!f.className) return setError('Class is required')
    if (f.guardianEmail && !/^\S+@\S+\.\S+$/.test(f.guardianEmail)) return setError('Guardian email must be valid')

    const guardian = { name: f.guardianName, relation: f.guardianRelation, phone: f.guardianPhone, email: f.guardianEmail }

    // empty dates/gender are omitted so the server never receives ''
    const payload = {
      name: f.name,
      email: f.email,
      phone: f.phone,
      admissionNumber: f.admissionNumber,
      rollNumber: f.rollNumber,
      className: f.className,
      section: f.section,
      academicYear: f.academicYear,
      address: f.address,
      guardian,
      ...(f.admissionDate && { admissionDate: f.admissionDate }),
      ...(f.dob && { dob: f.dob }),
      ...(f.gender && { gender: f.gender }),
    }

    try {
      if (isEdit) {
        await toast.promise(
          dispatch(updateStudent({ id: student._id, payload: { ...payload, status: f.status } })).unwrap(),
          { loading: 'Updating student...', success: 'Student updated', error: (m) => m }
        )
      } else {
        await toast.promise(
          dispatch(createStudent({ ...payload, password: form.password })).unwrap(),
          { loading: 'Saving student...', success: 'Student created', error: (m) => m }
        )
      }
      onClose(true)
    } catch (m) {
      setError(typeof m === 'string' ? m : 'Something went wrong')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={requestClose} className="absolute inset-0 bg-black/40" />

      <form onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-[#f6f6f6] shadow-xl">
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">{isEdit ? 'Edit Student' : 'Add Student'}</h2>
            <p className="text-xs text-stone-500">
              {isEdit ? 'Update the student details.' : 'Create a student account and profile.'}
            </p>
          </div>
          <button type="button" onClick={requestClose} disabled={saving} aria-label="Close"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-stone-600 hover:bg-stone-200 disabled:opacity-50">
            ✕
          </button>
        </div>

        <div className="mt-5 grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 pb-2 sm:grid-cols-2">
          <Section title="Account" />
          <Field label="Full Name" required>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Bart Simpson" className={INPUT} />
          </Field>
          <Field label="Email" required>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="student@school.com" className={INPUT} />
          </Field>
          <Field label="Phone">
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={INPUT} />
          </Field>
          {!isEdit && (
            <Field label="Password" required>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                  placeholder="Min 6 characters" autoComplete="new-password" className={`${INPUT} pr-16`} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs font-medium text-blue-600 hover:underline">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>
          )}

          <Section title="Academic" />
          <Field label="Admission Number" required>
            <input name="admissionNumber" value={form.admissionNumber} onChange={handleChange} placeholder="ADM-1001" className={INPUT} />
          </Field>
          <Field label="Roll Number">
            <input name="rollNumber" value={form.rollNumber} onChange={handleChange} placeholder="12" className={INPUT} />
          </Field>
          <Field label="Class" required>
            <input name="className" value={form.className} onChange={handleChange} placeholder="10" className={INPUT} />
          </Field>
          <Field label="Section">
            <input name="section" value={form.section} onChange={handleChange} placeholder="A" className={INPUT} />
          </Field>
          <Field label="Academic Year">
            <input name="academicYear" value={form.academicYear} onChange={handleChange} placeholder="2026-27" className={INPUT} />
          </Field>
          <Field label="Admission Date">
            <input type="date" name="admissionDate" value={form.admissionDate} onChange={handleChange} className={INPUT} />
          </Field>
          {isEdit && (
            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange} className={`${INPUT} cursor-pointer`}>
                {['Active', 'Inactive', 'Graduated', 'Transferred'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          )}

          <Section title="Personal" />
          <Field label="Date of Birth">
            <input type="date" name="dob" value={form.dob} onChange={handleChange} className={INPUT} />
          </Field>
          <Field label="Gender">
            <select name="gender" value={form.gender} onChange={handleChange} className={`${INPUT} cursor-pointer`}>
              <option value="">Select</option>
              {['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <textarea name="address" rows={2} value={form.address} onChange={handleChange}
              placeholder="Street, city, state, zip" className={`${INPUT} resize-none`} />
          </Field>

          <Section title="Guardian" />
          <Field label="Guardian Name">
            <input name="guardianName" value={form.guardianName} onChange={handleChange} placeholder="Homer Simpson" className={INPUT} />
          </Field>
          <Field label="Relation">
            <input name="guardianRelation" value={form.guardianRelation} onChange={handleChange} placeholder="Father" className={INPUT} />
          </Field>
          <Field label="Guardian Phone">
            <input name="guardianPhone" value={form.guardianPhone} onChange={handleChange} placeholder="+91 98765 43210" className={INPUT} />
          </Field>
          <Field label="Guardian Email">
            <input type="email" name="guardianEmail" value={form.guardianEmail} onChange={handleChange} placeholder="guardian@email.com" className={INPUT} />
          </Field>
        </div>

        <div className="px-6 pb-5 pt-3">
          {error && <p className="mb-3 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={requestClose} disabled={saving}
              className="cursor-pointer rounded-full bg-stone-200/70 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-200 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="cursor-pointer rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  )
}