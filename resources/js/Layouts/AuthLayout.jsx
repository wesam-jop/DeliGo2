import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthLayout = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-body" dir="rtl">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] overflow-hidden premium-shadow min-h-[700px]">
                {/* Side Content or Image */}
                <div className="hidden lg:flex bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-dark/20 rounded-full blur-3xl -ml-32 -mb-32 animate-pulse delay-700"></div>

                    <div className="relative z-10">
                        <Link to="/" className="text-4xl font-black test text-white mb-8 block">Mishwari</Link>
                        <h2 className="text-5xl font-black text-white leading-tight">
                            ابدأ رحلتك معنا <br /> <span className="text-brand italic underline decoration-white/20 underline-offset-8">اليوم</span>
                        </h2>
                        <p className="text-slate-400 mt-6 text-lg max-w-sm">
                            اكتشف أفضل المتاجر والخدمات في مكان واحد. سرعة، أمان، وسهولة تامة.
                        </p>
                    </div>

                    {/* <div className="relative z-10">
                        <div className="flex bg-slate-800/50 p-4 rounded-2xl backdrop-blur-sm border border-slate-700/50 items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-700"></div>
                            <div>
                                <p className="text-sm font-bold text-white test">"تجربة مستخدم رائعة وخدمة لا مثيل لها."</p>
                                <p className="text-xs text-slate-400 mt-1 font-bold">سامر العلي - زبون مميز</p>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* Main Auth Component */}
                <div className="p-8 lg:p-16 flex flex-col justify-center">
                    <div className="lg:hidden text-center mb-8">
                        <Link to="/" className="text-3xl font-black test text-slate-900">Mishwari</Link>
                    </div>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
