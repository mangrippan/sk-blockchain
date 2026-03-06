
<template>
  <VCard>
    <v-card-title class="custom-title">
      <i class="ri-lightbulb-line"></i> Panduan Singkat
    </v-card-title>
    <v-divider></v-divider>
    <VCardText>This is your second page.</VCardText>
    <VCardText>
      Chocolate sesame snaps pie carrot cake pastry pie lollipop muffin.
      Carrot cake dragée chupa chups jujubes. Macaroon liquorice cookie
      wafer tart marzipan bonbon. Gingerbread jelly-o dragée
      chocolate.
    </VCardText>
  </VCard>
</template>

<script setup>
// No specific script logic is required for this static view
</script>

<style scoped>
.v-card-title {
  display: flex;
  align-items: center;
}
.v-icon {
  font-size: 24px;
}
.custom-title {
  background-color: #1abc9c; /* Change this to your desired background color */
  color: white; /* Optional: Change text color for better contrast */
  display: flex;
  align-items: center;
}
</style>
