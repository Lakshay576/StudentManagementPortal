import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchStudents, fetchStudent, deleteStudent, clearCurrentStudent } from '../../../features/studentSlice'
import ConfirmDeleteModal from '../../../components/ConfirmDeleteModal'
import { useToast } from '../../../context/ToastContext'
import StudentModal from './StudentModal'
import StudentViewModal from './StudentViewModal'

const LIMIT = 10

export const STATUS_STYLE = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-600',
  Graduated: 'bg-blue-100 text-blue-700',
  Transferred: 'bg-amber-100 text-amber-700',
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
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  users: 'M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1M9 11a4 4 0 100-8 4 4 0 000 8zM22 19v-1a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  person: 'M12 12a4 4 0 100-8 4 4 0 000 8zM5 20v-1a5 5 0 015-5h4a5 5 0 015 5v1z',
}

const PILL = 'rounded-full bg-stone-200/60 px-4 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-500'

export default function Students() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { list, pagination, total, loading, saving, error } = useSelector((s) => s.students)

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('All')
  const [filters, setFilters] = useState({ search: '', className: '', section: '' })
  const [debounced, setDebounced] = useState(filters)
  const [viewOpen, setViewOpen] = useState(false)
  const [modal, setModal] = useState({ open: false, student: null })
  const [del, setDel] = useState({ open: false, items: [] })

  const params = {
    page, limit: LIMIT, status,
    search: debounced.search.trim() || undefined,
    className: debounced.className.trim() || undefined,
    section: debounced.section.trim() || undefined,
  }

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(filters); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [filters])

  useEffect(() => {
    dispatch(fetchStudents({
      page, limit: LIMIT, status,
      search: debounced.search.trim() || undefined,
      className: debounced.className.trim() || undefined,
      section: debounced.section.trim() || undefined,
    }))
  }, [dispatch, page, status, debounced])

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))

  const closeModal = (saved) => {
    setModal({ open: false, student: null })
    if (saved === true) dispatch(fetchStudents(params))
  }

  const handleView = (id) => {
    dispatch(clearCurrentStudent())
    setViewOpen(true)
    dispatch(fetchStudent(id))
  }
  const closeView = () => { setViewOpen(false); dispatch(clearCurrentStudent()) }

  const askDelete = (students) =>
    setDel({ open: true, items: [].concat(students).map((s) => ({ id: s._id, name: s.name })) })

  const confirmDelete = async () => {
    const items = del.items
    setDel({ open: false, items: [] })
    try {
      await toast.promise(
        Promise.all(items.map((i) => dispatch(deleteStudent(i.id)).unwrap())),
        {
          loading: items.length > 1 ? `Deleting ${items.length} students...` : 'Deleting student...',
          success: items.length > 1 ? `${items.length} students deleted` : 'Student deleted',
          error: (e) => e,
        }
      )
    } catch { /* error toast shown */ }

    if (list.length === items.length && page > 1) setPage((p) => p - 1)
    else dispatch(fetchStudents(params))
  }

  const hasFilter = Object.values(filters).some((v) => v.trim()) || status !== 'All'
  const clearFilters = () => {
    const empty = { search: '', className: '', section: '' }
    setFilters(empty); setDebounced(empty); setStatus('All'); setPage(1)
  }

  return (
    <div>
      <p className="text-sm text-stone-500">Add and manage the students of your school.</p>

      {/* toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex w-full items-center gap-2 rounded-full bg-stone-200/60 px-4 py-2.5 sm:w-64">
          <Icon d={ICONS.search} className="h-4 w-4 text-stone-500" />
          <input value={filters.search} onChange={setFilter('search')} placeholder="Search name, admission no..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-500" />
          {filters.search && (
            <button type="button" onClick={() => setFilters((f) => ({ ...f, search: '' }))} aria-label="Clear search"
              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-500 hover:bg-stone-300/70">
              <Icon d="M6 6l12 12M18 6L6 18" className="h-3 w-3" />
            </button>
          )}
        </div>

        <input value={filters.className} onChange={setFilter('className')} placeholder="Class" className={`${PILL} w-24`} />
        <input value={filters.section} onChange={setFilter('section')} placeholder="Section" className={`${PILL} w-24`} />

        <div className="flex items-center gap-2 rounded-full bg-stone-200/60 px-4 py-2.5 text-sm font-semibold text-stone-800">
          <Icon d={ICONS.filter} />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="cursor-pointer bg-transparent outline-none">
            <option value="All">Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Graduated">Graduated</option>
            <option value="Transferred">Transferred</option>
          </select>
        </div>

        <button onClick={() => setModal({ open: true, student: null })}
          className="ml-auto flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          + Add Student
        </button>
      </div>

      {/* table */}
      <div className="mt-4 overflow-x-auto rounded-3xl bg-stone-200/50 p-1">
        <table className="w-full border-separate border-spacing-0 text-left text-sm lg:min-w-[800px]">
          <thead>
            <tr className="text-xs font-medium text-stone-500">
              {[
                ['Student', ''],
                ['Class', 'hidden md:table-cell'],
                ['Admission / Roll', 'hidden lg:table-cell'],
                ['Academic Year', 'hidden lg:table-cell'],
                ['Status', 'hidden md:table-cell'],
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
                      <Icon d={hasFilter ? ICONS.person : ICONS.users} className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-stone-900">
                      {hasFilter ? 'No Results Found' : 'No Students Yet'}
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-stone-500">
                      {hasFilter
                        ? "We couldn't find anything matching your search. Try adjusting your filters."
                        : "You haven't added any students yet. Get started by adding your first student."}
                    </p>
                    {hasFilter ? (
                      <button onClick={clearFilters}
                        className="mt-5 cursor-pointer rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-100">
                        Clear Filters
                      </button>
                    ) : (
                      <button onClick={() => setModal({ open: true, student: null })}
                        className="mt-5 cursor-pointer rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                        + Add Student
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && list.map((s, i) => (
              <tr key={s._id}>
                <td className="border-t border-stone-200 px-5 py-2">
                  <div className="flex items-center gap-3">
                    {s.userId?.profileImage ? (
                      <img src={s.userId.profileImage} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ${GRADIENTS[i % GRADIENTS.length]}`}>
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 leading-tight">
                      <p className="max-w-[220px] truncate font-semibold text-stone-800">{s.name}</p>
                      <p className="max-w-[220px] truncate text-xs text-stone-500">{s.userId?.email}</p>
                    </div>
                  </div>
                </td>

                <td className="hidden border-t border-stone-200 px-5 py-2 font-semibold text-stone-800 md:table-cell">
                  {s.className}{s.section ? `-${s.section}` : ''}
                </td>

                <td className="hidden border-t border-stone-200 px-5 py-2 lg:table-cell">
                  <p className="font-semibold text-stone-800">{s.admissionNumber}</p>
                  <p className="text-xs text-stone-500">Roll {s.rollNumber || '-'}</p>
                </td>

                <td className="hidden border-t border-stone-200 px-5 py-2 text-stone-600 lg:table-cell">{s.academicYear || '-'}</td>

                <td className="hidden border-t border-stone-200 px-5 py-2 md:table-cell">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status] || 'bg-stone-100 text-stone-600'}`}>
                    {s.status}
                  </span>
                </td>

                <td className="border-t border-stone-200 px-5 py-2">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handleView(s._id)} aria-label="View"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 hover:bg-stone-200">
                      <Icon d={ICONS.eye} />
                    </button>
                    <button onClick={() => setModal({ open: true, student: s })} aria-label="Edit"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 hover:bg-stone-200">
                      <Icon d={ICONS.edit} />
                    </button>
                    <button onClick={() => askDelete(s)} aria-label="Delete"
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
        <span className="text-stone-500">{total} student{total === 1 ? '' : 's'}</span>
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

      <StudentModal open={modal.open} student={modal.student} onClose={closeModal} />
      <StudentViewModal open={viewOpen} onClose={closeView} />
      <ConfirmDeleteModal
        open={del.open}
        items={del.items}
        entity="student"
        loading={saving}
        onConfirm={confirmDelete}
        onCancel={() => setDel({ open: false, items: [] })}
      />
    </div>
  )
}