import React from 'react';
const Placeholder = ({ name }) => (
    <div className="h-[60vh] flex flex-col items-center justify-center p-8 space-y-6 text-center animate-pulse">
        <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] flex items-center justify-center">
            <span className="text-slate-300 font-bold test">DeliGo</span>
        </div>
        <div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight test uppercase">صفحة {name}</h2>
            <p className="text-slate-400 mt-2 font-medium">سيتم برمجة هذا القسم بتصميم Premium قريباً جداً...</p>
        </div>
    </div>
);

export const Stores = () => <Placeholder name="المتاجر" />;
export const StoreDetails = () => <Placeholder name="تفاصيل المتجر" />;
export const Products = () => <Placeholder name="المنتجات" />;
export const ProductDetails = () => <Placeholder name="تفاصيل المنتج" />;
export const About = () => <Placeholder name="من نحن" />;
export const Privacy = () => <Placeholder name="سياسة الخصوصية" />;
export const Terms = () => <Placeholder name="شروط الاستخدام" />;
export const Cart = () => <Placeholder name="سلة المشتريات" />;
