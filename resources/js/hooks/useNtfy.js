import { useEffect, useRef, useCallback } from 'react';
import { handleDeepLink, markAsOpened, playNotificationSound } from '../Services/NotificationService';
import { addToast } from '../Components/ToastNotifications';

/**
 * useNtfy Hook - محسّن مع Polling
 * 
 * يتصل بخادم ntfy عبر Polling (لأن ntfy يستخدم NDJSON مش SSE)
 * مع دعم: الصوت، الصامت، الروابط، الأزرار
 */

export function useNtfy(topic, options = {}) {
    const {
        enabled = true,
        baseUrl = 'https://ntfy.sh',
        onNotification = null,
        navigate = null,
        playSound = true,
        pollInterval = 10000, // 10 seconds - faster polling
    } = options;

    const pollRef = useRef(null);
    const isMountedRef = useRef(false);
    const lastMessageIdRef = useRef(null);

    const handleMessage = useCallback((data) => {
        try {
            const {
                id,
                title,
                message,
                tags = [],
                priority = 3,
                click,
                type,
                entity_id,
                action_url,
                sound_name,
                silent,
                media_url,
                media_type,
            } = data;

            // FORCE sound playback - mandatory for all users
            if (playSound && sound_name) {
                playNotificationSound(sound_name, false);
            }

            // Build toast notification
            const toastData = {
                title: title || 'إشعار جديد',
                message: message || '',
                type,
                priority,
                media_url,
                media_type,
                action_url: action_url || click,
                onClick: async () => {
                    const url = action_url || click;

                    // Mark as opened first
                    if (id) {
                        try {
                            await markAsOpened(id);
                        } catch (error) {
                            console.error('فشل في تحديد الإشعار كمفتوح:', error);
                        }
                    }

                    // Then navigate if there's a URL
                    if (url) {
                        handleDeepLink(url, navigate);
                    }

                    // Call custom callback if provided
                    if (onNotification) {
                        onNotification(data);
                    }
                },
            };

            // Show the toast notification
            addToast(toastData);

            console.log('[useNtfy] Notification received:', title, message);

            if (onNotification) {
                onNotification(data);
            }

        } catch (error) {
            console.error('خطأ في معالجة الإشعار:', error);
        }
    }, [navigate, onNotification, playSound]);

    const pollNotifications = useCallback(async () => {
        if (!isMountedRef.current || !topic) return;

        try {
            const url = `${baseUrl}/${topic}/json`;
            const response = await fetch(url);

            if (!response.ok) {
                console.warn('⚠️ ntfy response not ok:', response.status);
                return;
            }

            const text = await response.text();
            if (!text.trim()) return;

            // Parse NDJSON (each line is a JSON object)
            const lines = text.trim().split('\n');
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);

                    // Skip if we already processed this message
                    if (lastMessageIdRef.current && data.id <= lastMessageIdRef.current) {
                        continue;
                    }

                    lastMessageIdRef.current = data.id;
                    handleMessage(data);
                } catch (e) {
                    // Skip invalid lines
                }
            }
        } catch (error) {
            console.error('❌ خطأ في جلب الإشعارات:', error);
        }
    }, [topic, baseUrl, handleMessage]);

    useEffect(() => {
        isMountedRef.current = true;

        if (!enabled || !topic) {
            return;
        }

        console.log('✅ بدء استقبال الإشعارات للموضوع:', topic);

        // Poll immediately
        pollNotifications();

        // Set up polling interval
        pollRef.current = setInterval(pollNotifications, pollInterval);

        // Cleanup
        return () => {
            isMountedRef.current = false;
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [topic, enabled, baseUrl, pollInterval, pollNotifications]);

    return {
        connected: enabled && !!topic,
    };
}

export default useNtfy;
