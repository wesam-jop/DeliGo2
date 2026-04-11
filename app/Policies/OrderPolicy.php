<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Determine if the user can view the order.
     */
    public function view(User $user, Order $order): bool
    {
        // Customer who placed the order
        if ($order->customer_id === $user->id) {
            return true;
        }

        // Assigned driver
        if ($order->driver_id === $user->id) {
            return true;
        }

        // Store owners involved in the order
        $order->loadMissing('storeSplits.store');
        foreach ($order->storeSplits as $split) {
            if ($split->store && $split->store->owner_id === $user->id) {
                return true;
            }
        }

        // Admin can view all orders
        if ($user->isAdmin()) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can update the order.
     */
    public function update(User $user, Order $order): bool
    {
        // Store owners can update their part
        $order->loadMissing('storeSplits.store');
        foreach ($order->storeSplits as $split) {
            if ($split->store && $split->store->owner_id === $user->id) {
                return true;
            }
        }

        // Assigned driver can update
        if ($order->driver_id === $user->id) {
            return true;
        }

        // Admin can update all orders
        if ($user->isAdmin()) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can cancel the order.
     */
    public function cancel(User $user, Order $order): bool
    {
        // Customer can cancel their own order (before certain status)
        if ($order->customer_id === $user->id && $order->canBeCancelled()) {
            return true;
        }

        // Admin can cancel any order
        if ($user->isAdmin()) {
            return true;
        }

        return false;
    }
}
