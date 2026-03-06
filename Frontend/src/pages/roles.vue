<script setup>
import { themeConfig } from '@themeConfig'
import authV2MaskDark from '@images/pages/mask-v2-dark.png'
import authV2MaskLight from '@images/pages/mask-v2-light.png'
import backgorundLogin from '@images/IPB.jpg'
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)
import { authStore } from '@/store/auth'
import { VNodeRenderer } from "@layouts/components/VNodeRenderer.jsx";
import AlertDialog from "@/components/dialogs/AlertDialog.vue";
import { ref } from "vue";
const router = useRouter()

definePage({
  alias: ['/roles'],
  meta: {
    layout: 'blank',
    public: true,
  },
})

const store = authStore()
const roles = ref(store.user.roles || [])

const alertMessage = ref('')
const isAlertDialogVisible = ref(false)
const loading = ref(false)

const onRoleSelect = async (role) => {
  loading.value = true;
  try {
    const isSuccess = await store.setAccess(role); // Tunggu hingga setAccess selesai
    const returnUrl = router.currentRoute.value.query.returnUrl || "/";

    if (isSuccess) {
      if (role.jenisPengguna === 'Superuser') {
        router.push('/dashboards/superuser');
      } else {
        alertMessage.value = "Login Gagal. Anda tidak memiliki akses";
        isAlertDialogVisible.value = true;
      }
    } else {
      alertMessage.value = "Login Gagal, silahkan periksa username atau password Anda";
      isAlertDialogVisible.value = true;
    }
  } catch (error) {
    alertMessage.value = error.message || "Terjadi kesalahan saat login";
    isAlertDialogVisible.value = true;
  }
  finally {
    loading.value = false;
  }
};

const logout = () => {
  store.logout();
  router.push("/login")
};

</script>

<template>
  <a href="javascript:void(0)">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </a>

  <VRow
    no-gutters
    class="auth-wrapper"
  >
    <VCol
      md="8"
      class="d-none d-md-flex position-relative"
    >
      <div
        class="d-flex align-center justify-end w-100 h-100"
        :class="$vuetify.locale.isRtl ? 'pe-10' : 'pe-0'"
      >
        <VImg
          :src="backgorundLogin"
        />
      </div>

      <img
        class="auth-footer-mask"
        height="360"
        :src="authThemeMask"
      >
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
      style="background-color: rgb(var(--v-theme-surface));"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-4"
      >
        <VCardText v-if="!loading">
          <h4 class="text-h4 mb-1">
            Pilih Jenis Pengguna Anda
          </h4>
          <p class="mb-0">
            Silakan pilih salah satu jenis pengguna untuk melanjutkan
          </p>
        </VCardText>
        <VCardText v-else>
        </VCardText>
        <VCardText>
          <div v-if="loading" class="d-flex flex-column align-center mt-4">
            <VProgressCircular indeterminate color="primary" :size="50" />
            <div class="mt-2 text-primary text-center">
              <h5 class="text-h5">
                Harap menunggu. Sedang memproses..
              </h5>
            </div>
          </div>
          <VRow v-else>
            <VCol
              v-for="role in roles"
              :key="role"
              cols="12"
              class="mb-3"
            >
              <VCard
                class="role-card"
                @click="onRoleSelect(role)"
              >
                <VCardText class="justify-text">
                  <strong> {{ role.jenisPengguna }} </strong> <br> {{role.strukturOrganisasi}}
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";

.role-card {
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.1);
  }
}
</style>
