import api from './api';

// Driver API - for managing orders, earnings, and status
export const driverApi = {
    // Get driver profile
    getProfile: () => api.get('/driver/profile'),

    // Update driver profile
    updateProfile: (data) => {
        // Use FormData for image upload
        return api.post('/driver/profile?_method=PUT', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json',
            },
        });
    },

    // Toggle online status
    toggleOnline: () => api.post('/driver/toggle-online'),

    // Get current orders (assigned to driver)
    getCurrentOrders: () => api.get('/driver/orders/current'),

    // Get order history
    getOrderHistory: () => api.get('/driver/orders/history'),

    // Get available orders (to accept)
    getAvailableOrders: () => api.get('/driver/orders/available'),

    // Accept order
    acceptOrder: (orderId) => api.post(`/orders/${orderId}/accept`),

    // Mark as picked up
    markAsPickedUp: (orderId) => api.post(`/orders/${orderId}/mark-picked-up`),

    // Mark as delivered
    markAsDelivered: (orderId) => api.post(`/orders/${orderId}/mark-delivered`),

    // Get dashboard stats
    getStats: () => api.get('/driver/dashboard'),
};

export default api;
