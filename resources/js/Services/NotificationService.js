import axios from 'axios';

/**
 * Notification API Service
 * 
 * Handles all notification-related API calls
 */

const API_BASE = '/api/v1';

// Helper to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// ===== Notifications =====

/**
 * Get user's notifications (paginated)
 */
export async function getNotifications(page = 1, unreadOnly = false, perPage = 20) {
    const params = new URLSearchParams();
    params.append('page', page);
    if (unreadOnly) params.append('unread_only', 'true');
    params.append('per_page', perPage);

    const response = await axios.get(`${API_BASE}/notifications?${params.toString()}`, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount() {
    const response = await axios.get(`${API_BASE}/notifications/unread-count`, {
        headers: getAuthHeaders(),
    });
    return response.data.data.unread_count;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
    const response = await axios.post(`${API_BASE}/notifications/${notificationId}/read`, null, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

/**
 * Mark notification as opened
 */
export async function markAsOpened(notificationId) {
    const response = await axios.post(`${API_BASE}/notifications/${notificationId}/open`, null, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
    const response = await axios.post(`${API_BASE}/notifications/mark-all-read`, null, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

/**
 * Get notification analytics
 */
export async function getNotificationAnalytics() {
    const response = await axios.get(`${API_BASE}/notifications/analytics`, {
        headers: getAuthHeaders(),
    });
    return response.data.data;
}

/**
 * Send test notification
 */
export async function sendTestNotification() {
    const response = await axios.post(`${API_BASE}/notifications/test`, null, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

// ===== Notification Preferences =====

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences() {
    const response = await axios.get(`${API_BASE}/notifications/preferences`, {
        headers: getAuthHeaders(),
    });
    return response.data.data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences) {
    const response = await axios.put(`${API_BASE}/notifications/preferences`, preferences, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

/**
 * Reset notification preferences to defaults
 */
export async function resetNotificationPreferences() {
    const response = await axios.post(`${API_BASE}/notifications/preferences/reset`, null, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

// ===== Device Tokens (for Push Notifications) =====

/**
 * Register device token for push notifications
 */
export async function registerDeviceToken(token, deviceType, deviceName) {
    const response = await axios.post(`${API_BASE}/devices/register`, {
        token,
        device_type: deviceType,
        device_name: deviceName,
    }, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

/**
 * Unregister device token
 */
export async function unregisterDeviceToken(token) {
    const response = await axios.post(`${API_BASE}/devices/unregister`, { token }, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

/**
 * Get all registered devices
 */
export async function getDevices() {
    const response = await axios.get(`${API_BASE}/devices`, {
        headers: getAuthHeaders(),
    });
    return response.data.data;
}

/**
 * Unregister all devices
 */
export async function unregisterAllDevices() {
    const response = await axios.post(`${API_BASE}/devices/unregister-all`, null, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

// ===== Deep Linking Helper =====

/**
 * Handle deep link navigation from notification
 */
export function handleDeepLink(actionUrl, navigate) {
    if (!actionUrl) return;

    // Remove mobile scheme if present (deligo://)
    const path = actionUrl
        .replace('deligo://', '/')
        .replace(/^https?:\/\/[^\/]+/, '');

    // Navigate using React Router
    if (navigate) {
        navigate(path);
    } else {
        // Fallback to window navigation
        window.location.href = path;
    }
}

// ===== Sound Manager =====

/**
 * Play notification sound
 * 
 * @param {string} soundName - Sound filename (e.g., 'order_new.mp3')
 * @param {boolean} silent - Whether to play silently
 */
export function playNotificationSound(soundName, silent = false) {
    if (silent || !soundName) return;

    // Web Audio API
    const soundPath = `/sounds/${soundName}`;
    const audio = new Audio(soundPath);
    audio.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
    });
}

// ===== Export All =====

export default {
    // Notifications
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAsOpened,
    markAllAsRead,
    getNotificationAnalytics,
    sendTestNotification,
    
    // Preferences
    getNotificationPreferences,
    updateNotificationPreferences,
    resetNotificationPreferences,
    
    // Devices
    registerDeviceToken,
    unregisterDeviceToken,
    getDevices,
    unregisterAllDevices,
    
    // Helpers
    handleDeepLink,
    playNotificationSound,
};
