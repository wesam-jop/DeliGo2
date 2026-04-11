import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdSwiper from './AdSwiper';
import { TextAdCard, MediaAdCard } from './AdCards';

const AdvertisementBanner = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const response = await axios.get('/api/v1/ads/banner');
                setAds(response.data.data || []);
            } catch (err) {
                console.error('Error fetching banner ads:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, []);

    if (loading || ads.length === 0) return null;

    return (
        <section className="container mx-auto px-6 py-6">
            <AdSwiper autoPlayInterval={5000}>
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
        </section>
    );
};

export default AdvertisementBanner;
