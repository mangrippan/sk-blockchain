<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </label>
    
    <div
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : file
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 hover:border-gray-400'
      ]"
      @click="$refs.fileInput.click()"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        class="hidden"
        @change="handleFileSelect"
      />
      
      <div v-if="!file">
        <Upload class="mx-auto h-12 w-12 text-gray-400" />
        <p class="mt-2 text-sm text-gray-600">
          <span class="font-medium text-blue-600">Klik untuk upload</span>
          atau drag & drop
        </p>
        <p class="mt-1 text-xs text-gray-500">
          {{ acceptText }} (Max {{ maxSizeMB }}MB)
        </p>
      </div>
      
      <div v-else class="flex items-center justify-center gap-3">
        <FileText class="h-8 w-8 text-green-600" />
        <div class="text-left flex-1">
          <p class="text-sm font-medium text-gray-900">{{ file.name }}</p>
          <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
        </div>
        <button
          @click.stop="removeFile"
          class="text-red-600 hover:text-red-700"
          type="button"
        >
          <X :size="20" />
        </button>
      </div>
    </div>
    
    <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Upload, FileText, X } from 'lucide-vue-next'

const props = defineProps({
  label: String,
  accept: {
    type: String,
    default: '.pdf,.jpg,.jpeg,.png',
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024, // 5MB
  },
  required: Boolean,
  modelValue: File,
})

const emit = defineEmits(['update:modelValue'])

const file = ref(props.modelValue)
const isDragging = ref(false)
const error = ref(null)

// Watch for external changes to modelValue (like form reset)
watch(() => props.modelValue, (newValue) => {
  file.value = newValue
})

const maxSizeMB = computed(() => Math.round(props.maxSize / (1024 * 1024)))

const acceptText = computed(() => {
  const types = props.accept.split(',').map(t => t.trim().replace('.', '').toUpperCase())
  return types.join(', ')
})

function handleDrop(e) {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    validateAndSetFile(files[0])
  }
}

function handleFileSelect(e) {
  const files = e.target.files
  if (files.length > 0) {
    validateAndSetFile(files[0])
  }
}

function validateAndSetFile(selectedFile) {
  error.value = null
  
  // Check file type
  const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase()
  const allowedTypes = props.accept.split(',').map(t => t.trim())
  if (!allowedTypes.includes(fileExt)) {
    error.value = `File harus berformat ${acceptText.value}`
    return
  }
  
  // Check file size
  if (selectedFile.size > props.maxSize) {
    error.value = `Ukuran file maksimal ${maxSizeMB.value}MB`
    return
  }
  
  file.value = selectedFile
  console.log('FileUpload: emitting file', selectedFile.name, selectedFile.size)
  emit('update:modelValue', selectedFile)
}

function removeFile() {
  file.value = null
  error.value = null
  emit('update:modelValue', null)
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>
