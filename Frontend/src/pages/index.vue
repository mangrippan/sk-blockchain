<template>
  <VContainer fluid>
    
  </VContainer>
</template>

<script setup>
  import { authStore } from '@/store/auth'
  import { ref } from "vue";
  import { useRouter } from 'vue-router';
  
  const router = useRouter()

  const role = JSON.parse(localStorage.getItem('user'));
  
  onMounted(() => {
    if (role.jenisPengguna === 'Superuser') {
      router.push('/dashboards/superuser');
    }
  })
</script>

<style scoped>
  .v-card {
    height: 100%;
  }
</style>
