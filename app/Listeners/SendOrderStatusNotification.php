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

        // Notify customer
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

        // Notify driver if assigned
        if ($order->driver && $status !== 'pending') {
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

        // Notify all distinct store owners participating in this order
        $storeOwners = $order->storeSplits
            ->pluck('store.owner')
            ->filter()
            ->unique('id');

        foreach ($storeOwners as $storeOwner) {
            if ($storeOwner->id !== $order->customer_id) {
                $this->notificationService->sendOrderNotification(
                    $storeOwner,
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
        }
    }
}
