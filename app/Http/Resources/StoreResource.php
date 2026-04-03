<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category,
            'image' => $this->image,
            'phone' => $this->phone,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'address_details' => $this->address_details,
            'is_approved' => $this->is_approved,
            'is_active' => $this->is_active,
            'is_open_now' => $this->isOpenNow(),
            'governorate' => new GovernorateResource($this->whenLoaded('governorate')),
            'area' => new AreaResource($this->whenLoaded('area')),
            'owner' => new UserResource($this->whenLoaded('owner')),
            'products' => ProductResource::collection($this->whenLoaded('products')),
            'created_at' => $this->created_at,
        ];
    }
}
