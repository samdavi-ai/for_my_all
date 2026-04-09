import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlayIcon, PauseIcon, StopIcon, FlagIcon } from '@heroicons/react/24/solid'
import { SparklesIcon, FireIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { tasksApi } from '../../api/tasksApi'
import { focusApi } from '../../api/focusApi'
import { formatDuration } from '../../utils/formatters'

export default function FocusTimer() {
  const queryClient = useQueryClient()
  
  // Timer States: 'idle' | 'running' | 'paused' | 'break' | 'rating'
  const [timerState, setTimerState] = useState('idle')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [currentDuration, setCurrentDuration] = useState(25 * 60)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [activeSessionId, setActiveSessionId] = useState(null)
  
  // Rating Modal State
  const [ratingData, setRatingData] = useState({ focusScore: 8, notes: '', distractionCount: 0 })

  // Audio ref
  const chimeRef = useRef(null)
  useEffect(() => {
    chimeRef.current = new Audio('https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3')
  }, [])

  // Fetch pending tasks for dropdown
  const { data: tasks } = useQuery({
    queryKey: ['tasks', 'pending'],
    queryFn: () => tasksApi.getAll({ status: 'pending' })
  })

  // Fetch today's stats for sidebar
  const { data: stats } = useQuery({
    queryKey: ['focus-stats'],
    queryFn: focusApi.getStats
  })

  // Fetch past sessions
  const { data: sessions } = useQuery({
    queryKey: ['focus-sessions', 1],
    queryFn: () => focusApi.getSessions(1)
  })

  // Mutations
  const startMutation = useMutation({
    mutationFn: focusApi.startSession,
    onSuccess: (data) => {
      setActiveSessionId(data.id)
      setTimerState('running')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to start session')
  })

  const endMutation = useMutation({
    mutationFn: focusApi.endSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-stats'] })
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }) // updates study hours
      toast.success('Session saved!')
      resetTimer()
    },
    onError: () => toast.error('Failed to save session')
  })

  const breakMutation = useMutation({
    mutationFn: () => focusApi.logBreak(activeSessionId)
  })

  // Timer Tick Logic
  useEffect(() => {
    let interval = null
    if (timerState === 'running' || timerState === 'break') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timerState])

  const handleTimerComplete = () => {
    // Play sound
    chimeRef.current?.play().catch(() => console.log('Audio play failed'))
    
    if (timerState === 'running') {
      // Auto switch to break
      toast.success('Focus time complete! Take a short break.')
      setTimeLeft(5 * 60)
      setCurrentDuration(5 * 60)
      setTimerState('break')
    } else if (timerState === 'break') {
      toast('Break is over! Ready to focus?', { icon: '🔔' })
      setTimerState('paused') // Wait for user to resume work
    }
  }

  const resetTimer = () => {
    setTimerState('idle')
    setTimeLeft(25 * 60)
    setCurrentDuration(25 * 60)
    setActiveSessionId(null)
    setSelectedTaskId('')
    setRatingData({ focusScore: 8, notes: '', distractionCount: 0 })
  }

  const handleStart = () => {
    if (timerState === 'idle') {
      startMutation.mutate({ task_id: selectedTaskId || null, planned_duration_mins: Math.floor(currentDuration / 60) })
    } else {
      setTimerState('running')
    }
  }

  const handlePause = () => setTimerState('paused')
  
  const handleTakeBreak = () => {
    breakMutation.mutate()
    setTimeLeft(5 * 60)
    setCurrentDuration(5 * 60)
    setTimerState('break')
  }

  const handleEndSession = () => {
    setTimerState('rating') // Open modal
  }

  const submitRating = () => {
    endMutation.mutate({
      session_id: activeSessionId,
      focus_score: ratingData.focusScore,
      notes: ratingData.notes,
      distraction_count: ratingData.distractionCount
    })
  }

  // SVG Circle Calculations
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (timeLeft / currentDuration) * circumference
  
  // Time formatting
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  // Colors
  const isBreak = timerState === 'break'
  const ringColor = isBreak ? 'text-emerald-500' : 'text-brand'
  const bgColor = isBreak ? 'bg-emerald-500/10' : 'bg-brand/10'

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Timer Section */}
      <div className="flex-1 bg-surface.card rounded-2xl border border-white/5 flex flex-col items-center justify-center p-8 relative shadow-lg overflow-y-auto no-scrollbar">
        
        {/* Preset controls (only visible when idle) */}
        {timerState === 'idle' && (
          <div className="absolute top-8 w-full flex justify-center gap-2">
            {[15, 25, 45, 60].map(m => (
              <button 
                key={m} 
                onClick={() => { setTimeLeft(m*60); setCurrentDuration(m*60); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${currentDuration === m*60 ? 'bg-white text-surface border-white' : 'bg-transparent text-slate-400 border-white/20 hover:text-white'}`}
              >
                {m}m
              </button>
            ))}
          </div>
        )}

        {/* Circular Timer UI */}
        <div className="relative flex items-center justify-center mb-8 mt-12">
           <svg className="transform -rotate-90 w-[300px] h-[300px]">
             {/* Background circle */}
             <circle cx="150" cy="150" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-surface.elevated" />
             {/* Progress circle */}
             <circle 
               cx="150" cy="150" r={radius} 
               stroke="currentColor" strokeWidth="12" fill="transparent" 
               strokeDasharray={circumference}
               strokeDashoffset={strokeDashoffset}
               strokeLinecap="round"
               className={`${ringColor} transition-all duration-1000 ease-linear`} 
             />
           </svg>
           
           <div className="absolute flex flex-col items-center">
             <span className="text-6xl font-bold text-white tabular-nums tracking-tight">
               {timeString}
             </span>
             <span className={`text-sm font-medium mt-2 uppercase tracking-widest ${isBreak ? 'text-emerald-400' : 'text-brand-light'}`}>
               {timerState === 'idle' ? 'Ready' : isBreak ? 'Break Time' : timerState === 'paused' ? 'Paused' : 'Focus Mode'}
             </span>
           </div>
        </div>

        {/* Task Selection */}
        {timerState === 'idle' ? (
          <div className="w-full max-w-xs mb-8">
            <select 
              value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}
              className="w-full bg-surface.elevated/30 border border-white/10 rounded-xl px-4 py-3 text-slate-300 outline-none focus:ring-1 focus:ring-brand text-center appearance-none"
            >
              <option value="">No specific task</option>
              {tasks?.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        ) : (
          <div className="mb-8 text-center text-slate-300">
             {selectedTaskId ? tasks?.find(t => t.id === selectedTaskId)?.title : 'General Study Session'}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
           {timerState === 'idle' ? (
              <button onClick={handleStart} disabled={startMutation.isPending} className="w-20 h-20 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brand.dark transition-transform hover:scale-105 shadow-xl shadow-brand/20">
                <PlayIcon className="w-10 h-10 ml-1" />
              </button>
           ) : (
             <>
               {timerState === 'running' ? (
                 <button onClick={handlePause} className="w-16 h-16 bg-surface.elevated text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-transform hover:scale-105">
                   <PauseIcon className="w-8 h-8" />
                 </button>
               ) : (
                 <button onClick={handleStart} className="w-16 h-16 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brand.dark transition-transform hover:scale-105 shadow-lg shadow-brand/20">
                   <PlayIcon className="w-8 h-8 ml-1" />
                 </button>
               )}
               
               <button onClick={handleEndSession} className="w-16 h-16 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center hover:bg-rose-500/20 transition-transform hover:scale-105">
                 <StopIcon className="w-8 h-8" />
               </button>

               {(timerState === 'running' || timerState === 'paused') && !isBreak && (
                 <button onClick={handleTakeBreak} className="w-16 h-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-transform hover:scale-105" title="Take a Break">
                   <FlagIcon className="w-7 h-7" />
                 </button>
               )}
             </>
           )}
        </div>

      </div>

      {/* Sidebar Section */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        
        {/* Today's Overview */}
        <div className="bg-surface.card rounded-2xl border border-white/5 p-5 shadow-md">
           <h3 className="text-white font-semibold flex items-center mb-4">
             <SparklesIcon className="w-5 h-5 mr-2 text-brand" /> Today's Focus
           </h3>
           
           <div className="grid grid-cols-2 gap-3">
             <div className="bg-surface p-3 rounded-xl border border-white/5 text-center">
               <div className="text-2xl font-bold text-white mb-1">{formatDuration(stats?.total_mins || 0)}</div>
               <div className="text-xs text-slate-400">Total Time</div>
             </div>
             <div className="bg-surface p-3 rounded-xl border border-white/5 text-center">
               <div className="text-2xl font-bold text-white mb-1">{stats?.avg_focus || '0.0'}</div>
               <div className="text-xs text-slate-400">Avg Score</div>
             </div>
             <div className="col-span-2 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center justify-between">
               <div className="flex items-center text-amber-500">
                 <FireIcon className="w-5 h-5 mr-1.5" /> 
                 <span className="font-medium text-sm">Study Streak</span>
               </div>
               <div className="font-bold text-amber-400">{stats?.total_sessions || 0} Sessions today</div>
             </div>
           </div>
        </div>

        {/* Recent Sessions */}
        <div className="flex-1 bg-surface.card rounded-2xl border border-white/5 p-5 shadow-md overflow-hidden flex flex-col">
           <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">Recent Sessions</h3>
           <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              {sessions?.length > 0 ? sessions.map(s => (
                <div key={s.id} className="bg-surface p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-slate-200">
                      {s.task_id ? tasks?.find(t => t.id === s.task_id)?.title || 'Task' : 'General Session'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{s.duration_mins}m</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand flex items-center">⭐ {s.focus_score}/10</span>
                    {s.distraction_count > 0 && <span className="text-rose-400">{s.distraction_count} dists</span>}
                  </div>
                </div>
              )) : (
                <div className="text-center text-slate-500 text-sm py-4">No sessions yet today.</div>
              )}
           </div>
        </div>

      </div>

      {/* Rating Modal */}
      {timerState === 'rating' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm transition-opacity">
          <div className="bg-surface.card rounded-2xl w-full max-w-md border border-white/10 shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Session Complete! 🎉</h2>
            <p className="text-slate-400 text-sm text-center mb-6">How was your focus during this session?</p>
            
            <div className="space-y-6">
               
               <div>
                 <div className="flex justify-between text-white font-medium mb-3">
                   <span>Focus Score</span>
                   <span className="text-brand text-xl">{ratingData.focusScore}/10</span>
                 </div>
                 <input 
                   type="range" min="1" max="10" 
                   value={ratingData.focusScore} onChange={e => setRatingData({...ratingData, focusScore: parseInt(e.target.value)})}
                   className="w-full h-2 bg-surface.elevated rounded-lg appearance-none cursor-pointer accent-brand"
                 />
                 <div className="flex justify-between text-xs text-slate-500 mt-2">
                   <span>Distracted</span>
                   <span>Locked In</span>
                 </div>
               </div>

               <div>
                 <label className="block text-slate-300 text-sm mb-2">Did you get distracted?</label>
                 <div className="flex items-center gap-4 border border-white/10 bg-surface.elevated/30 rounded-xl p-2 w-max">
                   <button onClick={() => setRatingData(p => ({...p, distractionCount: Math.max(0, p.distractionCount-1)}))} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 text-slate-300">-</button>
                   <span className="text-white font-medium w-4 text-center">{ratingData.distractionCount}</span>
                   <button onClick={() => setRatingData(p => ({...p, distractionCount: p.distractionCount+1}))} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 text-slate-300">+</button>
                 </div>
               </div>

               <div>
                 <label className="block text-slate-300 text-sm mb-2">Session Notes (Optional)</label>
                 <textarea 
                   rows="2"
                   value={ratingData.notes} onChange={e => setRatingData({...ratingData, notes: e.target.value})}
                   className="w-full bg-surface.elevated/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:ring-1 focus:ring-brand resize-none"
                   placeholder="What did you accomplish?"
                 />
               </div>

               <button 
                 onClick={submitRating}
                 disabled={endMutation.isPending}
                 className="w-full py-3 bg-brand hover:bg-brand.dark text-white rounded-xl shadow-lg shadow-brand/20 font-medium transition-colors"
               >
                 {endMutation.isPending ? 'Saving...' : 'Save Session Stats'}
               </button>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
