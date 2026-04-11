<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendBroadcastNotificationChunkJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

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

    public function handle(NotificationService $notificationService): void
    {
        $users = User::query()->whereIn('id', $this->userIds)->get();

        foreach ($users as $user) {
            $notificationService->sendToUser($user, $this->title, $this->message, $this->options);
        }
    }
}
