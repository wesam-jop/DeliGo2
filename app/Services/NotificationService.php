<?php

namespace App\Services;

use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Ntfy base URL
     */
    const BASE_URL = 'https://ntfy.sh';

    protected WhatsAppService $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    /**
     * Send notification to a user
     *
     * @param User $user
     * @param string $title
     * @param string $message
     * @param array $options
     * @return bool
     */
    public function sendToUser(User $user, string $title, string $message, array $options = []): bool
    {
        $inAppSaved = $this->storeInAppNotification($user, $title, $message, $options);
        $topic = $user->ntfy_topic;

        if (!$topic) {
            $topic = $user->generateNtfyTopic();
        }

        $whatsappSent = false;

        // Send WhatsApp notification
        if ($user->phone) {
            $whatsappMessage = "🔔 *{$title}*\n\n{$message}";
            $whatsappResponse = $this->whatsapp->sendMessage($user->phone, $whatsappMessage);
            $whatsappSent = (bool) ($whatsappResponse['success'] ?? false);
        }

        $ntfySent = $this->send($topic, $title, $message, $options);

        return $inAppSaved || $ntfySent || $whatsappSent;
    }

    /**
     * Send notification to multiple users
     *
     * @param array $users
     * @param string $title
     * @param string $message
     * @param array $options
     * @return array
     */
    public function sendToUsers(array $users, string $title, string $message, array $options = []): array
    {
        $results = [];

        foreach ($users as $user) {
            $results[$user->id] = $this->sendToUser($user, $title, $message, $options);
        }

        return $results;
    }

    /**
     * Send notification to a topic
     *
     * @param string $topic
     * @param string $title
     * @param string $message
     * @param array $options
     * @return bool
     */
    public function send(string $topic, string $title, string $message, array $options = []): bool
    {
        try {
            $payload = array_merge([
                'title' => $title,
                'message' => $message,
            ], $options);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post(self::BASE_URL . '/' . $topic, $payload);

            if ($response->successful()) {
                Log::channel('daily')->info('Notification sent', [
                    'topic' => $topic,
                    'title' => $title,
                    'message' => substr($message, 0, 50),
                ]);
                return true;
            }

            Log::channel('daily')->error('Notification failed', [
                'topic' => $topic,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::channel('daily')->error('Notification exception', [
                'topic' => $topic,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send order notification
     *
     * @param User $user
     * @param string $status
     * @param string $orderNumber
     * @param array $extraData
     * @return bool
     */
    public function sendOrderNotification(User $user, string $status, string $orderNumber, array $extraData = []): bool
    {
        $titles = [
            'pending' => '📦 طلب جديد',
            'accepted_by_driver' => '✅ تم قبول الطلب',
            'preparing' => '👨‍🍳 جاري التجهيز',
            'ready' => '🔔 الطلب جاهز',
            'picked_up' => '🚚 في الطريق إليك',
            'delivered' => '🎉 تم التسليم',
            'cancelled' => '❌ تم الإلغاء',
        ];

        $messages = [
            'pending' => "طلبك رقم {$orderNumber} بانتظار السائق.",
            'accepted_by_driver' => "تم قبول طلبك رقم {$orderNumber} من قبل السائق.",
            'preparing' => "المتجر يقوم بتجهيز طلبك رقم {$orderNumber} الآن.",
            'ready' => "طلبك رقم {$orderNumber} جاهز وبانتظار الاستلام.",
            'picked_up' => "طلبك رقم {$orderNumber} في الطريق إليك الآن!",
            'delivered' => "تم تسليم طلبك رقم {$orderNumber} بنجاح. بالهناء والشفاء!",
            'cancelled' => "تم إلغاء طلبك رقم {$orderNumber}.",
        ];

        $title = $titles[$status] ?? '📦 Order Update';
        $message = $messages[$status] ?? "Order {$orderNumber} status updated to {$status}.";

        $baseOptions = [
            'type' => 'order.status',
            'click' => url("/orders/{$orderNumber}"),
        ];

        return $this->sendToUser($user, $title, $message, array_merge($baseOptions, $extraData));
    }

    /**
     * Send chat message notification
     *
     * @param User $recipient
     * @param string $senderName
     * @param string $messageContent
     * @param int $conversationId
     * @return bool
     */
    public function sendChatNotification(User $recipient, string $senderName, string $messageContent, int $conversationId): bool
    {
        return $this->sendToUser(
            $recipient,
            '💬 رسالة جديدة',
            "{$senderName}: " . substr($messageContent, 0, 100),
            [
                'type' => 'chat.message',
                'click' => url("/conversations/{$conversationId}"),
                'priority' => 5,
                'meta' => [
                    'conversation_id' => $conversationId,
                ],
            ]
        );
    }

    /**
     * Send driver assignment notification
     *
     * @param User $driver
     * @param string $orderNumber
     * @param string $pickupLocation
     * @param string $deliveryLocation
     * @return bool
     */
    public function sendDriverAssignmentNotification(User $driver, string $orderNumber, string $pickupLocation, string $deliveryLocation): bool
    {
        return $this->sendToUser(
            $driver,
            '🚗 New Order Available',
            "Order {$orderNumber}\nPickup: {$pickupLocation}\nDelivery: {$deliveryLocation}",
            [
                'priority' => 5,
                'actions' => json_encode([
                    [
                        'action' => 'view',
                        'label' => 'View Order',
                        'uri' => url("/orders/{$orderNumber}"),
                    ]
                ]),
            ]
        );
    }

    /**
     * Send new order notification to drivers in area
     *
     * @param string $topic
     * @param string $orderNumber
     * @param string $location
     * @param float $total
     * @return bool
     */
    public function sendNewOrderToDrivers(string $topic, string $orderNumber, string $location, float $total): bool
    {
        return $this->send(
            $topic,
            '📦 New Order Available',
            "Order {$orderNumber}\nLocation: {$location}\nTotal: \${$total}",
            [
                'priority' => 4,
            ]
        );
    }

    /**
     * Persist notification for in-app inbox.
     */
    protected function storeInAppNotification(User $user, string $title, string $message, array $options = []): bool
    {
        try {
            DB::table('notifications')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'type' => $options['type'] ?? 'app.system',
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'data' => json_encode([
                    'title' => $title,
                    'message' => $message,
                    'priority' => $options['priority'] ?? 3,
                    'click' => $options['click'] ?? null,
                    'meta' => $options['meta'] ?? [],
                ], JSON_UNESCAPED_UNICODE),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::channel('daily')->error('Failed to store in-app notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
