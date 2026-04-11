<?php

namespace App\Jobs;

use App\Models\NotificationGroup;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DispatchNotificationGroupJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Create a new job instance.
     *
     * @param int $userId User ID to send the grouped notification to
     * @param string $type Notification type (e.g., 'order.created')
     * @param string|null $entityType Entity type (e.g., 'order')
     */
    public function __construct(
        public int $userId,
        public string $type,
        public ?string $entityType = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(NotificationService $notificationService): void
    {
        // Get the notification group
        $group = NotificationGroup::forUserAndType($this->userId, $this->type, $this->entityType)
            ->where('is_dispatched', false)
            ->first();

        if (!$group) {
            Log::channel('daily')->warning('Notification group not found for dispatch', [
                'user_id' => $this->userId,
                'type' => $this->type,
                'entity_type' => $this->entityType,
            ]);
            return;
        }

        // Check if group has expired
        if ($group->isExpired()) {
            Log::channel('daily')->info('Notification group expired, dispatching anyway', [
                'group_id' => $group->id,
                'user_id' => $this->userId,
                'count' => $group->count,
            ]);
        }

        Log::channel('daily')->info('Dispatching notification group', [
            'group_id' => $group->id,
            'user_id' => $this->userId,
            'type' => $this->type,
            'count' => $group->count,
            'last_entity_id' => $group->last_entity_id,
        ]);

        // Dispatch the grouped notification
        $success = $notificationService->dispatchGroupedNotification(
            $this->userId,
            $this->type,
            $this->entityType
        );

        if ($success) {
            Log::channel('daily')->info('Notification group dispatched successfully', [
                'group_id' => $group->id,
                'count' => $group->count,
            ]);
        } else {
            Log::channel('daily')->error('Failed to dispatch notification group', [
                'group_id' => $group->id,
                'user_id' => $this->userId,
            ]);
        }
    }

    /**
     * The job failed to process.
     */
    public function failed(\Throwable $exception): void
    {
        Log::channel('daily')->error('Dispatch notification group job failed', [
            'user_id' => $this->userId,
            'type' => $this->type,
            'error' => $exception->getMessage(),
        ]);
    }
}
