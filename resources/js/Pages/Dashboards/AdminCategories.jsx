import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Edit, Trash2, Search, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Button from '../../Components/Button';


const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryData, setCategoryData] = useState({
        name_ar: '',
        name_en: '',
        description_ar: '',
        description_en: '',
        icon: '',
        color: '#ec4899',
        is_active: true,
    });

    const colorOptions = [
        '#ec4899', // Pink
        '#ef4444', // Red
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#f97316', // Orange
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/v1/admin/categories');
            setCategories(response.data.data || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (editingCategory) {
                await axios.put(`/api/v1/admin/categories/${editingCategory.id}`, categoryData);
                setSuccess('تم تحديث التصنيف بنجاح');
            } else {
                await axios.post('/api/v1/admin/categories', categoryData);
                setSuccess('تم إضافة التصنيف بنجاح');
            }
            setShowModal(false);
            setCategoryData({
                name_ar: '',
                name_en: '',
                description_ar: '',
                description_en: '',
                icon: '',
                color: '#ec4899',
                is_active: true,
            });
            setEditingCategory(null);
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
        
        try {
            await axios.delete(`/api/v1/admin/categories/${id}`);
            setSuccess('تم حذف التصنيف بنجاح');
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
        }
    };

    const openEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryData({
            name_ar: category.name_ar || '',
            name_en: category.name_en || '',
            description_ar: category.description_ar || '',
            description_en: category.description_en || '',
            icon: category.icon || '',
            color: category.color || '#ec4899',
            is_active: category.is_active ?? true,
        });
        setShowModal(true);
    };

    const filteredCategories = categories.filter(cat => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            cat.name_ar?.toLowerCase().includes(search) ||
            cat.name_en?.toLowerCase().includes(search)
        );
    });

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">إدارة التصنيفات</h1>
                <p className="text-slate-500 mt-1 font-medium">إضافة وتعديل تصنيفات المنتجات والمتاجر</p>
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

            {/* Search & Add */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ابحث عن تصنيف..."
                            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                        />
                    </div>
                    <Button variant="unstyled"
                        onClick={() => {
                            setEditingCategory(null);
                            setCategoryData({
                                name_ar: '',
                                name_en: '',
                                description_ar: '',
                                description_en: '',
                                icon: '',
                                color: '#ec4899',
                                is_active: true,
                            });
                            setShowModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-pink-600 transition-all"
                    >
                        <Plus size={18} />
                        إضافة تصنيف
                    </Button>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">قائمة التصنيفات</h3>
                    <span className="text-sm text-slate-400 font-medium">
                        {filteredCategories.length} تصنيف
                    </span>
                </div>

                {filteredCategories.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Tag size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد تصنيفات</p>
                        <Button variant="unstyled"
                            onClick={() => setShowModal(true)}
                            className="mt-4 text-brand font-bold hover:underline"
                        >
                            إضافة أول تصنيف
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCategories.map((category) => (
                            <div 
                                key={category.id} 
                                className="p-6 rounded-2xl border-2 border-slate-100 hover:border-pink-200 transition-all group"
                                style={{ borderColor: category.color }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div 
                                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        {category.icon || <Tag size={24} />}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="unstyled"
                                            onClick={() => openEditCategory(category)}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all"
                                        >
                                            <Edit size={18} />
                                        </Button>
                                        <Button variant="unstyled"
                                            onClick={() => handleDeleteCategory(category.id)}
                                            className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-bold text-lg text-slate-900">{category.name_ar}</h4>
                                    <p className="text-sm text-slate-400">{category.name_en}</p>
                                    {category.description_ar && (
                                        <p className="text-xs text-slate-500 line-clamp-2">{category.description_ar}</p>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        category.is_active 
                                            ? 'bg-emerald-100 text-emerald-600' 
                                            : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {category.is_active ? 'نشط' : 'غير نشط'}
                                    </span>
                                    <div 
                                        className="w-6 h-6 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Category Modal */}
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
                            <h3 className="font-bold text-lg mb-4">
                                {editingCategory ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}
                            </h3>
                            <form onSubmit={handleSaveCategory} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الاسم العربي</label>
                                        <input
                                            type="text"
                                            value={categoryData.name_ar}
                                            onChange={(e) => setCategoryData({...categoryData, name_ar: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الإنجليزي</label>
                                        <input
                                            type="text"
                                            value={categoryData.name_en}
                                            onChange={(e) => setCategoryData({...categoryData, name_en: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الوصف العربي</label>
                                        <textarea
                                            value={categoryData.description_ar}
                                            onChange={(e) => setCategoryData({...categoryData, description_ar: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all resize-none h-24"
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الوصف الإنجليزي</label>
                                        <textarea
                                            value={categoryData.description_en}
                                            onChange={(e) => setCategoryData({...categoryData, description_en: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all resize-none h-24"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الأيقونة (emoji)</label>
                                        <input
                                            type="text"
                                            value={categoryData.icon}
                                            onChange={(e) => setCategoryData({...categoryData, icon: e.target.value})}
                                            placeholder="🍔"
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all text-2xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
                                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={categoryData.is_active}
                                                onChange={(e) => setCategoryData({...categoryData, is_active: e.target.checked})}
                                                className="w-5 h-5 text-brand rounded focus:ring-brand"
                                            />
                                            <span className="font-medium text-slate-700">نشط</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">اللون</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {colorOptions.map((color) => (
                                            <Button variant="unstyled"
                                                key={color}
                                                type="button"
                                                onClick={() => setCategoryData({...categoryData, color})}
                                                className={`w-10 h-10 rounded-xl transition-all ${
                                                    categoryData.color === color 
                                                        ? 'ring-4 ring-offset-2 ring-brand scale-110' 
                                                        : 'hover:scale-105'
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={categoryData.color}
                                            onChange={(e) => setCategoryData({...categoryData, color: e.target.value})}
                                            className="w-10 h-10 rounded-xl cursor-pointer border-0"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button variant="unstyled"
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-brand text-white rounded-xl font-bold hover:bg-pink-600 transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'جاري الحفظ...' : 'حفظ'}
                                    </Button>
                                    <Button variant="unstyled"
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

export default AdminCategories;
