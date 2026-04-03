import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, Clock } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 premium-shadow group cursor-pointer"
    >
        <div className="flex justify-between items-start">
            <div className={`w-14 h-14 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center transition-all group-hover:scale-110 shadow-sm`}>
                <Icon size={28} className={color.replace('bg-', 'text-')} />
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
                    <TrendingUp size={12} />
                    {trend}%
                </div>
            )}
        </div>
        <div className="mt-5">
            <p className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 leading-none">{value}</h3>
        </div>
        <div className="mt-5 pt-4 border-t border-slate-50 flex items-center text-[10px] text-slate-400 font-bold">
            <Clock size={12} className="ml-1 opacity-70" />
            <span>تحديث مباشر</span>
            <ArrowUpRight size={16} className="mr-auto opacity-0 group-hover:opacity-100 transition-all text-brand" />
        </div>
    </motion.div>
);

export default StatCard;
