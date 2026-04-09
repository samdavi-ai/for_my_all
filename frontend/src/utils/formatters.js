import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const formatDate = (dateString, fmt = 'MMM d, yyyy') => {
  if (!dateString) return ''
  try {
    return format(parseISO(dateString), fmt)
  } catch (e) {
    return dateString
  }
}

export const formatRelativeTime = (dateString) => {
  if (!dateString) return ''
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch (e) {
    return dateString
  }
}

export const formatDuration = (mins) => {
  if (!mins) return '0h 0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export const formatPercentage = (value) => {
  if (value === undefined || value === null) return '0%'
  return `${Number(value).toFixed(1)}%`
}
