import { useEffect, useState } from 'react'
import { toDateKey } from '../domain/habitTracking'

export const useLocalDay = () => {
  const [referenceDate, setReferenceDate] = useState(() => new Date())

  useEffect(() => {
    const refresh = () => {
      const now = new Date()
      setReferenceDate(previous => toDateKey(previous) === toDateKey(now) ? previous : now)
    }
    const now = new Date()
    const nextDay = new Date(now)
    nextDay.setHours(24, 0, 0, 0)
    const timeoutId = window.setTimeout(refresh, Math.max(nextDay.getTime() - now.getTime(), 0) + 50)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [referenceDate])

  const getTodayDate = () => {
    const now = new Date()
    if (toDateKey(now) !== toDateKey(referenceDate)) {
      setReferenceDate(now)
      return null
    }
    return now
  }

  return { referenceDate, getTodayDate }
}
