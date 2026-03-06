
<script setup>

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  breadcrumb: {
    type: Array,
    required: true,
  },
});

</script>

<template>
  <VCol cols="12">
    <VCard class="pa-6">
      <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6">
        <div class="d-flex flex-column justify-center">
          <h4 class="text-h4">
            {{ props.title }}
          </h4>
          <VBreadcrumbs class="px-0 pt-0" :items="props.breadcrumb" />
        </div>
      </div>
    </VCard>
  </VCol>
</template>

<style scoped lang="scss">

</style>
