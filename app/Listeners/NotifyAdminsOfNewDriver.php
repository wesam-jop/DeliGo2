<?php

namespace App\Listeners;

use App\Events\DriverRegistered;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyAdminsOfNewDriver implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(DriverRegistered $event): void
    {
        $driver = $event->driver;

        // Notify all admins
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            $this->notificationService->sendToUser(
                $admin,
                '🚚 سائق جديد مسجل',
                "تم تسجيل سائق جديد: {$driver->name}",
                [
                    'type' => 'driver.registered',
                    'priority' => 'medium',
                    'click' => "/drivers/{$driver->id}",
                    'meta' => [
                        'driver_id' => $driver->id,
                        'driver_name' => $driver->name,
                    ],
                ]
            );
        }
    }
}
