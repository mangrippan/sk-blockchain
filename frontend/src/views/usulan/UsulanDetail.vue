<template>
  <div>
    <div class="mb-6">
      <RouterLink to="/usulan" class="text-blue-600 hover:text-blue-800 text-sm">&larr; Kembali</RouterLink>
    </div>

    <LoadingSkeleton v-if="store.loading" variant="detail" />

    <template v-else-if="usulan">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Detail Usulan #{{ usulan.id }}</h1>
        <StatusBadge :status="usulan.status" />
      </div>

      <!-- Info -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Jabatan Tujuan</p>
            <p class="font-medium text-gray-900">{{ usulan.jabatan_tujuan }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Total KUM</p>
            <p class="font-medium text-gray-900">{{ usulan.total_poin_diajukan }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Tanggal Pengajuan</p>
            <p class="font-medium text-gray-900">{{ formatDate(usulan.created_at) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Blockchain TX</p>
            <p class="font-mono text-xs text-gray-600 break-all">{{ usulan.blockchain_tx || '-' }}</p>
          </div>
          <div v-if="usulan.catatan_penolakan" class="md:col-span-2">
            <p class="text-sm text-gray-500">Catatan Penolakan</p>
            <p class="text-red-600">{{ usulan.catatan_penolakan }}</p>
          </div>
        </div>
      </div>

      <!-- Admin Actions -->
      <div v-if="auth.canVerify && usulan.status === 'pending'" class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Aksi Admin</h2>
        <div class="flex gap-3">
          <button
            @click="handleProses"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Proses Usulan
          </button>
          <button
            @click="showTolakModal = true"
            class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Tolak
          </button>
        </div>
      </div>

      <!-- Terbitkan SK -->
      <div v-if="auth.canVerify && usulan.status === 'diproses'" class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Terbitkan SK</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nomor SK</label>
            <input
              v-model="skNumber"
              type="text"
              required
              placeholder="Nomor SK..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal SK</label>
            <input
              v-model="skDate"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dokumen SK (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              @change="skFile = $event.target.files[0]"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            @click="handleTerbitkanSk"
            :disabled="!skNumber || !skDate"
            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Terbitkan SK
          </button>
        </div>
      </div>

      <!-- Audit Trail -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Audit Trail Lengkap
            <span v-if="sortedAuditTrail.length > 0" class="text-sm font-normal text-gray-500">
              ({{ sortedAuditTrail.length }} riwayat)
            </span>
          </h2>
          <div v-if="sortedAuditTrail.length > 0" class="flex flex-col items-end gap-1">
            <span class="text-xs text-gray-600">
              Urutkan:
            </span>
            <button
              @click="toggleSortOrder"
              class="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span>{{ sortOrder === 'asc' ? '📅 Terlama' : '📅 Terbaru' }}</span>
              <span class="text-xs">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </button>
          </div>
        </div>
        <div v-if="sortedAuditTrail.length === 0" class="text-gray-500 text-sm">Belum ada riwayat</div>
        <div v-else>
          <!-- Info: No Blockchain Data -->
          <div v-if="!hasBlockchainData" class="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <div class="flex items-start gap-2">
              <span class="text-amber-600">ℹ️</span>
              <div class="text-amber-800">
                <span class="font-medium">Usulan lama:</span> Data blockchain hanya tersedia untuk usulan yang dibuat setelah blockchain diaktifkan.
              </div>
            </div>
          </div>
          
          <div class="space-y-4">
            <div
              v-for="(entry, idx) in sortedAuditTrail"
              :key="idx"
              class="border-l-4 pl-4 py-2"
              :class="{
              'border-blue-400': entry.source === 'blockchain',
              'border-green-400': entry.category === 'Kegiatan' || entry.source === 'kegiatan',
              'border-purple-400': entry.category === 'Usulan' && entry.source !== 'blockchain',
              'border-gray-300': !entry.source && !entry.category
            }"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <p class="text-sm font-semibold text-gray-900">{{ entry.action || entry.status }}</p>
                  
                  <!-- Source Badge -->
                  <span 
                    v-if="entry.source"
                    class="text-xs px-2 py-0.5 rounded-full font-medium"
                    :class="{
                      'bg-blue-100 text-blue-700': entry.source === 'blockchain',
                      'bg-green-100 text-green-700': entry.source === 'kegiatan',
                      'bg-purple-100 text-purple-700': entry.source === 'database' || entry.source === 'usulan'
                    }"
                  >
                    {{ 
                      entry.source === 'blockchain' ? '⛓️ Blockchain' : 
                      entry.source === 'kegiatan' ? '📝 Kegiatan' :
                      '📋 Usulan'
                    }}
                  </span>
                </div>
                
                <div class="flex items-center gap-3 text-xs text-gray-500 mb-1">
                  <span>{{ formatDate(entry.timestamp || entry.created_at) }}</span>
                  <span v-if="entry.user_name" class="text-gray-600">
                    👤 {{ entry.user_name }}
                  </span>
                </div>
                
                <div v-if="entry.description" class="text-xs text-gray-600 mt-1">
                  {{ entry.description }}
                </div>
                
                <div v-if="entry.old_values || entry.new_values" class="text-xs mt-2 space-y-1 bg-gray-50 p-2 rounded">
                  <div v-if="entry.old_values" class="text-red-600">
                    <span class="font-medium">Lama:</span> {{ formatValues(entry.old_values) }}
                  </div>
                  <div v-if="entry.new_values" class="text-green-600">
                    <span class="font-medium">Baru:</span> {{ formatValues(entry.new_values) }}
                  </div>
                </div>
                
                <p v-if="entry.txId" class="text-xs text-gray-400 font-mono mt-1 break-all bg-gray-50 p-1 rounded">
                  TX: {{ entry.txId }}
                </p>
                
                <p v-if="entry.kegiatan_id" class="text-xs text-gray-500 mt-1">
                  🔗 Kegiatan ID: {{ entry.kegiatan_id }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </template>

    <!-- Tolak Modal -->
    <div v-if="showTolakModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">Tolak Usulan</h3>
        <textarea
          v-model="catatanPenolakan"
          rows="3"
          placeholder="Alasan penolakan..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
        ></textarea>
        <div class="flex gap-3 justify-end">
          <button @click="showTolakModal = false" class="px-4 py-2 bg-gray-100 rounded-lg">Batal</button>
          <button @click="handleTolak" class="px-4 py-2 bg-red-600 text-white rounded-lg">Tolak</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsulanStore } from '@/stores/usulan'
import { usulanApi } from '@/api/usulan'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const auth = useAuthStore()
const store = useUsulanStore()

const usulan = computed(() => store.currentUsulan)
const auditTrail = ref([])
const sortOrder = ref('asc') // 'asc' = oldest first, 'desc' = newest first
const showTolakModal = ref(false)
const catatanPenolakan = ref('')
const skFile = ref(null)
const skNumber = ref('')
const skDate = ref('')

// Computed property for sorted audit trail
const sortedAuditTrail = computed(() => {
  if (!auditTrail.value || auditTrail.value.length === 0) return []
  
  const sorted = [...auditTrail.value].sort((a, b) => {
    const dateA = new Date(a.timestamp || a.created_at || 0)
    const dateB = new Date(b.timestamp || b.created_at || 0)
    
    if (sortOrder.value === 'asc') {
      return dateA - dateB // Oldest first
    } else {
      return dateB - dateA // Newest first
    }
  })
  
  return sorted
})

// Check if there's any blockchain data
const hasBlockchainData = computed(() => {
  return auditTrail.value.some(entry => entry.source === 'blockchain')
})

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  
  // Handle Protobuf Timestamp format from blockchain (Fabric)
  if (typeof dateStr === 'object' && dateStr.seconds !== undefined) {
    // Convert protobuf timestamp: seconds since epoch + nanoseconds
    const milliseconds = dateStr.seconds * 1000 + (dateStr.nanos || 0) / 1000000
    return new Date(milliseconds).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }
  
  // Handle regular ISO date string
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function formatValues(values) {
  if (!values) return ''
  if (typeof values === 'string') return values
  if (typeof values === 'object') {
    return Object.entries(values)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ')
  }
  return String(values)
}

async function fetchAuditTrail() {
  try {
    const { data } = await usulanApi.getAuditTrail(route.params.id)
    auditTrail.value = data.data || []
    console.log('Audit trail loaded:', auditTrail.value)
  } catch (error) {
    console.error('Failed to load audit trail:', error)
    auditTrail.value = []
  }
}

async function handleProses() {
  await store.proses(route.params.id)
  await store.fetchById(route.params.id)
  await fetchAuditTrail()
}

async function handleTolak() {
  await store.tolak(route.params.id, catatanPenolakan.value)
  showTolakModal.value = false
  await store.fetchById(route.params.id)
  await fetchAuditTrail()
}

async function handleTerbitkanSk() {
  const formData = new FormData()
  formData.append('sk_number', skNumber.value)
  formData.append('sk_date', skDate.value)
  if (skFile.value) {
    formData.append('sk_document', skFile.value)
  }
  await store.terbitkanSk(route.params.id, formData)
  await store.fetchById(route.params.id)
  await fetchAuditTrail()
}

onMounted(async () => {
  await store.fetchById(route.params.id)
  await fetchAuditTrail()
})
</script>
