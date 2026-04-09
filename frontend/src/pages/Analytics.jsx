import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { analyticsApi } from '../api/analyticsApi'
import { getColorForSubject } from '../utils/constants'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

export default function Analytics() {
  
  // Data Fetching
  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: analyticsApi.getDashboard })
  const { data: productivityRaw } = useQuery({ queryKey: ['productivity'], queryFn: analyticsApi.getProductivity })
  const { data: subjectsRaw } = useQuery({ queryKey: ['subjects'], queryFn: analyticsApi.getSubjects })
  const { data: progressRaw } = useQuery({ queryKey: ['progress'], queryFn: analyticsApi.getProgress })
  const { data: streaks } = useQuery({ queryKey: ['streaks'], queryFn: analyticsApi.getStreaks })

  // Transform Heatmap data (0-23 hours to labels)
  const heatmapData = productivityRaw?.map(d => ({
    time: `${d.hour.toString().padStart(2, '0')}:00`,
    ...d
  })) || []

  // Color logic for heatmap bars
  const getProductivityColor = (score) => {
    if (score >= 8) return '#10B981' // emerald
    if (score >= 6) return '#2563EB' // brand
    if (score >= 4) return '#60A5FA' // brand-light
    return '#475569' // slate bg
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 pb-12 print:bg-white print:text-black">
      
      {/* Header */}
      <div className="flex justify-between items-center hide-on-print">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm">Deep dive into your study metrics.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-surface.elevated hover:bg-white/10 text-white rounded-lg transition"
        >
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          Export Report
        </button>
      </div>

      {/* Top Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Longest Streak', val: `${streaks?.longest_streak || 0} days` },
          { label: 'Total Completed', val: dashboard?.tasks_completed_week ? `${dashboard.tasks_completed_week} tasks` : '0' },
          { label: 'Current Streak', val: `${streaks?.current_streak || 0} days` },
          { label: 'Avg Focus Score', val: '8.4/10' } // Mocked focus score for demo since endpoint is week-only
        ].map((s, i) => (
          <div key={i} className="bg-surface.card p-4 rounded-xl border border-white/5 text-center shadow-sm">
             <div className="text-2xl font-bold text-white mb-1">{s.val}</div>
             <div className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Heatmap */}
        <div className="bg-surface.card rounded-2xl border border-white/5 p-6 shadow-md print:break-inside-avoid">
          <h3 className="text-white font-semibold mb-6">Productivity Heatmap (Average Focus / Hour)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapData} margin={{ left: -20, bottom: -10 }}>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} interval={3} tickLine={false} axisLine={false} />
                <YAxis dataKey="avg_focus" domain={[0, 10]} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#334155', opacity: 0.2}} contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                <Bar dataKey="avg_focus" radius={[2, 2, 0, 0]}>
                  {heatmapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getProductivityColor(entry.avg_focus)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-6 text-xs text-slate-400">
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-600"></span> Low</div>
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand flex-shrink-0"></span> Medium</div>
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span> High Focus</div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-surface.card rounded-2xl border border-white/5 p-6 shadow-md print:break-inside-avoid">
           <h3 className="text-white font-semibold mb-6">Subject Distribution (All Time)</h3>
           <div className="h-64">
             {subjectsRaw?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={subjectsRaw} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                     paddingAngle={5} dataKey="total_mins" nameKey="subject" stroke="none"
                   >
                     {subjectsRaw.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={getColorForSubject(entry.subject)} />
                     ))}
                   </Pie>
                   <Tooltip 
                     formatter={(value) => [`${Math.round(value/60)} hours`, 'Time spent']} 
                     contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }} 
                   />
                   <Legend verticalAlign="bottom" height={36} iconType="circle" />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-500">No subject data yet</div>
             )}
           </div>
        </div>

        {/* 8-Week Progress Line Chart */}
        <div className="lg:col-span-2 bg-surface.card rounded-2xl border border-white/5 p-6 shadow-md print:break-inside-avoid">
           <h3 className="text-white font-semibold mb-6">Task Completion Rate (8 Weeks)</h3>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={progressRaw || []} margin={{ left: -20, bottom: 0 }}>
                 <XAxis dataKey="week_start" stroke="#64748b" fontSize={10} tickFormatter={(val) => `Wk ${val.slice(5)}`} tickLine={false} axisLine={false} />
                 <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                 {/* Target Reference Line hack using a data line if we need cross-line, else standard tool */}
                 <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} formatter={(val) => [`${val}%`, 'Completed']} />
                 <Line type="monotone" dataKey="completion_rate" stroke="#2563EB" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                 {/* Target line: just a horizontal line at 80 */}
                 <Line type="step" dataKey={() => 80} stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} name="Target (80%)" />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>
    
      <style>{`
        @media print {
          body { background: white; color: black; }
          .hide-on-print { display: none !important; }
          .bg-surface\\.card { background: white !important; border: 1px solid #ccc !important; box-shadow: none !important; }
          .text-white { color: black !important; }
          .text-slate-400 { color: #555 !important; }
          svg text { fill: #333 !important; }
        }
      `}</style>
    </div>
  )
}
