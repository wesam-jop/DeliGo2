<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class DriverService
{
    /**
     * Register a new driver
     */
    public function registerDriver(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $driver = User::create([
                'name' => $data['name'],
                'phone' => $data['phone'],
                'password' => bcrypt($data['password']),
                'role' => 'driver',
                'profile_image' => $data['profile_image'] ?? null,
                'bike_image' => $data['bike_image'] ?? null,
                'governorate_id' => $data['governorate_id'],
                'area_id' => $data['area_id'],
                'is_approved' => false, // Requires admin approval
            ]);

            return $driver;
        });
    }

    /**
     * Approve driver (admin)
     */
    public function approveDriver(User $driver): bool
    {
        return $driver->update([
            'is_approved' => true,
            'rejection_reason' => null,
        ]);
    }

    /**
     * Reject driver (admin)
     */
    public function rejectDriver(User $driver, string $reason): bool
    {
        return $driver->update([
            'is_approved' => false,
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Toggle driver online status
     */
    public function toggleOnlineStatus(User $driver): bool
    {
        if ($driver->role !== 'driver') {
            throw new \Exception('User is not a driver', 400);
        }

        $driver->update(['is_online' => !$driver->is_online]);
        return $driver->is_online;
    }

    /**
     * Get driver working hours
     */
    public function getDriverHours(User $driver): array
    {
        return $driver->schedules()
            ->orderByRaw("FIELD(day, 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday')")
            ->get()
            ->toArray();
    }

    /**
     * Update driver working hours
     */
    public function updateDriverHours(User $driver, array $schedules): void
    {
        DB::transaction(function () use ($driver, $schedules) {
            // Delete existing schedules
            $driver->schedules()->delete();

            // Create new schedules
            foreach ($schedules as $schedule) {
                $driver->schedules()->create($schedule);
            }
        });
    }

    /**
     * Get available drivers for location
     */
    public function getAvailableDrivers(int $governorateId, int $areaId): array
    {
        $day = strtolower(now()->format('l'));
        $currentTime = now()->format('H:i:s');

        return User::role('driver')
            ->approved()
            ->where('is_online', true)
            ->where('governorate_id', $governorateId)
            ->where('area_id', $areaId)
            ->whereHas('schedules', function ($query) use ($day, $currentTime) {
                $query->where('day', $day)
                    ->where('is_active', true)
                    ->where('from_time', '<=', $currentTime)
                    ->where('to_time', '>=', $currentTime);
            })
            ->with(['governorate', 'area'])
            ->get()
            ->toArray();
    }

    /**
     * Get driver's current orders
     */
    public function getCurrentOrders(User $driver): array
    {
        return $driver->deliveredOrders()
            ->active()
            ->with(['customer', 'address', 'items', 'storeSplits'])
            ->get()
            ->toArray();
    }

    /**
     * Get driver's order history
     */
    public function getOrderHistory(User $driver): array
    {
        return $driver->deliveredOrders()
            ->where('status', \App\Models\Order::STATUS_DELIVERED)
            ->with(['customer', 'address', 'items'])
            ->latest()
            ->get()
            ->toArray();
    }
}
