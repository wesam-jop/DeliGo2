<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderAssignedToDriver implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Order $order,
        public User $driver
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('orders'),
            new Channel('orders.' . $this->order->customer_id),
            new Channel('drivers.' . $this->driver->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'order.assigned';
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
                'customer' => [
                    'name' => $this->order->customer->name,
                    'phone' => $this->order->customer->phone,
                ],
                'address' => [
                    'address_details' => $this->order->address->address_details,
                    'latitude' => $this->order->address->latitude,
                    'longitude' => $this->order->address->longitude,
                ],
                'total' => $this->order->total,
            ],
            'driver_id' => $this->driver->id,
            'assigned_at' => now()->toIso8601String(),
        ];
    }
}
