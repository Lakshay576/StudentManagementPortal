import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function ConfirmDeleteModal({
  open,
  items = [],          // [{ id, name }]
  entity = 'item',     // 'school', 'video', ...
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !loading && onCancel()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, loading, onCancel])

  if (!open || items.length === 0) return null

  const multiple = items.length > 1
  const plural = `${entity}${items.length > 1 ? 's' : ''}`
  const title = multiple
    ? `Delete ${items.length} ${plural} permanently?`
    : `Delete ${entity} permanently?`

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={() => !loading && onCancel()} className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <button
          onClick={onCancel}
          disabled={loading}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 text-stone-600 hover:bg-stone-200"
        >
          ✕
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        </div>

        <h3 className="mt-4 text-base font-semibold text-stone-900">{title}</h3>

        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          This will permanently delete{' '}
          <span className="font-semibold text-stone-800">
            {multiple ? `${items.length} ${plural}` : items[0].name}
          </span>{' '}
          and all of {multiple ? 'their' : 'its'} data. This action cannot be undone.
        </p>

        {multiple && (
          <ul className="mt-3 max-h-28 space-y-1 overflow-y-auto rounded-xl bg-stone-100 px-4 py-2 text-xs text-stone-600">
            {items.map((i) => <li key={i.id} className="truncate">• {i.name}</li>)}
          </ul>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer rounded-full bg-stone-200/70 px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-200 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? 'Deleting...' : multiple ? `Delete ${items.length} ${plural}` : `Delete ${entity[0].toUpperCase()}${entity.slice(1)}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}