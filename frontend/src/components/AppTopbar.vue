<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
    <!-- Mobile menu button -->
    <button
      @click="$emit('toggle-sidebar')"
      class="lg:hidden p-2 rounded-lg hover:bg-gray-100"
    >
      <Menu :size="20" />
    </button>
    
    <div class="flex-1"></div>
    
    <!-- User menu -->
    <div class="flex items-center gap-4">
      <div class="text-right hidden sm:block">
        <p class="text-sm font-medium text-gray-900">{{ auth.user?.nama_lengkap }}</p>
        <p class="text-xs text-gray-500">{{ roleLabel }}</p>
      </div>
      
      <button
        @click="handleLogout"
        class="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        title="Logout"
      >
        <LogOut :size="20" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const auth = useAuthStore()

const roleLabel = computed(() => {
  const roles = {
    dosen: 'Dosen',
    admin_sdm: 'Admin SDM',
    pimpinan: 'Pimpinan',
    superadmin: 'Super Admin',
  }
  return roles[auth.user?.role] || auth.user?.role
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
