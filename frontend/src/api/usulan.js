import api from './axios'

export const usulanApi = {
  getAll(params = {}) {
    return api.get('/usulan', { params })
  },

  getById(id) {
    return api.get(`/usulan/${id}`)
  },

  create(data) {
    // Usulan creation is multipart (carries required administrative documents).
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
    return api.post('/usulan', data, isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined)
  },

  getDokumen(id) {
    return api.get(`/usulan/${id}/dokumen`)
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
