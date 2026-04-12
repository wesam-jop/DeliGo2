import { useEffect, useRef, useCallback } from 'react';
import { handleDeepLink, markAsOpened, playNotificationSound } from '../Services/NotificationService';
import { addToast } from '../Components/ToastNotifications';
import axios from 'axios';

/**
 * usePollNotifications Hook
 *
 * Fallback notification polling using Laravel API
 * This ensures notifications work even if ntfy is unavailable
 * Polls the notification API every 10 seconds for real-time notifications
 */

export function usePollNotifications(enabled = true, navigate = null) {
    const pollRef = useRef(null);
    const lastNotificationIdRef = useRef(new Set());
    const audioContextRef = useRef(null);

    /**
     * Play notification sound - MANDATORY
     * Uses Web Audio API as fallback if Audio fails
     */
    const playMandatorySound = useCallback(() => {
        try {
            // Try HTML5 Audio first
            const audio = new Audio('/sounds/default.mp3');
            audio.volume = 0.7;
            
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('[PollNotifications] Audio play failed, using Web Audio API fallback:', error);
                    
                    // Fallback: Generate a beep sound using Web Audio API
                    try {
                        if (!audioContextRef.current) {
                            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                        }
                        
                        const context = audioContextRef.current;
                        const oscillator = context.createOscillator();
                        const gainNode = context.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(context.destination);
                        
                        oscillator.frequency.value = 800;
                        oscillator.type = 'sine';
                        gainNode.gain.value = 0.3;
                        
                        oscillator.start();
                        setTimeout(() => oscillator.stop(), 200);
                    } catch (webAudioError) {
                        console.error('[PollNotifications] Web Audio API also failed:', webAudioError);
                    }
                });
            }
        } catch (error) {
            console.error('[PollNotifications] Failed to play sound:', error);
        }
    }, []);

    const checkForNewNotifications = useCallback(async () => {
        if (!enabled) return;

        try {
            const response = await axios.get('/api/v1/notifications', {
                params: { page: 1, per_page: 5 }
            });

            const notifications = response.data?.data?.data || response.data?.data || [];

            // Process notifications (most recent first)
            for (const notification of notifications) {
                // Skip if we already showed this notification
                if (lastNotificationIdRef.current.has(notification.id)) {
                    continue;
                }

                // Mark as new
                lastNotificationIdRef.current.add(notification.id);

                // Only show notifications created in the last 30 seconds
                const createdAt = new Date(notification.created_at);
                const now = new Date();
                const ageInSeconds = (now - createdAt) / 1000;

                if (ageInSeconds > 30) {
                    // Skip old notifications
                    continue;
                }

                const data = notification.data || {};
                const title = data.title || 'إشعار جديد';
                const message = data.message || '';
                const actionUrl = data.action_url || data.click || null;
                const type = notification.type || '';
                const priority = data.priority || 3;
                const soundName = data.sound_name || 'default.mp3';

                // Play sound - MANDATORY
                playMandatorySound();

                // Build toast notification
                const toastData = {
                    title,
                    message,
                    type,
                    priority,
                    media_url: data.media_url || null,
                    media_type: data.media_type || null,
                    action_url: actionUrl,
                    onClick: async () => {
                        // Mark as opened
                        if (notification.id) {
                            try {
                                await markAsOpened(notification.id);
                            } catch (error) {
                                console.error('فشل في تحديد الإشعار كمفتوح:', error);
                            }
                        }

                        // Navigate if there's an action URL
                        if (actionUrl) {
                            handleDeepLink(actionUrl, navigate);
                        }
                    },
                };

                // Show the toast notification
                addToast(toastData);

                // Only show the most recent notification
                break;
            }
        } catch (error) {
            // Silently fail - don't spam console
            if (error.response?.status !== 401) {
                console.warn('[PollNotifications] Error checking notifications:', error.message);
            }
        }
    }, [enabled, navigate, playMandatorySound]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        console.log('[PollNotifications] Starting notification polling');

        // Check immediately
        checkForNewNotifications();

        // Poll every 10 seconds for real-time notifications
        pollRef.current = setInterval(checkForNewNotifications, 10000);

        // Cleanup
        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            console.log('[PollNotifications] Stopped notification polling');
        };
    }, [enabled, checkForNewNotifications]);

    return {
        polling: enabled,
    };
}

export default usePollNotifications;
