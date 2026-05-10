import api from './axios'

export const kegiatanApi = {
  getAll(params = {}) {
    return api.get('/kegiatan', { params })
  },
  
  getById(id) {
    return api.get(`/kegiatan/${id}`)
  },
  
  create(data) {
    return api.post('/kegiatan', data)
  },
  
  verify(id, data) {
    return api.put(`/kegiatan/${id}/verify`, data)
  },
  
  delete(id) {
    return api.delete(`/kegiatan/${id}`)
  },
}
