<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
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
        $order = $event->order->loadMissing(['customer', 'driver', 'storeSplits.store.owner']);
        $status = $event->status;

        // IMPORTANT: Only customer receives ALL order status changes
        // Driver ONLY receives when order is ready for pickup
        // Store owners are NOT notified here (they get notified on new order creation)

        // 1. Always notify customer for ALL status changes
        if ($order->customer) {
            $this->notificationService->sendOrderNotification(
                $order->customer,
                $status,
                $order->order_number,
                [
                    'type' => 'order.status',
                    'meta' => [
                        'order_id' => $order->id,
                        'status' => $status,
                    ],
                ]
            );
        }

        // 2. Notify driver ONLY when order becomes ready for pickup
        // (Driver gets new order availability from NotifyDriversOfNewOrder listener)
        if ($order->driver && $status === 'ready') {
            $this->notificationService->sendOrderNotification(
                $order->driver,
                $status,
                $order->order_number,
                [
                    'type' => 'order.status',
                    'meta' => [
                        'order_id' => $order->id,
                        'status' => $status,
                    ],
                ]
            );
        }

        // 3. Store owners are NOT notified here
        // They receive notification when order is first created (NotifyStoresOfNewOrder)
    }
}
