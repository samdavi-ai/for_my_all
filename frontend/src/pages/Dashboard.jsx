import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  HeartIcon, 
  FireIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format } from 'date-fns'

import TaskCard from '../components/TaskCard'
import { analyticsApi } from '../api/analyticsApi'
import { scheduleApi } from '../api/scheduleApi'
import { tasksApi } from '../api/tasksApi'
import { wellbeingApi } from '../api/wellbeingApi'

export default function Dashboard() {
  const todayIso = new Date().toISOString().split('T')[0]

  const { data: dashboard, isLoading: isLoadingDash } = useQuery({
    queryKey: ['dashboard'], queryFn: analyticsApi.getDashboard
  })

  const { data: schedule, isLoading: isLoadingSched } = useQuery({
    queryKey: ['schedule', todayIso], queryFn: () => scheduleApi.getWeek(todayIso).then(res => res.find(s => s.date === todayIso))
  })

  const { data: todayTasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks-today'], queryFn: tasksApi.getToday
  })

  const { data: moodHistory } = useQuery({
    queryKey: ['mood-history', 7], queryFn: () => wellbeingApi.getHistory(7)
  })

  // Format charts data
  const moodChartData = moodHistory ? [...moodHistory].reverse().map(m => ({
    date: format(new Date(m.timestamp), 'EEE'),
    mood: m.mood_score,
    stress: m.stress_level
  })) : []

  // Mock weekly study hours for the chart, ideally this comes from backend but we'll use a placeholder structure based on spec
  const weeklyHoursData = [
    { day: 'Mon', hours: 2 }, { day: 'Tue', hours: 3.5 }, { day: 'Wed', hours: 1 }, 
    { day: 'Thu', hours: Math.max(1, (dashboard?.study_hours_week || 3) - 6.5) }, 
    { day: 'Fri', hours: 0 }, { day: 'Sat', hours: 0 }, { day: 'Sun', hours: 0 }
  ]
  const todayDay = format(new Date(), 'EEE')

  // Stats cards data
  const statCards = [
    { title: 'Tasks Completed', value: dashboard?.tasks_completed_week || 0, subtitle: 'This week', icon: CheckCircleIcon, color: 'text-emerald-400' },
    { title: 'Study Hours', value: dashboard?.study_hours_week || 0, subtitle: 'This week', icon: ClockIcon, color: 'text-brand-light' },
    { title: 'Avg Stress', value: dashboard?.avg_stress_week > 0 ? `${dashboard.avg_stress_week}/10` : '--', subtitle: 'Recent average', icon: HeartIcon, 
      color: (dashboard?.avg_stress_week > 6) ? 'text-rose-400' : (dashboard?.avg_stress_week > 4) ? 'text-amber-400' : 'text-emerald-400' },
    { title: 'Study Streak', value: `${dashboard?.streak_days || 0} Days`, subtitle: 'Current streak', icon: FireIcon, color: 'text-amber-500' },
  ]

  return (
    <div className="space-y-6">
      
      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
           <div key={i} className="bg-surface.card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all flex items-start justify-between shadow-xl shadow-black/20">
             <div>
               <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
               <h3 className={`text-2xl font-bold mt-1 ${stat.color}`}>{isLoadingDash ? '--' : stat.value}</h3>
               <p className="text-slate-500 text-xs mt-1">{stat.subtitle}</p>
             </div>
             <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
               <stat.icon className="w-6 h-6" />
             </div>
           </div>
        ))}
      </div>

      {/* Row 2: Schedule & Tasks Priority Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Today's Schedule (60%) */}
        <div className="lg:col-span-3 bg-surface.card rounded-2xl border border-white/5 p-6 shadow-md flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Today's Schedule</h2>
            <Link to="/schedule" className="text-sm text-brand hover:text-brand.light flex items-center">
              Full week <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            {isLoadingSched ? (
               <div className="animate-pulse space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg"></div>)}
               </div>
            ) : schedule?.time_slots?.length > 0 ? (
               <div className="relative border-l-2 border-white/10 ml-3 space-y-6 pb-2">
                 {schedule.time_slots.map((slot, i) => {
                   const start = format(new Date(slot.start_time), 'h:mm a')
                   const end = format(new Date(slot.end_time), 'h:mm a')
                   const isBreak = slot.slot_type === 'break'
                   
                   return (
                     <div key={i} className="relative pl-6">
                       {/* Timeline dot */}
                       <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-surface.card ${isBreak ? 'bg-emerald-500' : 'bg-brand'}`}></div>
                       
                       <div className={`p-4 rounded-xl border-l-4 shadow-sm ${
                         isBreak ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-brand/10 border-brand text-slate-200'
                       }`}>
                          <div className="text-xs opacity-70 mb-1">{start} — {end}</div>
                          <div className="font-semibold">{slot.task_title}</div>
                       </div>
                     </div>
                   )
                 })}
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-center">
                 <CalendarDaysIcon className="w-16 h-16 text-slate-600 mb-3" />
                 <p className="text-slate-300 font-medium">No schedule for today</p>
                 <Link to="/schedule" className="mt-3 px-4 py-2 bg-brand/20 text-brand rounded-lg text-sm font-medium hover:bg-brand/30 transition-colors">
                   Generate AI Schedule
                 </Link>
               </div>
            )}
          </div>
        </div>

        {/* Priority Tasks (40%) */}
        <div className="lg:col-span-2 bg-surface.card rounded-2xl border border-white/5 p-6 shadow-md flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-white mr-2">Priority Tasks</h2>
              <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full font-medium">AI Ranked</span>
            </div>
            <Link to="/tasks" className="text-sm text-slate-400 hover:text-white">View all</Link>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
             {isLoadingTasks ? (
               <div className="animate-pulse space-y-3">
                 {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-lg"></div>)}
               </div>
             ) : todayTasks?.length > 0 ? (
               todayTasks.map(task => (
                 <TaskCard key={task.id} task={task} compact />
               ))
             ) : (
               <div className="text-center py-10 text-slate-500 text-sm">
                 <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                 No pending tasks!<br/>You're all caught up.
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Weekly Study Hours */}
        <div className="bg-surface.card rounded-2xl border border-white/5 p-6 shadow-md">
           <h2 className="text-lg font-semibold text-white mb-6">Weekly Study Hours</h2>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={weeklyHoursData}>
                 <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip 
                   cursor={{fill: '#334155', opacity: 0.2}} 
                   contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                 />
                 <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                   {weeklyHoursData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.day === todayDay ? '#2563EB' : '#334155'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Mood/Stress Trend */}
        <div className="bg-surface.card rounded-2xl border border-white/5 p-6 shadow-md">
           <h2 className="text-lg font-semibold text-white mb-6">Mood & Stress Trend</h2>
           <div className="h-64">
           {moodChartData.length > 1 ? (
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={moodChartData}>
                 <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis domain={[1, 10]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                 />
                 <Line type="monotone" name="Mood" dataKey="mood" stroke="#2563EB" strokeWidth={3} dot={{r: 4}} />
                 <Line type="monotone" name="Stress" dataKey="stress" stroke="#E11D48" strokeWidth={3} dot={{r: 4}} />
               </LineChart>
             </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Log your mood for a few days to see trends!
              </div>
            )}
           </div>
        </div>
      </div>

    </div>
  )
}
