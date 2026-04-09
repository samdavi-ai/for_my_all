import api from './axiosInstance'

export const scheduleApi = {
  generate: (startDate, days = 7) => api.post('/schedule/generate', { start_date: startDate, days }).then(res => res.data),
  getWeek: (weekStart) => api.get('/schedule/week', { params: { week_start: weekStart } }).then(res => res.data),
  updateDate: (date, timeSlots) => api.put(`/schedule/${date}`, { time_slots: timeSlots }).then(res => res.data),
}
