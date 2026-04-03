<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'phone' => $this->phone,
            'phone_verified_at' => $this->phone_verified_at,
            'email' => $this->email,
            'role' => $this->role,
            'profile_image' => $this->profile_image,
            'is_approved' => $this->is_approved,
            'is_online' => $this->is_online,
            'governorate' => $this->whenLoaded('governorate'),
            'area' => $this->whenLoaded('area'),
            'created_at' => $this->created_at,
        ];
    }
}
