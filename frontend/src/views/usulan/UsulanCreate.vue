<template>
  <div>
    <div class="mb-6">
      <RouterLink to="/usulan" class="text-blue-600 hover:text-blue-800 text-sm">&larr; Kembali ke Daftar Usulan</RouterLink>
      <h1 class="text-2xl font-bold text-gray-900 mt-2">Ajukan Usulan Kenaikan Pangkat</h1>
    </div>

    <!-- Current Jabatan Info -->
    <div v-if="currentJabatan" class="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="text-2xl">👤</span>
        <div>
          <p class="text-sm text-blue-600 font-medium">Jabatan Saat Ini</p>
          <p class="text-lg font-bold text-blue-900">{{ currentJabatan.nama }}</p>
        </div>
        <div v-if="nextJabatan" class="ml-auto">
          <span class="text-2xl">→</span>
        </div>
        <div v-if="nextJabatan">
          <p class="text-sm text-green-600 font-medium">Jabatan Tujuan</p>
          <p class="text-lg font-bold text-green-900">{{ nextJabatan.nama }}</p>
        </div>
      </div>
      <div v-if="!nextJabatan && !loadingJabatan" class="mt-3 text-amber-700 text-sm">
        ⚠️ Anda sudah berada di jabatan tertinggi (Guru Besar) atau belum ada jabatan tujuan yang tersedia.
      </div>
    </div>

    <!-- KUM Summary -->
    <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Ringkasan KUM Tersedia</h2>
      <ProgressBarKUM :current="kumTotal" :target="kumTarget" />
      <div class="mt-3 space-y-1">
        <p class="text-sm text-gray-600">
          Total KUM tersedia (belum digunakan): <strong class="text-gray-900">{{ kumTotal }}</strong>
        </p>
        <p class="text-sm text-gray-600">
          Syarat minimal untuk {{ nextJabatan?.nama || 'jabatan tujuan' }}: <strong class="text-gray-900">{{ kumTarget }}</strong>
        </p>
        <p v-if="kumTotal >= kumTarget" class="text-sm text-green-600 font-medium">
          ✓ KUM Anda sudah memenuhi syarat!
        </p>
        <p v-else class="text-sm text-red-600 font-medium">
          ✗ KUM Anda belum mencukupi. Masih kurang {{ kumTarget - kumTotal }} poin.
        </p>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Jabatan Tujuan</label>
          <div class="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
            <p v-if="nextJabatan" class="font-medium text-gray-900">{{ nextJabatan.nama }}</p>
            <p v-else-if="loadingJabatan" class="text-gray-500">Memuat...</p>
            <p v-else class="text-gray-500">Tidak tersedia</p>
            <p v-if="nextJabatan" class="text-xs text-gray-500 mt-1">
              Minimum KUM: {{ nextJabatan.min_kum }} | Tingkat: {{ nextJabatan.tingkat }}
            </p>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            ℹ️ Jabatan tujuan otomatis ditentukan berdasarkan jabatan Anda saat ini (kenaikan 1 tingkat)
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
          <textarea
            v-model="form.catatan"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Catatan tambahan untuk usulan..."
          ></textarea>
        </div>
      </div>

      <!-- Kelengkapan Dokumen Administrasi -->
      <div class="mt-6 border-t border-gray-200 pt-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Kelengkapan Dokumen Administrasi</h2>
        <p class="text-sm text-gray-500 mb-4">
          Unggah dokumen berikut sebelum mengajukan usulan. Dokumen bertanda
          <span class="text-red-600 font-medium">*</span> wajib diunggah.
        </p>

        <div v-if="loadingDokumen" class="text-sm text-gray-500">Memuat daftar dokumen...</div>

        <div v-else class="space-y-4">
          <div v-for="jenis in jenisDokumenList" :key="jenis.id">
            <FileUpload
              v-model="dokumenFiles[jenis.id]"
              :label="jenis.nama"
              :required="jenis.is_required"
            />
            <p v-if="jenis.deskripsi" class="mt-1 text-xs text-gray-500">{{ jenis.deskripsi }}</p>
          </div>
        </div>

        <div
          v-if="!loadingDokumen && missingDokumen.length > 0"
          class="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm"
        >
          <p class="font-medium">Dokumen wajib yang belum diunggah:</p>
          <ul class="list-disc list-inside mt-1">
            <li v-for="nama in missingDokumen" :key="nama">{{ nama }}</li>
          </ul>
        </div>
      </div>

      <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
        {{ error }}
      </div>

      <div class="mt-6 flex gap-3">
        <button
          type="submit"
          :disabled="isSubmitting || !nextJabatan || kumTotal < kumTarget || missingDokumen.length > 0"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Mengajukan...' : 'Ajukan Usulan' }}
        </button>
        <RouterLink
          to="/usulan"
          class="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors inline-block text-center"
        >
          Batal
        </RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsulanStore } from '@/stores/usulan'
import { kegiatanApi } from '@/api/kegiatan'
import { refApi } from '@/api/ref'
import api from '@/api/axios'
import ProgressBarKUM from '@/components/ProgressBarKUM.vue'
import FileUpload from '@/components/FileUpload.vue'

const router = useRouter()
const authStore = useAuthStore()
const usulanStore = useUsulanStore()

const kumTotal = ref(0)
const kumTarget = ref(200)
const currentJabatan = ref(null)
const nextJabatan = ref(null)
const loadingJabatan = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

// Administrative documents (dokumen_administrasi)
const jenisDokumenList = ref([])
const loadingDokumen = ref(false)
const dokumenFiles = reactive({}) // { [jenisDokumenId]: File | null }

const missingDokumen = computed(() =>
  jenisDokumenList.value
    .filter((j) => j.is_required && !dokumenFiles[j.id])
    .map((j) => j.nama)
)

const form = reactive({
  catatan: '',
})

async function loadDokumenTypes() {
  loadingDokumen.value = true
  try {
    const { data } = await refApi.getDokumen()
    jenisDokumenList.value = data.data || []
    // Pre-seed reactive keys so v-model binding is reactive for every type
    for (const jenis of jenisDokumenList.value) {
      if (!(jenis.id in dokumenFiles)) dokumenFiles[jenis.id] = null
    }
  } catch (err) {
    console.error('Failed to load jenis dokumen:', err)
    jenisDokumenList.value = []
  } finally {
    loadingDokumen.value = false
  }
}

async function loadJabatanData() {
  loadingJabatan.value = true
  error.value = null
  
  try {
    // Get next jabatan for current user
    const response = await api.get(`/ref/jabatan/next/${authStore.user.id}`)
    nextJabatan.value = response.data.data
    
    if (nextJabatan.value) {
      kumTarget.value = parseFloat(nextJabatan.value.min_kum) || 200
      
      // Get current jabatan info
      const userJabatanResponse = await api.get(`/auth/profile`)
      const userProfile = userJabatanResponse.data.user || userJabatanResponse.data
      
      // Get all jabatan list to find current one
      const jabatanListResponse = await api.get('/ref/jabatan')
      const jabatanList = jabatanListResponse.data.data || []
      currentJabatan.value = jabatanList.find(j => j.tingkat === nextJabatan.value.tingkat - 1)
    }
  } catch (err) {
    console.error('Failed to load jabatan:', err)
    error.value = err.response?.data?.message || err.response?.data?.error || 
                  'Gagal memuat data jabatan. Pastikan Anda sudah memiliki jabatan.'
    nextJabatan.value = null
  } finally {
    loadingJabatan.value = false
  }
}

async function loadAvailableKUM() {
  try {
    const { data } = await kegiatanApi.getDashboardStats()
    // Total poin is the available KUM (kegiatan that haven't been used)
    kumTotal.value = data.stats?.total_poin || data.total_poin || 0
  } catch (err) {
    console.error('Failed to load KUM:', err)
    kumTotal.value = 0
  }
}

async function handleSubmit() {
  if (!nextJabatan.value) {
    error.value = 'Jabatan tujuan tidak tersedia'
    return
  }
  
  if (kumTotal.value < kumTarget.value) {
    error.value = `KUM Anda (${kumTotal.value}) belum mencukupi. Minimal ${kumTarget.value} diperlukan.`
    return
  }

  if (missingDokumen.value.length > 0) {
    error.value = `Dokumen wajib belum lengkap: ${missingDokumen.value.join(', ')}`
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    const formData = new FormData()
    formData.append('jabatan_tujuan_id', nextJabatan.value.id)
    if (form.catatan) formData.append('catatan', form.catatan)
    for (const jenis of jenisDokumenList.value) {
      const file = dokumenFiles[jenis.id]
      if (file) formData.append(`dokumen_${jenis.id}`, file)
    }

    await usulanStore.create(formData)
    router.push('/usulan')
  } catch (err) {
    console.error('Failed to create usulan:', err)
    error.value = err.response?.data?.message || err.response?.data?.error ||
                  'Gagal mengajukan usulan. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadJabatanData(),
    loadAvailableKUM(),
    loadDokumenTypes()
  ])
})
</script>
