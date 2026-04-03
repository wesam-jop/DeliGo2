<?php

namespace App\Http\Controllers\Api;

use App\Models\Area;
use App\Models\Governorate;
use Illuminate\Http\JsonResponse;

class LocationController extends ApiController
{
    /**
     * Get all governorates
     */
    public function governorates(): JsonResponse
    {
        $governorates = Governorate::active()
            ->orderBy('name_en')
            ->get();

        return $this->success($governorates);
    }

    /**
     * Get governorate by ID with areas
     */
    public function governorate(Governorate $governorate): JsonResponse
    {
        if (!$governorate->is_active) {
            return $this->error('Governorate not found', 404);
        }

        $governorate->load(['areas' => function ($query) {
            $query->active()->orderBy('name_en');
        }]);

        return $this->success($governorate);
    }

    /**
     * Get areas by governorate
     */
    public function areas(int $governorateId): JsonResponse
    {
        $areas = Area::where('governorate_id', $governorateId)
            ->active()
            ->orderBy('name_en')
            ->get();

        return $this->success($areas);
    }

    /**
     * Get area by ID
     */
    public function area(Area $area): JsonResponse
    {
        if (!$area->is_active) {
            return $this->error('Area not found', 404);
        }

        $area->load('governorate');

        return $this->success($area);
    }
}
