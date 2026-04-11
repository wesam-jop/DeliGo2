import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdSwiper = ({ children, autoPlayInterval = 4000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const items = React.Children.toArray(children);

    const next = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    }, [items.length]);

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    const goTo = (index) => {
        setCurrentIndex(index);
    };

    // Auto-play
    useEffect(() => {
        if (isPaused || items.length <= 1) return;

        const timer = setInterval(next, autoPlayInterval);
        return () => clearInterval(timer);
    }, [next, autoPlayInterval, isPaused, items.length]);

    if (items.length === 0) return null;
    if (items.length === 1) return <>{children}</>;

    return (
        <div
            className="relative container mx-auto px-6 py-8"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            dir="ltr"
        >
            {/* Slides */}
            <div className="overflow-hidden rounded-2xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                        {items[currentIndex]}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all text-slate-700 hover:text-brand"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all text-slate-700 hover:text-brand"
                    >
                        <ChevronRight size={20} />
                    </button>
                </>
            )}

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goTo(index)}
                        className={`h-2 rounded-full transition-all ${
                            index === currentIndex
                                ? 'w-8 bg-brand'
                                : 'w-2 bg-slate-300 hover:bg-slate-400'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default AdSwiper;
