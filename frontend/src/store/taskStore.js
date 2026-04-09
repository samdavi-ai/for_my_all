import { create } from 'zustand'

export const useTaskStore = create((set) => ({
  filter: 'all', // 'all' | 'today' | 'week'
  subjectFilter: 'all',
  sortBy: 'priority', // 'priority' | 'deadline'
  selectedTask: null,
  
  setFilter: (filter) => set({ filter }),
  setSubjectFilter: (subjectFilter) => set({ subjectFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSelectedTask: (task) => set({ selectedTask: task }),
}))
