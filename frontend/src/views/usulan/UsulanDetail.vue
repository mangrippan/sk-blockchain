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
            <p class="font-medium text-gray-900">{{ usulan.total_kum }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Tanggal Pengajuan</p>
            <p class="font-medium text-gray-900">{{ formatDate(usulan.created_at) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Blockchain TX</p>
            <p class="font-mono text-xs text-gray-600 break-all">{{ usulan.blockchain_tx_id || '-' }}</p>
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
          <input
            type="file"
            accept=".pdf"
            @change="skFile = $event.target.files[0]"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button
            @click="handleTerbitkanSk"
            :disabled="!skFile"
            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Terbitkan SK
          </button>
        </div>
      </div>

      <!-- Audit Trail -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h2>
        <div v-if="auditTrail.length === 0" class="text-gray-500 text-sm">Belum ada riwayat</div>
        <div v-else class="space-y-3">
          <div
            v-for="(entry, idx) in auditTrail"
            :key="idx"
            class="flex gap-3 items-start border-l-2 border-blue-200 pl-4 py-1"
          >
            <div>
              <p class="text-sm font-medium text-gray-900">{{ entry.action || entry.status }}</p>
              <p class="text-xs text-gray-500">{{ formatDate(entry.timestamp || entry.created_at) }}</p>
              <p v-if="entry.txId" class="text-xs text-gray-400 font-mono">TX: {{ entry.txId }}</p>
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
const showTolakModal = ref(false)
const catatanPenolakan = ref('')
const skFile = ref(null)

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

async function handleProses() {
  await store.proses(route.params.id)
  await store.fetchById(route.params.id)
}

async function handleTolak() {
  await store.tolak(route.params.id, catatanPenolakan.value)
  showTolakModal.value = false
  await store.fetchById(route.params.id)
}

async function handleTerbitkanSk() {
  const formData = new FormData()
  formData.append('file_sk', skFile.value)
  await store.terbitkanSk(route.params.id, formData)
  await store.fetchById(route.params.id)
}

onMounted(async () => {
  await store.fetchById(route.params.id)
  try {
    const { data } = await usulanApi.getAuditTrail(route.params.id)
    auditTrail.value = data.data || data.history || []
  } catch {
    // audit trail may not be available
  }
})
</script>
