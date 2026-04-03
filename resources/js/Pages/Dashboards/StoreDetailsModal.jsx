import React from 'react';
import { X, Store, MapPin, Phone, User, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../Components/Button';


const StoreDetailsModal = ({ store, onClose }) => {
    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">{store.name}</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {typeof store.category === 'string' ? store.category : (store.category?.name_ar || store.category?.name || 'غير محدد')}
                            </p>
                        </div>
                        <Button variant="unstyled"
                            onClick={onClose}
                            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Status & Info */}
                        <div className={`p-4 rounded-2xl ${
                            store.status === 'pending' ? 'bg-amber-50' :
                            store.status === 'approved' ? 'bg-emerald-50' :
                            'bg-red-50'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${
                                        store.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                        store.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        <Store size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">حالة المتجر</p>
                                        <p className={`font-bold ${
                                            store.status === 'pending' ? 'text-amber-600' :
                                            store.status === 'approved' ? 'text-emerald-600' :
                                            'text-red-600'
                                        }`}>
                                            {store.status === 'pending' ? 'بانتظار الموافقة' :
                                             store.status === 'approved' ? 'مفعّل' : 'مرفوض'}
                                        </p>
                                    </div>
                                </div>
                                {store.rejection_reason && (
                                    <div className="text-left max-w-[200px]">
                                        <p className="text-xs text-red-500 font-medium">سبب الرفض:</p>
                                        <p className="text-xs text-red-600">{store.rejection_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Owner Info */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <User size={20} className="text-brand" />
                                معلومات صاحب المتجر
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">الاسم</p>
                                    <p className="font-bold text-slate-900">{store.owner?.name || 'غير متوفر'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">رقم الهاتف</p>
                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                        <Phone size={16} className="text-slate-400" />
                                        {store.owner?.phone || 'غير متوفر'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <MapPin size={20} className="text-brand" />
                                العنوان والموقع
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">العنوان</p>
                                    <p className="font-bold text-slate-900">{store.address_details || 'غير متوفر'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">المحافظة</p>
                                        <p className="font-bold text-slate-900">{store.governorate?.name_ar || 'غير متوفر'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">المنطقة</p>
                                        <p className="font-bold text-slate-900">{store.area?.name_ar || 'غير متوفر'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact & Description */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Phone size={20} className="text-brand" />
                                معلومات التواصل
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">رقم هاتف المتجر</p>
                                    <p className="font-bold text-slate-900">{store.phone || 'غير متوفر'}</p>
                                </div>
                                {store.description && (
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">الوصف</p>
                                        <p className="font-medium text-slate-700">{store.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-brand" />
                                معلومات الإنشاء
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">تاريخ الإنشاء</p>
                                    <p className="font-bold text-slate-900">
                                        {new Date(store.created_at).toLocaleDateString('ar-SY')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">آخر تحديث</p>
                                    <p className="font-bold text-slate-900">
                                        {new Date(store.updated_at).toLocaleDateString('ar-SY')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StoreDetailsModal;
