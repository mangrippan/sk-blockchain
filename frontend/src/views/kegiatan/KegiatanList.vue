<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
      <button
        v-if="!auth.canVerify"
        @click="showCreateModal = true"
        class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus :size="20" />
        Tambah Kegiatan
      </button>
    </div>
    
    <!--Filter & Search -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Cari kegiatan..."
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        
        <select
          v-model="filters.status"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">Semua Status</option>
          <option value="unverified">Belum Diverifikasi</option>
          <option value="verified">Terverifikasi</option>
          <option value="revision_requested">Perlu Revisi</option>
          <option value="rejected">Ditolak Final</option>
        </select>
        
        <button
          @click="fetchKegiatan"
          class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cari
        </button>
      </div>
    </div>
    
    <!-- Revision Alert Banner (Dosen only) -->
    <div
      v-if="!auth.canVerify && revisionNeededCount > 0"
      class="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-amber-900">
              {{ revisionNeededCount }} kegiatan perlu direvisi
            </p>
            <p class="text-sm text-amber-700">
              Silakan perbaiki dan kirim ulang kegiatan yang ditolak dengan catatan revisi.
            </p>
          </div>
        </div>
        <button
          @click="filters.status = 'revision_requested'; fetchKegiatan()"
          class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
        >
          Lihat Kegiatan
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
            <th v-if="auth.canVerify" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosen</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kegiatan</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poin KUM</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
            <th v-if="!auth.canVerify" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="item in kegiatan"
            :key="item.id"
            class="hover:bg-gray-50 cursor-pointer"
            @click="$router.push(`/kegiatan/${item.id}`)"
          >
            <td v-if="auth.canVerify" class="px-6 py-4">
              <p class="font-medium text-gray-900">{{ item.nama_dosen || '-' }}</p>
              <p class="text-sm text-gray-500">{{ item.nip_nidn || '-' }}</p>
            </td>
            <td class="px-6 py-4">
              <p class="font-medium text-gray-900">{{ item.nama_kegiatan }}</p>
              <p class="text-sm text-gray-500">{{ item.nama_kategori }}</p>
            </td>
            <td class="px-6 py-4 text-gray-700">{{ item.poin_kum || '-' }}</td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <StatusBadge :status="item.status" />
                <span v-if="item.versi > 1" class="text-xs text-gray-500 font-mono">
                  v{{ item.versi }}
                </span>
              </div>
              <!-- Show rejection notes alert -->
              <div v-if="!auth.canVerify && item.status === 'revision_requested' && item.catatan_penolakan" class="mt-1">
                <p class="text-xs text-amber-600 line-clamp-1">⚠️ Lihat catatan revisi</p>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(item.created_at) }}</td>
            <td v-if="!auth.canVerify" class="px-6 py-4 text-right" @click.stop>
              <div class="flex items-center justify-end gap-2">
                <!-- Revision Button -->
                <button
                  v-if="item.status === 'revision_requested'"
                  @click="openRevisionModal(item)"
                  class="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors text-sm font-medium"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Revisi
                </button>
                <!-- Delete Button (only for unverified) -->
                <button
                  v-if="item.status === 'unverified'"
                  @click="handleDelete(item.id)"
                  class="text-red-600 hover:text-red-700"
                  title="Hapus"
                >
                  <Trash2 :size="18" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Pagination -->
    <div v-if="!loading && kegiatan.length > 0" class="mt-6 flex items-center justify-between">
      <p class="text-sm text-gray-600">
        Menampilkan {{ (pagination.page - 1) * pagination.limit + 1 }} - 
        {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 
        dari {{ pagination.total }} kegiatan
      </p>
      <div class="flex gap-2">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Sebelumnya
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="changePage(page)"
          :class="[
            'px-3 py-2 border rounded-lg transition-colors',
            page === pagination.page
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          ]"
        >
          {{ page }}
        </button>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page === pagination.totalPages"
          class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Selanjutnya
        </button>
      </div>
    </div>
    
    <!-- Create Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4"
      @click.self="closeCreateModal"
    >
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 class="text-xl font-bold text-gray-900">Tambah Kegiatan</h2>
          <button @click="closeCreateModal" class="text-gray-600 hover:text-gray-900">
            <X :size="20" />
          </button>
        </div>
        
        <div class="p-6">
          <form @submit.prevent="handleCreateSubmit" class="space-y-4">
            <!-- Kategori -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kategori KUM</label>
              <select
                v-model="createForm.kategori_id"
                @change="loadKegiatanOptions"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Pilih Kategori</option>
                <option v-for="kat in kategoriList" :key="kat.id" :value="kat.id">
                  {{ kat.nama_kategori }}
                </option>
              </select>
            </div>
            
            <!-- Jenis Kegiatan -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kegiatan</label>
              <select
                v-model="createForm.ref_kegiatan_id"
                required
                :disabled="!createForm.kategori_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                style="max-height: 300px;"
              >
                <option value="">Pilih Jenis Kegiatan</option>
                <option 
                  v-for="keg in kegiatanOptions" 
                  :key="keg.id" 
                  :value="keg.id"
                  class="py-2"
                  :title="keg.nama_kegiatan"
                >
                  {{ truncateText(keg.nama_kegiatan, 80) }} ({{ keg.poin_maksimal }} poin)
                </option>
              </select>
              <p v-if="createForm.ref_kegiatan_id" class="text-xs text-gray-500 mt-1">
                {{ getSelectedKegiatanName() }}
              </p>
            </div>
            
            <!-- Deskripsi -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                v-model="createForm.deskripsi"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Detail kegiatan..."
              ></textarea>
            </div>
            
            <!-- File Upload -->
            <FileUpload
              v-model="modalUploadedFile"
              label="File Bukti"
              :required="true"
              accept=".pdf,.jpg,.jpeg,.png"
              :max-size="5 * 1024 * 1024"
            />
            
            <!-- Error -->
            <div v-if="createError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{{ createError }}</p>
            </div>
            
            <!-- Actions -->
            <div class="flex gap-3">
              <button
                type="submit"
                :disabled="creating"
                class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {{ creating ? 'Menyimpan...' : 'Simpan' }}
              </button>
              <button
                type="button"
                @click="closeCreateModal"
                class="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Trash2, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { kegiatanApi } from '@/api/kegiatan'
import { refApi } from '@/api/ref'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import FileUpload from '@/components/FileUpload.vue'

const router = useRouter()
const auth = useAuthStore()
const kegiatan = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const kategoriList = ref([])
const kegiatanOptions = ref([])
const creating = ref(false)
const createError = ref(null)
const modalUploadedFile = ref(null)

const filters = reactive({
  search: '',
  status: '',
})
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
})
const createForm = reactive({
  kategori_id: '',
  ref_kegiatan_id: '',
  deskripsi: '',
})

const pageTitle = computed(() => {
  return auth.canVerify ? 'Semua Kegiatan' : 'Kegiatan Saya'
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2))
  let end = Math.min(pagination.totalPages, start + maxVisible - 1)
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const revisionNeededCount = computed(() => {
  return kegiatan.value.filter(k => k.status === 'revision_requested').length
})

onMounted(() => {
  fetchKegiatan()
  loadKategori()
})

async function loadKategori() {
  try {
    const { data } = await refApi.getKategori()
    kategoriList.value = data.data || []
  } catch (err) {
    console.error('Failed to load kategori:', err)
  }
}

async function loadKegiatanOptions() {
  if (!createForm.kategori_id) return
  
  try {
    const { data } = await refApi.getKegiatan({ kategori_id: createForm.kategori_id })
    kegiatanOptions.value = data.data || []
    createForm.ref_kegiatan_id = ''
  } catch (err) {
    console.error('Failed to load kegiatan:', err)
  }
}

function closeCreateModal() {
  showCreateModal.value = false
  createForm.kategori_id = ''
  createForm.ref_kegiatan_id = ''
  createForm.deskripsi = ''
  modalUploadedFile.value = null
  createError.value = null
  kegiatanOptions.value = []
}

async function handleCreateSubmit() {
  creating.value = true
  createError.value = null
  
  try {
    // Validate file exists
    if (!modalUploadedFile.value) {
      createError.value = 'File bukti wajib diupload'
      creating.value = false
      return
    }
    
    const formData = new FormData()
    formData.append('ref_kegiatan_id', createForm.ref_kegiatan_id)
    if (createForm.deskripsi) formData.append('deskripsi', createForm.deskripsi)
    formData.append('file', modalUploadedFile.value)
    
    // Debug: log FormData contents
    console.log('Modal form data:', {
      ref_kegiatan_id: createForm.ref_kegiatan_id,
      deskripsi: createForm.deskripsi,
      file: modalUploadedFile.value,
      fileName: modalUploadedFile.value?.name,
      fileSize: modalUploadedFile.value?.size
    })
    
    await kegiatanApi.create(formData)
    toast.success('Kegiatan berhasil ditambahkan')
    closeCreateModal()
    fetchKegiatan()
  } catch (err) {
    createError.value = err.response?.data?.error || 'Gagal menyimpan kegiatan'
    toast.error(createError.value)
  } finally {
    creating.value = false
  }
}

async function fetchKegiatan() {
  loading.value = true
  try {
    const params = {
      limit: pagination.limit,
      offset: (pagination.page - 1) * pagination.limit,
    }
    if (filters.status) params.status = filters.status
    if (filters.search) params.search = filters.search
    
    const { data } = await kegiatanApi.getAll(params)
    kegiatan.value = data.data || []
    
    if (data.pagination) {
      pagination.total = data.pagination.total || 0
      pagination.totalPages = Math.ceil(pagination.total / pagination.limit)
    }
  } catch (err) {
    console.error('Failed to fetch kegiatan:', err)
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.totalPages) return
  pagination.page = page
  fetchKegiatan()
}

async function handleDelete(id) {
  if (!confirm('Yakin ingin menghapus kegiatan ini?')) return
  
  try {
    await kegiatanApi.delete(id)
    kegiatan.value = kegiatan.value.filter(k => k.id !== id)
    toast.success('Kegiatan berhasil dihapus')
  } catch (err) {
    toast.error('Gagal menghapus kegiatan')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID')
}

function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function getSelectedKegiatanName() {
  if (!createForm.ref_kegiatan_id) return ''
  const selected = kegiatanOptions.value.find(k => k.id === createForm.ref_kegiatan_id)
  return selected ? selected.nama_kegiatan : ''
}

function openRevisionModal(item) {
  // Navigate to revision page/form with the kegiatan ID
  router.push(`/kegiatan/${item.id}/revisi`)
}

</script>

<style scoped>
/* Styling for select dropdown to handle long text */
select option {
  padding: 8px 12px;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

/* Ensure dropdown doesn't overflow dialog */
select {
  overflow-y: auto;
}
</style>
