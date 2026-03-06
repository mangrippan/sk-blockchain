import { ofetch } from 'ofetch'
import { authStore } from "@/store/auth.js"

export const $api = ofetch.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    async onRequest({ options }) {
        const auth = authStore()
        const accessToken = auth.token
        if (accessToken) {
            options.headers = {
                ...options.headers,
                Authorization: `Bearer ${accessToken}`,
            }
        }
    },
})
