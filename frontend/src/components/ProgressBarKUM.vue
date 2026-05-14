<template>
  <div>
    <div class="flex justify-between text-sm mb-1">
      <span class="text-gray-600">Progress KUM</span>
      <span class="font-medium" :class="percentage >= 100 ? 'text-green-600' : 'text-blue-600'">
        {{ percentage }}%
      </span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-3">
      <div
        class="h-3 rounded-full transition-all duration-500"
        :class="percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'"
        :style="{ width: Math.min(percentage, 100) + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: { type: Number, default: 0 },
  target: { type: Number, default: 200 },
})

const percentage = computed(() => {
  if (props.target <= 0) return 0
  return Math.round((props.current / props.target) * 100)
})
</script>
