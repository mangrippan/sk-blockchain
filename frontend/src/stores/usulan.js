import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usulanApi } from '@/api/usulan'

export const useUsulanStore = defineStore('usulan', () => {
  const usulans = ref([])
  const currentUsulan = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchAll(params = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await usulanApi.getAll(params)
      usulans.value = data.data || data.usulans || data
      return usulans.value
    } catch (err) {
      error.value = err.response?.data?.error || 'Gagal memuat data usulan'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value = null
    try {
      const { data } = await usulanApi.getById(id)
      currentUsulan.value = data.data || data.usulan || data
      return currentUsulan.value
    } catch (err) {
      error.value = err.response?.data?.error || 'Gagal memuat detail usulan'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    loading.value = true
    error.value = null
    try {
      const { data } = await usulanApi.create(payload)
      return data
    } catch (err) {
      error.value = err.response?.data?.error || 'Gagal mengajukan usulan'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function proses(id) {
    try {
      const { data } = await usulanApi.proses(id)
      await fetchAll()
      return data
    } catch (err) {
      error.value = err.response?.data?.error || 'Gagal memproses usulan'
      throw err
    }
  }

  async function tolak(id, catatan) {
    try {
      const { data } = await usulanApi.tolak(id, { catatan_penolakan: catatan })
      await fetchAll()
      return data
    } catch (err) {
      error.value = err.response?.data?.error || 'Gagal menolak usulan'
      throw err
    }
  }

  async function terbitkanSk(id, formData) {
    try {
      const { data } = await usulanApi.terbitkanSk(id, formData)
      await fetchAll()
      return data
    } catch (err) {
      error.value = err.response?.data?.error || 'Gagal menerbitkan SK'
      throw err
    }
  }

  return {
    usulans,
    currentUsulan,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    proses,
    tolak,
    terbitkanSk,
  }
})
