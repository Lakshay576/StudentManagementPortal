import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSchools,
  fetchSchool,
  deleteSchool,
  clearCurrent,
} from "../../../features/schoolSlice";
import SchoolModal from "./SchoolModal";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import SchoolViewModal from "./SchoolViewModal";
import { useToast } from "../../../context/ToastContext";
import AdminModal from "./AdminModal";

const LIMIT = 10;

const STATUS_STYLE = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-red-100 text-red-600",
};

const GRADIENTS = [
  "from-sky-200 to-violet-300",
  "from-cyan-200 to-blue-500",
  "from-emerald-200 to-emerald-600",
  "from-pink-200 to-rose-500",
  "from-violet-300 to-indigo-600",
];

const Icon = ({ d, className = "h-4 w-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.3-4.3",
  filter: "M3 5h18l-7 8v6l-4-2v-4z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  userPlus:
    "M15 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9 11a3 3 0 100-6 3 3 0 000 6zM19 8v6M22 11h-6",
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "-";

export default function Schools() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { list, pagination, loading, loading2, error } = useSelector(
    (s) => s.schools,
  );

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [viewOpen, setViewOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminSchool, setAdminSchool] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const openAdmin = (school) => {
    setAdminSchool(school);
    setAdminOpen(true);
  };
  const current = useSelector((s) => s.schools.current);

  const [del, setDel] = useState({ open: false, items: [] });

  const [modal, setModal] = useState({ open: false, school: null });

  useEffect(() => {
    const value = search.trim();
    const t = setTimeout(
      () => {
        setDebouncedSearch(value);
        setPage(1);
      },
      value ? 400 : 0,
    );
    return () => clearTimeout(t);
  }, [search]);

  const closeModal = (saved) => {
    setModal({ open: false, school: null });
    if (saved === true)
      dispatch(
        fetchSchools({ page, limit: LIMIT, search: debouncedSearch, status }),
      );
  };

  useEffect(() => {
    dispatch(
      fetchSchools({ page, limit: LIMIT, search: debouncedSearch, status }),
    );
  }, [dispatch, page, debouncedSearch, status]);

  // client-side filter on the current page (backend has no search/filter yet)
  const rows = list;

  //   const handleView = async (id) => {
  //   const res = await dispatch(fetchSchool(id))
  //   if (fetchSchool.fulfilled.match(res)) console.log('School details:', res.payload)
  //   else console.log('View failed:', res.payload)
  // }

  const askDelete = (schools) =>
    setDel({
      open: true,
      items: [].concat(schools).map((s) => ({ id: s._id, name: s.name })),
    });

  const confirmDelete = async () => {
    const items = del.items;
    setDel({ open: false, items: [] });
    try {
      await toast.promise(
        Promise.all(items.map((i) => dispatch(deleteSchool(i.id)).unwrap())),
        {
          loading:
            items.length > 1
              ? `Deleting ${items.length} schools...`
              : "Deleting school...",
          success:
            items.length > 1
              ? `${items.length} schools deleted`
              : "School deleted",
          error: (e) => e,
        },
      );
    } catch {
      /* error toast shown */
    }
    dispatch(
      fetchSchools({ page, limit: LIMIT, search: debouncedSearch, status }),
    );
  };

  const handleView = (id) => {
    dispatch(clearCurrent()); // avoids flashing the previous school
    setViewOpen(true);
    dispatch(fetchSchool(id));
  };
  const closeView = () => {
    setViewOpen(false);
    dispatch(clearCurrent());
  };

  const hasFilter = search.trim() !== "" || status !== "All";

  return (
    <div>
      <p className="text-sm text-stone-500">
        Manage and track all registered schools.
      </p>

      {/* toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex w-full items-center gap-2 rounded-full bg-stone-200/60 px-4 py-2.5 sm:w-64">
          <Icon d={ICONS.search} className="h-4 w-4 text-stone-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-500 hover:bg-stone-300/70"
            >
              <Icon d="M6 6l12 12M18 6L6 18" className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-full bg-stone-200/60 px-4 py-2.5 text-sm font-semibold text-stone-800">
          <Icon d={ICONS.filter} />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="cursor-pointer bg-transparent outline-none"
          >
            <option value="All">Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <button
          onClick={() => setModal({ open: true, school: null })}
          className="ml-auto cursor-pointer flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add School
        </button>
      </div>

      {/* table */}
      <div className="mt-4 overflow-x-auto rounded-3xl bg-stone-200/50 p-1">
        <table className="w-full lg:min-w-[800px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-medium text-stone-500">
              {[
                ["School", ""],
                ["Code", "hidden md:table-cell"],
                ["Phone", "hidden lg:table-cell"],
                ["Status", "hidden md:table-cell"],
                ["Created", "hidden lg:table-cell"],
              ].map(([h, cls]) => (
                <th key={h} className={`px-5 py-3 font-medium ${cls}`}>
                  {h}
                </th>
              ))}
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="[&_td]:bg-white [&_td]:border-stone-200 [&>tr:first-child>td:first-child]:rounded-tl-2xl [&>tr:first-child>td:last-child]:rounded-tr-2xl [&>tr:last-child>td:first-child]:rounded-bl-2xl [&>tr:last-child>td:last-child]:rounded-br-2xl [&>tr:first-child>td]:border-t-0">
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-stone-400"
                >
                  Loading...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-14">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-200/70 text-stone-700">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6"
                      >
                        {hasFilter ? (
                          <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM5 20v-1a5 5 0 015-5h4a5 5 0 015 5v1z" />
                        ) : (
                          <path d="M3 10l9-6 9 6M5 10v9h14v-9M9 19v-5h6v5" />
                        )}
                      </svg>
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-stone-900">
                      {hasFilter ? "No Results Found" : "No Schools Yet"}
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-stone-500">
                      {hasFilter
                        ? "We couldn't find anything matching your search. Try adjusting your filters."
                        : "You haven't added any schools yet. Get started by adding your first school."}
                    </p>

                    {hasFilter ? (
                      <button
                        onClick={() => {
                          setSearch("");
                          setDebouncedSearch("");
                          setStatus("All");
                          setPage(1);
                        }}
                        className="mt-5 cursor-pointer rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => setModal({ open: true, school: null })}
                        className="mt-5 cursor-pointer rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        + Add School
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              rows.map((s, i) => (
                <tr key={s._id}>
                  <td className="border-t border-stone-200 px-5 py-2">
                    <div className="flex items-center gap-3">
                      {s.logo ? (
                        <img
                          src={s.logo}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ${GRADIENTS[i % GRADIENTS.length]}`}
                        >
                          {s.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="leading-tight">
                        <p className="font-semibold text-stone-800">{s.name}</p>
                        <p className="text-xs text-stone-500">{s.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="hidden md:table-cell border-t border-stone-200 px-5 py-2 font-semibold text-stone-800">
                    {s.schoolCode}
                  </td>
                  <td className="hidden lg:table-cell border-t border-stone-200 px-5 py-2 text-stone-600">
                    {s.phone}
                  </td>

                  <td className="hidden md:table-cell border-t border-stone-200 px-5 py-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status] || "bg-stone-100 text-stone-600"}`}
                    >
                      {s.status}
                    </span>
                  </td>

                  <td className="hidden lg:table-cell border-t border-stone-200 px-5 py-2 text-stone-500">
                    {fmtDate(s.createdAt)}
                  </td>

                  <td className="border-t border-stone-200 px-5 py-2">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openAdmin(s)}
                        aria-label="Add admin"
                        title="Add admin"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        <Icon d={ICONS.userPlus} />
                      </button>
                      <button
                        onClick={() => handleView(s._id)}
                        aria-label="View"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 hover:bg-stone-200"
                      >
                        <Icon d={ICONS.eye} />
                      </button>
                      <button
                        onClick={() => setModal({ open: true, school: s })}
                        aria-label="Edit"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-200/70 hover:bg-stone-200"
                      >
                        <Icon d={ICONS.edit} />
                      </button>
                      <button
                        onClick={() => askDelete(s)}
                        aria-label="Delete"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                      >
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
      <div className="mt-4 flex items-center justify-end gap-2 text-sm">
        <button
          disabled={!pagination.prev || loading}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-full bg-stone-200/70 px-4 py-2 hover:bg-stone-200 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="px-2 text-stone-500">Page {page}</span>
        <button
          disabled={!pagination.next || loading}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-full bg-stone-200/70 px-4 py-2 hover:bg-stone-200 disabled:opacity-40"
        >
          Next
        </button>
      </div>
      <SchoolModal
        open={modal.open}
        school={modal.school}
        onClose={closeModal}
      />
      <ConfirmDeleteModal
        open={del.open}
        items={del.items}
        entity="school"
        loading={loading2}
        onConfirm={confirmDelete}
        onCancel={() => setDel({ open: false, items: [] })}
      />
      <SchoolViewModal
        open={viewOpen}
        onClose={closeView}
        onAddAdmin={() => openAdmin(current)}
      />
      <AdminModal
        open={adminOpen}
        schoolId={adminSchool?._id}
        schoolName={adminSchool?.name}
        onClose={() => setAdminOpen(false)}
      />
    </div>
  );
}
