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
    revision_requested: 'bg-amber-100 text-amber-700',
  }
  
  return `${base} ${variants[props.status] || variants.unverified}`
})

const labelText = computed(() => {
  const labels = {
    unverified: 'Belum Diverifikasi',
    verified: 'Terverifikasi',
    rejected: 'Ditolak',
    revision_requested: 'Perlu Revisi',
  }
  
  return labels[props.status] || props.status
})
</script>
