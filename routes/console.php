<?php

use App\Services\NotificationService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('notifications:scheduled-broadcast', function (NotificationService $notificationService) {
    $cfg = config('broadcast_reminders.scheduled');

    if (!($cfg['enabled'] ?? false)) {
        $this->comment('Scheduled broadcast is disabled. Set SCHEDULED_BROADCAST_ENABLED=true in .env.');

        return 0;
    }

    $chunks = $notificationService->queueBroadcastToUsers(
        (string) $cfg['title'],
        (string) $cfg['message'],
        [
            'role' => $cfg['role'],
            'exclude_admin' => true,
            'skip_whatsapp' => true,
            'skip_ntfy' => false,
            'meta' => [
                'source' => 'scheduled_broadcast',
            ],
        ]
    );

    $this->info("Queued {$chunks} broadcast chunk job(s). Run queue workers to deliver.");

    return 0;
})->purpose('Queue the configured scheduled broadcast (e.g. lunch reminder)');

Schedule::command('notifications:scheduled-broadcast')
    ->dailyAt((string) config('broadcast_reminders.scheduled.time', '12:00'))
    ->timezone(config('app.timezone'))
    ->when(fn () => (bool) config('broadcast_reminders.scheduled.enabled', false));
