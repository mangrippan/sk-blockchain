<template>
  <div>
    <div class="mb-6">
      <RouterLink to="/usulan" class="text-blue-600 hover:text-blue-800 text-sm">&larr; Kembali ke Daftar Usulan</RouterLink>
      <h1 class="text-2xl font-bold text-gray-900 mt-2">Ajukan Usulan Kenaikan Pangkat</h1>
    </div>

    <!-- KUM Summary -->
    <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Ringkasan KUM Terverifikasi</h2>
      <ProgressBarKUM :current="kumTotal" :target="kumTarget" />
      <p class="text-sm text-gray-500 mt-2">
        Total KUM terverifikasi: <strong>{{ kumTotal }}</strong> / Syarat minimal: <strong>{{ kumTarget }}</strong>
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Jabatan Tujuan</label>
          <select
            v-model="form.jabatan_tujuan"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">-- Pilih Jabatan --</option>
            <option value="Asisten Ahli">Asisten Ahli (min 100 KUM)</option>
            <option value="Lektor">Lektor (min 200 KUM)</option>
            <option value="Lektor Kepala">Lektor Kepala (min 300 KUM)</option>
            <option value="Guru Besar">Guru Besar (min 400 KUM)</option>
          </select>
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

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dokumen Pendukung (Opsional)</label>
          <input
            type="file"
            accept=".pdf"
            @change="handleFile"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p class="text-xs text-gray-500 mt-1">Format PDF, maksimal 5MB</p>
        </div>
      </div>

      <div v-if="store.error" class="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
        {{ store.error }}
      </div>

      <div class="mt-6 flex gap-3">
        <button
          type="submit"
          :disabled="store.loading"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {{ store.loading ? 'Mengajukan...' : 'Ajukan Usulan' }}
        </button>
        <RouterLink
          to="/usulan"
          class="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Batal
        </RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUsulanStore } from '@/stores/usulan'
import { kegiatanApi } from '@/api/kegiatan'
import ProgressBarKUM from '@/components/ProgressBarKUM.vue'

const router = useRouter()
const store = useUsulanStore()

const kumTotal = ref(0)
const kumTarget = ref(200)

const form = reactive({
  jabatan_tujuan: '',
  catatan: '',
})

const file = ref(null)

function handleFile(e) {
  file.value = e.target.files[0] || null
}

async function handleSubmit() {
  try {
    await store.create({
      jabatan_tujuan: form.jabatan_tujuan,
      total_kum: kumTotal.value,
      catatan: form.catatan,
    })
    router.push('/usulan')
  } catch {
    // error handled by store
  }
}

onMounted(async () => {
  try {
    const { data } = await kegiatanApi.getDashboardStats()
    kumTotal.value = data.stats?.total_poin || data.total_poin || 0
  } catch {
    // fallback
  }
})
</script>
