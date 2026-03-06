import {formatTanggal, formatBulanTahun, formatUrl, formatTanggalForm, formatBulanTahunForm, formatDateTime} from '@/utils/function.js';

export const globalUtils = {
    install(app) {
        app.config.globalProperties.$formatTanggal = formatTanggal;
        app.config.globalProperties.$formatBulanTahun = formatBulanTahun();
        app.config.globalProperties.$formatBulanTahunForm = formatBulanTahunForm();
        app.config.globalProperties.$formatTanggalForm = formatTanggalForm;
        app.config.globalProperties.$formatUrl = formatUrl;
        app.config.globalProperties.$formatDateTime = formatDateTime;
    },
};
