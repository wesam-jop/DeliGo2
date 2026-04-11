<?php

namespace App\Jobs;

use App\Models\NotificationLog;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RetryFailedNotificationJob implements ShouldQueue
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
     * The number of seconds to wait before retrying the job.
     *
     * @var array<int, int>
     */
    protected array $retryDelays = [
        1 => 60,    // 1 minute
        2 => 300,   // 5 minutes
        3 => 900,   // 15 minutes
    ];

    /**
     * Create a new job instance.
     *
     * @param int $userId User ID to send the notification to
     * @param string $title Notification title
     * @param string $message Notification message
     * @param array $options Notification options
     * @param int $attemptNumber Current attempt number (1-3)
     * @param string|null $channel Channel that failed (whatsapp, push, ntfy)
     * @param string|null $previousError Previous error message
     */
    public function __construct(
        public int $userId,
        public string $title,
        public string $message,
        public array $options = [],
        public int $attemptNumber = 1,
        public ?string $channel = null,
        public ?string $previousError = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(NotificationService $notificationService): void
    {
        $user = User::find($this->userId);

        if (!$user) {
            Log::channel('daily')->error('Retry failed: User not found', [
                'user_id' => $this->userId,
                'attempt' => $this->attemptNumber,
            ]);
            return;
        }

        Log::channel('daily')->info('Retrying notification', [
            'user_id' => $this->userId,
            'attempt' => $this->attemptNumber,
            'channel' => $this->channel,
            'previous_error' => $this->previousError,
        ]);

        // Log the retry attempt
        NotificationLog::create([
            'user_id' => $this->userId,
            'type' => ($this->options['type'] ?? 'notification') . '.retry',
            'entity_type' => 'notification_retry',
            'entity_id' => $this->attemptNumber,
            'sent_at' => now(),
        ]);

        // Retry sending notification
        $success = $notificationService->sendToUser(
            $user,
            $this->title,
            $this->message,
            $this->options
        );

        if ($success) {
            Log::channel('daily')->info('Notification retry succeeded', [
                'user_id' => $this->userId,
                'attempt' => $this->attemptNumber,
                'channel' => $this->channel,
            ]);
        } else {
            Log::channel('daily')->warning('Notification retry failed', [
                'user_id' => $this->userId,
                'attempt' => $this->attemptNumber,
                'channel' => $this->channel,
            ]);

            // If we still have retries left, dispatch another retry job
            if ($this->attemptNumber < 3) {
                $this->dispatchNextRetry($notificationService);
            }
        }
    }

    /**
     * Dispatch the next retry attempt with appropriate delay.
     */
    protected function dispatchNextRetry(NotificationService $notificationService): void
    {
        $nextAttempt = $this->attemptNumber + 1;
        $delay = $this->retryDelays[$nextAttempt] ?? 900; // Default 15 minutes

        self::dispatch(
            $this->userId,
            $this->title,
            $this->message,
            $this->options,
            $nextAttempt,
            $this->channel,
            $this->previousError
        )->delay(now()->addSeconds($delay));

        Log::channel('daily')->info('Scheduled next retry attempt', [
            'user_id' => $this->userId,
            'next_attempt' => $nextAttempt,
            'delay_seconds' => $delay,
        ]);
    }

    /**
     * Calculate delay in seconds for the given attempt.
     */
    public static function getDelayForAttempt(int $attempt): int
    {
        $delays = [
            1 => 60,    // 1 minute
            2 => 300,   // 5 minutes
            3 => 900,   // 15 minutes
        ];

        return $delays[$attempt] ?? 900;
    }

    /**
     * The job failed to process. Handle the failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::channel('daily')->error('Retry notification job permanently failed', [
            'user_id' => $this->userId,
            'attempt' => $this->attemptNumber,
            'error' => $exception->getMessage(),
            'channel' => $this->channel,
        ]);
    }
}
