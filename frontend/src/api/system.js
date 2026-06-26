import api from './axios'

export function getSystemStatus() {
  return api.get('/system/status')
}
