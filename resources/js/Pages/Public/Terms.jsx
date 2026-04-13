import React from 'react';
import AdOrchestrator from '../../Components/AdOrchestrator';

const Section = ({ title, children }) => (
    <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-500 leading-loose font-medium">{children}</p>
    </div>
);

const Terms = () => (
    <div className="container mx-auto px-6 py-16 max-w-4xl" dir="rtl">
        <div className="mb-16 space-y-4">
            <span className="text-brand font-bold text-sm uppercase tracking-wider">قانوني</span>
            <h1 className="text-5xl font-black text-slate-900 test">شروط <span className="text-brand">الاستخدام</span></h1>
            <p className="text-slate-400">آخر تحديث: مارس 2026</p>
        </div>
        <div className="bg-white p-12 rounded-[3rem] premium-shadow border border-slate-100 space-y-12">
            <Section title="١. القبول بالشروط">
                باستخدامك لمنصة DeliGo (Dele)، فإنك توافق على الالتزام بجميع الشروط والأحكام الموضحة في هذه الصفحة. إذا كنت لا توافق على أي من هذه الشروط، يُرجى التوقف عن استخدام المنصة.
            </Section>
            <Section title="٢. الحساب الشخصي">
                أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة مرورك. يجب أن تكون فوق سن الثامنة عشرة لإنشاء حساب. تتحمل المسؤولية الكاملة عن جميع الأنشطة التي تجري عبر حسابك.
            </Section>
            <Section title="٣. الطلبات والدفع">
                جميع الأسعار المعروضة تشمل ضريبة القيمة المضافة. بعد تأكيد الطلب، قد لا يمكن إلغاؤه في بعض الحالات. في حال وجود مشكلة في الطلب، يحق لك تقديم شكوى خلال 24 ساعة.
            </Section>
            <Section title="٤. سلوك المستخدم">
                يُحظر استخدام المنصة في أي نشاط مخالف للقانون، أو التحرش بأي طرف، أو نشر محتوى مسيء. نحتفظ بحق تعليق أو إنهاء أي حساب يخالف هذه الشروط.
            </Section>
            <Section title="٥. التغييرات على الشروط">
                نحتفظ بحق تعديل هذه الشروط في أي وقت. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق. الاستمرار في استخدام الخدمة يعني قبولك للشروط الجديدة.
            </Section>
        </div>
        <AdOrchestrator placement="banner" variant="minimal" autoPlayInterval={12000} />
    </div>
);

export default Terms;
