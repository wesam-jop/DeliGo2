import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, ExternalLink, Share2 } from 'lucide-react';
import Button from '../../Components/Button';


const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1500);
    };

    return (
        <div dir="rtl" className="bg-slate-50/50">
            {/* Hero Header */}
            <section className="bg-slate-900 text-white py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-brand-dark/20 pointer-events-none"></div>
                <div className="container mx-auto text-center relative z-10 space-y-4">
                    <motion.span 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-brand font-black tracking-widest uppercase text-sm block"
                    >
                        اتصل بنا
                    </motion.span>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-black"
                    >
                        نحن دائماً <span className="text-brand italic underline decoration-white/20 underline-offset-8">هنا</span> لمساعدتك
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto font-medium"
                    >
                        هل لديك سؤال؟ اقتراح؟ أو حتى شكوى؟ فريقنا جاهز للرد عليك في أي وقت على مدار الساعة.
                    </motion.p>
                </div>
            </section>

            <section className="container mx-auto px-6 -mt-16 pb-24 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-[2.5rem] premium-shadow border border-slate-100 flex items-start gap-6"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                                <Phone size={26} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 mb-1 text-lg">اتصل بنا</h3>
                                <p className="text-slate-500 font-bold mb-1" dir="ltr">+963 930 000 000</p>
                                <p className="text-slate-400 text-sm font-medium">متاح 24/7 للرد على استفساراتكم</p>
                            </div>
                        </motion.div>

                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-[2.5rem] premium-shadow border border-slate-100 flex items-start gap-6"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <Mail size={26} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 mb-1 text-lg">البريد الإلكتروني</h3>
                                <p className="text-slate-500 font-bold mb-1">support@DeliGo.com</p>
                                <p className="text-slate-400 text-sm font-medium">سنرد عليك خلال 2-4 ساعات عمل</p>
                            </div>
                        </motion.div>

                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-[2.5rem] premium-shadow border border-slate-100 flex items-start gap-6"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                                <MapPin size={26} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 mb-1 text-lg">المقر الرئيسي</h3>
                                <p className="text-slate-500 font-bold mb-1">دمشق، سورية</p>
                                <p className="text-slate-400 text-sm font-medium">ساحة الأمويين، بناء التيك ماركت</p>
                            </div>
                        </motion.div>

                        {/* Social Links */}
                        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6">
                            <h3 className="font-black text-xl">تابعنا على</h3>
                            <div className="flex gap-4">
                                {[ExternalLink, ExternalLink, Share2].map((Social, i) => (
                                    <a key={i} href="#" className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-brand transition-all">
                                        <Social size={20} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-10 md:p-14 rounded-[3rem] premium-shadow border border-slate-100 h-full">
                            {submitted ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                                >
                                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                        <Send size={48} />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900">تم الإرسال بنجاح!</h2>
                                    <p className="text-slate-500 text-lg font-bold">شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.</p>
                                    <Button variant="unstyled" 
                                        onClick={() => setSubmitted(false)}
                                        className="px-10 py-4 bg-brand text-white rounded-2xl font-black shadow-xl shadow-brand/20 hover:bg-brand-dark transition-all"
                                    >
                                        إرسال رسالة أخرى
                                    </Button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                            <MessageSquare className="text-brand" size={32} />
                                            أرسل لنا رسالة
                                        </h2>
                                        <p className="text-slate-500 font-medium">املأ النموذج أدناه وسيقوم فريق المختصين لدينا بالتواصل معك.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-black text-slate-700 block mr-2">الاسم بالكامل</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                placeholder="مثال: محمد الأحمد"
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand/40 outline-none transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm font-black text-slate-700 block mr-2">البريد الإلكتروني</label>
                                            <input 
                                                required
                                                type="email" 
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                placeholder="example@mail.com"
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand/40 outline-none transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-slate-700 block mr-2">الموضوع</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={formData.subject}
                                            onChange={e => setFormData({...formData, subject: e.target.value})}
                                            placeholder="كيف يمكننا مساعدتك؟"
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand/40 outline-none transition-all font-bold"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-slate-700 block mr-2">الرسالة</label>
                                        <textarea 
                                            required
                                            rows={6}
                                            value={formData.message}
                                            onChange={e => setFormData({...formData, message: e.target.value})}
                                            placeholder="اكتب رسالتك هنا..."
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand/40 outline-none transition-all font-bold resize-none"
                                        ></textarea>
                                    </div>

                                    <motion.button 
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-brand text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-brand/30 hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <>جاري الإرسال...</>
                                        ) : (
                                            <>إرسال الرسالة <Send size={22} className="rotate-180" /></>
                                        )}
                                    </motion.button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
