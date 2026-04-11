import React, { useState, useEffect } from 'react';
import { X, Bell, Image, PlayCircle, ArrowLeft, CheckCircle } from 'lucide-react';

/**
 * نظام Toast Notifications - محسّن
 * 
 * يعرض إشعارات عائمة منبثقة عند وصول إشعار جديد
 * مع زر واضح لفتح الرابط
 */

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 left-4 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const Toast = ({ toast, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isLeaving, setIsLeaving] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        // Countdown for progress bar
        const duration = 8000; // 8 seconds
        const interval = 50; // Update every 50ms
        const decrement = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - decrement;
            });
        }, interval);

        // Auto hide after 8 seconds
        const hideTimer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearInterval(timer);
            clearTimeout(hideTimer);
        };
    }, []);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 300);
    };

    const handleOpenLink = () => {
        if (toast.onClick) {
            toast.onClick();
        }
        handleClose();
    };

    if (!isVisible) return null;

    const hasAction = !!toast.action_url || !!toast.onClick;

    return (
        <div
            dir="rtl"
            className={`
                pointer-events-auto bg-white rounded-2xl shadow-2xl border-r-4 
                ${toast.priority >= 5 ? 'border-red-500' : 'border-brand'}
                transform transition-all duration-300 ease-out
                ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                hover:shadow-3xl
            `}
        >
            {/* Progress Bar */}
            <div 
                className="h-1 bg-gradient-to-l from-brand to-rose-400 rounded-t-2xl transition-all duration-100"
                style={{ width: `${progress}%` }}
            />

            <div className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
                        ${toast.type?.includes('order') ? 'bg-orange-100 text-orange-600' : 
                          toast.type?.includes('message') ? 'bg-blue-100 text-blue-600' : 
                          'bg-brand/10 text-brand'}`}>
                        <Bell size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm">{toast.title}</p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{toast.message}</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClose();
                        }}
                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Media Preview (if exists) */}
                {toast.media_url && (
                    <div className="mt-3 rounded-xl overflow-hidden bg-slate-100">
                        {toast.media_type === 'image' ? (
                            <img
                                src={toast.media_url}
                                alt="مرفق"
                                className="w-full h-32 object-cover"
                            />
                        ) : (
                            <div className="relative h-32 bg-slate-800 flex items-center justify-center">
                                <PlayCircle size={40} className="text-white" />
                                <p className="absolute bottom-2 text-xs text-white/70">فيديو مرفق</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Button */}
                {hasAction && (
                    <button
                        onClick={handleOpenLink}
                        className={`
                            mt-3 w-full py-2.5 px-4 rounded-xl font-bold text-sm
                            flex items-center justify-center gap-2
                            transition-all duration-200
                            ${toast.priority >= 5 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-brand hover:bg-brand/90 text-white'}
                        `}
                    >
                        <span>عرض التفاصيل</span>
                        <ArrowLeft size={16} />
                    </button>
                )}

                {/* Success indicator if no action */}
                {!hasAction && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400">
                        <CheckCircle size={12} />
                        <span>تم الاستلام</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ===== Global Toast Manager =====

let toasts = [];
let listeners = [];

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function addToast(toast) {
    const id = generateId();
    const newToast = { id, ...toast };
    toasts = [...toasts, newToast];
    listeners.forEach(fn => fn(toasts));
    return id;
}

export function removeToast(id) {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(fn => fn(toasts));
}

/**
 * React Component - يجب إضافته في Root App
 */
export const ToastProvider = ({ children }) => {
    const [currentToasts, setCurrentToasts] = useState(toasts);

    useEffect(() => {
        listeners.push(setCurrentToasts);
        return () => {
            listeners = listeners.filter(l => l !== setCurrentToasts);
        };
    }, []);

    return (
        <>
            {children}
            <ToastContainer toasts={currentToasts} removeToast={removeToast} />
        </>
    );
};

/**
 * Global function registration
 */
if (typeof window !== 'undefined') {
    window.showNotificationToast = (toast) => {
        addToast(toast);
    };
}

export default ToastProvider;
