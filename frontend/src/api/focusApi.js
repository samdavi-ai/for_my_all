import api from './axiosInstance'

export const focusApi = {
  getActive: () => api.get('/focus/active').then(res => res.data),
  startSession: (data) => api.post('/focus/start', data).then(res => res.data),
  endSession: (data) => api.post('/focus/end', data).then(res => res.data),
  logBreak: (sessionId) => api.post('/focus/break', null, { params: { session_id: sessionId } }).then(res => res.data),
  getStats: () => api.get('/focus/stats/week').then(res => res.data),
  getSessions: (days = 7) => api.get('/focus/sessions', { params: { days } }).then(res => res.data),
}
