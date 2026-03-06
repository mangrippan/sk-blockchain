import { defineStore } from 'pinia'

export const authStore = defineStore('auth', {
    persist: true,
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        isLogin: localStorage.getItem('isLogin') === 'true' || false,
        jenisPengguna: JSON.parse(localStorage.getItem('jenisPengguna')) || null,
    }),
    actions: {
        setToken(token) {
            this.token = token
            localStorage.setItem('token', token)
        },

        setUser(user) {
            this.user = user
            localStorage.setItem('user', JSON.stringify(user))
        },

        setLogin() {
            this.isLogin = true
            localStorage.setItem('isLogin', 'true')
        },

        logout() {
            this.token = null
            this.user = null
            this.isLogin = false
            localStorage.clear()
        },

        getToken() {
            return this.token;
        },
        
        getUser() {
            return this.user;
        },
        
        async login(payload) {
            try {
                const response = await useApi('/Account/Login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (response && response.data.value && response.response.value.ok) {
                    this.setToken(response.data.value.jwt);
                    this.setUser({
                        penggunaId: response.data.value.penggunaId,
                        orangId: response.data.value.orangId,
                        username: response.data.value.username,
                        nama: response.data.value.nama,
                        nip: response.data.value.nip,
                        strukturOrganisasiId: response.data.value.strukturOrganisasiId,
                        strukturOrganisasi: response.data.value.strukturOrganisasi,
                        strataId: response.data.value.strataId,
                        roles: response.data.value.roles,
                        jenisPengguna: response.data.value.jenisPengguna,
                        jenisPenggunaId: response.data.value.jenisPenggunaId,
                    });
                    this.setLogin();

                    const jumlahRoles = response.data.value.roles.length;
                    if(jumlahRoles === 0){
                        this.logout()
                        throw new Error('Anda tidak memiliki akses di sistem ini');
                    }

                    return jumlahRoles;
                } else {
                    let error = await response.response.value.json();
                    this.logout()
                    throw new Error(error.Error || 'Terjadi kesalahan');
                }
            } catch (error) {
                throw new Error(error || 'Failed to login');
            }
        },

        async setAccess(payload) {
            try {
                const hakAksesId = payload.hakAksesId;
                const response = await useApi(`/Account/GetAuthorize?hakAksesId=${hakAksesId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`,
                    }
                });

                if (response && response.data.value && response.response.value.ok) {
                    this.setToken(response.data.value.jwt);
                    this.setUser({
                        penggunaId: response.data.value.penggunaId,
                        orangId: response.data.value.orangId,
                        username: response.data.value.username,
                        nama: response.data.value.nama,
                        nip: response.data.value.nip,
                        strukturOrganisasiId: response.data.value.strukturOrganisasiId,
                        strukturOrganisasi: response.data.value.strukturOrganisasi,
                        strataId: response.data.value.strataId,
                        roles: response.data.value.roles,
                        jenisPengguna: response.data.value.jenisPengguna,
                        jenisPenggunaId: response.data.value.jenisPenggunaId,
                    });
                    this.setLogin();

                    return true;
                } else {
                    let error = await response.response.value.json();
                    this.logout()
                    throw new Error(error.Error || 'Terjadi kesalahan');
                }
            }
            catch (error) {
                throw new Error(error || 'Failed to get role');
            }
        }
    },
});
