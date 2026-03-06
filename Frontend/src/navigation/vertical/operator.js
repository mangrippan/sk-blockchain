export default [
    {
        title: 'Dashboard',
        to: { path: '/dashboards/operator' },
        icon: { icon: 'ri-home-smile-line' },
        roles: ['Operator'],
    },
    {
        title: 'LKPS',
        to: { path: '/lkps' },
        icon: { icon: 'ri-file-text-line' },
        roles: ['Operator'],
    },
    {
        title: 'Hasil Esesmen LKPS',
        to: { path: '/hasil-asesmen/lkps/operator' },
        icon: { icon: 'ri-list-check-3' },
        roles: ['Operator'],
    },
    {
        title: 'LED',
        to: {path: '/led/operator'},
        icon: {icon: 'ri-file-paper-2-line'},
        roles: ['Operator'],
    },
    {
        title: 'Audit',
        icon: {icon: 'ri-draft-line'},
        roles: ['Operator'],
        children: [
            {
                title: 'Form 23',
                to: {path: '/form-23/operator'},
            },
            {
                title: 'Form 24',
                to: {path: '/form-24/operator'},
            },
            {
                title: 'Tindak Lanjut',
                to: {path: '/tindak-lanjut/operator'},
            }
        ],
    },
    {
        title: 'Referensi',
        icon: {icon: 'ri-folder-settings-line'},
        roles: ['Operator'],
        children: [
            {
                title: 'DTPS',
                to: {path: '/dtps'},
            },
        ],
    },
]
