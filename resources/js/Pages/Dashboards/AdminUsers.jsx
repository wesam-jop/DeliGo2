import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, Phone, Mail, User, Shield, Trash2, AlertTriangle, MessageSquare } from 'lucide-react';
import { adminApi } from '../../Services/adminApi';
import UserDetailsModal from './UserDetailsModal';
import Button from '../../Components/Button';
import { useNavigate } from 'react-router-dom';


const AdminUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const roleOptions = [
        { value: 'all', label: 'الكل', color: 'bg-slate-100 text-slate-600' },
        { value: 'customer', label: 'عملاء', color: 'bg-blue-100 text-blue-600' },
        { value: 'store_owner', label: 'أصحاب متاجر', color: 'bg-amber-100 text-amber-600' },
        { value: 'driver', label: 'سائقون', color: 'bg-purple-100 text-purple-600' },
        { value: 'admin', label: 'مديرون', color: 'bg-red-100 text-red-600' },
    ];

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const fetchUsers = async () => {
        try {
            const params = roleFilter !== 'all' ? { role: roleFilter } : {};
            const response = await adminApi.getUsers(params);
            setUsers(response.data.data?.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        try {
            await adminApi.deleteUser(userToDelete);
            setShowDeleteModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('حدث خطأ أثناء حذف المستخدم');
        }
    };

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleOpenChat = async (user) => {
        try {
            const response = await adminApi.startConversationWithUser(user.id);
            if (response.data.data?.conversation) {
                navigate('/dashboard/chat');
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert('حدث خطأ أثناء فتح المحادثة');
        }
    };

    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            user.name?.toLowerCase().includes(search) ||
            user.phone?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search)
        );
    });

    const getRoleBadge = (role) => {
        const badges = {
            'customer': { label: 'زبون', color: 'bg-blue-100 text-blue-600' },
            'store_owner': { label: 'صاحب متجر', color: 'bg-amber-100 text-amber-600' },
            'driver': { label: 'سائق', color: 'bg-purple-100 text-purple-600' },
            'admin': { label: 'مدير', color: 'bg-red-100 text-red-600' },
        };
        return badges[role] || { label: role, color: 'bg-slate-100 text-slate-600' };
    };

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">إدارة المستخدمين</h1>
                <p className="text-slate-500 mt-1 font-medium">عرض وإدارة جميع مستخدمي المنصة</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ابحث عن مستخدم..."
                            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="relative">
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="pr-12 pl-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all appearance-none cursor-pointer min-w-[200px]"
                        >
                            {roleOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {roleOptions.map(option => {
                    const count = roleFilter === 'all'
                        ? users.filter(u => u.role === option.value).length
                        : option.value === 'all'
                            ? users.length
                            : users.length;
                    return (
                        <Button variant="unstyled"
                            key={option.value}
                            onClick={() => setRoleFilter(option.value)}
                            className={`p-4 rounded-2xl border-2 transition-all ${roleFilter === option.value
                                    ? 'border-brand bg-pink-50'
                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                }`}
                        >
                            <p className={`text-xs font-bold mb-1 ${option.color}`}>{option.label}</p>
                            <p className="text-2xl font-black text-slate-900">
                                {option.value === 'all'
                                    ? users.length
                                    : users.filter(u => u.role === option.value).length}
                            </p>
                        </Button>
                    );
                })}
            </div>

            {/* Users Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">قائمة المستخدمين</h3>
                    <span className="text-sm text-slate-400 font-medium">
                        {filteredUsers.length} مستخدم
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Users size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد مستخدمين</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="text-slate-400 text-xs font-bold border-b border-slate-100">
                                    <th className="pb-4 font-bold">المستخدم</th>
                                    <th className="pb-4 font-bold">رقم الهاتف</th>
                                    <th className="pb-4 font-bold">الدور</th>
                                    <th className="pb-4 font-bold">حالة التحقق</th>
                                    <th className="pb-4 font-bold">تاريخ التسجيل</th>
                                    <th className="pb-4 font-bold">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer"
                                        onClick={() => handleViewDetails(user)}
                                    >
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-brand to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{user.name}</p>
                                                    {user.email && (
                                                        <p className="text-xs text-slate-400">{user.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <p className="font-bold text-sm text-slate-900">{user.phone}</p>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getRoleBadge(user.role).color}`}>
                                                {getRoleBadge(user.role).label}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                {user.phone_verified_at && (
                                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1" title="هاتف موثق">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                                        هاتف
                                                    </span>
                                                )}
                                                {user.is_approved && (
                                                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1" title="موافق عليه">
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                        موافق
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-slate-500">
                                            {new Date(user.created_at).toLocaleDateString('ar-SY')}
                                        </td>
                                        <td className="py-4">
                                            <div className="flex gap-2">
                                                <Button variant="unstyled"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenChat(user);
                                                    }}
                                                    className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-emerald-100 hover:text-emerald-600 transition-all"
                                                    title="فتح محادثة"
                                                >
                                                    <MessageSquare size={18} />
                                                </Button>
                                                <Button variant="unstyled"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(user);
                                                    }}
                                                    className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-all"
                                                    title="عرض التفاصيل"
                                                >
                                                    <User size={18} />
                                                </Button>
                                                {user.role !== 'admin' && (
                                                    <Button variant="unstyled"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setUserToDelete(user.id);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all"
                                                        title="حذف"
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle size={24} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">تأكيد الحذف</h3>
                                <p className="text-sm text-slate-400">هل أنت متأكد من حذف هذا المستخدم؟</p>
                            </div>
                        </div>
                        <p className="text-sm text-red-500 mb-6">
                            ⚠️ هذا الإجراء لا يمكن التراجع عنه
                        </p>
                        <div className="flex gap-3">
                            <Button variant="unstyled"
                                onClick={handleDelete}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
                            >
                                تأكيد الحذف
                            </Button>
                            <Button variant="unstyled"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setUserToDelete(null);
                                }}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            >
                                إلغاء
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {showModal && selectedUser && (
                <UserDetailsModal
                    user={selectedUser}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminUsers;
