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
        
        <!-- File Bukti -->
        <div v-if="kegiatan.file_name" class="border-t border-gray-200 pt-4">
          <p class="text-sm text-gray-500 mb-2">File Bukti</p>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FileText class="text-gray-400" :size="24" />
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ kegiatan.file_name }}</p>
              <p class="text-xs text-gray-500">{{ formatFileSize(kegiatan.file_size) }}</p>
            </div>
            <div class="flex gap-2">
              <button
                v-if="canPreview(kegiatan.file_name)"
                @click="previewFile"
                class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Preview
              </button>
              <button
                @click="downloadFile"
                class="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
              >
                <Download :size="16" />
                Download
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="kegiatan.catatan_penolakan" class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-sm font-medium text-amber-900 mb-1">Catatan Penolakan</p>
          <p class="text-sm text-amber-700">{{ kegiatan.catatan_penolakan }}</p>
        </div>
      </div>
      
      <!-- File Preview Modal -->
      <div
        v-if="showPreview"
        class="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4"
        @click.self="showPreview = false"
      >
        <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div class="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">{{ kegiatan.file_name }}</h3>
            <button @click="showPreview = false" class="text-gray-600 hover:text-gray-900">
              <X :size="20" />
            </button>
          </div>
          <div class="flex-1 overflow-auto p-4 bg-gray-50">
            <iframe
              v-if="isPDF(kegiatan.file_name)"
              :src="fileUrl"
              class="w-full h-full min-h-[600px] border-0"
            ></iframe>
            <img
              v-else
              :src="fileUrl"
              :alt="kegiatan.file_name"
              class="max-w-full mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-12">
      <p class="text-gray-500">Kegiatan tidak ditemukan</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, FileText, Download, X } from 'lucide-vue-next'
import { kegiatanApi } from '@/api/kegiatan'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const kegiatan = ref(null)
const loading = ref(false)
const showPreview = ref(false)

const fileUrl = computed(() => {
  if (!kegiatan.value?.file_path) return ''
  const filename = kegiatan.value.file_path.split('/').pop()
  return `http://localhost:3000/uploads/${filename}`
})

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

function formatFileSize(bytes) {
  if (!bytes) return '-'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function canPreview(filename) {
  if (!filename) return false
  const ext = filename.split('.').pop().toLowerCase()
  return ['pdf', 'jpg', 'jpeg', 'png'].includes(ext)
}

function isPDF(filename) {
  if (!filename) return false
  return filename.split('.').pop().toLowerCase() === 'pdf'
}

function previewFile() {
  showPreview.value = true
}

function downloadFile() {
  if (!fileUrl.value) return
  const link = document.createElement('a')
  link.href = fileUrl.value
  link.download = kegiatan.value.file_name
  link.click()
}
</script>
