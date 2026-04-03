import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Package, 
    ToggleLeft, 
    ToggleRight,
    X,
    Image as ImageIcon,
    DollarSign,
    Tag,
    FileText
} from 'lucide-react';
import { storeOwnerApi } from '../../Services/storeApi';
import Button from '../../Components/Button';


const StoreProducts = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imageKey, setImageKey] = useState(0); // Key to reset file input
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: null,
        image_preview: null,
        is_available: true,
        category: '',
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await storeOwnerApi.getProducts();
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('حدث خطأ أثناء تحميل المنتجات');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                image: null,
                image_preview: product.image || null,
                is_available: product.is_available ?? true,
                category: product.category || '',
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                image: null,
                image_preview: null,
                is_available: true,
                category: '',
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            image: null,
            image_preview: null,
            is_available: true,
            category: '',
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        console.log('File selected:', file);
        console.log('Is Blob?', file instanceof Blob);
        
        if (file && file instanceof Blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    image: file,
                    image_preview: reader.result,
                }));
                console.log('Image set to FormData');
            };
            reader.readAsDataURL(file);
        } else {
            console.log('No valid file selected');
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ 
            ...prev, 
            image: null, 
            image_preview: null 
        }));
        setImageKey(prev => prev + 1); // Reset file input
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('Submitting product:', formData);
        console.log('Image value:', formData.image);
        console.log('Image type:', typeof formData.image);
        console.log('Is image a File?', formData.image instanceof File);
        console.log('Is image null?', formData.image === null);
        console.log('Is image empty object?', formData.image && typeof formData.image === 'object' && Object.keys(formData.image).length === 0);

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('description', formData.description);
            submitData.append('price', formData.price);
            submitData.append('is_available', formData.is_available ? 1 : 0);
            if (formData.category) submitData.append('category', formData.category);
            
            // Only append image if it's actually a File (not empty object or null)
            // Check: must be a File/Blob, not null, not empty object
            const isValidFile = formData.image && 
                               formData.image instanceof Blob && 
                               formData.image.size > 0;
            
            if (isValidFile) {
                submitData.append('image', formData.image);
                console.log('✅ Image appended to FormData');
            } else {
                console.log('❌ No valid image to append');
            }

            if (editingProduct) {
                await storeOwnerApi.updateProduct(editingProduct.id, submitData);
            } else {
                await storeOwnerApi.createProduct(submitData);
            }

            handleCloseModal();
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            console.error('Error response:', error.response);
            console.error('Error data:', error.response?.data);
            const message = error.response?.data?.message || error.message || 'حدث خطأ أثناء حفظ المنتج';
            alert(message);
        }
    };

    const handleToggleAvailability = async (product) => {
        try {
            await storeOwnerApi.toggleProductAvailability(product.id);
            fetchProducts();
        } catch (error) {
            console.error('Error toggling availability:', error);
            alert('حدث خطأ أثناء تحديث حالة المنتج');
        }
    };

    const handleDelete = async (productId) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

        try {
            await storeOwnerApi.deleteProduct(productId);
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('حدث خطأ أثناء حذف المنتج');
        }
    };

    const filteredProducts = products.filter(product => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            product.name?.toLowerCase().includes(search) ||
            product.description?.toLowerCase().includes(search) ||
            product.category?.toLowerCase().includes(search)
        );
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'USD' }).format(price);
    };

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">إدارة المنتجات</h1>
                    <p className="text-slate-500 mt-1 font-medium">أضف وعدّل منتجات متجرك</p>
                </div>
                <Button variant="unstyled" 
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-brand transition-all shadow-lg"
                >
                    <Plus size={18} /> إضافة منتج
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100">
                    <p className="text-xs font-bold text-slate-400 mb-1">إجمالي المنتجات</p>
                    <p className="text-2xl font-black text-slate-900">{products.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 mb-1">متوفرة</p>
                    <p className="text-2xl font-black text-slate-900">
                        {products.filter(p => p.is_available).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-red-100">
                    <p className="text-xs font-bold text-red-600 mb-1">غير متوفرة</p>
                    <p className="text-2xl font-black text-slate-900">
                        {products.filter(p => !p.is_available).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-amber-100">
                    <p className="text-xs font-bold text-amber-600 mb-1">سعر متوسط</p>
                    <p className="text-xl font-black text-slate-900">
                        {products.length > 0 
                            ? formatPrice(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length)
                            : '$0.00'
                        }
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ابحث عن منتج..."
                        className="w-full pr-12 pl-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                    />
                </div>
            </div>

            {/* Products Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">قائمة المنتجات</h3>
                    <span className="text-sm text-slate-400 font-medium">
                        {filteredProducts.length} منتج
                    </span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="animate-pulse bg-slate-50 rounded-2xl p-6">
                                <div className="h-40 bg-slate-200 rounded-xl mb-4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Package size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد منتجات</p>
                        <p className="text-sm mt-2">أضف منتجك الأول الآن</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-pink-200 transition-all group"
                            >
                                {/* Image */}
                                <div className="relative h-48 bg-slate-100 overflow-hidden">
                                    {product.image ? (
                                        <img 
                                            src={product.image} 
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            product.is_available 
                                                ? 'bg-emerald-100 text-emerald-600' 
                                                : 'bg-red-100 text-red-600'
                                        }`}>
                                            {product.is_available ? 'متوفر' : 'غير متوفر'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h4 className="font-bold text-lg text-slate-900 mb-2">{product.name}</h4>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                        {product.description || 'لا يوجد وصف'}
                                    </p>
                                    <div className="flex items-center justify-between flex-wrap">
                                        <p className="text-xl font-black text-brand">
                                            {formatPrice(product.price)}
                                        </p>
                                        <div className="flex gap-1.5">
                                            <Button variant="unstyled"
                                                onClick={() => handleToggleAvailability(product)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all premium-shadow ${
                                                    product.is_available
                                                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                                                        : 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                                                }`}
                                                title={product.is_available ? 'إخفاء' : 'إظهار'}
                                            >
                                                {product.is_available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                            </Button>
                                            <Button variant="unstyled"
                                                onClick={() => handleOpenModal(product)}
                                                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all premium-shadow"
                                                title="تعديل"
                                            >
                                                <Edit size={14} />
                                            </Button>
                                            <Button variant="unstyled"
                                                onClick={() => handleDelete(product.id)}
                                                className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-lg flex items-center justify-center hover:from-rose-600 hover:to-rose-700 transition-all premium-shadow"
                                                title="حذف"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl">
                                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                            </h3>
                            <Button variant="unstyled"
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <X size={24} className="text-slate-400" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    اسم المنتج
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="مثال: شاورما دجاج"
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    الوصف
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="وصف المنتج..."
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Price & Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        السعر
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        التصنيف
                                    </label>
                                    <div className="relative">
                                        <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            placeholder="مثال: وجبات رئيسية"
                                            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    صورة المنتج
                                </label>
                                <div className="flex items-center gap-4">
                                    {formData.image_preview ? (
                                        <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-200">
                                            <img
                                                src={formData.image_preview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <Button variant="unstyled"
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <label className="flex-1 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand transition-all">
                                            <ImageIcon className="mx-auto text-slate-400 mb-2" size={32} />
                                            <p className="text-sm text-slate-500 font-medium">اضغط لرفع صورة</p>
                                            <input
                                                key={imageKey}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_available"
                                    name="is_available"
                                    checked={formData.is_available}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                                    className="w-5 h-5 text-brand rounded focus:ring-brand"
                                />
                                <label htmlFor="is_available" className="text-sm font-bold text-slate-700 cursor-pointer">
                                    المنتج متوفر للطلب
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button variant="unstyled"
                                    type="submit"
                                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-brand transition-all"
                                >
                                    {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                                </Button>
                                <Button variant="unstyled"
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreProducts;
