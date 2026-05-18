<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Audit Trail - Blockchain Verification</h1>
      <p class="text-gray-600 mt-1">Verifikasi audit trail dari blockchain untuk compliance & investigasi</p>
    </div>

    <!-- Info Card -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-3">
        <div class="text-blue-600 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-medium text-blue-900 mb-1">Akses Audit Trail</h3>
          <p class="text-sm text-blue-700">
            Anda memiliki akses ke semua audit trail untuk keperluan compliance, investigasi, dan verifikasi data blockchain. Semua perubahan tercatat secara immutable di blockchain.
          </p>
        </div>
      </div>
    </div>

    <!-- Search Box -->
    <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Cari Audit Trail</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Usulan ID / Email Dosen</label>
          <div class="flex gap-3">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Masukkan ID usulan atau email dosen..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              @keyup.enter="searchAuditTrail"
            />
            <button
              @click="searchAuditTrail"
              :disabled="loading"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {{ loading ? 'Mencari...' : '🔍 Cari' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="results.length > 0" class="bg-white rounded-lg border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        Hasil Pencarian
        <span class="text-sm font-normal text-gray-500">({{ results.length }} usulan)</span>
      </h2>
      
      <div class="space-y-3">
        <RouterLink
          v-for="usulan in results"
          :key="usulan.id"
          :to="`/usulan/${usulan.id}`"
          class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="font-semibold text-gray-900">{{ usulan.nama_dosen }}</h3>
                <span
                  class="text-xs px-2 py-1 rounded-full font-medium"
                  :class="{
                    'bg-yellow-100 text-yellow-700': usulan.status === 'pending',
                    'bg-blue-100 text-blue-700': usulan.status === 'diproses',
                    'bg-green-100 text-green-700': usulan.status === 'sk_issued',
                    'bg-red-100 text-red-700': usulan.status === 'ditolak'
                  }"
                >
                  {{ usulan.status }}
                </span>
              </div>
              <div class="text-sm text-gray-600 space-y-1">
                <p>📧 {{ usulan.nip_nidn }}</p>
                <p>🎯 Jabatan: {{ usulan.jabatan_tujuan }} ({{ usulan.total_poin_diajukan }} poin)</p>
                <p>📅 Diajukan: {{ formatDate(usulan.created_at) }}</p>
                <p v-if="usulan.blockchain_tx" class="font-mono text-xs text-gray-500">
                  ⛓️ TX: {{ usulan.blockchain_tx.substring(0, 16) }}...
                </p>
              </div>
            </div>
            <div class="text-blue-600 hover:text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && searchQuery" class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div class="text-gray-400 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Tidak Ada Hasil</h3>
      <p class="text-gray-600">Tidak ditemukan usulan dengan kriteria pencarian tersebut</p>
    </div>

    <!-- Instructions -->
    <div v-else class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div class="text-gray-400 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Cara Menggunakan Audit Trail</h3>
      <div class="text-gray-600 space-y-2 max-w-xl mx-auto">
        <p>1. Masukkan <strong>ID usulan</strong> atau <strong>email dosen</strong> di kolom pencarian</p>
        <p>2. Klik tombol <strong>Cari</strong> untuk mencari usulan</p>
        <p>3. Klik usulan untuk melihat <strong>complete audit trail</strong></p>
        <p>4. Verifikasi data dengan <strong>blockchain records</strong> (immutable proof)</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usulanApi } from '@/api/usulan'

const searchQuery = ref('')
const loading = ref(false)
const results = ref([])

async function searchAuditTrail() {
  if (!searchQuery.value.trim()) return
  
  loading.value = true
  try {
    const { data } = await usulanApi.getAll()
    
    // Filter by search query
    // ID: prefix match (startsWith) - lebih akurat untuk UUID
    // NIP/Email: partial match (includes) - bisa search nama tengah
    const query = searchQuery.value.trim().toLowerCase()
    
    results.value = data.data.filter(u => 
      u.id.toLowerCase().startsWith(query) || 
      u.nip_nidn?.toLowerCase().includes(query)
    )
  } catch (error) {
    console.error('Search error:', error)
    results.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  
  // Handle Protobuf Timestamp format from blockchain (Fabric)
  if (typeof dateStr === 'object' && dateStr.seconds !== undefined) {
    const milliseconds = dateStr.seconds * 1000 + (dateStr.nanos || 0) / 1000000
    return new Date(milliseconds).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
