import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, CircleHelp, ShoppingBag, Truck, User, CreditCard, MessageSquare } from 'lucide-react';
import Button from '../../Components/Button';
import AdOrchestrator from '../../Components/AdOrchestrator';


const Help = () => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('orders');

    const categories = [
        { id: 'orders', title: 'الطلبات', icon: ShoppingBag, color: 'text-brand bg-brand/10' },
        { id: 'delivery', title: 'التوصيل', icon: Truck, color: 'text-emerald-600 bg-emerald-100' },
        { id: 'account', title: 'الحساب', icon: User, color: 'text-slate-600 bg-slate-100' },
        { id: 'payment', title: 'الدفع', icon: CreditCard, color: 'text-orange-600 bg-orange-100' },
    ];

    const questions = [
        { id: 1, cat: 'orders', q: 'كيف يمكنني إلغاء الطلب؟', a: 'يمكنك إلغاء الطلب قبل أن يبدأ المتجر في تحضيره من خلال صفحة "طلباتي" في حسابك الشخصي.' },
        { id: 2, cat: 'orders', q: 'هل يمكنني تعديل الطلب بعد تأكيده؟', a: 'للأسف، لا يمكن تعديل الطلب بعد تأكيده، ولكن يمكنك التواصل مع المتجر مباشرة أو إلغاء الطلب وإعادة طلبه مرة أخرى.' },
        { id: 3, cat: 'delivery', q: 'كم تبلغ تكلفة التوصيل؟', a: 'تختلف تكلفة التوصيل بناءً على المسافة بين موقعك والمتجر المختار، وسيتم عرض التكلفة بوضوح قبل إتمام الطلب.' },
        { id: 4, cat: 'delivery', q: 'كيف أتواصل مع السائق؟', a: 'بمجرد استلام السائق لطلبك، سيظهر لك خيار التواصل عبر الهاتف أو المحادثة المباشرة في صفحة تتبع الطلب.' },
        { id: 5, cat: 'account', q: 'كيف يمكنني استعادة كلمة المرور؟', a: 'اضغط على "نسيت كلمة المرور" في صفحة تسجيل الدخول وسنقوم بإرسال رمز تحقق إلى رقم هاتفك المسجل.' },
        { id: 6, cat: 'payment', q: 'ما هي طرق الدفع المتاحة؟', a: 'حالياً ندعم الدفع نقداً عند الاستلام (Cash on Delivery) ونعمل على إضافة طرق دفع إلكترونية قريباً.' },
    ];

    const filteredQuestions = questions.filter(item => 
        (activeTab === 'all' || item.cat === activeTab) &&
        (item.q.includes(search) || item.a.includes(search))
    );

    const [openId, setOpenId] = useState(null);

    return (
        <div dir="rtl" className="bg-slate-50 min-h-screen pb-32">
            {/* Header */}
            <section className="bg-slate-900 text-white py-24 text-center px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-brand-dark/20 pointer-events-none"></div>
                <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-20 h-20 bg-brand rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-brand/20">
                        <CircleHelp size={40} className="text-white" />
                    </motion.div>
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black">مركز <span className="text-brand">المساعدة</span></h1>
                        <p className="text-slate-400 text-xl font-medium">كل ما تحتاجه من إجابات حول خدماتنا في مكان واحد.</p>
                    </div>
                </div>
            </section>

            {/* Search */}
            <div className="container mx-auto px-6 -mt-10 relative z-20">
                <div className="max-w-3xl mx-auto group">
                    <div className="relative premium-shadow">
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={26} />
                        <input 
                            type="text" 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ابحث عن سؤالك هنا..."
                            className="w-full pr-16 pl-8 py-6 md:py-8 bg-white border-2 border-transparent rounded-[2.5rem] focus:border-brand/40 outline-none transition-all text-xl font-bold"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 mt-16 max-w-5xl">
                {/* Categories */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {categories.map((cat) => (
                        <Button variant="unstyled" 
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`p-6 rounded-[2rem] border-2 transition-all text-center space-y-4 ${
                                activeTab === cat.id 
                                    ? 'bg-white border-brand shadow-xl translate-y-[-4px]' 
                                    : 'bg-white border-transparent border-slate-100 hover:bg-slate-100 font-medium'
                            }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${cat.color}`}>
                                <cat.icon size={26} />
                            </div>
                            <h3 className={`font-black tracking-wide ${activeTab === cat.id ? 'text-brand' : 'text-slate-700'}`}>{cat.title}</h3>
                        </Button>
                    ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                    {filteredQuestions.length > 0 ? (
                        filteredQuestions.map((q) => (
                            <div 
                                key={q.id} 
                                className="bg-white rounded-3xl border border-slate-100 overflow-hidden premium-shadow"
                            >
                                <Button variant="unstyled" 
                                    onClick={() => setOpenId(openId === q.id ? null : q.id)}
                                    className="w-full px-8 py-6 text-right flex items-center justify-between hover:bg-slate-50 transition-all font-black text-slate-800 text-lg"
                                >
                                    <span>{q.q}</span>
                                    <ChevronDown className={`transition-transform duration-300 ${openId === q.id ? 'rotate-180 text-brand' : 'text-slate-400'}`} size={20} />
                                </Button>
                                <AnimatePresence>
                                    {openId === q.id && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-8 pb-8 pt-2 text-slate-500 font-medium text-lg leading-relaxed border-t border-slate-50">
                                                {q.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-200">
                             <Search size={64} className="mx-auto mb-4 text-slate-300" />
                             <h3 className="text-2xl font-black text-slate-900 mb-2">لا توجد نتائج</h3>
                             <p className="text-slate-500 font-bold">جرب كلمات بحث أخرى أو تواصل معنا مباشرة</p>
                        </div>
                    )}
                </div>

                {/* Still Need Help */}
                <div className="mt-20 p-12 bg-slate-900 rounded-[3rem] text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full -mr-32 -mt-32"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center">
                            <MessageSquare size={32} />
                        </div>
                        <h2 className="text-3xl font-black">ما زلت بحاجة للمساعدة؟</h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">إذا لم تجد الإجابة التي تبحث عنها، يمكنك التواصل مع فريق الدعم الفني مباشرة.</p>
                        <div className="flex justify-center gap-4 pt-4">
                            <Button variant="unstyled" className="px-10 py-4 bg-brand text-white rounded-2xl font-black shadow-xl shadow-brand/20 hover:bg-brand-dark transition-all">تواصل معنا</Button>
                            <Button variant="unstyled" className="px-10 py-4 bg-white/10 text-white rounded-2xl font-black hover:bg-white/20 transition-all border border-white/10">المحادثة المباشرة</Button>
                        </div>
                    </div>
                </div>
            </div>
            <AdOrchestrator placement="banner" variant="minimal" autoPlayInterval={12000} />
        </div>
    );
};

export default Help;
