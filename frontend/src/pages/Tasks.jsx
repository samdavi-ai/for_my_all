import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import TaskCard from '../../components/TaskCard'
import { tasksApi } from '../../api/tasksApi'
import { useTaskStore } from '../../store/taskStore'
import { SUBJECT_COLORS } from '../../utils/constants'

export default function Tasks() {
  const queryClient = useQueryClient()
  const { filter, subjectFilter, sortBy, setFilter, setSubjectFilter, setSortBy } = useTaskStore()
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)
  
  // Slide-over form state
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Computer Science',
    deadline: '',
    difficulty: 3,
    estimated_mins: 60,
    importance_flag: false,
    description: ''
  })

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', filter, subjectFilter, sortBy],
    queryFn: () => tasksApi.getAll({ 
      status: filter === 'all' ? undefined : filter,
      subject: subjectFilter === 'all' ? undefined : subjectFilter,
      sort_by: sortBy
    }),
  })

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: (newTask) => tasksApi.create(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Task created successfully')
      setIsSlideOverOpen(false)
      // Reset form
      setFormData({
        title: '', subject: 'Computer Science', deadline: '', difficulty: 3, estimated_mins: 60, importance_flag: false, description: ''
      })
    },
    onError: () => toast.error('Failed to create task')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.subject) return toast.error('Title and Subject are required')
    
    // Ensure deadline is valid iso string if provided
    const payload = { ...formData }
    if (payload.deadline) {
      payload.deadline = new Date(payload.deadline).toISOString()
    } else {
      payload.deadline = null // Important to clear empty strings
    }
    
    createMutation.mutate(payload)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header & Controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => setIsSlideOverOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-brand hover:bg-brand.dark text-white rounded-xl shadow-lg shadow-brand/20 transition-all font-medium whitespace-nowrap"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Task
        </button>

        <div className="flex flex-wrap items-center gap-3">
           {/* Filters */}
           <div className="flex bg-surface.elevated/50 p-1 rounded-lg border border-white/5 text-sm">
             {['all', 'pending', 'in_progress', 'done'].map((f) => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-3 py-1.5 rounded-md capitalize transition-colors ${filter === f ? 'bg-surface.card text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
               >
                 {f.replace('_', ' ')}
               </button>
             ))}
           </div>

           <select 
             value={subjectFilter} 
             onChange={(e) => setSubjectFilter(e.target.value)}
             className="bg-surface.card border border-white/10 text-slate-200 text-sm rounded-lg px-3 py-2 pr-8 focus:ring-brand focus:border-brand"
           >
             <option value="all">All Subjects</option>
             {Object.keys(SUBJECT_COLORS).map(s => (
               <option key={s} value={s}>{s}</option>
             ))}
           </select>

           <select 
             value={sortBy} 
             onChange={(e) => setSortBy(e.target.value)}
             className="bg-surface.card border border-white/10 text-slate-200 text-sm rounded-lg px-3 py-2 pr-8 focus:ring-brand focus:border-brand"
           >
             <option value="priority">Sort by Priority (AI)</option>
             <option value="deadline">Sort by Deadline</option>
             <option value="created_at">Sort by Created</option>
           </select>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse bg-surface.card h-28 rounded-xl border border-white/5"></div>
            ))}
          </div>
        ) : tasks?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <svg className="w-32 h-32 mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xl font-medium text-slate-300">No tasks found</p>
            <p>Add your first task to get started!</p>
          </div>
        )}
      </div>

      {/* Slide-over Panel (Add Task) */}
      {isSlideOverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm transition-opacity" onClick={() => setIsSlideOverOpen(false)} />
          
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md transform transition ease-in-out duration-500 bg-surface.card shadow-2xl border-l border-white/10 flex flex-col">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Add New Task</h2>
                <button onClick={() => setIsSlideOverOpen(false)} className="text-slate-400 hover:text-white p-2">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar text-sm">
                <form id="add-task-form" onSubmit={handleSubmit} className="space-y-5 text-slate-300">
                  
                  <div>
                    <label className="block text-slate-400 mb-1">Task Title <span className="text-rose-500">*</span></label>
                    <input 
                      required autoFocus maxLength={200}
                      value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-surface.elevated/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-brand focus:border-brand"
                      placeholder="e.g. Chapter 4 Reading" 
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Subject <span className="text-rose-500">*</span></label>
                    <select 
                      required
                      value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                      className="w-full bg-surface.elevated/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand"
                    >
                      {Object.keys(SUBJECT_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Deadline</label>
                    <input 
                      type="datetime-local"
                      value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})}
                      className="w-full bg-surface.elevated/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Difficulty (1-5)</label>
                      <div className="flex items-center space-x-2 mt-1">
                        {[1,2,3,4,5].map(level => (
                           <button 
                             type="button" key={level} onClick={() => setFormData({...formData, difficulty: level})}
                             className={`w-6 h-6 rounded-full transition-colors ${formData.difficulty >= level ? 'bg-brand' : 'bg-slate-700'}`}
                           />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Est. Minutes</label>
                      <input 
                        type="number" min="5" max="600" step="5"
                        value={formData.estimated_mins} onChange={e => setFormData({...formData, estimated_mins: parseInt(e.target.value)})}
                        className="w-full bg-surface.elevated/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer mt-2 p-3 bg-rose-500/5 rounded-lg border border-rose-500/10">
                      <input 
                        type="checkbox"
                        checked={formData.importance_flag} onChange={e => setFormData({...formData, importance_flag: e.target.checked})}
                        className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-surface border-white/10"
                      />
                      <span className="text-rose-400 font-medium">Mark as High Priority (!)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Description (Optional)</label>
                    <textarea 
                      rows={3}
                      value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-surface.elevated/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-brand resize-none"
                      placeholder="Add any links or notes here..."
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-white/10 bg-surface flex justify-end gap-3">
                <button 
                  type="button" onClick={() => setIsSlideOverOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:bg-white/5 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" form="add-task-form" disabled={createMutation.isPending}
                  className="px-6 py-2 bg-brand hover:bg-brand.dark text-white rounded-lg font-medium shadow-lg shadow-brand/20 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Task'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
