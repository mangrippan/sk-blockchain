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
            <p v-if="usulan.tx_id_fabric" class="font-mono text-xs text-gray-600 break-all">{{ usulan.tx_id_fabric }}</p>
            <p v-else-if="usulan.status === 'sk_issued'" class="text-xs text-amber-600">
              Blockchain recording pending
            </p>
            <p v-else class="text-xs text-gray-500">
              Akan tercatat setelah SK terbit
            </p>
          </div>
          <div v-if="usulan.catatan_penolakan" class="md:col-span-2">
            <p class="text-sm text-gray-500">Catatan Penolakan</p>
            <p class="text-red-600">{{ usulan.catatan_penolakan }}</p>
          </div>
        </div>
      </div>

      <!-- Kegiatan yang Diajukan -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Kegiatan yang Diajukan
          <span v-if="snapshotData" class="text-sm font-normal text-gray-500">
            ({{ snapshotData.kegiatan_count }} kegiatan)
          </span>
        </h2>
        
        <div v-if="loadingSnapshot" class="text-gray-500 text-sm">Memuat data kegiatan...</div>
        
        <div v-else-if="!snapshotData || snapshotData.kegiatan_count === 0" class="text-gray-500 text-sm">
          Tidak ada kegiatan yang tercatat dalam usulan ini
        </div>
        
        <div v-else>
          <!-- Snapshot Hash Info -->
          <div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="text-xs text-blue-800 space-y-1">
              <div class="flex items-start gap-2">
                <span class="font-semibold">Snapshot Hash:</span>
                <code class="font-mono break-all">{{ snapshotData.snapshot_hash || '-' }}</code>
              </div>
              <div class="text-blue-600">
                ℹ️ Hash ini memastikan daftar kegiatan tidak dapat diubah setelah usulan diajukan
              </div>
            </div>
          </div>

          <!-- Kegiatan Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="text-left p-2 font-semibold text-gray-700">Kegiatan</th>
                  <th class="text-left p-2 font-semibold text-gray-700">Kategori</th>
                  <th class="text-center p-2 font-semibold text-gray-700">Poin</th>
                  <th class="text-left p-2 font-semibold text-gray-700">TX Create</th>
                  <th class="text-left p-2 font-semibold text-gray-700">TX Verify</th>
                  <th class="text-center p-2 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="kegiatan in snapshotData.kegiatan" 
                  :key="kegiatan.kegiatan_id"
                  class="border-b hover:bg-gray-50"
                >
                  <td class="p-2">
                    <div class="font-medium text-gray-900">{{ kegiatan.nama_kegiatan }}</div>
                    <div class="text-xs text-gray-500">{{ kegiatan.file_name }}</div>
                  </td>
                  <td class="p-2 text-gray-600">{{ kegiatan.nama_kategori }}</td>
                  <td class="p-2 text-center font-semibold text-gray-900">{{ kegiatan.poin_kum }}</td>
                  <td class="p-2">
                    <code v-if="kegiatan.kegiatan_create_tx" 
                      class="text-xs font-mono text-blue-600 break-all block max-w-[150px]"
                      :title="kegiatan.kegiatan_create_tx"
                    >
                      {{ kegiatan.kegiatan_create_tx.substring(0, 12) }}...
                    </code>
                    <span v-else class="text-xs text-gray-400">-</span>
                  </td>
                  <td class="p-2">
                    <code v-if="kegiatan.kegiatan_verify_tx" 
                      class="text-xs font-mono text-green-600 break-all block max-w-[150px]"
                      :title="kegiatan.kegiatan_verify_tx"
                    >
                      {{ kegiatan.kegiatan_verify_tx.substring(0, 12) }}...
                    </code>
                    <span v-else class="text-xs text-gray-400">-</span>
                  </td>
                  <td class="p-2 text-center">
                    <span 
                      class="text-xs px-2 py-1 rounded-full font-medium"
                      :class="{
                        'bg-green-100 text-green-700': kegiatan.status_saat_snapshot === 'verified',
                        'bg-gray-100 text-gray-700': kegiatan.status_saat_snapshot !== 'verified'
                      }"
                    >
                      {{ kegiatan.status_saat_snapshot }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 border-t">
                <tr>
                  <td colspan="2" class="p-2 text-right font-semibold text-gray-900">Total:</td>
                  <td class="p-2 text-center font-bold text-gray-900">{{ snapshotData.total_poin }}</td>
                  <td colspan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Dokumen Administrasi -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Dokumen Administrasi
          <span v-if="dokumenList.length > 0" class="text-sm font-normal text-gray-500">
            ({{ dokumenList.length }} dokumen)
          </span>
        </h2>

        <div v-if="loadingDokumen" class="text-gray-500 text-sm">Memuat dokumen...</div>

        <div v-else-if="dokumenList.length === 0" class="text-gray-500 text-sm">
          Tidak ada dokumen administrasi yang terlampir pada usulan ini
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="dok in dokumenList"
            :key="dok.id"
            class="flex items-center justify-between py-3"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900">
                {{ dok.jenis_nama }}
                <span v-if="dok.is_required" class="text-red-600">*</span>
              </p>
              <p class="text-xs text-gray-500 truncate">
                {{ dok.file_name }}
                <span v-if="dok.file_size"> · {{ formatFileSize(dok.file_size) }}</span>
              </p>
            </div>
            <button
              @click="downloadDokumen(dok)"
              class="ml-4 shrink-0 text-sm text-blue-600 hover:text-blue-800"
            >
              Unduh
            </button>
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
          <button
            v-if="usulan.status === 'sk_issued'"
            @click="validateBlockchain"
            :disabled="validating"
            class="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <span v-if="validating">⏳</span>
            <span v-else>🔍</span>
            {{ validating ? 'Validating...' : 'Validate Blockchain' }}
          </button>
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
          <!-- Integrity Status (from audit trail response) -->
          <div v-if="integrityStatus" class="mb-4 rounded-lg p-4 border" :class="{
            'bg-green-50 border-green-200': integrityStatus.skHashValid && integrityStatus.snapshotHashValid,
            'bg-red-50 border-red-200': integrityStatus.skHashValid === false || integrityStatus.snapshotHashValid === false,
            'bg-gray-50 border-gray-200': integrityStatus.skHashValid === null
          }">
            <div class="flex items-start gap-3">
              <span class="text-2xl">
                {{ integrityStatus.skHashValid === false || integrityStatus.snapshotHashValid === false ? '⚠️' : integrityStatus.skHashValid ? '✅' : 'ℹ️' }}
              </span>
              <div class="flex-1">
                <div class="font-semibold mb-2" :class="{
                  'text-green-800': integrityStatus.skHashValid && integrityStatus.snapshotHashValid,
                  'text-red-800': integrityStatus.skHashValid === false || integrityStatus.snapshotHashValid === false,
                  'text-gray-800': integrityStatus.skHashValid === null
                }">
                  Blockchain Integrity Status
                </div>
                <div class="text-sm space-y-2">
                  <div v-if="integrityStatus.skHashValid !== null" class="flex items-center gap-2">
                    <span>{{ integrityStatus.skHashValid ? '✓' : '✗' }}</span>
                    <span :class="integrityStatus.skHashValid ? 'text-green-700' : 'text-red-700'">
                      SK Document Hash: {{ integrityStatus.skHashValid ? 'Valid' : 'MISMATCH - Possible Tampering!' }}
                    </span>
                  </div>
                  <div v-if="integrityStatus.snapshotHashValid !== null" class="flex items-center gap-2">
                    <span>{{ integrityStatus.snapshotHashValid ? '✓' : '✗' }}</span>
                    <span :class="integrityStatus.snapshotHashValid ? 'text-green-700' : 'text-red-700'">
                      Snapshot Hash: {{ integrityStatus.snapshotHashValid ? 'Valid' : 'MISMATCH - Data may have been tampered!' }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-600 mt-2 pt-2 border-t">
                    {{ integrityStatus.message }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Validation Result Modal -->
          <div v-if="validationResult" class="mb-4 bg-white border-2 rounded-lg p-4 shadow-lg" :class="{
            'border-green-500': validationResult.valid,
            'border-red-500': !validationResult.valid
          }">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ validationResult.valid ? '✅' : '❌' }}</span>
                <h3 class="font-semibold text-lg">
                  {{ validationResult.message }}
                </h3>
              </div>
              <button @click="validationResult = null" class="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <div v-if="validationResult.errors && validationResult.errors.length > 0" class="mb-3">
              <div class="text-sm font-medium text-red-700 mb-1">Errors:</div>
              <ul class="text-sm text-red-600 list-disc list-inside space-y-1">
                <li v-for="(error, idx) in validationResult.errors" :key="idx">{{ error }}</li>
              </ul>
            </div>
            
            <div v-if="validationResult.warnings && validationResult.warnings.length > 0" class="mb-3">
              <div class="text-sm font-medium text-amber-700 mb-1">Warnings:</div>
              <ul class="text-sm text-amber-600 list-disc list-inside space-y-1">
                <li v-for="(warning, idx) in validationResult.warnings" :key="idx">{{ warning }}</li>
              </ul>
            </div>

            <div v-if="validationResult.details" class="text-xs space-y-2">
              <div class="font-medium text-gray-700">Validation Checks:</div>
              <div class="grid grid-cols-2 gap-2">
                <div v-for="(value, key) in validationResult.checks" :key="key" class="flex items-center gap-1">
                  <span>{{ value ? '✓' : '✗' }}</span>
                  <span :class="value ? 'text-green-600' : 'text-gray-400'">{{ formatCheckName(key) }}</span>
                </div>
              </div>
            </div>
          </div>
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
import api from '@/api/axios'
import { toast } from 'vue-sonner'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const auth = useAuthStore()
const store = useUsulanStore()

const usulan = computed(() => store.currentUsulan)
const auditTrail = ref([])
const snapshotData = ref(null)
const loadingSnapshot = ref(false)
const dokumenList = ref([])
const loadingDokumen = ref(false)
const sortOrder = ref('asc') // 'asc' = oldest first, 'desc' = newest first
const showTolakModal = ref(false)
const catatanPenolakan = ref('')
const skFile = ref(null)
const skNumber = ref('')
const skDate = ref('')
const integrityStatus = ref(null)
const validationResult = ref(null)
const validating = ref(false)

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
    integrityStatus.value = data.integrity || null
    console.log('Audit trail loaded:', auditTrail.value)
    console.log('Integrity status:', integrityStatus.value)
  } catch (error) {
    console.error('Failed to load audit trail:', error)
    auditTrail.value = []
    integrityStatus.value = null
  }
}

async function fetchSnapshot() {
  loadingSnapshot.value = true
  try {
    const { data } = await usulanApi.getSnapshot(route.params.id)
    snapshotData.value = data.data || null
    console.log('Snapshot loaded:', snapshotData.value)
  } catch (error) {
    console.error('Failed to load snapshot:', error)
    snapshotData.value = null
  } finally {
    loadingSnapshot.value = false
  }
}

async function fetchDokumen() {
  loadingDokumen.value = true
  try {
    const { data } = await usulanApi.getDokumen(route.params.id)
    dokumenList.value = data.data || []
  } catch (error) {
    console.error('Failed to load documents:', error)
    dokumenList.value = []
  } finally {
    loadingDokumen.value = false
  }
}

async function downloadDokumen(dok) {
  try {
    // Files are served through an authenticated route, so fetch as a blob
    // (a plain link would omit the JWT and get a 401).
    const response = await api.get(`/files/dokumen/${dok.id}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = dok.file_name || 'dokumen'
    link.click()
    // Defer revoke so the browser has started reading the blob; revoking
    // synchronously after click() can abort the download in some browsers.
    setTimeout(() => window.URL.revokeObjectURL(url), 0)
  } catch (error) {
    console.error('Failed to download document:', error)
    toast.error('Gagal mengunduh dokumen')
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
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

async function validateBlockchain() {
  validating.value = true
  validationResult.value = null
  try {
    const { data } = await usulanApi.validateBlockchain(route.params.id)
    validationResult.value = data
    console.log('Validation result:', data)
  } catch (error) {
    console.error('Validation failed:', error)
    validationResult.value = {
      valid: false,
      message: 'Validation request failed',
      errors: [error.response?.data?.message || error.message]
    }
  } finally {
    validating.value = false
  }
}

function formatCheckName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

onMounted(async () => {
  await store.fetchById(route.params.id)
  await Promise.all([
    fetchAuditTrail(),
    fetchSnapshot(),
    fetchDokumen()
  ])
})
</script>
