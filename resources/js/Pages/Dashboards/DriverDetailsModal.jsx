import React from 'react';
import { X, Truck, Phone, MapPin, User, Clock, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../Components/Button';


const DriverDetailsModal = ({ driver, onClose }) => {
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
                            <h2 className="text-xl font-black text-slate-900">{driver.name}</h2>
                            <p className="text-sm text-slate-400 mt-1">سائق توصيل</p>
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
                            driver.status === 'pending' ? 'bg-amber-50' :
                            driver.status === 'approved' ? 'bg-emerald-50' :
                            'bg-red-50'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${
                                        driver.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                        driver.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">حالة السائق</p>
                                        <p className={`font-bold ${
                                            driver.status === 'pending' ? 'text-amber-600' :
                                            driver.status === 'approved' ? 'text-emerald-600' :
                                            'text-red-600'
                                        }`}>
                                            {driver.status === 'pending' ? 'بانتظار الموافقة' :
                                             driver.status === 'approved' ? 'مفعّل' : 'مرفوض'}
                                        </p>
                                    </div>
                                </div>
                                {driver.is_online !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${driver.is_online ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <span className={`text-sm font-bold ${driver.is_online ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {driver.is_online ? 'متاح' : 'غير متاح'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {driver.rejection_reason && (
                                <div className="mt-4 p-3 bg-red-50 rounded-xl">
                                    <p className="text-xs text-red-500 font-medium mb-1">سبب الرفض:</p>
                                    <p className="text-sm text-red-600">{driver.rejection_reason}</p>
                                </div>
                            )}
                        </div>

                        {/* Personal Info */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <User size={20} className="text-brand" />
                                المعلومات الشخصية
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">الاسم الكامل</p>
                                    <p className="font-bold text-slate-900">{driver.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">رقم الهاتف</p>
                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                        <Phone size={16} className="text-slate-400" />
                                        {driver.phone}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <MapPin size={20} className="text-brand" />
                                الموقع والمنطقة
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">المحافظة</p>
                                    <p className="font-bold text-slate-900">{driver.governorate?.name_ar || 'غير محدد'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">المنطقة</p>
                                    <p className="font-bold text-slate-900">{driver.area?.name_ar || 'غير محدد'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Verification Status */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <CheckCircle size={20} className="text-brand" />
                                حالة التحقق
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600">رقم الهاتف</span>
                                    {driver.phone_verified_at ? (
                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle size={14} />
                                            موثق
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400">غير موثق</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600">حالة الموافقة</span>
                                    {driver.is_approved ? (
                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle size={14} />
                                            موافق عليه
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                            <Clock size={14} />
                                            قيد الانتظار
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-brand" />
                                معلومات التسجيل
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">تاريخ التسجيل</p>
                                    <p className="font-bold text-slate-900">
                                        {new Date(driver.created_at).toLocaleDateString('ar-SY', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">آخر تحديث</p>
                                    <p className="font-bold text-slate-900">
                                        {new Date(driver.updated_at).toLocaleDateString('ar-SY', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
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

export default DriverDetailsModal;
