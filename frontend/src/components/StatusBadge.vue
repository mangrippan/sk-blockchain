<template>
  <span :class="badgeClasses">
    {{ labelText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
})

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  
  const variants = {
    unverified: 'bg-gray-100 text-gray-700',
    verified: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    diproses: 'bg-blue-100 text-blue-700',
    sk_issued: 'bg-purple-100 text-purple-700',
  }
  
  return `${base} ${variants[props.status] || variants.unverified}`
})

const labelText = computed(() => {
  const labels = {
    unverified: 'Belum Diverifikasi',
    verified: 'Terverifikasi',
    rejected: 'Ditolak',
    pending: 'Pending',
    diproses: 'Diproses',
    sk_issued: 'SK Terbit',
  }
  
  return labels[props.status] || props.status
})
</script>
