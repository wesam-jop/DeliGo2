# 🔔 Deep Linking, Security, Sound & Silent Notifications

---

## 📊 نظرة عامة

تم إضافة 4 ميزات متقدمة لنظام الإشعارات:

1. ✅ **توحيد Deep Linking** - روابط موحدة وموحدة
2. ✅ **Authorization Policies** - أمان وحماية البيانات
3. ✅ **Silent Notifications** - إشعارات صامتة
4. ✅ **Sound Notifications** - إشعارات بصوت

---

## 🎯 أولاً: Deep Linking الموحد

### 📐 نمط الروابط

جميع الإشعارات تتبع نمط موحد:

```
/orders/{id}
/chat/{conversation_id}
/stores/{id}
/drivers/{id}
```

### 🔄 كيف يعمل؟

#### 1. في القوالب (Backend):

```php
// config/notification_templates.php

'order_created' => [
    'title' => '📦 طلب جديد',
    'message' => 'لديك طلب جديد رقم #{order_id}',
    'action_url' => '/orders/{order_id}', // ← رابط الويب
    // ...
],
```

#### 2. استبدال ديناميكي:

```php
// NotificationTemplateService::resolve()

$data = ['order_id' => 123];
$template = NotificationTemplateService::resolve('order_created', $data);

// النتيجة:
[
    'action_url' => '/orders/123',
    // ...
]
```

#### 3. تحويل إلى Deep Link للموبايل:

```php
// NotificationTemplateService::generateMobileDeepLink()

$webUrl = '/orders/123';
$mobileUrl = NotificationTemplateService::generateMobileDeepLink($webUrl, 'deligo');

// النتيجة: 'deligo://orders/123'
```

---

### 📱 Frontend Implementation

#### React Native - Deep Linking Setup:

```jsx
// App.js أو Navigation file
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';

function App() {
  const navigationRef = useRef();

  useEffect(() => {
    // Handle deep link when app is opened
    const handleInitialNotification = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink(url);
      }
    };

    // Handle deep link when app is in background
    Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Handle FCM notification tap
    messaging().onNotificationOpenedApp(async (remoteMessage) => {
      const actionUrl = remoteMessage.data?.action_url;
      if (actionUrl) {
        handleDeepLink(actionUrl);
      }
    });

    handleInitialNotification();

    return () => {
      Linking.removeAllListeners('url');
    };
  }, []);

  const handleDeepLink = (url) => {
    // Parse URL: deligo://orders/123 or /orders/123
    const route = url
      .replace('deligo://', '/')
      .replace('https://yourdomain.com', '');

    // Navigate based on route
    if (route.startsWith('/orders/')) {
      const orderId = route.split('/').pop();
      navigationRef.navigate('OrderDetails', { id: orderId });
    } else if (route.startsWith('/orders')) {
      navigationRef.navigate('OrderList');
    } else if (route.startsWith('/chat/')) {
      const conversationId = route.split('/').pop();
      navigationRef.navigate('Chat', { id: conversationId });
    } else if (route.startsWith('/stores/')) {
      const storeId = route.split('/').pop();
      navigationRef.navigate('StoreDetails', { id: storeId });
    } else if (route.startsWith('/drivers/')) {
      const driverId = route.split('/').pop();
      navigationRef.navigate('DriverDetails', { id: driverId });
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your screens */}
    </NavigationContainer>
  );
}
```

#### React (Web) - Router Setup:

```jsx
// App.jsx
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

function NotificationHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for notification clicks
    window.addEventListener('notification-click', (event) => {
      const actionUrl = event.detail?.action_url;
      if (actionUrl) {
        navigate(actionUrl);
      }
    });

    return () => {
      window.removeEventListener('notification-click', () => {});
    };
  }, []);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <NotificationHandler />
      <Routes>
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/stores/:id" element={<StoreDetails />} />
        <Route path="/drivers/:id" element={<DriverDetails />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🔐 ثانياً: Authorization Policies

### 📁 الملفات الجديدة

#### 1. `app/Policies/OrderPolicy.php`

يحدد من يمكنه عرض/تحديث/إلغاء الطلب.

**القواعد:**
```php
// OrderPolicy::view()

✅ العميل الذي وضع الطلب
✅ السائق المُعين للطلب
✅ أصحاب المتاجر المشاركين
✅ Admin (جميع الطلبات)
```

#### 2. `app/Policies/ConversationPolicy.php`

يحدد من يمكنه عرض/إرسال رسائل في المحادثة.

**القواعد:**
```php
// ConversationPolicy::view()

✅ المشاركين النشطين في المحادثة فقط
```

---

### 📝 تسجيل Policies

```php
// app/Providers/AppServiceProvider.php

public function boot(): void
{
    Gate::policy(Order::class, OrderPolicy::class);
    Gate::policy(Conversation::class, ConversationPolicy::class);
}
```

---

### 🛡️ الاستخدام في Controllers

```php
// app/Http/Controllers/Api/OrderController.php

public function show(Request $request, Order $order): JsonResponse
{
    // التحقق من الصلاحية
    $this->authorize('view', $order);

    // إذا نجح، اعرض الطلب
    return response()->json([
        'success' => true,
        'data' => $order,
    ]);
}

public function cancel(Request $request, Order $order): JsonResponse
{
    // التحقق من صلاحية الإلغاء
    $this->authorize('cancel', $order);

    // إلغاء الطلب
    $order->updateStatus(Order::STATUS_CANCELLED, 'Cancelled by user');

    return response()->json([
        'success' => true,
        'message' => 'Order cancelled',
    ]);
}
```

**إذا لم يكن لديه صلاحية:**
```json
{
  "message": "This action is unauthorized.",
  "status": 403
}
```

---

### 🔒 حماية Deep Links

عندما يضغط المستخدم على إشعار ويذهب إلى `/orders/123`:

```php
// OrderController::show()

public function show(Request $request, int $id): JsonResponse
{
    $order = Order::findOrFail($id);

    // تحقق من الصلاحية
    $this->authorize('view', $order);

    return response()->json([
        'success' => true,
        'data' => $order->load(['customer', 'driver', 'storeSplits.store']),
    ]);
}
```

**سيناريوهات:**

| المستخدم | الطلب | النتيجة |
|----------|-------|---------|
| Customer | طلبه | ✅ 200 OK |
| Customer | طلب شخص آخر | ❌ 403 Forbidden |
| Driver | طلب مُعين له | ✅ 200 OK |
| Driver | طلب غير مُعين له | ❌ 403 Forbidden |
| Admin | أي طلب | ✅ 200 OK |

---

## 🔕 ثالثاً: Silent Notifications

### 🎯 الهدف

إشعارات بدون صوت أو اهتزاز (للتحديثات غير المهمة).

---

### ⚙️ كيف تعمل؟

#### 1. في القالب:

```php
// config/notification_templates.php

'broadcast' => [
    'title' => '{title}',
    'message' => '{message}',
    'action_url' => '{action_url}',
    'priority' => 'low',
    'type' => 'broadcast',
    'channels' => ['in_app', 'push'],
    'sound' => null,        // ← بدون صوت
    'silent' => true,       // ← إشعار صامت
],
```

#### 2. Override عند الإرسال:

```php
// إرسال إشعار صامت

$notificationService->sendToUser(
    $user,
    'تحديث النظام',
    'سيتم إيقاف النظام للصيانة ليلاً',
    [
        'silent' => true,      // صامت
        'sound' => null,       // بدون صوت
        'priority' => 'low',
    ]
);
```

#### 3. FCM Payload:

```json
{
  "notification": {
    "title": "تحديث النظام",
    "body": "سيتم إيقاف النظام للصيانة ليلاً"
  },
  "data": {
    "action_url": "/announcements/1",
    "silent": "true",
    "sound": ""
  }
}
```

---

### 📱 Frontend - Silent Handling

#### React Native:

```jsx
import messaging from '@react-native-firebase/messaging';

messaging().onMessage(async (remoteMessage) => {
  const isSilent = remoteMessage.data?.silent === 'true';

  if (isSilent) {
    // Silent notification - just show badge or update UI
    updateNotificationBadge();
    showInAppNotification(remoteMessage);
  } else {
    // Normal notification - show with sound
    showNotification(remoteMessage);
  }
});
```

---

## 🔊 رابعاً: Sound Notifications

### 🎵 خريطة الأصوات

| نوع الإشعار | ملف الصوت | الوصف |
|------------|----------|-------|
| `order.created` | `order_new.mp3` | طلب جديد |
| `order.accepted` | `order_accepted.mp3` | تم قبول الطلب |
| `order.cancelled` | `order_cancelled.mp3` | تم إلغاء الطلب |
| `message.received` | `message.mp3` | رسالة جديدة |
| `conversation.created` | `message.mp3` | محادثة جديدة |
| `broadcast` | `default.mp3` | بث عام |
| default | `default.mp3` | صوت افتراضي |

---

### 📂 ملفات الأصوات المطلوبة

**المسار في مشروع React Native:**

```
react-native-project/
├── android/
│   └── app/
│       └── src/
│           └── main/
│               └── res/
│                   └── raw/
│                       ├── order_new.mp3          ← طلب جديد
│                       ├── order_accepted.mp3     ← تم القبول
│                       ├── order_cancelled.mp3    ← تم الإلغاء
│                       ├── message.mp3            ← رسالة
│                       └── default.mp3            ← افتراضي
│
└── ios/
    └── YourApp/
        ├── order_new.mp3
        ├── order_accepted.mp3
        ├── order_cancelled.mp3
        ├── message.mp3
        └── default.mp3
```

**مسار Backend (Laravel) - لا يحتاج ملفات أصوات:**
- Backend فقط يرسل اسم الملف في FCM payload
- Frontend هو من يشغل الصوت

---

### 🔊 Backend Implementation

#### 1. في القالب:

```php
// config/notification_templates.php

'order_created' => [
    'title' => '📦 طلب جديد',
    'message' => 'لديك طلب جديد رقم #{order_id}',
    'action_url' => '/orders/{order_id}',
    'priority' => 'high',
    'type' => 'order.created',
    'channels' => ['in_app', 'push', 'whatsapp'],
    'sound' => 'order_new.mp3',  // ← ملف الصوت
    'silent' => false,            // ← ليس صامتاً
],
```

#### 2. في NotificationService:

```php
// sendPushNotification()

$sound = $options['sound'] ?? null;
$silent = $options['silent'] ?? false;

// If silent is true, disable sound
if ($silent) {
    $sound = null;
}

$payload = [
    'notification' => [
        'title' => $title,
        'body' => $message,
        'sound' => $sound ?? '',  // ← إرسال الصوت لـ FCM
    ],
    'data' => [
        'sound_name' => $sound,   // ← اسم الصوت للـ Frontend
        'silent' => $silent ? 'true' : 'false',
    ],
];
```

#### 3. Helper Function:

```php
// NotificationTemplateService::getSoundForType()

$sound = NotificationTemplateService::getSoundForType('order.created');
// النتيجة: 'order_new.mp3'
```

---

### 📱 Frontend - Sound Implementation

#### React Native - Android Setup:

```jsx
// android/app/src/main/res/raw/ (ضع ملفات MP3 هنا)
// order_new.mp3, message.mp3, default.mp3

import Sound from 'react-native-sound';

// Enable playback in silence mode (optional)
Sound.setCategory('Playback');

function playNotificationSound(soundName) {
  // soundName: 'order_new.mp3', 'message.mp3', etc.

  // Remove .mp3 extension for Android
  const soundFile = soundName.replace('.mp3', '');

  const sound = new Sound(soundFile, Sound.MAIN_BUNDLE, (error) => {
    if (error) {
      console.log('Failed to load sound', error);
      return;
    }

    console.log('Playing sound:', soundFile);
    sound.play((success) => {
      if (success) {
        console.log('Successfully finished playing');
      } else {
        console.log('Playback failed');
      }
      
      // Release resource
      sound.release();
    });
  });
}

// Handle incoming notification
messaging().onMessage(async (remoteMessage) => {
  const isSilent = remoteMessage.data?.silent === 'true';
  const soundName = remoteMessage.data?.sound_name;

  if (!isSilent && soundName) {
    playNotificationSound(soundName);
  }

  // Show notification UI
  showNotification(remoteMessage);
});
```

#### React Native - iOS Setup:

```jsx
// iOS uses the sound name directly from the notification payload
// Files should be added to iOS project via XCode

// ios/YourApp/order_new.mp3 (add via XCode)

// FCM handles sound automatically on iOS
// Just make sure the sound file name matches

messaging().onMessage(async (remoteMessage) => {
  // iOS plays sound automatically from notification.sound field
  const soundName = remoteMessage.notification?.sound;
  
  if (soundName) {
    console.log('iOS will play:', soundName);
  }
});
```

#### React (Web) - Audio:

```jsx
// Web Audio API

const soundFiles = {
  'order_new.mp3': '/sounds/order_new.mp3',
  'order_accepted.mp3': '/sounds/order_accepted.mp3',
  'order_cancelled.mp3': '/sounds/order_cancelled.mp3',
  'message.mp3': '/sounds/message.mp3',
  'default.mp3': '/sounds/default.mp3',
};

function playNotificationSound(soundName) {
  const soundPath = soundFiles[soundName] || soundFiles['default.mp3'];
  
  const audio = new Audio(soundPath);
  audio.play().catch(error => {
    console.log('Failed to play sound:', error);
  });
}

// Listen for notification clicks
navigator.serviceWorker.addEventListener('message', (event) => {
  const notification = event.data;
  const isSilent = notification.data?.silent === 'true';
  const soundName = notification.data?.sound_name;

  if (!isSilent && soundName) {
    playNotificationSound(soundName);
  }
});
```

---

## 🎨 أمثلة كاملة

### مثال 1: طلب جديد (مع صوت)

**Backend:**

```php
$notificationService->sendOrderNotification(
    $customer,
    'pending',
    'ORD-12345',
    [
        'meta' => ['order_id' => 123],
    ]
);
```

**FCM Payload:**

```json
{
  "notification": {
    "title": "📦 طلب جديد",
    "body": "لديك طلب جديد رقم #ORD-12345",
    "sound": "order_new.mp3"
  },
  "data": {
    "type": "order.created",
    "entity_id": 123,
    "action_url": "/orders/123",
    "sound_name": "order_new.mp3",
    "silent": "false"
  }
}
```

**Frontend (React Native):**

```jsx
// User sees notification with sound "order_new.mp3"
// Taps notification → navigates to /orders/123
// Authorization check: ✅ Customer owns this order
// Shows order details
```

---

### مثال 2: بث صامت (بدون صوت)

**Backend:**

```php
$notificationService->queueBroadcastToUsers(
    'تحديث النظام',
    'سيتم إيقاف النظام للصيانة الساعة 12 صباحاً',
    [
        'silent' => true,
        'sound' => null,
        'priority' => 'low',
    ]
);
```

**FCM Payload:**

```json
{
  "notification": {
    "title": "تحديث النظام",
    "body": "سيتم إيقاف النظام للصيانة الساعة 12 صباحاً"
  },
  "data": {
    "type": "broadcast",
    "action_url": "/announcements/1",
    "silent": "true",
    "sound": ""
  }
}
```

**Frontend (React Native):**

```jsx
// User sees notification WITHOUT sound
// Just badge update or in-app notification
```

---

### مثال 3: محاولة عرض طلب بدون صلاحية

**السيناريو:** عميل يحاول عرض طلب عميل آخر عبر Deep Link

```
1. User receives notification about order #999
2. Taps notification → navigates to /orders/999
3. OrderController::show(999)
4. $this->authorize('view', $order)
5. ❌ 403 Forbidden - Not authorized
6. Frontend shows error screen
```

**Frontend:**

```jsx
// Error boundary or catch
try {
  const response = await fetch(`/api/v1/orders/${orderId}`);
  if (response.status === 403) {
    navigation.navigate('Error', { 
      message: 'لا يمكنك عرض هذا الطلب' 
    });
  }
} catch (error) {
  // Handle error
}
```

---

## 📊 Decision Tree

### Sound vs Silent

```
إشعار جديد
   ↓
هل silent = true؟
   ├─ YES → بدون صوت ✅
   │         └─ عرض فقط في UI
   │
   └─ NO → هل sound موجود؟
            ├─ YES → شغل الصوت 🔊
            │         └─ عرض في UI
            │
            └─ NO → استخدم default.mp3 🔊
                     └─ عرض في UI
```

---

### Deep Link Routing

```
إشعار tapped
   ↓
Extract action_url
   ↓
هل URL موجود؟
   ├─ NO → افتح الصفحة الرئيسية
   │
   └─ YES → هل mobile app؟
             ├─ YES → حوّل إلى deligo://...
             │         └─ Navigate للشاشة
             │
             └─ NO → افتح في browser
                      └─ Navigate للـ route
```

---

### Authorization Check

```
طلب عرض /orders/123
   ↓
Load Order #123
   ↓
authorize('view', $order)
   ↓
هل user = customer_id؟
   ├─ YES → ✅ 200 OK
   │
   └─ NO → هل user = driver_id؟
            ├─ YES → ✅ 200 OK
            │
            └─ NO → هل user = store owner?
                     ├─ YES → ✅ 200 OK
                     │
                     └─ NO → هل user = admin?
                              ├─ YES → ✅ 200 OK
                              │
                              └─ NO → ❌ 403 Forbidden
```

---

## 🎯 Best Practices

### 1. Deep Linking

```php
// دائماً استخدم نمط موحد
'action_url' => '/orders/{order_id}'  // ✅
'action_url' => '/order-details?id=123'  // ❌

// استخدم helper لتحويل للموبايل
$deepLink = NotificationTemplateService::generateMobileDeepLink(
    '/orders/123',
    'deligo'
);
// النتيجة: 'deligo://orders/123'
```

### 2. Sound Files

```
✅ أسماء واضحة:
- order_new.mp3
- message.mp3

❌ أسماء غامضة:
- sound1.mp3
- notif.mp3
```

### 3. Silent Notifications

```php
// استخدم silent لـ:
✅ التحديثات غير العاجلة
✅ الرسائل التسويقية
✅ التذكيرات

// لا تستخدم silent لـ:
❌ الطلبات الجديدة
❌ تغييرات الحالة الحرجة
❌ رسائل OTP
```

### 4. Authorization

```php
// دائماً تحقق قبل العرض
public function show(Request $request, int $id)
{
    $order = Order::findOrFail($id);
    $this->authorize('view', $order); // ✅
    
    // أو استخدم middleware
    // Route::get('/orders/{order}', [OrderController::class, 'show'])
    //   ->middleware('can:view,order');
}
```

---

## 📁 الملفات الجديدة/المعدلة

### ملفات جديدة (3):
1. ✅ `app/Policies/OrderPolicy.php`
2. ✅ `app/Policies/ConversationPolicy.php`
3. ✅ `NOTIFICATION_DEEP_LINKING_SOUND.md` (هذا الملف)

### ملفات معدلة (4):
1. ✅ `app/Services/NotificationTemplateService.php` - Sound, silent, deep link helper
2. ✅ `app/Services/NotificationService.php` - Sound handling in FCM
3. ✅ `config/notification_templates.php` - Added sound & silent fields
4. ✅ `app/Providers/AppServiceProvider.php` - Registered policies

---

## 🚀 الخطوات التالية

### 1. إضافة ملفات الأصوات (React Native):

**Android:**
```bash
# Create raw directory
mkdir -p android/app/src/main/res/raw

# Copy sound files
cp sounds/*.mp3 android/app/src/main/res/raw/
```

**iOS:**
```bash
# Add files via XCode:
# 1. Open XCode
# 2. Right-click on YourApp folder
# 3. "Add Files to YourApp"
# 4. Select .mp3 files
# 5. Make sure "Copy items if needed" is checked
# 6. Add to target: YourApp
```

### 2. اختبار Deep Linking:

```bash
# Test deep link (Android)
adb shell am start -W -a android.intent.action.VIEW -d "deligo://orders/123" com.yourapp

# Test deep link (iOS)
xcrun simctl openurl booted "deligo://orders/123"
```

### 3. اختبار Authorization:

```bash
# curl مع user ليس لديه صلاحية
curl -X GET http://localhost:8000/api/v1/orders/999 \
  -H "Authorization: Bearer WRONG_USER_TOKEN"

# النتيجة: 403 Forbidden
```

---

## 🎉 النتيجة

**تم التنفيذ بنجاح!**

النظام الآن يدعم:
- ✅ Deep Linking موحد وموحد
- ✅ Authorization Policies للأمان
- ✅ Silent Notifications للتحديثات غير المهمة
- ✅ Sound Notifications للإشعارات المهمة
- ✅ خريطة أصوات مخصصة لكل نوع
- ✅ Frontend examples لـ React و React Native

**جاهز للاستخدام! 🚀**
