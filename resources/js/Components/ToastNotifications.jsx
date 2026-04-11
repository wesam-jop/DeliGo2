import React, { useState, useEffect } from 'react';
import { X, Bell, Image, PlayCircle } from 'lucide-react';

/**
 * نظام Toast Notifications
 * 
 * يعرض إشعارات منبثقة عند وصول إشعار جديد من ntfy
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

    useEffect(() => {
        // إخفاء تلقائي بعد 8 ثواني
        const timer = setTimeout(() => {
            handleClose();
        }, 8000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 300);
    };

    const handleClick = () => {
        if (toast.onClick) {
            toast.onClick();
        }
        handleClose();
    };

    if (!isVisible) return null;

    return (
        <div
            dir="rtl"
            className={`
                pointer-events-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 
                transform transition-all duration-300 ease-out
                ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                hover:shadow-3xl hover:border-brand/30 cursor-pointer
            `}
            onClick={handleClick}
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand shrink-0">
                    <Bell size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{toast.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{toast.message}</p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClose();
                    }}
                    className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Media Preview (إذا موجود) */}
            {toast.media_url && (
                <div className="mt-3 rounded-xl overflow-hidden bg-slate-100">
                    {toast.media_type === 'image' ? (
                        <div className="relative group">
                            <img 
                                src={toast.media_url} 
                                alt="مرفق" 
                                className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Image size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    ) : (
                        <div className="relative group h-32 bg-slate-800 flex items-center justify-center">
                            <PlayCircle size={40} className="text-white" />
                            <p className="absolute bottom-2 text-xs text-white/70">فيديو مرفق</p>
                        </div>
                    )}
                </div>
            )}

            {/* Action hint */}
            <div className="mt-2 text-xs text-slate-400 text-center">
                اضغط للعرض ←
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
 * Global function registration (للاستخدام من useNtfy hook)
 */
if (typeof window !== 'undefined') {
    window.showNotificationToast = (toast) => {
        addToast(toast);
    };
}

export default ToastProvider;
