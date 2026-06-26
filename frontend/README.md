# Prima Frontend

Frontend aplikasi Prima menggunakan **Vue 3** + **Vite** + **Tailwind CSS**.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Struktur Folder

```
src/
├── api/              # Axios instance & API clients
├── assets/           # CSS & static assets
├── components/       # Reusable components
├── router/           # Vue Router config
├── stores/           # Pinia stores
├── views/            # Page components
├── App.vue           # Root component
└── main.js           # Entry point
```

## 🎨 Features

- ✅ Vue 3 Composition API (`<script setup>`)
- ✅ Vue Router 4 dengan navigation guards
- ✅ Pinia untuk state management
- ✅ Tailwind CSS untuk styling
- ✅ Axios interceptors untuk JWT authentication
- ✅ Responsive layout (mobile-friendly)

## 🔐 Login Demo

| Role | Email | Password |
|------|-------|----------|
| Dosen | dosen@prima.test | dosen123 |
| Admin SDM | admin@prima.test | admin123 |

## 📄 Pages

1. **Login** - `/login`
2. **Dashboard** - `/`
3. **Kegiatan Saya** - `/kegiatan`
   - List, Create, Detail
4. **Verifikasi** - `/verifikasi` (Admin only)
5. **Profil** - `/profil`

## 🔧 Environment Variables

Create `.env` file:
```
VITE_API_URL=http://localhost:3000/api/v1
```

## 🎯 Tech Stack

- Vue 3
- Vite
- Vue Router 4
- Pinia
- Tailwind CSS
- Axios
- Lucide Icons
- Vue Sonner (toast notifications)
