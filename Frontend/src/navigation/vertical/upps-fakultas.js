export default [
    {
        title: 'Dashboard',
        to: { path: '/dashboards/upps' },
        icon: { icon: 'ri-home-smile-line' },
        roles: ['UPPS Fakultas'],
    },
    {
        title: 'LED',
        to: { path: '/led/upps' },
        icon: { icon: 'ri-list-view' },
        roles: ['UPPS Fakultas'],
    },
    {
        title: 'Hasil Asesmen',
        icon: { icon: 'ri-list-check-3' },
        roles: ['UPPS Fakultas'],
        children: [
            {
                title: 'LED',
                to: { path: '/hasil-asesmen/led/upps' },
            },
            {
                title: 'LKPS',
                to: { path: '/hasil-asesmen/lkps/upps' },
            },
        ],
    },
    {
        title: 'RTM',
        to: { path: '/upps/rtm' },
        roles: ['UPPS Fakultas'],
    }
]
