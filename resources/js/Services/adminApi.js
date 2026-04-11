import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const adminApi = {
    get: (url, config) => api.get(url, config),
    post: (url, data) => api.post(url, data),
    delete: (url) => api.delete(url),

    getStats: () => api.get('admin/dashboard'),
    getUsers: (params = {}) => api.get('admin/users', { params }),
    getAllDrivers: (params = {}) => api.get('admin/drivers', { params }),
    getPendingStores: () => api.get('admin/stores/pending'),
    getPendingDrivers: () => api.get('admin/drivers/pending'),
    getDrivers: (params = {}) => api.get('admin/users', { params: { ...params, role: 'driver' } }),
    approveStore: (storeId) => api.post(`admin/stores/${storeId}/approve`),
    rejectStore: (storeId, reason) => api.post(`admin/stores/${storeId}/reject`, { reason }),
    approveDriver: (driverId) => api.post(`admin/drivers/${driverId}/approve`),
    rejectDriver: (driverId, reason) => api.post(`admin/drivers/${driverId}/reject`, { reason }),
    getOrders: (params = {}) => api.get('orders', { params }),
    getOrder: (orderId) => api.get(`orders/${orderId}`),
    deleteUser: (userId) => api.delete(`admin/users/${userId}`),
    getGovernorates: () => api.get('admin/locations/governorates'),
    createGovernorate: (data) => api.post('admin/locations/governorates', data),
    createArea: (data) => api.post('admin/locations/areas', data),
    broadcastNotification: (data) => api.post('admin/notifications/broadcast', data),
};

export default api;
