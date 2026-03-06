<script setup>
import { useSnackbarStore } from '@core/stores/snackbar';

const snackbar = useSnackbarStore();
</script>

<template>
  <VSnackbar v-model="snackbar.isOpen"
             :color="snackbar.status"
             :timeout="3000"
             variant="flat"
             class="customSnackbar"
             location="top">
    <h3 class="mb-2">{{ snackbar.title }}</h3>
    <p>{{ snackbar.message }}</p>
    <template #actions>
      <VBtn
        v-for="action in snackbar.customActions"
        :key="action.text"
        variant="outlined"
        color="white"
        @click="action.callback"
      >
        {{ action.text }}
      </VBtn>
    </template>
  </VSnackbar>
</template>
