import api from './axiosInstance'

export const authApi = {
  register: (userData) => api.post('/auth/register', userData).then(res => res.data),
  
  login: (email, password) => {
    // OAuth2PasswordRequestForm needs x-www-form-urlencoded
    const formData = new URLSearchParams()
    formData.append('username', email)  // FastAPI uses 'username' for the email
    formData.append('password', password)
    
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(res => res.data)
  },
  
  getMe: () => api.get('/auth/me').then(res => res.data),
  updateMe: (data) => api.put('/auth/me', data).then(res => res.data),
}
