import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone, Plus, Edit, Trash2, Search, CheckCircle, AlertCircle,
    Image as ImageIcon, Link, Calendar, Type, Eye, EyeOff, Upload, X
} from 'lucide-react';
import axios from 'axios';
import Button from '../../Components/Button';

const AdminAds = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [filterPlacement, setFilterPlacement] = useState('all');

    const [adData, setAdData] = useState({
        type: 'text',
        placement: 'banner',
        title: '',
        description: '',
        media_file: null,
        media_file_preview: null,
        media_url: '',
        media_type: 'image',
        link_url: '',
        start_date: '',
        end_date: '',
        is_active: true,
        sort_order: 0,
    });

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            const response = await axios.get('/api/v1/admin/ads');
            setAds(response.data.data || []);
        } catch (err) {
            console.error('Error fetching ads:', err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('type', adData.type);
            formData.append('placement', adData.placement);
            formData.append('title', adData.title);
            if (adData.description) formData.append('description', adData.description);
            if (adData.media_file) formData.append('media_file', adData.media_file);
            if (adData.media_url && !adData.media_file) formData.append('media_url', adData.media_url);
            if (adData.media_type) formData.append('media_type', adData.media_type);
            if (adData.link_url) formData.append('link_url', adData.link_url);
            formData.append('start_date', adData.start_date);
            formData.append('end_date', adData.end_date);
            formData.append('is_active', adData.is_active ? 1 : 0);
            formData.append('sort_order', adData.sort_order);

            if (editingAd) {
                formData.append('_method', 'PUT');
                await axios.post(`/api/v1/admin/ads/${editingAd.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setSuccess('تم تحديث الإعلان بنجاح');
            } else {
                await axios.post('/api/v1/admin/ads', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setSuccess('تم إضافة الإعلان بنجاح');
            }
            setShowModal(false);
            setEditingAd(null);
            resetForm();
            fetchAds();
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;

        try {
            await axios.delete(`/api/v1/admin/ads/${id}`);
            setSuccess('تم حذف الإعلان بنجاح');
            fetchAds();
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
        }
    };

    const openEdit = (ad) => {
        setEditingAd(ad);
        setAdData({
            type: ad.type || 'text',
            placement: ad.placement || 'banner',
            title: ad.title || '',
            description: ad.description || '',
            media_file: null,
            media_file_preview: ad.media_url || null,
            media_url: ad.media_url || '',
            media_type: ad.media_type || 'image',
            link_url: ad.link_url || '',
            start_date: ad.start_date?.split('T')[0] || '',
            end_date: ad.end_date?.split('T')[0] || '',
            is_active: ad.is_active ?? true,
            sort_order: ad.sort_order || 0,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setAdData({
            type: 'text',
            placement: 'banner',
            title: '',
            description: '',
            media_file: null,
            media_file_preview: null,
            media_url: '',
            media_type: 'image',
            link_url: '',
            start_date: '',
            end_date: '',
            is_active: true,
            sort_order: 0,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAdData(prev => ({
                    ...prev,
                    media_file: file,
                    media_file_preview: reader.result,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeMediaFile = () => {
        setAdData(prev => ({
            ...prev,
            media_file: null,
            media_file_preview: null,
        }));
    };

    const toggleActive = async (ad) => {
        try {
            await axios.put(`/api/v1/admin/ads/${ad.id}`, { is_active: !ad.is_active });
            setSuccess(ad.is_active ? 'تم إيقاف الإعلان' : 'تم تفعيل الإعلان');
            fetchAds();
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء تحديث الحالة');
        }
    };

    const getPlacementText = (p) => {
        const map = { banner: 'بانر عريض', sidebar: 'جانبي', footer: 'فوتر' };
        return map[p] || p;
    };

    const getTypeText = (t) => {
        return t === 'text' ? 'نصي' : 'وسائط';
    };

    const isAdRunning = (ad) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(ad.start_date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(ad.end_date);
        end.setHours(0, 0, 0, 0);
        return ad.is_active && start <= today && end >= today;
    };

    const filteredAds = ads.filter(ad => {
        if (filterPlacement !== 'all' && ad.placement !== filterPlacement) return false;
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            ad.title?.toLowerCase().includes(search) ||
            ad.description?.toLowerCase().includes(search)
        );
    });

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Megaphone size={28} className="text-brand" />
                    إدارة الإعلانات
                </h1>
                <p className="text-slate-500 mt-1 font-medium">إضافة وتعديل الإعلانات المعروضة في الموقع</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-3">
                    <CheckCircle size={20} />
                    <span className="font-medium">{success}</span>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Search, Filter & Add */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ابحث عن إعلان..."
                            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                        />
                    </div>
                    <select
                        value={filterPlacement}
                        onChange={(e) => setFilterPlacement(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all font-bold cursor-pointer"
                    >
                        <option value="all">كل الأماكن</option>
                        <option value="banner">بانر عريض</option>
                        <option value="sidebar">جانبي</option>
                        <option value="footer">فوتر</option>
                    </select>
                    <Button
                        variant="unstyled"
                        onClick={() => {
                            setEditingAd(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-pink-600 transition-all whitespace-nowrap"
                    >
                        <Plus size={18} />
                        إضافة إعلان
                    </Button>
                </div>
            </div>

            {/* Ads Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">قائمة الإعلانات</h3>
                    <span className="text-sm text-slate-400 font-medium">
                        {filteredAds.length} إعلان
                    </span>
                </div>

                {filteredAds.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Megaphone size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد إعلانات</p>
                        <Button
                            variant="unstyled"
                            onClick={() => setShowModal(true)}
                            className="mt-4 text-brand font-bold hover:underline"
                        >
                            إضافة أول إعلان
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAds.map((ad) => (
                            <div
                                key={ad.id}
                                className={`p-6 rounded-2xl border-2 transition-all group ${
                                    isAdRunning(ad)
                                        ? 'border-emerald-200 bg-emerald-50/30'
                                        : 'border-slate-100 bg-slate-50/30'
                                }`}
                            >
                                {/* Media Preview */}
                                {ad.type === 'media' && ad.media_url && (
                                    <div className="mb-4 rounded-xl overflow-hidden h-32 bg-slate-200 flex items-center justify-center">
                                        {ad.media_type === 'video' ? (
                                            <video src={ad.media_url} className="w-full h-full object-cover" muted />
                                        ) : (
                                            <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 line-clamp-1">{ad.title}</h4>
                                        {ad.description && (
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ad.description}</p>
                                        )}
                                        {ad.link_url && (
                                            <a
                                                href={ad.link_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[10px] text-brand font-bold mt-1 hover:underline"
                                            >
                                                <Link size={8} />
                                                {ad.link_url.length > 40 ? ad.link_url.substring(0, 40) + '...' : ad.link_url}
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <button
                                            onClick={() => toggleActive(ad)}
                                            className={`p-2 rounded-xl transition-all ${
                                                ad.is_active
                                                    ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                        >
                                            {ad.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                        <button
                                            onClick={() => openEdit(ad)}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ad.id)}
                                            className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                        isAdRunning(ad)
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {isAdRunning(ad) ? 'نشط' : 'غير نشط'}
                                    </span>
                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-brand/10 text-brand">
                                        {getPlacementText(ad.placement)}
                                    </span>
                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-600">
                                        {getTypeText(ad.type)}
                                    </span>
                                </div>

                                {/* Dates */}
                                <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
                                    <Calendar size={10} />
                                    <span>{ad.start_date?.split('T')[0]} ← {ad.end_date?.split('T')[0]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Megaphone size={22} className="text-brand" />
                                {editingAd ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
                            </h3>
                            <form onSubmit={handleSave} className="space-y-4">
                                {/* Type & Placement */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">نوع الإعلان</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'text', label: 'نصي', icon: Type },
                                                { value: 'media', label: 'وسائط', icon: ImageIcon },
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setAdData({ ...adData, type: opt.value })}
                                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm ${
                                                        adData.type === opt.value
                                                            ? 'border-brand bg-brand/5 text-brand'
                                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <opt.icon size={16} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">مكان العرض</label>
                                        <select
                                            value={adData.placement}
                                            onChange={(e) => setAdData({ ...adData, placement: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all font-bold cursor-pointer"
                                        >
                                            <option value="banner">بانر عريض</option>
                                            <option value="sidebar">جانبي</option>
                                            <option value="footer">فوتر</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">العنوان</label>
                                    <input
                                        type="text"
                                        value={adData.title}
                                        onChange={(e) => setAdData({ ...adData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الوصف</label>
                                    <textarea
                                        value={adData.description}
                                        onChange={(e) => setAdData({ ...adData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all resize-none"
                                        rows={3}
                                    />
                                </div>

                                {/* Media fields */}
                                {adData.type === 'media' && (
                                    <div className="space-y-4">
                                        {/* File Upload */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">صورة أو فيديو الإعلان</label>
                                            {adData.media_file_preview ? (
                                                <div className="relative rounded-xl overflow-hidden border-2 border-brand/20">
                                                    {adData.media_type === 'video' || adData.media_file?.name?.match(/\.(mp4|webm|mov)$/i) ? (
                                                        <video src={adData.media_file_preview} className="w-full h-48 object-cover" controls />
                                                    ) : (
                                                        <img src={adData.media_file_preview} alt="Preview" className="w-full h-48 object-cover" />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={removeMediaFile}
                                                        className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-brand hover:bg-brand/5 transition-all">
                                                    <Upload size={32} className="text-slate-400 mb-2" />
                                                    <span className="text-sm font-bold text-slate-500">اضغط لرفع صورة أو فيديو</span>
                                                    <span className="text-[10px] text-slate-400 mt-1">JPG, PNG, GIF, MP4, WebM, MOV (حد أقصى 50MB)</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*,video/*"
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>

                                        {/* Media Type */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">نوع الوسائط</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { value: 'image', label: 'صورة' },
                                                    { value: 'video', label: 'فيديو' },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setAdData({ ...adData, media_type: opt.value })}
                                                        className={`p-3 rounded-xl border-2 transition-all font-bold text-sm ${
                                                            adData.media_type === opt.value
                                                                ? 'border-brand bg-brand/5 text-brand'
                                                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* OR URL */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">أو الصق رابط الوسائط (اختياري)</label>
                                            <input
                                                type="text"
                                                value={adData.media_url}
                                                onChange={(e) => setAdData({ ...adData, media_url: e.target.value })}
                                                placeholder="https://..."
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Link URL */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">رابط الانتقال (اختياري)</label>
                                    <div className="relative">
                                        <Link className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            value={adData.link_url}
                                            onChange={(e) => setAdData({ ...adData, link_url: e.target.value })}
                                            placeholder="https://..."
                                            className="w-full pr-11 pl-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ البداية</label>
                                        <input
                                            type="date"
                                            value={adData.start_date}
                                            onChange={(e) => setAdData({ ...adData, start_date: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ النهاية</label>
                                        <input
                                            type="date"
                                            value={adData.end_date}
                                            onChange={(e) => setAdData({ ...adData, end_date: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Sort Order & Active */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">ترتيب العرض</label>
                                        <input
                                            type="number"
                                            value={adData.sort_order}
                                            onChange={(e) => setAdData({ ...adData, sort_order: parseInt(e.target.value) || 0 })}
                                            min="0"
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
                                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={adData.is_active}
                                                onChange={(e) => setAdData({ ...adData, is_active: e.target.checked })}
                                                className="w-5 h-5 text-brand rounded focus:ring-brand"
                                            />
                                            <span className="font-medium text-slate-700">نشط</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="unstyled"
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-brand text-white rounded-xl font-bold hover:bg-pink-600 transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'جاري الحفظ...' : 'حفظ'}
                                    </Button>
                                    <Button
                                        variant="unstyled"
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                    >
                                        إلغاء
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminAds;
