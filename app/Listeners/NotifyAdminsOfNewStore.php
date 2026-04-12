<?php

namespace App\Listeners;

use App\Events\StoreRegistered;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyAdminsOfNewStore implements ShouldQueue
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
    public function handle(StoreRegistered $event): void
    {
        $storeOwner = $event->storeOwner;

        // Notify all admins
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            $this->notificationService->sendToUser(
                $admin,
                '🏪 متجر جديد مسجل',
                "تم تسجيل متجر جديد: {$storeOwner->name}",
                [
                    'type' => 'store.registered',
                    'priority' => 'medium',
                    'click' => "/stores/{$storeOwner->id}",
                    'meta' => [
                        'store_owner_id' => $storeOwner->id,
                        'store_owner_name' => $storeOwner->name,
                    ],
                ]
            );
        }
    }
}
