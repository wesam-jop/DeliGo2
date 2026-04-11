import axios from 'axios';

// نفس أصل الصفحة (مثلاً php artisan serve) — تجنب localhost:80 الخاطئ.
// يمكن تجاوزه بـ VITE_API_URL عند فصل الفرونت عن الباك.
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
// const API_URL = 'https://webnova.fun/api/v1';
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const storeApi = {
    getAll: (params = {}) => api.get('stores', { params }),
    getCategories: () => api.get('stores/categories'),
    getNearby: (latitude, longitude, radius = 5) =>
        api.get('stores/nearby', { params: { latitude, longitude, radius } }),
    getById: (id) => api.get(`stores/${id}`),
    getProducts: (id) => api.get(`stores/${id}/products`),
    getStatistics: () => api.get('statistics'),
    getProduct: (storeId, productId) => api.get(`stores/${storeId}/products/${productId}`),
    getHours: (id) => api.get(`stores/${id}/hours`),
};

export const productApi = {
    getById: (storeId, productId) => {
        return api.get(`stores/${storeId}/products`)
            .then(response => {
                const product = response.data.data.find(p => p.id === productId);
                return { data: product };
            });
    },
};

export const locationApi = {
    getGovernorates: () => api.get('locations/governorates'),
    getGovernorate: (governorate) => api.get(`locations/governorates/${governorate}`),
    getAreas: (governorate) => api.get(`locations/governorates/${governorate}/areas`),
    getArea: (area) => api.get(`locations/areas/${area}`),
};

export const orderApi = {
    get: (orderId) => api.get(`orders/${orderId}`),
    cancel: (orderId, reason = '') => api.post(`orders/${orderId}/cancel`, { reason }),
};

export const favoriteApi = {
    getAll: () => api.get('customer/favorites'),
    toggleStore: (storeId) => api.post(`customer/favorites/stores/${storeId}`),
    toggleProduct: (productId) => api.post(`customer/favorites/products/${productId}`),
};

export default api;
