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

      <!-- Blockchain status indicator -->
      <div
        class="relative flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium cursor-default select-none"
        :class="statusClass"
        :title="statusTooltip"
      >
        <span
          class="w-2 h-2 rounded-full"
          :class="[dotClass, blockchainStatus.connected ? 'animate-pulse' : '']"
        />
        <span class="hidden sm:inline">{{ statusLabel }}</span>
        <Server :size="14" />
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, LogOut, Server } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { getSystemStatus } from '@/api/system'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const auth = useAuthStore()

const blockchainStatus = ref({ enabled: false, connected: false, identity: null })
let pollInterval = null

async function fetchStatus() {
  try {
    const { data } = await getSystemStatus()
    blockchainStatus.value = data.blockchain
  } catch {
    blockchainStatus.value = { enabled: false, connected: false, identity: null }
  }
}

onMounted(() => {
  fetchStatus()
  pollInterval = setInterval(fetchStatus, 30_000)
})

onUnmounted(() => {
  clearInterval(pollInterval)
})

const statusLabel = computed(() => {
  if (!blockchainStatus.value.enabled) return 'Blockchain OFF'
  return blockchainStatus.value.connected ? 'Blockchain' : 'Blockchain'
})

const statusClass = computed(() => {
  if (!blockchainStatus.value.enabled) return 'bg-gray-100 text-gray-500'
  return blockchainStatus.value.connected
    ? 'bg-green-50 text-green-700'
    : 'bg-red-50 text-red-600'
})

const dotClass = computed(() => {
  if (!blockchainStatus.value.enabled) return 'bg-gray-400'
  return blockchainStatus.value.connected ? 'bg-green-500' : 'bg-red-500'
})

const statusTooltip = computed(() => {
  const s = blockchainStatus.value
  if (!s.enabled) return 'Blockchain tidak aktif (FABRIC_ENABLED=false)'
  if (!s.connected) {
    return s.lastError
      ? `Blockchain tidak terhubung\nTerakhir gagal: ${s.lastError.message}`
      : 'Blockchain tidak terhubung'
  }
  const lastSuccess = s.lastSuccessAt ? `\nTerakhir berhasil: ${s.lastSuccessAt}` : ''
  return `Terhubung sebagai: ${s.identity}\nChannel: ${s.channel}\nChaincode: ${s.chaincode}${lastSuccess}`
})

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
