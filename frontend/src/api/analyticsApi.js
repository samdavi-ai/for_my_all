import api from './axiosInstance'

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard').then(res => res.data),
  getProductivity: () => api.get('/analytics/productivity').then(res => res.data),
  getSubjects: () => api.get('/analytics/subjects').then(res => res.data),
  getProgress: () => api.get('/analytics/progress').then(res => res.data),
  getStreaks: () => api.get('/analytics/streaks').then(res => res.data),
}
