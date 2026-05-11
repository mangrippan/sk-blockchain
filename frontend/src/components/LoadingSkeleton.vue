<template>
  <div class="animate-pulse">
    <div v-if="variant === 'card'" class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <div class="h-4 bg-gray-200 rounded w-24"></div>
        <div class="h-5 w-5 bg-gray-200 rounded"></div>
      </div>
      <div class="h-8 bg-gray-200 rounded w-16"></div>
    </div>
    
    <div v-else-if="variant === 'list'" class="space-y-3">
      <div v-for="i in count" :key="i" class="p-4 bg-white border border-gray-200 rounded-lg">
        <div class="flex items-start justify-between">
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div class="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
    
    <div v-else-if="variant === 'table'" class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left">
                <div class="h-3 bg-gray-200 rounded w-20"></div>
              </th>
              <th class="px-6 py-3 text-left">
                <div class="h-3 bg-gray-200 rounded w-16"></div>
              </th>
              <th class="px-6 py-3 text-left">
                <div class="h-3 bg-gray-200 rounded w-16"></div>
              </th>
              <th class="px-6 py-3 text-left">
                <div class="h-3 bg-gray-200 rounded w-16"></div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="i in count" :key="i">
              <td class="px-6 py-4">
                <div class="space-y-2">
                  <div class="h-4 bg-gray-200 rounded w-40"></div>
                  <div class="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="h-4 bg-gray-200 rounded w-12"></div>
              </td>
              <td class="px-6 py-4">
                <div class="h-6 w-24 bg-gray-200 rounded-full"></div>
              </td>
              <td class="px-6 py-4">
                <div class="h-3 bg-gray-200 rounded w-20"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-else class="space-y-2">
      <div class="h-4 bg-gray-200 rounded w-full"></div>
      <div class="h-4 bg-gray-200 rounded w-5/6"></div>
      <div class="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'text', // text, card, list, table
  },
  count: {
    type: Number,
    default: 3,
  },
})
</script>
