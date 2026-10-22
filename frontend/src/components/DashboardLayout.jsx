// DashboardLayout.jsx
import { useState, useEffect } from 'react'
import { NavLink, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../features/authSlice'
import { createPortal } from 'react-dom'
import { useToast } from '../context/ToastContext'
import { homeFor } from '../utils/roles'

function SignOutConfirm({ open, loading, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !loading && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, loading, onCancel])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        onClick={() => !loading && onCancel()}
        className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-black/20 to-transparent backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <button onClick={onCancel} disabled={loading} aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-stone-600 hover:bg-stone-200">
          ✕
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
        </div>

        <h3 className="mt-4 text-base font-semibold text-stone-900">Sign out of your account?</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          You'll need to sign in again to access your account. Any unsaved changes will be lost.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} disabled={loading}
            className="cursor-pointer rounded-full bg-stone-200/70 px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-200 disabled:opacity-60">
            Stay Signed In
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="cursor-pointer rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

const Icon = ({ d, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
)

const ICONS = {
  dashboard: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z',
  school: 'M3 10l9-6 9 6M5 10v9h14v-9M9 19v-5h6v5',
  video: 'M3 6h12a2 2 0 012 2v8a2 2 0 01-2 2H3zM17 10l4-2v8l-4-2',
  students: 'M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1M9 11a4 4 0 100-8 4 4 0 000 8zM22 19v-1a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  help: 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5a2.5 2.5 0 114 2c-.8.5-1.5 1-1.5 2M12 17h.01',
  logout: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.3-4.3',
  bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4zM10 21h4',
  panel: 'M4 5h16v14H4zM9 5v14',
  close: 'M6 6l12 12M18 6L6 18',
}

const NAV_BY_ROLE = {
  SuperAdmin: [
    {
      title: 'Super Admin Module',
      items: [
        { icon: ICONS.dashboard, label: 'Dashboard', to: '/dashboard', end: true },
        { icon: ICONS.school, label: 'School Management', to: '/dashboard/schools' },
        { icon: ICONS.video, label: 'Video Management', to: '/dashboard/videos' },
      ],
    },
  ],
  SchoolAdmin: [
    {
      title: 'School Admin Module',
      items: [
        { icon: ICONS.dashboard, label: 'Dashboard', to: '/school-admin', end: true },
        { icon: ICONS.students, label: 'Student Management', to: '/school-admin/students' },
        { icon: ICONS.video, label: 'Video Management', to: '/school-admin/school-videos' },
      ],
    },
  ],
  Student: [
    {
      title: 'Student Module',
      items: [{ icon: ICONS.dashboard, label: 'Dashboard', to: '/student', end: true }],
    },
  ],
}

const TITLES = {
  '/dashboard': null,
  '/dashboard/schools': 'School Management',
  '/dashboard/videos': 'Video Management',
  '/dashboard/profile': 'Profile',
  '/school-admin/students': 'Student Management',
  '/school-admin/school-videos': 'Video Management',
  '/school-admin/profile': 'Profile',
}

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function DashboardLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const { pathname } = useLocation()

  const [open, setOpen] = useState(false)       // mobile drawer
  const [collapsed, setCollapsed] = useState(false) // desktop sidebar

  const toast = useToast()
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!user) return <Navigate to="/login" replace />

  const groups = NAV_BY_ROLE[user.role] || []
  const base = homeFor(user.role)

  const handleLogout = async () => {
    setSigningOut(true)
    await dispatch(logoutUser())
    setSigningOut(false)
    setSignOutOpen(false)
    toast.success('Signed out')
    navigate('/login')
    }

  const name = user.name || 'User'
  const title = TITLES[pathname] ?? `${greeting()}, ${name}`

  const sidebar = (
    <>
      {/* profile */}
   <NavLink to={`${base}/profile`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-stone-200/60">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-sky-300 via-violet-300 to-pink-200" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-stone-800">{name}</p>
          <p className="text-xs text-stone-500">{user.role || 'Super Admin'}</p>
        </div>
     </NavLink>

      {/* nav */}
      <nav className="mt-5 space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              {g.title}
            </p>
            <div className="space-y-1">
              {g.items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-stone-200/60 ${
                      isActive ? 'bg-stone-200/80 font-medium text-stone-900' : 'text-stone-600'
                    }`
                  }
                >
                  <Icon d={n.icon} />
                  {n.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* bottom */}
      <div className="mt-auto space-y-1">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-200/60">
          <Icon d={ICONS.help} /> Help & Information
        </button>
        <button
          onClick={() => { setOpen(false); setSignOutOpen(true) }}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-200/60"
        >
          <Icon d={ICONS.logout} /> Log out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[#f6f6f6] font-inter text-stone-800">
      {/* Desktop sidebar */}
      <aside
        className={`hidden w-60 shrink-0 flex-col border-r border-stone-200 bg-[#f6f6f6] p-3 font-poppins ${
          collapsed ? '' : 'lg:flex'
        }`}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-64 flex-col bg-[#f6f6f6] p-3 font-poppins shadow-xl transition-transform duration-300 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-3 top-3 rounded p-1 text-stone-500 hover:bg-stone-200/60"
          >
            <Icon d={ICONS.close} className="h-4 w-4" />
          </button>
          {sidebar}
        </aside>
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 px-4 py-4 md:px-6">
          <button
            onClick={() => (window.innerWidth >= 1024 ? setCollapsed((c) => !c) : setOpen(true))}
            aria-label="Toggle sidebar"
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-200/60"
          >
            <Icon d={ICONS.panel} className="h-[18px] w-[18px]" />
          </button>
          <h1 className="text-lg font-semibold md:text-xl">{title}</h1>

          <div className="ml-auto flex items-center gap-2">
            <button aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200/70 hover:bg-stone-200">
              <Icon d={ICONS.search} className="h-[18px] w-[18px]" />
            </button>
            <button aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200/70 hover:bg-stone-200">
              <Icon d={ICONS.bell} className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-8 md:px-6">
          <Outlet />
        </main>
      </div>
      <SignOutConfirm
            open={signOutOpen}
            loading={signingOut}
            onConfirm={handleLogout}
            onCancel={() => setSignOutOpen(false)}
        />
    </div>
  )
}