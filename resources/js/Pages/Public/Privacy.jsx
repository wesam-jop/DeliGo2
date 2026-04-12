import React from 'react';
import AdOrchestrator from '../../Components/AdOrchestrator';

const Section = ({ title, children }) => (
    <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-500 leading-loose font-medium">{children}</p>
    </div>
);

const Privacy = () => (
    <div className="container mx-auto px-6 py-16 max-w-4xl" dir="rtl">
        <div className="mb-16 space-y-4">
            <span className="text-brand font-bold text-sm uppercase tracking-wider">قانوني</span>
            <h1 className="text-5xl font-black text-slate-900 test">سياسة <span className="text-brand">الخصوصية</span></h1>
            <p className="text-slate-400">آخر تحديث: مارس 2026</p>
        </div>
        <div className="bg-white p-12 rounded-[3rem] premium-shadow border border-slate-100 space-y-12">
            <Section title="١. جمع المعلومات">
                نقوم بجمع المعلومات الشخصية التي تقدمها إلينا طوعاً عند إنشاء حساب، أو تقديم طلب، أو التواصل معنا. تشمل هذه المعلومات الاسم ورقم الهاتف والعنوان وبيانات الدفع اللازمة لتنفيذ الخدمة.
            </Section>
            <Section title="٢. استخدام المعلومات">
                نستخدم معلوماتك لمعالجة طلباتك، وتحسين خدماتنا، وإرسال العروض الترويجية (بموافقتك)، وضمان أمان حسابك. لن نبيع بياناتك لأي طرف ثالث بأي شكل من الأشكال.
            </Section>
            <Section title="٣. مشاركة المعلومات">
                نشارك بياناتك فقط مع شركائنا (المتاجر وسائقي التوصيل) بالقدر الضروري لإتمام طلبك بنجاح. نلتزم بعدم مشاركة أي بيانات حساسة مع أطراف غير معنية بتنفيذ الخدمة.
            </Section>
            <Section title="٤. أمان البيانات">
                نطبق أحدث معايير التشفير وبروتوكولات الأمان لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الإفصاح غير المقصود.
            </Section>
            <Section title="٥. حقوقك">
                يحق لك في أي وقت طلب الاطلاع على بياناتك، أو تصحيحها، أو حذفها من خلال إعدادات الحساب أو التواصل مع فريق الدعم لدينا.
            </Section>
            <Section title="٦. التواصل معنا">
                لأي استفسار يتعلق بسياسة الخصوصية، لا تتردد في التواصل معنا عبر البريد الإلكتروني: privacy@mishwari.app
            </Section>
        </div>
        <AdOrchestrator placement="banner" variant="minimal" autoPlayInterval={12000} />
    </div>
);

export default Privacy;
