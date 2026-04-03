import api from './api';

// Customer API - for managing orders, addresses, favorites, and profile
export const customerApi = {
    // Get customer profile
    getProfile: () => api.get('/customer/profile'),

    // Update customer profile
    updateProfile: (data) => {
        // Use FormData for image upload
        return api.post('/customer/profile?_method=PUT', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json',
            },
        });
    },

    // Get customer orders
    getOrders: (params = {}) => api.get('/customer/orders', { params }),

    // Get order details
    getOrder: (orderId) => api.get(`/customer/orders/${orderId}`),

    // Cancel order
    cancelOrder: (orderId, data) => api.post(`/orders/${orderId}/cancel`, data),

    // Get customer addresses
    getAddresses: () => api.get('/customer/addresses'),

    // Add address
    addAddress: (data) => api.post('/customer/addresses', data),

    // Update address
    updateAddress: (addressId, data) => api.put(`/customer/addresses/${addressId}`, data),

    // Delete address
    deleteAddress: (addressId) => api.delete(`/customer/addresses/${addressId}`),

    // Set default address
    setDefaultAddress: (addressId) => api.post(`/customer/addresses/${addressId}/set-default`),

    // Get default address
    getDefaultAddress: () => api.get('/customer/addresses/default'),

    // Get favorites
    getFavorites: () => api.get('/customer/favorites'),

    // Add to favorites
    addToFavorites: (productId) => api.post('/customer/favorites', { product_id: productId }),

    // Remove from favorites
    removeFromFavorites: (productId) => api.delete(`/customer/favorites/${productId}`),

    // Get dashboard stats
    getStats: () => api.get('/customer/dashboard'),
};

export default api;
