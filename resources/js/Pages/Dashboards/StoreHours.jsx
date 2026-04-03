import React, { useState, useEffect } from 'react';
import { Clock, Save, X, Plus, Trash2, Check } from 'lucide-react';
import { storeOwnerApi } from '../../Services/storeApi';
import Button from '../../Components/Button';


const daysOfWeek = [
    { id: 'saturday', name: 'السبت', nameEn: 'Saturday' },
    { id: 'sunday', name: 'الأحد', nameEn: 'Sunday' },
    { id: 'monday', name: 'الاثنين', nameEn: 'Monday' },
    { id: 'tuesday', name: 'الثلاثاء', nameEn: 'Tuesday' },
    { id: 'wednesday', name: 'الأربعاء', nameEn: 'Wednesday' },
    { id: 'thursday', name: 'الخميس', nameEn: 'Thursday' },
    { id: 'friday', name: 'الجمعة', nameEn: 'Friday' },
];

const StoreHours = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [schedules, setSchedules] = useState(
        daysOfWeek.map(day => ({
            day: day.id,
            dayName: day.name,
            is_active: false,
            from_time: '09:00',
            to_time: '22:00',
        }))
    );

    useEffect(() => {
        fetchStoreHours();
    }, []);

    const fetchStoreHours = async () => {
        try {
            setLoading(true);
            const response = await storeOwnerApi.getMyStore();
            const store = response.data.data;
            
            console.log('Store data:', store);
            console.log('Store schedules:', store?.schedules);

            if (store && store.schedules && store.schedules.length > 0) {
                const newSchedules = daysOfWeek.map(day => {
                    const schedule = store.schedules.find(s => s.day === day.id);
                    console.log(`Day ${day.name}:`, schedule);
                    return {
                        day: day.id,
                        dayName: day.name,
                        is_active: schedule ? schedule.is_active : false,
                        from_time: schedule?.from_time || '09:00',
                        to_time: schedule?.to_time || '22:00',
                    };
                });
                setSchedules(newSchedules);
            } else {
                console.log('No schedules found, using defaults');
            }
        } catch (error) {
            console.error('Error fetching store hours:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (dayId) => {
        setSchedules(prev => prev.map(schedule => 
            schedule.day === dayId 
                ? { ...schedule, is_active: !schedule.is_active }
                : schedule
        ));
    };

    const updateTime = (dayId, field, value) => {
        setSchedules(prev => prev.map(schedule => 
            schedule.day === dayId 
                ? { ...schedule, [field]: value }
                : schedule
        ));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const schedulesData = schedules.map(schedule => ({
                day: schedule.day,
                is_active: schedule.is_active,
                from_time: schedule.from_time,
                to_time: schedule.to_time,
            }));

            console.log('Saving schedules:', schedulesData);

            const response = await storeOwnerApi.updateHours({ schedules: schedulesData });
            console.log('Save response:', response);
            alert('تم حفظ أوقات الدوام بنجاح!');
            
            // Refresh the data
            fetchStoreHours();
        } catch (error) {
            console.error('Error saving store hours:', error);
            console.error('Error response:', error.response?.data);
            const message = error.response?.data?.message || error.message || 'حدث خطأ أثناء حفظ أوقات الدوام';
            alert(message);
        } finally {
            setSaving(false);
        }
    };

    const resetToDefault = () => {
        setSchedules(daysOfWeek.map(day => ({
            day: day.id,
            dayName: day.name,
            is_active: false,
            from_time: '09:00',
            to_time: '22:00',
        })));
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">أوقات الدوام</h1>
                    <p className="text-slate-500 mt-1 font-medium">حدد أيام وساعات عمل المتجر</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="unstyled"
                        onClick={resetToDefault}
                        className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center gap-2 hover:border-slate-300 transition-all"
                    >
                        <X size={18} />
                        إعادة تعيين
                    </Button>
                    <Button variant="unstyled"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-brand to-rose-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-4">
                    <Clock className="text-blue-500 flex-shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="font-bold text-blue-900 mb-1">تعليمات هامة</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• قم بتفعيل الأيام التي يعمل بها المتجر</li>
                            <li>• حدد وقت البداية والنهاية لكل يوم</li>
                            <li>• يمكنك تغيير الأوقات في أي وقت</li>
                            <li>• الأيام غير المفعلة ستظهر للمتجر كـ "مغلق"</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map((schedule) => (
                    <div
                        key={schedule.day}
                        className={`bg-white p-6 rounded-2xl border-2 transition-all premium-shadow ${
                            schedule.is_active
                                ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white'
                                : 'border-slate-100'
                        }`}
                    >
                        {/* Day Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                                    schedule.is_active
                                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {schedule.dayName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{schedule.dayName}</h3>
                                    <p className="text-xs text-slate-400">{schedule.dayNameEn}</p>
                                </div>
                            </div>
                            <Button variant="unstyled"
                                onClick={() => toggleDay(schedule.day)}
                                className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${
                                    schedule.is_active
                                        ? 'bg-emerald-500 justify-end'
                                        : 'bg-slate-200 justify-start'
                                }`}
                            >
                                <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                            </Button>
                        </div>

                        {/* Time Inputs */}
                        <div className={`space-y-3 transition-all ${
                            schedule.is_active ? 'opacity-100' : 'opacity-50 pointer-events-none'
                        }`}>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                                    من الساعة
                                </label>
                                <input
                                    type="time"
                                    value={schedule.from_time}
                                    onChange={(e) => updateTime(schedule.day, 'from_time', e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:border-brand outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                                    إلى الساعة
                                </label>
                                <input
                                    type="time"
                                    value={schedule.to_time}
                                    onChange={(e) => updateTime(schedule.day, 'to_time', e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:border-brand outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Status Badge */}
                        {schedule.is_active && (
                            <div className="mt-4 pt-4 border-t border-emerald-100">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">ساعات العمل</span>
                                    <span className="font-bold text-emerald-600">
                                        {(() => {
                                            const from = schedule.from_time.split(':').map(Number);
                                            const to = schedule.to_time.split(':').map(Number);
                                            const hours = (to[0] * 60 + to[1]) - (from[0] * 60 + from[1]);
                                            const h = Math.floor(hours / 60);
                                            const m = hours % 60;
                                            return `${h}س ${m > 0 ? m + 'د' : ''}`;
                                        })()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand to-rose-500 rounded-xl flex items-center justify-center text-white">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">ملخص الأسبوع</h3>
                            <p className="text-sm text-slate-500">
                                {schedules.filter(s => s.is_active).length} أيام نشطة من أصل 7
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-left">
                            <p className="text-xs text-slate-400">الحالة الحالية</p>
                            <p className="font-bold text-slate-900">
                                {schedules.filter(s => s.is_active).length > 0 ? 'نشط' : 'مغلق'}
                            </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                            schedules.filter(s => s.is_active).length > 0
                                ? 'bg-emerald-500 animate-pulse'
                                : 'bg-slate-300'
                        }`}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreHours;
