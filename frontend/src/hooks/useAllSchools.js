import { useEffect, useState } from 'react'
import { getSchoolsService } from '../APIs/schoolServices'

export default function useAllSchools(enabled = true, search = '') {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let alive = true // ignore stale responses
    const q = search.trim()
    setLoading(true)

    const t = setTimeout(() => {
      getSchoolsService({ page: 1, limit: 20, search: q || undefined })
        .then((r) => alive && setSchools(r.data))
        .catch(() => {})
        .finally(() => alive && setLoading(false))
    }, q ? 400 : 0) // debounce only while typing

    return () => { alive = false; clearTimeout(t) }
  }, [enabled, search])

  return { schools, loading }
}