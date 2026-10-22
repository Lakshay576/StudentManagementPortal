import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSchoolVideos, fetchSchoolVideo, deleteSchoolVideo, clearCurrentVideo } from '../../../features/videoSlice.js'
import ConfirmDeleteModal from '../../../components/ConfirmDeleteModal.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { fmtBytes, fmtDuration } from '../../../utils/format.js'
import SchoolVideoModal from './SchoolVideoModal.jsx'
import SchoolVideoViewModal from './SchoolVideoViewModal.jsx'

const LIMIT = 10

const STATUS_STYLE = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-600',
}

const GRADIENTS = [
  'from-sky-200 to-violet-300',
  'from-cyan-200 to-blue-500',
  'from-emerald-200 to-emerald-600',
  'from-pink-200 to-rose-500',
  'from-violet-300 to-indigo-600',
]

const Icon = ({ d, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
)

const ICONS = {
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.3-4.3',
  filter: 'M3 5h18l-7 8v6l-4-2v-4z',
  school: 'M3 10l9-6 9 6M5 10v9h14v-9M9 19v-5h6v5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  play: 'M8 5v14l11-7z',
  video: 'M3 6h12a2 2 0 012 2v8a2 2 0 01-2 2H3zM17 10l4-2v8l-4-2',
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'



export default function Videos() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { list, pagination, total, loading, saving, error } = useSelector((s) => s.videos)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [viewOpen, setViewOpen] = useState(false)
  const [modal, setModal] = useState({ open: false, video: null })
  const [del, setDel] = useState({ open: false, items: [] })

  const params = { page, limit: LIMIT, search: debouncedSearch, status }

  useEffect(() => {
    const value = search.trim()
    const t = setTimeout(() => { setDebouncedSearch(value); setPage(1) }, value ? 400 : 0)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    dispatch(fetchSchoolVideos({ page, limit: LIMIT, search: debouncedSearch, status }))
  }, [dispatch, page, debouncedSearch, status])

  const closeModal = (saved) => {
    setModal({ open: false, video: null })
    if (saved === true) dispatch(fetchSchoolVideos(params))
  }

  const handleView = (id) => {
    dispatch(clearCurrentVideo())
    setViewOpen(true)
    dispatch(fetchSchoolVideo(id))
  }
  const closeView = () => {
    setViewOpen(false)
    dispatch(clearCurrentVideo())
  }

  const askDelete = (videos) =>
    setDel({ open: true, items: [].concat(videos).map((v) => ({ id: v._id, name: v.title })) })

  const confirmDelete = async () => {
    const items = del.items
    setDel({ open: false, items: [] })
    try {
      await toast.promise(
        Promise.all(items.map((i) => dispatch(deleteSchoolVideo(i.id)).unwrap())),
        {
          loading: items.length > 1 ? `Deleting ${items.length} videos...` : 'Deleting video...',
          success: items.length > 1 ? `${items.length} videos deleted` : 'Video deleted',
          error: (e) => e,
        }
      )
    } catch { /* error toast shown */ }

    // last row on a later page deleted -> go back one page (effect refetches)
    if (list.length === items.length && page > 1) setPage((p) => p - 1)
    else dispatch(fetchSchoolVideos(params))
  }

  const hasFilter = search.trim() !== '' || status !== 'All'
  const clearFilters = () => {
    setSearch(''); setDebouncedSearch(''); setStatus('All'); setPage(1)
  }

  return (
    <div>
      <p className="text-sm text-stone-500">Upload and manage videos of your school.</p>

      {/* toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex w-full items-center gap-2 rounded-full bg-stone-200/60 px-4 py-2.5 sm:w-64">
          <Icon d={ICONS.search} className="h-4 w-4 text-stone-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-500" />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search"
              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-500 hover:bg-stone-300/70">
              <Icon d="M6 6l12 12M18 6L6 18" className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-full bg-stone-200/60 px-4 py-2.5 text-sm font-semibold text-stone-800">
          <Icon d={ICONS.filter} />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="cursor-pointer bg-transparent outline-none">
            <option value="All">Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <button onClick={() => setModal({ open: true, video: null })}
          className="ml-auto flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          + Add Video
        </button>
      </div>

      {/* table */}
      <div className="mt-4 overflow-x-auto rounded-3xl bg-stone-200/50 p-1">
        <table className="w-full border-separate border-spacing-0 text-left text-sm lg:min-w-[800px]">
          <thead>
            <tr className="text-xs font-medium text-stone-500">
              {[
                ['Video', ''],
                // ['School', 'hidden md:table-cell'],
                ['Duration / Size', 'hidden md:table-cell'],
                ['Status', 'hidden md:table-cell'],
                ['Uploaded', 'hidden lg:table-cell'],
              ].map(([h, cls]) => (
                <th key={h} className={`px-5 py-3 font-medium ${cls}`}>{h}</th>
              ))}
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="[&_td]:bg-white [&_td]:border-stone-200 [&>tr:first-child>td:first-child]:rounded-tl-2xl [&>tr:first-child>td:last-child]:rounded-tr-2xl [&>tr:last-child>td:first-child]:rounded-bl-2xl [&>tr:last-child>td:last-child]:rounded-br-2xl [&>tr:first-child>td]:border-t-0">
            {loading && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-stone-400">Loading...</td></tr>
            )}

            {!loading && error && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-red-600">{error}</td></tr>
            )}

            {!loading && !error && list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-14">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-200/70 text-stone-700">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                        {hasFilter
                          ? <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM5 20v-1a5 5 0 015-5h4a5 5 0 015 5v1z" />
                          : <path d={ICONS.video} />}
                      </svg>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-stone-900">
                      {hasFilter ? 'No Results Found' : 'No Videos Yet'}
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-stone-500">
                      {hasFilter
                        ? "We couldn't find anything matching your search. Try adjusting your filters."
                        : "You haven't uploaded any videos yet. Get started by uploading your first video."}
                    </p>
                    {hasFilter ? (
                      <button onClick={clearFilters}
                        className="mt-5 cursor-pointer rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-100">
                        Clear Filters
                      </button>
                    ) : (
                      <button onClick={() => setModal({ open: true, video: null })}
                        className="mt-5 cursor-pointer rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                        + Add Video
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && list.map((v, i) => (
              <tr key={v._id}>
                <td className="border-t border-stone-200 px-5 py-2">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white ${GRADIENTS[i % GRADIENTS.length]}`}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d={ICONS.play} /></svg>
                    </div>
                    <div className="min-w-0 leading-tight">
                      <p className="max-w-[220px] truncate font-semibold text-stone-800">{v.title}</p>
                      <p className="text-xs text-stone-500">{v.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                </td>

                {/* <td className="hidden border-t border-stone-200 px-5 py-2 md:table-cell">
                  <p className="font-semibold text-stone-800">{v.schoolId?.name || '-'}</p>
                  <p className="text-xs text-stone-500">{v.schoolId?.schoolCode}</p>
                </td> */}

                <td className="hidden border-t border-stone-200 px-5 py-2 md:table-cell">
                  <p className="font-semibold text-stone-800">{fmtDuration(v.duration)}</p>
                  <p className="text-xs text-stone-500">{fmtBytes(v.size)}</p>
                </td>

                <td className="hidden border-t border-stone-200 px-5 py-2 md:table-cell">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[v.status] || 'bg-stone-100 text-stone-600'}`}>
                    {v.status}
                  </span>
                </td>

                <td className="hidden border-t border-stone-200 px-5 py-2 text-stone-500 lg:table-cell">{fmtDate(v.createdAt)}</td>

                <td className="border-t border-stone-200 px-5 py-2">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handleView(v._id)} aria-label="View"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 hover:bg-stone-200">
                      <Icon d={ICONS.eye} />
                    </button>
                    <button onClick={() => setModal({ open: true, video: v })} aria-label="Edit"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 hover:bg-stone-200">
                      <Icon d={ICONS.edit} />
                    </button>
                    <button onClick={() => askDelete(v)} aria-label="Delete"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200">
                      <Icon d={ICONS.trash} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="mt-4 flex items-center justify-between gap-2 text-sm">
        <span className="text-stone-500">{total} video{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button disabled={!pagination.prev || loading} onClick={() => setPage((p) => p - 1)}
            className="cursor-pointer rounded-full bg-stone-200/70 px-4 py-2 hover:bg-stone-200 disabled:cursor-default disabled:opacity-40">
            Prev
          </button>
          <span className="px-2 text-stone-500">Page {page}</span>
          <button disabled={!pagination.next || loading} onClick={() => setPage((p) => p + 1)}
            className="cursor-pointer rounded-full bg-stone-200/70 px-4 py-2 hover:bg-stone-200 disabled:cursor-default disabled:opacity-40">
            Next
          </button>
        </div>
      </div>

      <SchoolVideoModal open={modal.open} video={modal.video} onClose={closeModal} />
      <SchoolVideoViewModal open={viewOpen} onClose={closeView} />
      <ConfirmDeleteModal
        open={del.open}
        items={del.items}
        entity="video"
        loading={saving}
        onConfirm={confirmDelete}
        onCancel={() => setDel({ open: false, items: [] })}
      />
    </div>
  )
}