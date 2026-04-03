import api from './api';

// Store Owner API - for managing store, products, and orders
export const storeOwnerApi = {
    // Get store owner's store
    getMyStore: () => api.get('/store'),

    // Create store
    createStore: (data) => api.post('/store', data),

    // Update store
    updateStore: (storeId, data) => {
        return api.post(`/store/${storeId}?_method=PUT`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json',
            },
        });
    },

    // Get store products
    getProducts: () => api.get('/store/products'),

    // Create product
    createProduct: (data) => {
        // Delete Content-Type header - browser will set it automatically with boundary for FormData
        return api.post('/store/products', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json',
            },
        });
    },

    // Update product
    updateProduct: (productId, data) => {
        // Use POST with _method=PUT for FormData
        return api.post(`/store/products/${productId}?_method=PUT`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json',
            },
        });
    },

    // Delete product
    deleteProduct: (productId) => api.delete(`/store/products/${productId}`),

    // Toggle product availability
    toggleProductAvailability: (productId) => api.post(`/store/products/${productId}/toggle-availability`),

    // Update store hours
    updateHours: (data) => api.post('/store/hours', data),

    // Get store orders
    getOrders: (params = {}) => api.get('/orders', { params }),

    // Get order details
    getOrder: (orderId) => api.get(`/orders/${orderId}`),

    // Accept order
    acceptOrder: (orderId) => api.post(`/orders/${orderId}/accept`),

    // Cancel order
    cancelOrder: (orderId, data) => api.post(`/orders/${orderId}/cancel`, data),

    // Mark as preparing
    markAsPreparing: (orderId) => api.post(`/orders/${orderId}/mark-preparing`),

    // Mark as ready
    markAsReady: (orderId) => api.post(`/orders/${orderId}/mark-ready`),

    // Get dashboard stats
    getStats: () => api.get('/store/dashboard'),
};

export default api;
