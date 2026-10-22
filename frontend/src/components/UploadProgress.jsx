import { useSelector } from 'react-redux'
import { fmtBytes, fmtSpeed, fmtEta } from '../utils/format'

export default function UploadProgress({ onCancel }) {
  const { percent, loaded, total, speed, eta } = useSelector((s) => s.videos.progress)

  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-stone-800">
          {percent < 100 ? 'Uploading...' : 'Processing...'}
        </span>
        <span className="font-semibold text-blue-600">{percent}%</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
        <span>{fmtBytes(loaded)} / {fmtBytes(total)}</span>
        <span>{fmtSpeed(speed)}</span>
        <span>{fmtEta(eta)} left</span>
      </div>

      <button type="button" onClick={onCancel}
        className="mt-3 cursor-pointer rounded-full bg-stone-200/70 px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200">
        Cancel upload
      </button>
    </div>
  )
}