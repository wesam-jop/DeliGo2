<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendBroadcastNotificationChunkJob implements ShouldQueue
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
     * @param  array<int>  $userIds
     * @param  array<string, mixed>  $options  Passed to NotificationService::sendToUser (may include skip_whatsapp, etc.)
     */
    public function __construct(
        public array $userIds,
        public string $title,
        public string $message,
        public array $options = []
    ) {}

    /**
     * Execute the job.
     */
    public function handle(NotificationService $notificationService): void
    {
        $users = User::query()->whereIn('id', $this->userIds)->get();

        $sentCount = 0;
        $failedCount = 0;

        foreach ($users as $user) {
            try {
                $success = $notificationService->sendToUser(
                    $user,
                    $this->title,
                    $this->message,
                    $this->options
                );

                if ($success) {
                    $sentCount++;
                } else {
                    $failedCount++;
                    
                    Log::channel('daily')->warning('Broadcast notification failed for user', [
                        'user_id' => $user->id,
                        'title' => $this->title,
                    ]);
                }
            } catch (\Exception $e) {
                $failedCount++;
                
                Log::channel('daily')->error('Broadcast notification exception for user', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::channel('daily')->info('Broadcast chunk completed', [
            'total' => count($this->userIds),
            'sent' => $sentCount,
            'failed' => $failedCount,
        ]);
    }

    /**
     * The job failed to process.
     */
    public function failed(\Throwable $exception): void
    {
        Log::channel('daily')->error('Broadcast notification chunk job failed', [
            'user_ids' => $this->userIds,
            'title' => $this->title,
            'error' => $exception->getMessage(),
        ]);
    }
}
