import { useSnackbarStore } from '@core/stores/snackbar';

export function formatTanggal(tanggal) {
    if (!tanggal) return null;
    const date = new Date(tanggal);
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

//format like 13/01/2025
export function formatTanggalShort(tanggal) {
    if (!tanggal) return null;
    const date = new Date(tanggal);
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

export const formatDateTime = (dateTime) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false };
    return dateTime != null ? new Date(dateTime).toLocaleString('id-ID', options) : null;
};

export function formatBulanTahun(tahun, bulan) {
    if (!bulan || !tahun) {
        return '';
    }

    const date = new Date(tahun, bulan - 1);
    if (isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
    }).format(date);
}

export function formatBulanTahunForm(tahun, bulan) {
    if (!tahun || !bulan) return "";
    const paddedBulan = String(bulan).padStart(2, "0");
    return `${tahun}-${paddedBulan}`;
}

export function formatTanggalForm(tanggal) {
    if (!tanggal) return null;
    return tanggal.split('T')[0];
}

export function formatDateRange(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "-";
    }

    const locale = "id-ID";
    let start, end;

    if (startDate.getTime() === endDate.getTime()) {
        return startDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        start = startDate.getDate().toString();
        end = endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (startDate.getFullYear() === endDate.getFullYear()) {
        start = startDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
        end = endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    } else {
        start = startDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
        end = endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    }

    return `${start} - ${end}`;
}

export function formatUrl(path) {
    if (!path) return '';
    path = String(path);

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    if (path.startsWith('cdn.')) {
        return `https://${path}`;
    }

    return path;
}

export const showErrorNotification = ( message, title=ref("Error!")) => {
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
        message: message,
        title: title,
        status: 'error',
        actions: [{ text: 'Close', callback: () => snackbar.closeSnackbar() }],
    });
};

export const showSuccessNotification = ( message, title=ref("Sukses!")) => {
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
        message: message,
        title: title,
        status: 'success',
        actions: [{ text: 'Close', callback: () => snackbar.closeSnackbar() }],
    });
};
