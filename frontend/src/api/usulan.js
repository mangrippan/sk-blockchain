import api from './axios'

export const usulanApi = {
  getAll(params = {}) {
    return api.get('/usulan', { params })
  },

  getById(id) {
    return api.get(`/usulan/${id}`)
  },

  create(data) {
    return api.post('/usulan', data)
  },

  proses(id) {
    return api.put(`/usulan/${id}/proses`)
  },

  tolak(id, data) {
    return api.put(`/usulan/${id}/tolak`, data)
  },

  terbitkanSk(id, formData) {
    return api.put(`/usulan/${id}/terbitkan-sk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  uploadDokumenPendukung(id, formData) {
    return api.post(`/usulan/${id}/dokumen-pendukung`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getAuditTrail(id) {
    return api.get(`/usulan/${id}/audit`)
  },

  getSnapshot(id) {
    return api.get(`/usulan/${id}/snapshot`)
  },

  validateBlockchain(id) {
    return api.get(`/usulan/${id}/validate-blockchain`)
  },
}
