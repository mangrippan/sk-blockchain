export default [
    {
        title: 'Dashboard',
        to: { path: '/dashboards/asesor' },
        icon: { icon: 'ri-home-smile-line' },
        roles: ['Asesor Program Studi'],
    },
    {
        title: 'LED',
        to: { path: '/led/asesor' },
        icon: { icon: 'ri-file-text-line' },
        roles: ['Asesor Program Studi'],
    },
    {
        title: 'LKPS',
        to: { path: '/lkps/asesor' },
        icon: { icon: 'ri-list-check-3' },
        roles: ['Asesor Program Studi'],
    },
    {
        title: 'Audit',
        icon: {icon: 'ri-draft-line'},
        roles: ['Asesor Program Studi'],
        children: [
            {
                title: 'Form 23',
                to: {path: '/asesor/form-23'},
            },
            {
                title: 'Form 24',
                to: {path: '/asesor/form-24'},
            },
            {
                title: 'Tindak Lanjut',
                to: {path: '/asesor/tindak-lanjut'},
            },
        ],
    },
    {
        title: 'Penugasan Asesor',
        to: { path: '/penugasan-asesor/asesor' },
        icon: { icon: 'ri-user-search-line' },
        roles: ['Asesor Program Studi'],
    },
    {
        title: 'Laporan Hasil Audit',
        to: {path: '/laporan-hasil-audit'},
        icon: {icon: 'ri-user-search-line'},
        roles: ['Asesor Program Studi'],
    }
]
