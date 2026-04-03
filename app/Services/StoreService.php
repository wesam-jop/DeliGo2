<?php

namespace App\Services;

use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StoreService
{
    /**
     * Create a new store
     */
    public function createStore(array $data, User $owner): Store
    {
        return DB::transaction(function () use ($data, $owner) {
            $imagePath = $data['image'] ?? null;
            if ($imagePath instanceof \Illuminate\Http\UploadedFile) {
                $imagePath = $imagePath->store('stores', 'public');
            }

            $store = Store::create([
                'owner_id' => $owner->id,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'category_id' => $data['category_id'] ?? null,
                'image' => $imagePath,
                'phone' => $data['phone'],
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'governorate_id' => $data['governorate_id'],
                'area_id' => $data['area_id'],
                'address_details' => $data['address_details'] ?? null,
                'is_approved' => false, // Requires admin approval
            ]);

            return $store;
        });
    }

    /**
     * Update store
     */
    public function updateStore(Store $store, array $data): Store
    {
        if (isset($data['image']) && $data['image'] instanceof \Illuminate\Http\UploadedFile) {
            $data['image'] = $data['image']->store('stores', 'public');
        }
        $store->update($data);
        return $store->fresh();
    }

    /**
     * Approve store (admin)
     */
    public function approveStore(Store $store): bool
    {
        return $store->update([
            'is_approved' => true,
            'rejection_reason' => null,
        ]);
    }

    /**
     * Reject store (admin)
     */
    public function rejectStore(Store $store, string $reason): bool
    {
        return $store->update([
            'is_approved' => false,
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Get stores near a location
     */
    public function getStoresNearby(float $latitude, float $longitude, float $radiusKm = 5): array
    {
        $stores = Store::approved()
            ->active()
            ->get()
            ->filter(function ($store) use ($latitude, $longitude, $radiusKm) {
                if (!$store->latitude || !$store->longitude) {
                    return false;
                }
                return $store->getDistanceFrom($latitude, $longitude) <= $radiusKm;
            })
            ->values()
            ->toArray();

        return $stores;
    }

    /**
     * Get stores by governorate and area
     */
    public function getStoresByLocation(int $governorateId, int $areaId): array
    {
        return Store::approved()
            ->active()
            ->where('governorate_id', $governorateId)
            ->where('area_id', $areaId)
            ->with(['area', 'governorate'])
            ->get()
            ->toArray();
    }

    /**
     * Toggle store active status
     */
    public function toggleStoreStatus(Store $store): bool
    {
        $store->update(['is_active' => !$store->is_active]);
        return $store->is_active;
    }

    /**
     * Get store working hours
     */
    public function getStoreHours(Store $store): array
    {
        return $store->schedules()
            ->orderByRaw("FIELD(day, 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday')")
            ->get()
            ->toArray();
    }

    /**
     * Update store working hours
     */
    public function updateStoreHours(Store $store, array $schedules): void
    {
        DB::transaction(function () use ($store, $schedules) {
            // Delete existing schedules
            $store->schedules()->delete();

            // Create new schedules
            foreach ($schedules as $schedule) {
                $store->schedules()->create($schedule);
            }
        });
    }
}
