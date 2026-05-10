<template>
  <div class="max-w-3xl">
    <div class="mb-6">
      <button
        @click="$router.back()"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft :size="20" />
        Kembali
      </button>
    </div>
    
    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Loading...</p>
    </div>
    
    <div v-else-if="kegiatan" class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ kegiatan.nama_kegiatan }}</h1>
          <p class="text-gray-600">{{ kegiatan.nama_kategori }}</p>
        </div>
        <StatusBadge :status="kegiatan.status" />
      </div>
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Poin KUM</p>
            <p class="font-medium">{{ kegiatan.poin_kum || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Tanggal Dibuat</p>
            <p class="font-medium">{{ formatDate(kegiatan.created_at) }}</p>
          </div>
        </div>
        
        <div v-if="kegiatan.deskripsi">
          <p class="text-sm text-gray-500 mb-1">Deskripsi</p>
          <p class="text-gray-700">{{ kegiatan.deskripsi }}</p>
        </div>
        
        <div v-if="kegiatan.catatan_penolakan" class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-sm font-medium text-amber-900 mb-1">Catatan Penolakan</p>
          <p class="text-sm text-amber-700">{{ kegiatan.catatan_penolakan }}</p>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-12">
      <p class="text-gray-500">Kegiatan tidak ditemukan</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { kegiatanApi } from '@/api/kegiatan'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const kegiatan = ref(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await kegiatanApi.getById(route.params.id)
    kegiatan.value = data
  } catch (err) {
    console.error('Failed to fetch kegiatan:', err)
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
