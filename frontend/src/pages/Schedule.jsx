import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { SparklesIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { scheduleApi } from '../api/scheduleApi'

export default function Schedule() {
  const queryClient = useQueryClient()
  
  // Date State
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Compute start of week (Monday)
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
  const weekIso = format(weekStart, 'yyyy-MM-dd')

  // Fetch Week Schedule
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['schedule', 'week', weekIso],
    queryFn: () => scheduleApi.getWeek(weekIso)
  })

  // Generate AI Schedule Mutation
  const generateMutation = useMutation({
    mutationFn: () => scheduleApi.generate(weekIso, 7),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('AI schedule generated successfully! ✨')
    },
    onError: () => toast.error('Failed to generate schedule')
  })

  // Navigation handlers
  const prevWeek = () => setCurrentDate(d => addDays(d, -7))
  const nextWeek = () => setCurrentDate(d => addDays(d, 7))
  const goToday = () => setCurrentDate(new Date())

  // Format week days header
  const weekDays = [...Array(7)].map((_, i) => {
    const d = addDays(weekStart, i)
    return {
      dateObj: d,
      dayName: format(d, 'EEE'),
      dayNum: format(d, 'd'),
      isToday: isSameDay(d, new Date())
    }
  })

  // Slot rendering helper
  const getSlotStyle = (type) => {
    switch(type) {
      case 'break': return 'bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-400'
      case 'exam': return 'bg-rose-500/10 border-l-4 border-rose-500 text-rose-400'
      default: return 'bg-brand/10 border-l-4 border-brand text-slate-200'
    }
  }

  // Combine fetched data with empty days
  const getDaySchedule = (dateStr) => {
    if (!scheduleData) return []
    const day = scheduleData.find(s => s.date === dateStr)
    return day?.time_slots || []
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-surface.card p-4 rounded-2xl border border-white/5 shadow-sm gap-4">
        
        <div className="flex items-center gap-4">
          <button onClick={goToday} className="px-3 py-1.5 bg-surface.elevated rounded-lg text-sm font-medium hover:bg-white/10 transition">
            Today
          </button>
          <div className="flex items-center gap-2 bg-surface rounded-lg p-1 border border-white/5">
            <button onClick={prevWeek} className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="font-semibold text-white min-w-[140px] text-center">
              {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <button onClick={nextWeek} className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button 
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-600/20 font-medium transition-all disabled:opacity-50"
        >
          {generateMutation.isPending ? (
            <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <SparklesIcon className="w-5 h-5 mr-2" />
          )}
          Generate AI Schedule
        </button>

      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-surface.card rounded-2xl border border-white/5 shadow-md flex min-w-[800px]">
        {weekDays.map((day, idx) => {
          const dateStr = format(day.dateObj, 'yyyy-MM-dd')
          const slots = getDaySchedule(dateStr)

          return (
            <div key={dateStr} className={`flex-1 flex flex-col min-w-[150px] border-r border-white/5 last:border-r-0 ${day.isToday ? 'bg-white/[0.02]' : ''}`}>
              
              {/* Day Header */}
              <div className={`p-3 text-center border-b border-white/5 ${day.isToday ? 'border-b-brand' : ''}`}>
                 <div className="text-sm font-medium text-slate-400 uppercase">{day.dayName}</div>
                 <div className={`text-2xl mt-1 ${day.isToday ? 'font-bold text-brand font-black' : 'text-slate-200'}`}>
                   {day.dayNum}
                 </div>
              </div>

              {/* Slots Column */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2 relative">
                {isLoading ? (
                   <div className="animate-pulse space-y-2 mt-4">
                     <div className="h-16 bg-white/5 rounded px-2 relative"><div className="h-full border-l-4 border-slate-700"></div></div>
                   </div>
                ) : slots.length > 0 ? (
                  slots.map((slot, i) => (
                    <div 
                      key={i} 
                      className={`p-2.5 rounded shadow-sm text-sm group cursor-pointer hover:brightness-110 transition-all ${getSlotStyle(slot.slot_type)}`}
                      title={`${format(new Date(slot.start_time), 'h:mm a')} - ${slot.task_title}`}
                    >
                      <div className="text-[10px] uppercase font-bold opacity-70 mb-0.5 flex justify-between items-center">
                        <span className="truncate mr-1">{format(new Date(slot.start_time), 'h:mm')}</span>
                        {slot.slot_type !== 'break' && <ClockIcon className="w-3 h-3 flex-shrink-0" />}
                      </div>
                      <div className="font-semibold leading-snug line-clamp-2">{slot.task_title}</div>
                    </div>
                  ))
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                     <div className="text-center">
                       <CalendarDaysIcon className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                       <span className="text-xs text-slate-500">Free Day</span>
                     </div>
                  </div>
                )}
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}
