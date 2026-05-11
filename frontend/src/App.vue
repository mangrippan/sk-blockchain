<template>
  <RouterView />
  <Toaster position="top-right" richColors />
</template>

<script setup>
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
</script>
