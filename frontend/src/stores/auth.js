import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref(null)

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
      console.error('Failed to fetch user:', err)
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  // Initialize user if token exists
  if (token.value && !user.value) {
    fetchUser()
  }

  return {
    user,
    token,
    loading,
    error,
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
