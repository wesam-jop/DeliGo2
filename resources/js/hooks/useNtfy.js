import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';

/**
 * طلب إذن إشعارات المتصفح (Browser Notification API)
 * يطلب الإذن إذا لم يكن قد مُنح أو رُفض مسبقاً
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('[Notifications] Browser does not support notifications');
        return 'unsupported';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        console.warn('[Notifications] Permission denied by user');
        return 'denied';
    }

    // طلب الإذن
    try {
        const permission = await Notification.requestPermission();
        console.log('[Notifications] Permission:', permission);
        return permission;
    } catch (error) {
        console.error('[Notifications] Error requesting permission:', error);
        return 'error';
    }
};

/**
 * ntfy SSE Hook - استقبال الإشعارات لحظياً
 *
 * الميزات:
 * - طلب إذن الإشعارات عند أول دخول
 * - اتصال بـ ntfy عبر Polling
 * - عرض Toast Notification + Browser Notification
 * - تنقل تلقائي عند الضغط على الإشعار
 * - فتح Media Viewer إذا كان فيه وسائط
 */
export const useNtfy = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth(); // قراءة من AuthContext
    const eventSourceRef = useRef(null);
    const audioRef = useRef(null);
    const lastIdRef = useRef(0);
    const permissionRequestedRef = useRef(false);

    /**
     * عرض Browser Notification
     */
    const showBrowserNotification = useCallback((notification) => {
        if (Notification.permission !== 'granted') return;

        const browserNotification = new Notification(notification.title || 'إشعار جديد', {
            body: notification.message || '',
            icon: '/logo.png',
            badge: '/logo.png',
            tag: `notification-${notification.id}`,
            requireInteraction: false,
        });

        // عند الضغط على الإشعار
        browserNotification.onclick = () => {
            window.focus();
            handleNotificationClick(notification);
            browserNotification.close();
        };
    }, []);

    /**
     * عرض Toast Notification
     */
    const showToast = useCallback((notification) => {
        if (window.showNotificationToast) {
            window.showNotificationToast({
                title: notification.title || 'إشعار جديد',
                message: notification.message || '',
                media_url: notification.media_url,
                media_type: notification.media_type,
                onClick: () => handleNotificationClick(notification),
            });
        }
        
        // عرض Browser Notification أيضاً
        showBrowserNotification(notification);
    }, [showBrowserNotification]);

    /**
     * معالجة الضغط على الإشعار
     */
    const handleNotificationClick = useCallback((notification) => {
        // 🔗 تنقل للرابط المحدد
        if (notification.click) {
            try {
                const url = new URL(notification.click);
                navigate(url.pathname + url.search);
            } catch (e) {
                console.error('Invalid click URL:', e);
            }
        }

        // 🖼️ فتح Media Viewer إذا كان فيه وسائط
        if (notification.media_url) {
            if (window.openMediaViewer) {
                window.openMediaViewer(notification.media_url, notification.media_type);
            }
        }
    }, [navigate]);

    useEffect(() => {
        // قراءة من AuthContext بدلاً من localStorage
        if (!token || !user?.ntfy_topic) {
            console.warn('[ntfy] No token or ntfy_topic available');
            return;
        }

        // طلب إذن الإشعارات (مرة وحدة فقط)
        if (!permissionRequestedRef.current) {
            permissionRequestedRef.current = true;
            requestNotificationPermission();
        }

        const ntfyBaseUrl = import.meta.env.VITE_NTFY_BASE_URL || 'https://ntfy.sh';

        console.log('[ntfy] Connecting via SSE for:', user.ntfy_topic);

        // إنشاء Audio للإشعارات
        audioRef.current = new Audio('/notification-sound.mp3');

        // Server-Sent Events (SSE) - اتصال واحد مستمر بدون rate limiting
        const eventSource = new EventSource(`${ntfyBaseUrl}/${user.ntfy_topic}/json`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                // تجاهل رسائل الترحيب
                if (msg.event === 'keepalive') return;

                const notification = {
                    id: msg.id,
                    title: msg.title || 'إشعار جديد',
                    message: msg.message || '',
                    click: msg.click || null,
                    media_url: msg.media_url || null,
                    media_type: msg.media_type || null,
                    meta: msg.meta || {},
                };

                console.log('[ntfy] Notification received:', notification);

                // تشغيل صوت الإشعار
                audioRef.current?.play().catch(() => {});

                // عرض Toast + Browser Notification
                showToast(notification);
            } catch (e) {
                console.error('[ntfy] Failed to parse notification:', e, event.data);
            }
        };

        eventSource.onerror = (error) => {
            if (eventSource.readyState === EventSource.CLOSED) {
                console.log('[ntfy] Connection closed');
            } else {
                console.error('[ntfy] SSE connection error, reconnecting...', error);
                // SSE بيحاول يعيد الاتصال تلقائياً
            }
        };

        return () => {
            console.log('[ntfy] Disconnecting SSE');
            eventSource.close();
        };
    }, [user, token, navigate, showToast]);
};
