import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api/v1';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // If data is FormData, delete Content-Type header to let browser set it automatically
    if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
    }

    return config;
});

// Handle response errors
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

// Store API
export const storeApi = {
    // Get all stores
    getAll: (params = {}) => api.get('/stores', { params }),

    // Get store categories
    getCategories: () => api.get('/stores/categories'),

    // Get nearby stores
    getNearby: (latitude, longitude, radius = 5) =>
        api.get('/stores/nearby', { params: { latitude, longitude, radius } }),

    // Get single store
    getById: (id) => api.get(`/stores/${id}`),

    // Get store products (available only)
    getProducts: (id) => api.get(`/stores/${id}/products`),

    // Get statistics
    getStatistics: () => api.get('/statistics'),

    // Get single product (including unavailable)
    getProduct: (storeId, productId) => api.get(`/stores/${storeId}/products/${productId}`),

    // Get store hours
    getHours: (id) => api.get(`/stores/${id}/hours`),
};

// Product API
export const productApi = {
    // Get product by ID (via store)
    getById: (storeId, productId) => {
        // Since we don't have a direct product endpoint, we fetch store products and find the product
        return api.get(`/stores/${storeId}/products`)
            .then(response => {
                const product = response.data.data.find(p => p.id === productId);
                return { data: product };
            });
    },
};

// Location API
export const locationApi = {
    getGovernorates: () => api.get('/locations/governorates'),
    getGovernorate: (governorate) => api.get(`/locations/governorates/${governorate}`),
    getAreas: (governorate) => api.get(`/locations/governorates/${governorate}/areas`),
    getArea: (area) => api.get(`/locations/areas/${area}`),
};

// Order API
export const orderApi = {
    get: (orderId) => api.get(`/orders/${orderId}`),
    cancel: (orderId, reason = '') => api.post(`/orders/${orderId}/cancel`, { reason }),
};

// Favorite API
export const favoriteApi = {
    getAll: () => api.get('/customer/favorites'),
    toggleStore: (storeId) => api.post(`/customer/favorites/stores/${storeId}`),
    toggleProduct: (productId) => api.post(`/customer/favorites/products/${productId}`),
};

export default api;
