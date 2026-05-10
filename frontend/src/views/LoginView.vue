<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md">
      <!-- Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">ChainRank</h1>
          <p class="text-gray-600">Sistem Kenaikan Pangkat Dosen</p>
        </div>
        
        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              v-model="form.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="email@example.com"
            />
          </div>
          
          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              v-model="form.password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          
          <!-- Error message -->
          <div v-if="auth.error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ auth.error }}</p>
          </div>
          
          <!-- Submit button -->
          <button
            type="submit"
            :disabled="auth.loading"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {{ auth.loading ? 'Loading...' : 'Login' }}
          </button>
        </form>
        
        <!-- Demo accounts -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-xs text-gray-500 mb-2">Demo accounts:</p>
          <div class="space-y-1 text-xs text-gray-600">
            <p>Dosen: dosen@chainrank.test / dosen123</p>
            <p>Admin: admin@chainrank.test / admin123</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

async function handleLogin() {
  try {
    await auth.login(form.email, form.password)
    router.push('/')
  } catch (err) {
    // Error is handled in the store
  }
}
</script>
