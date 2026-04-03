<?php

namespace App\Listeners;

use App\Events\NewOrderForDrivers;
use App\Models\Order;
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

        // Send notification to drivers in the area
        $topic = "drivers.area.{$address->area_id}";

        $this->notificationService->sendNewOrderToDrivers(
            $topic,
            $order->order_number,
            $address->address_details,
            $order->total
        );
    }
}
