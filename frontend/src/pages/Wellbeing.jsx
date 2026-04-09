import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MOOD_EMOJIS } from '../utils/constants'
import { wellbeingApi } from '../api/wellbeingApi'
import { toast } from 'react-hot-toast'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts'
import { format } from 'date-fns'
import { ExclamationTriangleIcon, HeartIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const TAG_OPTIONS = ['Exams', 'Workload', 'Sleep', 'Social', 'Health', 'Other']

export default function Wellbeing() {
  const queryClient = useQueryClient()
  
  // Local state for logging
  const [moodScore, setMoodScore] = useState(5)
  const [stressLevel, setStressLevel] = useState(5)
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState([])

  // Data fetching
  const { data: history = [] } = useQuery({
    queryKey: ['mood-history', 30],
    queryFn: () => wellbeingApi.getHistory(30)
  })

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: wellbeingApi.getAlerts
  })

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations'],
    queryFn: wellbeingApi.getRecommendations
  })

  const { data: breakSuggestion, refetch: refreshBreak } = useQuery({
    queryKey: ['break-suggestion'],
    queryFn: wellbeingApi.getBreakSuggestion,
    enabled: false // Only manual fetch
  })

  // Check if today is logged
  const todayStr = new Date().toISOString().split('T')[0]
  const isTodayLogged = history.length > 0 && history[0].timestamp.startsWith(todayStr)

  const logMutation = useMutation({
    mutationFn: wellbeingApi.logMood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-history'] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Mood logged! Thanks for checking in. 💙')
    },
    onError: () => toast.error('Failed to log mood')
  })

  const handleLog = () => {
    logMutation.mutate({
      mood_score: moodScore,
      stress_level: stressLevel,
      notes: notes,
      trigger_tags: selectedTags
    })
  }

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // Chart data prep
  const chartData = [...history].reverse().map(entry => ({
    date: format(new Date(entry.timestamp), 'MMM d'),
    mood: entry.mood_score,
    stress: entry.stress_level
  }))

  const getStressColor = (level) => {
    if (level <= 3) return 'text-emerald-400'
    if (level <= 6) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getStressLabel = (level) => {
    if (level <= 3) return 'Relaxed'
    if (level <= 6) return 'Manageable'
    if (level <= 8) return 'High Stress'
    return 'Overwhelmed'
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Alert Banner */}
      {alerts?.alert_triggered && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-pulse-slow">
          <div className="p-2 bg-amber-500/20 rounded-full text-amber-500 mt-1">
            <ExclamationTriangleIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-amber-400 font-semibold text-lg">Stress Alert</h3>
            <p className="text-amber-200/80 text-sm mt-1">Your stress levels have been consistently high recently (Avg: {alerts.current_avg}). Please consider these suggestions:</p>
            <ul className="list-disc list-inside text-sm text-amber-100/70 mt-2 space-y-1">
              {alerts.recommendations?.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Daily Check-in Card (Conditional or forced for demo) */}
      {!isTodayLogged && (
        <div className="bg-surface-card rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden">
          {/* Subtle gradient bg */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-brand/10 blur-3xl rounded-full"></div>
          
          <h2 className="text-xl font-bold text-white mb-6">How are you feeling today?</h2>
          
          <div className="space-y-8">
            {/* Mood Emojis */}
            <div>
              <label className="block text-sm text-slate-400 mb-4">Select your overall mood (1-10)</label>
              <div className="flex items-center justify-between gap-2 max-w-2xl">
                {MOOD_EMOJIS.map((emoji, index) => {
                  const score = index + 1
                  const isSelected = moodScore === score
                  return (
                    <button
                      key={score}
                      onClick={() => setMoodScore(score)}
                      className={`text-3xl transition-transform hover:scale-110 ${isSelected ? 'scale-125 saturate-150 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'opacity-50 grayscale hover:grayscale-0'}`}
                      title={`Score: ${score}`}
                    >
                      {emoji}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Stress Slider */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm text-slate-400">Current Stress Level</label>
                <span className={`font-semibold ${getStressColor(stressLevel)}`}>
                  {stressLevel}/10 - {getStressLabel(stressLevel)}
                </span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={stressLevel} onChange={e => setStressLevel(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10B981, #F59E0B, #E11D48)`
                }}
              />
            </div>

            {/* Tags & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-slate-400 mb-3">What's contributing to this?</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        selectedTags.includes(tag) 
                        ? 'bg-brand/20 border-brand text-brand-light' 
                        : 'bg-surface border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {selectedTags.includes(tag) && <PlusIcon className="w-3 h-3 inline rotate-45 mr-1" />}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-3">Notes (optional)</label>
                <textarea 
                  value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full bg-surface-elevated/30 border border-white/10 rounded-xl p-3 text-sm text-white resize-none focus:ring-1 focus:ring-brand focus:border-brand"
                  rows="2"
                  placeholder="Journal your thoughts here..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleLog} disabled={logMutation.isPending}
                className="px-8 py-3 bg-brand text-white rounded-xl font-medium shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                {logMutation.isPending ? 'Saving...' : 'Log Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout for the rest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-surface-card rounded-2xl border border-white/5 p-6 shadow-md">
          <h3 className="text-lg font-semibold text-white mb-6">30-Day Trend</h3>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[1, 10]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  />
                  {/* Stress as fill area */}
                  <Area type="monotone" dataKey="stress" fill="#E11D48" stroke="none" fillOpacity={0.15} />
                  {/* Mood as line */}
                  <Line type="monotone" dataKey="mood" stroke="#2563EB" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Not enough data to display trend</div>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
             <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2563EB]"></span> Mood (Higher is better)</div>
             <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#E11D48] opacity-50"></span> Stress (Lower is better)</div>
          </div>
        </div>

        {/* Recommendations Column */}
        <div className="space-y-6">
          
          {/* Break Suggestion Engine */}
          <div className="bg-surface-card rounded-2xl border border-white/5 p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-white font-semibold flex items-center">Need a break?</h3>
               <button onClick={() => refreshBreak()} className="text-slate-400 hover:text-white p-1">
                 <ArrowPathIcon className="w-4 h-4" />
               </button>
            </div>
            
            {breakSuggestion ? (
              <div className={`p-4 rounded-xl border ${breakSuggestion.should_break ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                <p className="font-medium mb-2">{breakSuggestion.message}</p>
                <p className="text-sm opacity-80">{breakSuggestion.activity}</p>
              </div>
            ) : (
              <button onClick={() => refreshBreak()} className="w-full py-8 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:border-brand/50 hover:text-brand transition-colors flex flex-col items-center">
                 <HeartIcon className="w-8 h-8 mb-2" />
                 <span>Get AI Suggestion</span>
              </button>
            )}
          </div>

          {/* AI Study Recommendations */}
          <div className="bg-surface-card rounded-2xl border border-white/5 p-6 shadow-md flex-1">
             <h3 className="text-white font-semibold mb-4 flex items-center">
               Personalized Tips
             </h3>
             <ul className="space-y-3">
               {recommendations?.tips?.map((tip, i) => (
                 <li key={i} className="flex items-start text-sm text-slate-300 bg-surface-elevated/30 p-3 rounded-lg">
                   <span className="text-brand mr-2 mt-0.5">•</span>
                   {tip}
                 </li>
               )) || <li className="text-slate-500 text-sm">Loading tips...</li>}
             </ul>
          </div>

        </div>
      </div>

    </div>
  )
}
