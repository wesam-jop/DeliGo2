<?php

namespace App\Services;

use App\Jobs\DispatchNotificationGroupJob;
use App\Jobs\RetryFailedNotificationJob;
use App\Jobs\SendBroadcastNotificationChunkJob;
use App\Models\DeviceToken;
use App\Models\NotificationGroup;
use App\Models\NotificationLog;
use App\Models\User;
use App\Services\NotificationTemplateService;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class NotificationService
{
    protected WhatsAppService $whatsapp;

    /**
     * Notification types that support smart grouping.
     */
    protected array $groupableTypes = [
        'order.created',
        'order.assigned',
        'message.received',
    ];

    /**
     * Notification types that should never be grouped (critical notifications).
     */
    protected array $nonGroupableTypes = [
        'otp',
        'system.critical',
        'order.cancelled',
    ];

    /**
     * Grouping window in minutes.
     */
    protected int $groupingWindowMinutes = 5;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    /**
     * Get ntfy base URL from environment (supports self-hosted or ntfy.sh)
     */
    protected function getNtfyBaseUrl(): string
    {
        return env('NTFY_BASE_URL', 'https://ntfy.sh');
    }

    /**
     * Send notification using a template
     *
     * @param User $user
     * @param string $templateKey Template key from notification_templates config
     * @param array $data Data to replace placeholders
     * @param array $options Additional options to override template defaults
     * @return bool
     */
    public function sendFromTemplate(User $user, string $templateKey, array $data = [], array $options = []): bool
    {
        // Resolve template
        $template = NotificationTemplateService::resolve($templateKey, $data);

        // Merge with custom options (options override template)
        $finalOptions = array_merge($template, $options);

        // Add entity info for deduplication and grouping
        $entityType = $data['entity_type'] ?? null;
        $entityId = $data['entity_id'] ?? null;

        return $this->sendToUser(
            $user,
            $template['title'],
            $template['message'],
            $finalOptions,
            $template['type'],
            $entityType,
            $entityId
        );
    }

    /**
     * Send notification to a user with deduplication, rate limiting, preferences, retry, and grouping
     *
     * @param User $user
     * @param string $title
     * @param string $message
     * @param array $options
     * @param string|null $notificationType Type for deduplication (e.g., 'order.status')
     * @param string|null $entityType Entity type for deduplication (e.g., 'order')
     * @param mixed $entityId Entity ID for deduplication (e.g., 123)
     * @return bool
     */
    public function sendToUser(
        User $user,
        string $title,
        string $message,
        array $options = [],
        ?string $notificationType = null,
        ?string $entityType = null,
        $entityId = null
    ): bool {
        // Check rate limiting
        if (!$this->checkRateLimit($user, $notificationType ?? 'general')) {
            return false;
        }

        // Check deduplication
        if ($notificationType && !$this->shouldSend($user, $notificationType, $entityType, $entityId)) {
            return false;
        }

        // Check user preferences
        $preferences = $user->notificationPreferences;
        if ($preferences && !$this->respectsPreferences($preferences, $options, $notificationType)) {
            return false;
        }

        // Handle smart grouping if applicable
        $grouped = false;
        if ($this->supportsGrouping($notificationType)) {
            $grouped = $this->handleGroupedNotification($user, $notificationType, $entityType, $entityId, $title, $message, $options);
            if ($grouped) {
                return true; // Successfully grouped
            }
        }

        $skipInApp = (bool) ($options['skip_in_app'] ?? false);
        $skipWhatsapp = (bool) ($options['skip_whatsapp'] ?? false);
        $skipNtfy = (bool) ($options['skip_ntfy'] ?? false);
        $skipPush = (bool) ($options['skip_push'] ?? false);

        $priority = $options['priority'] ?? 'medium';

        // Determine which channels to use based on priority and preferences
        $channels = $this->determineChannels($priority, $preferences, $options);

        $results = [];
        $errors = [];

        // In-app notification
        $results['in_app'] = false;
        if (!$skipInApp && in_array('in_app', $channels)) {
            $results['in_app'] = $this->storeInAppNotification($user, $title, $message, $options, $entityId);
            if (!$results['in_app']) {
                $errors['in_app'] = 'Failed to store in-app notification';
            }
        }

        // Ntfy push notification
        $results['ntfy'] = false;
        $ntfyPayload = $this->stripInternalNotificationOptions($options);
        if (!$skipNtfy && in_array('push', $channels)) {
            $topic = $user->ntfy_topic;
            if (!$topic) {
                $topic = $user->generateNtfyTopic();
            }
            $results['ntfy'] = $this->send($topic, $title, $message, $ntfyPayload);
            if (!$results['ntfy']) {
                $errors['ntfy'] = 'Failed to send ntfy notification';
            }
        }

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

        // FCM/APNs push notification
        $results['push'] = false;
        if (!$skipPush && in_array('push', $channels)) {
            $pushResult = $this->sendPushNotification($user, $title, $message, $options);
            $results['push'] = $pushResult['success'] ?? false;
            if (!$results['push'] && !empty($pushResult['error'])) {
                $errors['push'] = $pushResult['error'];
            }
        }

        $anySucceeded = in_array(true, $results);

        // Log the notification
        if ($notificationType) {
            $this->logNotification($user, $notificationType, $entityType, $entityId, $anySucceeded, $errors);
        }

        // Handle retries for failed channels
        if (!$anySucceeded && !empty($errors)) {
            $this->handleRetry($user, $title, $message, $options, $notificationType, $entityType, $entityId, $errors);
        }

        return $anySucceeded;
    }

    /**
     * Handle retry for failed notifications
     */
    protected function handleRetry(
        User $user,
        string $title,
        string $message,
        array $options,
        ?string $notificationType,
        ?string $entityType,
        $entityId,
        array $errors
    ): void {
        // Determine which channel failed (prioritize)
        $failedChannel = 'unknown';
        $lastError = '';
        
        foreach (['whatsapp', 'push', 'ntfy', 'in_app'] as $channel) {
            if (isset($errors[$channel])) {
                $failedChannel = $channel;
                $lastError = $errors[$channel];
                break;
            }
        }

        // Dispatch retry job with delay
        RetryFailedNotificationJob::dispatch(
            $user->id,
            $title,
            $message,
            $options,
            1, // First retry attempt
            $failedChannel,
            $lastError
        )->delay(now()->addSeconds(RetryFailedNotificationJob::getDelayForAttempt(1)));

        Log::channel('daily')->info('Scheduled notification retry', [
            'user_id' => $user->id,
            'type' => $notificationType,
            'failed_channel' => $failedChannel,
            'error' => $lastError,
        ]);
    }

    /**
     * Check if notification type supports grouping
     */
    protected function supportsGrouping(?string $type): bool
    {
        if (!$type) {
            return false;
        }

        // Check if explicitly groupable
        if (in_array($type, $this->groupableTypes)) {
            return true;
        }

        // Check if explicitly non-groupable
        if (in_array($type, $this->nonGroupableTypes)) {
            return false;
        }

        // Check prefix matching
        foreach ($this->groupableTypes as $groupableType) {
            if (str_starts_with($type, $groupableType)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Handle smart grouping of notifications
     */
    protected function handleGroupedNotification(
        User $user,
        string $type,
        ?string $entityType,
        $entityId,
        string $title,
        string $message,
        array $options
    ): bool {
        // Find existing active group
        $group = NotificationGroup::forUserAndType($user->id, $type, $entityType)
            ->orderByDesc('created_at')
            ->first();

        if ($group) {
            // Add to existing group
            if ($entityId) {
                $group->addEntity((int) $entityId);
            } else {
                $group->increment('count');
            }

            Log::channel('daily')->info('Notification added to group', [
                'user_id' => $user->id,
                'group_id' => $group->id,
                'count' => $group->count,
                'type' => $type,
            ]);

            return true;
        }

        // Create new group
        if ($entityId) {
            $entityIds = [(int) $entityId];
        } else {
            $entityIds = [];
        }

        NotificationGroup::create([
            'user_id' => $user->id,
            'type' => $type,
            'entity_type' => $entityType,
            'count' => 1,
            'last_entity_id' => $entityId,
            'entity_ids' => $entityIds,
            'expires_at' => now()->addMinutes($this->groupingWindowMinutes),
            'is_dispatched' => false,
            'dispatched_at' => null,
        ]);

        // Dispatch delayed job to send the group after window expires
        DispatchNotificationGroupJob::dispatch($user->id, $type, $entityType)
            ->delay(now()->addMinutes($this->groupingWindowMinutes));

        Log::channel('daily')->info('Created new notification group', [
            'user_id' => $user->id,
            'type' => $type,
            'expires_at' => now()->addMinutes($this->groupingWindowMinutes),
        ]);

        return true;
    }

    /**
     * Dispatch a notification group (called by delayed job)
     */
    public function dispatchGroupedNotification(int $userId, string $type, ?string $entityType): bool
    {
        $group = NotificationGroup::forUserAndType($userId, $type, $entityType)
            ->where('is_dispatched', false)
            ->first();

        if (!$group || $group->count === 0) {
            return false;
        }

        $user = User::find($userId);
        if (!$user) {
            return false;
        }

        // Get template for the group
        $template = NotificationTemplateService::getTemplate($type);
        $title = $template['title'] ?? 'إشعار جديد';
        
        // Generate grouped message
        if ($group->count === 1) {
            $message = $template['message'] ?? 'لديك إشعار جديد';
        } else {
            $message = str_replace('{count}', (string) $group->count, $template['grouped_message'] ?? "لديك {$group->count} إشعارات جديدة");
        }

        // Determine action URL based on count
        $actionUrl = $group->getActionUrl(
            $group->last_entity_id ? "/orders/{$group->last_entity_id}" : null,
            $entityType === 'order' ? '/orders' : '/notifications'
        );

        // Send the grouped notification
        $options = [
            'type' => $type . '.grouped',
            'priority' => $template['priority'] ?? 'medium',
            'click' => $actionUrl,
            'meta' => [
                'group_id' => $group->id,
                'group_count' => $group->count,
                'entity_ids' => $group->entity_ids,
            ],
        ];

        $success = $this->sendToUserRaw($user, $title, $message, $options);

        // Mark group as dispatched
        if ($success) {
            $group->markAsDispatched();
        }

        return $success;
    }

    /**
     * Send notification without grouping or retry logic (used internally)
     */
    protected function sendToUserRaw(User $user, string $title, string $message, array $options = []): bool
    {
        $skipInApp = (bool) ($options['skip_in_app'] ?? false);
        $skipWhatsapp = (bool) ($options['skip_whatsapp'] ?? false);
        $skipNtfy = (bool) ($options['skip_ntfy'] ?? false);
        $skipPush = (bool) ($options['skip_push'] ?? false);

        $results = [];

        // In-app
        if (!$skipInApp) {
            $results['in_app'] = $this->storeInAppNotification($user, $title, $message, $options);
        }

        // Ntfy
        if (!$skipNtfy) {
            $topic = $user->ntfy_topic ?: $user->generateNtfyTopic();
            $ntfyPayload = $this->stripInternalNotificationOptions($options);
            $results['ntfy'] = $this->send($topic, $title, $message, $ntfyPayload);
        }

        // WhatsApp
        if (!$skipWhatsapp && $user->phone) {
            $whatsappMessage = "🔔 *{$title}*\n\n{$message}";
            $whatsappResponse = $this->whatsapp->sendMessage($user->phone, $whatsappMessage);
            $results['whatsapp'] = (bool) ($whatsappResponse['success'] ?? false);
        }

        // FCM Push
        if (!$skipPush) {
            $results['push'] = $this->sendPushNotification($user, $title, $message, $options)['success'] ?? false;
        }

        return in_array(true, $results);
    }

    /**
     * Determine which channels to use based on priority and preferences
     */
    protected function determineChannels(string $priority, $preferences, array $options = []): array
    {
        $channels = [];

        // If channels are explicitly specified in options, use them
        if (!empty($options['channels'])) {
            return $options['channels'];
        }

        // Determine based on priority
        switch ($priority) {
            case 'high':
                // All channels
                if (!$preferences || $preferences->enable_in_app) {
                    $channels[] = 'in_app';
                }
                if (!$preferences || $preferences->enable_push) {
                    $channels[] = 'push';
                }
                if (!$preferences || $preferences->enable_whatsapp) {
                    $channels[] = 'whatsapp';
                }
                break;

            case 'medium':
                // Push + in_app only
                if (!$preferences || $preferences->enable_in_app) {
                    $channels[] = 'in_app';
                }
                if (!$preferences || $preferences->enable_push) {
                    $channels[] = 'push';
                }
                break;

            case 'low':
                // In_app only
                if (!$preferences || $preferences->enable_in_app) {
                    $channels[] = 'in_app';
                }
                break;

            default:
                // Default: all enabled
                if (!$preferences || $preferences->enable_in_app) {
                    $channels[] = 'in_app';
                }
                if (!$preferences || $preferences->enable_push) {
                    $channels[] = 'push';
                }
                break;
        }

        return $channels;
    }

    /**
     * Check if notification respects user preferences
     */
    protected function respectsPreferences($preferences, array $options, ?string $notificationType): bool
    {
        // Determine notification type category
        $typeCategory = 'general';
        if (str_starts_with($notificationType ?? '', 'order')) {
            $typeCategory = 'order';
        } elseif (str_starts_with($notificationType ?? '', 'message') || str_starts_with($notificationType ?? '', 'chat')) {
            $typeCategory = 'message';
        } elseif (str_starts_with($notificationType ?? '', 'broadcast') || str_starts_with($notificationType ?? '', 'marketing')) {
            $typeCategory = 'marketing';
        }

        // Check if user has disabled this type
        if ($typeCategory === 'order' && !$preferences->order_updates) {
            return false;
        }
        if ($typeCategory === 'message' && !$preferences->message_updates) {
            return false;
        }
        if ($typeCategory === 'marketing' && !$preferences->marketing_messages) {
            return false;
        }

        return true;
    }

    /**
     * Send push notification via FCM/APNs
     */
    protected function sendPushNotification(User $user, string $title, string $message, array $options = []): array
    {
        $deviceTokens = $user->deviceTokens()
            ->where('is_active', true)
            ->get();

        if ($deviceTokens->isEmpty()) {
            return ['success' => false, 'error' => 'No device tokens found'];
        }

        $success = false;
        $error = null;
        $sound = $options['sound'] ?? null;
        $silent = $options['silent'] ?? false;

        // If silent is true, disable sound
        if ($silent) {
            $sound = null;
        }

        foreach ($deviceTokens as $deviceToken) {
            try {
                $payload = [
                    'to' => $deviceToken->token,
                    'notification' => [
                        'title' => $title,
                        'body' => $message,
                        'click_action' => $options['click'] ?? $options['action_url'] ?? null,
                    ],
                    'data' => [
                        'type' => $options['type'] ?? 'notification',
                        'entity_id' => $options['meta']['order_id'] ?? $options['meta']['conversation_id'] ?? null,
                        'action_url' => $options['click'] ?? $options['action_url'] ?? null,
                        'priority' => $options['priority'] ?? 'medium',
                        'sound' => $sound ?? '',
                        'silent' => $silent ? 'true' : 'false',
                    ],
                    'priority' => ($options['priority'] ?? 'medium') === 'high' ? 'high' : 'normal',
                ];

                // Add sound if enabled
                if ($sound) {
                    $payload['notification']['sound'] = $sound;
                    $payload['data']['sound_name'] = $sound;
                }

                // FCM API call (requires FCM_SERVER_KEY in .env)
                $fcmKey = env('FCM_SERVER_KEY');
                if ($fcmKey) {
                    $response = Http::withHeaders([
                        'Authorization' => 'key=' . $fcmKey,
                        'Content-Type' => 'application/json',
                    ])->post('https://fcm.googleapis.com/fcm/send', $payload);

                    if ($response->successful()) {
                        $deviceToken->update(['last_used_at' => now()]);
                        $success = true;
                    } else {
                        $error = $response->body();
                    }
                } else {
                    $error = 'FCM_SERVER_KEY not configured';
                }
            } catch (\Exception $e) {
                $error = $e->getMessage();
                Log::channel('daily')->error('FCM push notification failed', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                    'sound' => $sound,
                    'silent' => $silent,
                ]);
            }
        }

        return ['success' => $success, 'error' => $error];
    }

    /**
     * Rate limiting check
     */
    public function checkRateLimit(User $user, string $type = 'general'): bool
    {
        $key = "notification:{$user->id}:{$type}";

        // Max 30 notifications per minute per type
        if (RateLimiter::tooManyAttempts($key, 30)) {
            Log::warning("Notification rate limit exceeded for user {$user->id}", [
                'type' => $type,
            ]);
            return false;
        }

        RateLimiter::hit($key, 60);
        return true;
    }

    /**
     * Check for duplicate notification within time window
     */
    public function shouldSend(User $user, string $type, ?string $entityType = null, $entityId = null): bool
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

    /**
     * Log a notification attempt
     */
    public function logNotification(
        User $user,
        string $type,
        ?string $entityType = null,
        $entityId = null,
        bool $success = true,
        array $errors = []
    ): void {
        try {
            NotificationLog::create([
                'user_id' => $user->id,
                'type' => $type,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'sent_at' => now(),
            ]);

            // Log error details if any
            if (!empty($errors)) {
                Log::channel('daily')->warning('Notification send failed', [
                    'user_id' => $user->id,
                    'type' => $type,
                    'errors' => $errors,
                ]);
            }
        } catch (\Exception $e) {
            Log::channel('daily')->error('Failed to log notification', [
                'user_id' => $user->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
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
            'type', 'meta', 'skip_in_app', 'skip_whatsapp', 'skip_ntfy', 'skip_push',
            'role', 'exclude_admin', 'chunk_size', 'channels', 'click', 'action_url',
            'media_url', 'media_type', 'actions', 'tags', 'priority',
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
            ])->post($this->getNtfyBaseUrl() . '/' . $topic, $payload);

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
     * Send order notification using template
     */
    public function sendOrderNotification(User $user, string $status, string $orderNumber, array $extraData = []): bool
    {
        // Use custom template for store owners receiving new orders
        $templateKey = NotificationTemplateService::getTemplateForOrderStatus($status);
        
        // Override template for store owners receiving new orders
        if (($extraData['type'] ?? '') === 'order.new_for_store') {
            $templateKey = 'order_new_for_store';
        }

        $data = [
            'order_id' => $orderNumber,
            'entity_type' => $extraData['entity_type'] ?? 'order',
            'entity_id' => $extraData['meta']['order_id'] ?? $extraData['entity_id'] ?? null,
        ];

        return $this->sendFromTemplate($user, $templateKey, $data, $extraData);
    }

    /**
     * Send chat message notification
     */
    public function sendChatNotification(User $recipient, string $senderName, string $messageContent, int $conversationId, array $extraOptions = []): bool
    {
        $templateKey = 'message_received';
        
        // Use order_message template for order messages
        if (($extraOptions['type'] ?? '') === 'order.message') {
            $templateKey = 'order_message';
        }

        $data = [
            'sender_name' => $senderName,
            'conversation_id' => $conversationId,
            'entity_type' => $extraOptions['entity_type'] ?? 'conversation',
            'entity_id' => $extraOptions['entity_id'] ?? $conversationId,
        ];

        $options = array_merge([
            'message' => "{$senderName}: " . substr($messageContent, 0, 100),
            'meta' => [
                'conversation_id' => $conversationId,
            ],
        ], $extraOptions);

        return $this->sendFromTemplate(
            $recipient,
            $templateKey,
            $data,
            $options
        );
    }

    /**
     * Send driver assignment notification
     */
    public function sendDriverAssignmentNotification(User $driver, string $orderNumber, string $pickupLocation, string $deliveryLocation): bool
    {
        return $this->sendToUser(
            $driver,
            '🚗 طلب جديد متاح',
            "طلب رقم {$orderNumber}\nالاستلام: {$pickupLocation}\nالتوصيل: {$deliveryLocation}",
            [
                'type' => 'order.assigned',
                'priority' => 'high',
                'click' => url("/orders/{$orderNumber}"),
                'meta' => [
                    'order_number' => $orderNumber,
                ],
            ]
        );
    }

    /**
     * Send new order notification to drivers in area
     */
    public function sendNewOrderToDrivers(string $topic, string $orderNumber, string $location, float $total): bool
    {
        return $this->send(
            $topic,
            '📦 طلب جديد متاح',
            "طلب رقم {$orderNumber}\nالموقع: {$location}\nالإجمالي: {$total}",
            [
                'priority' => 4,
            ]
        );
    }

    /**
     * Persist notification for in-app inbox with enhanced tracking and grouping support.
     */
    protected function storeInAppNotification(User $user, string $title, string $message, array $options = [], $entityId = null): bool
    {
        try {
            DB::table('notifications')->insert([
                'id' => (string) Str::uuid(),
                'type' => $options['type'] ?? 'app.system',
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'data' => json_encode([
                    'title' => $title,
                    'message' => $message,
                    'priority' => $options['priority'] ?? 3,
                    'click' => $options['click'] ?? $options['action_url'] ?? null,
                    'action_url' => $options['action_url'] ?? $options['click'] ?? null,
                    'media_url' => $options['media_url'] ?? null,
                    'media_type' => $options['media_type'] ?? null,
                    'meta' => $options['meta'] ?? [],
                    'actions' => $options['actions'] ?? null,
                    'channels' => $options['channels'] ?? ['in_app'],
                ], JSON_UNESCAPED_UNICODE),
                'read_at' => null,
                'sent_at' => now(),
                'sent_attempts' => 1,
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
