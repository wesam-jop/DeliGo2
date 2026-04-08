import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Admin API
export const adminApi = {
    // Get method wrapper
    get: (url, config) => api.get(url, config),
    post: (url, data) => api.post(url, data),
    delete: (url) => api.delete(url),

    // Get dashboard stats
    getStats: () => api.get('/admin/dashboard'),

    // Get all users
    getUsers: (params = {}) => api.get('/admin/users', { params }),

    // Get pending stores
    getPendingStores: () => api.get('/admin/stores/pending'),

    // Get pending drivers
    getPendingDrivers: () => api.get('/admin/drivers/pending'),

    // Get all drivers
    getDrivers: (params = {}) => api.get('/admin/users', { params: { ...params, role: 'driver' } }),

    // Approve store
    approveStore: (storeId) => api.post(`/admin/stores/${storeId}/approve`),

    // Reject store
    rejectStore: (storeId, reason) => api.post(`/admin/stores/${storeId}/reject`, { reason }),

    // Approve driver
    approveDriver: (driverId) => api.post(`/admin/drivers/${driverId}/approve`),

    // Reject driver
    rejectDriver: (driverId, reason) => api.post(`/admin/drivers/${driverId}/reject`, { reason }),

    // Get all orders
    getOrders: (params = {}) => api.get('/orders', { params }),

    // Get order details
    getOrder: (orderId) => api.get(`/orders/${orderId}`),

    // Delete user
    deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

    // Get governorates
    getGovernorates: () => api.get('/admin/locations/governorates'),

    // Create governorate
    createGovernorate: (data) => api.post('/admin/locations/governorates', data),

    // Create area
    createArea: (data) => api.post('/admin/locations/areas', data),

    // Broadcast notification to users (queued in chunks)
    broadcastNotification: (data) => api.post('/admin/notifications/broadcast', data),
};

export default api;
