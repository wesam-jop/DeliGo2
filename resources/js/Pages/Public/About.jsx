import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Truck, Heart } from 'lucide-react';
import AdOrchestrator from '../../Components/AdOrchestrator';


const About = () => (
    <div dir="rtl" className="space-y-24 pb-24">
        {/* Hero */}
        <section className="bg-slate-900 text-white py-32 text-center px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-brand-dark/20 pointer-events-none"></div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                <span className="text-brand font-bold tracking-wider uppercase text-sm">قصتنا</span>
                <h1 className="text-5xl font-black test leading-tight">نحن <span className="text-brand">DeliGo</span><br />توصيل بدم حار</h1>
                <p className="text-slate-400 text-xl font-medium leading-relaxed">
                    بدأنا رحلتنا بفكرة بسيطة: جعل حياة الناس أسهل عبر توصيل ما يريدونه بأسرع وقت وأعلى جودة. اليوم نحن فخورون بخدمة آلاف العملاء يومياً.
                </p>
            </div>
        </section>

        {/* Mission & Vision */}
        <section className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: Target, title: 'مهمتنا', desc: 'نسعى لتوفير تجربة توصيل لا مثيل لها، مبنية على الثقة والسرعة والجودة في كل خطوة.', color: 'bg-brand/10 text-brand' },
                    { icon: Heart, title: 'قيمنا', desc: 'نؤمن بالصدق مع عملائنا وشركائنا، ونعمل بشغف لتحقيق رضاهم التام في كل تجربة.', color: 'bg-red-100 text-red-500' },
                    { icon: Truck, title: 'رؤيتنا', desc: 'أن نكون المنصة الرائدة في المنطقة بحلول 2028، مع شبكة من آلاف المتاجر والسائقين.', color: 'bg-orange-100 text-orange-600' },
                ].map((item, i) => (
                    <motion.div key={i} whileHover={{ y: -10 }} className="p-10 bg-white rounded-[2.5rem] premium-shadow border border-slate-100 text-center space-y-5">
                        <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto`}>
                            <item.icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold">{item.title}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* Subtle ad between sections */}
        <AdOrchestrator placement="banner" variant="compact" autoPlayInterval={8000} />

        {/* Team */}
        <section className="container mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black test">فريق <span className="text-brand">العمل</span></h2>
                <p className="text-slate-500 mt-3 font-medium">هؤلاء هم الناس الرائعون الذين يجعلون كل شيء ممكناً.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                    { name: 'أحمد الزيدان', role: 'المؤسس والرئيس التنفيذي', initials: 'AZ' },
                    { name: 'سارة محمد', role: 'مديرة التسويق', initials: 'SM' },
                    { name: 'باسم علي', role: 'المطور الرئيسي', initials: 'BA' },
                    { name: 'هنا خالد', role: 'مصممة UX', initials: 'HK' },
                ].map((member, i) => (
                    <motion.div key={i} whileHover={{ y: -8 }} className="text-center group">
                        <div className="w-full aspect-square bg-gradient-to-br from-slate-200 to-slate-300 rounded-[2.5rem] flex items-center justify-center text-3xl font-black text-white test mb-5 group-hover:from-brand group-hover:to-brand-dark transition-all duration-500 premium-shadow">
                            {member.initials}
                        </div>
                        <h3 className="font-bold text-slate-900">{member.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{member.role}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    </div>
);

export default About;
