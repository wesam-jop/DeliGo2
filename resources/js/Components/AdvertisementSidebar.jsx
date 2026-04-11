import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdSwiper from './AdSwiper';
import { TextAdCard, MediaAdCard } from './AdCards';

const AdvertisementSidebar = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const response = await axios.get('/api/v1/ads/sidebar');
                setAds(response.data.data || []);
            } catch (err) {
                console.error('Error fetching sidebar ads:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, []);

    if (loading || ads.length === 0) return null;

    return (
        <aside className="w-full space-y-4">
            <AdSwiper autoPlayInterval={6000}>
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
        </aside>
    );
};

export default AdvertisementSidebar;
