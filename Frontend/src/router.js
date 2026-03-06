import { createRouter, createWebHistory } from 'vue-router';
import createNew from '@/components/createNew.vue';
import edit from '@/components/edit.vue';

const routes = [
    { path: '/upps/led/createNew', component: createNew },
    { path: '/upps/led/edit/:id', component: edit, props: true },
    // other routes if any
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
