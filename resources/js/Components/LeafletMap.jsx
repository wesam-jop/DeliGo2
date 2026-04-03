import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import Button from './Button';


/**
 * Leaflet Map Component - OpenStreetMap
 * خريطة مجانية ودقيقة تماماً باستخدام OpenStreetMap
 * 
 * @param {Array} center - [latitude, longitude] مركز الخريطة
 * @param {number} zoom - مستوى التقريب (افتراضي: 15)
 * @param {Function} onLocationSelect - دالة تستدعى عند اختيار موقع
 * @param {Array} markerPosition - موقع الدبوس [lat, lng]
 * @param {boolean} draggable - هل يمكن تحريك الدبوس
 * @param {string} height - ارتفاع الخريطة (مثال: '300px')
 */
const LeafletMap = ({
    center = [33.3152, 44.3661], // بغداد افتراضياً
    zoom = 15,
    onLocationSelect,
    markerPosition = null,
    draggable = true,
    height = '300px',
    className = '',
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [error, setError] = useState('');

    // تحميل Leaflet عند أول render
    useEffect(() => {
        // التحقق من أن Leaflet محمل
        if (!window.L) {
            setError('مكتبة Leaflet غير محملة. تأكد من تضمين المكتبة في welcome.blade.php');
            return;
        }

        // تهيئة الخريطة
        if (!mapInstanceRef.current && mapRef.current) {
            try {
                // إنشاء الخريطة
                const map = L.map(mapRef.current, {
                    zoomControl: true,
                    attributionControl: true,
                }).setView(center, zoom);

                // إضافة طبقة OpenStreetMap
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(map);

                mapInstanceRef.current = map;
                setIsMapReady(true);

                // إضافة دبوس عند النقر
                map.on('click', (e) => {
                    const { lat, lng } = e.latlng;
                    handleLocationSelect(lat, lng);
                });
            } catch (err) {
                console.error('Error initializing map:', err);
                setError('حدث خطأ أثناء تحميل الخريطة');
            }
        }

        return () => {
            // تنظيف الخريطة عند unmount
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // تحديث مركز الخريطة عند تغير props
    useEffect(() => {
        if (mapInstanceRef.current && center) {
            mapInstanceRef.current.setView(center, zoom);
        }
    }, [center, zoom]);

    // التعامل مع اختيار الموقع
    const handleLocationSelect = (lat, lng) => {
        // تحديث الدبوس
        if (mapInstanceRef.current) {
            // إزالة الدبوس القديم
            if (markerRef.current) {
                mapInstanceRef.current.removeLayer(markerRef.current);
            }

            // إضافة دبوس جديد قابل للسحب
            const marker = L.marker([lat, lng], {
                draggable: draggable,
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="
                        background-color: #DC2626;
                        width: 30px;
                        height: 30px;
                        border-radius: 50% 50% 0 50%;
                        transform: rotate(45deg);
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    "></div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                }),
            }).addTo(mapInstanceRef.current);

            // حدث سحب الدبوس
            if (draggable) {
                marker.on('dragend', (event) => {
                    const position = event.target.getLatLng();
                    handleLocationSelect(position.lat, position.lng);
                });
            }

            markerRef.current = marker;
        }

        // استدعاء الدالة الخارجية
        if (onLocationSelect) {
            onLocationSelect(lat, lng);
        }
    };

    // تحديث الدبوس عند تغير markerPosition من الخارج
    useEffect(() => {
        if (markerPosition && isMapReady) {
            handleLocationSelect(markerPosition[0], markerPosition[1]);
        }
    }, [markerPosition, isMapReady]);

    // دالة لتحديد الموقع الحالي
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('المتصفح لا يدعم تحديد الموقع الجغرافي');
            return;
        }

        setError('');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                handleLocationSelect(latitude, longitude);
                
                // تقريب الخريطة على الموقع
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([latitude, longitude], 17);
                }
            },
            (error) => {
                let errorMessage = 'حدث خطأ أثناء تحديد الموقع';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'تم رفض إذن الوصول للموقع. يرجى تفعيل إذن الموقع في المتصفح';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'معلومات الموقع غير متوفرة';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'انتهت مهلة تحديد الموقع';
                        break;
                    default:
                        break;
                }
                setError(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    return (
        <div className={`relative ${className}`} dir="ltr">
            {/* زر الموقع الحالي */}
            <Button variant="unstyled"
                type="button"
                onClick={getCurrentLocation}
                className="absolute top-3 right-3 z-[1000] bg-white hover:bg-brand hover:text-white text-brand font-bold py-2 px-3 rounded-lg shadow-lg flex items-center gap-1.5 transition-all duration-200"
                title="موقعي الحالي"
            >
                <Navigation size={18} />
                <span className="text-sm hidden sm:inline">موقعي</span>
            </Button>

            {/* حاوية الخريطة */}
            <div
                ref={mapRef}
                className="w-full rounded-xl border-2 border-slate-200 overflow-hidden"
                style={{ height }}
            />

            {/* رسالة الخطأ */}
            {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                </div>
            )}

            {/* معلومات الإحداثيات */}
            {markerPosition && (
                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
                    <MapPin size={14} className="text-brand" />
                    <span>خط العرض: {markerPosition[0].toFixed(6)}</span>
                    <span className="mx-1">|</span>
                    <span>خط الطول: {markerPosition[1].toFixed(6)}</span>
                </div>
            )}
        </div>
    );
};

export default LeafletMap;
