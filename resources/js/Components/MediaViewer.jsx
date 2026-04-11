import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Media Viewer Component
 * 
 * يعرض الصور والفيديوهات المرفقة في الإشعارات
 * يدعم:
 * - تكبير/تصغير الصور
 * - تشغيل الفيديو
 * - تحميل الوسائط
 */

const MediaViewer = ({ mediaUrl, mediaType, isOpen, onClose }) => {
    const [zoom, setZoom] = useState(1);
    const [currentIndex, setCurrentIndex] = useState(0);

    // إغلاق بزر Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setCurrentIndex(prev => Math.max(0, prev - 1));
            if (e.key === 'ArrowRight') setCurrentIndex(prev => prev + 1);
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

    const handleDownload = () => {
        if (mediaUrl) {
            window.open(mediaUrl, '_blank');
        }
    };

    if (!isOpen || !mediaUrl) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
                onClick={onClose}
            >
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                            <ZoomOut size={20} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                            <ZoomIn size={20} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                            <Download size={20} />
                        </button>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Media Content */}
                <div
                    className="max-w-5xl max-h-[80vh] relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {mediaType === 'image' ? (
                        <motion.img
                            src={mediaUrl}
                            alt="Media"
                            className="max-w-full max-h-[80vh] object-contain"
                            style={{ transform: `scale(${zoom})` }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        />
                    ) : (
                        <video
                            src={mediaUrl}
                            controls
                            autoPlay
                            className="max-w-full max-h-[80vh] rounded-xl"
                        />
                    )}
                </div>

                {/* Zoom indicator */}
                {zoom !== 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full text-sm">
                        {Math.round(zoom * 100)}%
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

/**
 * Global function registration
 */
if (typeof window !== 'undefined') {
    window._mediaViewerState = { isOpen: false, mediaUrl: null, mediaType: null, setOpen: null };

    window.openMediaViewer = (url, type = 'image') => {
        if (window._mediaViewerState.setOpen) {
            window._mediaViewerState.mediaUrl = url;
            window._mediaViewerState.mediaType = type;
            window._mediaViewerState.setOpen(true);
        }
    };

    window.closeMediaViewer = () => {
        if (window._mediaViewerState.setOpen) {
            window._mediaViewerState.setOpen(false);
        }
    };
}

/**
 * MediaViewerProvider - يجب إضافته في Root App
 */
export const MediaViewerProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mediaUrl, setMediaUrl] = useState(null);
    const [mediaType, setMediaType] = useState('image');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window._mediaViewerState.setOpen = setIsOpen;
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setMediaUrl(null);
        setMediaType('image');
    };

    return (
        <>
            {children}
            <MediaViewer
                mediaUrl={mediaUrl}
                mediaType={mediaType}
                isOpen={isOpen}
                onClose={handleClose}
            />
        </>
    );
};

export default MediaViewer;
