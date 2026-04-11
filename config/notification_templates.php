<?php

/**
 * Notification Templates Configuration
 * 
 * Centralized templates for all notification types.
 * Each template supports:
 * - title: Notification title (supports placeholders like {order_id})
 * - message: Notification message body
 * - action_url: Deep link URL for the notification
 * - priority: high, medium, low
 * - type: Notification type identifier
 * - channels: Default channels to use (in_app, push, whatsapp)
 * - sound: Sound file to play (null for silent)
 * - silent: Whether this is a silent notification (no sound/vibration)
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Order Notifications
    |--------------------------------------------------------------------------
    */

    'order_created' => [
        'title' => '📦 طلب جديد',
        'message' => 'لديك طلب جديد رقم #{order_id}',
        'grouped_message' => 'لديك {count} طلبات جديدة',
        'action_url' => '/orders/{order_id}',
        'group_action_url' => '/orders',
        'priority' => 'high',
        'type' => 'order.created',
        'channels' => ['in_app', 'push', 'whatsapp'],
        'sound' => 'order_new.mp3',
        'silent' => false,
    ],

    'order_accepted' => [
        'title' => '✅ تم قبول طلبك',
        'message' => 'تم قبول طلبك رقم #{order_id} من قبل {driver_name}. سيتم تحضيره وتوصيله قريباً.',
        'action_url' => '/orders/{order_id}',
        'priority' => 'high',
        'type' => 'order.accepted',
        'channels' => ['in_app', 'push', 'whatsapp'],
    ],

    'order_confirmed' => [
        'title' => '👍 تم تأكيد طلبك',
        'message' => 'تم تأكيد طلبك رقم #{order_id} من قبل المتجر. نحن الآن بصدد تجهيزه.',
        'action_url' => '/orders/{order_id}',
        'priority' => 'medium',
        'type' => 'order.confirmed',
        'channels' => ['in_app', 'push', 'whatsapp'],
    ],

    'order_preparing' => [
        'title' => '👨‍🍳 جاري تحضير طلبك',
        'message' => 'يتم الآن تحضير طلبك رقم #{order_id} في المتجر.',
        'action_url' => '/orders/{order_id}',
        'priority' => 'medium',
        'type' => 'order.preparing',
        'channels' => ['in_app', 'push'],
    ],

    'order_ready' => [
        'title' => '🔔 طلبك جاهز',
        'message' => 'طلبك رقم #{order_id} جاهز الآن للاستلام والتوصيل.',
        'action_url' => '/orders/{order_id}',
        'priority' => 'high',
        'type' => 'order.ready',
        'channels' => ['in_app', 'push', 'whatsapp'],
    ],

    'order_picked_up' => [
        'title' => '🚚 في الطريق إليك',
        'message' => 'استلم السائق طلبك رقم #{order_id} وهو في الطريق إليك الآن.',
        'action_url' => '/orders/{order_id}',
        'priority' => 'high',
        'type' => 'order.picked_up',
        'channels' => ['in_app', 'push', 'whatsapp'],
    ],

    'order_delivered' => [
        'title' => '🎉 تم توصيل طلبك',
        'message' => 'تم توصيل طلبك رقم #{order_id} بنجاح. شهية طيبة!',
        'action_url' => '/orders/{order_id}',
        'priority' => 'medium',
        'type' => 'order.delivered',
        'channels' => ['in_app', 'push', 'whatsapp'],
    ],

    'order_cancelled' => [
        'title' => '❌ تم إلغاء طلبك',
        'message' => 'تم إلغاء طلبك رقم #{order_id}. نعتذر عن ذلك.',
        'action_url' => '/orders/{order_id}',
        'priority' => 'high',
        'type' => 'order.cancelled',
        'channels' => ['in_app', 'push', 'whatsapp'],
    ],

    'order_assigned_to_driver' => [
        'title' => '🚗 طلب جديد مُخصص لك',
        'message' => 'لديك طلب جديد رقم #{order_id} بانتظارك.',
        'action_url' => '/orders/{order_id}',
        'priority' => 'high',
        'type' => 'order.assigned',
        'channels' => ['in_app', 'push', 'whatsapp'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Chat/Message Notifications
    |--------------------------------------------------------------------------
    */

    'message_received' => [
        'title' => '💬 رسالة جديدة',
        'message' => 'رسالة جديدة من {sender_name}',
        'action_url' => '/chat/{conversation_id}',
        'priority' => 'medium',
        'type' => 'message.received',
        'channels' => ['in_app', 'push'],
        'sound' => 'message.mp3',
        'silent' => false,
    ],

    'conversation_created' => [
        'title' => '💬 محادثة جديدة',
        'message' => 'تم إنشاء محادثة جديدة مع {creator_name}',
        'action_url' => '/chat/{conversation_id}',
        'priority' => 'medium',
        'type' => 'conversation.created',
        'channels' => ['in_app', 'push'],
        'sound' => 'message.mp3',
        'silent' => false,
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin Notifications
    |--------------------------------------------------------------------------
    */

    'new_store_registered' => [
        'title' => '🏪 متجر جديد مسجل',
        'message' => 'تم تسجيل متجر جديد: {store_name}',
        'action_url' => '/stores/{store_id}',
        'priority' => 'medium',
        'type' => 'store.registered',
        'channels' => ['in_app', 'push'],
    ],

    'new_driver_registered' => [
        'title' => '🚚 سائق جديد مسجل',
        'message' => 'تم تسجيل سائق جديد: {driver_name}',
        'action_url' => '/drivers/{driver_id}',
        'priority' => 'medium',
        'type' => 'driver.registered',
        'channels' => ['in_app', 'push'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Broadcast/Marketing Notifications
    |--------------------------------------------------------------------------
    */

    'broadcast' => [
        'title' => '{title}',
        'message' => '{message}',
        'action_url' => '{action_url}',
        'priority' => 'medium',
        'type' => 'broadcast',
        'channels' => ['in_app', 'push'],
    ],

    'scheduled_broadcast' => [
        'title' => '{title}',
        'message' => '{message}',
        'action_url' => null,
        'priority' => 'low',
        'type' => 'broadcast.scheduled',
        'channels' => ['in_app', 'push'],
    ],

    /*
    |--------------------------------------------------------------------------
    | System Notifications
    |--------------------------------------------------------------------------
    */

    'test' => [
        'title' => '🧪 إشعار تجريبي',
        'message' => 'هذا إشعار تجريبي لاختبار النظام.',
        'action_url' => null,
        'priority' => 'low',
        'type' => 'system.test',
        'channels' => ['in_app'],
    ],

    'system' => [
        'title' => '{title}',
        'message' => '{message}',
        'action_url' => '{action_url}',
        'priority' => 'medium',
        'type' => 'system',
        'channels' => ['in_app'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Fallback
    |--------------------------------------------------------------------------
    */

    'default' => [
        'title' => '{title}',
        'message' => '{message}',
        'action_url' => '{action_url}',
        'priority' => 'medium',
        'type' => 'app.system',
        'channels' => ['in_app'],
    ],
];
