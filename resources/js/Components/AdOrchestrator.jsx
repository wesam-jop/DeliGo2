import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdSwiper from './AdSwiper';
import { TextAdCard, MediaAdCard } from './AdCards';

/**
 * AdOrchestrator - Smart ad placement component
 * Fetches active ads for a given placement and renders them appropriately.
 * If no ads, renders nothing (null).
 * 
 * @param {string} placement - 'banner', 'sidebar', or 'footer'
 * @param {string} variant - 'full' (default) | 'compact' | 'minimal'
 * @param {number} autoPlayInterval - ms between auto-slides (default 5000)
 */
const AdOrchestrator = ({ placement, variant = 'full', autoPlayInterval = 5000 }) => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const response = await axios.get(`/api/v1/ads/${placement}`);
                setAds(response.data.data || []);
            } catch (err) {
                console.error(`Error fetching ${placement} ads:`, err);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, [placement]);

    if (loading || ads.length === 0) return null;

    // Compact variant - smaller, more subtle
    if (variant === 'compact') {
        return (
            <div className="my-8">
                <AdSwiper autoPlayInterval={autoPlayInterval}>
                    {ads.map((ad) => (
                        <div key={ad.id} className="px-2">
                            {ad.type === 'text' ? (
                                <CompactTextAd ad={ad} />
                            ) : (
                                <CompactMediaAd ad={ad} />
                            )}
                        </div>
                    ))}
                </AdSwiper>
            </div>
        );
    }

    // Minimal variant - very subtle, thin strip
    if (variant === 'minimal') {
        return (
            <div className="my-4">
                <AdSwiper autoPlayInterval={autoPlayInterval}>
                    {ads.map((ad) => (
                        <div key={ad.id} className="px-2">
                            {ad.type === 'text' ? (
                                <MinimalTextAd ad={ad} />
                            ) : (
                                <MinimalMediaAd ad={ad} />
                            )}
                        </div>
                    ))}
                </AdSwiper>
            </div>
        );
    }

    // Full variant - standard size
    return (
        <div className="my-10">
            <AdSwiper autoPlayInterval={autoPlayInterval}>
                {ads.map((ad) => (
                    <div key={ad.id}>
                        {ad.type === 'text' ? (
                            <TextAdCard ad={ad} />
                        ) : (
                            <MediaAdCard ad={ad} />
                        )}
                    </div>
                ))}
            </AdSwiper>
        </div>
    );
};

// ─── Compact Variants ───

const CompactTextAd = ({ ad }) => {
    const handleClick = () => {
        if (ad.link_url) window.open(ad.link_url, '_blank');
    };

    return (
        <div
            onClick={handleClick}
            className={`bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-100 ${
                ad.link_url ? 'cursor-pointer hover:border-brand/30 hover:from-brand/5 transition-all' : ''
            }`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-black text-slate-900">{ad.title}</h4>
                    {ad.description && (
                        <p className="text-xs text-slate-500 mt-0.5 font-medium line-clamp-1">{ad.description}</p>
                    )}
                </div>
                {ad.link_url && (
                    <span className="text-[10px] font-bold text-brand whitespace-nowrap">المزيد ←</span>
                )}
            </div>
        </div>
    );
};

const CompactMediaAd = ({ ad }) => {
    const handleClick = () => {
        if (ad.link_url) window.open(ad.link_url, '_blank');
    };

    return (
        <div
            onClick={handleClick}
            className={`rounded-xl overflow-hidden bg-slate-100 ${
                ad.link_url ? 'cursor-pointer' : ''
            }`}
        >
            <div className="relative h-32 overflow-hidden">
                {ad.media_type === 'video' ? (
                    <video src={ad.media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                ) : (
                    <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 right-0 left-0 p-3 text-white">
                    <h4 className="text-sm font-black">{ad.title}</h4>
                </div>
            </div>
        </div>
    );
};

// ─── Minimal Variants ───

const MinimalTextAd = ({ ad }) => {
    const handleClick = () => {
        if (ad.link_url) window.open(ad.link_url, '_blank');
    };

    return (
        <div
            onClick={handleClick}
            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                ad.link_url ? 'cursor-pointer hover:bg-slate-50 transition-all' : ''
            }`}
        >
            <span className="text-xs font-bold text-slate-600">{ad.title}</span>
            {ad.link_url && <span className="text-[10px] font-bold text-brand">←</span>}
        </div>
    );
};

const MinimalMediaAd = ({ ad }) => {
    const handleClick = () => {
        if (ad.link_url) window.open(ad.link_url, '_blank');
    };

    return (
        <div
            onClick={handleClick}
            className={`rounded-lg overflow-hidden bg-slate-100 ${
                ad.link_url ? 'cursor-pointer' : ''
            }`}
        >
            <div className="relative h-20 overflow-hidden">
                {ad.media_type === 'video' ? (
                    <video src={ad.media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                ) : (
                    <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
                )}
            </div>
        </div>
    );
};

export default AdOrchestrator;
