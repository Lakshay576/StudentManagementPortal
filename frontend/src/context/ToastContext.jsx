import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

const COLORS = {
  loading: { title: 'text-stone-800', icon: 'text-blue-600' },
  success: { title: 'text-green-700', icon: 'text-green-700' },
  error: { title: 'text-red-700', icon: 'text-red-600' },
  info: { title: 'text-stone-800', icon: 'text-stone-700' },
}

const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
    {children}
  </svg>
)

const ToastIcon = ({ type }) => {
  if (type === 'loading')
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 animate-spin">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
        <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  if (type === 'success') return <Svg><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></Svg>
  if (type === 'error') return <Svg><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></Svg>
  return <Svg><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  // passing an existing id updates that toast in place (loading -> success)
  const show = useCallback((type, title, description, id) => {
    id = id || `${Date.now()}-${Math.random()}`
    clearTimeout(timers.current[id])
    setToasts((t) =>
      t.some((x) => x.id === id)
        ? t.map((x) => (x.id === id ? { ...x, type, title, description } : x))
        : [...t, { id, type, title, description }]
    )
    if (type !== 'loading') timers.current[id] = setTimeout(() => remove(id), 3500)
    return id
  }, [remove])

  const promise = useCallback(async (p, msgs) => {
    const id = show('loading', msgs.loading)
    try {
      const res = await p
      show('success', typeof msgs.success === 'function' ? msgs.success(res) : msgs.success, undefined, id)
      return res
    } catch (e) {
      show('error', typeof msgs.error === 'function' ? msgs.error(e) : msgs.error, undefined, id)
      throw e
    }
  }, [show])

  const toast = useMemo(() => ({
    loading: (t, d, id) => show('loading', t, d, id),
    success: (t, d, id) => show('success', t, d, id),
    error: (t, d, id) => show('error', t, d, id),
    info: (t, d, id) => show('info', t, d, id),
    promise,
    dismiss: remove,
  }), [show, promise, remove])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
          {toasts.map((t) => (
            <div key={t.id}
              className="pointer-events-auto relative flex items-center gap-3 rounded-full bg-white py-3 pl-5 pr-10 shadow-lg ring-1 ring-black/5">
              <span className={COLORS[t.type].icon}><ToastIcon type={t.type} /></span>
              <div className="min-w-0 leading-tight">
                <p className={`truncate text-sm font-medium ${COLORS[t.type].title}`}>{t.title}</p>
                {t.description && <p className="mt-0.5 truncate text-xs text-stone-500">{t.description}</p>}
              </div>
              <button onClick={() => remove(t.id)} aria-label="Close"
                className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-[10px] text-stone-600 hover:bg-stone-200">
                ✕
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}