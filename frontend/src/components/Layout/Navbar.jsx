import { useLocation } from 'react-router-dom'
import { BellIcon, FireIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { wellbeingApi } from '../../api/wellbeingApi'
import { analyticsApi } from '../../api/analyticsApi'

export default function Navbar() {
  const location = useLocation()
  
  // Format page title from pathname
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1]
    if (!path) return 'Dashboard'
    if (path === 'chat') return 'AI Study Companion'
    return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ')
  }

  // Fetch streak and alerts
  const { data: streakData } = useQuery({
    queryKey: ['streaks'],
    queryFn: analyticsApi.getStreaks,
    staleTime: 5 * 60 * 1000,
  })

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: wellbeingApi.getAlerts,
    staleTime: 5 * 60 * 1000,
  })

  const hasAlert = alertsData?.alert_triggered

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-surface/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
      <h1 className="text-xl font-semibold text-white">
        {getPageTitle()}
      </h1>

      <div className="flex items-center space-x-6">
        {/* Streak Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
          <FireIcon className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-medium text-amber-500">
            {streakData?.current_streak || 0} Day Streak
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
          <BellIcon className="w-6 h-6" />
          {hasAlert && (
            <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-surface rounded-full"></span>
          )}
        </button>
      </div>
    </header>
  )
}
