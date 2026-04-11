# 📱 دليل الإشعارات - Frontend Integration Guide

---

## 🚀 Quick Start

### 1. تسجيل الجهاز للإشعارات (Mobile App)

```javascript
// عند تسجيل الدخول أو بدء التطبيق
async function registerDevice(token, deviceType, deviceName) {
  const response = await fetch('/api/v1/devices/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      token: token, // FCM/APNs token
      device_type: deviceType, // 'ios', 'android', or 'web'
      device_name: deviceName, // e.g., 'iPhone 13 Pro'
    }),
  });
  
  return await response.json();
}
```

### 2. جلب الإشعارات

```javascript
// جلب قائمة الإشعارات
async function getNotifications(page = 1, unreadOnly = false) {
  const response = await fetch(
    `/api/v1/notifications?page=${page}&unread_only=${unreadOnly}`,
    {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    }
  );
  
  const data = await response.json();
  return data.data; // Contains paginated notifications
}

// جلب عدد الإشعارات غير المقروءة
async function getUnreadCount() {
  const response = await fetch('/api/v1/notifications/unread-count', {
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });
  
  const data = await response.json();
  return data.data.unread_count;
}
```

### 3. وضع إشعار كمقروء/مفتوح

```javascript
// وضع إشعار كمقروء
async function markAsRead(notificationId) {
  const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });
  
  return await response.json();
}

// وضع إشعار كمفتوح (عندما يضغط عليه المستخدم)
async function markAsOpened(notificationId) {
  const response = await fetch(`/api/v1/notifications/${notificationId}/open`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });
  
  return await response.json();
}

// وضع كل الإشعارات كمقروءة
async function markAllAsRead() {
  const response = await fetch('/api/v1/notifications/mark-all-read', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });
  
  return await response.json();
}
```

---

## 🎯 Deep Linking Handling

### React (Web):

```jsx
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

function NotificationHandler() {
  const history = useHistory();

  useEffect(() => {
    // Handle notification click
    const handleNotificationClick = async (notification) => {
      const actionUrl = notification.data?.click || notification.data?.action_url;
      
      if (actionUrl) {
        // Navigate to the URL
        history.push(actionUrl);
        
        // Mark as opened
        await markAsOpened(notification.id);
      }
    };

    // Listen for notification clicks
    // Implementation depends on your push notification library
    
    return () => {
      // Cleanup listener
    };
  }, []);

  return null;
}
```

### React Native (Mobile):

```jsx
import { useEffect } from 'react';
import { Linking } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';

function NotificationHandler() {
  const navigation = useNavigation();

  useEffect(() => {
    // Handle deep links
    const handleDeepLink = (url) => {
      const route = url.replace('deligo://', '/');
      navigation.navigate(route);
    };

    // Listen for deep links
    Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Handle notification tap (app in background)
    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      async (remoteMessage) => {
        const actionUrl = remoteMessage.data?.action_url;
        if (actionUrl) {
          navigation.navigate(actionUrl);
          
          // Mark as opened (call API if you have notification ID)
          if (remoteMessage.data?.notification_id) {
            await markAsOpened(remoteMessage.data.notification_id);
          }
        }
      }
    );

    // Handle notification tap (app opened from quit state)
    messaging()
      .getInitialNotification()then(async (remoteMessage) => {
        if (remoteMessage?.data?.action_url) {
          navigation.navigate(remoteMessage.data.action_url);
          
          if (remoteMessage.data?.notification_id) {
            await markAsOpened(remoteMessage.data.notification_id);
          }
        }
      });

    return () => {
      unsubscribeOpened();
    };
  }, []);

  return null;
}
```

---

## ⚙️ إدارة تفضيلات الإشعارات

### جلب التفضيلات:

```javascript
async function getNotificationPreferences() {
  const response = await fetch('/api/v1/notifications/preferences', {
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });
  
  const data = await response.json();
  return data.data;
}

// Example response:
{
  "success": true,
  "data": {
    "channels": {
      "in_app": true,
      "push": true,
      "whatsapp": true
    },
    "types": {
      "order_updates": true,
      "message_updates": true,
      "marketing_messages": false
    },
    "quiet_hours": {
      "start": "22:00",
      "end": "08:00",
      "enabled": true
    }
  }
}
```

### تحديث التفضيلات:

```javascript
async function updateNotificationPreferences(preferences) {
  const response = await fetch('/api/v1/notifications/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify(preferences),
  });
  
  return await response.json();
}

// Example usage:
await updateNotificationPreferences({
  channels: {
    in_app: true,
    push: true,
    whatsapp: false, // Disable WhatsApp notifications
  },
  types: {
    order_updates: true,
    message_updates: true,
    marketing_messages: false,
  },
  quiet_hours: {
    start: '22:00',
    end: '08:00',
    enabled: true,
  },
});
```

### إعادة تعيين التفضيلات:

```javascript
async function resetNotificationPreferences() {
  const response = await fetch('/api/v1/notifications/preferences/reset', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });
  
  return await response.json();
}
```

---

## 📊 Analytics

### جلب إحصائيات الإشعارات:

```javascript
async function getNotificationAnalytics() {
  const response = await fetch('/api/v1/notifications/analytics', {
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });
  
  const data = await response.json();
  return data.data;
}

// Example response:
{
  "total": 150,
  "unread": 12,
  "opened": 98,
  "open_rate": 65.33
}
```

---

## 🎨 UI Example: Notification Badge

```jsx
import { useState, useEffect } from 'react';

function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread count
    const fetchUnreadCount = async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
    };

    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (unreadCount === 0) return null;

  return (
    <div className="notification-badge">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
}
```

---

## 📋 Notification Data Structure

### Example Notification Object:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "order.status",
  "notifiable_type": "App\\Models\\User",
  "notifiable_id": 123,
  "data": {
    "title": "✅ تم قبول طلبك",
    "message": "تم قبول طلبك رقم #12345 من قبل أحمد. سيتم تحضيره وتوصيله قريباً.",
    "priority": "high",
    "click": "/orders/12345",
    "action_url": "/orders/12345",
    "media_url": null,
    "media_type": null,
    "meta": {
      "order_id": 12345,
      "status": "accepted"
    },
    "actions": [
      {
        "label": "عرض الطلب",
        "url": "/orders/12345",
        "type": "primary"
      }
    ],
    "opened_at": "2026-04-11T15:30:00.000Z"
  },
  "read_at": "2026-04-11T15:30:00.000Z",
  "sent_at": "2026-04-11T15:29:45.000Z",
  "delivered_at": "2026-04-11T15:29:46.000Z",
  "opened_at": "2026-04-11T15:30:00.000Z",
  "created_at": "2026-04-11T15:29:45.000Z",
  "updated_at": "2026-04-11T15:30:00.000Z"
}
```

---

## 🔔 Push Notification Setup (FCM)

### 1. Add FCM to `.env`:

```env
FCM_SERVER_KEY=your_firebase_server_key_here
```

### 2. Mobile App - Get FCM Token:

```javascript
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}

async function getFCMToken() {
  await requestUserPermission();
  const token = await messaging().getToken();
  return token;
}

// Register token with backend
async function registerDeviceWithBackend() {
  const token = await getFCMToken();
  
  await fetch('/api/v1/devices/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      token: token,
      device_type: 'android', // or 'ios'
      device_name: await Device.getDeviceName(),
    }),
  });
}
```

---

## 🎨 UI Example: Notification Preferences Screen

```jsx
import { useState, useEffect } from 'react';

function NotificationPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const data = await getNotificationPreferences();
    setPreferences(data);
    setLoading(false);
  };

  const handleToggle = async (key, value) => {
    const updated = {
      ...preferences,
      [key]: value,
    };
    setPreferences(updated);
    
    await updateNotificationPreferences(updated);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="notification-preferences">
      <h2>إعدادات الإشعارات</h2>
      
      {/* Channels */}
      <div className="section">
        <h3>قنوات الإشعارات</h3>
        
        <label>
          <input
            type="checkbox"
            checked={preferences.channels.in_app}
            onChange={(e) =>
              handleToggle('channels', {
                ...preferences.channels,
                in_app: e.target.checked,
              })
            }
          />
          إشعارات داخل التطبيق
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={preferences.channels.push}
            onChange={(e) =>
              handleToggle('channels', {
                ...preferences.channels,
                push: e.target.checked,
              })
            }
          />
          إشعارات Push
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={preferences.channels.whatsapp}
            onChange={(e) =>
              handleToggle('channels', {
                ...preferences.channels,
                whatsapp: e.target.checked,
              })
            }
          />
          واتساب
        </label>
      </div>
      
      {/* Types */}
      <div className="section">
        <h3>أنواع الإشعارات</h3>
        
        <label>
          <input
            type="checkbox"
            checked={preferences.types.order_updates}
            onChange={(e) =>
              handleToggle('types', {
                ...preferences.types,
                order_updates: e.target.checked,
              })
            }
          />
          تحديثات الطلبات
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={preferences.types.message_updates}
            onChange={(e) =>
              handleToggle('types', {
                ...preferences.types,
                message_updates: e.target.checked,
              })
            }
          />
          الرسائل
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={preferences.types.marketing_messages}
            onChange={(e) =>
              handleToggle('types', {
                ...preferences.types,
                marketing_messages: e.target.checked,
              })
            }
          />
          العروض والتسويق
        </label>
      </div>
      
      {/* Quiet Hours */}
      <div className="section">
        <h3>ساعات الهدوء</h3>
        
        <label>
          <input
            type="checkbox"
            checked={preferences.quiet_hours?.enabled}
            onChange={(e) =>
              handleToggle('quiet_hours', {
                ...preferences.quiet_hours,
                enabled: e.target.checked,
              })
            }
          />
          تفعيل ساعات الهدوء
        </label>
        
        {preferences.quiet_hours?.enabled && (
          <div className="quiet-hours">
            <input
              type="time"
              value={preferences.quiet_hours.start}
              onChange={(e) =>
                handleToggle('quiet_hours', {
                  ...preferences.quiet_hours,
                  start: e.target.value,
                })
              }
            />
            <span>إلى</span>
            <input
              type="time"
              value={preferences.quiet_hours.end}
              onChange={(e) =>
                handleToggle('quiet_hours', {
                  ...preferences.quiet_hours,
                  end: e.target.value,
                })
              }
            />
          </div>
        )}
      </div>
      
      <button onClick={() => resetNotificationPreferences()}>
        إعادة تعيين للإعدادات الافتراضية
      </button>
    </div>
  );
}
```

---

## 📝 Full API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/notifications` | Get paginated notifications | ✅ |
| GET | `/api/v1/notifications/unread-count` | Get unread count | ✅ |
| POST | `/api/v1/notifications/{id}/read` | Mark as read | ✅ |
| POST | `/api/v1/notifications/{id}/open` | Mark as opened | ✅ |
| POST | `/api/v1/notifications/mark-all-read` | Mark all as read | ✅ |
| GET | `/api/v1/notifications/analytics` | Get analytics | ✅ |
| GET | `/api/v1/notifications/preferences` | Get preferences | ✅ |
| PUT | `/api/v1/notifications/preferences` | Update preferences | ✅ |
| POST | `/api/v1/notifications/preferences/reset` | Reset preferences | ✅ |
| GET | `/api/v1/devices` | Get registered devices | ✅ |
| POST | `/api/v1/devices/register` | Register device token | ✅ |
| POST | `/api/v1/devices/unregister` | Unregister device | ✅ |
| POST | `/api/v1/devices/unregister-all` | Unregister all devices | ✅ |

---

## 🎯 Best Practices

1. **Register device on login**: Always register the device token after user logs in
2. **Unregister on logout**: Remove device token when user logs out
3. **Poll for updates**: Check unread count every 30-60 seconds
4. **Handle deep links**: Always navigate to `action_url` on notification tap
5. **Mark as opened**: Call `/open` endpoint when user taps notification
6. **Respect preferences**: Use preferences to show/hide notification options in UI
7. **Error handling**: Handle API errors gracefully and retry if needed

---

## 🔧 Troubleshooting

### Notifications not received?

1. Check if device token is registered: `GET /api/v1/devices`
2. Verify user preferences: `GET /api/v1/notifications/preferences`
3. Check quiet hours are not active
4. Verify FCM_SERVER_KEY is set in `.env`

### Deep links not working?

1. Ensure `action_url` is present in notification data
2. Check URL format (should start with `/`)
3. Verify navigation setup in your app

### WhatsApp not working?

1. Check if user has phone number
2. Verify `ULTRAMSG_INSTANCE_ID` and `ULTRAMSG_TOKEN` in `.env`
3. Check WhatsApp service logs

---

## 📚 Additional Resources

- [Notification System Summary](./NOTIFICATION_SYSTEM_SUMMARY.md)
- [Notification System Plan](./NOTIFICATION_SYSTEM_PLAN.md)
