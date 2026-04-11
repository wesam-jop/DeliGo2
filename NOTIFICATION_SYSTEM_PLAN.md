# 🚀 خطة بناء نظام الإشعارات المتكامل - DeliGo2

---

## 📊 تحليل الوضع الحالي

### ✅ ما هو موجود ويعمل بشكل جيد:

| المكون | الحالة | الملف |
|--------|--------|-------|
| خدمة إشعارات متعددة القنوات | ✅ موجود | `app/Services/NotificationService.php` |
| تكامل الواتساب (UltraMsg) | ✅ موجود | `app/Services/WhatsAppService.php` |
| إشعارات OTP | ✅ موجود | `app/Services/AuthService.php` |
| أحداث الطلبات (Events) | ✅ موجود | `app/Events/Order*.php` |
| مُستمعات الإشعارات | ✅ موجود | `app/Listeners/*.php` |
| جدول الإشعارات | ✅ موجود | `database/migrations/2026_04_07_120000_*` |
| بث إداري (Broadcast) | ✅ موجود | `app/Http/Controllers/Api/AdminController.php` |
| إدارة موضوع ntfy | ✅ موجود | `app/Models/User.php` |

---

## ❌ المشاكل والثغرات المكتشفة

### 🔴 مشكلة حرجة: حدث `MessageSent` لا يُطلق أبداً

**الملف:** `app/Services/ChatService.php`

**المشكلة:**
```php
// الاستيراد موجود (السطر 6)
use App\Events\MessageSent;

// لكن لا يوجد أي مكان في الكود:
event(new MessageSent(...));  // ❌ غير موجود!
```

**التأثير:**
- المُستمع `SendMessageNotification` **لا يعمل أبداً**
- إشعارات الدردشة تُرسل مباشرة من `ChatService::sendMessage()` (تتجاوز نظام الأحداث)
- البث عبر WebSocket للرسائل الجديدة **لا يعمل**

**الحل المطلوب:**
```php
// في ChatService::sendMessage() بعد حفظ الرسالة:
event(new MessageSent($message, $sender));
```

---

### 🟡 مشكلة متوسطة: ازدواجية المنطق في `ChatService`

**المشكلة:**
- `ChatService::sendMessage()` يُرسل الإشعارات مباشرة
- في نفس الوقت يوجد مُستمع `SendMessageNotification` للأحداث
- إذا أضفنا `event(new MessageSent())` سنحصل على إشعارات مكررة

**الحل:**
1. إزالة الإرسال المباشر من `ChatService::sendMessage()`
2. الاعتماد فقط على المُستمع عبر الأحداث

---

### 🟡 مشكلة بسيطة: حدث `OrderAssignedToDriver` بدون مُستمع

**المشكلة:**
- الحدث يُطلق في `OrderService::assignDriver()`
- لا يوجد listener في `EventServiceProvider`
- الإشعار يعمل عبر `OrderStatusChanged` (يُطلق في نفس الطريقة)

**الحل:**
- إما إضافة مُستمع مخصص
- أو إزالة الحدث غير المستخدم لتجنب الارتباك

---

### 🟡 مشكلة بسيطة: حدث `ConversationCreated` بدون مُستمع

**المشكلة:**
- يُطلق في `ChatService::createOrderConversation()`
- لا يوجد listener مسجل

**الحل:**
- إضافة مُستمع إذا لزم الأمر
- أو إزالة الحدث إذا لم يكن مطلوباً

---

## 🆕 الميزات المفقودة (غير موجودة)

### 1. تفضيلات الإشعارات للمستخدمين ❌

**المفقود:**
- لا يوجد جدول `notification_preferences`
- لا يمكن للمستخدمين التحكم في:
  - أي القنوات يستقبلون عليها (ntfy/whatsapp/in-app)
  - أوقات الهدوء (Do Not Disturb)
  - أنواع الإشعارات (طلبات، دردشة، تسويق)

**المطلوب إنشاؤه:**

#### Migration جديدة:
```php
// database/migrations/2026_04_XX_create_notification_preferences_table.php
Schema::create('notification_preferences', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    
    // Channel preferences
    $table->boolean('enable_in_app')->default(true);
    $table->boolean('enable_push')->default(true);
    $table->boolean('enable_whatsapp')->default(true);
    
    // Notification types
    $table->boolean('order_updates')->default(true);
    $table->boolean('message_updates')->default(true);
    $table->boolean('marketing_messages')->default(false);
    
    // Quiet hours
    $table->time('quiet_hours_start')->nullable();
    $table->time('quiet_hours_end')->nullable();
    $table->boolean('respect_quiet_hours')->default(false);
    
    $table->timestamps();
    
    $table->unique('user_id');
});
```

#### Model جديد:
```php
// app/Models/NotificationPreference.php
class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'enable_in_app',
        'enable_push',
        'enable_whatsapp',
        'order_updates',
        'message_updates',
        'marketing_messages',
        'quiet_hours_start',
        'quiet_hours_end',
        'respect_quiet_hours',
    ];
    
    protected $casts = [
        'enable_in_app' => 'boolean',
        'enable_push' => 'boolean',
        'enable_whatsapp' => 'boolean',
        'order_updates' => 'boolean',
        'message_updates' => 'boolean',
        'marketing_messages' => 'boolean',
        'respect_quiet_hours' => 'boolean',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function shouldSendVia($channel, $type = 'general')
    {
        // Check quiet hours first
        if ($this->respect_quiet_hours && $this->isQuietHours()) {
            return false;
        }
        
        // Check channel preference
        $channelKey = "enable_{$channel}";
        if (!$this->$channelKey) {
            return false;
        }
        
        // Check notification type
        if ($type === 'order' && !$this->order_updates) {
            return false;
        }
        if ($type === 'message' && !$this->message_updates) {
            return false;
        }
        if ($type === 'marketing' && !$this->marketing_messages) {
            return false;
        }
        
        return true;
    }
    
    protected function isQuietHours()
    {
        if (!$this->quiet_hours_start || !$this->quiet_hours_end) {
            return false;
        }
        
        $now = now();
        $start = Carbon::parse($this->quiet_hours_start);
        $end = Carbon::parse($this->quiet_hours_end);
        
        if ($start->lt($end)) {
            return $now->between($start, $end);
        }
        
        // Overnight quiet hours (e.g., 22:00 - 08:00)
        return $now->gte($start) || $now->lte($end);
    }
}
```

#### API Endpoints جديدة:
```php
// routes/api.php (داخل مجموعة notifications)
Route::get('/preferences', [NotificationPreferenceController::class, 'get']);
Route::put('/preferences', [NotificationPreferenceController::class, 'update']);
```

#### Controller جديد:
```php
// app/Http/Controllers/Api/NotificationPreferenceController.php
class NotificationPreferenceController extends Controller
{
    public function get(Request $request)
    {
        $preferences = $request->user()->notificationPreferences 
            ?? $request->user()->notificationPreferences()->create([]);
        
        return response()->json($preferences);
    }
    
    public function update(Request $request)
    {
        $validated = $request->validate([
            'enable_in_app' => 'sometimes|boolean',
            'enable_push' => 'sometimes|boolean',
            'enable_whatsapp' => 'sometimes|boolean',
            'order_updates' => 'sometimes|boolean',
            'message_updates' => 'sometimes|boolean',
            'marketing_messages' => 'sometimes|boolean',
            'quiet_hours_start' => 'sometimes|nullable|date_format:H:i',
            'quiet_hours_end' => 'sometimes|nullable|date_format:H:i',
            'respect_quiet_hours' => 'sometimes|boolean',
        ]);
        
        $preferences = $request->user()->notificationPreferences 
            ?? $request->user()->notificationPreferences()->create([]);
        
        $preferences->update($validated);
        
        return response()->json([
            'message' => 'تم تحديث تفضيلات الإشعارات',
            'preferences' => $preferences,
        ]);
    }
}
```

---

### 2. نظام القوالب (Notification Templates) ❌

**المفقود:**
- لا يوجد نظام قوالب مركزي
- النصوص مكتوبة مباشرة في الكود (Hardcoded)

**المطلوب إنشاؤه:**

#### ملف القوالب:
```php
// config/notification_templates.php
return [
    'order_created' => [
        'title' => 'طلب جديد',
        'message' => 'لديك طلب جديد رقم #{order_id}',
        'action_url' => '/orders/{order_id}',
        'priority' => 'high',
    ],
    
    'order_accepted' => [
        'title' => 'تم قبول طلبك',
        'message' => 'تم قبول طلبك رقم #{order_id} وسيتم تحضيره قريباً',
        'action_url' => '/orders/{order_id}',
        'priority' => 'high',
    ],
    
    'order_preparing' => [
        'title' => 'جاري تحضير طلبك',
        'message' => 'يتم الآن تحضير طلبك رقم #{order_id}',
        'action_url' => '/orders/{order_id}',
        'priority' => 'medium',
    ],
    
    'order_ready' => [
        'title' => 'طلبك جاهز',
        'message' => 'طلبك رقم #{order_id} جاهز للاستلام/التوصيل',
        'action_url' => '/orders/{order_id}',
        'priority' => 'high',
    ],
    
    'order_delivered' => [
        'title' => 'تم توصيل طلبك',
        'message' => 'تم توصيل طلبك رقم #{order_id} بنجاح. شهية طيبة!',
        'action_url' => '/orders/{order_id}',
        'priority' => 'medium',
    ],
    
    'order_cancelled' => [
        'title' => 'تم إلغاء طلبك',
        'message' => 'تم إلغاء طلبك رقم #{order_id}',
        'action_url' => '/orders/{order_id}',
        'priority' => 'high',
    ],
    
    'message_received' => [
        'title' => 'رسالة جديدة',
        'message' => 'رسالة جديدة من {sender_name}',
        'action_url' => '/chat/{conversation_id}',
        'priority' => 'medium',
    ],
    
    'driver_assigned' => [
        'title' => 'طلب جديد مُخصص لك',
        'message' => 'لديك طلب جديد رقم #{order_id}',
        'action_url' => '/orders/{order_id}',
        'priority' => 'high',
    ],
    
    'new_store_registered' => [
        'title' => 'متجر جديد مسجل',
        'message' => 'تم تسجيل متجر جديد: {store_name}',
        'action_url' => '/stores/{store_id}',
        'priority' => 'medium',
    ],
    
    'new_driver_registered' => [
        'title' => 'سائق جديد مسجل',
        'message' => 'تم تسجيل سائق جديد: {driver_name}',
        'action_url' => '/drivers/{driver_id}',
        'priority' => 'medium',
    ],
    
    // Default fallback
    'default' => [
        'title' => '{title}',
        'message' => '{message}',
        'action_url' => '{action_url}',
        'priority' => 'medium',
    ],
];
```

#### Service Helper:
```php
// app/Services/NotificationTemplateService.php
class NotificationTemplateService
{
    public static function resolve(string $templateKey, array $data): array
    {
        $templates = config('notification_templates');
        $template = $templates[$templateKey] ?? $templates['default'];
        
        $title = $template['title'];
        $message = $template['message'];
        $actionUrl = $template['action_url'] ?? null;
        $priority = $template['priority'] ?? 'medium';
        
        // Replace placeholders
        foreach ($data as $key => $value) {
            $title = str_replace("{{$key}}", $value, $title);
            $message = str_replace("{{$key}}", $value, $message);
            if ($actionUrl) {
                $actionUrl = str_replace("{{$key}}", $value, $actionUrl);
            }
        }
        
        return [
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'priority' => $priority,
        ];
    }
}
```

---

### 3. تحديد الأولويات (Priority System) ❌

**المطلوب:**

```php
// في NotificationService::sendToUser()

protected function determineChannels($priority, $preferences, $notificationType)
{
    $channels = [];
    
    switch ($priority) {
        case 'high':
            // جميع القنوات
            if ($preferences->enable_in_app) $channels[] = 'in_app';
            if ($preferences->enable_push) $channels[] = 'push';
            if ($preferences->enable_whatsapp) $channels[] = 'whatsapp';
            break;
            
        case 'medium':
            // push + in_app فقط
            if ($preferences->enable_in_app) $channels[] = 'in_app';
            if ($preferences->enable_push) $channels[] = 'push';
            break;
            
        case 'low':
            // in_app فقط
            if ($preferences->enable_in_app) $channels[] = 'in_app';
            break;
    }
    
    return $channels;
}
```

---

### 4. منع التكرار (Deduplication) ❌

**المطلوب إنشاؤه:**

#### Migration:
```php
// database/migrations/2026_04_XX_create_notification_logs_table.php
Schema::create('notification_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('type');
    $table->string('entity_type')->nullable();
    $table->unsignedBigInteger('entity_id')->nullable();
    $table->timestamp('sent_at');
    
    $table->index(['user_id', 'type', 'entity_type', 'entity_id']);
    $table->index('sent_at');
});
```

#### Logic في NotificationService:
```php
public function shouldSend(User $user, string $type, $entityType = null, $entityId = null): bool
{
    // Check for duplicate within last 5 minutes
    $query = NotificationLog::where('user_id', $user->id)
        ->where('type', $type)
        ->where('sent_at', '>=', now()->subMinutes(5));
    
    if ($entityType && $entityId) {
        $query->where('entity_type', $entityType)
              ->where('entity_id', $entityId);
    }
    
    return !$query->exists();
}

public function logNotification(User $user, string $type, $entityType = null, $entityId = null): void
{
    NotificationLog::create([
        'user_id' => $user->id,
        'type' => $type,
        'entity_type' => $entityType,
        'entity_id' => $entityId,
        'sent_at' => now(),
    ]);
}
```

---

### 5. تتبع أجهزة Push Notifications (FCM/APNs) ❌

**المطلوب إنشاؤه:**

#### Migration:
```php
// database/migrations/2026_04_XX_create_device_tokens_table.php
Schema::create('device_tokens', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('token'); // FCM/APNs token
    $table->string('device_type')->nullable(); // ios, android, web
    $table->string('device_name')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamp('last_used_at')->nullable();
    $table->timestamps();
    
    $table->unique(['user_id', 'token']);
    $table->index(['is_active', 'device_type']);
});
```

#### Model:
```php
// app/Models/DeviceToken.php
class DeviceToken extends Model
{
    protected $fillable = [
        'user_id',
        'token',
        'device_type',
        'device_name',
        'is_active',
        'last_used_at',
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

#### Service جديد:
```php
// app/Services/PushNotificationService.php
class PushNotificationService
{
    public function sendToDeviceToken(string $token, array $payload): bool
    {
        // Integration with FCM or other push service
        // For now, using ntfy as fallback
        $response = Http::post('https://fcm.googleapis.com/fcm/send', [
            'to' => $token,
            'notification' => [
                'title' => $payload['title'],
                'body' => $payload['message'],
                'click_action' => $payload['action_url'] ?? null,
            ],
            'data' => [
                'type' => $payload['type'] ?? 'notification',
                'entity_id' => $payload['entity_id'] ?? null,
                'action_url' => $payload['action_url'] ?? null,
            ],
        ]);
        
        return $response->successful();
    }
    
    public function sendToUser(User $user, array $payload): array
    {
        $tokens = $user->deviceTokens()
            ->where('is_active', true)
            ->get();
        
        $results = ['success' => 0, 'failed' => 0];
        
        foreach ($tokens as $deviceToken) {
            $success = $this->sendToDeviceToken($deviceToken->token, $payload);
            
            if ($success) {
                $deviceToken->update(['last_used_at' => now()]);
                $results['success']++;
            } else {
                $results['failed']++;
            }
        }
        
        return $results;
    }
}
```

#### API Endpoint:
```php
// routes/api.php
Route::post('/devices/register', [DeviceController::class, 'register']);
Route::post('/devices/unregister', [DeviceController::class, 'unregister']);

// app/Http/Controllers/Api/DeviceController.php
class DeviceController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'device_type' => 'sometimes|string|in:ios,android,web',
            'device_name' => 'sometimes|string',
        ]);
        
        $token = DeviceToken::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'token' => $validated['token'],
            ],
            [
                'device_type' => $validated['device_type'] ?? null,
                'device_name' => $validated['device_name'] ?? null,
                'is_active' => true,
            ]
        );
        
        return response()->json(['message' => 'Device registered', 'token' => $token]);
    }
    
    public function unregister(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);
        
        DeviceToken::where('user_id', $request->user()->id)
            ->where('token', $validated['token'])
            ->update(['is_active' => false]);
        
        return response()->json(['message' => 'Device unregistered']);
    }
}
```

---

### 6. تتبع الإرسالات والإحصائيات ❌

**المطلوب إضافته لجدول notifications:**

```php
// في migration الإشعارات أو migration جديدة
$table->timestamp('sent_at')->nullable();
$table->timestamp('delivered_at')->nullable();
$table->timestamp('opened_at')->nullable();
$table->integer('sent_attempts')->default(0);
$table->text('last_error')->nullable();
```

#### Endpoint لقراءة الإشعار:
```php
// POST /v1/notifications/{notification}/open
public function markAsOpened(Request $request, Notification $notification)
{
    $this->authorize('view', $notification);
    
    $notification->update([
        'opened_at' => now(),
    ]);
    
    return response()->json(['message' => 'Notification marked as opened']);
}
```

---

### 7. Rate Limiting للإشعارات ❌

**المطلوب في NotificationService:**

```php
use Illuminate\Support\Facades\RateLimiter;

public function checkRateLimit(User $user, string $type = 'general'): bool
{
    $key = "notification:{$user->id}:{$type}";
    
    // Max 10 notifications per minute per type
    if (RateLimiter::tooManyAttempts($key, 10)) {
        Log::warning("Notification rate limit exceeded for user {$user->id}");
        return false;
    }
    
    RateLimiter::hit($key, 60);
    return true;
}
```

---

## 📋 خطة التنفيذ (Implementation Roadmap)

### المرحلة 1: إصلاح الأخطاء الحرجة (يوم واحد)

- [ ] **إصلاح `MessageSent` event** في `ChatService`
- [ ] **إزالة الازدواجية** في `ChatService::sendMessage()`
- [ ] **إضافة مُستمع** لـ `OrderAssignedToDriver` (اختياري)
- [ ] **إضافة مُستمع** لـ `ConversationCreated` (اختياري)

---

### المرحلة 2: نظام القوالب والأولويات (يوم واحد)

- [ ] **إنشاء `config/notification_templates.php`**
- [ ] **إنشاء `NotificationTemplateService`**
- [ ] **تحديث `NotificationService`** لدعم نظام الأولويات
- [ ] **تحديث جميع الـ Listeners** لاستخدام القوالب

---

### المرحلة 3: تفضيلات المستخدمين (يوم واحد)

- [ ] **إنشاء migration** لـ `notification_preferences`
- [ ] **إنشاء Model** `NotificationPreference`
- [ ] **إنشاء Controller** `NotificationPreferenceController`
- [ ] **إضافة Routes** جديدة
- [ ] **تحديث `NotificationService`** لاحترام التفضيلات
- [ ] **إضافة Relationship** في `User` model

---

### المرحلة 4: منع التكرار وRate Limiting (نصف يوم)

- [ ] **إنشاء migration** لـ `notification_logs`
- [ ] **إضافة منطق Deduplication** في `NotificationService`
- [ ] **إضافة Rate Limiting** في `NotificationService`

---

### المرحلة 5: دعم أجهزة Push (يومين)

- [ ] **إنشاء migration** لـ `device_tokens`
- [ ] **إنشاء Model** `DeviceToken`
- [ ] **إنشاء `PushNotificationService`**
- [ ] **إنشاء `DeviceController`**
- [ ] **إضافة Routes** لتسجيل الأجهزة
- [ ] **دمج FCM** (Firebase Cloud Messaging)

---

### المرحلة 6: تتبع الإرسادات (نصف يوم)

- [ ] **إضافة أعمدة التتبع** لجدول الإشعارات
- [ ] **إضافة endpoint** لـ `markAsOpened`
- [ ] **تحديث `NotificationService`** لتسجيل الإرسالات

---

### المرحلة 7: الاختبارات والتحسينات (يوم واحد)

- [ ] **كتابة Unit Tests** للـ NotificationService
- [ ] **كتابة Feature Tests** للـ API endpoints
- [ ] **اختبار جميع السيناريوهات** يدوياً
- [ ] **تحسين الأداء** إذا لزم الأمر

---

## 🎯 هيكل الإشعار المحدث (Notification Payload)

```json
{
  "title": "طلب جديد",
  "message": "لديك طلب جديد رقم #123",
  "type": "order_created",
  "entity_type": "order",
  "entity_id": 123,
  "action_url": "/orders/123",
  "priority": "high",
  "channels": ["in_app", "push", "whatsapp"],
  "data": {
    "order_number": "123",
    "store_name": "مطعم الشرق",
    "total": 50.00
  },
  "media_url": null,
  "media_type": null,
  "actions": [
    {
      "label": "عرض الطلب",
      "url": "/orders/123",
      "type": "primary"
    },
    {
      "label": "تجاهل",
      "url": "/orders/123/ignore",
      "type": "secondary"
    }
  ]
}
```

---

## 🔄 تدفق الإشعار المُحدّث

```
1. Event يُطلق (مثال: OrderCreated)
   ↓
2. Listener يستلم الحدث
   ↓
3. يتحقق من Rate Limiting
   ↓
4. يتحقق من Deduplication (آخر 5 دقائق)
   ↓
5. يجلب تفضيلات المستخدم
   ↓
6. يتحقق من Quiet Hours
   ↓
7. يحدد القنوات المناسبة حسب Priority + Preferences
   ↓
8. يرسل الإشعار عبر كل قناة
   ↓
9. يسجل الإرسال في notification_logs
   ↓
10. يحدث notification table (sent_at, attempts)
```

---

## 📱 التعامل مع Deep Links في Frontend

### React (Web):
```jsx
// useEffect في المكون الرئيسي
useEffect(() => {
  const handleNotificationClick = async () => {
    const notification = await getInitialNotification();
    if (notification?.data?.action_url) {
      history.push(notification.data.action_url);
    }
  };
  
  handleNotificationClick();
  
  const listener = onNotificationOpenedApp((notification) => {
    if (notification?.data?.action_url) {
      history.push(notification.data.action_url);
    }
  });
  
  return () => listener();
}, []);
```

### React Native (Mobile):
```jsx
import { Linking } from 'react-native';

// Handle deep links
Linking.addEventListener('url', (url) => {
  const route = url.url.replace('deligo://', '/');
  navigation.navigate(route);
});

// Handle notification tap
messaging().onNotificationOpenedApp(remoteMessage => {
  const { action_url } = remoteMessage.data;
  if (action_url) {
    navigation.navigate(action_url);
  }
});

// Handle when app opened from quit state
messaging().getInitialNotification().then(remoteMessage => {
  if (remoteMessage?.data?.action_url) {
    navigation.navigate(remoteMessage.data.action_url);
  }
});
```

---

## 📊 الأدوار وسيناريوهات الإشعارات

| الدور | نوع الإشعار | القنوات |
|-------|------------|---------|
| **Admin** | تسجيل متجر جديد | in_app + push + whatsapp |
| **Admin** | تسجيل سائق جديد | in_app + push + whatsapp |
| **Admin** | رسالة جديدة | in_app + push |
| **Driver** | طلب جديد متاح | in_app + push + whatsapp |
| **Driver** | تغيير حالة الطلب | in_app + push |
| **Driver** | رسالة (دردشة) | in_app + push |
| **Store** | طلب جديد | in_app + push + whatsapp |
| **Store** | تحديث حالة الطلب | in_app + push + whatsapp |
| **Store** | رسالة | in_app + push |
| **Customer** | تغيير حالة الطلب | in_app + push + whatsapp |

---

## 🔒 إعدادات الأمان

### التحقق من الصلاحيات:

```php
// في NotificationController
public function index(Request $request)
{
    // المستخدم يرى إشعاراته فقط
    $notifications = $request->user()
        ->notifications()
        ->paginate(20);
    
    return response()->json($notifications);
}

// في AdminController
public function broadcastNotification(Request $request)
{
    // فقط الأدمن يستطيع البث
    if (!$request->user()->hasRole('admin')) {
        abort(403, 'Unauthorized');
    }
    
    // ... rest of the code
}
```

### Rate Limiting في Routes:

```php
// routes/api.php
Route::middleware(['auth:sanctum', 'throttle:30,1'])
    ->group(function () {
        Route::get('/notifications', [NotificationController::class, 'index']);
        // ...
    });

Route::middleware(['auth:sanctum', 'role:admin', 'throttle:10,1'])
    ->post('/admin/notifications/broadcast', [AdminController::class, 'broadcastNotification']);
```

---

## 📝 ملاحظات هامة

1. **الواتساب مكلف**: يجب استخدامه بحذر، خاصة في البث الجماعي
2. **الإشعارات الفورية**: دائماً تُرسل عبر الأحداث (Events) لتجنب التأخير
3. **التجزئة**: كل جزء = 500 مستخدم لتجنب memory issues
4. **الـ Queue**: يجب تشغيل queue workers (`php artisan queue:work`)
5. **المراقبة**: استخدم Laravel Telescope أو Sentry لتتبع الإشعارات
6. **الاختبار**: استخدم `Notification::fake()` في الاختبارات

---

## 🚀 البدء

للبدء بالتنفيذ، أخبرني أي مرحلة تريد البدء بها، أو إذا كنت تريد تنفيذ كل شيء دفعة واحدة!

الأمر جاهز للتنفيذ! 🎯
