<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Kegiatan Saya</h1>
      <button
        @click="$router.push('/kegiatan/create')"
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
          <option value="rejected">Ditolak</option>
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
      <div v-if="loading" class="p-8 text-center text-gray-500">
        Loading...
      </div>
      
      <div v-else-if="kegiatan.length === 0" class="p-8 text-center text-gray-500">
        Tidak ada kegiatan ditemukan
      </div>
      
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
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
            class="hover:bg-gray-50 cursor-pointer"
            @click="$router.push(`/kegiatan/${item.id}`)"
          >
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
                @click.stop="handleDelete(item.id)"
                class="text-red-600 hover:text-red-700"
              >
                <Trash2 :size="18" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import { kegiatanApi } from '@/api/kegiatan'
import StatusBadge from '@/components/StatusBadge.vue'

const kegiatan = ref([])
const loading = ref(false)
const filters = reactive({
  search: '',
  status: '',
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

async function handleDelete(id) {
  if (!confirm('Yakin ingin menghapus kegiatan ini?')) return
  
  try {
    await kegiatanApi.delete(id)
    kegiatan.value = kegiatan.value.filter(k => k.id !== id)
  } catch (err) {
    alert('Gagal menghapus kegiatan')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID')
}
</script>
