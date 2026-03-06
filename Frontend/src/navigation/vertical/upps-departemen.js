export default [
    {
        title: 'Dashboard',
        to: { path: '/dashboards/upps' },
        icon: { icon: 'ri-home-smile-line' },
        roles: ['UPPS Departemen'],
    },
    {
        title: 'LED',
        to: { path: '/led/upps' },
        icon: { icon: 'ri-home-smile-line' },
        roles: ['UPPS Departemen'],
    },
    {
        title: 'Hasil Asesmen',
        icon: { icon: 'ri-list-check-3' },
        roles: ['UPPS Departemen'],
        children: [
            {
                title: 'LED',
                to: { path: '/hasil-asesmen/led/upps' },
                icon: { icon: 'ri-list-check-3' },
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
         roles: ['UPPS Departemen'],
    }
]
