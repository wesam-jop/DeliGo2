<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverRegistered
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public User $driver;

    /**
     * Create a new event instance.
     */
    public function __construct(User $driver)
    {
        $this->driver = $driver;
    }
}
