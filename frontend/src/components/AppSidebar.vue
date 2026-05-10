<template>
  <div>
    <!-- Mobile sidebar backdrop -->
    <div 
      v-if="isOpen"
      class="fixed inset-0 bg-gray-900/50 lg:hidden z-40"
      @click="$emit('close')"
    ></div>
    
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-900">ChainRank</h1>
      </div>
      
      <!-- Navigation -->
      <nav class="p-4 space-y-1">
        <RouterLink
          v-for="item in menuItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          active-class="bg-blue-50 text-blue-600 hover:bg-blue-100"
        >
          <component :is="item.icon" :size="20" />
          <span class="font-medium">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { LayoutDashboard, FileText, CheckSquare, User } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

defineProps({
  isOpen: Boolean,
})

defineEmits(['close'])

const auth = useAuthStore()

const menuItems = computed(() => {
  const base = [
    { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    { name: 'kegiatan', label: 'Kegiatan Saya', icon: FileText, to: '/kegiatan' },
  ]
  
  if (auth.canVerify) {
    base.push({ name: 'verifikasi', label: 'Verifikasi', icon: CheckSquare, to: '/verifikasi' })
  }
  
  base.push({ name: 'profil', label: 'Profil', icon: User, to: '/profil' })
  
  return base
})
</script>
