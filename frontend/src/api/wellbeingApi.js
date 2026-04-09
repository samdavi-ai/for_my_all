import api from './axiosInstance'

export const wellbeingApi = {
  logMood: (data) => api.post('/wellbeing/mood', data).then(res => res.data),
  getHistory: (days = 30) => api.get('/wellbeing/mood/history', { params: { days } }).then(res => res.data),
  getAlerts: () => api.get('/wellbeing/alerts').then(res => res.data),
  getRecommendations: () => api.get('/wellbeing/recommendations').then(res => res.data),
  getBreakSuggestion: () => api.post('/wellbeing/break-suggestion').then(res => res.data),
}
