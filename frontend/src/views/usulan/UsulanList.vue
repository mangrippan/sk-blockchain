<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Usulan Kenaikan Pangkat</h1>
      <RouterLink
        v-if="!auth.canVerify"
        to="/usulan/create"
        class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus :size="20" />
        Ajukan Usulan
      </RouterLink>
    </div>

    <!-- Filter -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Cari usulan..."
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          v-model="filters.status"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="diproses">Diproses</option>
          <option value="sk_issued">SK Terbit</option>
          <option value="rejected">Ditolak</option>
        </select>
        <button
          @click="fetchData"
          class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cari
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <LoadingSkeleton v-if="store.loading" variant="table" :count="5" />

      <div v-else-if="store.usulans.length === 0" class="p-8 text-center text-gray-500">
        Tidak ada usulan ditemukan
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
            <th v-if="auth.canVerify" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosen</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jabatan Tujuan</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total KUM</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="(item, idx) in store.usulans" :key="item.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-500">{{ idx + 1 }}</td>
            <td v-if="auth.canVerify" class="px-6 py-4">
              <p class="font-medium text-gray-900">{{ item.nama_dosen || '-' }}</p>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">{{ item.jabatan_tujuan }}</td>
            <td class="px-6 py-4 text-sm text-gray-900">{{ item.total_kum }}</td>
            <td class="px-6 py-4">
              <StatusBadge :status="item.status" />
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ formatDate(item.created_at) }}</td>
            <td class="px-6 py-4 text-right">
              <RouterLink
                :to="`/usulan/${item.id}`"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Detail
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useUsulanStore } from '@/stores/usulan'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const auth = useAuthStore()
const store = useUsulanStore()

const filters = reactive({
  search: '',
  status: '',
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function fetchData() {
  store.fetchAll(filters)
}

onMounted(() => {
  fetchData()
})
</script>
