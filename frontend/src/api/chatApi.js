import api from './axiosInstance'

export const chatApi = {
  getHistory: () => api.get('/chat/history').then(res => res.data),
  sendMessage: (content) => api.post('/chat/message', { content }).then(res => res.data),
  clearHistory: () => api.delete('/chat/history').then(res => res.data),
  summarizeNotes: (text) => api.post('/chat/summarize-notes', { text }).then(res => res.data),
  explainTopic: (topic) => api.post('/chat/explain', { topic }).then(res => res.data),
}
