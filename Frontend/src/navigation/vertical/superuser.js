export default [
    {
        title: 'Dashboard',
        to: {path: '/dashboards/superuser'},
        icon: {icon: 'ri-home-smile-line'},
        roles: ['Superuser'],
    },
    {
        title: 'Hasil Asesmen',
        icon: {icon: 'ri-list-check-3'},
        roles: ['Superuser'],
        children: [
            {
                title: 'LED',
                to: {path: '/led/superuser'},
            },
            {
                title: 'LKPS',
                to: {path: '/lkps/superuser'},
            },
        ],
    },
    {
        title: 'Pengaturan',
        icon: {icon: 'ri-settings-3-line'},
        roles: ['Superuser'],
        children: [
            {
                title: 'Lembaga Pengakreditasi',
                to: {path: '/superuser/pengaturan-superuser/tipe-akreditasi'},
            },
            {
                title: 'Daftar Isian LED',
                to: {path: '/daftar-isian-led'},
            },
            {
                title: 'Jenis Tabel LKPS',
                to: {path: '/jenis-tabel-lkps'},
            },
        ],
    },
    {
        title: 'Akreditasi',
        icon: { icon: 'ri-list-unordered' },
        roles: ['Superuser'],
        children: [
            {
                title: 'Akreditasi Program Studi',
                to: { path: '/akreditasi/superuser' },
            },
            {
                title: 'Akreditasi IPB',
                to: { path: '/akreditasi-ipb' },
            },
        ],
    },
    {
        title: 'Manajemen Pengguna',
        to: {path: '/manajemen-pengguna'},
        icon: {icon: 'ri-group-3-line'},
        roles: ['Superuser'],
    },
    //Penugasan asesor
    {
        title: 'Penugasan Asesor',
        to: {path: '/penugasan-asesor/superuser'},
        icon: {icon: 'ri-user-search-line'},
        roles: ['Superuser'],
    },
    {
        title: 'RTM',
        to: {path: '/rtm'},
        roles: ['Superuser'],
    }
]
