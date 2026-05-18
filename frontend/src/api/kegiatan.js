import api from './axios'

export const kegiatanApi = {
  getAll(params = {}) {
    return api.get('/kegiatan', { params })
  },
  
  getById(id) {
    return api.get(`/kegiatan/${id}`)
  },
  
  create(data) {
    const isFormData = data instanceof FormData
    return api.post('/kegiatan', data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {})
  },
  
  verify(id, data) {
    return api.put(`/kegiatan/${id}/verify`, data)
  },
  
  delete(id) {
    return api.delete(`/kegiatan/${id}`)
  },

  getAuditTrail(id) {
    return api.get(`/kegiatan/${id}/audit`)
  },

  getRevisions(id) {
    return api.get(`/kegiatan/${id}/revisions`)
  },

  resubmit(id, data) {
    const isFormData = data instanceof FormData
    return api.post(`/kegiatan/${id}/resubmit`, data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {})
  },

  getDashboardStats() {
    return api.get('/kegiatan/stats/dashboard')
  },
}
