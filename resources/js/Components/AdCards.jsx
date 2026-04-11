import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ChevronRight } from 'lucide-react';

export const TextAdCard = ({ ad }) => {
    const handleClick = () => {
        if (ad.link_url) {
            window.open(ad.link_url, '_blank');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleClick}
            className={`relative bg-gradient-to-r from-brand/10 via-brand/5 to-transparent rounded-2xl p-6 border border-brand/20 ${
                ad.link_url ? 'cursor-pointer hover:from-brand/15 hover:border-brand/30 transition-all' : ''
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 mb-1">{ad.title}</h3>
                    {ad.description && (
                        <p className="text-sm text-slate-600 font-medium">{ad.description}</p>
                    )}
                </div>
                {ad.link_url && (
                    <div className="flex items-center gap-1 text-brand font-bold text-sm">
                        <span>المزيد</span>
                        <ExternalLink size={16} />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export const MediaAdCard = ({ ad }) => {
    const handleClick = () => {
        if (ad.link_url) {
            window.open(ad.link_url, '_blank');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleClick}
            className={`relative rounded-2xl overflow-hidden bg-slate-100 group ${
                ad.link_url ? 'cursor-pointer' : ''
            }`}
        >
            {/* Media */}
            <div className="relative h-48 md:h-64 overflow-hidden">
                {ad.media_type === 'video' ? (
                    <video
                        src={ad.media_url}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                ) : (
                    <img
                        src={ad.media_url}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Text overlay */}
                <div className="absolute bottom-0 right-0 left-0 p-6 text-white">
                    <h3 className="text-xl font-black mb-1">{ad.title}</h3>
                    {ad.description && (
                        <p className="text-sm text-white/90 font-medium line-clamp-2">{ad.description}</p>
                    )}
                    {ad.link_url && (
                        <div className="mt-3 flex items-center gap-2 text-sm font-bold text-white/80 group-hover:text-white transition-colors">
                            <span>المزيد</span>
                            <ChevronRight size={16} />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
