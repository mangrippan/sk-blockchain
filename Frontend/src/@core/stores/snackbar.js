import { defineStore } from 'pinia'

export const useSnackbarStore = defineStore('snackbar', {
    state: () => ({
        isOpen: false,
        message: '',
        title: '',
        status: '',
        customActions: [],
    }),
    actions: {
        showSnackbar({ message, title = '', status = 'info', actions = [] }) {

            this.isOpen = true;
            this.message = message;
            this.title = title;
            this.status = status;
            this.customActions = actions;
        },
        closeSnackbar() {
            this.isOpen = false;
            this.message = '';
            this.title = '';
            this.status = '';
            this.customActions = [];
        },
    },
    persist: true
});
