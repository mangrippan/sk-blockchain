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
          >
            <option value="">Pilih Jenis Kegiatan</option>
            <option v-for="keg in kegiatanList" :key="keg.id" :value="keg.id">
              {{ keg.nama_kegiatan }} (Max: {{ keg.poin_maksimal }} poin)
            </option>
          </select>
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
        
        <!-- File Upload Placeholder -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">File Bukti</label>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p class="text-sm text-gray-500">Upload feature akan diimplementasi nanti</p>
          </div>
        </div>
        
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
import { kegiatanApi } from '@/api/kegiatan'
import { refApi } from '@/api/ref'

const router = useRouter()
const kategoriList = ref([])
const kegiatanList = ref([])
const loading = ref(false)
const error = ref(null)

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
    await kegiatanApi.create(form)
    router.push('/kegiatan')
  } catch (err) {
    error.value = err.response?.data?.error || 'Gagal menyimpan kegiatan'
  } finally {
    loading.value = false
  }
}
</script>
