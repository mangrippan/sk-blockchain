<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Profil Saya</h1>
    
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div v-if="auth.user" class="space-y-4">
        <div>
          <p class="text-sm text-gray-500">Nama Lengkap</p>
          <p class="font-medium text-gray-900">{{ auth.user.nama_lengkap }}</p>
        </div>
        
        <div>
          <p class="text-sm text-gray-500">NIP/NIDN</p>
          <p class="font-medium text-gray-900">{{ auth.user.nip_nidn }}</p>
        </div>
        
        <div>
          <p class="text-sm text-gray-500">Email</p>
          <p class="font-medium text-gray-900">{{ auth.user.email }}</p>
        </div>
        
        <div>
          <p class="text-sm text-gray-500">Role</p>
          <p class="font-medium text-gray-900">{{ roleLabel }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

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
</script>
