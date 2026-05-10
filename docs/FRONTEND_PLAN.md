# Frontend Development Plan - ChainRank
## UI: Clean & Simple Design (Vue 3)

---

## 🎯 Stack Teknologi

| Komponen | Pilihan | Alasan |
|----------|---------|--------|
| Framework | Vue 3 + Vite | Composition API, ringan, mudah dipelajari |
| Styling | Tailwind CSS | Utility-first, clean output |
| UI Components | shadcn-vue | Minimalis, accessible, customizable |
| State | Pinia | Official Vue store, simple & typed |
| HTTP Client | Axios | Interceptor untuk JWT |
| Routing | Vue Router 4 | Official, nested routes, navigation guards |
| Icons | Lucide Vue Next | Clean line icons |
| Toast/Notif | Vue Sonner | Simple notifications |

---

## 📐 Design Principles

1. **Whitespace heavy** — banyak ruang napas antar elemen
2. **Neutral colors** — gray scale + 1 accent color (blue)
3. **Consistent typography** — Inter font, max 3 ukuran per halaman
4. **Minimal decoration** — no gradients, no shadows berlebihan
5. **Data-focused** — tabel dan card yang readable

---

## 🗂️ Struktur Folder

```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── components.json          # shadcn-vue config
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.js
    ├── App.vue
    ├── assets/
    │   └── main.css         # Tailwind imports
    ├── api/
    │   ├── axios.js          # Axios instance + interceptor
    │   ├── auth.js           # Login, register, me
    │   ├── kegiatan.js       # CRUD kegiatan
    │   └── ref.js            # Reference data
    ├── stores/
    │   └── auth.js           # Pinia auth store
    ├── components/
    │   ├── ui/               # shadcn-vue components
    │   ├── AppLayout.vue     # Sidebar + topbar wrapper
    │   ├── AppSidebar.vue
    │   ├── AppTopbar.vue
    │   ├── DataTable.vue     # Reusable table
    │   ├── StatusBadge.vue   # Status chip
    │   └── FileUpload.vue    # Drag & drop upload
    ├── views/
    │   ├── LoginView.vue
    │   ├── DashboardView.vue
    │   ├── kegiatan/
    │   │   ├── KegiatanList.vue
    │   │   ├── KegiatanCreate.vue
    │   │   └── KegiatanDetail.vue
    │   ├── verifikasi/
    │   │   ├── VerifikasiList.vue
    │   │   └── VerifikasiDetail.vue
    │   └── profil/
    │       └── ProfilView.vue
    ├── router/
    │   └── index.js          # Vue Router config + guards
    └── lib/
        └── utils.js          # cn() helper, formatters
```

---

## 📄 Halaman & Fitur

### 1. Login Page
- Form email + password
- Clean center-aligned card
- Error message inline
- Redirect ke dashboard setelah login

### 2. Dashboard
- Statistik ringkas (4 stat cards):
  - Total kegiatan
  - Menunggu verifikasi
  - Terverifikasi
  - Total poin KUM
- Recent activity list (5 kegiatan terbaru)

### 3. Kegiatan (Dosen)
- **List**: Tabel dengan search, filter status, pagination
- **Create**: Form multi-step atau single form:
  - Pilih kategori → pilih jenis kegiatan
  - Input poin KUM
  - Deskripsi
  - Upload file bukti (drag & drop)
- **Detail**: Informasi lengkap + status + histori verifikasi

### 4. Verifikasi (Admin SDM / Pimpinan)
- **List**: Tabel kegiatan yang perlu diverifikasi
- **Detail**: Lihat dokumen + approve/reject dengan catatan

### 5. Profil
- Info user (NIP, nama, role, email)
- Ringkasan poin KUM per kategori

---

## 🎨 Color Palette

```
Background:  #FFFFFF (white)
Surface:     #F9FAFB (gray-50)
Border:      #E5E7EB (gray-200)
Text:        #111827 (gray-900)
Text Muted:  #6B7280 (gray-500)
Primary:     #2563EB (blue-600)
Success:     #16A34A (green-600)
Warning:     #D97706 (amber-600)
Danger:      #DC2626 (red-600)
```

---

## 📅 Timeline Pengembangan (1 Minggu)

### Hari 1: Setup & Layout
- [ ] Init Vite + React project
- [ ] Install Tailwind CSS + shadcn/ui
- [ ] Setup routing (React Router)
- [ ] Buat Layout (Sidebar + Topbar)
- [ ] Setup Axios instance + interceptor JWT

### Hari 2: Auth & Dashboard
- [ ] Login page + integrasi API
- [ ] Auth store (Zustand)
- [ ] Protected routes
- [ ] Dashboard page dengan stat cards

### Hari 3: Kegiatan CRUD
- [ ] Kegiatan list page (tabel + filter + pagination)
- [ ] Kegiatan create form (+ file upload)
- [ ] Kegiatan detail page

### Hari 4: Verifikasi & Admin
- [ ] Verifikasi list page (admin view)
- [ ] Verifikasi detail + approve/reject
- [ ] Role-based sidebar menu

### Hari 5: Polish & Testing
- [ ] Profil page
- [ ] Loading states & error handling
- [ ] Responsive design check
- [ ] Final testing end-to-end

---

## 🧩 Komponen Kunci

### Layout (Sidebar)
```
┌──────────────────────────────────────┐
│  ┌─────┐  ChainRank    [Avatar ▼]   │
│  │     │                             │
│  │ S   │  ┌──────────────────────┐   │
│  │ I   │  │                      │   │
│  │ D   │  │    CONTENT AREA      │   │
│  │ E   │  │                      │   │
│  │ B   │  │                      │   │
│  │ A   │  │                      │   │
│  │ R   │  │                      │   │
│  │     │  └──────────────────────┘   │
│  └─────┘                             │
└──────────────────────────────────────┘
```

### Sidebar Menu Items
- **Dosen**: Dashboard, Kegiatan Saya, Profil
- **Admin SDM**: Dashboard, Verifikasi, Semua Kegiatan, Profil
- **Pimpinan**: Dashboard, Verifikasi, Laporan, Profil

### Data Table
- Header dengan search bar
- Column sorting
- Status badge (colored chips)
- Row actions (view, edit, delete)
- Pagination (prev/next + page numbers)

### Status Badges
```
Unverified  → Gray chip
Verified    → Green chip  
Rejected    → Red chip
Revision    → Amber chip
```

---

## 🔌 API Integration Map

| Page | Endpoint | Method |
|------|----------|--------|
| Login | `/api/v1/auth/login` | POST |
| Dashboard stats | `/api/v1/kegiatan?limit=5` | GET |
| Kegiatan list | `/api/v1/kegiatan` | GET |
| Kegiatan create | `/api/v1/kegiatan` | POST |
| Kegiatan detail | `/api/v1/kegiatan/:id` | GET |
| Verifikasi | `/api/v1/kegiatan/:id/verify` | PUT |
| Delete kegiatan | `/api/v1/kegiatan/:id` | DELETE |
| Ref kategori | `/api/v1/ref/kategori` | GET |
| Ref kegiatan | `/api/v1/ref/kegiatan` | GET |
| User profile | `/api/v1/auth/me` | GET |

---

## ⚡ Quick Start Commands

```bash
# Init project
cd frontend
npm create vite@latest . -- --template vue
npm install

# Dependencies
npm install vue-router@4 pinia axios
npm install -D tailwindcss @tailwindcss/vite
npx shadcn-vue@latest init
npm install lucide-vue-next vue-sonner
npm install -D @vueuse/core          # Composable utilities

# Dev server
npm run dev
```

---

## 🧩 Contoh Code Snippets

### Pinia Auth Store (`src/stores/auth.js`)
```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin_sdm')

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isAuthenticated, isAdmin, login, logout }
})
```

### Vue Router Guard (`src/router/index.js`)
```js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
      { path: 'kegiatan', name: 'kegiatan', component: () => import('@/views/kegiatan/KegiatanList.vue') },
      { path: 'kegiatan/create', name: 'kegiatan-create', component: () => import('@/views/kegiatan/KegiatanCreate.vue') },
      { path: 'kegiatan/:id', name: 'kegiatan-detail', component: () => import('@/views/kegiatan/KegiatanDetail.vue') },
      { path: 'verifikasi', name: 'verifikasi', component: () => import('@/views/verifikasi/VerifikasiList.vue'), meta: { roles: ['admin_sdm', 'pimpinan'] } },
      { path: 'profil', name: 'profil', component: () => import('@/views/profil/ProfilView.vue') },
    ],
  },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) return '/'
})

export default router
```

### Axios Interceptor (`src/api/axios.js`)
```js
import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    }
    return Promise.reject(err)
  }
)

export default api
```

---

## 📝 Notes

- Gunakan `localStorage` untuk simpan JWT token
- Auto-redirect ke login jika token expired (401 response)
- Semua form validasi di client-side sebelum submit
- File upload max 5MB, format: PDF, JPG, PNG
- Mobile responsive (sidebar collapse ke hamburger menu)
- Gunakan `<script setup>` syntax untuk semua komponen (Vue 3 best practice)
- Composables di `src/composables/` untuk shared logic (opsional)
