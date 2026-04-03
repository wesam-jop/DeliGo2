import React from 'react';
import { X, User, Phone, Mail, Shield, MapPin, Calendar, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../Components/Button';


const UserDetailsModal = ({ user, onClose }) => {
    const getRoleBadge = (role) => {
        const badges = {
            'customer': { label: 'زبون', color: 'bg-blue-100 text-blue-600' },
            'store_owner': { label: 'صاحب متجر', color: 'bg-amber-100 text-amber-600' },
            'driver': { label: 'سائق', color: 'bg-purple-100 text-purple-600' },
            'admin': { label: 'مدير', color: 'bg-red-100 text-red-600' },
        };
        return badges[role] || { label: role, color: 'bg-slate-100 text-slate-600' };
    };

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
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-brand to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">{user.name}</h2>
                                <p className="text-sm text-slate-400 mt-1">{user.phone}</p>
                            </div>
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
                        {/* Role & Status */}
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${getRoleBadge(user.role).color}`}>
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">الدور</p>
                                        <p className={`font-bold ${getRoleBadge(user.role).color.replace('bg-', 'text-')}`}>
                                            {getRoleBadge(user.role).label}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {user.phone_verified_at && (
                                        <div className="text-left">
                                            <p className="text-xs text-slate-400 mb-1">الهاتف</p>
                                            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                                <CheckCircle size={14} />
                                                موثق
                                            </p>
                                        </div>
                                    )}
                                    {user.is_approved && (
                                        <div className="text-left">
                                            <p className="text-xs text-slate-400 mb-1">الموافقة</p>
                                            <p className="text-sm font-bold text-blue-600 flex items-center gap-1">
                                                <CheckCircle size={14} />
                                                موافق
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <User size={20} className="text-brand" />
                                معلومات التواصل
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">الاسم الكامل</p>
                                    <p className="font-bold text-slate-900">{user.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">رقم الهاتف</p>
                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                        <Phone size={16} className="text-slate-400" />
                                        {user.phone}
                                    </p>
                                </div>
                                {user.email && (
                                    <>
                                        <div>
                                            <p className="text-sm text-slate-400 mb-1">البريد الإلكتروني</p>
                                            <p className="font-bold text-slate-900 flex items-center gap-2">
                                                <Mail size={16} className="text-slate-400" />
                                                {user.email}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-400 mb-1">حالة البريد</p>
                                            {user.email_verified_at ? (
                                                <p className="font-bold text-emerald-600 flex items-center gap-2">
                                                    <CheckCircle size={16} />
                                                    موثق
                                                </p>
                                            ) : (
                                                <p className="font-bold text-slate-400 flex items-center gap-2">
                                                    <Clock size={16} />
                                                    غير موثق
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        {(user.governorate || user.area) && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <MapPin size={20} className="text-brand" />
                                    الموقع
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">المحافظة</p>
                                        <p className="font-bold text-slate-900">{user.governorate?.name_ar || 'غير محدد'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">المنطقة</p>
                                        <p className="font-bold text-slate-900">{user.area?.name_ar || 'غير محدد'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Verification Status */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <CheckCircle size={20} className="text-brand" />
                                حالة التحقق والموافقة
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600">رقم الهاتف</span>
                                    {user.phone_verified_at ? (
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
                                    {user.is_approved ? (
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
                                {user.rejection_reason && (
                                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                        <p className="text-xs text-red-500 font-medium mb-1">سبب الرفض:</p>
                                        <p className="text-sm text-red-600">{user.rejection_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-brand" />
                                معلومات الحساب
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">تاريخ التسجيل</p>
                                    <p className="font-bold text-slate-900">
                                        {new Date(user.created_at).toLocaleDateString('ar-SY', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">آخر تحديث</p>
                                    <p className="font-bold text-slate-900">
                                        {new Date(user.updated_at).toLocaleDateString('ar-SY', {
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

export default UserDetailsModal;
