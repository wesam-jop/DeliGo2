import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2, Search, X, Save, CheckCircle, AlertCircle, ChevronLeft, DollarSign } from 'lucide-react';
import axios from 'axios';
import Button from '../../Components/Button';


const AdminLocations = () => {
    const [activeTab, setActiveTab] = useState('governorates');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Governorates state
    const [governorates, setGovernorates] = useState([]);
    const [showGovernorateModal, setShowGovernorateModal] = useState(false);
    const [editingGovernorate, setEditingGovernorate] = useState(null);
    const [governorateData, setGovernorateData] = useState({
        name_ar: '',
        name_en: '',
        delivery_fee: '',
    });

    // Areas state
    const [areas, setAreas] = useState([]);
    const [selectedGovernorate, setSelectedGovernorate] = useState(null);
    const [showAreaModal, setShowAreaModal] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [areaData, setAreaData] = useState({
        governorate_id: '',
        name_ar: '',
        name_en: '',
    });

    useEffect(() => {
        fetchGovernorates();
    }, []);

    const fetchGovernorates = async () => {
        try {
            const response = await axios.get('/api/v1/locations/governorates');
            setGovernorates(response.data.data || []);
        } catch (err) {
            console.error('Error fetching governorates:', err);
        }
    };

    const fetchAreas = async (governorateId) => {
        try {
            const response = await axios.get(`/api/v1/locations/governorates/${governorateId}`);
            setAreas(response.data.data?.areas || []);
        } catch (err) {
            console.error('Error fetching areas:', err);
        }
    };

    const handleSaveGovernorate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (editingGovernorate) {
                await axios.post(`/api/v1/admin/locations/governorates/${editingGovernorate.id}`, governorateData);
                setSuccess('تم تحديث المحافظة بنجاح');
            } else {
                await axios.post('/api/v1/admin/locations/governorates', governorateData);
                setSuccess('تم إضافة المحافظة بنجاح');
            }
            setShowGovernorateModal(false);
            setGovernorateData({ name_ar: '', name_en: '', delivery_fee: '' });
            setEditingGovernorate(null);
            fetchGovernorates();
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGovernorate = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذه المحافظة؟')) return;
        
        try {
            await axios.delete(`/api/v1/admin/locations/governorates/${id}`);
            setSuccess('تم حذف المحافظة بنجاح');
            fetchGovernorates();
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleSaveArea = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (editingArea) {
                await axios.post(`/api/v1/admin/locations/areas/${editingArea.id}`, areaData);
                setSuccess('تم تحديث المنطقة بنجاح');
            } else {
                await axios.post('/api/v1/admin/locations/areas', areaData);
                setSuccess('تم إضافة المنطقة بنجاح');
            }
            setShowAreaModal(false);
            setAreaData({ governorate_id: '', name_ar: '', name_en: '' });
            setEditingArea(null);
            if (selectedGovernorate) fetchAreas(selectedGovernorate);
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteArea = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذه المنطقة؟')) return;
        
        try {
            await axios.delete(`/api/v1/admin/locations/areas/${id}`);
            setSuccess('تم حذف المنطقة بنجاح');
            if (selectedGovernorate) fetchAreas(selectedGovernorate);
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
        }
    };

    const openEditGovernorate = (governorate) => {
        setEditingGovernorate(governorate);
        setGovernorateData({
            name_ar: governorate.name_ar || '',
            name_en: governorate.name_en || '',
            delivery_fee: governorate.delivery_fee || '',
        });
        setShowGovernorateModal(true);
    };

    const openEditArea = (area) => {
        setEditingArea(area);
        setAreaData({
            governorate_id: area.governorate_id || '',
            name_ar: area.name_ar || '',
            name_en: area.name_en || '',
        });
        setShowAreaModal(true);
    };

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">إدارة المواقع الجغرافية</h1>
                <p className="text-slate-500 mt-1 font-medium">إضافة وتعديل المحافظات والمناطق</p>
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

            {/* Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex gap-2">
                    <Button variant="unstyled"
                        onClick={() => setActiveTab('governorates')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'governorates'
                                ? 'bg-brand text-white'
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <MapPin size={18} />
                        المحافظات
                    </Button>
                    <Button variant="unstyled"
                        onClick={() => {
                            setActiveTab('areas');
                            if (selectedGovernorate) fetchAreas(selectedGovernorate);
                        }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'areas'
                                ? 'bg-brand text-white'
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <MapPin size={18} />
                        المناطق
                    </Button>
                </div>
            </div>

            {/* Governorates Tab */}
            {activeTab === 'governorates' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">قائمة المحافظات</h3>
                        <Button variant="unstyled"
                            onClick={() => {
                                setEditingGovernorate(null);
                                setGovernorateData({ name_ar: '', name_en: '' });
                                setShowGovernorateModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl font-bold text-sm hover:bg-pink-600 transition-all"
                        >
                            <Plus size={18} />
                            إضافة محافظة
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="text-slate-400 text-xs font-bold border-b border-slate-100">
                                    <th className="pb-4 font-bold">#</th>
                                    <th className="pb-4 font-bold">الاسم العربي</th>
                                    <th className="pb-4 font-bold">الاسم الإنجليزي</th>
                                    <th className="pb-4 font-bold">أجرة التوصيل</th>
                                    <th className="pb-4 font-bold">عدد المناطق</th>
                                    <th className="pb-4 font-bold">الحالة</th>
                                    <th className="pb-4 font-bold">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {governorates.map((gov, index) => (
                                    <tr 
                                        key={gov.id} 
                                        className="border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer"
                                        onClick={() => {
                                            setSelectedGovernorate(gov.id);
                                            setActiveTab('areas');
                                            fetchAreas(gov.id);
                                        }}
                                    >
                                        <td className="py-4 font-black text-slate-500">{index + 1}</td>
                                        <td className="py-4 font-bold text-slate-900">{gov.name_ar}</td>
                                        <td className="py-4 text-slate-500">{gov.name_en}</td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={16} className="text-emerald-600" />
                                                <span className="font-black text-emerald-600">
                                                    {gov.delivery_fee ? `$${parseFloat(gov.delivery_fee).toFixed(2)}` : '$0.00'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                                                {gov.areas?.length || 0} منطقة
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                gov.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {gov.is_active ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </td>
                                        <td className="py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-2">
                                                <Button variant="unstyled"
                                                    onClick={() => openEditGovernorate(gov)}
                                                    className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all"
                                                >
                                                    <Edit size={18} />
                                                </Button>
                                                <Button variant="unstyled"
                                                    onClick={() => handleDeleteGovernorate(gov.id)}
                                                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Areas Tab */}
            {activeTab === 'areas' && (
                <div className="space-y-6">
                    {/* Governorate Selector */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            اختر المحافظة
                        </label>
                        <select
                            value={selectedGovernorate || ''}
                            onChange={(e) => {
                                setSelectedGovernorate(e.target.value);
                                if (e.target.value) fetchAreas(e.target.value);
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                        >
                            <option value="">-- اختر المحافظة --</option>
                            {governorates.map((gov) => (
                                <option key={gov.id} value={gov.id}>
                                    {gov.name_ar}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedGovernorate && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-lg">المناطق</h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {governorates.find(g => g.id === selectedGovernorate)?.name_ar}
                                    </p>
                                </div>
                                <Button variant="unstyled"
                                    onClick={() => {
                                        setEditingArea(null);
                                        setAreaData({ governorate_id: selectedGovernorate, name_ar: '', name_en: '' });
                                        setShowAreaModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl font-bold text-sm hover:bg-pink-600 transition-all"
                                >
                                    <Plus size={18} />
                                    إضافة منطقة
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {areas.map((area) => (
                                    <div 
                                        key={area.id} 
                                        className="p-4 bg-slate-50 rounded-xl border-2 border-slate-100 hover:border-pink-200 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-slate-900">{area.name_ar}</p>
                                                <p className="text-xs text-slate-400">{area.name_en}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="unstyled"
                                                    onClick={() => openEditArea(area)}
                                                    className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                                                >
                                                    <Edit size={14} />
                                                </Button>
                                                <Button variant="unstyled"
                                                    onClick={() => handleDeleteArea(area.id)}
                                                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-1.5">
                                                <DollarSign size={14} className="text-emerald-600" />
                                                <span className="font-bold text-emerald-600 text-sm">
                                                    {(() => {
                                                        const governorate = governorates.find(g => g.id === area.governorate_id);
                                                        const fee = governorate?.delivery_fee || 0;
                                                        return fee > 0 ? `$${parseFloat(fee).toFixed(2)}` : '$0.00';
                                                    })()}
                                                </span>
                                            </div>
                                            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${
                                                area.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {area.is_active ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {areas.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <MapPin size={48} className="mx-auto mb-4 text-slate-300" />
                                    <p className="font-medium">لا توجد مناطق في هذه المحافظة</p>
                                    <Button variant="unstyled"
                                        onClick={() => {
                                            setEditingArea(null);
                                            setAreaData({ governorate_id: selectedGovernorate, name_ar: '', name_en: '' });
                                            setShowAreaModal(true);
                                        }}
                                        className="mt-4 text-brand font-bold hover:underline"
                                    >
                                        إضافة أول منطقة
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Governorate Modal */}
            <AnimatePresence>
                {showGovernorateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGovernorateModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="font-bold text-lg mb-4">
                                {editingGovernorate ? 'تعديل محافظة' : 'إضافة محافظة جديدة'}
                            </h3>
                            <form onSubmit={handleSaveGovernorate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الاسم العربي</label>
                                    <input
                                        type="text"
                                        value={governorateData.name_ar}
                                        onChange={(e) => setGovernorateData({...governorateData, name_ar: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الإنجليزي</label>
                                    <input
                                        type="text"
                                        value={governorateData.name_en}
                                        onChange={(e) => setGovernorateData({...governorateData, name_en: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">أجرة التوصيل ($)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={governorateData.delivery_fee}
                                        onChange={(e) => setGovernorateData({...governorateData, delivery_fee: e.target.value})}
                                        placeholder="3.00"
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        required
                                    />
                                    <p className="text-xs text-slate-400 mt-1">سيتم تطبيق هذا السعر على جميع المناطق في هذه المحافظة</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="unstyled"
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-brand text-white rounded-xl font-bold hover:bg-pink-600 transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'جاري الحفظ...' : 'حفظ'}
                                    </Button>
                                    <Button variant="unstyled"
                                        type="button"
                                        onClick={() => setShowGovernorateModal(false)}
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

            {/* Area Modal */}
            <AnimatePresence>
                {showAreaModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAreaModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="font-bold text-lg mb-4">
                                {editingArea ? 'تعديل منطقة' : 'إضافة منطقة جديدة'}
                            </h3>
                            <form onSubmit={handleSaveArea} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">المحافظة</label>
                                    <select
                                        value={areaData.governorate_id}
                                        onChange={(e) => setAreaData({...areaData, governorate_id: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        required
                                        disabled={!!editingArea}
                                    >
                                        <option value="">-- اختر المحافظة --</option>
                                        {governorates.map((gov) => (
                                            <option key={gov.id} value={gov.id}>
                                                {gov.name_ar}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الاسم العربي</label>
                                    <input
                                        type="text"
                                        value={areaData.name_ar}
                                        onChange={(e) => setAreaData({...areaData, name_ar: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الإنجليزي</label>
                                    <input
                                        type="text"
                                        value={areaData.name_en}
                                        onChange={(e) => setAreaData({...areaData, name_en: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        required
                                    />
                                </div>
                                {areaData.governorate_id && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                        <p className="text-xs font-bold text-emerald-600 mb-1">أجرة التوصيل في هذه المحافظة:</p>
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={20} className="text-emerald-600" />
                                            <span className="font-black text-emerald-600 text-lg">
                                                {(() => {
                                                    const governorate = governorates.find(g => g.id === parseInt(areaData.governorate_id));
                                                    const fee = governorate?.delivery_fee || 0;
                                                    return fee > 0 ? `$${parseFloat(fee).toFixed(2)}` : '$0.00';
                                                })()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-emerald-600 mt-2">سيتم تطبيق هذه الأجرة على جميع الطلبات في هذه المنطقة</p>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <Button variant="unstyled"
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-brand text-white rounded-xl font-bold hover:bg-pink-600 transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'جاري الحفظ...' : 'حفظ'}
                                    </Button>
                                    <Button variant="unstyled"
                                        type="button"
                                        onClick={() => setShowAreaModal(false)}
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

export default AdminLocations;
