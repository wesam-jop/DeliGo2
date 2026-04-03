<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewOrderForDrivers implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Order $order
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to drivers in the same governorate/area
        return [
            new Channel('drivers.governorate.' . $this->order->address->governorate_id),
            new Channel('drivers.area.' . $this->order->address->area_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'order.available';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'order' => [
                'id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'pickup_location' => [
                    'latitude' => $this->order->latitude,
                    'longitude' => $this->order->longitude,
                ],
                'delivery_location' => [
                    'latitude' => $this->order->address->latitude,
                    'longitude' => $this->order->address->longitude,
                    'address_details' => $this->order->address->address_details,
                ],
                'total' => $this->order->total,
            ],
        ];
    }
}
