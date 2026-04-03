import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Truck, Store, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterType = () => {
    const navigate = useNavigate();

    const roles = [
        {
            id: 'customer',
            title: 'زبون',
            icon: User,
            desc: 'اطلب طعامك المفضل من أفضل المتاجر',
            color: 'from-brand to-brand-dark',
            bg: 'bg-brand'
        },
        {
            id: 'driver',
            title: 'سائق توصيل',
            icon: Truck,
            desc: 'انضم لأسطول التوصيل وابدأ بالربح',
            color: 'from-brand to-slate-900',
            bg: 'bg-brand'
        },
        {
            id: 'store',
            title: 'صاحب متجر',
            icon: Store,
            desc: 'اعرض منتجاتك ووصل لآلاف العملاء',
            color: 'from-slate-900 to-slate-800',
            bg: 'bg-slate-900'
        }
    ];

    return (
        <div className="w-full">
            <h1 className="text-3xl font-black text-slate-900 mb-2">مرحباً بك في دليفود</h1>
            <p className="text-slate-500 mb-8 font-medium">اختر نوع الحساب للمتابعة</p>

            <div className="flex flex-wrap gap-2 !w-full mb-8">
                {roles.map((role, index) => (
                    <motion.div
                        key={role.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        onClick={() => navigate(`/register/${role.id}`)}
                        className={`cursor-pointer p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-brand/30 transition-all group w-full flex flex-col items-center text-center bg-white premium-shadow`}
                    >
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all`}>
                            <role.icon size={32} />
                        </div>
                        <h3 className="font-black text-xl text-slate-900 mb-2">{role.title}</h3>
                        <p className="text-sm text-slate-500 mb-6">{role.desc}</p>
                        <div className="flex items-center gap-2 text-sm font-black text-brand">
                            <span>ابدأ الآن</span>
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="text-center">
                <p className="text-slate-500 text-sm">
                    لديك حساب بالفعل؟{' '}
                    <Link to="/login" className="text-brand font-black hover:underline">سجل دخولك</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterType;
