<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StoreRegistered
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public User $storeOwner;

    /**
     * Create a new event instance.
     */
    public function __construct(User $storeOwner)
    {
        $this->storeOwner = $storeOwner;
    }
}
