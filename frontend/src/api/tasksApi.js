import api from './axiosInstance'

export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }).then(res => res.data),
  getToday: () => api.get('/tasks/today').then(res => res.data),
  create: (data) => api.post('/tasks', data).then(res => res.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/tasks/${id}`).then(res => res.data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }).then(res => res.data),
}
