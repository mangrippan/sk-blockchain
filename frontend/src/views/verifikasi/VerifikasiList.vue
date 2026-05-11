<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Verifikasi Kegiatan</h1>
    
    <!-- Filter -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Cari kegiatan atau nama dosen..."
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        
        <select
          v-model="filters.status"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="unverified">Belum Diverifikasi</option>
          <option value="verified">Terverifikasi</option>
          <option value="rejected">Ditolak</option>
          <option value="">Semua Status</option>
        </select>
        
        <button
          @click="fetchKegiatan"
          class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cari
        </button>
      </div>
    </div>
    
    <!-- Table -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <LoadingSkeleton v-if="loading" variant="table" :count="5" />
      
      <div v-else-if="kegiatan.length === 0" class="p-8 text-center text-gray-500">
        Tidak ada kegiatan ditemukan
      </div>
      
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosen</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kegiatan</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poin KUM</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="item in kegiatan"
            :key="item.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4">
              <p class="font-medium text-gray-900">{{ item.nama_dosen || '-' }}</p>
              <p class="text-sm text-gray-500">{{ item.nip_nidn || '-' }}</p>
            </td>
            <td class="px-6 py-4">
              <p class="font-medium text-gray-900">{{ item.nama_kegiatan }}</p>
              <p class="text-sm text-gray-500">{{ item.nama_kategori }}</p>
            </td>
            <td class="px-6 py-4 text-gray-700">{{ item.poin_kum || '-' }}</td>
            <td class="px-6 py-4">
              <StatusBadge :status="item.status" />
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(item.created_at) }}</td>
            <td class="px-6 py-4 text-right">
              <button
                @click="openVerifyModal(item)"
                class="text-blue-600 hover:text-blue-700 font-medium"
              >
                Verifikasi
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Verify Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-900">Verifikasi Kegiatan</h2>
        </div>
        
        <div v-if="selectedKegiatan" class="p-6 space-y-4">
          <!-- Detail Kegiatan -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">Dosen</p>
              <p class="font-medium">{{ selectedKegiatan.nama_dosen }}</p>
            </div>
            <div>
              <p class="text-gray-500">NIP/NIDN</p>
              <p class="font-medium">{{ selectedKegiatan.nip_nidn }}</p>
            </div>
            <div>
              <p class="text-gray-500">Kategori</p>
              <p class="font-medium">{{ selectedKegiatan.nama_kategori }}</p>
            </div>
            <div>
              <p class="text-gray-500">Jenis Kegiatan</p>
              <p class="font-medium">{{ selectedKegiatan.nama_kegiatan }}</p>
            </div>
            <div>
              <p class="text-gray-500">Poin KUM</p>
              <p class="font-medium">{{ selectedKegiatan.poin_kum }}</p>
            </div>
            <div>
              <p class="text-gray-500">Tanggal</p>
              <p class="font-medium">{{ formatDate(selectedKegiatan.created_at) }}</p>
            </div>
          </div>
          
          <div v-if="selectedKegiatan.deskripsi">
            <p class="text-gray-500 text-sm mb-1">Deskripsi</p>
            <p class="text-gray-700">{{ selectedKegiatan.deskripsi }}</p>
          </div>
          
          <div v-if="selectedKegiatan.file_name">
            <p class="text-gray-500 text-sm mb-1">File Bukti</p>
            <p class="text-gray-700">{{ selectedKegiatan.file_name }}</p>
          </div>
          
          <!-- Verification Form -->
          <div class="border-t border-gray-200 pt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Catatan (opsional)
            </label>
            <textarea
              v-model="verifyForm.catatan"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Tambahkan catatan jika diperlukan..."
            ></textarea>
          </div>
          
          <div v-if="verifyError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ verifyError }}</p>
          </div>
        </div>
        
        <div class="p-6 border-t border-gray-200 flex gap-3">
          <button
            @click="handleVerify('verified')"
            :disabled="verifying"
            class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {{ verifying === 'verified' ? 'Menyetujui...' : 'Setujui' }}
          </button>
          <button
            @click="handleVerify('rejected')"
            :disabled="verifying"
            class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {{ verifying === 'rejected' ? 'Menolak...' : 'Tolak' }}
          </button>
          <button
            @click="closeModal"
            class="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { kegiatanApi } from '@/api/kegiatan'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'

const kegiatan = ref([])
const loading = ref(false)
const showModal = ref(false)
const selectedKegiatan = ref(null)
const verifying = ref(null)
const verifyError = ref(null)

const filters = reactive({
  search: '',
  status: 'unverified',
})

const verifyForm = reactive({
  catatan: '',
})

onMounted(() => {
  fetchKegiatan()
})

async function fetchKegiatan() {
  loading.value = true
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    
    const { data } = await kegiatanApi.getAll(params)
    kegiatan.value = data.data || []
  } catch (err) {
    console.error('Failed to fetch kegiatan:', err)
  } finally {
    loading.value = false
  }
}

function openVerifyModal(item) {
  selectedKegiatan.value = item
  verifyForm.catatan = ''
  verifyError.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedKegiatan.value = null
  verifying.value = null
  verifyError.value = null
}

async function handleVerify(status) {
  if (!selectedKegiatan.value) return
  
  verifying.value = status
  verifyError.value = null
  
  try {
    await kegiatanApi.verify(selectedKegiatan.value.id, {
      status,
      catatan_penolakan: status === 'rejected' ? verifyForm.catatan : null,
    })
    
    toast.success(status === 'verified' ? 'Kegiatan disetujui' : 'Kegiatan ditolak')
    
    // Update list
    await fetchKegiatan()
    closeModal()
  } catch (err) {
    verifyError.value = err.response?.data?.error || 'Gagal memverifikasi kegiatan'
    toast.error(verifyError.value)
  } finally {
    verifying.value = null
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>
