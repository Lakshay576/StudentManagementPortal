import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardSummary } from "../../../features/dashboardSlice";

/* ---------- helpers ---------- */
const fmtNumber = (n) => (n ?? 0).toLocaleString("en-US");

const fmtBytes = (bytes = 0) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i < 2 ? 0 : 1)} ${units[i]}`;
};

const fmtDuration = (sec = 0) => {
  if (!sec) return "0s";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
};

/* ---------- small components ---------- */
function ChangeBadge({ value = 0 }) {
  const up = value > 0;
  const down = value < 0;
  const style = up
    ? "bg-green-100 text-green-700"
    : down
      ? "bg-red-100 text-red-600"
      : "bg-stone-100 text-stone-500";
  const arrow = up ? "↑" : down ? "↓" : "–";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
      title="vs last month"
    >
      {arrow} {Math.abs(value)}%
    </span>
  );
}

function StatCard({ label, value, change, hint }) {
  return (
    <div className="rounded-2xl bg-[#ffffff] p-4 shadow-sm">
      <p className="text-sm font-semibold tracking-tight text-stone-500">{label}</p>
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold text-stone-900">{value}</p>
        {change !== undefined && <ChangeBadge value={change} />}
        {hint && <span className="text-xs text-stone-400">{hint}</span>}
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl bg-white p-5 shadow-sm">
      <div className="h-3 w-20 rounded bg-stone-200" />
      <div className="mt-6 flex items-end justify-between">
        <div className="h-7 w-24 rounded bg-stone-200" />
        <div className="h-6 w-14 rounded-full bg-stone-200" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry, retrying }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-semibold text-stone-900">
        Couldn't load dashboard
      </h3>
      <p className="mt-2 max-w-xs text-sm text-stone-500">{message}</p>
      <button
        onClick={onRetry}
        disabled={retrying}
        className="mt-5 cursor-pointer rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {retrying ? "Retrying..." : "Retry"}
      </button>
    </div>
  );
}

/* ---------- page ---------- */
export default function Dashboard() {
  const dispatch = useDispatch();
  const { summary, loading, error } = useSelector((s) => s.dashboard);

  const load = useCallback(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const firstLoad = loading && !summary;

  // first load failed, nothing to show
  if (error && !summary) {
    return <ErrorState message={error} onRetry={load} retrying={loading} />;
  }

  const { schools, admins, students, videos } = summary || {};

  const mainStats = summary && [
    { label: "Schools", value: fmtNumber(schools.total), change: schools.change },
    { label: "School Admins", value: fmtNumber(admins.total), change: admins.change },
    { label: "Students", value: fmtNumber(students.total), change: students.change },
    { label: "Videos", value: fmtNumber(videos.total), change: videos.change },
  ];

  const secondaryStats = summary && [
    {
      label: "Active Schools",
      value: fmtNumber(schools.active),
      hint: `${fmtNumber(schools.inactive)} inactive`,
    },
    {
      label: "Active Videos",
      value: fmtNumber(videos.active),
      hint: `of ${fmtNumber(videos.total)}`,
    },
    { label: "Storage Used", value: fmtBytes(videos.totalSize) },
    { label: "Total Video Duration", value: fmtDuration(videos.totalDuration) },
  ];

  return (
    <div>
      {/* toolbar */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-stone-500">
          Overview of your platform. Changes compare this month with last month.
        </p>
        <button
          onClick={load}
          disabled={loading}
          className="cursor-pointer rounded-full bg-stone-200/70 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-200 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* refresh failed but we still have old data */}
      {error && summary && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}. Showing last loaded data.</span>
          <button
            onClick={load}
            disabled={loading}
            className="cursor-pointer font-semibold underline disabled:opacity-60"
          >
            Retry
          </button>
        </div>
      )}

      {/* main KPI cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {firstLoad
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : mainStats?.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* secondary cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {firstLoad
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : secondaryStats?.map((s) => <StatCard key={s.label} {...s} />)}
      </div>
    </div>
  );
}