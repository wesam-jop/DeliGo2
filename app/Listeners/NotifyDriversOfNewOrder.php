<?php

namespace App\Listeners;

use App\Events\NewOrderForDrivers;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyDriversOfNewOrder implements ShouldQueue
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
    public function handle(NewOrderForDrivers $event): void
    {
        $order = $event->order;
        $address = $order->address;

        // إرسال إشعار فردي لكل سائق متاح في المنطقة
        $drivers = User::role('driver')
            ->approved()
            ->where('is_online', true)
            ->where('area_id', $address->area_id)
            ->get();

        foreach ($drivers as $driver) {
            $this->notificationService->sendToUser(
                $driver,
                '📦 طلب جديد متاح',
                "طلب رقم {$order->order_number} من {$address->address_details}\nالمجموع: {$order->total} ل.س",
                [
                    'type' => 'order.available',
                    'click' => url("/orders/available"),
                    'priority' => 4,
                    'meta' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                    ],
                ]
            );
        }
    }
}
