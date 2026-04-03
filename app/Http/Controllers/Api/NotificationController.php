<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
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

        return $this->success([
            'topic' => $user->ntfy_topic,
            'notifications_enabled' => $user->ntfy_topic !== null,
        ]);
    }
}
