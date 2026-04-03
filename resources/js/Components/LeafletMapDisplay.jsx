import React, { useEffect, useRef } from 'react';

/**
 * LeafletMapDisplay - مكون لعرض الخريطة فقط (للعرض في المودال والطلبات)
 * بدون أزرار أو سحب، فقط عرض الموقع
 * 
 * @param {Array} center - [latitude, longitude] مركز الخريطة
 * @param {number} zoom - مستوى التقريب (افتراضي: 16)
 * @param {string} height - ارتفاع الخريطة (مثال: '200px')
 * @param {boolean} showPopup - إظهار نافذة منبثقة بالإحداثيات
 */
const LeafletMapDisplay = ({
    center = [33.3152, 44.3661],
    zoom = 16,
    height = '200px',
    className = '',
    showPopup = false,
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        // التحقق من أن Leaflet محمل
        if (!window.L || !center || !center[0] || !center[1]) {
            return;
        }

        // تهيئة الخريطة
        if (!mapInstanceRef.current && mapRef.current) {
            try {
                // إنشاء الخريطة
                const map = L.map(mapRef.current, {
                    zoomControl: false,
                    attributionControl: true,
                    scrollWheelZoom: false,
                    doubleClickZoom: false,
                    boxZoom: false,
                    dragging: true,
                    zoomDelta: 0.5,
                    zoomSnap: 0.5,
                }).setView(center, zoom);

                // إضافة طبقة OpenStreetMap
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 19,
                }).addTo(map);

                mapInstanceRef.current = map;

                // إضافة دبوس في المركز
                const marker = L.marker(center, {
                    draggable: false,
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
                }).addTo(map);

                markerRef.current = marker;

                // إظهار نافذة منبثقة إذا طُلب
                if (showPopup) {
                    marker.bindPopup(`
                        <div style="text-align: right; direction: rtl;">
                            <strong>الموقع المحدد</strong><br/>
                            خط العرض: ${center[0].toFixed(6)}<br/>
                            خط الطول: ${center[1].toFixed(6)}
                        </div>
                    `).openPopup();
                }
            } catch (err) {
                console.error('Error initializing map:', err);
            }
        }

        // تحديث المركز عند تغير props
        if (mapInstanceRef.current && center) {
            mapInstanceRef.current.setView(center, zoom);
            if (markerRef.current) {
                markerRef.current.setLatLng(center);
            }
        }

        return () => {
            // تنظيف الخريطة عند unmount
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [center, zoom, showPopup]);

    return (
        <div 
            ref={mapRef}
            className={`w-full rounded-xl border-2 border-slate-200 overflow-hidden ${className}`}
            style={{ height }}
            dir="ltr"
        />
    );
};

export default LeafletMapDisplay;
