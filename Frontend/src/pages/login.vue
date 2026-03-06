<script setup>
import { themeConfig } from '@themeConfig'
import authV2MaskDark from '@images/pages/mask-v2-dark.png'
import authV2MaskLight from '@images/pages/mask-v2-light.png'
import backgorundLogin from '@images/IPB.jpg'
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)
import { authStore } from '@/store/auth'
import {VNodeRenderer} from "@layouts/components/VNodeRenderer.jsx";
import AlertDialog from "@/components/dialogs/AlertDialog.vue";
import { useRouter } from 'vue-router'
import {ref} from "vue";

definePage({
  alias: ['/login'],
  meta: {
    layout: 'blank',
    public: true,
  },
})

const form = ref({
  username: null,
  password: null,
  remember: false,
})

const isPasswordVisible = ref(false)
const loading = ref(false)

const alertMessage = ref('')
const isAlertDialogVisible = ref(false)

const router = useRouter()
const store = authStore()

const onSubmit = async () => {
  loading.value = true;

  try {
    if (!form.value.username || !form.value.password) {
      alertMessage.value = "Username dan password harus diisi";
      isAlertDialogVisible.value = true;
      return;
    }

    const jumlahRole = await store.login({
      Username: form.value.username,
      Password: form.value.password,
    });

    const returnUrl = router.currentRoute.value.query.returnUrl || "/";

    if (jumlahRole === 1) {
      await router.push(returnUrl);
    }
    else if (jumlahRole > 1) {
      await router.push('/roles');
    }
    else {
      alertMessage.value = "Login Gagal, silahkan periksa username atau password Anda";
      isAlertDialogVisible.value = true;
      loading.value = false;
    }
  } catch (error) {
    alertMessage.value = error.message || "Terjadi kesalahan saat login";
    isAlertDialogVisible.value = true;
    loading.value = false;
  }
};

onMounted(() => {
  if (store.isLogin) {
    router.push('/');
  }
});
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
        <VCardText>
          <h4 class="text-h4 mb-1">
            Selamat Datang <br/>di <span class="text-capitalize">{{ themeConfig.app.title }}!</span> 👋🏻
          </h4>
          <p class="mb-0">
            Masuk menggunakan Email atau ID IPB
          </p>
        </VCardText>
        <VCardText>
          <VForm @submit.prevent="onSubmit">
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <VTextField
                  v-model="form.username"
                  autofocus
                  label="Email/ ID IPB"
                  type="text"
                  placeholder="Email/ ID IPB (Khusus civitas IPB)"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <VTextField
                  v-model="form.password"
                  label="Kata Sandi"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div class="d-flex align-center flex-wrap justify-space-between my-5 gap-2">
                  <VCheckbox
                    v-model="form.remember"
                    label="Ingatkan saya"
                  />
                  <a
                    class="text-primary"
                    href="https://apps.ipb.ac.id/Resetpassword"
                  >
                    Lupa kata sandi?
                  </a>
                </div>

                <!-- Loading Spinner -->
                <VBtn block type="submit" :disabled="loading">
                  <span v-if="loading">
                    <VProgressCircular
                      indeterminate
                      color="white"
                      size="20"
                      class="me-2"
                    /> Memuat...
                  </span>
                  <span v-else>Masuk</span>
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <AlertDialog
    v-model:isAlertVisible="isAlertDialogVisible"
    alert-color="error"
    :alert-msg="alertMessage"
  />
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>

