<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
    
    <!-- No more revision alert - kegiatan yang ditolak tidak bisa direvisi -->
    
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
import { FileText, CheckCircle, Clock, Award } from 'lucide-vue-next'
import { kegiatanApi } from '@/api/kegiatan'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'

const stats = ref([
  { label: 'Total Kegiatan', value: '-', icon: FileText },
  { label: 'Menunggu Verifikasi', value: '-', icon: Clock },
  { label: 'Terverifikasi', value: '-', icon: CheckCircle },
  { label: 'Total Poin KUM', value: '-', icon: Award },
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
    // Revision feature removed
    
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
