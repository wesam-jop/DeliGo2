import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, CreditCard, MapPin, ChevronLeft, ArrowRight } from 'lucide-react';
import { useCart } from '../../Contexts/CartContext';
import { useAuth } from '../../Contexts/AuthContext';
import Button from '../../Components/Button';
import AdOrchestrator from '../../Components/AdOrchestrator';


const Cart = () => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart, getDeliveryFee } = useCart();
    const { token } = useAuth();

    const subtotal = getCartTotal();
    const delivery = getDeliveryFee();
    const total = subtotal + delivery;

    // Redirect to login if not authenticated and cart has items
    if (!token && cartItems.length > 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                    <div className="text-8xl">🔐</div>
                    <h2 className="text-2xl font-bold text-slate-900">يجب تسجيل الدخول أولاً</h2>
                    <p className="text-slate-500">يرجى تسجيل الدخول لعرض سلة التسوق الخاصة بك</p>
                    <div className="flex gap-4 justify-center">
                        <Link to="/login" className="px-10 py-3.5 bg-brand text-white rounded-2xl font-black hover:bg-brand-dark transition-all shadow-lg shadow-brand/20">
                            تسجيل الدخول
                        </Link>
                        <Link to="/register" className="px-10 py-3.5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black hover:bg-slate-50 transition-all">
                            إنشاء حساب جديد
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12" dir="rtl">
            <div className="flex items-center gap-4 mb-10">
                <Link to="/stores" className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all premium-shadow">
                    <ChevronLeft size={20} className="rotate-180" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900">سلة المشتريات</h1>
                    <p className="text-slate-500 font-medium">{cartItems.length} منتج في سلتك</p>
                </div>
            </div>

            {cartItems.length === 0 ? (
                <div className="text-center py-32 space-y-8 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                    <div className="text-9xl animate-bounce">🛒</div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">سلة المشتريات فارغة!</h2>
                        <p className="text-slate-500 mt-2 font-bold">يبدو أنك لم تضف أي وجبات لذيذة بعد.</p>
                    </div>
                    <Link to="/stores" className="inline-block px-12 py-4 bg-brand text-white rounded-2xl font-black hover:bg-brand-dark transition-all shadow-xl shadow-brand/20">
                        استكشف المتاجر الآن
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence>
                            {cartItems.map(item => (
                                <motion.div
                                    key={item.product.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] premium-shadow border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5"
                                >
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl flex-shrink-0 overflow-hidden">
                                            {item.product.image ? (
                                                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                '🍽️'
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 sm:hidden">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{item.product.store?.name || 'متجر'}</p>
                                            <h3 className="font-black text-base text-slate-900 truncate">{item.product.name}</h3>
                                            <p className="font-black text-brand text-lg mt-1 italic">{(parseFloat(item.product.price) * item.quantity).toLocaleString()} $</p>
                                        </div>
                                    </div>
                                    
                                    <div className="hidden sm:block flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 underline decoration-brand/20">{item.product.store?.name || 'متجر'}</p>
                                        <h3 className="font-black text-lg text-slate-900">{item.product.name}</h3>
                                        <p className="font-black text-brand text-xl mt-2 italic">{(parseFloat(item.product.price) * item.quantity).toLocaleString()} $</p>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                                        <div className="flex items-center gap-2 bg-slate-100 p-1 sm:p-1.5 rounded-xl">
                                            <Button variant="unstyled"
                                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                className="cursor-pointer w-8 h-8 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center hover:bg-slate-50 premium-shadow"
                                            >
                                                <Minus size={14} />
                                            </Button>
                                            <span className="font-black w-6 text-center text-sm sm:text-base">{item.quantity}</span>
                                            <Button variant="unstyled"
                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                className="cursor-pointer w-8 h-8 sm:w-10 sm:h-10 bg-brand text-white rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
                                            >
                                                <Plus size={16} />
                                            </Button>
                                        </div>
                                        <Button variant="unstyled"
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="cursor-pointer p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 sm:bg-transparent rounded-xl sm:rounded-none flex items-center gap-2"
                                        >
                                            <Trash2 size={18} />
                                            <span className="text-xs font-bold sm:hidden">حذف</span>
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Delivery Address */}
                        {/* <div className="bg-white p-6 rounded-[2rem] premium-shadow border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-pink-100 text-pink-500 rounded-xl"><MapPin size={20} /></div>
                                <h3 className="font-bold">عنوان التوصيل</h3>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">لم تقم بتحديد عنوان بعد.</p>
                            <Button variant="unstyled" className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium hover:border-pink-300 hover:text-pink-400 transition-all">
                                + إضافة عنوان توصيل
                            </Button>
                        </div> */}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-8 rounded-[2.5rem] premium-shadow border border-slate-100 sticky top-28 space-y-6">
                            <h2 className="font-bold text-xl">ملخص الطلب</h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-slate-500">
                                    <span>المجموع الفرعي</span>
                                    <span className="font-bold text-slate-900">{subtotal.toLocaleString()} $</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <div>
                                        <span>رسوم التوصيل</span>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {cartItems.length > 0 && cartItems[0].product.store?.governorate?.name_ar
                                                ? `حسب منطقة ${cartItems[0].product.store.governorate.name_ar}`
                                                : 'حسب المنطقة'}
                                        </p>
                                    </div>
                                    <span className="font-bold text-slate-900">{delivery.toLocaleString()} $</span>
                                </div>
                                <div className="border-t border-slate-100 pt-6 flex justify-between font-black text-2xl">
                                    <span className="text-slate-900">الإجمالي الكلي</span>
                                    <span className="text-brand underline decoration-brand/10 underline-offset-8">{total.toLocaleString()} $</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/checkout')}
                                className="w-full py-5 px-5 cursor-pointer bg-brand text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-brand/30 hover:bg-brand-dark transition-all text-lg"
                            >
                                <CreditCard size={22} />
                                إكمال عملية الدفع
                                <ArrowRight size={20} className="rotate-180 mr-auto opacity-70" />
                            </motion.button>

                            <Link to="/stores" className="block text-center text-sm text-slate-400 hover:text-pink-500 transition-colors font-medium">
                                متابعة التسوق
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Subtle ad at bottom */}
            <AdOrchestrator placement="banner" variant="minimal" autoPlayInterval={10000} />
        </div>
    );
};

export default Cart;
