import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref(null)
  // Promise yang resolve setelah upaya pertama memuat user selesai.
  // Router guard menunggunya supaya tidak menilai role saat user masih null.
  const ready = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin_sdm')
  const isPimpinan = computed(() => user.value?.role === 'pimpinan')
  const isSuperadmin = computed(() => user.value?.role === 'superadmin')
  const isAuditor = computed(() => user.value?.role === 'auditor')
  const canVerify = computed(() => isAdmin.value || isPimpinan.value || isSuperadmin.value)

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const { data } = await authApi.login(email, password)
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      return data
    } catch (err) {
      error.value = err.response?.data?.error || 'Login gagal'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return

    try {
      const { data } = await authApi.getMe()
      user.value = data.user
    } catch (err) {
      // Hanya logout kalau token memang ditolak server (401/403).
      // Error sementara (network, 5xx, 429, CORS) jangan menghapus session,
      // supaya refresh saat backend belum siap tidak melempar user ke login.
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout()
      } else {
        console.error('Gagal memuat user (sementara), session dipertahankan:', err)
      }
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  // Initialize user if token exists. Simpan promise-nya agar router guard
  // bisa menunggu user termuat sebelum mengevaluasi akses berbasis role.
  if (token.value && !user.value) {
    ready.value = fetchUser()
  } else {
    ready.value = Promise.resolve()
  }

  return {
    user,
    token,
    loading,
    error,
    ready,
    isAuthenticated,
    isAdmin,
    isPimpinan,
    isSuperadmin,
    isAuditor,
    canVerify,
    login,
    logout,
    fetchUser,
  }
})
