<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
    
    <!-- Alert for Revisions Needed (Dosen only) -->
    <div
      v-if="stats[4]?.value > 0"
      class="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <p class="font-medium text-amber-900">
            {{ stats[4].value }} kegiatan perlu direvisi. Segera perbaiki dan kirim ulang!
          </p>
        </div>
        <button
          @click="$router.push('/kegiatan?status=revision_requested')"
          class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Lihat Sekarang
        </button>
      </div>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <LoadingSkeleton v-if="loading" variant="card" :count="4" />
      <div
        v-else
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-gray-600">{{ stat.label }}</p>
          <component :is="stat.icon" :size="20" class="text-gray-400" />
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ stat.value }}</p>
      </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="bg-white rounded-lg border border-gray-200">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Kegiatan Terbaru</h2>
      </div>
      
      <LoadingSkeleton v-if="loading" variant="list" :count="3" />
      
      <div v-else-if="recentKegiatan.length === 0" class="p-6 text-center text-gray-500">
        Belum ada kegiatan
      </div>
      
      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="item in recentKegiatan"
          :key="item.id"
          class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          @click="$router.push(`/kegiatan/${item.id}`)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ item.nama_kegiatan }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ formatDate(item.created_at) }}</p>
            </div>
            <StatusBadge :status="item.status" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { FileText, CheckCircle, Clock, Award, AlertTriangle } from 'lucide-vue-next'
import { kegiatanApi } from '@/api/kegiatan'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'

const stats = ref([
  { label: 'Total Kegiatan', value: '-', icon: FileText },
  { label: 'Menunggu Verifikasi', value: '-', icon: Clock },
  { label: 'Terverifikasi', value: '-', icon: CheckCircle },
  { label: 'Total Poin KUM', value: '-', icon: Award },
  { label: 'Perlu Revisi', value: 0, icon: AlertTriangle },
])

const recentKegiatan = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await kegiatanApi.getDashboardStats()
    
    stats.value[0].value = data.stats.total || 0
    stats.value[1].value = data.stats.pending || 0
    stats.value[2].value = data.stats.verified || 0
    stats.value[3].value = (data.stats.total_poin || 0).toFixed(2)
    stats.value[4].value = data.stats.revision || 0 // New revision count
    
    recentKegiatan.value = data.recent || []
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err)
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>
