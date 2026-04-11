<?php

namespace App\Services;

use App\Jobs\SendBroadcastNotificationChunkJob;
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
        $skipInApp = (bool) ($options['skip_in_app'] ?? false);
        $skipWhatsapp = (bool) ($options['skip_whatsapp'] ?? false);
        $skipNtfy = (bool) ($options['skip_ntfy'] ?? false);

        $inAppSaved = $skipInApp
            ? false
            : $this->storeInAppNotification($user, $title, $message, $options);

        $ntfyPayload = $this->stripInternalNotificationOptions($options);

        $ntfySent = false;
        if (!$skipNtfy) {
            $topic = $user->ntfy_topic;
            if (!$topic) {
                $topic = $user->generateNtfyTopic();
            }
            $ntfySent = $this->send($topic, $title, $message, $ntfyPayload);
        }

        $whatsappSent = false;
        if (!$skipWhatsapp && $user->phone) {
            $whatsappMessage = "🔔 *{$title}*\n\n{$message}";
            $whatsappResponse = $this->whatsapp->sendMessage($user->phone, $whatsappMessage);
            $whatsappSent = (bool) ($whatsappResponse['success'] ?? false);
        }

        return $inAppSaved || $ntfySent || $whatsappSent;
    }

    /**
     * Queue broadcast notifications in chunks (for large audiences).
     *
     * @param  array<string, mixed>  $options  role, exclude_admin, chunk_size, skip_whatsapp, skip_ntfy, meta, click, priority
     * @return int Number of queued chunk jobs
     */
    public function queueBroadcastToUsers(string $title, string $message, array $options = []): int
    {
        $chunkSize = (int) ($options['chunk_size'] ?? config('broadcast_reminders.chunk_size', 500));
        $excludeAdmin = (bool) ($options['exclude_admin'] ?? true);

        $query = User::query()->orderBy('id');

        if ($excludeAdmin) {
            $query->where('role', '!=', 'admin');
        }

        if (!empty($options['role'])) {
            $query->where('role', $options['role']);
        }

        $sendOptions = array_merge([
            'type' => 'broadcast',
            'skip_whatsapp' => true,
            'skip_ntfy' => false,
        ], $options);

        unset($sendOptions['role'], $sendOptions['exclude_admin'], $sendOptions['chunk_size']);

        $chunks = 0;

        $query->chunkById($chunkSize, function ($users) use ($title, $message, $sendOptions, &$chunks) {
            SendBroadcastNotificationChunkJob::dispatch(
                $users->pluck('id')->all(),
                $title,
                $message,
                $sendOptions
            );
            $chunks++;
        });

        return $chunks;
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    protected function stripInternalNotificationOptions(array $options): array
    {
        $internal = [
            'type', 'meta', 'skip_in_app', 'skip_whatsapp', 'skip_ntfy',
            'role', 'exclude_admin', 'chunk_size',
        ];

        return array_diff_key($options, array_flip($internal));
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
