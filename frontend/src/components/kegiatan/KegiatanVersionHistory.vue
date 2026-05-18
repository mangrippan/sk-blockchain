<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">Riwayat Revisi</h3>
      <span class="text-sm text-gray-500">
        {{ revisions.length }} versi{{ revisionCount > 0 ? `, ${revisionCount} kali direvisi` : '' }}
      </span>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="revisions.length === 0" class="text-center py-8">
      <p class="text-gray-500">Tidak ada riwayat revisi</p>
    </div>
    
    <!-- Timeline -->
    <div v-else class="relative space-y-6">
      <!-- Timeline Line -->
      <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
      
      <!-- Revision Items -->
      <div
        v-for="(revision, index) in revisions"
        :key="revision.id"
        class="relative flex items-start gap-4"
      >
        <!-- Timeline Dot -->
        <div
          :class="[
            'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2',
            revision.is_latest 
              ? 'border-blue-600 bg-blue-100' 
              : 'border-gray-300 bg-white'
          ]"
        >
          <span :class="[
            'text-xs font-semibold',
            revision.is_latest ? 'text-blue-600' : 'text-gray-600'
          ]">
            v{{ revision.versi }}
          </span>
        </div>
        
        <!-- Revision Card -->
        <div class="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-medium text-gray-900">Versi {{ revision.versi }}</h4>
                <StatusBadge :status="revision.status" />
                <span v-if="revision.is_latest" class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Terbaru
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                {{ formatDate(revision.created_at) }}
              </p>
            </div>
          </div>
          
          <!-- Kegiatan Details -->
          <div class="grid grid-cols-2 gap-3 text-sm mt-3">
            <div>
              <span class="text-gray-500">Jenis Kegiatan:</span>
              <p class="font-medium">{{ revision.nama_kegiatan }}</p>
            </div>
            <div>
              <span class="text-gray-500">Poin KUM:</span>
              <p class="font-medium">{{ revision.poin_kum }}</p>
            </div>
            <div v-if="revision.file_name">
              <span class="text-gray-500">File:</span>
              <p class="font-medium text-blue-600 truncate">{{ revision.file_name }}</p>
            </div>
          </div>
          
          <!-- Verification Info -->
          <div v-if="revision.verified_at" class="mt-3 pt-3 border-t border-gray-200 text-sm">
            <p class="text-gray-600">
              <span class="font-medium">
                {{ revision.status === 'verified' ? 'Disetujui' : 
                   revision.status === 'rejected' ? 'Ditolak' :
                   revision.status === 'revision_requested' ? 'Perlu Revisi' : 'Diproses' }}
              </span>
              oleh {{ revision.verified_by_name || 'Admin' }} 
              pada {{ formatDate(revision.verified_at) }}
            </p>
            
            <!-- Rejection/Revision Notes -->
            <div v-if="revision.catatan_penolakan" class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
              <p class="font-medium text-amber-900 mb-1">Catatan:</p>
              <p class="text-gray-700">{{ revision.catatan_penolakan }}</p>
            </div>
          </div>
          
          <!-- Description -->
          <div v-if="revision.deskripsi" class="mt-3 text-sm">
            <span class="text-gray-500">Deskripsi:</span>
            <p class="text-gray-700 mt-1">{{ revision.deskripsi }}</p>
          </div>
          
          <!-- Blockchain Info -->
          <div v-if="revision.tx_id_fabric" class="mt-3 text-xs text-gray-500">
            <span class="font-mono">TX: {{ truncateTxId(revision.tx_id_fabric) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { kegiatanApi } from '@/api/kegiatan'
import StatusBadge from '@/components/StatusBadge.vue'

const props = defineProps({
  kegiatanId: {
    type: String,
    required: true,
  },
})

const revisions = ref([])
const revisionCount = ref(0)
const loading = ref(false)

onMounted(() => {
  fetchRevisions()
})

watch(() => props.kegiatanId, () => {
  fetchRevisions()
})

async function fetchRevisions() {
  if (!props.kegiatanId) return
  
  loading.value = true
  try {
    const { data } = await kegiatanApi.getRevisions(props.kegiatanId)
    revisions.value = data.data || []
    revisionCount.value = data.revision_count || 0
  } catch (err) {
    console.error('Failed to fetch revisions:', err)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncateTxId(txId) {
  if (!txId) return ''
  return txId.length > 16 ? `${txId.substring(0, 8)}...${txId.substring(txId.length - 8)}` : txId
}
</script>
