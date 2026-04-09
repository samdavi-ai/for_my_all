import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import {
  HomeIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  ClockIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Tasks', path: '/tasks', icon: ClipboardDocumentCheckIcon },
  { name: 'Schedule', path: '/schedule', icon: CalendarDaysIcon },
  { name: 'Focus Timer', path: '/focus', icon: ClockIcon },
  { name: 'Wellbeing', path: '/wellbeing', icon: HeartIcon },
  { name: 'AI Chat', path: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Analytics', path: '/analytics', icon: ChartBarIcon },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()

  return (
    <div 
      className={`h-screen bg-surface flex flex-col border-r border-white/10 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header & Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <div className={`flex items-center overflow-hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
          <div className="w-8 h-8 rounded bg-brand flex items-center justify-center font-bold text-white mr-3">
            SC
          </div>
          <span className="font-semibold text-lg text-white whitespace-nowrap">Study Companion</span>
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5 absolute left-7" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center px-3 py-2.5 rounded-lg group transition-all duration-200
              ${isActive 
                ? 'bg-brand/10 text-brand border-l-4 border-brand' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 border-l-4 border-transparent'
              }
            `}
            title={!sidebarOpen ? item.name : ""}
          >
            <item.icon className={`w-6 h-6 flex-shrink-0 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
            {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section (Settings & User) */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center px-3 py-2.5 rounded-lg group transition-all duration-200
              ${isActive 
                ? 'bg-brand/10 text-brand border-l-4 border-brand' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 border-l-4 border-transparent'
              }
            `}
            title={!sidebarOpen ? "Settings" : ""}
        >
          <Cog6ToothIcon className={`w-6 h-6 flex-shrink-0 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
          {sidebarOpen && <span className="font-medium">Settings</span>}
        </NavLink>
        
        <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2.5 rounded-lg group transition-all duration-200 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border-l-4 border-transparent"
            title={!sidebarOpen ? "Logout" : ""}
        >
          <ArrowLeftOnRectangleIcon className={`w-6 h-6 flex-shrink-0 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
          {sidebarOpen && <span className="font-medium">Logout</span>}
        </button>

        {sidebarOpen && user && (
          <div className="mt-4 flex items-center px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand to-purple-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
