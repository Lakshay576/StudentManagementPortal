export const fmtBytes = (b = 0) => {
  if (b < 1024) return `${b} B`
  const u = ['KB', 'MB', 'GB']
  let i = -1
  do { b /= 1024; i++ } while (b >= 1024 && i < u.length - 1)
  return `${b.toFixed(1)} ${u[i]}`
}

export const fmtSpeed = (bps = 0) => `${fmtBytes(bps)}/s`

export const fmtEta = (sec = 0) => {
  if (!sec || !isFinite(sec)) return '--'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60), s = sec % 60
  return m < 60 ? `${m}m ${s}s` : `${Math.floor(m / 60)}h ${m % 60}m`
}

export const fmtDuration = (sec = 0) => {
  if (!sec) return '-'
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60)
  const p = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`
}