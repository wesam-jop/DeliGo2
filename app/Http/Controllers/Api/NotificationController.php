<?php

namespace App\Http\Controllers\Api;

use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Http\Request;

class NotificationController extends ApiController
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Get user's notification topic
     */
    public function getTopic(Request $request): JsonResponse
    {
        $user = $request->user();

        $topic = $user->ntfy_topic;

        if (!$topic) {
            $topic = $user->generateNtfyTopic();
        }

        return $this->success([
            'topic' => $topic,
            'subscribe_url' => "https://ntfy.sh/{$topic}/json",
        ]);
    }

    /**
     * Update notification topic
     */
    public function updateTopic(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_-]+$/'],
        ]);

        $request->user()->update([
            'ntfy_topic' => $validated['topic'],
        ]);

        return $this->success([
            'topic' => $validated['topic'],
        ], 'Notification topic updated successfully');
    }

    /**
     * Send test notification
     */
    public function sendTest(Request $request): JsonResponse
    {
        $user = $request->user();

        $success = $this->notificationService->sendToUser(
            $user,
            '🧪 Test Notification',
            'This is a test notification from the Food Delivery API!',
            [
                'priority' => 3,
            ]
        );

        if ($success) {
            return $this->success(null, 'Test notification sent successfully');
        }

        return $this->error('Failed to send test notification', 500);
    }

    /**
     * Get notification settings
     */
    public function getSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        $preferences = $user->notificationPreferences;

        return $this->success([
            'topic' => $user->ntfy_topic,
            'notifications_enabled' => $user->ntfy_topic !== null,
            'preferences' => [
                'channels' => [
                    'in_app' => $preferences->enable_in_app,
                    'push' => $preferences->enable_push,
                    'whatsapp' => $preferences->enable_whatsapp,
                ],
                'types' => [
                    'order_updates' => $preferences->order_updates,
                    'message_updates' => $preferences->message_updates,
                    'marketing_messages' => $preferences->marketing_messages,
                ],
                'quiet_hours' => $preferences->getQuietHoursFormatted(),
            ],
        ]);
    }

    /**
     * Mark a notification as opened.
     *
     * POST /api/v1/notifications/{notification}/open
     */
    public function markAsOpened(Request $request, string $notification): JsonResponse
    {
        /** @var DatabaseNotification|null $notificationModel */
        $notificationModel = $request->user()
            ->notifications()
            ->where('id', $notification)
            ->first();

        if (!$notificationModel) {
            return $this->error('Notification not found', 404);
        }

        // Update opened_at timestamp
        $data = json_decode($notificationModel->data, true);
        $data['opened_at'] = now()->toIso8601String();
        
        $notificationModel->forceFill([
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'opened_at' => now(),
        ])->save();

        // Also mark as read if not already
        if ($notificationModel->read_at === null) {
            $notificationModel->markAsRead();
        }

        return $this->success(null, 'Notification marked as opened');
    }

    /**
     * Get notification analytics for user.
     *
     * GET /api/v1/notifications/analytics
     */
    public function analytics(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $totalNotifications = $user->notifications()->count();
        $unreadNotifications = $user->unreadNotifications()->count();
        $openedNotifications = $user->notifications()
            ->whereNotNull('opened_at')
            ->count();

        $openRate = $totalNotifications > 0 
            ? round(($openedNotifications / $totalNotifications) * 100, 2) 
            : 0;

        return $this->success([
            'total' => $totalNotifications,
            'unread' => $unreadNotifications,
            'opened' => $openedNotifications,
            'open_rate' => $openRate,
        ]);
    }

    /**
     * List user notifications (in-app inbox)
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'unread_only' => ['nullable', 'boolean'],
        ]);

        $query = $request->user()->notifications()->latest();

        if (($validated['unread_only'] ?? false) === true) {
            $query->whereNull('read_at');
        }

        $notifications = $query->paginate($validated['per_page'] ?? 20);

        return $this->success($notifications);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return $this->success([
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        /** @var DatabaseNotification|null $notificationModel */
        $notificationModel = $request->user()
            ->notifications()
            ->where('id', $notification)
            ->first();

        if (!$notificationModel) {
            return $this->error('Notification not found', 404);
        }

        if ($notificationModel->read_at === null) {
            $notificationModel->markAsRead();
        }

        return $this->success(null, 'Notification marked as read');
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->success(null, 'All notifications marked as read');
    }
}
