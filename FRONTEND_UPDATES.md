# 🎨 Frontend Updates - Notification System

---

## ✅ التعديلات المطبقة على Frontend

### **الملفات الجديدة (4 ملفات):**

1. ✅ `resources/js/Services/NotificationService.js`
2. ✅ `resources/js/Hooks/useNtfy.js`
3. ✅ `resources/js/Pages/Dashboards/NotificationPreferences.jsx`
4. ✅ `FRONTEND_UPDATES.md` (هذا الملف)

### **الملفات المعدلة (1 ملف):**

1. ✅ `resources/js/Components/Dashboard/NotificationsDropdown.jsx`

---

## 📊 ملخص التحديثات

### **1️⃣ NotificationService.js** (Service Layer)

#### الميزات:
- ✅ **API Integration** - جميع endpoints الجديدة
- ✅ **Deep Linking Helper** - `handleDeepLink()`
- ✅ **Sound Manager** - `playNotificationSound()`
- ✅ **Device Token Management** - register/unregister
- ✅ **Notification Preferences** - get/update/reset
- ✅ **Analytics** - get notification stats
- ✅ **Mark as Opened** - track when user opens notification

#### الوظائف المتاحة:

```javascript
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAsOpened,
    markAllAsRead,
    getNotificationAnalytics,
    getNotificationPreferences,
    updateNotificationPreferences,
    resetNotificationPreferences,
    registerDeviceToken,
    unregisterDeviceToken,
    handleDeepLink,
    playNotificationSound,
} from '../Services/NotificationService';

// أمثلة على الاستخدام:

// جلب الإشعارات
const notifications = await getNotifications(1, false, 20);

// جلب عدد غير المقروءة
const count = await getUnreadCount();

// وضع كمقروء
await markAsRead(notificationId);

// وضع كمفتوح
await markAsOpened(notificationId);

// تحديث التفضيلات
await updateNotificationPreferences({
    channels: { in_app: true, push: true, whatsapp: false },
    types: { order_updates: true, message_updates: true, marketing_messages: false },
    quiet_hours: { start: '22:00', end: '08:00', enabled: true },
});

// تشغيل صوت
playNotificationSound('order_new.mp3', false);

// Deep link navigation
handleDeepLink('/orders/123', navigate);
```

---

### **2️⃣ useNtfy Hook** (Real-time Notifications)

#### الميزات:
- ✅ **اتصال تلقائي بـ ntfy** - SSE (Server-Sent Events)
- ✅ **Sound Support** - تشغيل الصوت عند وصول إشعار
- ✅ **Silent Support** - تجاهل الصوت إذا `silent=true`
- ✅ **Deep Linking** - التنقل تلقائياً عند الضغط
- ✅ **Toast Integration** - عرض الإشعار كـ toast
- ✅ **Mark as Opened** - إرسال للـ Backend عند الفتح
- ✅ **Auto Reconnect** - إعادة الاتصال عند الفشل

#### الاستخدام:

```jsx
import { useNtfy } from '../Hooks/useNtfy';
import { useNavigate } from 'react-router-dom';

function App() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { connected } = useNtfy(user?.ntfy_topic, {
        enabled: !!user?.ntfy_topic,
        baseUrl: 'https://ntfy.sh',
        navigate: navigate,
        playSound: true,
        onNotification: (data) => {
            console.log('New notification:', data);
        },
    });

    return (
        <div>
            <p>ntfy status: {connected ? '✅ Connected' : '❌ Disconnected'}</p>
        </div>
    );
}
```

#### كيف يعمل:

```
1. يتصل بـ ntfy server عبر SSE
   ↓
2. يستقبل إشعار جديد
   ↓
3. يتحقق من silent
   ├─ silent=true → لا صوت
   └─ silent=false → شغل الصوت
   ↓
4. يعرض toast notification
   ↓
5. عند الضغط على toast:
   ├─ markAsOpened(id) → Backend
   ├─ handleDeepLink(action_url) → Navigate
   └─ onNotification(data) → Custom handler
   ↓
6. عند فشل الاتصال:
   └─ إعادة المحاولة بعد 5 ثواني
```

---

### **3️⃣ NotificationPreferences.jsx** (UI Component)

#### الميزات:
- ✅ **عرض التفضيلات الحالية**
- ✅ **تحديث قنوات الإشعارات** (in_app, push, whatsapp)
- ✅ **تحديث أنواع الإشعارات** (orders, messages, marketing)
- ✅ **ساعات الهدوء** (start, end, enabled)
- ✅ **إعادة تعيين التفضيلات**
- ✅ **رسائل نجاح/خطأ**
- ✅ **UI متقدم مع animations**

#### الاستخدام:

```jsx
import NotificationPreferences from './Pages/Dashboards/NotificationPreferences';

// في routes
<Route path="/settings/notifications" element={<NotificationPreferences />} />
```

#### الواجهة:

```
┌─────────────────────────────────────────────┐
│ 🔔 تفضيلات الإشعارات                        │
│ تحكم في الإشعارات التي تتلقاها              │
├─────────────────────────────────────────────┤
│                                             │
│ 📱 قنوات الإشعارات                          │
│ ☑ إشعارات داخل التطبيق                     │
│ ☑ إشعارات Push                             │
│ ☑ واتساب                                    │
│                                             │
│ 📧 أنواع الإشعارات                          │
│ ☑ تحديثات الطلبات                          │
│ ☑ الرسائل                                   │
│ ☐ العروض والتسويق                           │
│                                             │
│ ⏰ ساعات الهدوء                             │
│ ☑ تفعيل ساعات الهدوء                        │
│ من [22:00] → إلى [08:00]                   │
│                                             │
│ [حفظ التفضيلات] [إعادة تعيين]              │
└─────────────────────────────────────────────┘
```

---

### **4️⃣ NotificationsDropdown.jsx** (Updated)

#### التحديثات:

**قبل:**
- ❌ يجلب الطلبات مباشرة بدلاً من الإشعارات
- ❌ لا يستخدم API الجديد
- ❌ لا يدعم deep linking
- ❌ لا يدعم markAsOpened

**بعد:**
- ✅ يجلب الإشعارات من `/api/v1/notifications`
- ✅ يستخدم `getNotifications()` و `getUnreadCount()`
- ✅ يدعم deep linking عند الضغط
- ✅ يستدعي `markAsOpened()` عند الفتح
- ✅ يتعرف على نوع الإشعار (order, message, broadcast)
- ✅ أيقونات مخصصة حسب النوع
- ✅ ألوان مخصصة حسب الأولوية

#### الكود الجديد:

```jsx
const handleNotificationClick = async (notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Mark as opened
    markAsOpened(notification.id);

    // Extract action URL
    const data = notification.data || {};
    const actionUrl = data.click || data.action_url;

    if (actionUrl) {
        // Navigate using deep link
        handleDeepLink(actionUrl, navigate);
    } else if (notification.type?.startsWith('order.')) {
        // Fallback: Navigate to order
        const orderId = data.meta?.order_id;
        if (orderId) {
            navigate(`/orders/${orderId}`);
        }
    }
};
```

---

## 🎯 كيف تربط كل شيء

### **1. في App.jsx أو Main Layout:**

```jsx
import { useNtfy } from './Hooks/useNtfy';
import { ToastProvider } from './Components/ToastNotifications';
import { useAuth } from './Contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function App() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Connect to ntfy
    const { connected } = useNtfy(user?.ntfy_topic, {
        enabled: !!user?.ntfy_topic,
        navigate: navigate,
        playSound: true,
    });

    return (
        <ToastProvider>
            {/* Your app */}
        </ToastProvider>
    );
}
```

### **2. في Settings Page:**

```jsx
import NotificationPreferences from './Pages/Dashboards/NotificationPreferences';

function Settings() {
    return (
        <div>
            <h1>الإعدادات</h1>
            <NotificationPreferences />
        </div>
    );
}
```

### **3. في Dashboard Layout:**

```jsx
import NotificationsDropdown from './Components/Dashboard/NotificationsDropdown';

function DashboardLayout() {
    return (
        <header>
            <NotificationsDropdown />
        </header>
    );
}
```

---

## 📂 ملفات الأصوات المطلوبة (Frontend)

### **Web (React):**

```
public/sounds/
├── order_new.mp3          ← طلب جديد
├── order_accepted.mp3     ← تم القبول
├── order_cancelled.mp3    ← تم الإلغاء
├── message.mp3            ← رسالة جديدة
└── default.mp3            ← افتراضي
```

### **React Native (Mobile):**

```
android/app/src/main/res/raw/
├── order_new.mp3
├── order_accepted.mp3
├── order_cancelled.mp3
├── message.mp3
└── default.mp3
```

**📄 دليل مفصل:** `SOUND_FILES_SETUP.md`

---

## 🚀 خطوات التشغيل

### **1. إضافة ملفات الأصوات:**

```bash
# Web
mkdir -p public/sounds
# Copy sound files

# React Native
mkdir -p android/app/src/main/res/raw
# Copy sound files
```

### **2. تحديث App.jsx:**

```jsx
import { useNtfy } from './Hooks/useNtfy';
import { ToastProvider } from './Components/ToastNotifications';

function App() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useNtfy(user?.ntfy_topic, {
        enabled: !!user?.ntfy_topic,
        navigate: navigate,
        playSound: true,
    });

    return (
        <ToastProvider>
            {/* Your app */}
        </ToastProvider>
    );
}
```

### **3. إضافة Route للتفضيلات:**

```jsx
<Route path="/settings/notifications" element={<NotificationPreferences />} />
```

### **4. تشغيل التطبيق:**

```bash
npm run dev
# أو
npm run build
```

---

## 🎉 النتيجة

**Frontend الآن يدعم:**

- ✅ **Real-time notifications** عبر ntfy (SSE)
- ✅ **Sound notifications** مع خريطة أصوات
- ✅ **Silent notifications** للتحديثات غير المهمة
- ✅ **Deep linking** موحد
- ✅ **Notification preferences** UI كامل
- ✅ **Mark as opened** tracking
- ✅ **Toast notifications** متقدم
- ✅ **Device token management** للـ Push
- ✅ **Analytics** للمستخدم

**كل شيء جاهز للاستخدام! 🚀**
