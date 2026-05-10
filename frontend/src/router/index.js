import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'kegiatan',
        name: 'kegiatan',
        component: () => import('@/views/kegiatan/KegiatanList.vue'),
      },
      {
        path: 'kegiatan/create',
        name: 'kegiatan-create',
        component: () => import('@/views/kegiatan/KegiatanCreate.vue'),
      },
      {
        path: 'kegiatan/:id',
        name: 'kegiatan-detail',
        component: () => import('@/views/kegiatan/KegiatanDetail.vue'),
      },
      {
        path: 'verifikasi',
        name: 'verifikasi',
        component: () => import('@/views/verifikasi/VerifikasiList.vue'),
        meta: { roles: ['admin_sdm', 'pimpinan', 'superadmin'] },
      },
      {
        path: 'profil',
        name: 'profil',
        component: () => import('@/views/profil/ProfilView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard
router.beforeEach((to) => {
  const auth = useAuthStore()
  
  // Redirect to dashboard if logged in and trying to access login
  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return '/'
  }
  
  // Redirect to login if not authenticated
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }
  
  // Check role-based access
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return '/'
  }
})

export default router
