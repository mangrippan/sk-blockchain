<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-6">
      <button
        @click="$router.back()"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali
      </button>
      <h1 class="text-2xl font-bold text-gray-900">
        {{ parentKegiatan?.status === 'revision_requested' ? 'Revisi & Submit Ulang Kegiatan' : 'Edit Kegiatan' }}
      </h1>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="!parentKegiatan" class="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <p class="text-gray-500">Kegiatan tidak ditemukan atau tidak dapat direvisi</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Rejection Notes Alert - only show if there are rejection notes -->
      <div v-if="parentKegiatan.catatan_penolakan" class="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <h3 class="font-semibold text-amber-900 mb-2">Catatan Penolakan</h3>
            <p class="text-amber-800">{{ parentKegiatan.catatan_penolakan }}</p>
            <div class="mt-3 text-sm text-amber-700">
              <p>Ditolak oleh: {{ parentKegiatan.verified_by_name || 'Admin' }}</p>
              <p>Pada: {{ formatDate(parentKegiatan.verified_at) }}</p>
              <p v-if="parentKegiatan.versi > 1" class="mt-1 font-medium">
                Ini adalah revisi ke-{{ parentKegiatan.versi - 1 }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Original Kegiatan Reference -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-3">Kegiatan Asli (Referensi)</h3>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-500">Kategori:</span>
            <p class="font-medium">{{ parentKegiatan.nama_kategori }}</p>
          </div>
          <div>
            <span class="text-gray-500">Jenis Kegiatan:</span>
            <p class="font-medium">{{ parentKegiatan.nama_kegiatan }}</p>
          </div>
          <div>
            <span class="text-gray-500">Poin KUM:</span>
            <p class="font-medium">{{ parentKegiatan.poin_kum }}</p>
          </div>
          <div>
            <span class="text-gray-500">File:</span>
            <p class="font-medium text-blue-600 truncate">{{ parentKegiatan.file_name }}</p>
          </div>
        </div>
        <div v-if="parentKegiatan.deskripsi" class="mt-3 text-sm">
          <span class="text-gray-500">Deskripsi:</span>
          <p class="text-gray-700 mt-1">{{ parentKegiatan.deskripsi }}</p>
        </div>
      </div>

      <!-- Revision Form -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="font-semibold text-gray-900 mb-4">Perbaiki Kegiatan</h3>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Kategori -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span class="text-red-600">*</span>
            </label>
            <select
              v-model="form.kategori_id"
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
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Jenis Kegiatan <span class="text-red-600">*</span>
            </label>
            <select
              v-model="form.ref_kegiatan_id"
              :disabled="!form.kategori_id"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Pilih Jenis Kegiatan</option>
              <option v-for="keg in kegiatanOptions" :key="keg.id" :value="keg.id">
                {{ keg.nama_kegiatan }} ({{ keg.poin_maksimal }} poin)
              </option>
            </select>
          </div>

          <!-- Deskripsi -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              v-model="form.deskripsi"
              rows="4"
              placeholder="Tambahkan deskripsi kegiatan..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          <!-- File Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Dokumen Bukti
            </label>
            
            <div class="space-y-3">
              <!-- File Upload Options -->
              <div class="flex items-center gap-4 text-sm">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="fileOption"
                    type="radio"
                    value="keep"
                    class="w-4 h-4 text-blue-600"
                  />
                  <span>Gunakan file asli</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="fileOption"
                    type="radio"
                    value="new"
                    class="w-4 h-4 text-blue-600"
                  />
                  <span>Upload file baru</span>
                </label>
              </div>

              <!-- Show current file info -->
              <div v-if="fileOption === 'keep'" class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p class="text-blue-900 font-medium">File yang akan digunakan:</p>
                <p class="text-blue-700">{{ parentKegiatan.file_name }}</p>
              </div>

              <!-- File upload component -->
              <FileUpload
                v-if="fileOption === 'new'"
                v-model="form.file"
                accept=".pdf,.jpg,.jpeg,.png"
                :max-size="5 * 1024 * 1024"
                label="Pilih file baru"
                required
              />
            </div>
          </div>

          <!-- Error message -->
          <div v-if="submitError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ submitError }}</p>
          </div>

          <!-- Submit Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {{ submitting ? 'Mengirim...' : (parentKegiatan?.status === 'revision_requested' ? 'Submit Revisi' : 'Submit Perubahan') }}
            </button>
            <button
              type="button"
              @click="$router.back()"
              class="px-6 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>

      <!-- Revision History -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <KegiatanVersionHistory :kegiatan-id="parentKegiatan.id" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { kegiatanApi } from '@/api/kegiatan'
import { refApi } from '@/api/ref'
import FileUpload from '@/components/FileUpload.vue'
import KegiatanVersionHistory from '@/components/kegiatan/KegiatanVersionHistory.vue'

const route = useRoute()
const router = useRouter()

const parentKegiatan = ref(null)
const kategoriList = ref([])
const kegiatanOptions = ref([])
const loading = ref(false)
const submitting = ref(false)
const submitError = ref(null)
const fileOption = ref('keep') // 'keep' or 'new'

const form = reactive({
  kategori_id: '',
  ref_kegiatan_id: '',
  deskripsi: '',
  file: null,
})

onMounted(async () => {
  await loadParentKegiatan()
  await loadKategori()
})

async function loadParentKegiatan() {
  loading.value = true
  try {
    const { data } = await kegiatanApi.getById(route.params.id)
    parentKegiatan.value = data.data

    // Status validation removed - admin and dosen can edit kegiatan regardless of status

    // Pre-fill form with parent data
    form.kategori_id = parentKegiatan.value.ref_kegiatan_id ? 
      (await refApi.getKegiatan({ id: parentKegiatan.value.ref_kegiatan_id }))
        .data.data[0]?.kategori_id : ''
    form.ref_kegiatan_id = parentKegiatan.value.ref_kegiatan_id
    form.deskripsi = parentKegiatan.value.deskripsi || ''

    // Load kegiatan options for the category
    if (form.kategori_id) {
      await loadKegiatanOptions()
    }
  } catch (err) {
    console.error('Failed to load parent kegiatan:', err)
    toast.error('Gagal memuat data kegiatan')
    router.push('/kegiatan')
  } finally {
    loading.value = false
  }
}

async function loadKategori() {
  try {
    const { data } = await refApi.getKategori()
    kategoriList.value = data.data || []
  } catch (err) {
    console.error('Failed to load kategori:', err)
  }
}

async function loadKegiatanOptions() {
  if (!form.kategori_id) return
  
  try {
    const { data } = await refApi.getKegiatan({ kategori_id: form.kategori_id })
    kegiatanOptions.value = data.data || []
  } catch (err) {
    console.error('Failed to load kegiatan options:', err)
  }
}

async function handleSubmit() {
  submitError.value = null
  submitting.value = true

  try {
    // Prepare form data
    const formData = new FormData()
    formData.append('ref_kegiatan_id', form.ref_kegiatan_id)
    if (form.deskripsi) {
      formData.append('deskripsi', form.deskripsi)
    }

    // Add file if user chose to upload new one
    if (fileOption.value === 'new' && form.file) {
      formData.append('dokumen', form.file)
    }

    // Submit revision
    await kegiatanApi.resubmit(route.params.id, formData)
    
    const successMessage = parentKegiatan.value.status === 'revision_requested'
      ? 'Kegiatan berhasil direvisi dan dikirim untuk verifikasi'
      : 'Perubahan kegiatan berhasil dikirim untuk verifikasi'
    toast.success(successMessage)
    router.push('/kegiatan')
  } catch (err) {
    submitError.value = err.response?.data?.error || 'Gagal mengirim perubahan'
    toast.error(submitError.value)
  } finally {
    submitting.value = false
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
</script>
