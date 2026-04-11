# 🔔 نظام الإشعارات والصلاحيات - DeliGo2

---

## 📊 نظرة عامة

يستخدم النظام **3 قنوات إشعارات**:
1. **إشعارات داخل التطبيق** - تُحفظ في جدول `notifications`
2. **إشعارات Push عبر ntfy** - دفع HTTP إلى مواضيع خاصة بكل مستخدم
3. **رسائل واتساب** - عبر واجهة UltraMsg API

---

## 🏗️ البنية التحتية

### الملفات الأساسية

| الملف | الدور |
|-------|-------|
| `app/Services/NotificationService.php` | المحور المركزي لجميع الإشعارات |
| `app/Services/WhatsAppService.php` | إرسال رسائل الواتساب عبر UltraMsg |
| `app/Services/AuthService.php` | إرسال رمز التحقق (OTP) عبر واتساب |
| `app/Services/ChatService.php` | إرسال إشعارات الدردشة + ntfy |
| `app/Services/OrderService.php` | إشعارات الطلبات + الأحداث |
| `app/Http/Controllers/Api/NotificationController.php` | إدارة إشعارات المستخدم |
| `app/Http/Controllers/Api/AdminController.php` | البث الإداري (Broadcast) |

---

## 🔧 NotificationService - المحور المركزي

### الطرق الرئيسية (Methods):

| الطريقة | الوظيفة |
|---------|---------|
| `sendToUser()` | مُوزع متعدد القنوات - يُرسل عبر القنوات الثلاث |
| `send()` | ناشر ntfy الخام |
| `queueBroadcastToUsers()` | يُجزئ المستخدمين (500 لكل جزء) ويُرسِل للqueue |
| `sendOrderNotification()` | تحديثات حالة الطلب بالعربية |
| `sendChatNotification()` | إشعارات رسائل الدردشة |
| `sendDriverAssignmentNotification()` | إشعار السائق بالطلب |
| `sendNewOrderToDrivers()` | بث طلب جديد للسائقين |
| `storeInAppNotification()` | حفظ مباشر في قاعدة البيانات |

### كيف تعمل `sendToUser()`:
```
1. يحفظ إشعار داخل التطبيق في قاعدة البيانات (دائماً)
2. يُرسل إشعار ntfy push (إلا إذا skip_ntfy=true)
3. يُرسل واتساب (إلا إذا skip_whatsapp=true والمستخدم لديه هاتف)
4. يُرجع true إذا نجحت ANY قناة
```

---

## 💬 WhatsAppService - تكامل الواتساب

### الإعدادات (.env):
```env
ULTRAMSG_INSTANCE_ID=instance161430
ULTRAMSG_TOKEN=tp1z0fsev69fbg1o
ULTRAMSG_WHATSAPP_FROM=+963956789361
```

### آلية العمل:
1. يستخدم **UltraMsg API** (`https://api.ultramsg.com/{instanceId}/messages/chat`)
2. يُطبع أرقام الهواتف (يزيل `+` والمسافات والشرطات)
3. يُرسل طلب POST مع نص الرسالة
4. يُرجع استجابة نجاح/فشل
5. جميع الإرسالات تُسجل عبر `Log::info()` / `Log::error()`

---

## 🔐 الواتساب للـ OTP (المصادقة)

### ملف: `app/Services/AuthService.php`

### تدفق OTP:
1. **إنشاء** رمز من 4 أرقام
2. **إرسال عبر واتساب** بالعربية:
   ```
   أهلاً بك في DeliGo 
   رمز التحقق الخاص بك هو: {code}
   صالح لمدة 1440 دقيقة.
   ```
3. **حفظ** سجل OTP في قاعدة البيانات (ينتهي خلال 24 ساعة)
4. **يُستخدم** أثناء: التسجيل، إعادة تعيين كلمة المرور، إعادة إرسال OTP

---

## ⚡ الإشعارات المُدارة بالأحداث (Event-Driven)

### ملف: `app/Providers/EventServiceProvider.php`

| الحدث (Event) | المُستمع (Listener) | المُسبب |
|---------------|---------------------|---------|
| `MessageSent` | `SendMessageNotification` | تم إرسال رسالة دردشة |
| `OrderStatusChanged` | `SendOrderStatusNotification` | تحديث حالة الطلب |
| `NewOrderForDrivers` | `NotifyDriversOfNewOrder` | تم إنشاء طلب جديد |

### SendOrderStatusNotification:
يُعلم **3 أطراف** عند تغيير حالة الطلب:
1. **العميل** - يُعلم دائماً
2. **السائق** - إذا كان مُعيّناً والحالة ≠ `pending`
3. **أصحاب المتاجر** - كل صاحب متجر مشارك (عبر `storeSplits`)

### SendMessageNotification:
يُحضر كل المشاركين في المحادثة (إلا المُرسل) ويُرسِل لكل واحد إشعار دردشة.

### NotifyDriversOfNewOrder:
يُبحث عن كل **السائقين المعتمدين والمتصلين** في نفس `area_id` كعنوان التوصيل ويُرسِل لكل واحد تفاصيل الطلب.

---

## 📡 البث المباشر (WebSocket)

أحداث تُطبق `ShouldBroadcast`:

| الحدث | القنوات | اسم الحدث |
|-------|---------|-----------|
| `OrderStatusChanged` | `orders`, `orders.{customer_id}`, `drivers.{driver_id}` | `order.status.changed` |
| `MessageSent` | `PrivateChannel('conversation.{conversation_id}')` | `message.sent` |
| `NewOrderForDrivers` | `drivers.governorate.{id}`, `drivers.area.{area_id}` | `order.available` |
| `OrderCreated` | - | - |
| `OrderAssignedToDriver` | - | - |
| `ConversationCreated` | - | - |

---

## 🗄️ قاعدة البيانات

### Migration: `database/migrations/2026_04_07_120000_create_notifications_table.php`

```php
- id (UUID primary key)
- type (string)
- notifiable_type / notifiable_id (علاقة متعددة الأشكال)
- data (JSON: العنوان، الرسالة، الأولوية، رابط النقر، الوسائط، البيانات الوصفية)
- read_at (timestamp قابل للفارغ)
- created_at / updated_at
- Index: (notifiable_type, notifiable_id, read_at)
```

---

## 🛠️ نقاط نهاية API

### إشعارات المستخدم (`auth:sanctum`):

| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `GET /v1/notifications/` | `index()` | قائمة الإشعارات مع التصفح (فلتر `unread_only`) |
| `GET /v1/notifications/unread-count` | `unreadCount()` | عدد الإشعارات غير المقروءة |
| `POST /v1/notifications/{id}/read` | `markAsRead()` | وضع إشعار كمقروء |
| `POST /v1/notifications/mark-all-read` | `markAllAsRead()` | وضع كل الإشعارات كمقروءة |
| `GET /v1/notifications/topic` | `getTopic()` | الحصول على موضوع ntfy |
| `POST /v1/notifications/topic` | `updateTopic()` | تحديث موضوع ntfy |
| `POST /v1/notifications/test` | `sendTest()` | إرسال إشعار تجريبي |

### البث الإداري:

| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `POST /v1/admin/notifications/broadcast` | `broadcastNotification()` | بث جماعي للمستخدمين (مع خيار الواتساب) |

---

## ⏰ البث المجدول

### ملف: `routes/console.php`

### الأمر: `notifications:scheduled-broadcast`

- يعمل يومياً في الوقت المُعد (افتراضي `12:00`)
- يقرأ الإعدادات من `config/broadcast_reminders.php`
- **يتخطى الواتساب صراحةً** (`skip_whatsapp => true`)
- قابل للتخصيص عبر متغيرات البيئة:
  ```env
  SCHEDULED_BROADCAST_ENABLED=false
  SCHEDULED_BROADCAST_TIME=12:00
  SCHEDULED_BROADCAST_TITLE=🍽️ وقت الغداء
  SCHEDULED_BROADCAST_MESSAGE=اطلب طعامك الآن...
  SCHEDULED_BROADCAST_ROLE=customer
  BROADCAST_NOTIFICATION_CHUNK_SIZE=500
  ```

---

## 🔑 الصلاحيات والأدوار

### من يمكنه做什么؟

| الإجراء | الصلاحية المطلوبة | التفاصيل |
|---------|-------------------|----------|
| عرض إشعاراته الخاصة | `auth:sanctum` | أي مستخدم مُسجل دخول |
| وضع إشعار كمقروء | `auth:sanctum` | إشعاراته فقط |
| تحديث موضوع ntfy | `auth:sanctum` | خاص بمستخدمه فقط |
| إرسال بث جماعي | `role:admin` | إدارة فقط |
| إرسال OTP عبر واتساب | عام (بدون مصادقة) | لتسجيل/استعادة الحساب |
| البث المجدول | نظامي (Artisan) | يعمل عبر المُجدول |

### فلترة الأدوار في البث:

عند الإرسال الجماعي، يمكن تحديد `role` في الطلب:
- `customer` - العملاء فقط
- `driver` - السائقين فقط
- `store_owner` - أصحاب المتاجر فقط
- `all` - الجميع (ما عدا المديرين)

---

## 🔄 أمثلة على تدفق البيانات

### تحديث حالة الطلب:
```
OrderService::updateOrderStatus()
    ├── يُرسل رسالة دردشة عبر ChatService
    └── يُطلق حدث OrderStatusChanged
         └── SendOrderStatusNotification listener (في queue)
              └── NotificationService::sendToUser()
                   ├── إشعار داخل التطبيق → قاعدة البيانات
                   ├── ntfy push → طلب HTTP
                   └── واتساب → UltraMsg API
```

### البث الإداري:
```
AdminController::broadcastNotification()
    └── NotificationService::queueBroadcastToUsers()
         └── SendBroadcastNotificationChunkJob (لكل 500 مستخدم)
              └── NotificationService::sendToUser()
                   ├── إشعار داخل التطبيق → قاعدة البيانات
                   ├── ntfy push → طلب HTTP (إلا إذا تخطى)
                   └── واتساب → UltraMsg API (إلا إذا تخطى)
```

### رسالة الدردشة:
```
ChatService::sendMessage()
    ├── حفظ الرسالة في قاعدة البيانات
    ├── إطلاق حدث MessageSent (بث WebSocket)
    ├── إرسال ntfy push مباشرة
    └── SendMessageNotification listener (في queue)
         └── NotificationService::sendChatNotification()
              └── NotificationService::sendToUser()
                   ├── إشعار داخل التطبيق → قاعدة البيانات
                   ├── ntfy push → طلب HTTP
                   └── واتساب → UltraMsg API (إلا إذا تخطى)
```

---

## 📱 واجهة الإدارة

### ملف: `resources/js/Pages/Dashboards/AdminNotifications.jsx`

- نموذج React مع العنوان ورسالة وفلتر الدور
- **زر تبديل الواتساب** (افتراضي: إيقاف) مع تحذير: "واتساب للجميع قد يسبب تكلفة/حدود؛ استخدمه بحذر"
- يُرسل إلى `POST /api/v1/admin/notifications/broadcast`
- يُظهر رسالة نجاح مع عدد أجزاء الqueue

---

## 🎯 نقاط التكامل الرئيسية

| الخدمة | تُستخدم من | الغرض |
|---------|-----------|-------|
| `WhatsAppService` | `NotificationService`, `AuthService` | رسائل واتساب، OTP |
| `NotificationService` | المُتحكمات، المُستمعات، ChatService | إشعارات متعددة القنوات |
| `ChatService` | `OrderService`, المُستمعات | رسائل الدردشة + إشعارات ntfy |
| `OrderService` | مُتحكمات الطلبات | إنشاء الطلب، تحديث الحالة |

---

## 📊 أنواع الإشعارات حسب السياق

| السياق | القنوات المستخدمة | مثال |
|--------|-------------------|------|
| تسجيل مستخدم جديد | واتساب فقط | رمز OTP |
| استعادة كلمة المرور | واتساب فقط | رمز الاستعادة |
| تغيير حالة الطلب | 3 قنوات | "تم قبول طلبك" |
| رسالة دردشة جديدة | 3 قنوات | "رسالة جديدة من أحمد" |
| تعيين سائق لطلب | واتساب + ntfy + داخل التطبيق | "طلب جديد #1234" |
| بث إداري | 3 قنوات (اختياري) | "عرض خاص اليوم!" |
| بث مجدول | ntfy + داخل التطبيق فقط | "🍽️ وقت الغداء" |
| طلب جديد للسائقين | ntfy + WebSocket | "طلب متاح في منطقتك" |

---

## 🔒 إعدادات الأمان

### ntfy:
- كل مستخدم لديه `ntfy_topic` فريد بصيغة: `user-{id}-{random10chars}`
- يتم إنشاؤه تلقائياً إذا لم يكن موجوداً
- التحقق من صحة الموضوع: `^[a-zA-Z0-9_-]+$`

### واتساب:
- أرقام الهواتف مُطبّعة قبل الإرسال
- التحقق من صحة الinstance_id وtoken قبل كل إرسال
- يُسجل كل إرسال للنقاش والتدقيق

### البث الإداري:
- يتطلب صلاحية `admin` صراحةً
- واتساب معطل افتراضياً للبث (لتجنب التكلفة/الحدود)
- المُشغّل يجب أن يُفعّله صراحةً عبر `send_whatsapp: true`

---

## 📝 مُلاحظات هامة

1. **الواتساب مكلف**: يُستخدم بحذر في البث الجماعي
2. **الإشعارات الداخلية**: دائماً تُحفظ، لا يمكن تخطيها
3. **الأحداث المُدارة**: تعمل في queue لتجنب تأخير الطلب
4. **البث المجدول**: مُعطل افتراضياً (`SCHEDULED_BROADCAST_ENABLED=false`)
5. **التجزئة**: كل جزء = 500 مستخدم (قابل للتعديل عبر `BROADCAST_NOTIFICATION_CHUNK_SIZE`)
6. **الـ OTP**: ينتهي خلال 24 ساعة (1440 دقيقة)
7. **السجل**: كل عمليات الإرسال تُسجل في `Log::info()` / `Log::error()`
