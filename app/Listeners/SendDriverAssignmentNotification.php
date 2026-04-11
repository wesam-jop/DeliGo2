<?php

namespace App\Listeners;

use App\Events\OrderAssignedToDriver;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendDriverAssignmentNotification implements ShouldQueue
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
    public function handle(OrderAssignedToDriver $event): void
    {
        $order = $event->order;
        $driver = $event->driver;

        $pickupLocation = $order->storeSplits->first()?->store?->name ?? 'المتجر';
        $deliveryLocation = $order->address?->address_details ?? 'العنوان المحدد';

        // Send notification to the assigned driver
        $this->notificationService->sendToUser(
            $driver,
            '🚗 طلب جديد مُخصص لك',
            "طلب رقم #{$order->order_number}\nالاستلام: {$pickupLocation}\nالتوصيل: {$deliveryLocation}\nالإجمالي: {$order->total}",
            [
                'type' => 'order.assigned',
                'click' => url("/orders/{$order->id}"),
                'priority' => 5,
                'meta' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ],
            ]
        );
    }
}
