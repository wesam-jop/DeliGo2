# 🔄 Retry Mechanism & Smart Grouping - Documentation

---

## 📊 نظرة عامة

تم إضافة ميزتين متقدمتين لنظام الإشعارات:

### 1️⃣ **Retry Mechanism** - إعادة المحاولة عند الفشل
### 2️⃣ **Smart Grouping** - دمج الإشعارات المتشابهة

---

## 🔄 أولاً: Retry Mechanism

### 🎯 الهدف

عند فشل إرسال إشعار (WhatsApp أو Push أو ntfy)، يتم إعادة المحاولة تلقائياً وفق جدول زمني ذكي.

---

### ⏰ جدول إعادة المحاولة

| المحاولة | التأخير | الوصف |
|----------|---------|-------|
| المحاولة 1 | مباشرة | المحاولة الأولى |
| إعادة 1 | بعد 1 دقيقة | أول إعادة محاولة |
| إعادة 2 | بعد 5 دقائق | ثاني إعادة محاولة |
| إعادة 3 | بعد 15 دقيقة | آخر إعادة محاولة |

**إجمالي الوقت:** ~21 دقيقة كحد أقصى

---

### 🧱 الملفات الجديدة

#### 1. `app/Jobs/RetryFailedNotificationJob.php`

Job مسؤول عن إعادة محاولة إرسال الإشعارات الفاشلة.

**الميزات:**
- ✅ تتبع عدد المحاولات (`$attemptNumber`)
- ✅ تأخير ذكي حسب المحاولة
- ✅ تسجيل شامل لكل محاولة
- ✅ يتوقف بعد 3 محاولات

**الكود:**

```php
// مثال على الاستخدام (يتم تلقائياً من NotificationService)
RetryFailedNotificationJob::dispatch(
    $userId,
    $title,
    $message,
    $options,
    1, // Attempt number
    'whatsapp', // Failed channel
    'WhatsApp API error' // Previous error
)->delay(now()->addSeconds(60)); // Delay 1 minute
```

---

### 🔧 كيف يعمل Retry؟

#### التدفق الكامل:

```
1. NotificationService::sendToUser()
   ↓
2. محاولة الإرسال عبر القنوات (WhatsApp/Push/ntfy)
   ↓
3. فشل جميع القنوات؟ 
   ↓ YES
4. تحليل الأخطاء وتحديد القناة الفاشلة
   ↓
5. RetryFailedNotificationJob::dispatch() مع delay
   ↓
6. بعد 1 دقيقة: Job يعمل
   ↓
7. إعادة محاولة الإرسال
   ↓
8. نجح؟ ✅ YES → انتهى
   ↓ NO
9. retry attempt < 3؟ YES → dispatch next retry مع delay أطول
   ↓ NO
10. تسجيل الفشل النهائي في Log ❌
```

---

### 📝 مثال من الكود:

```php
// داخل NotificationService::sendToUser()

$results = [];
$errors = [];

// WhatsApp notification
$results['whatsapp'] = false;
if (!$skipWhatsapp && in_array('whatsapp', $channels) && $user->phone) {
    $whatsappMessage = "🔔 *{$title}*\n\n{$message}";
    try {
        $whatsappResponse = $this->whatsapp->sendMessage($user->phone, $whatsappMessage);
        $results['whatsapp'] = (bool) ($whatsappResponse['success'] ?? false);
        if (!$results['whatsapp']) {
            $errors['whatsapp'] = $whatsappResponse['message'] ?? 'WhatsApp send failed';
        }
    } catch (\Exception $e) {
        $results['whatsapp'] = false;
        $errors['whatsapp'] = $e->getMessage();
    }
}

// ... (repeat for other channels)

$anySucceeded = in_array(true, $results);

// Handle retries for failed channels
if (!$anySucceeded && !empty($errors)) {
    $this->handleRetry($user, $title, $message, $options, $notificationType, $entityType, $entityId, $errors);
}

return $anySucceeded;
```

---

### 🎨 Retry Delays Configuration

```php
// RetryFailedNotificationJob.php

protected array $retryDelays = [
    1 => 60,    // 1 minute
    2 => 300,   // 5 minutes
    3 => 900,   // 15 minutes
];
```

يمكن تعديل هذه القيم حسب الحاجة.

---

### 📊 Logging

كل محاولةRetry تُسجل:

```
[INFO] Retrying notification
  user_id: 123
  attempt: 1
  channel: whatsapp
  previous_error: "WhatsApp API timeout"

[INFO] Scheduled next retry attempt
  user_id: 123
  next_attempt: 2
  delay_seconds: 300

[WARNING] Notification retry failed
  user_id: 123
  attempt: 2
  channel: whatsapp

[ERROR] Retry notification job permanently failed
  user_id: 123
  attempt: 3
  error: "WhatsApp API error"
  channel: whatsapp
```

---

### ⚙️ Job Configuration

```php
class RetryFailedNotificationJob implements ShouldQueue
{
    public $tries = 3; // Max 3 attempts per retry chain
    
    // ...
}
```

**ملاحظة:** كل retry chain يمكن أن تُنشئ chain جديد إذا لزم الأمر.

---

## 🎯 ثانياً: Smart Grouping

### الهدف

تقليل الإشعارات المكررة عبر دمجها في إشعار واحد خلال فترة زمنية محددة.

---

### 🧠 الفكرة

**بدلاً من:**
```
[10:00] 📦 طلب جديد رقم #1
[10:01] 📦 طلب جديد رقم #2
[10:02] 📦 طلب جديد رقم #3
[10:03] 📦 طلب جديد رقم #4
```

**يتم:**
```
[10:05] 📦 لديك 4 طلبات جديدة
```

---

### 🗄️ قاعدة البيانات

#### جدول `notification_groups`

```sql
CREATE TABLE notification_groups (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,                    -- المستخدم
    type VARCHAR(255),                 -- نوع الإشعار (e.g., 'order.created')
    entity_type VARCHAR(255),          -- نوع الكيان (e.g., 'order')
    count INT DEFAULT 1,               -- عدد الإشعارات المدمجة
    last_entity_id BIGINT,             -- آخر كيان (للـ Deep Link)
    entity_ids JSON,                   -- جميع المعرفات (للقوائم)
    expires_at TIMESTAMP,              -- متى ينتهي الـ grouping
    is_dispatched BOOLEAN DEFAULT FALSE, -- هل تم الإرسال؟
    dispatched_at TIMESTAMP,           -- متى تم الإرسال
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

### ⏱️ نافذة الـ Grouping

```php
// NotificationService.php

protected int $groupingWindowMinutes = 5; // 5 دقائق
```

**كيف يعمل:**
1. إشعار جديد يصل
2. النظام يبحث عن group نشط لنفس `user_id` + `type` + `entity_type`
3. إذا يوجد: زيادة `count` وتحديث `last_entity_id`
4. إذا لا يوجد: إنشاء group جديد مع `expires_at = now + 5 minutes`
5. عندما تنتهي النافذة: يتم إرسال الإشعار المدمج

---

### 🎯 أنواع تدعم الـ Grouping

```php
// NotificationService.php

protected array $groupableTypes = [
    'order.created',       // طلبات جديدة
    'order.assigned',      // طلبات مُعينة للسائق
    'message.received',    // رسائل جديدة (اختياري)
];
```

### ❌ أنواع لا تدعم الـ Grouping (حرجة)

```php
protected array $nonGroupableTypes = [
    'otp',                // رموز التحقق
    'system.critical',    // إشعارات النظام الحرجة
    'order.cancelled',    // إلغاء الطلب
];
```

---

### 🔄 كيف يعمل Smart Grouping؟

#### التدفق الكامل:

```
1. إشعار جديد يصل: sendToUser()
   ↓
2. supportsGrouping(type)؟ 
   ↓ YES
3. بحث عن group نشط لـ (user_id + type + entity_type)
   ↓
4. ┌─ YES: Group موجود ─────────────────┐
   │                                      │
   │  group.addEntity(entityId)          │
   │  group.count++                       │
   │  ✅ انتهى (لا إرسال الآن)            │
   └──────────────────────────────────────┘
   ↓
5. ┌─ NO: Group غير موجود ───────────────┐
   │                                      │
   │  إنشاء group جديد                    │
   │  expires_at = now + 5 minutes       │
   │  DispatchNotificationGroupJob       │
   │    → delay(5 minutes)               │
   │  ✅ انتهى                            │
   └──────────────────────────────────────┘
```

#### عندما ينتهي الـ Grouping (بعد 5 دقائق):

```
6. DispatchNotificationGroupJob يعمل
   ↓
7. NotificationService::dispatchGroupedNotification()
   ↓
8. ┌─ count = 1 ─────────────────────────┐
   │                                      │
   │  Message: "لديك طلب جديد رقم #123"  │
   │  URL: /orders/123                    │
   └──────────────────────────────────────┘
   ↓
9. ┌─ count > 1 ─────────────────────────┐
   │                                      │
   │  Message: "لديك 4 طلبات جديدة"      │
   │  URL: /orders (صفحة القائمة)         │
   └──────────────────────────────────────┘
   ↓
10. إرسال عبر القنوات المفعلة
   ↓
11. group.markAsDispatched()
```

---

### 📝 أمثلة من القوالب

#### Template عادي:

```php
// config/notification_templates.php

'order_created' => [
    'title' => '📦 طلب جديد',
    'message' => 'لديك طلب جديد رقم #{order_id}',
    'grouped_message' => 'لديك {count} طلبات جديدة', // ← رسالة المجموعة
    'action_url' => '/orders/{order_id}',
    'group_action_url' => '/orders',                  // ← URL للمجموعة
    'priority' => 'high',
    'type' => 'order.created',
    'channels' => ['in_app', 'push', 'whatsapp'],
],
```

#### الاستخدام في الكود:

```php
// NotificationService::dispatchGroupedNotification()

if ($group->count === 1) {
    $message = $template['message']; // "لديك طلب جديد رقم #123"
    $actionUrl = "/orders/{$group->last_entity_id}"; // Deep link مباشر
} else {
    $message = str_replace('{count}', $group->count, $template['grouped_message']);
    // "لديك 4 طلبات جديدة"
    $actionUrl = '/orders'; // صفحة القائمة
}
```

---

### 🎨 Deep Linking Behavior

| السيناريو | Count | Action URL | السلوك |
|-----------|-------|------------|--------|
| إشعار واحد | 1 | `/orders/123` | يفتح الطلب مباشرة |
| إشعارات مدمجة | > 1 | `/orders` | يفتح صفحة قائمة الطلبات |

**مثال Frontend (React Native):**

```jsx
// عند الضغط على الإشعار
messaging().onNotificationOpenedApp(async (remoteMessage) => {
  const { action_url, group_count } = remoteMessage.data;
  
  if (group_count > 1) {
    // مجموعة → عرض القائمة
    navigation.navigate('OrderList');
  } else {
    // إشعار واحد → عرض الطلب
    const orderId = extractOrderId(action_url);
    navigation.navigate('OrderDetails', { id: orderId });
  }
});
```

---

### 🧹 Cleanup

#### Artisan Command:

```bash
php artisan notifications:cleanup
```

**ماذا يفعل:**
- ✅ يحذف groups القديمة (dispatched منذ > يوم)
- ✅ يحذف groups المنتهية (expired)
- ✅ يحذف logs القديمة (منذ > 7 أيام)

#### Automated Schedule:

```php
// routes/console.php

Schedule::command('notifications:cleanup')
    ->dailyAt('03:00')
    ->timezone(config('app.timezone'));
```

يعمل يومياً الساعة 3 صباحاً.

---

## 🔐 شروط إضافية

### ✅ احترام Notification Preferences

```php
// داخل sendToUser()

$preferences = $user->notificationPreferences;
if ($preferences && !$this->respectsPreferences($preferences, $options, $notificationType)) {
    return false; // لا يُرسل إذا كان معطل في التفضيلات
}
```

### ✅ عدم كسر Deduplication

```php
// الـ Deduplication يعمل قبل الـ Grouping

if ($notificationType && !$this->shouldSend($user, $notificationType, $entityType, $entityId)) {
    return false; // يمنع التكرار خلال 5 دقائق
}

// ثم يأتي الـ Grouping
if ($this->supportsGrouping($notificationType)) {
    $grouped = $this->handleGroupedNotification(...);
}
```

### ✅ العمل مع Queue

جميع Jobs تدعم Queue:
- `RetryFailedNotificationJob` - يعمل مع delay
- `DispatchNotificationGroupJob` - يعمل بعد انتهاء النافذة
- `SendBroadcastNotificationChunkJob` - يعمل مع retry

### ✅ دعم جميع القنوات

الـ Grouping يعمل مع:
- ✅ In-App notifications
- ✅ Push notifications (FCM)
- ✅ WhatsApp (UltraMsg)
- ✅ ntfy

---

## 📊 أمثلة عملية

### مثال 1: طلبات جديدة

**السيناريو:** عميل يطلب 3 طلبات خلال 5 دقائق

**بدون Grouping:**
```
10:00 - 📦 طلب جديد رقم #1001
10:02 - 📦 طلب جديد رقم #1002
10:04 - 📦 طلب جديد رقم #1003
```

**مع Grouping:**
```
10:05 - 📦 لديك 3 طلبات جديدة
       (عند الضغط → /orders)
```

---

### مثال 2: Retry عند فشل WhatsApp

**السيناريو:** فشل إرسال إشعار واتساب

```
10:00:00 - ❌ فشل WhatsApp: "API timeout"
           ↓
           🔄 Scheduled retry #1 in 1 minute
           
10:01:00 - ❌ فشل WhatsApp: "API timeout"
           ↓
           🔄 Scheduled retry #2 in 5 minutes
           
10:06:00 - ✅ نجح WhatsApp!
           ↓
           📝 Logged: "Notification retry succeeded"
```

---

### مثال 3: Grouping مع Retry

**السيناريو:** 5 طلبات جديدة + فشل أول إرسال

```
10:00 - 📦 طلب #1 → Added to group
10:01 - 📦 طلب #2 → Added to group
10:02 - 📦 طلب #3 → Added to group
10:03 - 📦 طلب #4 → Added to group
10:04 - 📦 طلب #5 → Added to group

10:05 - 🔔 Dispatch group notification
        → "لديك 5 طلبات جديدة"
        → ❌ Failed: WhatsApp error
        ↓
        🔄 Retry #1 scheduled (1 minute)
        
10:06 - 🔄 Retry #1
        → ✅ Success!
```

---

## 🎯 Best Practices

### 1. ضبط نافذة الـ Grouping

```php
// NotificationService.php

// حسب نوع التطبيق:
protected int $groupingWindowMinutes = 5;   // توصيل طعام (سريع)
protected int $groupingWindowMinutes = 10;  // تجارة إلكترونية (متوسط)
protected int $groupingWindowMinutes = 30;  // إشعارات تسويقية (بطيء)
```

### 2. مراقبة الـ Retry Rate

```php
// في Logs، ابحث عن:
grep "Retry failed" storage/logs/laravel.log | wc -l

// إذا كان العدد كبير، تحقق من:
// - WhatsApp API connectivity
// - FCM Server Key configuration
// - Network issues
```

### 3. تنظيف قاعدة البيانات

```bash
# يومياً
php artisan notifications:cleanup

# أسبوعياً: مراجعة الحجم
SELECT 
    COUNT(*) as total_groups,
    SUM(count) as total_notifications,
    AVG(count) as avg_group_size
FROM notification_groups
WHERE created_at > NOW() - INTERVAL 7 DAY;
```

### 4. اختبار الـ Retry

```bash
# اختبار يدوي
php artisan tinker

>>> use App\Jobs\RetryFailedNotificationJob;
>>> RetryFailedNotificationJob::dispatch(1, 'Test', 'Test message', [], 1, 'whatsapp', 'Test error');
```

---

## 📈 Metrics & Monitoring

### ما يجب مراقبته:

| Metric | الوصف | القيمة الطبيعية |
|--------|-------|----------------|
| Retry Rate | نسبة الإشعارات التي تحتاج retry | < 5% |
| Group Rate | نسبة الإشعارات المدمجة | 20-40% |
| Avg Group Size | متوسط حجم المجموعة | 2-5 |
| Cleanup Time | وقت التنظيف اليومي | < 30s |
| Queue Lag | تأخير الـ Queue | < 1 min |

---

## 🚀 الخطوات التالية

### 1. تشغيل Migrations:

```bash
php artisan migrate
```

### 2. تحديث Cache:

```bash
php artisan config:cache
php artisan route:cache
```

### 3. تشغيل Queue Worker:

```bash
php artisan queue:work --queue=high,default,low
```

### 4. اختبار الـ Retry:

```bash
# إرسال إشعار تجريبي مع simulating failure
php artisan tinker
>>> use App\Services\NotificationService;
>>> $service = app(NotificationService::class);
>>> $service->sendToUser(User::find(1), 'Test', 'Test message', ['type' => 'order.created'], 'order.created', 'order', 123);
```

### 5. مراقبة Logs:

```bash
tail -f storage/logs/laravel.log | grep -E "Retry|Group"
```

---

## 📚 الملفات الجديدة/المعدلة

### ملفات جديدة (5):
1. `database/migrations/2026_04_11_100001_create_notification_groups_table.php`
2. `app/Models/NotificationGroup.php`
3. `app/Jobs/RetryFailedNotificationJob.php`
4. `app/Jobs/DispatchNotificationGroupJob.php`
5. `NOTIFICATION_RETRY_AND_GROUPING.md` (هذا الملف)

### ملفات معدلة (5):
1. `app/Services/NotificationService.php` - Retry + Grouping
2. `config/notification_templates.php` - grouped_message
3. `app/Jobs/SendBroadcastNotificationChunkJob.php` - Retry support
4. `routes/console.php` - Cleanup command
5. `.env.example` - (اختياري) FCM_SERVER_KEY

---

## 🎉 النتيجة

**تم التنفيذ بنجاح!**

النظام الآن يدعم:
- ✅ Retry mechanism مع 3 محاولات
- ✅ Smart grouping مع نافذة 5 دقائق
- ✅ Deep linking ذكي
- ✅ Cleanup تلقائي
- ✅ Logging شامل
- ✅ Queue support
- ✅ Preferences respect
- ✅ All channels support

**جاهز للاستخدام! 🚀**
