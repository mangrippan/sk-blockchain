<script setup>
const props = defineProps({
  isAlertVisible: {
    type: Boolean,
    required: true,
  },
  alertColor: {
    type: String,
    required: true,
  },
  alertMsg: {
    type: String,
    required: true,
  },
})

const emit = defineEmits()

const dialogAlertVisibleUpdate = (value) => {
  emit('update:isAlertVisible', value)
}
</script>

<template>
  <VDialog
    :model-value="props.isAlertVisible"
    @update:model-value="dialogAlertVisibleUpdate"
    max-width="500"
  >
    <VCard>
      <VCardText class="text-center px-10 py-6">
        <VIcon
          v-if="props.alertColor === 'error'"
          icon="ri-close-circle-line"
          size="60"
          class="large-icon mb-4"
          style="color:red"
        />
        <VIcon
          v-else-if="props.alertColor === 'warning'"
          icon="ri-error-warning-line"
          size="60"
          class="large-icon mb-4"
          style="color:orange"
        />
        <VIcon
          v-else-if="props.alertColor === 'success'"
          icon="ri-checkbox-circle-line"
          size="60"
          class="large-icon mb-4"
          style="color:green"
        />
        <VIcon
          v-else-if="props.alertColor === 'info'"
          icon="ri-information-line"
          size="60"
          class="large-icon mb-4"
          style="color:dodgerblue"
        />

        <h1 class="text-h4 mb-4">
          <span v-if="props.alertColor === 'error'">Gagal!</span>
          <span v-else-if="props.alertColor === 'warning'">Perhatian!</span>
          <span v-else-if="props.alertColor === 'success'">Berhasil!</span>
          <span v-else>Informasi</span>
        </h1>

        <p>{{ props.alertMsg }}</p>

        <VBtn
          @click="dialogAlertVisibleUpdate(false)"
        >
          Ok
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
