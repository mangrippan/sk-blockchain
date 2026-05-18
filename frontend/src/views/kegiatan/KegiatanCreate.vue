<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Tambah Kegiatan</h1>
    
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Kategori -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kategori KUM</label>
          <select
            v-model="form.kategori_id"
            @change="loadKegiatan"
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
            v-model="form.ref_kegiatan_id"
            required
            :disabled="!form.kategori_id"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
            style="max-height: 300px;"
          >
            <option value="">Pilih Jenis Kegiatan</option>
            <option 
              v-for="keg in kegiatanList" 
              :key="keg.id" 
              :value="keg.id"
              class="py-2"
              :title="keg.nama_kegiatan"
            >
              {{ truncateText(keg.nama_kegiatan, 80) }} ({{ keg.poin_maksimal }} poin)
            </option>
          </select>
          <p v-if="form.ref_kegiatan_id" class="text-xs text-gray-500 mt-1">
            {{ getSelectedKegiatanName() }}
          </p>
        </div>
        
        <!-- Deskripsi -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            v-model="form.deskripsi"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Detail kegiatan..."
          ></textarea>
        </div>
        
        <!-- File Upload -->
        <FileUpload
          v-model="uploadedFile"
          label="File Bukti"
          :required="true"
          accept=".pdf,.jpg,.jpeg,.png"
          :max-size="5 * 1024 * 1024"
        />
        
        <!-- Error -->
        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {{ loading ? 'Menyimpan...' : 'Simpan' }}
          </button>
          <button
            type="button"
            @click="$router.back()"
            class="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { kegiatanApi } from '@/api/kegiatan'
import { refApi } from '@/api/ref'
import FileUpload from '@/components/FileUpload.vue'

const router = useRouter()
const kategoriList = ref([])
const kegiatanList = ref([])
const loading = ref(false)
const error = ref(null)
const uploadedFile = ref(null)

const form = reactive({
  kategori_id: '',
  ref_kegiatan_id: '',
  deskripsi: '',
})

onMounted(async () => {
  try {
    const { data } = await refApi.getKategori()
    kategoriList.value = data.data || []
  } catch (err) {
    console.error('Failed to load kategori:', err)
  }
})

async function loadKegiatan() {
  if (!form.kategori_id) return
  
  try {
    const { data } = await refApi.getKegiatan({ kategori_id: form.kategori_id })
    kegiatanList.value = data.data || []
    form.ref_kegiatan_id = ''
  } catch (err) {
    console.error('Failed to load kegiatan:', err)
  }
}

async function handleSubmit() {
  loading.value = true
  error.value = null
  
  try {
    // Validate file exists
    if (!uploadedFile.value) {
      error.value = 'File bukti wajib diupload'
      loading.value = false
      return
    }
    
    // Create FormData for file upload
    const formData = new FormData()
    formData.append('ref_kegiatan_id', form.ref_kegiatan_id)
    if (form.deskripsi) formData.append('deskripsi', form.deskripsi)
    formData.append('file', uploadedFile.value)
    
    // Debug: log FormData contents
    console.log('Form data:', {
      ref_kegiatan_id: form.ref_kegiatan_id,
      deskripsi: form.deskripsi,
      file: uploadedFile.value,
      fileName: uploadedFile.value?.name,
      fileSize: uploadedFile.value?.size
    })
    
    await kegiatanApi.create(formData)
    toast.success('Kegiatan berhasil ditambahkan')
    router.push('/kegiatan')
  } catch (err) {
    error.value = err.response?.data?.error || 'Gagal menyimpan kegiatan'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function getSelectedKegiatanName() {
  if (!form.ref_kegiatan_id) return ''
  const selected = kegiatanList.value.find(k => k.id === form.ref_kegiatan_id)
  return selected ? selected.nama_kegiatan : ''
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

/* Ensure dropdown doesn't overflow */
select {
  overflow-y: auto;
}
</style>
