import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1' 
})

api.interceptors.request.use(config => {
  // Use the non-reactive getState() method
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response, 
  error => {
    if (error.response?.status === 401) {
      // Auto logout on token expiration
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default api
