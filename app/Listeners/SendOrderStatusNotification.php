<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendOrderStatusNotification implements ShouldQueue
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
    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order;
        $status = $event->status;

        // Notify customer
        $this->notificationService->sendOrderNotification(
            $order->customer,
            $status,
            $order->order_number
        );

        // Notify driver if assigned
        if ($order->driver_id && $status !== 'pending') {
            $this->notificationService->sendOrderNotification(
                $order->driver,
                $status,
                $order->order_number
            );
        }

        // Notify store owner
        if ($order->storeSplits()->exists()) {
            $storeOwner = $order->storeSplits->first()?->store?->owner;
            if ($storeOwner) {
                $this->notificationService->sendOrderNotification(
                    $storeOwner,
                    $status,
                    $order->order_number
                );
            }
        }
    }
}
