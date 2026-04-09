import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { 
  EllipsisVerticalIcon, 
  TrashIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  CheckCircleIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'
import { formatRelativeTime, formatDuration } from '../../utils/formatters'
import { getColorForSubject } from '../../utils/constants'
import { tasksApi } from '../../api/tasksApi'
import { toast } from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export default function TaskCard({ task, compact = false }) {
  const queryClient = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: (newStatus) => tasksApi.updateStatus(task.id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Task status updated')
    },
    onError: () => toast.error('Failed to update task')
  })

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task')
  })

  // Priority Label
  let PriorityBadge = null
  if (task.priority_score >= 0.7) {
    PriorityBadge = <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">High</span>
  } else if (task.priority_score >= 0.4) {
    PriorityBadge = <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">Med</span>
  } else {
    PriorityBadge = <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">Low</span>
  }

  // Difficulty dots
  const renderDifficulty = () => {
    return (
      <div className="flex space-x-1" title={`Difficulty: ${task.difficulty}/5`}>
        {[1, 2, 3, 4, 5].map((level) => (
          <div 
            key={level} 
            className={`w-1.5 h-1.5 rounded-full ${level <= task.difficulty ? 'bg-slate-400' : 'bg-slate-700'}`}
          />
        ))}
      </div>
    )
  }

  const subjectColor = getColorForSubject(task.subject)
  
  // Status Indicator
  const getStatusIcon = () => {
    switch (task.status) {
      case 'done': return <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
      case 'in_progress': return <PlayCircleIcon className="w-5 h-5 text-brand" />
      default: return <div className="w-5 h-5 rounded-full border-2 border-slate-500 border-dashed" />
    }
  }

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

  return (
    <div className={`group relative bg-surface.card rounded-xl border border-white/5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start justify-between gap-4">
        
        {/* Left Side: Status & Content */}
        <div className="flex items-start flex-1 min-w-0">
          <Menu as="div" className="relative mr-3 mt-1 cursor-pointer">
            <Menu.Button className="focus:outline-none transition-transform hover:scale-110">
              {getStatusIcon()}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-10 w-36 mt-2 origin-top-left bg-surface rounded-lg shadow-lg border border-white/10 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => statusMutation.mutate('pending')} className={`${active ? 'bg-white/5' : ''} group flex w-full items-center px-4 py-2 text-sm text-slate-300`}>
                        Pending
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => statusMutation.mutate('in_progress')} className={`${active ? 'bg-white/5' : ''} group flex w-full items-center px-4 py-2 text-sm text-brand`}>
                        In Progress
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => statusMutation.mutate('done')} className={`${active ? 'bg-white/5' : ''} group flex w-full items-center px-4 py-2 text-sm text-emerald-400`}>
                        Done
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span 
                className="inline-block w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: subjectColor }}
                title={task.subject}
              />
              <span className="text-xs font-semibold text-slate-400 truncate max-w-[120px]">
                {task.subject}
              </span>
              {!compact && task.importance_flag && (
                <ExclamationCircleIcon className="w-4 h-4 text-rose-500" title="Important" />
              )}
            </div>
            
            <h3 className={`text-base font-semibold text-slate-100 truncate ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>
              {task.title}
            </h3>
            
            {!compact && task.description && (
              <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {PriorityBadge}
              
              {task.deadline && (
                <div className={`flex items-center text-xs font-medium space-x-1 ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>{formatRelativeTime(task.deadline)}</span>
                </div>
              )}
              
              {!compact && (
                <div className="flex items-center text-xs text-slate-400 space-x-1">
                  <span>~{formatDuration(task.estimated_mins)}</span>
                </div>
              )}
              
              {!compact && renderDifficulty()}
            </div>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             onClick={() => {
                if(window.confirm('Delete this task?')) deleteMutation.mutate()
             }}
             className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
           >
             <TrashIcon className="w-5 h-5" />
           </button>
        </div>

      </div>
    </div>
  )
}
