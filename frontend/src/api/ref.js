import api from './axios'

export const refApi = {
  getKategori(activeOnly = true) {
    return api.get('/ref/kategori', { params: { active_only: activeOnly } })
  },
  
  getKegiatan(params = {}) {
    return api.get('/ref/kegiatan', { params })
  },
  
  getKegiatanById(id) {
    return api.get(`/ref/kegiatan/${id}`)
  },
  
  getDokumen(activeOnly = true) {
    return api.get('/ref/dokumen', { params: { active_only: activeOnly } })
  },

  getJabatan(activeOnly = true) {
    return api.get('/ref/jabatan', { params: { active_only: activeOnly } })
  },

  getNextJabatan(userId) {
    return api.get(`/ref/jabatan/next/${userId}`)
  },
}
