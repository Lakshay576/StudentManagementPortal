import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, updateProfile, changePassword } from '../../../features/profileSlice'
import { useToast } from '../../../context/ToastContext'

const INPUT =
  'w-full rounded-xl bg-stone-200/60 px-4 py-2.5 text-sm text-stone-800 outline-none ring-1 ring-transparent placeholder:text-stone-500 focus:bg-white focus:ring-blue-600 disabled:cursor-not-allowed disabled:text-stone-400'

const Row = ({ title, desc, children }) => (
  <div className="grid gap-3 border-t border-stone-200 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-10">
    <div>
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="mt-1 text-xs text-stone-500">{desc}</p>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
)

const PasswordInput = ({ show, onToggle, ...props }) => (
  <div className="relative">
    <input type={show ? 'text' : 'password'} className={`${INPUT} pr-16`} {...props} />
    <button type="button" onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-xs font-medium text-blue-600 hover:underline">
      {show ? 'Hide' : 'Show'}
    </button>
  </div>
)

const PROFILE_FIELDS = ['name', 'email', 'phone', 'address', 'profileImage']
const toForm = (p) => Object.fromEntries(PROFILE_FIELDS.map((k) => [k, p?.[k] ?? '']))
const EMPTY_PW = { oldPassword: '', newPassword: '', confirmPassword: '' }

export default function Profile() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { data, loading, saving } = useSelector((s) => s.profile)

  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState(toForm(null))
  const [pw, setPw] = useState(EMPTY_PW)
  const [error, setError] = useState('')

  useEffect(() => { dispatch(fetchProfile()) }, [dispatch])
  useEffect(() => { if (data) setForm(toForm(data)) }, [data])

  const switchTab = (t) => { setTab(t); setError('') }

  const onForm = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }
  const onPw = (e) => { setPw({ ...pw, [e.target.name]: e.target.value }); setError('') }

  const [showPw, setShowPw] = useState({ oldPassword: false, newPassword: false, confirmPassword: false })
  const toggle = (k) => setShowPw((s) => ({ ...s, [k]: !s[k] }))

  const saveProfile = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Name is required')
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      profileImage: form.profileImage.trim(),
    }
    try {
      await toast.promise(dispatch(updateProfile(payload)).unwrap(), {
        loading: 'Saving changes...',
        success: 'Profile updated',
        error: (m) => m,
      })
    } catch (m) { setError(typeof m === 'string' ? m : 'Failed to update profile') }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    const { oldPassword, newPassword, confirmPassword } = pw
    if (!oldPassword || !newPassword || !confirmPassword) return setError('All fields are required')
    if (newPassword.length < 6) return setError('New password must be at least 6 characters')
    if (newPassword !== confirmPassword) return setError('Passwords do not match')
    try {
      await toast.promise(dispatch(changePassword({ oldPassword, newPassword })).unwrap(), {
        loading: 'Updating password...',
        success: 'Password changed',
        error: (m) => m,
      })
      setPw(EMPTY_PW)
    } catch (m) { setError(typeof m === 'string' ? m : 'Failed to change password') }
  }

  const reset = () => { setError(''); tab === 'profile' ? setForm(toForm(data)) : setPw(EMPTY_PW) }

  return (
    <div className="max-w-4xl">
      <p className="text-sm text-stone-500">Manage your account details and security.</p>

      {/* tab switch */}
      <div className="mt-4 inline-flex rounded-full bg-stone-200/70 p-1">
        {[['profile', 'Profile'], ['password', 'Change Password']].map(([k, label]) => (
          <button key={k} onClick={() => switchTab(k)}
            className={`cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition ${
              tab === k ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={tab === 'profile' ? saveProfile : savePassword} className="mt-4">
        {tab === 'profile' ? (
          loading && !data ? (
            <div className="space-y-4 border-t border-stone-200 py-6">
              {[...Array(4)].map((_, i) => <div key={i} className="h-11 animate-pulse rounded-full bg-stone-200/60" />)}
            </div>
          ) : (
            <>
              <Row title="Full Name" desc="This will be displayed across the dashboard.">
                <input name="name" value={form.name} onChange={onForm} placeholder="Your name" className={INPUT} />
              </Row>

              <Row title="Email" desc="Your login email. It cannot be changed here.">
                <input value={form.email} disabled className={INPUT} />
              </Row>

              <Row title="Phone" desc="How we can reach you.">
                <input name="phone" value={form.phone} onChange={onForm} placeholder="+91 98765 43210" className={INPUT} />
              </Row>

              <Row title="Address" desc="Your current address.">
                <textarea name="address" value={form.address} onChange={onForm} placeholder="Street, city, state, postal code" className={INPUT} />
              </Row>

              <Row title="Profile Image" desc="Link to your profile picture.">
                <input name="profileImage" value={form.profileImage} onChange={onForm} placeholder="https://.../photo.png" className={INPUT} />
              </Row>
            </>
          )
        ) : (
          <>
            <Row title="Current Password" desc="Enter your existing password to verify it's you.">
              <PasswordInput name="oldPassword" value={pw.oldPassword} onChange={onPw}
                show={showPw.oldPassword} onToggle={() => toggle('oldPassword')}
                autoComplete="current-password" placeholder="Current password" />
            </Row>

            <Row title="New Password" desc="Minimum 6 characters. Must differ from the current one.">
              <PasswordInput name="newPassword" value={pw.newPassword} onChange={onPw}
                show={showPw.newPassword} onToggle={() => toggle('newPassword')}
                autoComplete="new-password" placeholder="New password" />
            </Row>

            <Row title="Confirm Password" desc="Re-enter the new password.">
              <PasswordInput name="confirmPassword" value={pw.confirmPassword} onChange={onPw}
                show={showPw.confirmPassword} onToggle={() => toggle('confirmPassword')}
                autoComplete="new-password" placeholder="Confirm new password" />
            </Row>
          </>
        )}

        {error && <p className="mb-3 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-5">
          <button type="button" onClick={reset}
            className="cursor-pointer px-3 py-2 text-sm font-semibold text-stone-800 hover:text-stone-600">
            Reset
          </button>
          <button type="submit" disabled={saving}
            className="cursor-pointer rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving...' : tab === 'profile' ? 'Save changes' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  )
}