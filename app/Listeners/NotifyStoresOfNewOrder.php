<?php

namespace App\Listeners;

use App\Events\NewOrderForDrivers;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyStoresOfNewOrder implements ShouldQueue
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
        $order = $event->order->loadMissing(['storeSplits.store.owner']);

        // Notify each store owner involved in this order
        $storeOwners = $order->storeSplits
            ->pluck('store.owner')
            ->filter()
            ->unique('id');

        foreach ($storeOwners as $storeOwner) {
            if ($storeOwner->id !== $order->customer_id) {
                $this->notificationService->sendOrderNotification(
                    $storeOwner,
                    'pending',
                    $order->order_number,
                    [
                        'type' => 'order.new_for_store',
                        'priority' => 'high',
                        'meta' => [
                            'order_id' => $order->id,
                            'status' => 'pending',
                        ],
                    ]
                );
            }
        }
    }
}
