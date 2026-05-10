import api from './axios'

export const authApi = {
  login(email, password) {
    return api.post('/auth/login', { email, password })
  },
  
  register(data) {
    return api.post('/auth/register', data)
  },
  
  getMe() {
    return api.get('/auth/me')
  },
}
