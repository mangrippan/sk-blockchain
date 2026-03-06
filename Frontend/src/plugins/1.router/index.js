import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router/auto'
import { authStore } from '@/store/auth'

const publicRoutes = [
    '/login',
]

function recursiveLayouts(route) {
    if (route.children) {
        for (let i = 0; i < route.children.length; i++)
            route.children[i] = recursiveLayouts(route.children[i])

        return route
    }

    return setupLayouts([route])[0]
}

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior(to) {
        if (to.hash)
            return { el: to.hash, behavior: 'smooth', top: 60 }

        return { top: 0 }
    },
    extendRoutes: pages => [
        ...[...pages].map(route => recursiveLayouts(route)),
    ],
})

router.beforeEach(async (to) => {
    // redirect to login page if not logged in and trying to access a restricted page
    const authRequired = !arrayHasIntersection(publicRoutes, to.matched.map(m => m.path))
    const auth = authStore()

    if (authRequired && !auth.isLogin) {
        return {
            path: '/login',
            query: { returnUrl: to.fullPath }
        }
    }
})

const arrayHasIntersection = (a, b) => a.some(e => b.includes(e))

export { router }
export default function (app) {
    app.use(router)
}
